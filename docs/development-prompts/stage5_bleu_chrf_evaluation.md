# STAGE 5 – MACHINE TRANSLATION EVALUATION USING BLEU AND chrF++

## Project: TriLingua – Offline English, Tamil and Kannada Machine Translator

Act as a senior NLP research engineer and Python/JavaScript developer.

Stages 1, 2, 3 and 4 have been implemented.

Your task is to implement a complete and reproducible machine translation evaluation system for TriLingua.

The evaluation must measure the translation quality of all six supported translation directions using a human-reference parallel dataset.

The primary metric is BLEU.

The supplementary metric is chrF++.

Use the pretrained IndicTrans2 model and the existing JavaScript translation pipeline.

Do not train or fine-tune models.

Do not replace the current translation architecture.

Do not use Google Translate, cloud translation APIs or any external commercial translator to generate predictions or references.

Do not modify the main translation UI unnecessarily.

Create a separate evaluation interface and Python evaluation tools.

Work directly inside the existing project and execute tests wherever possible.

---

# 1. PROJECT ENVIRONMENT

Project path:

D:\python\Machine_Translator

Operating system:

Windows 11

RAM:

16 GB

Python:

3.12.10

Node.js:

24.20.0

npm:

11.19.0

Python virtual environment:

.venv/

Existing Python package:

sacrebleu

Existing JavaScript packages:

- Vite 8.3.8
- @huggingface/transformers 3.0.2
- onnxruntime-web 1.21.0

Use npm.cmd instead of npm.

Activate the Python environment using:

.\.venv\Scripts\Activate.ps1

Do not recreate the environment.

Do not redownload the three pretrained IndicTrans2 model families.

Do not copy model weights into another directory.

---

# 2. EXISTING TRANSLATION FUNCTIONALITY

The application currently supports:

1. English → Tamil
2. English → Kannada
3. Tamil → English
4. Kannada → English
5. Tamil → Kannada
6. Kannada → Tamil

The translation engine uses three locally downloaded ONNX model configurations.

Existing inference module:

app/src/js/translator.js

Existing model router:

app/src/js/modelRouter.js

Existing NLP pipeline:

app/src/js/nlpPipeline.js

Existing preprocessing:

app/src/js/preprocessing.js

Existing postprocessing:

app/src/js/postprocessing.js

Existing sentence segmentation:

app/src/js/sentenceSegmenter.js

The Stage 3 NLP pipeline includes:

- Unicode normalization.
- Text cleaning.
- Sentence segmentation.
- Tokenizer-based chunking.
- Entity detection.
- Verified entity protection for Kannada → English.
- Local terminology glossary.
- Minimum Edit Distance.
- English spelling suggestions.
- NLP diagnostics.

Inspect the exact function signatures before modifying or importing anything.

The evaluation must use the same translation engine and correct target-script conversion as the actual application.

Do not create an independent Python translation implementation.

The JavaScript application must generate the model predictions.

Python must calculate the evaluation metrics.

---

# 3. DATASET SELECTION – FLORES-200

Use the publicly available FLORES-200 machine translation evaluation dataset.

Official repository:

https://huggingface.co/datasets/facebook/flores

Dataset ID:

facebook/flores

Use:

Split: devtest

Language codes:

English: eng_Latn

Tamil: tam_Taml

Kannada: kan_Knda

The public devtest split contains 1,012 aligned sentence examples.

We need the following language columns:

sentence_eng_Latn

sentence_tam_Taml

sentence_kan_Knda

IMPORTANT:

The Hugging Face dataset requires users to accept its access conditions.

Do not attempt to bypass the conditions.

If access is denied:

1. Report the issue.
2. Ask me to visit the dataset page and accept the conditions.
3. If authentication is required, instruct me to use the official Hugging Face CLI.
4. Do not place access tokens in source files.

The current FLORES-200 dataset card identifies the dataset as CC-BY-SA 4.0.

