# Engineering challenges

## Unicode and Indic scripts

Canonical Unicode equivalents can have different code-point sequences, while Indic join controls may change spelling/rendering. The input pipeline uses NFC, preserves ZWJ/ZWNJ, rejects unsupported controls, and converts Tamil/Kannada to the model's shared representation before inference. Output is converted back to the requested script. Component checks cover these transformations; they do not establish translation quality.

## Sentence boundaries and token limits

Character length does not predict subword token count, and punctuation inside abbreviations, decimal values, and URLs can confuse sentence splitting. The segmenter groups neighboring sentences, counts with the active tokenizer, and respects paragraph boundaries. Overlong sentences are split at whitespace. An indivisible whitespace-delimited token above the model limit fails safely before inference.

## Placeholder reliability

The model may omit or rewrite rare placeholder strings. Testing exact application markers across all six directions showed entity round trips were safe only for Kannada-to-English. Glossary marker restoration failed integration checks, so glossary terms remain stored references and automatic substitution stays disabled. Separate route gates prevent an unverified direction from silently restoring corrupted values.

## Different model families and translation quality

English-to-Indic, Indic-to-English, and Indic-to-Indic use separate model families. Passing a smoke test confirms that a route executes and returns output, not that the meaning is correct. The recorded corpus and paired INT8 evidence in [Evaluation](EVALUATION.md) show weaker direct Tamil/Kannada results and representative errors; names, technical terms, numbers, and formal text need careful review.

## Latency, memory, and offline limits

Model loading is separate from inference timing. Long documents require sequential chunks and can take substantially longer than a short sentence. ONNX sidecars and runtime tensors use significant memory; desktop browser and one-device Android readings are not a minimum-device guarantee. A local-server browser test with external requests blocked does not demonstrate that a deployed web app can reopen offline without a service worker or cached assets.
