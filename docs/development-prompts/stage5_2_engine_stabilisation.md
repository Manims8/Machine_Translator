# STAGE 5.2 – EVALUATION ENGINE STABILISATION

## TriLingua – Offline English, Tamil and Kannada Machine Translator

Act as a senior Python, JavaScript and NLP evaluation engineer.

Stage 5 dataset preparation is complete.

The following have been verified:

- FLORES-200 access.
- 1,012 unique aligned English, Tamil and Kannada sentences.
- Six reference datasets in text and JSONL formats.
- Production build.
- Six-direction translation smoke tests.
- Offline browser refresh.

However, the evaluation system is NOT ready for pilot execution.

Current problems:

1. evaluationRunner.js does not consistently mark successful predictions with status="success".
2. IndexedDB checkpoint and resume behaviour has not been verified.
3. Prediction export has not been browser-tested.
4. The Python scorer lacks strict data-integrity validation.
5. IndicNLP library and resources are not installed.
6. The human review template and complete documentation are incomplete.

Your task is to fix these issues.

Do not begin the 150-translation pilot yet.

First make the evaluation system reliable and independently testable.

---

# 1. EXISTING ENVIRONMENT

Project:

D:\python\Machine_Translator

Operating system:

Windows 11

Python:

3.12.10

Node.js:

24.20.0

npm:

11.19.0

Python environment:

.venv/

Use:

.venv\Scripts\python.exe

Use npm.cmd for JavaScript commands.

Do not recreate the virtual environment.

Do not download the dataset again.

Do not download or modify the three translation models.

Do not modify the production translation engine unnecessarily.

---

# 2. IMPORTANT EXISTING FILES

Inspect:

app/evaluation.html

app/src/js/evaluationRunner.js

app/src/css/evaluation.css

scripts/score_evaluation.py

scripts/download_evaluation_dataset.py

scripts/prepare_evaluation_pairs.py

evaluation/dataset/flores200_devtest_parallel.jsonl

evaluation/dataset/dataset_metadata.json

evaluation/references/

evaluation/predictions/

evaluation/results/final_results.json

Read the actual code and understand the current data structures before modifying anything.

Do not guess function signatures.

---

# 3. FIX SUCCESSFUL PREDICTION STATUS

This is a critical bug.

The current scorer expects successful predictions to contain:

"status": "success"

Modify evaluationRunner.js.

For every successfully completed translation, generate a record with this structure:

{
    "id": 1,
    "source": "...",
    "reference": "...",
    "prediction": "...",
    "source_language": "eng_Latn",
    "target_language": "tam_Taml",
    "model": "en-indic-200m",
    "translation_time_ms": 450,
    "status": "success"
}

Use actual values.

Do not insert sample or fabricated output.

A prediction can receive status="success" only when:

1. Actual translation inference completed.
2. Translation output is non-empty.
3. Output is a valid string.
4. No fatal model error occurred.
5. The appropriate postprocessing completed.

If translation fails, record:

"status": "failed"

And include:

"error": "Meaningful error message"

Never mark a failed translation as successful.

Never silently skip a sentence.

---

# 4. FIX MODEL ROUTING AND RESULT MAPPING

Verify all six language directions.

English → Tamil:

eng_Latn → tam_Taml

English → Kannada:

eng_Latn → kan_Knda

Tamil → English:

tam_Taml → eng_Latn

Kannada → English:

kan_Knda → eng_Latn

Tamil → Kannada:

tam_Taml → kan_Knda

Kannada → Tamil:

kan_Knda → tam_Taml

Make sure each result is associated with its original FLORES sentence ID.

Do not use array position as the only identity mechanism.

Use the dataset's actual ID.

Store the correct source sentence, reference and generated prediction.

---

# 5. FIX INDEXEDDB CHECKPOINTING

Implement a robust checkpoint mechanism.

Each checkpoint must be associated with:

- Dataset SHA-256.
- Dataset version or metadata.
- Language direction.
- Evaluation mode: pilot or full.
- Sentence ID.
- Run identifier.
- Completion status.

Do not mix checkpoints belonging to different language directions.

Do not mix pilot and full evaluation.

Do not reuse results from an old dataset checksum.

For every successful prediction:

1. Save the prediction.
2. Save its status.
3. Update the completed sentence ID list.
4. Persist the checkpoint.

The save operation must finish before the runner reports the sentence as safely completed.

Use IndexedDB transactions.

Do not store the entire 1,012-sentence dataset repeatedly for every checkpoint.

