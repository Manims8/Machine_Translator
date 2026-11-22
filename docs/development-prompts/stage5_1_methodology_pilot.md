# STAGE 5.1 – Evaluation Methodology Hardening and Pilot Execution

Project: TriLingua

Project path: D:\python\Machine_Translator

Stage 5 dataset acquisition and reference preparation are complete.

FLORES-200 devtest contains 1,012 aligned English, Tamil and Kannada examples.

The following have been implemented:

- Dataset downloader.
- Parallel dataset preparation.
- Six reference datasets.
- Evaluation HTML page.
- JavaScript evaluation runner.
- IndexedDB checkpoint infrastructure.
- Python SacreBLEU scorer.

However, no predictions have been generated.

Your task is to harden the evaluation methodology, test the evaluation runner and execute a 25-sentence pilot for all six directions.

Do not execute the complete 6,072 predictions until the pilot has been verified.

## 1. Inspect existing files

Inspect:

evaluation/dataset/dataset_metadata.json

evaluation/dataset/flores200_devtest_parallel.jsonl

evaluation/references/

evaluation/predictions/

evaluation/results/final_results.json

app/evaluation.html

app/src/js/evaluationRunner.js

scripts/score_evaluation.py

Do not modify the main translation engine.

Do not redownload the benchmark.

Preserve existing results and user changes.

## 2. Correct the evaluation methodology

Read the official IndicTrans2 evaluation sources:

https://github.com/AI4Bharat/IndicTrans2/blob/main/compute_metrics.sh

https://github.com/AI4Bharat/IndicTrans2/blob/main/scripts/preprocess_translate.py

Implement two clearly separated evaluation configurations.

### Configuration A: IndicTrans2-compatible evaluation

For English target translations:

Use standard SacreBLEU Moses-compatible tokenization for BLEU.

For Tamil and Kannada target translations:

Use the official IndicNLP normalization and tokenization approach on BOTH the references and predictions.

Then calculate BLEU using SacreBLEU tokenize="none".

Use the same preprocessed Indic text for chrF++.

Use chrF++ with word_order=2.

Install required Python dependencies and official IndicNLP resources.

Record versions and source locations.

Do not use a simplistic whitespace tokenizer.

Do not claim that FLORES200 tokenization is identical to IndicNLP tokenization.

### Configuration B: SacreBLEU FLORES tokenizer

Optionally retain the current tokenizer configuration as a separate supplementary result.

Label it clearly as:

SacreBLEU flores200 tokenizer evaluation.

Never mix its scores with Configuration A.

Do not calculate one direction with one configuration and another direction with a different configuration.

If IndicNLP setup fails, report Configuration A as unavailable rather than silently replacing it.

## 3. Strengthen the prediction scorer

Modify scripts/score_evaluation.py.

Before scoring each direction, verify:

- Exactly 1,012 reference records.
- Exactly 1,012 prediction records.
- No duplicate reference IDs.
- No duplicate prediction IDs.
- No missing prediction IDs.
- No extra prediction IDs.
- No empty predictions.
- No empty references.
- Every prediction has status="success".
- Correct source language.
- Correct target language.
- Source text matches the source sentence associated with the same reference ID.
- Correct target-language mapping.
- UTF-8 text integrity.

Do not silently drop invalid records.

Do not score an incomplete direction.

Save detailed errors to:

evaluation/results/failed_predictions.json

Ensure that the scoring process fails safely instead of producing misleading results.

## 4. Verify the evaluation runner

Inspect evaluationRunner.js.

Test:

- Dataset import.
- Direction selection.
- Model selection.
- Sequential inference.
- Progress reporting.
- IndexedDB checkpoint creation.
- Pause.
- Resume.
- Cancel.
- Export.
- Reload and recovery.

Use actual browser interaction.

Do not claim IndexedDB recovery works unless the browser has been refreshed and the saved state recovered.

Do not run six model directions concurrently.

Use one model family at a time.

## 5. Execute 25-sentence pilot

Run a pilot with 25 aligned sentence IDs for each of the six directions.

Total:

150 generated translations.

Save pilot predictions in a separate location:

evaluation/predictions/pilot/

Do not overwrite final prediction files.

For every prediction, record:

- Sentence ID.
- Source.
- Reference.
- Actual translation.
- Source language.
- Target language.
- Model family.
- Translation time.
- Status.
- NLP pipeline diagnostics.

Use the actual existing JavaScript translation engine.

Do not use an external translation API.

## 6. Score the pilot

Calculate BLEU and chrF++ for all six pilot directions.

Because the pilot has only 25 sentences, clearly label these results as preliminary pilot scores, not final benchmark results.

Save:

evaluation/results/pilot_results.json

evaluation/results/pilot_results.csv

evaluation/results/pilot_summary.md

Also save the metric configuration and signatures.

## 7. Test translation quality and integrity

Check output scripts:

- Tamil predictions should contain expected Tamil script characters.
- Kannada predictions should contain expected Kannada script characters.
- English predictions should be English-readable.

Script detection is a diagnostic only.

Check for:

- Empty translations.
- Repeated output.
- Missing punctuation.
- Untranslated source text.
- Unexpected internal script output.
- Model inference failures.

Do not manually correct model outputs.

Record examples that appear unnatural or semantically incorrect.

## 8. Test offline operation

After dataset and library setup, run pilot generation and scoring without external network access.

The existing local translation models must be used.

The evaluation must not call remote translation APIs.

Record exact offline test conditions.

## 9. Final report

Provide:

- Evaluation methodology changes.
- IndicNLP setup status.
- Scorer validation tests.
- Browser interaction test results.
- Pilot completion count.
- Six-direction pilot BLEU scores.
- Six-direction pilot chrF++ scores.
- Translation latency.
- Failed prediction IDs.
- Offline evaluation result.
- Remaining issues.

Do not start the complete benchmark until reporting the pilot results.

Do not start Stage 6.

Stop after the pilot has been scored successfully or the remaining blockers are clearly documented.