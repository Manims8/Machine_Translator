# Translation engine architecture

## Module responsibilities

- `app/src/js/app.js` owns the simple development interface, progress display, unload action, and browser smoke-test hooks. `nlpPipeline.js` orchestrates NLP validation and translation stages.
- `app/src/js/language.js` maps language names to the IndicTrans2 tags.
- `app/src/js/modelRouter.js` is the only place that maps language pairs to model families and local model file paths.
- `app/src/js/preprocessing.js` applies Unicode NFC normalization, preserves paragraph breaks and Indic join controls, rejects invalid controls and empty input, and enforces a 20,000-character input limit.
- `app/src/js/sentenceSegmenter.js` groups sentences and uses the selected model's actual tokenizer counts to keep chunks within the model configuration's source limit.
- `app/src/js/translator.js` loads local tokenizers and ONNX files, owns one active model family, tokenizes the source, runs encoder/decoder inference, and measures loading and translation time.
- `app/src/js/postprocessing.js` converts Indic scripts to and from the Devanagari-based internal representation and normalizes decoded output while preserving paragraph breaks.

## Model routing

English to Tamil or Kannada uses `en-indic-200m-fp32`. Tamil or Kannada to English uses `indic-en-200m-fp32`. Tamil ↔ Kannada uses `indic-indic-320m-fp32`. `getModelConfig(sourceLanguage, targetLanguage)` returns the family configuration plus the selected source and target tags. Unsupported and same-language pairs are rejected.

## Tokenization and language tags

Each model folder has separate `tokenizer_src.json` and `tokenizer_tgt.json` files. Transformers.js `AutoTokenizer` loads those files through a local in-memory filename adapter because the export uses the `tokenizer_src.json`/`tokenizer_tgt.json` names while AutoTokenizer expects `tokenizer.json`. Remote models are disabled in Transformers.js.

The input sequence starts with a source language tag and a target language tag. These tell the multilingual model which language pair to translate. The text is encoded with a leading space, matching the prefix-space workaround in the reference implementation. An attention mask of `1` is added for each language tag.

## Encoder and decoder

The ONNX encoder reads the source IDs and attention mask once and returns hidden states. The first decoder graph predicts the first output token. Later steps call `decoder_with_past_model.onnx`, passing the prior decoder and encoder key/value tensors. Reusing these past tensors avoids recomputing the full decoder context for every token.

Generation stops when the configured EOS token is produced or after a 128-token safety cap. The target tokenizer decodes the generated token IDs. Timing is measured with the browser performance clock; model loading time is reported separately.

## External weights and local assets

The graph files reference external weight data. Every family uses `encoder_model.onnx.data` for the encoder and `decoder_shared.onnx.data` for both decoder graphs. `modelRouter.js` records this mapping per graph. The loader fetches each sidecar from Vite's local `/indictrans2/...` URL and passes its bytes to the ONNX session.

Vite exposes the existing `models/` directory as its public asset root and sets `build.copyPublicDir` to `false`, so the development server can read the models without copying them into `dist/`. The WASM binary and loader module are imported from the local `onnxruntime-web` package. Inference uses one WASM thread.

## Indic script conversion

The reference model expects Indic text in a shared Devanagari representation. Before tokenization, Tamil or Kannada input is mapped into that script. After decoding, a reverse script mapping produces Tamil or Kannada output. This conversion maps script characters; the neural model performs the sentence translation.

## Memory management

The engine keeps one model family loaded. Switching families releases the previous encoder, decoder, and decoder-with-past sessions before loading the next family. Temporary sidecar buffers are dropped after session initialization. Inference tensors and decoder cache outputs are disposed as they are no longer needed. The interface has an explicit unload button.

## Verification

`npm.cmd run smoke` starts the Vite development server, checks local model URLs, and uses a clean headless browser profile. The browser runs each of the six translation directions, reloads the app and repeats an English-to-Tamil translation, and records errors and timings in `evaluation/preliminary_smoke_tests.json`. The runner blocks external DNS and HTTPS while leaving the local Vite server available; this simulates offline application networking without disconnecting the computer's Wi-Fi.
