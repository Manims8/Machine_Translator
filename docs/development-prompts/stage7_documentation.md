# Stage 7 — TriLingua Repository Cleanup and Final Documentation

Perform a comprehensive repository cleanup and then prepare accurate final technical documentation for the TriLingua project.

The project is now functionally implemented, the full benchmark has completed, and qualitative evaluation is available.

The goal is to leave the repository clean, organized, easy to understand, and ready for academic submission and future development.

Work in the following phases and verify each phase before proceeding.

---

# PHASE 1 — Repository Inventory and Cleanup Planning

First inspect the entire repository.

Examine:
- Root directory and all subdirectories.
- README files.
- Requirements and dependency files.
- Architecture and design documentation.
- Model directories and downloaded model snapshots.
- Python and JavaScript source code.
- Scripts and test files.
- Evaluation datasets, predictions, references, and results.
- Temporary files, intermediate outputs, caches, and unused artifacts.
- Configuration files and Git tracking status.

Identify:

1. Duplicate README files.
2. Redundant requirements files.
3. Outdated architecture documentation.
4. Old development notes that have been superseded.
5. Intermediate scripts created only for debugging or one-time tasks.
6. Unused test outputs and temporary extraction files.
7. Duplicate documentation inside model directories.
8. Unnecessary generated files and stale build artifacts.
9. Files that are no longer referenced by the current application.
10. Any unnecessary folders or empty directories.

Determine whether a file is actually unused before deleting it. Inspect imports, references, configuration, scripts, and runtime dependencies rather than relying on filenames alone.

Create a cleanup inventory at:

`docs/repository_cleanup_inventory.md`

Classify files into:
- Keep.
- Consolidate.
- Update.
- Safe to delete.
- Uncertain — retain until verified.

Do not delete uncertain files merely to reduce the file count.

---

# PHASE 2 — Protect Essential Project Assets

The following assets are important and must be preserved.

### A. Machine translation models

Preserve all three complete IndicTrans2 model snapshots:
- English → Indic model.
- Indic → English model.
- Indic ↔ Indic model.

Preserve all required:
- ONNX model graphs.
- External ONNX weight files and sidecars.
- Model configuration files.
- Tokenizer files.
- Vocabulary files.
- Special token mappings.
- Generation configuration.
- Model metadata required for inference.

Do not delete or rename model files simply because they are large or have unfamiliar extensions.

### B. Indic NLP resources

Preserve:

`resources/indic_nlp_resources/`

Keep every resource file needed by the current normalization and tokenization pipeline.

### C. Evaluation assets

Preserve:
- FLORES-200 dataset.
- All six full reference files.
- All six full prediction files.
- All six pilot prediction files.
- Final benchmark results.
- Failed prediction report.
- Pilot benchmark results.
- Full benchmark audit reports.
- Qualitative error analysis.

In particular, preserve:
- `evaluation/results/final_results.json`
- `evaluation/results/failed_predictions.json`
- `evaluation/results/pilot_results.json`
- `evaluation/results/full_benchmark_audit.md`
- `evaluation/results/full_benchmark_validation_report.json`
- `evaluation/results/qualitative_error_analysis.md`

Do not rerun the benchmark or modify any prediction, reference, or final result file.

### D. Application and project essentials

Preserve:
- All actively used Python and JavaScript source files.
- Vite configuration.
- Node package configuration and lockfile.
- `.gitignore`.
- Git repository metadata.
- Required scripts.
- Tests.
- Application assets.
- Required licenses, attribution, copyright notices, and model citations.

Do not remove `package.json` or `package-lock.json`. They are required for the JavaScript application.

Do not remove or damage the `.git` directory.

---

# PHASE 3 — Documentation Consolidation

The current repository contains too many documentation files and possibly duplicated information.

Simplify the structure.

### A. README files

Maintain one main project README:

`README.md`

Consolidate useful information from redundant README files into this root README or the canonical technical documentation.