Avoid localStorage for large prediction data.

Implement:

loadCheckpoint()

saveCheckpoint()

getCompletedSentenceIds()

getRemainingSentenceIds()

clearCheckpoint()

resumeEvaluation()

---

# 6. PAUSE, RESUME AND CANCEL

Implement proper state management.

Pause:

- Finish the currently executing inference.
- Save the result.
- Stop before starting another sentence.
- Preserve the checkpoint.

Resume:

- Load the correct checkpoint.
- Identify completed sentence IDs.
- Continue with only unfinished sentences.
- Do not duplicate predictions.

Cancel:

- Stop scheduling new translations.
- Safely complete or cancel the current operation.
- Save all already completed predictions.
- Preserve the checkpoint unless the user explicitly clears it.

Browser refresh:

- Restore the checkpoint.
- Display the saved progress.
- Allow resuming the operation.

Do not claim pause/resume functionality works until tested with actual browser interaction.

---

# 7. FIX PREDICTION EXPORT

Implement an export mechanism that creates downloadable files.

Export all completed predictions in the selected language direction.

Supported formats:

JSONL

CSV

Plain text

The JSONL file must have one record per line.

Example:

{"id":1,"source":"Hello","reference":"வணக்கம்","prediction":"வணக்கம்","source_language":"eng_Latn","target_language":"tam_Taml","model":"en-indic-200m","translation_time_ms":450,"status":"success"}

Ensure:

- UTF-8 encoding.
- Correct Tamil and Kannada characters.
- Stable ordering by sentence ID.
- No duplicate IDs.
- Status included.
- Correct direction metadata.
- Valid JSON.

Use Blob and URL.createObjectURL for browser downloads.

IMPORTANT:

A browser cannot directly write files into arbitrary Windows project folders.

Export downloadable files and document that I must copy the downloaded results into:

evaluation/predictions/

Do not claim the browser automatically saved the files inside the project directory.

---

# 8. INSTALL INDICNLP CORRECTLY

Follow the official AI4Bharat IndicTrans2 evaluation implementation.

Official sources:

https://github.com/AI4Bharat/IndicTrans2/blob/main/compute_metrics.sh

https://github.com/AI4Bharat/IndicTrans2/blob/main/scripts/preprocess_translate.py

https://github.com/anoopkunchukuttan/indic_nlp_library

https://github.com/anoopkunchukuttan/indic_nlp_resources

Install:

indic-nlp-library

sacremoses

Use the existing Python 3.12 virtual environment.

The IndicNLP library requires associated resources for some functions.

Clone or download the official IndicNLP resources repository into a dedicated project support folder.

Do not put it inside the translation model directories.

Configure the resource path explicitly.

Test imports:

from indicnlp import common
from indicnlp.normalize import indic_normalize
from indicnlp.tokenize import indic_tokenize

Verify that the resources are loaded correctly.

Test Tamil and Kannada normalization and tokenization.

If a package fails to install under Python 3.12:

- Record the precise error.
- Inspect compatibility.
- Try the official supported installation method.
- Do not randomly install incompatible packages.
- Do not silently replace IndicNLP with a different tokenizer.

The evaluation must not begin until the required normalization and tokenization functions have been tested.

---

# 9. IMPLEMENT OFFICIAL EVALUATION PREPROCESSING

Modify or create:

scripts/indic_evaluation_preprocessing.py

Reproduce the relevant logic from the official IndicTrans2 preprocessing script.

For English:

Use Moses punctuation normalization and Moses tokenization for IndicTrans2-compatible preprocessing when required by the evaluation pipeline.

For Tamil and Kannada:

Use:

IndicNormalizerFactory()

and:

indic_tokenize.trivial_tokenize()

Use language mappings:

Tamil: ta

Kannada: kn

Do not transliterate evaluation text into Devanagari.

Use the original target script.

For the official IndicTrans2-compatible scoring procedure:

English targets:
Use SacreBLEU's mteval-v13a tokenization.

Tamil and Kannada targets:
Normalize and tokenize both references and predictions using IndicNLP.

Then use SacreBLEU tokenize="none".

Apply the same processing to both sides of the comparison.

Record the exact preprocessing configuration.

---

# 10. STRICT SCORER VALIDATION

Modify:

scripts/score_evaluation.py

Before calculating BLEU or chrF++, validate every prediction file.

For the final benchmark:

Expected count:

1,012 references.

Expected count:

1,012 predictions.

Validate:

