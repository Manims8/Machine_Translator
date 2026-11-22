# Debug TriLingua: 5 sentences work, but 25 sentences fail

We have a working local ONNX machine translation application for English, Tamil, and Kannada.

**The issue:**
- I tested translation with 5 sentences. All 5 translated successfully and I could export the predictions.
- When I increased the test to 25 sentences, the translation process failed.
- I don't know whether the failure is happening during dataset loading, tokenization, model inference, batch processing, saving predictions to IndexedDB, or exporting the results.

Please investigate this systematically.

## Important instructions

1. Do not immediately rewrite or replace the working translation pipeline.
2. Do not change the ONNX models, model files, tokenizer files, or reference datasets.
3. First inspect the existing implementation and identify the exact reason the 25-sentence run fails.
4. Compare the successful 5-sentence run with the failing 25-sentence run.
5. Preserve the working 5-sentence functionality.

## Investigate these areas

**1. Dataset loading**
- Is the 25-sentence JSONL file loaded correctly?
- Are all 25 records parsed?
- Are there missing IDs, empty source sentences, malformed records, or unexpected characters?
- Does the selected language direction match the dataset?

**2. Tokenization and model inference**
- Does tokenization work for all 25 sentences?
- Are there sentences that exceed the model's input token limit?
- Does the ONNX inference process fail on a particular sentence?
- Is there a memory issue when processing more sentences?
- Is the model being loaded repeatedly or incorrectly?

**3. Sequential processing and error handling**
- Does the runner process all sentences sequentially?
- Does one failed sentence stop the entire run?
- Are there timeout, cancellation, or asynchronous execution problems?
- Is the application correctly waiting for each translation before continuing?

**4. IndexedDB persistence**
- Are successful predictions saved after every sentence?
- Does the database contain all successful predictions?
- Are duplicate IDs or run IDs causing conflicts?
- Does resuming a run correctly skip completed sentences?

**5. Export**
- Does the export function retrieve all 25 records?
- Does it export only successful predictions?
- Is the JSONL file correctly formatted?
- Does the exported file contain all expected fields?

## Add diagnostic logging

Please add useful logs showing:

- Dataset name and number of records loaded.
- Current sentence number, such as 1/25, 2/25, etc.
- Sentence ID and language direction.
- Tokenization success or failure.
- Model inference start and completion.
- Translation duration.
- IndexedDB save success or failure.
- Exact error message and stack trace when a sentence fails.
- Final counts: total, successful, failed, saved, and exported.

Do not log sensitive information unnecessarily.

## Reproduce and identify the failure

Run the same language direction using:
- 5 sentences (known working test).
- 25 sentences (failing test).

Compare both runs and identify the exact stage and sentence where the failure begins.

If possible, test whether the issue occurs with:
- The first 5 sentences.
- The first 10 sentences.
- The first 15 sentences.
- All 25 sentences.

This will help identify whether the issue is related to a specific sentence or increasing workload.

## Expected outcome

After investigating:

1. Explain the actual root cause in simple language.
2. Identify the exact file and function responsible.
3. Make the smallest safe fix.
4. Preserve the working 5-sentence test.
5. Verify that all 25 sentences translate successfully and are saved.
6. Verify that the exported JSONL contains all 25 records with correct IDs, source, reference, prediction, language fields, status, and translation time.
7. Run the existing tests and production build.

**Do not claim the problem is fixed unless the 25-sentence translation and export have actually been tested successfully.**

At the end, give me:
- Root cause.
- Files changed.
- Fix applied.
- Tests performed and their results.
- Any remaining issues.