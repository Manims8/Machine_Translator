# Stage 8.1 — Android Compatibility and APK Feasibility Study

**Project:** TriLingua  
**Study date:** 2026-11-23  
**Scope:** Inspection and planning only. No application files, model assets, build configuration, dependencies, or Android project were changed. This is the only file created for this stage.

## 1. Existing architecture findings

### Build and inference

Vite serves `app/`, uses `../models` as `publicDir`, and builds the main UI plus evaluation page to `../dist` (`vite.config.js:5-25`). `copyPublicDir:false` means model files are not copied into `dist`; a default Capacitor sync would not include them. The Vite alias forces Transformers.js to use `onnxruntime-web/wasm` (`vite.config.js:12-17`). The declared ORT dependency is `^1.21.0` (`package.json:17-20`) and the lockfile resolves `onnxruntime-web` to 1.21.0 (`package-lock.json:1378-1381`).

The app uses only the WASM execution provider, one thread, and disables the proxy (`app/src/js/translator.js:8-13,135-145`). Its model loading uses browser `fetch`, `Response`, `Request`, `URL`, `window.fetch`, typed arrays, and `performance` (`translator.js:30-123,135-145,246-370`). Remote model downloads and Transformers.js browser cache are disabled (`translator.js:14-20`). This is a plausible Capacitor WebView execution route, but it is not evidence that this exact build and model work on a phone.

Three model families cover all six directions: English→Indic 200M, Indic→English 200M, and Indic↔Indic 320M (`app/src/js/modelRouter.js:39-60,70-100`). Manifest sizes are 1,136,925,513; 951,712,545; and 1,347,246,950 bytes; each is ONNX FP32 (`models/indictrans2/model_manifest.json`, fields `size_bytes`, `precision`). Local model folders measure 1,136,903,781; 951,691,244; and 1,347,224,988 bytes, about 3.20 GiB combined. No quantized model is listed.

The app fetches model/generation config, tokenizer metadata, and separate source/target tokenizer JSON files (`translator.js:194-215`). The tokenizer loader temporarily wraps `window.fetch` to supply JSON under Transformers.js's expected `tokenizer.json` URL (`translator.js:85-123`). Graphs and external sidecars load through `fetchBytes`; it collects chunks, then copies them into a contiguous `Uint8Array` (`translator.js:55-83`). The encoder references `encoder_model.onnx.data`; both decoder graphs share `decoder_shared.onnx.data` (`modelRouter.js:29-35`). Sessions are released by `unloadTranslationModel` (`translator.js:177-185`).

For one large sidecar, this chunk-plus-copy step can temporarily hold two copies of its bytes. The largest sidecar observed locally is 805,691,392 bytes; that step alone can approach 1.61 GB decimal, before ONNX session allocations/intermediate tensors. This is a memory-risk estimate, not measured peak resident memory. One family is loaded at a time, but the JS `activeModel` retains three sessions for that family (`translator.js:24-27,228-251`). Persistent model caching is off (`translator.js:18`, fetch sets `cache:'no-store'` at `:30-42`); packaged or app-private files must be available again on each launch.

### Browser APIs and storage

No Web Worker is created in `app/src/js/`. The inference loop runs in JavaScript and may make the UI feel blocked during large operations. Translation UI also uses `navigator.clipboard.writeText`, localStorage, `crypto.randomUUID`, and HTML `<dialog>` methods (`app/src/js/app.js:19-21`, `history.js:1-7`, `glossary.js:20-31`). These need WebView checks. The separate evaluation page opens IndexedDB for checkpointed runs/predictions and uses `crypto.subtle` (`evaluationRunner.js:10-24`); translation history and glossary use localStorage. Model weights are not stored in IndexedDB.

The app can be fully offline after install only if the web bundle, WASM runtime, model configs/tokenizers, graphs, and sidecars are all available from local app assets/storage. Current desktop assets are fetched from `/indictrans2` (`modelRouter.js:3`), but Vite does not copy them to `dist`. No Android, Capacitor, or PWA artifacts exist in the repository tree. No evidence shows that the current app uses an external runtime translation API.

## 2. Android compatibility risks

