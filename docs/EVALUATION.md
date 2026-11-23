# Evaluation

This page is generated from the saved score, prediction, reference, runtime, test, and device evidence. Run `python scripts/summarize_results.py --check` to validate inputs and verify this page is current. Scores are not recalculated here.

## Full FP32 corpus

The full run uses the saved FLORES-200 devtest references. Scoring uses SacreBLEU corpus BLEU with exponential smoothing and chrF++ with word order 2. English targets use `13a`; Tamil and Kannada targets use the project's Indic normalization and trivial tokenization. The prediction validator checks ID alignment and successful records before the benchmark report is accepted.

| Direction | Sentences | BLEU | chrF++ | Mean ms/sentence |
|---|---:|---:|---:|---:|
| English to Tamil | 1012 | 17.776693 | 54.585597 | 1487.0 |
| English to Kannada | 1012 | 19.255344 | 53.568908 | 1394.7 |
| Tamil to English | 1012 | 32.204653 | 57.437847 | 942.2 |
| Kannada to English | 1012 | 32.742676 | 58.270864 | 945.6 |
| Tamil to Kannada | 1012 | 11.045295 | 43.288348 | 1430.1 |
| Kannada to Tamil | 1012 | 11.535107 | 46.072020 | 1488.3 |

Sources: `evaluation/results/final_results.json`; full predictions `evaluation/predictions/<direction>.jsonl`; references `evaluation/references/<direction>.jsonl`; integrity audit `evaluation/results/full_benchmark_validation_report.json`; failed rows `evaluation/results/failed_predictions.json`.

## Paired FP32 and INT8 sample

Both precisions use the same 202 IDs per direction and the matching subset of source/reference rows. Values below come from the saved score JSONs; latency is the mean recorded by each sample run and should be compared cautiously because runtime conditions may differ.

| Direction | FP32 BLEU | INT8 BLEU | Delta | FP32 chrF++ | INT8 chrF++ | Delta | FP32 ms/sentence | INT8 ms/sentence |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| English to Tamil | 17.748 | 18.043 | 0.295 | 54.833 | 54.633 | -0.200 | 1417.9 | 1391.7 |
| English to Kannada | 20.228 | 19.956 | -0.272 | 55.295 | 54.930 | -0.365 | 1332.0 | 1291.1 |
| Tamil to English | 33.748 | 33.968 | 0.220 | 58.156 | 58.039 | -0.118 | 892.6 | 876.7 |
| Kannada to English | 33.939 | 33.012 | -0.928 | 59.239 | 58.655 | -0.585 | 895.9 | 871.6 |
| Tamil to Kannada | 10.982 | 11.440 | 0.458 | 43.352 | 43.860 | 0.508 | 1367.8 | 1348.2 |
| Kannada to Tamil | 10.305 | 10.592 | 0.287 | 45.612 | 45.297 | -0.315 | 1420.1 | 1416.8 |

Sources: `evaluation/results/int8/score_fp32/final_results.json`, `evaluation/results/int8/score_int8/final_results.json`, `evaluation/dataset/quantization_sample_ids.json`, `evaluation/results/int8/sample_references/`, `evaluation/predictions_fp32_sample/`, and `evaluation/predictions_int8/`.

### Paired sample output checks

The following screening rules are computed from saved predictions. A repetition loop is an exact adjacent repeated sequence of at least three word tokens. Wrong-script detection uses Unicode ranges and allows Latin names in Indic text. These are heuristics, not translation-quality judgments.

| Direction | FP32 empty | INT8 empty | FP32 repeat loops | INT8 repeat loops | FP32 wrong script | INT8 wrong script |
|---|---:|---:|---:|---:|---:|---:|
| English to Tamil | 0 | 0 | 3 | 2 | 0 | 0 |
| English to Kannada | 0 | 0 | 1 | 1 | 0 | 0 |
| Tamil to English | 0 | 0 | 0 | 0 | 0 | 0 |
| Kannada to English | 0 | 0 | 0 | 0 | 0 | 0 |
| Tamil to Kannada | 0 | 0 | 2 | 2 | 0 | 0 |
| Kannada to Tamil | 0 | 0 | 3 | 1 | 1 | 1 |

## Quantized browser runtime and memory

| Model family | Load ms | JS heap used MB | JS heap total MB | V8 backing store MB | Renderer RSS MB | Renderer private MB |
|---|---:|---:|---:|---:|---:|---:|
| en-indic-200m | 3651.5 | 53.0 | 94.4 | 527.7 | 931.1 | 872.9 |
| indic-en-200m | 3097.3 | 52.7 | 104.6 | 465.9 | 1496.9 | 1438.9 |
| indic-indic-320m | 4049.5 | 70.3 | 145.6 | 568.1 | 1696.1 | 1589.2 |

Sources: `evaluation/predictions_int8/runtime_metrics.json` and `evaluation/predictions_int8/renderer_memory_samples.json`. Renderer totals are process snapshots, not per-model allocations. V8 backing storage is a WASM/ArrayBuffer proxy, not an isolated WASM-memory counter. Desktop readings are not phone RAM estimates.

## Runtime and quality checks

- Quantized browser smoke: 6 passed and 0 failed; the report records offline refresh and requested origins.
- NLP component checks: 22 passed, 0 failed.
- NLP pipeline checks: 6 direction regressions recorded; inspect statuses and marker checks in the raw JSON.
- UI repaint check: 6 direction checks painted the loading state before inference started; measured maximum delay 42.3 ms.
- Historical Stage 2 baseline comparison: 2 of the six output strings differ from the current INT8 smoke run. The shipped default now uses INT8; see the raw baseline and current output fields in evaluation/nlp_pipeline_tests.json.
- `evaluation/results/qualitative_error_analysis.md` is a selective example review, not exhaustive human evaluation. Empty-output, repetition, and wrong-script checks are heuristics, not semantic quality judgments.

Sources: `evaluation/results/int8/browser_smoke_tests.json`, `evaluation/nlp_component_tests.json`, `evaluation/nlp_pipeline_tests.json`, and `evaluation/results/qualitative_error_analysis.md`.

## Android device evidence

The recorded Android run covers 12 requested translations on one device. It is a connected-device test record, not a general compatibility guarantee.

| Device | Android | Requested translations | Result |
|---|---|---:|---|
| Samsung SM-A146B | 15 | 12 | passed |

Sources: `evaluation/results/android_test_results.json` and `evaluation/results/android_test_results.md`. See [Android build and test notes](ANDROID.md).

## Limitations

Automatic metrics measure similarity to one reference and do not replace native-speaker review. The paired precision comparison uses a sample. Hardware conditions affect measured speed and memory. The existing offline smoke test exercises a local development server with external requests blocked; it does not prove disconnected PWA startup. Model output may omit entities, alter terminology, or repeat text, especially on direct Tamil/Kannada routes.