Include the proper attribution and licence information in the documentation.

For the academic evaluation, use the public devtest split.

Do not use the hidden test split.

Do not train or fine-tune on devtest.

Do not use the evaluation references to adjust the model outputs manually.

Do not invent or fabricate reference sentences.

---

# 4. DOWNLOAD AND PREPARE THE DATASET

Create:

scripts/download_evaluation_dataset.py

Use the Python Hugging Face datasets library where appropriate.

Install the library inside the existing virtual environment if it is not already installed.

Preferred dataset loading approach:

from datasets import load_dataset

dataset = load_dataset(
    "facebook/flores",
    "all",
    split="devtest"
)

Inspect the returned data structure before using it.

Extract:

- id
- sentence_eng_Latn
- sentence_tam_Taml
- sentence_kan_Knda

The output must contain exactly the aligned sentences required for TriLingua.

If the all configuration is unavailable, use the supported individual language configurations and join them using their shared sentence IDs.

The official dataset card explains that language-pair configurations are provided for English pairs, while the all configuration can be used for other language pairs. Entries are aligned across configurations and splits.

Do not assume the column names without inspecting the actual downloaded dataset.

Create:

evaluation/dataset/flores200_devtest_parallel.jsonl

Each row should have this structure:

{
    "id": 1,
    "english": "Example English sentence",
    "tamil": "Example Tamil reference",
    "kannada": "Example Kannada reference"
}

Preserve exact original text.

Do not translate or modify references.

Requirements:

- Exactly 1,012 records expected.
- Unique IDs.
- No empty sentences.
- UTF-8 encoding.
- Tamil characters retained.
- Kannada characters retained.
- Consistent record order.
- No duplicates.

If the downloaded split has a different number of records, stop and explain the discrepancy.

Create:

evaluation/dataset/dataset_metadata.json

Include:

- Dataset name.
- Dataset repository.
- Dataset configuration.
- Split.
- Language codes.
- Download date.
- Licence.
- Number of examples.
- File checksum.
- Dataset version or revision when available.
- Source URL.

Also create:

evaluation/dataset/native_custom_eval_template.csv

This is an optional additional evaluation dataset for sentences personally selected and reviewed by native speakers.

Columns:

id,english,tamil,kannada,reviewer,verified,notes

Do not populate it with fabricated human translations.

Keep this custom dataset separate from the FLORES-200 benchmark.

Add the downloaded benchmark data to .gitignore unless we explicitly decide to distribute it with the required attribution.

---

# 5. PREPARE SIX TRANSLATION DATASETS

Use the same aligned sentence triples to generate six language-pair evaluation sets.

Create the following directories:

evaluation/references/

evaluation/predictions/

evaluation/results/

The six direction identifiers:

1. eng_Latn-tam_Taml
2. eng_Latn-kan_Knda
3. tam_Taml-eng_Latn
4. kan_Knda-eng_Latn
5. tam_Taml-kan_Knda
6. kan_Knda-tam_Taml

Each reference dataset must have 1,012 sentences.

Create a script:

scripts/prepare_evaluation_pairs.py

It should produce:

references/eng_Latn-tam_Taml.txt

references/eng_Latn-kan_Knda.txt

references/tam_Taml-eng_Latn.txt

references/kan_Knda-eng_Latn.txt

references/tam_Taml-kan_Knda.txt

references/kan_Knda-tam_Taml.txt

Each file must contain one reference sentence per line.

Preserve exact sentence order.

Also create a JSONL reference dataset for every language direction with:

- ID.
- Source sentence.
- Reference translation.
- Source language.
- Target language.

Verify the sentence count and IDs before continuing.

---

# 6. CREATE A DEDICATED BROWSER EVALUATION RUNNER

Create a separate evaluation page:

app/evaluation.html

Create its JavaScript controller:

app/src/js/evaluationRunner.js

Create styling:

app/src/css/evaluation.css

This page is for development and academic evaluation.