- **High — model memory and size.** A 3.20 GiB on-disk set plus multi-copy load buffers/runtime tensors is a serious mobile RAM and storage concern. Actual 6 GB phone viability is **UNVERIFIED**.
- **High — model URL/source.** `copyPublicDir:false` excludes models from the Vite build (`vite.config.js:20-24`). Android must provide them explicitly and make the configured model root point to their local source.
- **Medium — WebView certification.** ONNX Runtime's browser matrix lists WASM CPU as supported in Chrome on Android ([ORT Web docs](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)). Capacitor uses Android System WebView and documents Android API 24+ support ([Capacitor Android](https://capacitorjs.com/docs/android)). This supports feasibility, but does not certify this ORT/model combination on the target devices.
- **Medium — local scheme/secure context.** Use Capacitor's local origin and a local model-serving strategy; avoid relying on `file://` semantics. Capacitor config sets `webDir` and local server options ([Capacitor configuration](https://capacitorjs.com/docs/configuration)). Exact local fetch behavior with large files in private storage must be prototyped.
- **Medium — filesystem permissions.** Android's Storage Access Framework lets the user choose files/directories without broad storage permission ([Android document picker](https://developer.android.com/training/data-storage/shared/documents-files)). App-specific files need no broad permission but are removed on uninstall ([Android app-specific storage](https://developer.android.com/training/data-storage/app-specific)). Plan explicit free-space checks, copy verification, recovery, and an uninstall warning.
- **Low/Medium — UI APIs/lifecycle.** Check clipboard, dialog support, localStorage, IndexedDB if the evaluation page ships, app backgrounding during model load, and low-memory process death on physical WebView versions.

## 3. ORT Web versus native runtime

ORT's official Web guide lists WASM CPU support in Chrome on Android and describes WASM as its CPU provider ([ORT Web support matrix](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)). WASM is a reasonable first target. The likely issue is model loading, speed, or memory on real devices, not basic absence of the provider. No inference implementation change is justified before device measurements.

