# Architecture

## Runtime flow

`app/index.html` loads the Vite browser application. `app/src/js/app.js` connects the interface to `nlpPipeline.js`, history, glossary, and spelling assistance. `modelRouter.js` maps each supported direction to one of three IndicTrans2 families. The web UI runs ONNX inference through ONNX Runtime Web's WASM backend.

The model uses an encoder followed by an autoregressive decoder. The decoder-with-past graph reuses key/value tensors from previous generated tokens. `translator.js` owns one active family, its tokenizers, and the three ONNX sessions; changing families releases the previous sessions. Model loading is measured separately from per-input translation.

Each family requires three ONNX graphs, their external weight data, source and target tokenizer JSON, tokenizer metadata/configuration, model config, and generation config. `models/indictrans2/model_manifest.json` documents the FP32 layout. The quantized folder contains INT8 graphs and sidecars. Both decoder graphs in FP32 share external weights; the quantized export has separate decoder sidecars.

## Asset and model routing

Vite serves `app/` and exposes `models/` at the local `/` asset root while setting `copyPublicDir: false`. Production `npm.cmd run build` has only `app/index.html` as an HTML input. `app/evaluation.html` remains available from the local Vite development server and is not copied to `dist/` or Android assets.

The default browser model root is `/quantized`. Set `VITE_MODELS=fp32` or use `?models=fp32` for the original models; `?models=quantized` selects INT8 explicitly. The Android staging script copies model assets separately, so an Android build must stage the intended family set before Capacitor sync. Model weights are excluded from Git and ordinary Vite output.

The ONNX WASM runtime is bundled from the installed npm package. This keeps runtime assets local to the web build, but a disconnected launch requires the HTML, JavaScript, CSS, WASM files, model graphs, sidecars, and tokenizer/configuration assets to be available locally. The browser smoke test blocks external DNS/HTTPS during a local Vite session; it does not verify a deployed PWA's disconnected cache behavior.

## Android boundary

Capacitor packages the production `dist/` web build into its Android project. `scripts/stage_android_models.mjs` stages quantized families into the Android public assets; Gradle keeps `.onnx`, `.data`, and JSON model assets uncompressed. See [Android build and device notes](ANDROID.md). The checked-in Android project is a debug-build path and does not establish a signed store release.