Do not add it to the main TriLingua navigation.

The evaluation page must reuse:

- Existing local ONNX models.
- Existing model router.
- Existing nlpPipeline.js.
- Existing tokenizer.
- Existing script conversion.
- Existing error handling.

Do not build a new translation engine.

## Evaluation interface

The evaluation page should display:

Title:

TriLingua – Model Evaluation

Description:

Automated multilingual translation evaluation using FLORES-200 and SacreBLEU.

Show:

- Dataset status.
- Number of loaded sentences.
- Selected language direction.
- Selected model family.
- Model loading progress.
- Translation progress.
- Completed predictions.
- Failed predictions.
- Translation duration.
- Overall evaluation status.

Provide these controls:

1. Load evaluation dataset.
2. Select translation direction.
3. Run 25-sentence pilot.
4. Run complete evaluation.
5. Pause.
6. Resume.
7. Cancel.
8. Export predictions.
9. Clear temporary evaluation cache.

Allow JSONL dataset import using a local file picker.

Do not use remote data URLs.

---

# 7. ACTUAL TRANSLATION GENERATION

The evaluation runner must call the existing JavaScript translation pipeline.

Use the actual exported function from nlpPipeline.js.

Inspect its existing signature first.

Do not guess the function name or arguments.

For every evaluation sentence:

1. Read source text.
2. Select source language.
3. Select target language.
4. Route to the correct IndicTrans2 model.
5. Run the same NLP pipeline as the user-facing application.
6. Obtain actual translated text.
7. Record translation time.
8. Record model family.
9. Record processing diagnostics.
10. Store the original dataset ID.
11. Save the generated prediction.

IMPORTANT EVALUATION RULES:

- Disable any spelling-suggestion application.
- Do not manually modify outputs.
- Do not automatically insert glossary translations.
- Glossary remains reference-only.
- Retain the production pipeline's verified entity-protection behaviour.
- Do not use reference sentences as translation input.
- Never use the target reference as a correction for the prediction.

Use the current production preprocessing and postprocessing behaviour.

Record the evaluation configuration in the result metadata.

---

# 8. EVALUATION EXECUTION AND MEMORY MANAGEMENT

There are six directions and 1,012 sentences per direction.

Total expected predictions:

6,072.

The laptop has 16 GB RAM.

Do not execute all translations concurrently.

Use sequential processing.

Recommended execution:

- Load one model family.
- Process its selected language direction.
- Save intermediate results.
- Continue to the next direction.
- Release unused model resources when appropriate.

Process a manageable number of sentences at a time.

Add checkpointing.

Use IndexedDB for temporary resumable browser evaluation state.

Do not store large evaluation outputs in localStorage.

If the browser closes unexpectedly:

- Preserve completed results.
- Allow resumption.
- Do not generate duplicate predictions for completed IDs.

Provide a smaller pilot evaluation using 25 sentences per direction.

The pilot verifies the complete generation and scoring workflow.

After the pilot passes, allow the full 1,012-sentence evaluation.

Allow an evaluation to resume from previously completed sentence IDs.

Do not silently skip failed translations.

Record failed IDs and error reasons separately.

A direction cannot be marked complete if predictions are missing.

---

# 9. SAVE PREDICTION OUTPUTS

Export predictions in these formats:

A. JSONL

Example:

{
    "id": 1,
    "source": "How are you?",
    "reference": "தமிழ் reference",
    "prediction": "தமிழில் generated output",
    "source_language": "eng_Latn",
    "target_language": "tam_Taml",
    "model": "en-indic-200m",
    "translation_time_ms": 420,
    "status": "success"
}

B. Plain text

One prediction per line.

C. CSV

Include:

- ID.
- Source.
- Reference.
- Prediction.
- Translation time.
- Model.
- Status.

Save outputs using language-pair identifiers.

Example:

predictions/eng_Latn-tam_Taml.jsonl

predictions/eng_Latn-tam_Taml.txt

