from __future__ import annotations

import gc
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "models" / "indictrans2"
MANIFEST_PATH = BASE / "model_manifest.json"
GRAPH_FILES = [
    "encoder_model.onnx",
    "decoder_model.onnx",
    "decoder_with_past_model.onnx",
]
SIDECAR_FILES = ["encoder_model.onnx.data", "decoder_shared.onnx.data"]
TOKENIZER_FILES = ["tokenizer_src.json", "tokenizer_tgt.json", "tokenizer_meta.json"]
JSON_FILES = [*TOKENIZER_FILES, "config.json", "generation_config.json"]
REPO_META = {
    "hari31416/indictrans2-en-indic-dist-200M-ONNX": (
        "English to Indic",
        "200M",
        ["eng_Latn"],
        ["tam_Taml", "kan_Knda"],
    ),
    "hari31416/indictrans2-indic-en-dist-200M-ONNX": (
        "Indic to English",
        "200M",
        ["tam_Taml", "kan_Knda"],
        ["eng_Latn"],
    ),
    "hari31416/indictrans2-indic-indic-dist-320M-ONNX": (
        "Indic to Indic",
        "320M",
        ["tam_Taml", "kan_Knda"],
        ["tam_Taml", "kan_Knda"],
    ),
}


def verify_graph(path: Path) -> tuple[bool, str]:
    try:
        import onnxruntime as ort

        session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
        providers = session.get_providers()
        del session
        gc.collect()
        return True, f"loaded ({', '.join(providers)})"
    except Exception as exc:
        gc.collect()
        return False, f"{type(exc).__name__}: {exc}"


def main() -> int:
    try:
        import onnxruntime as ort

        print(
            f"ONNX Runtime {ort.__version__}; providers: {ort.get_available_providers()}"
        )
    except Exception as exc:
        print(f"ONNX Runtime unavailable: {exc}", file=sys.stderr)
        return 2

    failures = []
    records = []
    try:
        previous_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        previous_records = {
            item.get("repo_id"): item for item in previous_manifest.get("models", [])
        }
    except (OSError, json.JSONDecodeError):
        previous_records = {}
    for repo_id, (name, parameters, sources, targets) in REPO_META.items():
        model_dir = (
            BASE
            / {
                "hari31416/indictrans2-en-indic-dist-200M-ONNX": "en-indic-200m-fp32",
                "hari31416/indictrans2-indic-en-dist-200M-ONNX": "indic-en-200m-fp32",
                "hari31416/indictrans2-indic-indic-dist-320M-ONNX": "indic-indic-320m-fp32",
            }[repo_id]
        )
        print(f"\n{name}: {model_dir}")
        missing = []
        for filename in (
            GRAPH_FILES
            + SIDECAR_FILES
            + TOKENIZER_FILES
            + ["config.json", "generation_config.json"]
        ):
            path = model_dir / filename
            if not path.is_file() or path.stat().st_size == 0:
                missing.append(filename)
                print(f"  MISSING/EMPTY {filename}")
            elif filename.endswith(".json"):
                try:
                    json.loads(path.read_text(encoding="utf-8-sig"))
                    print(f"  valid JSON {filename} ({path.stat().st_size:,} bytes)")
                except Exception as exc:
                    missing.append(filename)
                    print(f"  INVALID JSON {filename}: {exc}")
            else:
                print(f"  present {filename} ({path.stat().st_size:,} bytes)")
        graph_results = {}
        for filename in GRAPH_FILES:
            path = model_dir / filename
            if path.is_file() and path.stat().st_size:
                ok, detail = verify_graph(path)
                graph_results[filename] = {"ok": ok, "detail": detail}
                print(f"  ONNX {filename}: {detail}")
                if not ok:
                    missing.append(filename + " (runtime load failed)")
            else:
                graph_results[filename] = {"ok": False, "detail": "missing or empty"}
        status = "passed" if not missing else "failed"
        if missing:
            failures.extend(f"{repo_id}: {item}" for item in missing)
        size = (
            sum(path.stat().st_size for path in model_dir.rglob("*") if path.is_file())
            if model_dir.exists()
            else 0
        )
        records.append(
            {
                "name": name,
                "repo_id": repo_id,
                "direction": name,
                "base_model_parameter_size": parameters,
                "model_format": "ONNX",
                "precision": "FP32",
                "local_dir": str(model_dir.relative_to(ROOT)).replace("\\", "/"),
                "source_languages": sources,
                "target_languages": targets,
                "required_graph_files": GRAPH_FILES,
                "required_sidecar_files": SIDECAR_FILES,
                "tokenizer_files": TOKENIZER_FILES,
                "download_status": previous_records.get(repo_id, {}).get(
                    "download_status", "unknown"
                ),
                "verification_status": status,
                "graph_load_results": graph_results,
                "size_bytes": size,
            }
        )

    BASE.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps({"project": "TriLingua", "models": records}, indent=2),
        encoding="utf-8",
    )
    total = sum(item["size_bytes"] for item in records)
    print(f"\nTotal model folder size: {total / 1024**3:.3f} GiB")
    if failures:
        print("\nVerification failures:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print("All three models passed file, JSON, and ONNX Runtime checks.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
