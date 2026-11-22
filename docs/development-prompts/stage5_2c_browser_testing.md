# STAGE 5.2C – REAL BROWSER TESTING OF THE EVALUATION RUNNER

Project: D:\python\Machine_Translator

The Stage 5.2B evaluation runner has been implemented.

Your task is to verify its actual browser functionality.

IMPORTANT:
Do not redesign or rewrite the evaluation runner unless a genuine defect is discovered.

Do not start the 150-sentence pilot.

Do not start the full 6,072-translation benchmark.

Do not calculate or report BLEU scores.

Do not modify the production translation engine.

## 1. Inspect the implementation

Inspect:

- app/evaluation.html
- app/src/js/evaluationRunner.js
- app/src/css/evaluation.css
- evaluation/dataset/dataset_metadata.json

Understand the actual IndexedDB database schema and run-management functions.

## 2. Create an isolated browser test dataset

Create a temporary test-only JSONL dataset containing five short sentences.

Use valid source and target language codes.

Test at least these directions:

- English → Tamil
- Tamil → English

Use actual production IndicTrans2 inference.

Mark all outputs as test-only.

Do not save test predictions into the final benchmark prediction directories.

Do not score the test references.

Keep the test dataset and outputs separate from FLORES-200 benchmark results.

## 3. Test prediction persistence

Start an isolated test run.

Allow at least one actual sentence translation to complete.

Verify:

- Prediction is saved in IndexedDB.
- Status is "success" for successful inference.
- Sentence ID is retained.
- Source and target language codes are correct.
- Model family is correct.
- Translation time is recorded.

Check the stored IndexedDB record directly.

## 4. Test pause and resume

Start a five-sentence test run.

After at least one successful prediction:

1. Pause the evaluation.
2. Wait and confirm that no additional sentence starts.
3. Inspect the saved checkpoint.
4. Confirm that completed predictions are retained.
5. Resume.
6. Confirm that completed IDs are not translated again.
7. Confirm that remaining sentences are processed.

Record actual results.

## 5. Test browser refresh recovery

Use a separate test run.

1. Complete at least one sentence.
2. Pause the run.
3. Refresh the browser.
4. Restore the checkpoint.
5. Verify the run ID.
6. Verify direction and dataset checksum.
7. Verify completed sentence IDs.
8. Resume the run.
9. Confirm that no completed sentence is duplicated.

This must be tested through actual browser interaction.

## 6. Test cancel

Start another isolated test run.

Cancel after at least one completed prediction.

Confirm:

- No new sentences are scheduled.
- Existing successful predictions remain stored.
- The checkpoint remains recoverable.
- The cancelled run does not appear as completed.

## 7. Test checkpoint isolation

Verify that these runs cannot accidentally reuse each other's results:

- English → Tamil versus Tamil → English.
- Pilot versus full evaluation.
- Different dataset checksums.

Use test data only.

## 8. Test exports

Export the completed test predictions as:

- JSONL
- CSV
- Plain text

Actually download and inspect the files.

Verify:

- JSONL parses successfully.
- CSV columns are correctly escaped.
- Tamil characters are preserved.
- Kannada characters are preserved.
- IDs are sorted.
- No duplicate IDs exist.
- Status is included.
- Language codes are correct.
- Translation time is included.

Do not merely test that clicking the export button produces a download event. Inspect the downloaded file contents.

## 9. Browser testing method

Use Playwright or another actual browser automation tool if available.

Do not simulate successful browser interaction using unit tests alone.

If browser automation is unavailable, provide manual testing instructions and mark those features as untested.

## 10. Cleanup

Only remove isolated test records after their exported files and test results have been verified.

Do not delete any existing production evaluation data.

Do not clear existing IndexedDB data without explicit inspection.

## 11. Save the report

Create:

evaluation/results/stage5_2c_browser_tests.json

Include:

- Test name.
- Test conditions.
- Expected behaviour.
- Actual behaviour.
- Pass/fail status.
- Evidence or observations.
- Remaining defects.

## 12. Final verification

Run:

npm.cmd run build

npm.cmd run smoke

Report all results separately.

Do not start the pilot or full benchmark.

Do not commit or push automatically.

Stop after the browser tests and final verification.