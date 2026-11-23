"""Validate saved translation evidence and render the canonical evaluation guide."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVAL = ROOT / "evaluation"
OUTPUT = ROOT / "docs" / "EVALUATION.md"
DIRECTIONS = [
    "eng_Latn-tam_Taml",
    "eng_Latn-kan_Knda",
    "tam_Taml-eng_Latn",
    "kan_Knda-eng_Latn",
    "tam_Taml-kan_Knda",
    "kan_Knda-tam_Taml",
]
LABELS = {
    "eng_Latn": "English",
    "tam_Taml": "Tamil",
    "kan_Knda": "Kannada",
}


def read_json(path: Path):
    if not path.is_file():
        raise ValueError(f"Required evidence file is missing: {path.relative_to(ROOT)}")
    return json.loads(path.read_text(encoding="utf-8-sig"))


def read_jsonl(path: Path):
    if not path.is_file():
        raise ValueError(f"Required evidence file is missing: {path.relative_to(ROOT)}")
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8-sig").splitlines()
        if line.strip()
    ]


def records_by_id(path: Path):
    rows = read_jsonl(path)
    result = {row["id"]: row for row in rows}
    if len(result) != len(rows):
        raise ValueError(f"Duplicate IDs in {path.relative_to(ROOT)}")
    return result


def fmt(value, digits=3):
    return "n/a" if value is None else f"{float(value):.{digits}f}"


def label(direction):
    source, target = direction.split("-")
    return f"{LABELS[source]} to {LABELS[target]}"


def repeated_phrase(text):
    words = re.findall(r"\w+", text, flags=re.UNICODE)
    for size in range(3, len(words) // 2 + 1):
        if any(
            words[i : i + size] == words[i + size : i + 2 * size]
            for i in range(len(words) - 2 * size + 1)
        ):
            return True
    return False


def wrong_script(text, target):
    indic_ranges = (
        (0x0900, 0x0DFF),
        (0x0F00, 0x109F),
        (0x1700, 0x18AF),
        (0xA800, 0xABFF),
        (0x11000, 0x11FFF),
    )
    target_ranges = {"tam_Taml": (0x0B80, 0x0BFF), "kan_Knda": (0x0C80, 0x0CFF)}
    for char in text:
        code = ord(char)
        if any(low <= code <= high for low, high in indic_ranges):
            allowed = target_ranges.get(target)
            if allowed is None or not allowed[0] <= code <= allowed[1]:
                return True
    return False


def quality_counts(rows, target):
    texts = [str(row.get("prediction", "")) for row in rows.values()]
    return (
        sum(not text.strip() for text in texts),
        sum(repeated_phrase(text) for text in texts),
        sum(wrong_script(text, target) for text in texts),
    )


def load_and_validate():
    full = {
        row["direction"]: row
        for row in read_json(EVAL / "results/final_results.json")["results"]
    }
    fp32 = {
        row["direction"]: row
        for row in read_json(EVAL / "results/int8/score_fp32/final_results.json")[
            "results"
        ]
    }
    int8 = {
        row["direction"]: row
        for row in read_json(EVAL / "results/int8/score_int8/final_results.json")[
            "results"
        ]
    }
    if any(set(scores) != set(DIRECTIONS) for scores in (full, fp32, int8)):
        raise ValueError("A score JSON is missing a required translation direction.")

    validation = read_json(EVAL / "results/full_benchmark_validation_report.json")
    android = read_json(EVAL / "results/android_test_results.json")
    browser = read_json(EVAL / "results/int8/browser_smoke_tests.json")
    components = read_json(EVAL / "nlp_component_tests.json")
    pipeline = read_json(EVAL / "nlp_pipeline_tests.json")
    sample_ids = read_json(EVAL / "dataset/quantization_sample_ids.json")
    if not isinstance(sample_ids, list) or len(sample_ids) != len(set(sample_ids)):
        raise ValueError("Quantization sample IDs must be a unique JSON list.")

    paired = {}
    for direction in DIRECTIONS:
        source, target = direction.split("-")
        refs = records_by_id(EVAL / "references" / f"{direction}.jsonl")
        preds = records_by_id(EVAL / "predictions" / f"{direction}.jsonl")
        if refs.keys() != preds.keys():
            raise ValueError(
                f"Full predictions and references are misaligned for {direction}."
            )
        if len(preds) != full[direction]["sentences"]:
            raise ValueError(
                f"Full prediction count does not match score JSON for {direction}."
            )
        if any(
            row.get("source_language") != source or row.get("target_language") != target
            for row in preds.values()
        ):
            raise ValueError(
                f"Full prediction route metadata mismatch for {direction}."
            )

        sample_ref = records_by_id(
            EVAL / "results/int8/sample_references" / f"{direction}.jsonl"
        )
        sample_fp = records_by_id(
            EVAL / "predictions_fp32_sample" / f"{direction}.jsonl"
        )
        sample_int8 = records_by_id(EVAL / "predictions_int8" / f"{direction}.jsonl")
        expected_ids = set(sample_ids) & refs.keys()
        if (
            sample_ref.keys() != expected_ids
            or sample_fp.keys() != expected_ids
            or sample_int8.keys() != expected_ids
        ):
            raise ValueError(
                f"Paired sample IDs do not match source sample list for {direction}."
            )
        for ident in expected_ids:
            expected_source = refs[ident]["source"]
            if any(
                rows[ident]["source"] != expected_source
                for rows in (sample_ref, sample_fp, sample_int8)
            ):
                raise ValueError(
                    f"Paired source text mismatch for {direction}, ID {ident}."
                )
        if (
            len(sample_ids) != fp32[direction]["sentences"]
            or len(sample_ids) != int8[direction]["sentences"]
        ):
            raise ValueError(
                f"Paired score row counts do not match sample IDs for {direction}."
            )
        paired[direction] = (sample_fp, sample_int8, sample_ref)

    if validation.get("safe_to_score") is not True or len(
        validation.get("prediction_count", {}).get("directions", [])
    ) != len(DIRECTIONS):
        raise ValueError(
            "Full benchmark validation report is incomplete or not safe to score."
        )
    for direction in DIRECTIONS:
        audit = next(
            (
                row
                for row in validation["prediction_count"]["directions"]
                if row.get("direction") == direction
            ),
            None,
        )
        if (
            audit is None
            or audit.get("valid") != full[direction].get("successful")
            or audit.get("failed") != full[direction].get("failed")
        ):
            raise ValueError(
                f"Full benchmark audit and score count do not agree for {direction}."
            )
    return full, fp32, int8, paired, validation, android, browser, components, pipeline


def render():
    full, fp32, int8, paired, validation, android, browser, components, pipeline = (
        load_and_validate()
    )
    baseline_differences = sum(
        item.get("baselineTranslation") != item.get("stage3Translation")
        for item in pipeline.get("sixDirectionRegressions", [])
    )
    lines = [
        "# Evaluation",
        "",
        "This page is generated from the saved score, prediction, reference, runtime, test, and device evidence. Run `python scripts/summarize_results.py --check` to validate inputs and verify this page is current. Scores are not recalculated here.",
        "",
        "## Full FP32 corpus",
        "",
        "The full run uses the saved FLORES-200 devtest references. Scoring uses SacreBLEU corpus BLEU with exponential smoothing and chrF++ with word order 2. English targets use `13a`; Tamil and Kannada targets use the project's Indic normalization and trivial tokenization. The prediction validator checks ID alignment and successful records before the benchmark report is accepted.",
        "",
        "| Direction | Sentences | BLEU | chrF++ | Mean ms/sentence |",
        "|---|---:|---:|---:|---:|",
    ]
    for direction in DIRECTIONS:
        row = full[direction]
        lines.append(
            f"| {label(direction)} | {row['sentences']} | {fmt(row['bleu'], 6)} | {fmt(row['chrf++'], 6)} | {fmt(row.get('time_mean_ms'), 1)} |"
        )
    lines += [
        "",
        "Sources: `evaluation/results/final_results.json`; full predictions `evaluation/predictions/<direction>.jsonl`; references `evaluation/references/<direction>.jsonl`; integrity audit `evaluation/results/full_benchmark_validation_report.json`; failed rows `evaluation/results/failed_predictions.json`.",
        "",
        "## Paired FP32 and INT8 sample",
        "",
        f"Both precisions use the same {len(read_json(EVAL / 'dataset/quantization_sample_ids.json'))} IDs per direction and the matching subset of source/reference rows. Values below come from the saved score JSONs; latency is the mean recorded by each sample run and should be compared cautiously because runtime conditions may differ.",
        "",
        "| Direction | FP32 BLEU | INT8 BLEU | Delta | FP32 chrF++ | INT8 chrF++ | Delta | FP32 ms/sentence | INT8 ms/sentence |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for direction in DIRECTIONS:
        a, b = fp32[direction], int8[direction]
        lines.append(
            f"| {label(direction)} | {fmt(a['bleu'])} | {fmt(b['bleu'])} | {fmt(b['bleu'] - a['bleu'], 3)} | {fmt(a['chrf++'])} | {fmt(b['chrf++'])} | {fmt(b['chrf++'] - a['chrf++'], 3)} | {fmt(a.get('time_mean_ms'), 1)} | {fmt(b.get('time_mean_ms'), 1)} |"
        )
    lines += [
        "",
        "Sources: `evaluation/results/int8/score_fp32/final_results.json`, `evaluation/results/int8/score_int8/final_results.json`, `evaluation/dataset/quantization_sample_ids.json`, `evaluation/results/int8/sample_references/`, `evaluation/predictions_fp32_sample/`, and `evaluation/predictions_int8/`.",
        "",
        "### Paired sample output checks",
        "",
        "The following screening rules are computed from saved predictions. A repetition loop is an exact adjacent repeated sequence of at least three word tokens. Wrong-script detection uses Unicode ranges and allows Latin names in Indic text. These are heuristics, not translation-quality judgments.",
        "",
        "| Direction | FP32 empty | INT8 empty | FP32 repeat loops | INT8 repeat loops | FP32 wrong script | INT8 wrong script |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for direction in DIRECTIONS:
        fp_rows, int8_rows, _ = paired[direction]
        fp_flags = quality_counts(fp_rows, direction.split("-")[1])
        int8_flags = quality_counts(int8_rows, direction.split("-")[1])
        lines.append(
            f"| {label(direction)} | {fp_flags[0]} | {int8_flags[0]} | {fp_flags[1]} | {int8_flags[1]} | {fp_flags[2]} | {int8_flags[2]} |"
        )
    lines += [
        "",
        "## Quantized browser runtime and memory",
        "",
        "| Model family | Load ms | JS heap used MB | JS heap total MB | V8 backing store MB | Renderer RSS MB | Renderer private MB |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    runtime = read_json(EVAL / "predictions_int8/runtime_metrics.json")["families"]
    memory_rows = {
        item["family"]: item
        for item in read_json(EVAL / "predictions_int8/renderer_memory_samples.json")
    }
    for family, values in runtime.items():
        memory = memory_rows[family]

        def mb(value):
            return "n/a" if value is None else fmt(value / 1_000_000, 1)

        lines.append(
            f"| {family} | {fmt(values.get('model_load_time_ms'), 1)} | {mb(values.get('js_heap_used_bytes'))} | {mb(values.get('js_heap_total_bytes'))} | {mb(values.get('wasm_and_arraybuffer_backing_store_bytes'))} | {mb(memory.get('renderer_rss_total_bytes'))} | {mb(memory.get('renderer_private_total_bytes'))} |"
        )
    lines += [
        "",
        "Sources: `evaluation/predictions_int8/runtime_metrics.json` and `evaluation/predictions_int8/renderer_memory_samples.json`. Renderer totals are process snapshots, not per-model allocations. V8 backing storage is a WASM/ArrayBuffer proxy, not an isolated WASM-memory counter. Desktop readings are not phone RAM estimates.",
        "",
        "## Runtime and quality checks",
        "",
        f"- Quantized browser smoke: {browser.get('passed', len([row for row in browser.get('results', []) if row.get('status') == 'passed']))} passed and {browser.get('failed', len([row for row in browser.get('results', []) if row.get('status') != 'passed']))} failed; the report records offline refresh and requested origins.",
        f"- NLP component checks: {components.get('passed')} passed, {components.get('failed')} failed.",
        f"- NLP pipeline checks: {len(pipeline.get('sixDirectionRegressions', []))} direction regressions recorded; inspect statuses and marker checks in the raw JSON.",
        f"- UI repaint check: {pipeline.get('testSummary', {}).get('uiRepaint', {}).get('passed', 'not recorded')} direction checks painted the loading state before inference started; measured maximum delay {fmt(pipeline.get('testSummary', {}).get('uiRepaint', {}).get('maxDelayMs'), 1)} ms.",
        f"- Historical Stage 2 baseline comparison: {baseline_differences} of the six output strings differ from the current INT8 smoke run. The shipped default now uses INT8; see the raw baseline and current output fields in evaluation/nlp_pipeline_tests.json.",
        "- `evaluation/results/qualitative_error_analysis.md` is a selective example review, not exhaustive human evaluation. Empty-output, repetition, and wrong-script checks are heuristics, not semantic quality judgments.",
        "",
        "Sources: `evaluation/results/int8/browser_smoke_tests.json`, `evaluation/nlp_component_tests.json`, `evaluation/nlp_pipeline_tests.json`, and `evaluation/results/qualitative_error_analysis.md`.",
        "",
        "## Android device evidence",
        "",
        f"The recorded Android run covers {len(android.get('translations', []))} requested translations on one device. It is a connected-device test record, not a general compatibility guarantee.",
        "",
        "| Device | Android | Requested translations | Result |",
        "|---|---|---:|---|",
        f"| {android['device']} | {android['android_version']} | {len(android.get('translations', []))} | {android['overall_result']} |",
        "",
        "Sources: `evaluation/results/android_test_results.json` and `evaluation/results/android_test_results.md`. See [Android build and test notes](ANDROID.md).",
        "",
        "## Limitations",
        "",
        "Automatic metrics measure similarity to one reference and do not replace native-speaker review. The paired precision comparison uses a sample. Hardware conditions affect measured speed and memory. The existing offline smoke test exercises a local development server with external requests blocked; it does not prove disconnected PWA startup. Model output may omit entities, alter terminology, or repeat text, especially on direct Tamil/Kannada routes.",
        "",
    ]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate inputs and compare generated content without writing",
    )
    args = parser.parse_args()
    try:
        content = render()
        if args.check:
            if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != content:
                raise ValueError(
                    "docs/EVALUATION.md is missing or stale; run python scripts/summarize_results.py to regenerate it."
                )
            print("Evaluation evidence validated; docs/EVALUATION.md is current.")
        else:
            OUTPUT.write_text(content, encoding="utf-8")
            print("Wrote docs/EVALUATION.md from validated saved evidence.")
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"[summarize] ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
