from __future__ import annotations

import json
import shutil
import sys
import tempfile
from pathlib import Path

from huggingface_hub import snapshot_download

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "models" / "indictrans2" / "model_manifest.json"
MIN_FREE_BYTES = 10 * 1024**3

MODELS = [
    {"name": "English to Indic", "repo_id": "hari31416/indictrans2-en-indic-dist-200M-ONNX", "direction": "English to Tamil and Kannada", "parameters": "200M", "local_dir": "models/indictrans2/en-indic-200m-fp32", "source_languages": ["eng_Latn"], "target_languages": ["tam_Taml", "kan_Knda"]},
    {"name": "Indic to English", "repo_id": "hari31416/indictrans2-indic-en-dist-200M-ONNX", "direction": "Tamil and Kannada to English", "parameters": "200M", "local_dir": "models/indictrans2/indic-en-200m-fp32", "source_languages": ["tam_Taml", "kan_Knda"], "target_languages": ["eng_Latn"]},
    {"name": "Indic to Indic", "repo_id": "hari31416/indictrans2-indic-indic-dist-320M-ONNX", "direction": "Tamil and Kannada", "parameters": "320M", "local_dir": "models/indictrans2/indic-indic-320m-fp32", "source_languages": ["tam_Taml", "kan_Knda"], "target_languages": ["tam_Taml", "kan_Knda"]},
]


def load_manifest() -> dict:
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {"models": []}


def main() -> int:
    temp_path = Path(tempfile.gettempdir())
    checks = {ROOT: shutil.disk_usage(ROOT).free, temp_path: shutil.disk_usage(temp_path).free}
    insufficient = [(path, free) for path, free in checks.items() if free < MIN_FREE_BYTES]
    for path, free in checks.items():
        print(f"Disk space: {path} has {free / 1024**3:.2f} GiB free.")
    if insufficient:
        path, free = insufficient[0]
        print(f"Insufficient disk space on {path}: {free / 1024**3:.2f} GiB free; at least 10 GiB is required. No downloads started.", file=sys.stderr)
        return 2
    print("Disk space checks passed for the project and temporary storage.")

    manifest = load_manifest()
    existing = {item.get("repo_id"): item for item in manifest.get("models", [])}
    failures = []
    for model in MODELS:
        destination = ROOT / model["local_dir"]
        destination.mkdir(parents=True, exist_ok=True)
        record = {
            **model,
            "model_format": "ONNX",
            "precision": "FP32",
            "required_graph_files": ["encoder_model.onnx", "decoder_model.onnx", "decoder_with_past_model.onnx"],
            "required_sidecar_files": ["encoder_model.onnx.data", "decoder_shared.onnx.data"],
            "tokenizer_files": ["tokenizer_src.json", "tokenizer_tgt.json", "tokenizer_meta.json"],
            "download_status": "in_progress",
            "verification_status": "pending",
        }
        record["base_model_parameter_size"] = record.pop("parameters")
        existing[model["repo_id"]] = record
        manifest["models"] = list(existing.values())
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(f"\nDownloading complete snapshot {model['repo_id']} to {destination} ...", flush=True)
        try:
            result = snapshot_download(repo_id=model["repo_id"], local_dir=str(destination))
            record["download_status"] = "completed"
            record["snapshot_path"] = str(Path(result).resolve())
            print(f"Completed {model['repo_id']}.", flush=True)
        except Exception as exc:
            record["download_status"] = "failed"
            record["download_error"] = f"{type(exc).__name__}: {exc}"
            failures.append((model["repo_id"], record["download_error"]))
            print(f"FAILED {model['repo_id']}: {record['download_error']}", file=sys.stderr, flush=True)
        manifest["models"] = list(existing.values())
        MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if failures:
        print("\nDownload failures:", file=sys.stderr)
        for repo, error in failures:
            print(f"- {repo}: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
