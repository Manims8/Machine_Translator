# TriLingua

TriLingua is an offline browser application for neural machine translation between English, Tamil, and Kannada. It runs local IndicTrans2 ONNX models through ONNX Runtime Web and includes an NLP preprocessing pipeline, translation history, glossary controls, entity protection, spelling assistance, and evaluation tools.

## Features

- Translate in all six language directions:
  - English -> Tamil
  - English -> Kannada
  - Tamil -> English
  - Kannada -> English
  - Tamil -> Kannada
  - Kannada -> Tamil
- Run inference locally in the browser without a translation API.
- Use local ONNX models, tokenizers, and model configurations.
- Chunk long inputs by sentence and token budget.
- Apply Unicode normalization, entity protection, glossary matching, and postprocessing.
- Keep recent successful translations in local browser storage, with history disabling available.
- Run browser smoke tests and the local evaluation pipeline.

## Technologies

- JavaScript ES modules
- Vite 8.3.8
- ONNX Runtime Web 1.21.0
- Transformers.js 3.0.2
- IndicTrans2 ONNX models
- Python 3.12
- Indic NLP Library 0.92
- SacreBLEU 2.6.0

## Supported languages

| UI language | Language tag |
|---|---|
| English | eng_Latn |
| Tamil | tam_Taml |
| Kannada | kan_Knda |

## Folder structure

```text
app/                         Browser application
  index.html                 Translation interface
  evaluation.html            Local benchmark runner
  src/js/                    Translation, NLP, model, history, and UI modules
  src/css/                   Styling and responsive layouts
documentation/               Original focused architecture and evaluation notes
docs/                        Final documentation and stage prompts
evaluation/                  Benchmark datasets, predictions, references, and results
models/indictrans2/          Local IndicTrans2 ONNX snapshots
resources/indic_nlp_resources/ Local Indic NLP resources
scripts/                     Download, verification, testing, and scoring scripts
references/                  Third-party demonstration reference
package.json                 Node dependencies and commands
requirements.txt             Canonical Python dependencies
```

## Models

Three model families are required:

| Family | Local directory | Directions |
|---|---|---|
| English to Indic 200M | `models/indictrans2/en-indic-200m-fp32` | English -> Tamil/Kannada |
| Indic to English 200M | `models/indictrans2/indic-en-200m-fp32` | Tamil/Kannada -> English |
| Indic to Indic 320M | `models/indictrans2/indic-indic-320m-fp32` | Tamil <-> Kannada |

Each family requires its encoder, decoder, decoder-with-past graphs, external ONNX weight sidecars, source/target tokenizers, configuration, generation configuration, and metadata. The complete layout is recorded in `models/indictrans2/model_manifest.json`. The model README is at `models/README.md`.

The model files are large and are intentionally not copied into the frontend build. Vite serves them from `models/` in development and the browser loads them locally.

## Installation

### JavaScript application

Requirements: Node.js 20.19 or newer, or Node.js 22.12 or newer for Vite 8.

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Open the URL printed by Vite.

### Python evaluation environment

From the repository root:

```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

The `sacrebleu==2.6.0` and `indic-nlp-library==0.92` versions are the pinned scoring versions used by the benchmark.

## Usage

1. Select source and target languages.
2. Enter text in the translation workspace.
3. Select Translate.
4. Review the output, progress, timing, and NLP diagnostics.
5. Optionally manage glossary entries or English spelling suggestions.
6. Successful translations can be kept in local browser history, subject to the history setting.

## Offline operation

The application blocks remote translation services and loads models from the local Vite server or deployed static assets. The browser smoke test also blocks external HTTPS requests and verifies that translation can complete using localhost assets. Offline operation requires the downloaded model snapshots and ONNX Runtime Web assets to remain available.

Service-worker/PWA installation and cached-asset behavior for disconnected use after deployment should not be assumed; verification currently covers the existing local-server and browser smoke procedure.

## Testing

Run the JavaScript NLP component tests:

```powershell
node scripts/test_nlp_components.mjs
```

Run the Python Indic NLP test:

```powershell
python scripts/test_indicnlp.py
```

Build the frontend:

```powershell
npm.cmd run build
```

Run the browser smoke test for all six directions:

```powershell
npm.cmd run smoke
```

The smoke test launches Vite and Chrome or Edge, blocks external HTTPS requests, verifies local model assets, and records its output in `evaluation/preliminary_smoke_tests.json`.

## Evaluation

The full evaluation uses the FLORES-200 devtest set with 1,012 sentence pairs in each of six directions, totaling 6,072 predictions.

The canonical result files are:

- `evaluation/results/final_results.json`
- `evaluation/results/failed_predictions.json`
- `evaluation/results/full_benchmark_audit.md`
- `evaluation/results/full_benchmark_validation_report.json`
- `evaluation/results/full_benchmark_summary.md`
- `evaluation/results/qualitative_error_analysis.md`

Pilot artifacts remain in `evaluation/results/` and use `pilot` in their filenames. Full-mode scoring reads only un-suffixed full prediction and reference files.

Validation:

```powershell
python scripts/score_evaluation.py --mode full --expected-count 1012 --validate-only
python scripts/score_evaluation.py --mode full --expected-count 1012
```

The first command validates inputs only; the second writes full-benchmark results. Do not rerun translations or alter prediction/reference data.

## Final benchmark summary

| Direction | BLEU | chrF++ |
|---|---:|---:|
| English -> Tamil | 17.776693 | 54.585597 |
| English -> Kannada | 19.255344 | 53.568908 |
| Tamil -> English | 32.204653 | 57.437847 |
| Kannada -> English | 32.742676 | 58.270864 |
| Tamil -> Kannada | 11.045295 | 43.288348 |
| Kannada -> Tamil | 11.535107 | 46.072020 |

Macro-average BLEU: **20.759961**
Macro-average chrF++: **52.203931**

## Documentation

- Central technical reference: `docs/final_project_documentation_evidence.md`
- Repository cleanup inventory: `docs/repository_cleanup_inventory.md`
- Repository cleanup report: `docs/repository_cleanup_report.md`
- Existing focused architecture notes remain under `documentation/` for historical and module-specific context.

## Known limitations

- Browser performance depends on device memory and CPU.
- Entity and glossary marker protection is direction-dependent and is disabled or reference-only where not verified.
- Direct Tamil<->Kannada translation has the weakest benchmark results and more repetition/entity failures.
- Named entities, clinical terms, legal terms, numbers, and quotes require human review.
- No Android APK or native mobile inference artifact is claimed.
- The project does not claim an always-disconnected PWA deployment until a full disconnected deployment test is added.
