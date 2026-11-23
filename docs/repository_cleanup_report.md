# Repository Cleanup Report

## Status

Repository cleanup, documentation consolidation, and verification are complete.

No benchmark translations were rerun. Prediction, reference, full-result, and pilot files were not altered as part of cleanup.

## What was removed

- Removed generated Python `__pycache__` directories under `scripts/`.
- Removed model-directory `.cache` directories and model-directory `__pycache__` directories.
- Restored tracked test-output JSON files to their pre-validation versions after running tests.

No model graph, external weight sidecar, tokenizer, configuration, resource, license, prediction, reference, or benchmark result file was removed.

## What was consolidated

- Replaced the existing root README with one canonical project README.
- Kept `requirements.txt` as the single project Python dependency file.
- Added `docs/final_project_documentation_evidence.md` as the canonical technical/evaluation reference.
- Added `docs/repository_cleanup_inventory.md` to classify keep, consolidate, update, delete, and uncertain files.
- Retained focused documents under `documentation/` and development prompts under `docs/development-prompts/` because they contain historical implementation and prompt context.

## Documentation rewritten

- `README.md`
- `docs/final_project_documentation_evidence.md`
- `docs/repository_cleanup_inventory.md`
- `docs/repository_cleanup_report.md`

The existing qualitative report and full-benchmark audit/report remain the benchmark evidence files.

## Dependencies

Python dependencies remain consolidated in `requirements.txt`.

Verified scoring pins:

- `sacrebleu==2.6.0`
- `indic-nlp-library==0.92`

Node dependencies remain in `package.json` and `package-lock.json`:

- Vite 8.3.8
- ONNX Runtime Web 1.21.0
- Transformers.js 3.0.2
- Node.js 24.20.0 was used during verification
- npm 11.19.0 was used during verification

No redundant project requirements file was found or added.

## Essential files preserved

Preserved:

- All six full prediction and reference JSONL files.
- All six pilot prediction and reference JSONL files.
- `evaluation/results/final_results.json`
- `evaluation/results/failed_predictions.json`
- `evaluation/results/pilot_results.json`
- Full benchmark audit, validation, summary, and qualitative reports.
- FLORES-200 parallel data.
- Three complete IndicTrans2 model snapshots.
- All ONNX graphs and external weight sidecars.
- All source/target tokenizer and configuration files.
- `resources/indic_nlp_resources/`.
- Third-party demonstration submodule and repository license/attribution areas.
- Application source, Vite configuration, Node lockfile, and scripts.

## Final folder structure

```text
app/                         Browser UI and JavaScript/CSS modules
docs/                        Canonical documentation and stage prompts
documentation/               Focused existing technical/evaluation notes
evaluation/                  Dataset, benchmark, tests, predictions, and reports
models/indictrans2/          Three local ONNX model snapshots
resources/indic_nlp_resources/ Indic NLP resources
scripts/                     Download, test, benchmark, and scoring utilities
references/                  Third-party demonstration submodule
README.md                    Canonical project README
package.json                Node scripts and dependencies
package-lock.json           Locked Node dependency graph
requirements.txt            Canonical Python dependencies
vite.config.js              Frontend build and model asset configuration
```

## Tests and build

### JavaScript NLP components

- Result: passed
- Passed: 22
- Failed: 0

### Python Indic NLP

- Tamil test: passed
- Kannada test: passed

### Production frontend build

- Result: passed
- Vite: 8.3.8
- Build completed successfully
- Vite emitted expected chunk-size and runtime-URL warnings, with no build failure

### Browser smoke and offline check

- Result: passed
- Six directions: 6 passed, 0 failed
- Offline refresh: passed
- External origins requested: 0

## Benchmark verification

- Directions: 6
- Records per direction: 1,012
- Total evaluated: 6,072
- Failed predictions: 0
- All BLEU and chrF++ values finite
- Macro BLEU: 20.759961
- Macro chrF++: 52.203931

The score file remains unchanged. The prediction and reference files were not rerun or rewritten.

## Remaining redundant or uncertain files

- Historical stage prompt files remain under `docs/development-prompts/`; they document development stages but are not runtime inputs.
- `docs/development-prompts/debug_25_sentence_failure.md` remains as an uncertain historical record.
- Existing focused files under `documentation/` remain as supplemental notes.
- `dist/` remains as generated build output and is recreated by `npm run build`.
- `.venv/` and `node_modules/` remain as local environment/dependency directories and are ignored by Git.
- `evaluation/checkpoints/` and `evaluation/logs/` remain as experimental provenance.
- `evaluation/test_runs/` remains as existing test evidence.

These files were retained until verified rather than deleted based only on age or filename.

## Final counts

- Project README maintained: 1 canonical root README.
- Repository README files, including model/submodule documentation: 3.
- Project Python requirements files: 1.
- Architecture documentation files: 3 focused files under `documentation/architecture/` plus 1 canonical final evidence document.
- Temporary or intermediate project cache directories: 0 under scripts/model directories after cleanup.
- Remaining uncertain historical or provenance files: stage prompts, old focused documentation, and benchmark test/provenance directories as listed above.

## Final verification

- `git diff --check`: passed after removing the README trailing whitespace.
- Python dependency imports: available and tested.
- JavaScript module imports: exercised by component tests and build.
- Required model and tokenizer paths: present.
- Indic NLP resource path: present and tested.
- All six translation directions: assets and smoke-test results available.
- No commit or push was performed.
