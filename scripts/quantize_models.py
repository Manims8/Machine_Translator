"""Create and validate dynamic INT8 copies of the local IndicTrans2 ONNX models.

Originals under models/indictrans2 are read-only inputs. All generated files and
reports are written beneath models/quantized. Run with the project .venv Python.
"""
from __future__ import annotations

import hashlib
import json
import logging
import shutil
import sys
import threading
import time
from pathlib import Path

import onnx
import onnxruntime as ort
import psutil
from onnx.external_data_helper import uses_external_data
from onnxruntime.quantization import QuantType, quantize_dynamic


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "models" / "indictrans2"
OUTPUT_ROOT = ROOT / "models" / "quantized"
MODEL_DIRS = (
    "en-indic-200m-fp32",
    "indic-en-200m-fp32",
    "indic-indic-320m-fp32",
)
GRAPH_NAMES = ("encoder_model.onnx", "decoder_model.onnx", "decoder_with_past_model.onnx")
COPY_PREFIXES = ("tokenizer", "config", "generation_config", "special_tokens_map")
QUANTIZER_WARNINGS: list[str] = []
PRELIMINARY_ATTEMPT = {
    "status": "failed, then resolved",
    "graphs_failed": 9,
    "error": "RuntimeError: Unable to find data type for weight_name ending in MatMul_output_0; shape_inference failed to return a type.",
    "recovery": "Set extra_options={DefaultTensorType: onnx.TensorProto.FLOAT}; the final conversion and CPU graph loads succeeded.",
}