Native ONNX Runtime Android is a fallback, not a prerequisite for a Capacitor wrapper. Official install docs list `com.microsoft.onnxruntime:onnxruntime-android` for Java/Kotlin ([ORT install docs](https://onnxruntime.ai/docs/install/)). A native route would need a Capacitor plugin and a port/bridge for tokenizer, encoder/decoder loops, tensor/cache handling, progress/cancel, and script conversion. It increases effort and does not shrink model files by itself.

## 4. Model distribution options

Current Android App Bundle FAQ states a 500 MB maximum compressed base-module download and points larger cumulative downloads to Play delivery services or external distribution ([Android App Bundle FAQ](https://developer.android.com/guide/app-bundle/faq?hl=en)). A 1.5 GB per asset-pack figure is documented on Android's game publishing page ([Play game size limits](https://developer.android.com/games/playgames/publish-deploy)); eligibility of this non-game student translator for that flow is **UNVERIFIED** and must not be assumed. Direct sideloading has a different path, but transferring/installing a multi-gigabyte APK remains cumbersome. Check the intended channel's current rules before release.

| Option | Advantages | Disadvantages and compatibility risks | Effort | Offline reliability | Storage |
|---|---|---|---|---|---|
| **A. Bundle all models** | Works after install without import; single artifact | ~3.20 GiB payload; package/build/sync size; asset compression and large-file reads need proof; every app update carries model changes | Medium then high maintenance | High once fully installed, if local fetch is verified | ~3.20 GiB plus app/install/temp space |
| **B. Small app plus model import** | Small app; choose one model family; reuses JS pipeline; no broad storage permission with SAF | Import UX, free-space/cancel/recovery, integrity checks, and local serving bridge required; initial model transfer still needed | Medium | High after complete import | One family about 0.89–1.26 GiB; all three ~3.20 GiB; allow temporary copy space |
| **C. Native ORT Android** | Native inference control and potential performance tuning | Major Kotlin/plugin and pipeline port; tokenizer/generation work; speedup not guaranteed; does not solve model distribution | High | High after model files installed | Same model payload plus native runtime |

Sizes above are local directory totals, not compressed APK sizes or process memory. Each route uses one shared family; all three need not be installed for an individual direction.

## 5. Recommended architecture

Begin with **B**: small Capacitor shell, existing JavaScript pipeline and WASM provider, user imports one model family into app-specific storage. This matches the current lazy family selection and avoids making the starter app a multi-gigabyte download. Use Android's Storage Access Framework picker, copy selected files into a versioned app-private directory, and expose them through a controlled local serving URL/bridge that preserves the current `fetch` semantics. Do not treat a `content://` URI as a normal relative path. Make the model root injectable instead of hard-coded (`modelRouter.js:3`).

Keep each family complete: graphs, sidecars, tokenizer source/target JSON, tokenizer metadata, model config, and generation config. In particular, keep both decoder graphs with their common `decoder_shared.onnx.data` (`modelRouter.js:29-35`). Validate names, nonzero sizes, family/version, and SHA-256 for every file before marking installed. The current manifest has family-level size/status, not per-file hashes (`model_manifest.json`; `scripts/verify_models.py:80-100`), so add a trusted file hash manifest during a future implementation step. Use temporary staging and atomic promotion so an interrupted copy cannot look installed.

If one model imports and works reliably, extend the installer to the other families. Consider native ORT only if measured WebView performance, memory, or compatibility fails. Consider bundling models only after testing packaging/distribution limits and large local asset reads on actual target devices.

## 6. Proposed structure (not created)

```text
android/                              # Capacitor Android Studio project
capacitor.config.ts                  # app ID/name, webDir: dist
app/src/android/modelInstall.js       # web-facing importer/status API
android/app/src/main/java/.../        # SAF picker, private copy, hashes, serving bridge
android/app/src/main/assets/public/   # small app bundle and local WASM
<private-files>/models/indictrans2/<family>/
  encoder_model.onnx[.data]
  decoder_model.onnx
  decoder_with_past_model.onnx
  decoder_shared.onnx.data
  tokenizer_src.json / tokenizer_tgt.json / tokenizer_meta.json
  config.json / generation_config.json / install-manifest.json
```

Keep weights out of Git and `dist`; explicit model staging avoids accidental Vite/Capacitor duplication.

## 7. Implementation plan and tools

1. Build a one-family Capacitor proof using `webDir: dist`; verify the bundled UI and WASM load from Capacitor's local origin, without release `server.url`.
2. Add a native SAF picker and app-private import with visible progress, cancel/retry, free-space checks, interrupted-copy recovery, and one-family install status.
3. Add per-file size/hash/version manifest and validation. Configure the model base path for web versus Android; preserve `fetch` semantics for large private files.
4. On a physical phone, load one family, translate short/long inputs, unload, restart, then repeat offline. Measure install size, storage, peak memory, cold model load and translation time.
5. Test six routes, model switching, offline request behavior, interrupted import, low storage, clipboard/dialog controls, app background/foreground, and process restart. Add the remaining families only after the first passes.
6. Choose sideload/APK versus store distribution only after checking the intended channel's current size rules. Sign and distribute only after device acceptance passes.

Needed: Node/npm for existing Vite plus Capacitor `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` on one matching supported major; Android Studio, SDK/platform tools, compatible JDK and generated Gradle wrapper; physical Android phone and optional emulator. Exact tool versions should be pinned during implementation after querying the machine's installed toolchain. Native ORT package is optional fallback only. Capacitor's current Android guide describes Android Studio and API 24+ support ([Capacitor Android](https://capacitorjs.com/docs/android)); Capacitor's getting-started guide describes setting `webDir` and syncing built assets ([Capacitor setup](https://capacitorjs.com/docs/getting-started)).

## 8. Device requirements, strategy, and unknowns

Use Android API 24+ as an initial Capacitor target, with current Android System WebView. There is no justified minimum RAM yet. Test a 6 GB physical phone and measure; model disk size cannot predict runtime peak memory. Allow at least the selected family's ~0.89–1.26 GiB plus app and staging space; importing all requires ~3.20 GiB plus temporary space. Emulators alone cannot establish low-memory viability.

Future acceptance: app opens without internet; an imported family passes every file hash; no runtime request leaves the device; all six routes work; model files survive process restart; unload releases sessions; partial imports are never reported as installed; errors are visible on low storage/memory; copy and core UI work. Verify offline behavior by disconnecting network/request inspection, not by status badge.

**UNVERIFIED:** exact ORT/WebView/model compatibility and speed on target phones; peak RAM/process-kill behavior and minimum RAM; safe and performant `fetch` over app-private multi-hundred-megabyte files; installed Node/JDK/Android SDK versions and Capacitor/Gradle versions to pin; Google Play delivery eligibility for this non-game app; intended distribution channel; target phone free storage; Clipboard, dialog, IndexedDB and `crypto.randomUUID` behavior across target WebViews. No Capacitor install, APK build, Android model run, or permission/storage API test was performed.
