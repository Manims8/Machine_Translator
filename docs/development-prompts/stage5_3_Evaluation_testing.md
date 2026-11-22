# TriLingua – Stage 5 Pilot Evaluation and Testing

## 1. Project background

I am developing TriLingua, an offline English–Tamil–Kannada machine translation application for my third-year Robotics and Artificial Intelligence NLP assignment.

Project location:

`D:\python\Machine_Translator`

The application uses local IndicTrans2 ONNX models and supports six translation directions.

### Supported translation directions

| Source | Target | Direction identifier |
|---|---|---|
| English | Tamil | eng_Latn-tam_Taml |
| English | Kannada | eng_Latn-kan_Knda |
| Tamil | English | tam_Taml-eng_Latn |
| Kannada | English | kan_Knda-eng_Latn |
| Tamil | Kannada | tam_Taml-kan_Knda |
| Kannada | Tamil | kan_Knda-tam_Taml |

### Existing implementation

The project already has:

- Three local ONNX model families.
- Working translation in all six directions.
- Local tokenization and NLP preprocessing.
- Indic NLP preprocessing resources.
- Vite/JavaScript frontend.
- Evaluation page.
- IndexedDB prediction storage.
- Sequential evaluation runner.
- Checkpoint and resume functionality.
- JSONL prediction export.
- FLORES-200 aligned reference datasets.
- Python SacreBLEU BLEU and chrF++ scorer.
- Evaluation validation scripts.

Do not rebuild these systems unnecessarily.

---

## 2. Current project status

The repository cleanup has been completed, committed, and pushed.

The latest verified preflight checks showed:

- Git worktree was clean before pilot preparation.
- Three ONNX model families passed checks.
- Indic NLP resource tests passed.
- Frontend production build passed.
- NLP component tests passed: 22/22.
- All six translation directions passed smoke tests: 6/6.
- Offline refresh passed with zero external origins.
- All six full reference datasets contain 1,012 aligned records.
- Six pilot reference pairs have been prepared using FLORES IDs 1–25.

The pilot reference and scorer filename-selection changes are currently working changes and have not necessarily been committed.

**Important: The 25-sentence pilot has NOT yet been run.**

Your task is to perform the pilot evaluation only.

---

## 3. Main objective

Complete a reliable 25-sentence pilot evaluation for all six translation directions.

Expected workload:

- 25 sentences per direction.
- 6 directions.
- 150 total translation attempts.

Use the actual local ONNX models.

Do not use online translation APIs, cloud translation services, or fabricated predictions.

---

## 4. Inspect before execution

Before running the evaluation, inspect:

1. Evaluation frontend and runner.
2. Pilot reference files.
3. IndexedDB database structure.
4. Prediction export implementation.
5. Python scoring script.
6. Indic NLP preprocessing module.
7. Existing tests and package scripts.

Verify that pilot mode selects the correct files.

### Pilot reference filenames

Inside `evaluation/references/`:

- eng_Latn-tam_Taml-pilot.jsonl
- eng_Latn-kan_Knda-pilot.jsonl
- tam_Taml-eng_Latn-pilot.jsonl
- kan_Knda-eng_Latn-pilot.jsonl
- tam_Taml-kan_Knda-pilot.jsonl
- kan_Knda-tam_Taml-pilot.jsonl

### Pilot prediction filenames

Inside `evaluation/predictions/`:

Use exactly the same six filenames.

The original full reference filenames must remain unchanged:

`<direction>.jsonl`

Full predictions must eventually use:

`<direction>.jsonl`

Do not add `-pilot` to full benchmark filenames.

Do not overwrite full references or existing evaluation results.

---

## 5. Execute the pilot evaluation

Run the evaluation sequentially, one direction at a time.

For each direction:

1. Load the corresponding 25-row pilot dataset.
2. Verify that all 25 records are valid.
3. Confirm source and target language identifiers.
4. Load the correct local ONNX model.
5. Translate all 25 sentences.
6. Save successful predictions incrementally to IndexedDB.
7. Preserve checkpoints.
8. Continue from completed sentence IDs if interrupted.
9. Export the predictions to the correct pilot JSONL file.

Display progress clearly:

- Current direction.
- Current sentence number.
- Total sentences.
- Successful count.
- Failed count.
- Translation time.
- Estimated remaining time, if available.