predictions/eng_Latn-kan_Knda.jsonl

Continue for all six directions.

The browser evaluation page may download generated files. If so, document how to place them in the project's evaluation/predictions directory.

Do not fabricate predictions.

---

# 10. BLEU EVALUATION USING SACREBLEU

Create:

scripts/evaluate_metrics.py

Use the existing Python virtual environment.

The project already has SacreBLEU installed.

Use:

from sacrebleu.metrics import BLEU, CHRF

Implement actual corpus-level BLEU evaluation.

Do not calculate the average of individual sentence BLEU scores and call it corpus BLEU.

The evaluation must use:

- Human-reference sentences.
- Generated machine translations.
- Matching dataset IDs.
- Identical sentence order.
- Consistent target-language normalization.

## Important: Target-language-aware tokenization

Follow the evaluation procedure documented in the official AI4Bharat IndicTrans2 repository.

Inspect:

https://github.com/AI4Bharat/IndicTrans2/blob/main/compute_metrics.sh

And:

https://github.com/AI4Bharat/IndicTrans2/blob/main/scripts/preprocess_translate.py

Their evaluation procedure distinguishes English targets from Indic targets.

For English target translations:

Use SacreBLEU's standard Moses-compatible 13a tokenization.

For Tamil and Kannada target translations:

Use IndicNLP normalization and tokenization on BOTH:

- Reference translations.
- Machine-generated predictions.

Then compute BLEU with SacreBLEU's tokenize="none" because the IndicNLP tokenization has already been applied.

Use the official IndicNLP approach rather than implementing an arbitrary whitespace tokenizer.

For IndicNLP, inspect and use the appropriate:

- IndicNormalizerFactory.
- indic_tokenize.trivial_tokenize.
- Language-specific ISO code mappings.

Tamil ISO code: ta

Kannada ISO code: kn

Do not transliterate evaluation references to Devanagari.

Evaluate the actual Tamil and Kannada output scripts.

If the IndicNLP Python dependencies or resource files are missing:

- Install the required package in .venv.
- Download the required official Indic NLP resources.
- Record their versions and source.
- Do not silently fall back to another tokenizer.

Use the official source implementation as the reference.

## BLEU configuration

For English targets, use the standard SacreBLEU BLEU configuration.

For Indic targets, use the same IndicNLP-preprocessed text for references and predictions before BLEU calculation.

Use an explicitly recorded smoothing method.

Keep consistent casing and punctuation policy.

Record:

- BLEU score.
- Brevity penalty.
- Length ratio.
- Hypothesis length.
- Reference length.
- Individual 1-gram to 4-gram precision.
- SacreBLEU version.
- Metric signature.
- Tokenizer configuration.
- Normalization configuration.

Save the full metric signature to support reproducible evaluation.

---

# 11. CHRF++ EVALUATION

Use the same reference and prediction pairs.

Calculate chrF++ with:

CHRF(word_order=2)

Use the documented default character n-gram configuration unless there is a justified reason to alter it.

For Indic targets, use the same official IndicNLP preprocessing convention used for the BLEU computation.

For English targets, use the original detokenized text and the standard chrF++ implementation.

Record:

- chrF++ score.
- Character n-gram order.
- Word n-gram order.
- Beta value.
- SacreBLEU version.
- Metric signature.

Do not describe chrF++ as BLEU.

Explain the difference between word n-gram and character n-gram evaluation in documentation.

---

# 12. EVALUATION REPORTS

Create:

evaluation/results/

Inside it, generate:

1. final_results.json
2. final_results.csv
3. final_results.md
4. translation_examples.csv
5. failed_predictions.json
6. evaluation_metadata.json
7. evaluation_summary.png

The main result table should contain:

| Direction | Number of sentences | BLEU | chrF++ | Average translation time |
|---|---:|---:|---:|---:|
| English → Tamil | 1012 | Actual score | Actual score | Actual measurement |
| English → Kannada | 1012 | Actual score | Actual score | Actual measurement |
| Tamil → English | 1012 | Actual score | Actual score | Actual measurement |
| Kannada → English | 1012 | Actual score | Actual score | Actual measurement |
| Tamil → Kannada | 1012 | Actual score | Actual score | Actual measurement |
| Kannada → Tamil | 1012 | Actual score | Actual score | Actual measurement |

Do not populate scores with sample numbers.

Only include actual results from completed evaluations.

Include:

- Mean translation time.
- Median translation time.
- 95th percentile translation time.
- Failed translation count.
- Missing prediction count.
- Empty prediction count.
- Target-script validation statistics.

Do not average BLEU scores across different language pairs and present that average as a universally meaningful translation-quality score.

If you add a macro average, clearly identify it as a descriptive summary only.

Generate the chart only from completed actual scores.

---

# 13. HUMAN TRANSLATION QUALITY REVIEW

BLEU does not fully represent semantic meaning or grammatical naturalness.

Create:

evaluation/results/human_review_template.csv

Use a reproducible sample of 50 evaluation IDs.

Include:

- Sentence ID.
- Source text.
- Reference translation.
- Machine prediction.
- Direction.
- Fluency rating.
- Adequacy rating.
- Meaning-preservation rating.
- Reviewer comments.

Use a simple 1–5 rating scale.

Do not invent reviewer ratings.

Leave ratings blank until a human reviewer evaluates them.

Explain that BLEU is an automatic surface-overlap metric and must not be treated as a complete measure of semantic correctness.

---

# 14. OPTIONAL CUSTOM NATIVE-LANGUAGE EVALUATION

The project is intended for Tamil and Kannada mother-tongue translation.

Preserve the separate native_custom_eval_template.csv generated during dataset preparation.

Allow additional sentences written and verified by Tamil and Kannada speakers.

Do not merge custom results with FLORES-200 results.

Report them in a separate table.

Only include completed human-verified sentence pairs.

Do not make up native reference translations.

---

# 15. OPTIONAL NLP PIPELINE COMPARISON

If technically safe, perform a separate ablation experiment.

Compare:

A. Existing core IndicTrans2 translation path.

B. Existing Stage 3 NLP pipeline.

Use exactly the same evaluation inputs and references.

Inspect the existing exported functions before attempting this.

Do not duplicate or rewrite inference logic.

If the comparison cannot be implemented without destabilising the engine, skip it and explain why.

If completed, report both sets separately.

Do not claim the NLP pipeline improves translation accuracy unless the measured results support that conclusion.

---

# 16. VALIDATION AND DATA QUALITY

Before metric calculation, validate:

- Equal number of references and predictions.
- Matching sentence IDs.
- No duplicate IDs.
- No missing IDs.
- No empty predictions.
- Correct source and target mapping.
- Correct UTF-8 encoding.
- Correct Tamil and Kannada Unicode scripts.
- No unexpected language-pair mixing.

Do not silently discard failed outputs.

Do not compute a final BLEU score using mismatched references.

If a direction has missing predictions:

- Report incomplete.
- Calculate no final score for that direction.
- Identify missing sentence IDs.

Also create a separate basic output-language check.

Tamil target:

Check for expected Tamil Unicode script characters.

Kannada target:

Check for expected Kannada Unicode script characters.

English target:

Check that output is not predominantly an unexpected Indic script.

Treat script detection as a diagnostic, not proof of translation correctness.

---

# 17. OFFLINE EVALUATION

After downloading the dataset and any evaluation resources, evaluation must work offline.

No translation API is allowed.

No online metric calculation is allowed.

No external database is allowed.

The evaluation process must use:

- Local dataset.
- Local model files.
- Local tokenizer files.
- Local Python libraries.
- Local JavaScript dependencies.
- Local SacreBLEU implementation.

The initial dataset download may require Internet access and acceptance of the dataset's conditions.