class WarningCollector(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        QUANTIZER_WARNINGS.append(self.format(record))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def graph_sidecars(path: Path) -> list[str]:
    model = onnx.load(str(path), load_external_data=False)
    names = set()
    for tensor in model.graph.initializer:
        if uses_external_data(tensor):
            location = next((item.value for item in tensor.external_data if item.key == "location"), None)
            if location:
                names.add(location)
    return sorted(names)


def external_tensors(path: Path) -> dict[str, tuple[str, int, int, tuple[int, ...], int]]:
    model = onnx.load(str(path), load_external_data=False)
    tensors = {}
    for tensor in model.graph.initializer:
        if not uses_external_data(tensor):
            continue
        fields = {item.key: item.value for item in tensor.external_data}
        location = fields.get("location")
        if location:
            tensors[tensor.name] = (
                location,
                int(fields.get("offset", "0")),
                int(fields.get("length", "0")),
                tuple(tensor.dims),
                tensor.data_type,
            )
    return tensors


def same_external_bytes(root: Path, left: tuple, right: tuple) -> bool:
    if left[3:] != right[3:] or left[2] != right[2]:
        return False
    def digest(item: tuple) -> str:
        value = hashlib.sha256()
        with (root / item[0]).open("rb") as stream:
            stream.seek(item[1])
            remaining = item[2]
            while remaining:
                chunk = stream.read(min(8 * 1024 * 1024, remaining))
                if not chunk:
                    return "truncated"
                value.update(chunk)
                remaining -= len(chunk)
        return value.hexdigest()
    return digest(left) == digest(right)


def decoder_sharing_report(root: Path) -> dict:
    decoder = external_tensors(root / "decoder_model.onnx")
    with_past = external_tensors(root / "decoder_with_past_model.onnx")
    common_names = set(decoder) & set(with_past)
    identical = [
        name for name in common_names
        if same_external_bytes(root, decoder[name], with_past[name])
    ]
    return {
        "common_external_tensor_names": len(common_names),
        "byte_identical_tensors_in_separate_files": len(identical),
        "duplicated_bytes_that_could_be_shared": sum(decoder[name][2] for name in identical),
    }


def monitor_load(path: Path) -> dict:
    process = psutil.Process()
    baseline = process.memory_info().rss
    peak = [baseline]
    stop = threading.Event()

    def sample() -> None:
        while not stop.is_set():
            try:
                peak[0] = max(peak[0], process.memory_info().rss)
            except psutil.Error:
                return
            stop.wait(0.02)

    sampler = threading.Thread(target=sample, daemon=True)
    sampler.start()
    started = time.perf_counter()
    session = None
    error = None
    try:
        session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
        providers = session.get_providers()
    except Exception as exc:  # record errors and continue to the next graph
        providers = []
        error = f"{type(exc).__name__}: {exc}"
    finally:
        elapsed = time.perf_counter() - started
        try:
            peak[0] = max(peak[0], process.memory_info().rss)
        except psutil.Error:
            pass
        stop.set()
        sampler.join()
        if session is not None:
            del session
    return {
        "load_seconds": elapsed,
        "providers": providers,
        "baseline_rss_bytes": baseline,
        "peak_rss_bytes": peak[0],
        "peak_rss_delta_bytes": max(0, peak[0] - baseline),
        "error": error,
    }


def quantize_one_model(folder: str) -> dict:
    source = SOURCE_ROOT / folder
    destination = OUTPUT_ROOT / folder
    destination.mkdir(parents=True, exist_ok=True)
    failures: list[dict] = []

    # ORT can leave old bytes in an external-data file on repeat runs. Remove
    # only the fixed graph and sidecar names generated by this script, here.
    for generated_name in (*GRAPH_NAMES, *(f"{name}.data" for name in GRAPH_NAMES), "decoder_shared.onnx.data"):
        stale = destination / generated_name
        if stale.is_file() and stale.parent.resolve() == destination.resolve():
            stale.unlink()

    graph_inputs = {name: source / name for name in GRAPH_NAMES}
    source_sidecars: set[str] = set()
    graph_map = {}
    for name, path in graph_inputs.items():
        if not path.is_file():
            failures.append({"file": name, "stage": "input", "error": "graph is missing"})
            continue
        refs = graph_sidecars(path)
        graph_map[name] = refs
        source_sidecars.update(refs)

    for name in GRAPH_NAMES:
        input_path = graph_inputs[name]
        if not input_path.is_file():
            continue
        output_path = destination / name
        try:
            quantize_dynamic(
                str(input_path),
                str(output_path),
                weight_type=QuantType.QInt8,
                use_external_data_format=True,
                extra_options={"DefaultTensorType": onnx.TensorProto.FLOAT},
            )
        except Exception as exc:
            failures.append({"file": name, "stage": "quantize", "error": f"{type(exc).__name__}: {exc}"})

    copied = []
    for item in source.iterdir():
        if item.is_file() and item.name.startswith(COPY_PREFIXES) and not item.name.endswith((".onnx", ".onnx.data")):
            target = destination / item.name
            try:
                shutil.copy2(item, target)
                if sha256(item) != sha256(target):
                    raise IOError("copied file SHA-256 does not match source")
                copied.append(item.name)
            except Exception as exc:
                failures.append({"file": item.name, "stage": "copy", "error": f"{type(exc).__name__}: {exc}"})

    validation = {}
    for name in GRAPH_NAMES:
        target = destination / name
        if target.is_file():
            validation[name] = monitor_load(target)
            if validation[name]["error"]:
                failures.append({"file": name, "stage": "CPU load", "error": validation[name]["error"]})

    sharing = {}
    if all((destination / name).is_file() for name in ("decoder_model.onnx", "decoder_with_past_model.onnx")):
        try:
            sharing = decoder_sharing_report(destination)
        except Exception as exc:
            failures.append({"file": "decoder graphs", "stage": "shared tensor comparison", "error": f"{type(exc).__name__}: {exc}"})

    source_graph_bytes = sum(p.stat().st_size for p in graph_inputs.values() if p.is_file())
    source_sidecar_bytes = sum((source / name).stat().st_size for name in source_sidecars if (source / name).is_file())
    source_copy_bytes = sum((source / name).stat().st_size for name in copied if (source / name).is_file())
    source_file_rows = []
    for name, path in graph_inputs.items():
        source_file_rows.append({
            "file": name,
            "kind": "graph",
            "fp32_bytes": path.stat().st_size if path.is_file() else None,
            "int8_bytes": (destination / name).stat().st_size if (destination / name).is_file() else None,
            "fp32_sidecars": graph_map.get(name, []),
            "int8_external_files": [],
        })

    output_graph_sidecars: set[str] = set()
    for name in GRAPH_NAMES:
        path = destination / name
        if path.is_file():
            try:
                output_graph_sidecars.update(graph_sidecars(path))
            except Exception as exc:
                failures.append({"file": name, "stage": "inspect INT8 sidecars", "error": f"{type(exc).__name__}: {exc}"})
    for row in source_file_rows:
        out = destination / row["file"]
        if out.is_file():
            row["int8_external_files"] = graph_sidecars(out)
    for name in sorted(source_sidecars):
        source_path = source / name
        consuming_graphs = [graph for graph, refs in graph_map.items() if name in refs]
        quantized_files = sorted({
            sidecar
            for graph in consuming_graphs
            for sidecar in (graph_sidecars(destination / graph) if (destination / graph).is_file() else [])
        })
        output_size = sum((destination / sidecar).stat().st_size for sidecar in quantized_files if (destination / sidecar).is_file())
        source_file_rows.append({
            "file": f"{name} (used by {', '.join(consuming_graphs)})",
            "kind": "sidecar",
            "fp32_bytes": source_path.stat().st_size if source_path.is_file() else 0,
            "int8_bytes": output_size,
            "fp32_sidecars": [name],
            "int8_external_files": quantized_files,
        })
    for name in copied:
        source_file_rows.append({
            "file": name,
            "kind": "copied config/tokenizer",
            "fp32_bytes": (source / name).stat().st_size,
            "int8_bytes": (destination / name).stat().st_size,
            "sha256_unchanged": sha256(source / name) == sha256(destination / name),
        })

    actual_int8_bytes = sum(path.stat().st_size for path in destination.rglob("*") if path.is_file())
    source_total = source_graph_bytes + source_sidecar_bytes + source_copy_bytes
    complete_graph_set = all((destination / name).is_file() for name in GRAPH_NAMES)
    return {
        "model": folder,
        "source_graphs": graph_map,
        "copied_files": copied,
        "files": source_file_rows,
        "source_total_bytes": source_total,
        "int8_total_bytes": actual_int8_bytes,
        "complete_graph_set": complete_graph_set,
        "ratio": actual_int8_bytes / source_total if source_total and complete_graph_set and not failures else None,
        "reduction_percent": (1 - actual_int8_bytes / source_total) * 100 if source_total and complete_graph_set and not failures else None,
        "cpu_loads": validation,
        "errors": failures,
        "decoder_graphs_shared_input_sidecar": graph_map.get("decoder_model.onnx", []) == graph_map.get("decoder_with_past_model.onnx", []),
        "quantized_decoder_sharing": sharing,
    }


def human_size(size: int | None) -> str:
    if size is None:
        return "n/a"
    if size < 1_000_000:
        return f"{size:,} B"
    if size < 1_000_000_000:
        return f"{size / 1_000_000:.3f} MB"
    return f"{size / 1_000_000_000:.3f} GB"


def main() -> int:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    previous_report = OUTPUT_ROOT / "quantization_report.json"
    if "--report-only" in sys.argv:
        prior = json.loads(previous_report.read_text(encoding="utf-8"))
        results = prior["models"]
        QUANTIZER_WARNINGS.extend(prior.get("quantizer_warnings", []))
    else:
        warning_handler = WarningCollector(level=logging.WARNING)
        logging.getLogger().addHandler(warning_handler)
        results = [quantize_one_model(folder) for folder in MODEL_DIRS]
        logging.getLogger().removeHandler(warning_handler)
    if "--report-only" in sys.argv:
        for model in results:
            try:
                model["quantized_decoder_sharing"] = decoder_sharing_report(OUTPUT_ROOT / model["model"])
            except Exception as exc:
                model.setdefault("errors", []).append({
                    "file": "decoder graphs",
                    "stage": "shared tensor comparison",
                    "error": f"{type(exc).__name__}: {exc}",
                })
    source_total = sum(item["source_total_bytes"] for item in results)
    int8_total = sum(item["int8_total_bytes"] for item in results)
    report = {
        "onnxruntime_version": ort.__version__,
        "onnx_version": onnx.__version__,
        "psutil_version": psutil.__version__,
        "weight_type": "QInt8",
        "method": "onnxruntime.quantization.quantize_dynamic; use_external_data_format=True",
        "preliminary_attempt": PRELIMINARY_ATTEMPT,
        "quantizer_warnings": QUANTIZER_WARNINGS,
        "source_total_bytes": source_total,
        "int8_total_bytes": int8_total,
        "grand_ratio": int8_total / source_total if source_total else None,
        "models": results,
    }
    (OUTPUT_ROOT / "quantization_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (OUTPUT_ROOT / "quantizer_warnings.log").write_text("\n".join(QUANTIZER_WARNINGS) + ("\n" if QUANTIZER_WARNINGS else ""), encoding="utf-8")
    (OUTPUT_ROOT / "quantization_errors.log").write_text(
        "Preliminary conversion without DefaultTensorType: 9/9 graphs failed with:\n"
        f"{PRELIMINARY_ATTEMPT['error']}\n"
        f"Recovery: {PRELIMINARY_ATTEMPT['recovery']}\n"
        "Final pass: no fatal quantization or CPU graph-load errors.\n",
        encoding="utf-8",
    )
    lines = [
        "# IndicTrans2 INT8 quantization experiment",
        "",
        f"Runtime versions: ONNX Runtime {ort.__version__}; ONNX {onnx.__version__}; psutil {psutil.__version__}.",
        "Quantizer: dynamic QInt8 weights, external-data output enabled.",
        "",
        "| Model | File | FP32 size | INT8 size | INT8/FP32 |",
        "|---|---|---:|---:|---:|",
    ]
    for model in results:
        for row in model["files"]:
            before, after = row.get("fp32_bytes"), row.get("int8_bytes")
            ratio = f"{after / before:.3f}" if before and after is not None and after > 0 else "n/a"
            after_size = human_size(after) if after is not None and after > 0 else "not produced"
            lines.append(f"| {model['model']} | {row['file']} ({row['kind']}) | {human_size(before)} | {after_size} | {ratio} |")
        model_ratio = f"{model['ratio']:.3f}" if model["ratio"] is not None else "incomplete"
        lines.append(f"| **{model['model']} total** | all graphs, unique sidecars, copied config/tokenizer | **{human_size(model['source_total_bytes'])}** | **{human_size(model['int8_total_bytes'])}** | **{model_ratio}** |")
    lines.extend([
        "",
        f"**Grand total:** FP32 {human_size(source_total)}; generated output {human_size(int8_total)}; INT8/FP32 {int8_total / source_total:.3f} only if all graph conversions succeeded, otherwise incomplete.",
        "",
        "## CPU graph load measurements",
        "",
        "Peak RSS is sampled with psutil every 20 ms during each graph load; delta is relative to that sample's pre-load process RSS. It is a sampled process-level measurement, not a guaranteed instantaneous maximum.",
        "",
        "| Model / graph | Load seconds | Peak RSS | Peak increase | Providers | Result |",
        "|---|---:|---:|---:|---|---|",
    ])
    for model in results:
        for graph, load in model["cpu_loads"].items():
            state = f"ERROR: {load['error']}" if load["error"] else "loaded"
            lines.append(f"| {model['model']} / {graph} | {load['load_seconds']:.2f} | {human_size(load['peak_rss_bytes'])} | {human_size(load['peak_rss_delta_bytes'])} | {', '.join(load['providers']) or '—'} | {state} |")
    lines.extend(["", "## Errors", ""])
    errors = [(model["model"], error) for model in results for error in model["errors"]]
    if errors:
        lines.extend(f"- `{model}` `{error['stage']}` `{error['file']}`: {error['error']}" for model, error in errors)
    else:
        lines.append("No fatal errors in the final pass.")
    lines.append("An initial attempt without `DefaultTensorType` failed on all nine graphs: shape inference could not determine a MatMul input type (`MatMul_output_0`). Retrying with `DefaultTensorType=FLOAT`, as suggested by the exception, succeeded. See `quantization_errors.log`.")
    lines.extend(["", f"## Quantizer warnings ({len(QUANTIZER_WARNINGS)} logged)", ""])
    if QUANTIZER_WARNINGS:
        lines.append("These warnings did not stop graph creation or CPU session loading. Full warning log: `quantizer_warnings.log`.")
        lines.extend(f"- {warning}" for warning in sorted(set(QUANTIZER_WARNINGS)))
    else:
        lines.append("None.")
    lines.extend([
        "",
        "## Shared decoder sidecar observation",
        "",
    ])
    for model in results:
        dec_a = next((row for row in model["files"] if row["file"] == "decoder_model.onnx"), {})
        dec_b = next((row for row in model["files"] if row["file"] == "decoder_with_past_model.onnx"), {})
        refs_a, refs_b = dec_a.get("int8_external_files", []), dec_b.get("int8_external_files", [])
        duplicated = bool(refs_a and refs_b and set(refs_a).isdisjoint(refs_b))
        sharing = model.get("quantized_decoder_sharing", {})
        lines.append(f"- `{model['model']}`: input decoder graphs share sidecar = `{model['decoder_graphs_shared_input_sidecar']}`; quantized external files are `{refs_a}` and `{refs_b}`; separate output files = `{duplicated}`. Found {sharing.get('byte_identical_tensors_in_separate_files', 0)} byte-identical tensors across separate output files, duplicating {human_size(sharing.get('duplicated_bytes_that_could_be_shared', 0))}. Output totals include both copies.")
    lines.extend([
        "",
        "The quantized decoder graphs are emitted independently. The byte-identical tensor count is based on initializer name, dimensions, type, and SHA-256 of the referenced data range. A shared output-data-file strategy could save the measured duplicated bytes, but would require rewriting external-data locations/offsets and rechecking sessions; it is not implemented here.",
        "",
    ])
    (OUTPUT_ROOT / "quantization_report.md").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
