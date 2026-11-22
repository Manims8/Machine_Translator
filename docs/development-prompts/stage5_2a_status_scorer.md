# STAGE 5.2A – FIX PREDICTION STATUS AND STRICT EVALUATION SCORER

Project: D:\python\Machine_Translator

Continue from the existing Stage 5 implementation.

IndicNLP is already installed and its Tamil and Kannada normalization/tokenization tests have passed.

The resource repository exists at:

resources/indic_nlp_resources/

The project-relative IndicNLP preprocessing module has already been created:

scripts/indic_evaluation_preprocessing.py

Do not reinstall IndicNLP.

Do not redownload FLORES-200.

Do not modify the three pretrained models.

Do not modify the existing translation engine.

## TASK 1: FIX PREDICTION STATUS

Inspect:

app/src/js/evaluationRunner.js

Inspect the actual translation function and its return structure.

Every successful prediction must contain:

{
    "id": 1,
    "source": "...",
    "reference": "...",
    "prediction": "...",
    "source_language": "eng_Latn",
    "target_language": "tam_Taml",
    "model": "en-indic-200m",
    "translation_time_ms": 400,
    "status": "success"
}

Use actual values, never examples or hardcoded results.

Only assign status="success" when inference and postprocessing complete successfully and return a non-empty string.

For a failed sentence, record:

"status": "failed",
"error": "Actual error message"

Do not silently skip failed sentences.

Save prediction records in the existing project structure.

Preserve FLORES sentence IDs.

## TASK 2: STRICT PYTHON SCORER VALIDATION

Modify:

scripts/score_evaluation.py

Inspect the exact existing reference JSONL schema before changing the scorer.

Implement validation for:

1. Duplicate reference IDs.
2. Duplicate prediction IDs.
3. Missing prediction IDs.
4. Extra prediction IDs.
5. Empty references.
6. Empty predictions.
7. Incorrect prediction status.
8. Incorrect source language.
9. Incorrect target language.
10. Incorrect source text associated with an ID.
11. Missing translation time.
12. Invalid UTF-8 or malformed JSONL.
13. Wrong dataset alignment.

Do not silently discard invalid entries.

Do not calculate BLEU or chrF++ when validation fails.

Do not overwrite previous results when a validation error occurs.

## TASK 3: SUPPORT PILOT AND FULL DATASETS

Implement two validation modes.

Pilot mode:
Expected 25 records per direction.

Full mode:
Expected 1,012 records per direction.

Use the expected dataset size from the selected evaluation configuration or an explicit command-line argument.

Do not automatically interpret every incomplete file as a full evaluation.

## TASK 4: INDICNLP INTEGRATION

Use the existing module:

scripts/indic_evaluation_preprocessing.py

Ensure scorer initialization automatically configures:

resources/indic_nlp_resources/

Do not depend on an environment variable set manually in PowerShell.

Test:

- Tamil normalization.
- Kannada normalization.
- Tamil tokenization.
- Kannada tokenization.
- English-target preprocessing.

Save test results to:

evaluation/results/stage5_2a_tests.json

Use UTF-8 file output to avoid PowerShell console encoding problems.

## TASK 5: CREATE AUTOMATED VALIDATION TESTS

Create temporary test fixtures.

Test:

- Valid successful prediction.
- Missing prediction.
- Duplicate prediction.
- Extra prediction.
- Failed prediction status.
- Empty prediction.
- Incorrect language code.
- Mismatched source text.
- Duplicate reference ID.

Do not insert test fixtures into the actual benchmark prediction directories.

## TASK 6: FINAL VERIFICATION

Run:

.\.venv\Scripts\python.exe -m py_compile scripts\score_evaluation.py scripts\indic_evaluation_preprocessing.py

Run the scorer validation tests.

Run the existing six-direction smoke test only after the changes are complete.

Run:

npm.cmd run build

Do not start the 150-translation pilot.

Do not start the full benchmark.

Do not commit or push files.

## FINAL REPORT

Report:

- Files changed.
- Prediction status implementation.
- Scorer validation results.
- IndicNLP integration results.
- Individual automated test outcomes.
- Build result.
- Six-direction smoke result.
- Remaining issues.

Separate passed tests, failed tests and tests not performed.