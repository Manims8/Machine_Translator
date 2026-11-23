"""Download accepted FLORES-200 devtest data; never bypass dataset access conditions."""

import hashlib, json, sys
from datetime import date
from pathlib import Path

OUT = Path("evaluation/dataset/flores200_devtest_parallel.jsonl")
LANGS = {"eng_Latn": "english", "tam_Taml": "tamil", "kan_Knda": "kannada"}


def main():
    try:
        from datasets import load_dataset
    except ImportError:
        raise SystemExit(
            "Install datasets in the existing .venv with: .venv\\Scripts\\python.exe -m pip install datasets"
        )
    try:
        ds = load_dataset("facebook/flores", "all", split="devtest")
    except Exception as exc:
        raise SystemExit(
            f"FLORES access/download failed: {exc}\nVisit https://huggingface.co/datasets/facebook/flores and accept its conditions. Authenticate with the official hf CLI if required; never put tokens in source."
        )
    cols = set(ds.column_names)
    required = {"sentence_" + x for x in LANGS}
    if not required.issubset(cols):
        raise SystemExit(f"Unexpected dataset columns: {sorted(cols)}")
    if len(ds) != 1012:
        raise SystemExit(
            f"Expected 1,012 aligned rows, got {len(ds)}; refusing to write benchmark."
        )
    rows = []
    seen = set()
    for i, r in enumerate(ds):
        ident = r.get("id", i + 1)
        if ident in seen:
            raise SystemExit(f"Duplicate id {ident}")
        seen.add(ident)
        out = {"id": ident}
        for code, key in LANGS.items():
            value = r["sentence_" + code]
            if not isinstance(value, str) or not value.strip():
                raise SystemExit(f"Empty {code} at id {ident}")
            out[key] = value
        rows.append(out)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    raw = "".join(json.dumps(x, ensure_ascii=False) + "\n" for x in rows).encode()
    OUT.write_bytes(raw)
    meta = {
        "dataset": "FLORES-200",
        "repository": "facebook/flores",
        "configuration": "all",
        "split": "devtest",
        "language_codes": list(LANGS),
        "download_date": date.today().isoformat(),
        "license": "CC-BY-SA 4.0 (verify current dataset card)",
        "examples": len(rows),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "source_url": "https://huggingface.co/datasets/facebook/flores",
    }
    OUT.with_name("dataset_metadata.json").write_text(
        json.dumps(meta, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(rows)} verified rows to {OUT}")


if __name__ == "__main__":
    main()