The root README must explain:
1. What TriLingua is.
2. Its main features.
3. Supported translation directions.
4. Technologies used.
5. Project folder structure.
6. Model requirements and locations.
7. Installation instructions.
8. How to start the application.
9. How to use the translation system.
10. How offline mode works.
11. How to run tests.
12. How the evaluation was conducted.
13. Where final evaluation results are stored.
14. Known limitations.

Remove redundant nested project README files only after preserving useful information.

Do not remove third-party licenses or required model attribution.

### B. Requirements files

Consolidate Python dependencies into one canonical file:

`requirements.txt`

Inspect all Python imports and scripts before creating the consolidated dependency list.

Include the actual dependencies required by:
- Evaluation.
- Indic NLP preprocessing.
- Scoring.
- Development and testing, where necessary.

Use appropriate version pins based on the existing working environment.

Preserve the installed working dependencies, including the versions used for:
- `sacrebleu`
- `indic-nlp-library`

Do not create unnecessary additional requirements files.

Keep the Node dependency definitions in `package.json` and its existing lockfile. These are not redundant Python requirements files.

Remove redundant nested project requirements files after consolidating their necessary dependencies.

Do not remove dependency files that belong to an actual external third-party package or model distribution unless they have been verified as unnecessary.

### C. Architecture documentation

Inspect all existing architecture and design documents.

Merge useful and still-correct information into one canonical technical document:

`docs/final_project_documentation_evidence.md`

This should become the central technical reference for the project.

Rewrite outdated descriptions to reflect the current implementation.

Document the actual architecture, not an earlier planned architecture.

Remove superseded duplicate architecture documents only after their useful information has been preserved.

The canonical document must cover:
- Overall system architecture.
- Frontend architecture.
- Translation workflow.
- ONNX Runtime Web inference.
- IndicTrans2 model integration.
- Tokenization and chunking.
- NLP preprocessing and postprocessing.
- Glossary controls.
- Entity validation.
- Spelling assistance.
- Offline execution.
- Browser/mobile design considerations.
- Evaluation pipeline.
- Benchmark findings.
- Current limitations.
- Future improvements.

Clearly distinguish completed implementation from planned or partially implemented features.

Do not claim that an Android APK, mobile-native inference, or any other feature is completed unless the actual repository proves it.

---

# PHASE 4 — Remove Unnecessary Files

After the inventory and documentation consolidation, clean the repository.

Potential candidates, subject to verification:
- Temporary Python scripts created during one-time analysis.
- Temporary extraction scripts.
- Debug output files.
- Duplicate reports.
- Old intermediate JSON/CSV files.
- Unused temporary text files.
- Stale build outputs.
- Unnecessary cache directories.
- Unused development artifacts.
- Redundant nested README files.
- Redundant project requirements files.
- Empty directories.

For generated outputs, verify whether they can be safely recreated.

Do not delete files simply because:
- They are large.
- They are not directly imported by Python.
- Their filenames are unfamiliar.
- They are not currently visible in the UI.

The models, tokenizers, resources, and benchmark assets must remain intact.

Do not delete user-created files or unrelated files outside the repository.

Do not delete the completed benchmark logs and checkpoint if they are still needed as experimental provenance. Determine whether they should be retained or safely archived.

---

# PHASE 5 — Update the Final Project Documentation

After cleaning up the repository, inspect the final source code and configuration again.

Populate:

`docs/final_project_documentation_evidence.md`

with verified project information.

Include the following sections.

### 1. Project Overview
- Project purpose.
- Problem statement.
- Objectives.
- Supported languages.
- Six translation directions.

### 2. Technology Stack
- Python version.
- Node.js version.
- Vite.
- JavaScript frontend.
- ONNX Runtime Web.
- IndicTrans2.
- Indic NLP Library.
- SacreBLEU.
- Other libraries actually used.

Include versions where they can be verified.

### 3. Model Architecture
Document all three model families and their actual local paths.

Explain the inference workflow and how the appropriate model is selected for each translation direction.

