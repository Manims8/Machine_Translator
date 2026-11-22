# STAGE 5.2B – EVALUATION RUNNER AND INDEXEDDB IMPLEMENTATION

Project: TriLingua

Project directory:
D:\python\Machine_Translator

Stage 5.2A is partially complete.

The Python scorer has been replaced with a stricter implementation.

The following are already working:

- Python compilation.
- IndicNLP preprocessing integration.
- Six-direction production translation.
- Production build.
- Offline browser refresh.

The remaining problem is the JavaScript evaluation runner.

Your task is to complete and test:

1. Successful and failed prediction status handling.
2. IndexedDB checkpointing.
3. Pause and resume.
4. Cancel.
5. Browser refresh recovery.
6. JSONL export.
7. CSV export.
8. Evaluation runner browser tests.

IMPORTANT:

Do not rewrite the Python scorer.
Do not redownload FLORES-200.
Do not redownload translation models.
Do not modify the production translation engine.
Do not start the 150-sentence pilot.
Do not start the full benchmark.

## 1. Inspect current files

Inspect:

app/evaluation.html

app/src/js/evaluationRunner.js

app/src/css/evaluation.css

app/src/js/nlpPipeline.js

app/src/js/modelRouter.js

evaluation/dataset/dataset_metadata.json

evaluation/dataset/flores200_devtest_parallel.jsonl

evaluation/references/

Understand the actual function signatures and existing IndexedDB implementation before editing.

## 2. Prediction status handling

Every prediction must be stored with:

- id
- source
- reference
- prediction
- source_language
- target_language
- model
- translation_time_ms
- status

Successful inference must produce:

status = "success"

Failed inference must produce:

status = "failed"

A translation is successful only if:

- Inference completes.
- Output is a valid non-empty string.
- Postprocessing completes.
- There is no fatal model error.

Store actual errors in an error field.

Never mark failed output as successful.

Do not silently skip sentence IDs.

Ensure all six language directions use the correct source and target language codes.

## 3. IndexedDB implementation

Create a reliable local evaluation database.

Each run must store:

- Unique run ID.
- Dataset SHA-256.
- Evaluation mode.
- Language direction.
- Completed sentence IDs.
- Prediction records.
- Current status.
- Last updated timestamp.

Separate different directions and different pilot/full runs.

Reject incompatible checkpoints when the dataset checksum does not match.

Save each prediction and checkpoint using a completed IndexedDB transaction before reporting it as safely persisted.

Implement:

savePrediction()
saveCheckpoint()
loadCheckpoint()
getCompletedSentenceIds()
getRemainingSentenceIds()
clearCheckpoint()

Avoid storing large model weights or tensors in IndexedDB.

## 4. Pause, resume and cancel

Pause:

- Finish the current inference.
- Save its prediction.
- Do not start the next sentence.

Resume:

- Retrieve the correct checkpoint.
- Skip completed sentence IDs.
- Continue from remaining IDs.

Cancel:

- Stop scheduling additional translations.
- Preserve successfully completed predictions.
- Keep the checkpoint unless explicitly cleared.

Browser refresh:

- Recover the correct run.
- Restore completed sentence count.
- Allow resumption.

Prevent duplicate prediction records.

## 5. Export

Implement:

- JSONL.
- CSV.
- Plain text.

Exports must:

- Be UTF-8.
- Preserve Tamil and Kannada.
- Include the prediction status.
- Include language codes.
- Include sentence IDs.
- Preserve model and timing metadata.
- Be sorted by sentence ID.

Use the browser Blob API to generate downloadable files.

Do not claim that browser downloads automatically write files into the project directory.

## 6. Browser testing

Use actual browser interactions.

Test:

1. Open evaluation.html.
2. Import a local dataset.
3. Select a direction.
4. Start a small test run.
5. Confirm successful prediction status.
6. Pause the run.
7. Confirm no new sentence starts.
8. Resume.
9. Refresh the browser.
10. Restore the checkpoint.
11. Confirm completed IDs are not duplicated.
12. Cancel the remaining work.
13. Export JSONL.
14. Parse the exported JSONL.
15. Export CSV.
16. Verify Tamil and Kannada Unicode.

Use temporary test records, not the actual full benchmark.

If browser automation cannot be executed, clearly provide manual test instructions.

Do not mark untested features as passed.

## 7. Persistence validation

Test recovery using a temporary evaluation run.

Verify:

- Checkpoint survives browser refresh.
- Completed predictions survive refresh.
- Dataset checksum is checked.
- Wrong-direction checkpoints are not reused.
- Pilot checkpoints are not reused as full-evaluation checkpoints.
- Duplicate IDs are prevented.

## 8. Build and regression

Run:

npm.cmd run build

npm.cmd run smoke

Verify all six existing production translation directions.

Verify external network dependency count remains zero in the existing offline smoke test.

## 9. Documentation