1. No duplicate reference IDs.
2. No duplicate prediction IDs.
3. No missing prediction IDs.
4. No extra prediction IDs.
5. No empty predictions.
6. No empty references.
7. Every prediction status equals "success".
8. Correct source language.
9. Correct target language.
10. Correct source text for each ID.
11. Correct reference mapping.
12. Correct dataset ordering.
13. No invalid Unicode output.
14. No failed record included as successful.
15. No mismatched language directions.

Do not score if any validation error exists.

Return meaningful errors.

Save detailed validation results in:

evaluation/results/failed_predictions.json

Add a validation-only mode that tests data integrity without calculating metrics.

For example:

python scripts/score_evaluation.py --validate-only

Provide a way to validate a 25-sentence pilot separately from the 1,012-sentence full dataset.

Do not accidentally apply the full 1,012-record rule to the pilot.

---

# 11. IMPLEMENT METRIC CALCULATION

Follow the official IndicTrans2 evaluation methodology.

For English targets:

BLEU with SacreBLEU Moses-compatible 13a tokenization.

For Tamil and Kannada targets:

IndicNLP normalization and tokenization on reference and prediction.

Then BLEU with tokenize="none".

For chrF++:

Use:

CHRF(word_order=2)

Apply the same IndicNLP preprocessing to Indic targets.

Save:

- BLEU score.
- BLEU signature.
- BLEU 1-gram to 4-gram precision.
- Brevity penalty.
- Length ratio.
- chrF++ score.
- chrF++ signature.
- SacreBLEU version.
- IndicNLP version.
- Preprocessing configuration.

Do not report scores for incomplete datasets.

The official IndicTrans2 repository reports chrF++ as its primary metric and additionally reports BLEU and COMET. For this college assignment, BLEU should remain prominently reported, with chrF++ as supplementary evaluation.

---

# 12. BROWSER TESTING

Use the real browser where possible.

Use Playwright if already installed or if it can be introduced without disrupting existing dependencies.

Test the following operations:

A. Import local 1,012-record dataset.

B. Select one translation direction.

C. Start a small test run.

D. Confirm that the first successful result includes status="success".

E. Confirm that the result appears in IndexedDB.

F. Pause during a run.

G. Confirm that no additional translation starts after pause.

H. Resume the run.

I. Confirm that completed IDs are not translated again.

J. Refresh the browser.

K. Recover the saved checkpoint.

L. Export predictions.

M. Parse the downloaded JSONL and verify its fields.

N. Confirm Tamil and Kannada Unicode is retained.

O. Confirm the exported sentence IDs are correct.

Do not mark any browser interaction as passed unless it was actually performed.

If automated browser interaction is unavailable, document the manual tests I need to perform.

---

# 13. ACCEPTANCE CRITERIA

[ ] Successful prediction records have status="success".

[ ] Failed predictions have status="failed".

[ ] Sentence IDs remain correct.

[ ] Model routing works in all six directions.

[ ] IndexedDB checkpointing works.

[ ] Pause works.

[ ] Resume works.

[ ] Cancel works.

[ ] Browser refresh recovers progress.

[ ] Duplicate translations are prevented.

[ ] JSONL export works.

[ ] CSV export works.

[ ] UTF-8 export works.

[ ] IndicNLP installed.

[ ] IndicNLP resources available.

[ ] Tamil normalization tested.

[ ] Kannada normalization tested.

[ ] Scorer validation works.

[ ] Missing IDs detected.

[ ] Extra IDs detected.

[ ] Duplicate IDs detected.

[ ] Incorrect statuses detected.

[ ] Incorrect source-language mappings detected.

[ ] Metric configuration recorded.

[ ] Production build succeeds.

[ ] Existing six-direction smoke tests still pass.

Do not begin the 150-translation pilot during this stabilisation stage.

---

# 14. FINAL REPORT

Provide:

1. Files modified.
2. Successful/failed status bug fix.
3. Model routing verification.
4. IndexedDB verification results.
5. Pause/resume/cancel testing results.
6. Export testing results.
7. IndicNLP installation status.
8. IndicNLP resource setup.
9. Tamil normalization test.
10. Kannada normalization test.
11. Strict scorer validation results.
12. Production build results.
13. Existing smoke results.
14. Remaining limitations.

Clearly distinguish passed tests from tests not performed.

Do not calculate or invent BLEU scores.

Do not start the 150-sentence pilot.

Do not start the full benchmark.

Stop after evaluation engine stabilisation.