Once acquired, do not require Internet access during prediction generation or metric calculation.

---

# 18. DOCUMENTATION

Create:

documentation/evaluation/bleu_evaluation.md

Explain:

1. Why machine translation evaluation is necessary.
2. What BLEU measures.
3. The BLEU calculation concept.
4. What n-gram precision means.
5. What brevity penalty means.
6. What chrF++ measures.
7. Why character-level evaluation is useful for Indic scripts.
8. What FLORES-200 is.
9. Why devtest was selected.
10. How the six evaluation datasets were prepared.
11. How model predictions were generated.
12. How target-specific tokenization was handled.
13. How SacreBLEU was configured.
14. How results were validated.
15. Limitations of automatic evaluation.
16. Why human evaluation is supplementary.

Create:

documentation/evaluation/results_analysis.md

Include:

- Actual six-direction results.
- Best-performing direction.
- Lowest-performing direction.
- Differences between English-Indic and Indic-Indic directions.
- Translation latency comparisons.
- Qualitative translation examples.
- Errors and incorrect translations.
- Possible reasons for weak translation performance.
- Limitations.

Do not generate conclusions until actual scores have been computed.

Cite the official FLORES-200 dataset and the IndicTrans2 evaluation methodology.

Add the dataset attribution and licence.

---

# 19. PROJECT AND GIT SAFETY

Before editing:

Run:

git status --short

Inspect staged, unstaged and untracked changes.

The previous Stage 3 files and Stage 4 plan were intentionally left untouched.

Do not:

- Reset Git.
- Delete user changes.
- Stage all files blindly.
- Commit automatically.
- Push to GitHub automatically.
- Overwrite Stage 2 baseline smoke results.
- Overwrite Stage 4 UI verification results.
- Overwrite Stage 3 NLP test results.

Use separate Stage 5 filenames.

Keep model weights excluded from Git.

Keep temporary browser data excluded.

---

# 20. ACCEPTANCE CRITERIA

[ ] FLORES-200 devtest downloaded.

[ ] Dataset access conditions respected.

[ ] 1,012 aligned sentence triples prepared.

[ ] Six reference datasets generated.

[ ] Dataset IDs verified.

[ ] Separate evaluation page created.

[ ] Existing production translation engine reused.

[ ] Pilot evaluation works.

[ ] Six-direction full evaluation attempted.

[ ] Predictions exported.

[ ] Checkpointing and resumption work.

[ ] Missing predictions detected.

[ ] Indic target tokenization follows the IndicTrans2 evaluation convention.

[ ] English target evaluation uses standard SacreBLEU tokenization.

[ ] Corpus BLEU calculated correctly.

[ ] chrF++ calculated correctly.

[ ] Metric signatures recorded.

[ ] Six-direction results generated where predictions are complete.

[ ] Translation latency statistics generated.

[ ] Human review template created.

[ ] Evaluation documentation created.

[ ] Evaluation runs offline after dataset setup.

[ ] Existing translation regression still works.

[ ] npm build succeeds.

---

# 21. FINAL REPORT

After completing Stage 5, provide:

1. Dataset download status.
2. Dataset access issues, if any.
3. Number of evaluation sentences.
4. Dataset preparation results.
5. Evaluation runner implementation.
6. Number of translations generated for each direction.
7. Failed prediction count.
8. Actual BLEU scores for completed directions.
9. Actual chrF++ scores.
10. SacreBLEU signatures.
11. Tokenization method used for each target language.
12. Mean and median translation times.
13. Qualitative examples.
14. Human review template location.
15. Offline evaluation results.
16. Errors encountered.
17. Remaining limitations.
18. Exact commands to reproduce the evaluation.

Explain the evaluation procedure in simple terms suitable for a third-year Robotics and AI engineering student.

Do not invent numerical results.

Do not claim all six directions passed if one direction has missing predictions.

Do not start Stage 6 automatically.

Stop after Stage 5 is implemented, tested and documented.