Do not silently skip failed translations.

If one direction fails, investigate and report the exact cause before claiming completion.

---

## 6. Validate exported predictions

After each direction, validate its prediction file.

Every record must contain the fields required by the existing scorer, including:

- id
- source
- reference
- prediction
- source_language
- target_language
- status
- translation_time_ms

Check:

- Exactly 25 records.
- No duplicate IDs.
- No missing IDs.
- No unexpected extra IDs.
- Correct source and target languages.
- Source text matches the corresponding reference record.
- Reference text matches exactly.
- Prediction is not empty.
- Status is successful.
- Translation time is valid.

Verify that predictions are aligned with the correct reference IDs.

Do not modify original reference text to make validation pass.

---

## 7. Calculate evaluation metrics

Only after all six prediction files pass validation, execute the Python scorer in pilot mode.

Calculate:

### BLEU
Use SacreBLEU with the existing project configuration.

### chrF++
Use SacreBLEU chrF++ with the existing project configuration.

For Tamil and Kannada target languages, use the existing Indic NLP normalization/tokenization preprocessing.

Apply the same documented preprocessing consistently to candidate and reference text.

Do not change scoring configuration simply to obtain higher scores.

Record:

- SacreBLEU version.
- BLEU tokenization settings.
- chrF++ configuration.
- Indic NLP preprocessing.
- Number of evaluated sentences.

If validation fails, do not report final scores.

---

## 8. Generate pilot reports

Save results under:

`evaluation/results/`

Generate or update:

- pilot_results.json
- evaluation_summary.md
- direction_comparison.csv
- failed_predictions.json

Do not overwrite full benchmark results.

The summary must contain:

| Translation direction | Sentences | Successful | Failed | BLEU | chrF++ |
|---|---:|---:|---:|---:|---:|
| English → Tamil | 25 | | | | |
| English → Kannada | 25 | | | | |
| Tamil → English | 25 | | | | |
| Kannada → English | 25 | | | | |
| Tamil → Kannada | 25 | | | | |
| Kannada → Tamil | 25 | | | | |

Also calculate:

- Macro-average BLEU across six directions.
- Macro-average chrF++ across six directions.
- Total successful translations.
- Total failed translations.

The macro-average must be calculated from the six direction-level scores, not by combining all candidate sentences into one score.

---

## 9. Quality analysis

Do not judge translation quality using BLEU alone.

Inspect a few translated examples from every direction.

Identify:

- Incorrect meaning.
- Missing negation.
- Incorrect named entities.
- Grammar problems.
- Word-order problems.
- Inconsistent terminology.
- Untranslated words.
- Unnecessary extra words.

Show at least three representative examples per direction, including source, reference, and model prediction.

Do not alter predictions to make them look better.

Explain that a small 25-sentence pilot is useful for testing the pipeline but is not sufficient to establish final model performance.

---

## 10. Safety and restrictions

These restrictions are important:

1. Do not modify the ONNX models.
2. Do not modify tokenizer files.
3. Do not overwrite the original full reference datasets.
4. Do not delete existing predictions or reports.
5. Do not change the working translation pipeline unless a real bug is discovered.
6. Do not invent scores.
7. Do not fabricate predictions.
8. Do not skip failures silently.
9. Do not run the full 1,012-sentence benchmark.
10. Do not commit or push changes without my approval.

If you find a bug, explain its cause and propose the smallest safe fix.

---

## 11. Final report

When the pilot is complete, provide:

1. Whether all six directions completed.
2. Successful and failed sentence counts.
3. Six BLEU scores.
4. Six chrF++ scores.
5. Macro-average BLEU.
6. Macro-average chrF++.
7. Prediction file locations.
8. Validation results.
9. Representative translation examples.
10. Any translation quality problems.
11. Any code files changed.
12. Any tests run and their results.

Clearly distinguish between:

- Translation execution success.
- Prediction export success.
- Data validation success.
- Metric calculation success.
- Actual translation quality.

**Final instruction:**

Complete only the 25-sentence pilot evaluation (150 translation attempts). Stop after producing the pilot report and wait for my approval before starting the full 1,012-sentence evaluation.

The purpose is to verify the complete evaluation pipeline before spending time on the full benchmark.