### 4. Application Architecture
Explain the interaction between:
- User interface.
- Translation controller.
- Tokenizer.
- Model inference.
- Postprocessing.
- Output display.
- Translation history.
- Glossary and settings.

### 5. NLP Processing
Explain the implemented normalization, tokenization, chunking, glossary handling, entity checks, spelling assistance, and other postprocessing steps.

Mention direction-specific behavior where applicable.

### 6. Offline Architecture
Explain how the local models and browser runtime support offline operation.

Document what is verified and what has not yet been verified.

### 7. Evaluation Methodology
Document:
- FLORES-200 devtest.
- 1,012 sentence pairs per direction.
- 6 translation directions.
- 6,072 total predictions.
- BLEU.
- chrF++.
- SacreBLEU version.
- Indic NLP normalization and tokenization.
- English tokenization and target-language preprocessing.

### 8. Final Benchmark Results

Use the exact values from:

`evaluation/results/final_results.json`

The verified results are:

| Direction | BLEU | chrF++ |
|---|---:|---:|
| English → Tamil | 17.776693 | 54.585597 |
| English → Kannada | 19.255344 | 53.568908 |
| Tamil → English | 32.204653 | 57.437847 |
| Kannada → English | 32.742676 | 58.270864 |
| Tamil → Kannada | 11.045295 | 43.288348 |
| Kannada → Tamil | 11.535107 | 46.072020 |

Macro-average BLEU: 20.759961

Macro-average chrF++: 52.203931

Do not modify these values. Verify them against the actual result file.

### 9. Qualitative Error Analysis
Use:

`evaluation/results/qualitative_error_analysis.md`

Summarize:
- Translation strengths.
- Meaning changes.
- Repetition problems.
- Named-entity errors.
- Technical terminology issues.
- Indic-to-Indic translation weaknesses.

### 10. Limitations and Future Work
Only include limitations supported by actual observations.

Distinguish implemented functionality from possible future improvements.

### 11. Reproducibility
Document:
- Installation.
- Dependency setup.
- Model asset placement.
- Indic NLP resource configuration.
- Application startup.
- Testing.
- Evaluation scoring.

Use commands verified against the actual repository.

---

# PHASE 6 — Verify the Cleaned Repository

After cleanup and documentation updates:

1. Inspect `git status`.
2. Check for broken references to deleted files.
3. Check Python imports.
4. Check JavaScript imports.
5. Check all required configuration files.
6. Check model and tokenizer asset paths.
7. Check Indic NLP resource paths.
8. Confirm all six directions still have their required assets.
9. Run available Python tests.
10. Run the production frontend build.
11. Run available application smoke tests if practical.
12. Confirm offline operation using the existing project test procedure.
13. Verify that the final benchmark results remain unchanged.
14. Verify that prediction and reference files remain unchanged.
15. Run `git diff --check`.

Do not rerun all 6,072 translations.

Do not change the scoring methodology or final scores.

If cleanup causes a test or build failure, fix the issue before declaring the repository clean.

---

# PHASE 7 — Final Cleanup Report

Create:

`docs/repository_cleanup_report.md`

Include:
- What was removed.
- What was consolidated.
- What documentation was rewritten.
- What dependencies were consolidated.
- What essential files were preserved.
- Final folder structure.
- Tests and build results.
- Any remaining redundant or uncertain files.
- Any known limitations.

Also report the final number of:
- README files maintained for the project.
- Project Python requirements files.
- Architecture documentation files.
- Temporary or intermediate files remaining.

### Important final restrictions

- Do not rerun the full benchmark.
- Do not alter predictions, references, or final scores.
- Do not delete working model assets.
- Do not delete required licenses or attribution.
- Do not remove working source code.
- Do not make unsupported claims.
- Do not commit or push changes.

The final repository must be clean, understandable, reproducible, and consistent with the completed TriLingua implementation.

At the end, provide a summary of all changes and clearly state whether the application still builds and passes its available tests.