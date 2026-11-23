# Stage 10.1 — Repository cleanup plan (read-only audit)

**This phase changed no existing project file.** This plan is the only file to create in Stage 10.1 and must be deleted in the final cleanup phase. No files are deleted, renamed, or rewritten by this plan.

## Audit scope and repository boundaries

- The parent repository has 193 tracked paths. The initial scan had no Git-visible untracked paths; during this audit `.idea/deviceManager.xml` appeared as one untracked IDE-local file (it was not created or edited by me). The separately initialized reference submodule has 7 tracked files. Relevant ignored evaluation artifacts are enumerated below because Git status otherwise hides them.
- `models/` contains no `.git` directory or `.git` file anywhere in its model trees; `git ls-files --stage models` shows only `models/README.md` and `models/indictrans2/model_manifest.json`. Model weights are not Git submodules or checked-out clones.
- `.gitmodules` declares `references/indictrans2-onnx-browser-demo`. Its separate Git directory is present, its working tree is clean, and its `HEAD` matches the parent’s recorded gitlink (`ec2f3ad05008240805934c9638aba5b18b71679f`). The reference project is not used by app imports. **This plan does not propose changing or deleting that submodule.** Ask before any later action there.
- `android/` build outputs, `android/app/src/main/assets/public/`, `dist/`, `node_modules/`, `.gradle*`, and model weights are excluded from file-by-file inventory as requested. The ignored local `.venv/`, `.tools/`, and `.android-sdk/` are machine toolchains/caches, not project source; they are likewise left alone. `dist/index.html` and `dist/evaluation.html` were read-only inspected for the requested production-page check.
- The tracked `android/` Gradle project and source resources are included below; no generated APK/build contents are inventoried.
- A repository-wide text search was performed before each deletion proposal. The per-file inventory records known references; the deletion audit below records the generated-file writers and stale-document references that need attention before removal.

## 1. File-by-file inventory and disposition

`KEEP`, `DELETE`, `RENAME`, and `REWRITE` are proposals for the final cleanup phase only. “Referenced by” means an import, build/input relationship, generator, or textual path mention found during the audit. An empty reference list means the whole-repository filename search found no consumer; it does not imply that the file is safe to delete before the documented merge/regression checks.

### Root and IDE metadata

| Path | Action | New name | Reason | Referenced by |
|---|---|---|---|---|
| `.gitignore` | REWRITE | — | Keep weight/build ignores and explicitly unignore the evidence files listed in the results policy. | Git ignore engine; currently ignores predictions and `evaluation/results/*` except `.gitkeep`. |
| `.gitmodules` | KEEP | — | Preserve provenance of the external demo submodule. | Git; `docs/PROJECT_AUDIT.md` currently explains it. |
| `.idea/.gitignore` | DELETE | — | Machine-specific IDE project metadata; replace with a root `.idea/` ignore. | No source reference found. |
| `.idea/Machine_Translator.iml` | DELETE | — | IDE project file, not needed by npm, Python, Vite, or Gradle. | `.idea/modules.xml` only; that file is also proposed for deletion. |
| `.idea/caches/deviceStreaming.xml` | DELETE | — | IDE cache state. | No source reference found. |
| `.idea/deviceManager.xml` (untracked; appeared during audit) | DELETE/IGNORE | — | Local IDE device table; keep outside the course submission. | Whole-repository search found no reference. |
| `.idea/misc.xml` | DELETE | — | IDE-local configuration. | No source reference found. |
| `.idea/modules.xml` | DELETE | — | IDE module registry. | References `.idea/Machine_Translator.iml`; both are deleted together. |
| `.idea/vcs.xml` | DELETE | — | IDE-local VCS mapping; Git already has repository metadata. | No source reference found. |
| `README.md` | REWRITE | `README.md` | Replace stale setup/status/evaluation claims with the final supported web+Android workflow and links to the five canonical docs. | Root entry point; currently points to `docs/final_project_documentation_evidence.md`, cleanup inventory/report, old smoke output, and result files. |
| `capacitor.config.json` | KEEP | — | Required Capacitor app id/name/webDir configuration. | Capacitor CLI/sync. |
| `package.json` | REWRITE | `package.json` | Keep used dependencies; add clear test/summarize/Android scripts, fill author/license only after user decision, align version. | npm and `package-lock.json`; current visible app version says `v0.4.0` while package says `0.1.0`. |
| `package-lock.json` | REWRITE | `package-lock.json` | Regenerate only after a deliberate `package.json` metadata/dependency edit. | npm install. |
| `requirements.txt` | REWRITE | `requirements.txt` | Pin direct Python dependencies only after a clean-environment check; add missing direct `onnx` and `psutil`. | Python scripts and README environment setup. |
| `vite.config.js` | REWRITE | `vite.config.js` | Keep model serving and Android-relative-base behavior; stop making the developer evaluation page a production entry. | `npm run build`, dev server; currently has `main` and `evaluation` build inputs. |

### Android project files (tracked source; generated build outputs excluded)

| Path | Action | New name | Reason | Referenced by |
|---|---|---|---|---|
| `android/.gitignore` | KEEP | — | Android-local build ignores. | Git ignore engine. |
| `android/app/.gitignore` | KEEP | — | App-module generated-file ignores. | Git ignore engine. |
| `android/app/build.gradle` | KEEP | — | Required native build configuration, including `noCompress` for ONNX/data/JSON. | Android Gradle plugin. |
| `android/app/capacitor.build.gradle` | KEEP | — | Capacitor-generated plugin wiring required by Gradle. | `android/app/build.gradle`. |
| `android/app/proguard-rules.pro` | KEEP | — | Standard Android release-build configuration. | Android build config. |
| `android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java` | DELETE | — | Uncustomized Capacitor sample test; no project code or source references found. | No references found. |
| `android/app/src/main/AndroidManifest.xml` | KEEP | — | App entry point and permissions. | Android build/runtime. |
| `android/app/src/main/java/com/trilingua/app/MainActivity.java` | KEEP | — | Capacitor bridge activity. | Manifest. |
| `android/app/src/main/res/drawable-land-hdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-land-mdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-land-xhdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-land-xxhdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-land-xxxhdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-port-hdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-port-mdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-port-xhdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-port-xxhdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-port-xxxhdpi/splash.png` | REWRITE | same resource path | Replace scaffold splash art with approved TriLingua branding. | Android splash resource selection. |
| `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` | REWRITE | same resource path | Use approved foreground mark rather than default Capacitor artwork. | Android adaptive launcher icon resource. |
| `android/app/src/main/res/drawable/ic_launcher_background.xml` | REWRITE | same resource path | Align the adaptive-icon background with the approved brand palette. | Android adaptive launcher icon resource. |
| `android/app/src/main/res/drawable/splash.png` | REWRITE | same resource path | Replace scaffold splash artwork. | Android splash resource. |
| `android/app/src/main/res/layout/activity_main.xml` | KEEP | — | Capacitor activity layout. | Native activity. |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | KEEP | — | Adaptive icon definition; retain path while replacing artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | KEEP | — | Round adaptive icon definition; retain path while replacing artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | REWRITE | same resource path | Replace with approved launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png` | REWRITE | same resource path | Replace with approved launcher foreground artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` | REWRITE | same resource path | Replace with approved round launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | REWRITE | same resource path | Replace with approved launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png` | REWRITE | same resource path | Replace with approved launcher foreground artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` | REWRITE | same resource path | Replace with approved round launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | REWRITE | same resource path | Replace with approved launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png` | REWRITE | same resource path | Replace with approved launcher foreground artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` | REWRITE | same resource path | Replace with approved round launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | REWRITE | same resource path | Replace with approved launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png` | REWRITE | same resource path | Replace with approved launcher foreground artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` | REWRITE | same resource path | Replace with approved round launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | REWRITE | same resource path | Replace with approved launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` | REWRITE | same resource path | Replace with approved launcher foreground artwork. | Android launcher resource system. |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` | REWRITE | same resource path | Replace with approved round launcher artwork. | Android launcher resource system. |
| `android/app/src/main/res/values/ic_launcher_background.xml` | REWRITE | same resource path | Keep the adaptive icon background in sync with brand assets. | Adaptive icon XML. |
| `android/app/src/main/res/values/strings.xml` | REWRITE | same resource path | Confirm Android label/title match TriLingua and the web title. | Android resources/manifest. |
| `android/app/src/main/res/values/styles.xml` | KEEP | — | Native launch/theme configuration. | Android manifest/activity. |
| `android/app/src/main/res/xml/file_paths.xml` | KEEP | — | Capacitor file-provider configuration. | Manifest provider. |
| `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java` | DELETE | — | Uncustomized Capacitor sample test; no project code or source references found. | No references found. |
| `android/build.gradle` | KEEP | — | Root Android plugin/repository configuration. | Gradle settings. |
| `android/capacitor.settings.gradle` | KEEP | — | Capacitor plugin inclusion. | `android/settings.gradle`. |
| `android/gradle.properties` | KEEP | — | Gradle memory and AndroidX settings. | Gradle wrapper/build. |
| `android/gradle/wrapper/gradle-wrapper.jar` | KEEP | — | Required Gradle wrapper binary. | `gradlew`/`gradlew.bat`. |
| `android/gradle/wrapper/gradle-wrapper.properties` | KEEP | — | Gradle distribution/version pin. | Gradle wrapper. |
| `android/gradlew` | KEEP | — | Unix build wrapper. | Android build instructions. |
| `android/gradlew.bat` | KEEP | — | Windows build wrapper. | Android build instructions. |
| `android/settings.gradle` | KEEP | — | Android project module configuration. | Gradle. |
| `android/variables.gradle` | KEEP | — | Shared Capacitor Android versions/config. | Android Gradle files. |

### Web application source

| Path | Action | New name | Reason | Referenced by |
|---|---|---|---|---|
| `app/index.html` | KEEP | — | Main user interface entry; copy and labels require the UI review below. | Vite `main` input; imports `src/js/app.js` and `src/css/style.css`. |
| `app/evaluation.html` | KEEP | — | Retain the local evaluation tool as a developer-only source page; exclude it from production and Android artifacts. | Vite currently includes it as the `evaluation` build input; imports `evaluationRunner.js` and `evaluation.css`. |
| `app/src/css/evaluation.css` | KEEP | — | Evaluation-tool styles. | `app/evaluation.html`. |
| `app/src/css/responsive.css` | KEEP | — | Keep only if verified as imported/linked; no current HTML import was found, so mark as an orphan candidate for a final reference recheck. | No current direct import found. |
| `app/src/css/style.css` | REWRITE | same path | Format the currently compressed stylesheet and preserve responsive styles/accessibility. | `app/index.html`. |
| `app/src/js/app.js` | REWRITE | same path; split helpers into named UI modules if scope allows | Dense UI bootstrap/event handlers; fix disabled unload control and diagnostic rows while preserving behavior. | `app/index.html`; imports language/router/NLP/history/glossary/ID-adjacent helpers. |
| `app/src/js/editDistance.js` | KEEP | — | Levenshtein distance and spelling candidates. | `app/src/js/app.js`. |
| `app/src/js/entityProtection.js` | KEEP | — | Rule-based entity candidates and placeholder protect/restore. | `nlpPipeline.js`, `test_nlp_components.mjs`. |
| `app/src/js/evaluationRunner.js` | KEEP | — | Developer-only IndexedDB benchmark runner; do not ship in the production page. | `app/evaluation.html`; imports `nlpPipeline.js` and `modelRouter.js`. |
| `app/src/js/glossary.js` | KEEP | — | Lexical glossary validation/storage/matching/restoration. | `app.js`, `nlpPipeline.js`, component tests; imports `id.js`. |
| `app/src/js/history.js` | KEEP | — | Browser-local translation history. | `app.js`; imports `id.js`. |
| `app/src/js/id.js` | KEEP | — | Cross-browser ID generation fallback. | `history.js`, `glossary.js`. |
| `app/src/js/language.js` | KEEP | — | Language labels and canonical language codes. | `app.js`, `modelRouter.js`, NLP/model modules. |
| `app/src/js/markerSupport.js` | KEEP | — | Per-direction marker-support gate; keep tests/docs even if disabled UI rows are hidden. | `nlpPipeline.js`. |
| `app/src/js/modelRouter.js` | KEEP | — | Selects the appropriate one of three model families for each direction. | `app.js`, `nlpPipeline.js`, `preprocessing.js`, evaluation runner. |
| `app/src/js/nlpPipeline.js` | REWRITE | same path | Reformat and add a short pipeline overview; preserve logic and test outcomes. | `app.js`, `evaluationRunner.js`; composes NLP modules and translator. |
| `app/src/js/postprocessing.js` | KEEP | — | Script transliteration plus Unicode/whitespace normalization. | `nlpPipeline.js`, `translator.js`. |
| `app/src/js/preprocessing.js` | KEEP | — | NFC normalization, whitespace cleanup, control/empty/length validation. | `nlpPipeline.js`, `translator.js`, tests. |
| `app/src/js/sentenceSegmenter.js` | KEEP | — | Locale sentence segmentation and token-limit chunking. | `nlpPipeline.js`, tests. |
| `app/src/js/translator.js` | REWRITE | same path | Reformat model/session lifecycle and add comments for token/cache tensors and sidecar ownership. | `nlpPipeline.js`; imports ONNX Runtime Web and Transformers.js. |

### Current docs and development-prompt archive

| Path | Action | New name | Reason | Referenced by |
|---|---|---|---|---|
| `docs/ANDROID_COMPATIBILITY_STUDY.md` | REWRITE | `docs/ANDROID.md` | Merge feasible architecture/build limits into the canonical Android guide; update outdated single-family claims. | No active code reference; project audit/README will be rewritten. |
| `docs/ANDROID_TEST_RESULTS.md` | RENAME | `evaluation/results/android_test_results.md` | Keep phone translations, load/translation times, switch/memory/crash evidence outside the six narrative docs. | `docs/development-prompts/stage8_4.md` only; that prompt is proposed for deletion after reference check. |
| `docs/PROJECT_AUDIT.md` | DELETE after merge | — | Audit duplicates architecture, evaluation, and limitations; merge verified findings into canonical docs. | `README.md`/old reports use some result paths; stale audit references the old documentation and pilot report. |
| `docs/QUANTIZATION_EVALUATION.md` | REWRITE | `docs/EVALUATION.md` | Merge INT8 quality/latency/browser/memory results into the generated canonical report. | `scripts/build_quantization_evaluation.py` writes this path; replace that writer with `summarize_results.py`. |
| `docs/development-prompts/debug_25_sentence_failure.md` | DELETE | — | Private implementation prompt; preserve resolved finding only if useful in Challenges. | Old cleanup inventory/report only; both are slated for removal. |
| `docs/development-prompts/repository_cleanup_plan.md` | DELETE | — | Historical implementation prompt, not course documentation. | No executable import found. |
| `docs/development-prompts/stage1_project_setup.md` | DELETE | — | Historical implementation prompt. | Mentions model manifest/README; the prompt itself is removed. |
| `docs/development-prompts/stage2_local_translation_engine.md` | DELETE | — | Historical implementation prompt. | Mentions `model_manifest.json` and `preliminary_smoke_tests.json`; preserve runtime tools, remove prompt. |
| `docs/development-prompts/stage3_nlp_pipeline.md` | DELETE | — | Historical implementation prompt; retain its useful design notes in NLP docs. | Mentions the old NLP/challenges docs and smoke outputs; all references are migrated or removed with the prompt archive. |
| `docs/development-prompts/stage4_1_acceptance_testing.md` | DELETE | — | Historical implementation prompt. | Mentions `evaluation/stage4_ui_verification.json`; prompt is removed and output is an old artifact. |
| `docs/development-prompts/stage4_frontend.md` | DELETE | — | Historical UI implementation prompt; merge lasting design decisions into Architecture. | Mentions `documentation/ui/frontend_design.md`; prompt and old doc are removed after merge. |
| `docs/development-prompts/stage5_1_methodology_pilot.md` | DELETE | — | Historical pilot prompt. | Mentions full/pilot result paths; retain full evidence only and remove the prompt archive. |
| `docs/development-prompts/stage5_2_engine_stabilisation.md` | DELETE | — | Historical implementation prompt. | Mentions scorer outputs and prediction paths; scripts remain the executable source. |
| `docs/development-prompts/stage5_2a_status_scorer.md` | DELETE | — | Historical scorer prompt. | No surviving consumer found. |
| `docs/development-prompts/stage5_2b_runner_indexeddb.md` | DELETE | — | Historical runner prompt. | No surviving consumer found. |
| `docs/development-prompts/stage5_2c_browser_testing.md` | DELETE | — | Historical browser-test prompt. | Mentions `stage5_2c_browser_tests.json`; remove old output and prompt together. |
| `docs/development-prompts/stage5_3_Evaluation_testing.md` | DELETE | — | Historical pilot prompt. | Mentions pilot result artifacts proposed for deletion. |
| `docs/development-prompts/stage5_bleu_chrf_evaluation.md` | DELETE | — | Historical evaluation prompt; retain final methodology in `docs/EVALUATION.md`. | Mentions `final_results.csv`, human-review template, and old reference formats; paths are audited below. |
| `docs/development-prompts/stage7_documentation.md` | DELETE | — | Historical cleanup prompt. | Mentions the legacy final-doc, cleanup reports, and result summaries; those paths are merged/removed together. |
| `docs/development-prompts/stage8_1_android_app` | DELETE | — | Historical Android prompt; retain verified build/install instructions in `docs/ANDROID.md`. | No surviving consumer found. |
| `docs/development-prompts/stage8_4.md` | DELETE | — | Historical Android test prompt after its result is retained. | Names `docs/ANDROID_TEST_RESULTS.md`; update the final Android guide to the retained result path. |
| `docs/final_project_documentation_evidence.md` | REWRITE | Merge into `docs/ARCHITECTURE.md`, `docs/NLP_PIPELINE.md`, `docs/EVALUATION.md`, `docs/ANDROID.md`, and `docs/CHALLENGES.md` | Existing technical evidence is useful but too broad and overlaps other docs. | `README.md`, cleanup inventory/report, and Stage 7 prompt; update README and remove old planning reports/prompts. |
| `docs/repository_cleanup_inventory.md` | DELETE | — | Superseded by this plan and the final target tree. | README, cleanup report, Stage 7 prompt; all will be removed/rewritten. |
| `docs/repository_cleanup_report.md` | DELETE | — | Historical cleanup status is stale after later Android/INT8 work. | README, inventory, Stage 7 prompt; all will be removed/rewritten. |
| `documentation/architecture/nlp_pipeline.md` | REWRITE | `docs/NLP_PIPELINE.md` | Canonical module-to-concept map and route gates. | `documentation/architecture/pipeline_comparison.md` and Stage 3 prompt; both are removed after migration. |
| `documentation/architecture/pipeline_comparison.md` | DELETE after merge | — | Historical stage comparison; retain only final pipeline flow where useful. | Stage 3 prompt and local link to old `nlp_pipeline.md`. |
| `documentation/architecture/translation_engine.md` | REWRITE | `docs/ARCHITECTURE.md` | Merge model routing, ONNX session lifecycle, sidecars, and offline asset architecture. | README, Stage 2/7 prompts; prompts removed and README rewritten. |
| `documentation/challenges.md` | REWRITE | `docs/CHALLENGES.md` | Preserve useful Unicode, segmentation, marker, model-quality, and memory lessons. | Stage 3 and Stage 7 prompts; both removed after migration. |
| `documentation/evaluation/bleu_evaluation.md` | REWRITE | `docs/EVALUATION.md` | Preserve reproducible scoring methodology and limitations. | PROJECT_AUDIT and Stage 5 evaluation prompt; audit/prompt removed after merge. |
| `documentation/evaluation/results_analysis.md` | DELETE | — | Explicitly says no results exist; now contradicted by completed benchmark files. Do not migrate stale claims. | PROJECT_AUDIT and Stage 5 prompt; both are removed. |
| `documentation/nlp_concepts.md` | REWRITE | `docs/NLP_PIPELINE.md` | Keep only syllabus concepts that map to implemented modules; remove unrelated syllabus topics. | Stage 3 prompt; prompt removed after merge. |
| `documentation/ui/frontend_design.md` | REWRITE | `docs/ARCHITECTURE.md` | Keep final responsive/accessibility constraints, not the old design prompt narrative. | Stage 4/7 prompts; both removed after merge. |

### Evaluation source, test evidence, and generated results

| Path | Action | New name | Reason | Referenced by |
|---|---|---|---|---|
| `evaluation/android_stage8_3a_browser_smoke.json` | DELETE | — | Superseded by the later six-direction phone test and current browser-smoke evidence. | `scripts/run_browser_smoke.mjs` writes it; the runner remains and can regenerate it. |
| `evaluation/dataset/dataset_metadata.json` | KEEP | — | Dataset provenance/checksum metadata. | Dataset download script and final evaluation guide. |
| `evaluation/dataset/flores200_devtest_parallel.jsonl` (ignored) | KEEP locally; track only after license/redistribution decision | same path | Canonical benchmark input; do not regenerate or edit as part of cleanup. | Dataset preparation/download scripts, prediction provenance, full references. |
| `evaluation/dataset/native_custom_eval_template.csv` | KEEP | — | Small user template, not a result artifact. | No code reference found; user-facing custom-evaluation template. |
| `evaluation/dataset/quantization_sample_ids.json` | KEEP | — | Defines the paired FP32/INT8 sample. | `scripts/build_quantization_evaluation.py`, old quantization report; update summary generator/docs paths as needed. |
| `evaluation/nlp_component_tests.json` | KEEP | — | Raw component-test report required by results policy. | `scripts/test_nlp_components.mjs`; browser smoke script reads it. |
| `evaluation/nlp_pipeline_tests.json` | KEEP | — | Integration/six-route smoke evidence. | `scripts/run_browser_smoke.mjs` writes it; README/Architecture should cite it. |
| `evaluation/predictions/eng_Latn-kan_Knda-pilot.jsonl` | DELETE | — | Pilot hypothesis output is not final evidence. | `score_evaluation.py` pilot suffix; pilot prompts; regenerable. |
| `evaluation/predictions/eng_Latn-tam_Taml-pilot.jsonl` | DELETE | — | Pilot hypothesis output is not final evidence. | `score_evaluation.py` pilot suffix; pilot prompts; regenerable. |
| `evaluation/predictions/kan_Knda-eng_Latn-pilot.jsonl` | DELETE | — | Pilot hypothesis output is not final evidence. | `score_evaluation.py` pilot suffix; pilot prompts; regenerable. |
| `evaluation/predictions/kan_Knda-tam_Taml-pilot.jsonl` | DELETE | — | Pilot hypothesis output is not final evidence. | `score_evaluation.py` pilot suffix; pilot prompts; regenerable. |
| `evaluation/predictions/tam_Taml-eng_Latn-pilot.jsonl` | DELETE | — | Pilot hypothesis output is not final evidence. | `score_evaluation.py` pilot suffix; pilot prompts; regenerable. |
| `evaluation/predictions/tam_Taml-kan_Knda-pilot.jsonl` | DELETE | — | Pilot hypothesis output is not final evidence. | `score_evaluation.py` pilot suffix; pilot prompts; regenerable. |
| `evaluation/predictions/eng_Latn-kan_Knda.jsonl` (ignored) | KEEP | same path | Raw full FP32 predictions; required evidence. | Full scorer and `docs/EVALUATION.md`. |
| `evaluation/predictions/eng_Latn-tam_Taml.jsonl` (ignored) | KEEP | same path | Raw full FP32 predictions; required evidence. | Full scorer and `docs/EVALUATION.md`. |
| `evaluation/predictions/kan_Knda-eng_Latn.jsonl` (ignored) | KEEP | same path | Raw full FP32 predictions; required evidence. | Full scorer and `docs/EVALUATION.md`. |
| `evaluation/predictions/kan_Knda-tam_Taml.jsonl` (ignored) | KEEP | same path | Raw full FP32 predictions; required evidence. | Full scorer and `docs/EVALUATION.md`. |
| `evaluation/predictions/tam_Taml-eng_Latn.jsonl` (ignored) | KEEP | same path | Raw full FP32 predictions; required evidence. | Full scorer and `docs/EVALUATION.md`. |
| `evaluation/predictions/tam_Taml-kan_Knda.jsonl` (ignored) | KEEP | same path | Raw full FP32 predictions; required evidence. | Full scorer and `docs/EVALUATION.md`. |
| `evaluation/predictions_fp32_sample/eng_Latn-kan_Knda.jsonl` | KEEP | same path | Paired FP32 sample prediction; raw comparison evidence. | `scripts/build_quantization_evaluation.py` and scorer. |
| `evaluation/predictions_fp32_sample/eng_Latn-tam_Taml.jsonl` | KEEP | same path | Paired FP32 sample prediction; raw comparison evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_fp32_sample/kan_Knda-eng_Latn.jsonl` | KEEP | same path | Paired FP32 sample prediction; raw comparison evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_fp32_sample/kan_Knda-tam_Taml.jsonl` | KEEP | same path | Paired FP32 sample prediction; raw comparison evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_fp32_sample/tam_Taml-eng_Latn.jsonl` | KEEP | same path | Paired FP32 sample prediction; raw comparison evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_fp32_sample/tam_Taml-kan_Knda.jsonl` | KEEP | same path | Paired FP32 sample prediction; raw comparison evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_int8/checkpoint.json` | DELETE | — | Completed-run resume state, not final evidence. | Benchmark runner writes generic `checkpoint.json` for custom output dirs. |
| `evaluation/predictions_int8/eng_Latn-kan_Knda.jsonl` | KEEP | same path | Raw INT8 sample predictions; required evidence. | `scripts/build_quantization_evaluation.py`, scorer. |
| `evaluation/predictions_int8/eng_Latn-tam_Taml.jsonl` | KEEP | same path | Raw INT8 sample predictions; required evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_int8/kan_Knda-eng_Latn.jsonl` | KEEP | same path | Raw INT8 sample predictions; required evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_int8/kan_Knda-tam_Taml.jsonl` | KEEP | same path | Raw INT8 sample predictions; required evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_int8/renderer_memory_samples.json` | KEEP | same path | Browser renderer memory evidence. | `scripts/build_quantization_evaluation.py` and final evaluation summary. |
| `evaluation/predictions_int8/runtime_metrics.json` | KEEP | same path | Model-load, JS heap, and latency evidence. | Benchmark runner writes it; quantization summary reads it. |
| `evaluation/predictions_int8/run.log` (ignored) | DELETE | — | Reproducible run log, not final evidence. | Benchmark runner writes generic `run.log`; no report needs the log. |
| `evaluation/predictions_int8/tam_Taml-eng_Latn.jsonl` | KEEP | same path | Raw INT8 sample predictions; required evidence. | Quantization evaluation builder/scorer. |
| `evaluation/predictions_int8/tam_Taml-kan_Knda.jsonl` | KEEP | same path | Raw INT8 sample predictions; required evidence. | Quantization evaluation builder/scorer. |
| `evaluation/preliminary_smoke_tests.json` | DELETE | — | Stale earlier smoke snapshot superseded by the checked baseline/current pipeline report. | README, `documentation/architecture/translation_engine.md`, Stage 2/3 prompts, Stage 4 UI artifact; migrate lasting test instructions before removal. |
| `evaluation/references/eng_Latn-kan_Knda-pilot.jsonl` | DELETE | — | Pilot references can be sliced again; not final evidence. | `prepare_evaluation_pairs.py` writes it; `score_evaluation.py --mode pilot` reads it; pilot prompts. |
| `evaluation/references/eng_Latn-kan_Knda-pilot.txt` | DELETE | — | Redundant pilot text reference; no scoring consumer. | Pair-preparation script writes it; no text reader found. |
| `evaluation/references/eng_Latn-kan_Knda.jsonl` | KEEP | same path | Canonical full reference input. | Full scorer, benchmark pair preparation. |
| `evaluation/references/eng_Latn-kan_Knda.txt` | DELETE | — | Duplicate plain-text form; scorer and browser runner use JSONL. | `prepare_evaluation_pairs.py` writes it; no reader found. |
| `evaluation/references/eng_Latn-tam_Taml-pilot.jsonl` | DELETE | — | Pilot reference input; regenerable. | Pair-preparation script and pilot scorer. |
| `evaluation/references/eng_Latn-tam_Taml-pilot.txt` | DELETE | — | Redundant pilot text reference. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/eng_Latn-tam_Taml.jsonl` | KEEP | same path | Canonical full reference input. | Full scorer and pair-preparation script. |
| `evaluation/references/eng_Latn-tam_Taml.txt` | DELETE | — | Duplicate plain-text form; no scoring consumer. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/kan_Knda-eng_Latn-pilot.jsonl` | DELETE | — | Pilot reference input; regenerable. | Pair-preparation script and pilot scorer. |
| `evaluation/references/kan_Knda-eng_Latn-pilot.txt` | DELETE | — | Redundant pilot text reference. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/kan_Knda-eng_Latn.jsonl` | KEEP | same path | Canonical full reference input. | Full scorer and pair-preparation script. |
| `evaluation/references/kan_Knda-eng_Latn.txt` | DELETE | — | Duplicate plain-text form; no scoring consumer. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/kan_Knda-tam_Taml-pilot.jsonl` | DELETE | — | Pilot reference input; regenerable. | Pair-preparation script and pilot scorer. |
| `evaluation/references/kan_Knda-tam_Taml-pilot.txt` | DELETE | — | Redundant pilot text reference. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/kan_Knda-tam_Taml.jsonl` | KEEP | same path | Canonical full reference input. | Full scorer and pair-preparation script. |
| `evaluation/references/kan_Knda-tam_Taml.txt` | DELETE | — | Duplicate plain-text form; no scoring consumer. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/tam_Taml-eng_Latn-pilot.jsonl` | DELETE | — | Pilot reference input; regenerable. | Pair-preparation script and pilot scorer. |
| `evaluation/references/tam_Taml-eng_Latn-pilot.txt` | DELETE | — | Redundant pilot text reference. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/tam_Taml-eng_Latn.jsonl` | KEEP | same path | Canonical full reference input. | Full scorer and pair-preparation script. |
| `evaluation/references/tam_Taml-eng_Latn.txt` | DELETE | — | Duplicate plain-text form; no scoring consumer. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/tam_Taml-kan_Knda-pilot.jsonl` | DELETE | — | Pilot reference input; regenerable. | Pair-preparation script and pilot scorer. |
| `evaluation/references/tam_Taml-kan_Knda-pilot.txt` | DELETE | — | Redundant pilot text reference. | Pair-preparation script writes it; no reader found. |
| `evaluation/references/tam_Taml-kan_Knda.jsonl` | KEEP | same path | Canonical full reference input. | Full scorer and pair-preparation script. |
| `evaluation/references/tam_Taml-kan_Knda.txt` | DELETE | — | Duplicate plain-text form; no scoring consumer. | Pair-preparation script writes it; no reader found. |
| `evaluation/results/direction_comparison.csv` | DELETE | — | Pilot-only score output; not final evidence. | `score_evaluation.py` writes it in pilot mode; old prompt and cleanup docs mention it. |
| `evaluation/results/evaluation_summary.md` | DELETE | — | Pilot report superseded by final evaluation and was cited by old audit. | `score_evaluation.py` writes it in pilot mode; PROJECT_AUDIT and pilot prompt cite it. |
| `evaluation/results/failed_predictions.json` | KEEP | same path | Full FP32 scorer failure list; evidence of completeness. | Scorer/benchmark runner write it; README and final evidence cite it. |
| `evaluation/results/final_results.csv` (ignored) | DELETE | — | Inspected CSV marks all six directions incomplete and is not a valid final score artifact. | Stage 5 prompt only; no scorer path writes this full-mode CSV. |
| `evaluation/results/final_results.json` (ignored) | KEEP | same path | Canonical full FP32 score file. | `score_evaluation.py` writes it; README/final evidence/audit cite it. |
| `evaluation/results/full_benchmark_audit.md` (ignored) | DELETE | — | Redundant derived audit narrative; use the machine validation JSON and raw predictions. | README and Stage 7 prompt cite it. |
| `evaluation/results/full_benchmark_summary.md` (ignored) | DELETE | — | Duplicate hand-rendered result table; replace with deterministic summary output. | README and PROJECT_AUDIT cite it. |
| `evaluation/results/full_benchmark_validation_report.json` (ignored) | KEEP | same path | Machine-readable integrity record for full predictions/checkpoint/source dataset. | README/Stage 7 prompt and the report’s own data paths. |
| `evaluation/results/human_review_template.csv` (ignored) | DELETE | — | Empty template, not completed human-review evidence. | Stage 5 evaluation prompt only; no code reader found. |
| `evaluation/results/manual_5_en_ta_scores.json` (ignored) | DELETE | — | Small partial manual score set is not comparable to the full corpus and is not cited. | No surviving code consumer found. |
| `evaluation/results/pilot_failed_predictions.json` (ignored) | DELETE | — | Pilot-only failure output, not final evidence. | `score_evaluation.py` writes it in pilot mode. |
| `evaluation/results/pilot_quality_audit.md` (ignored) | DELETE | — | Pilot analysis is superseded by the final error analysis; do not mix pilot and full results. | Links to pilot summary; both are deleted. |
| `evaluation/results/pilot_results.json` | DELETE | — | Pilot scores are explicitly excluded by results policy. | `score_evaluation.py` writes it; old audit/cleanup docs and prompts cite it. |
| `evaluation/results/pilot_validation_report.json` (ignored) | DELETE | — | Pilot-only validation output, not final evidence. | No executable consumer found. |
| `evaluation/results/preflight_reference_check.json` (ignored) | DELETE | — | Preflight diagnostic, superseded by full benchmark validation evidence. | No surviving reader found. |
| `evaluation/results/qualitative_error_analysis.md` (ignored) | KEEP | same path | Required qualitative error evidence; cite clearly as selective review, not an exhaustive or human-certified quality claim. | PROJECT_AUDIT/final evidence/README/Stage 7 prompt; update final report links. |
| `evaluation/results/stage5_2c_browser_tests.json` (ignored) | DELETE | — | Temporary browser-runner test, not final product evidence. | Stage 5.2c prompt only. |
| `evaluation/results/stage5_preflight_smoke.json` (ignored) | DELETE | — | Temporary preflight smoke output, superseded by current regression baseline. | No surviving consumer found. |
| `evaluation/results/int8/browser_smoke_tests.json` (ignored) | KEEP | same path | Quantized browser-load/translation compatibility evidence. | `scripts/build_quantization_evaluation.py` reads it; summary script/docs should retain the citation. |
| `evaluation/results/int8/sample_references/eng_Latn-kan_Knda.jsonl` (ignored) | KEEP | same path | Exact paired sample references used by INT8/FP32 scoring. | Quantization evaluation builder reads it. |
| `evaluation/results/int8/sample_references/eng_Latn-tam_Taml.jsonl` (ignored) | KEEP | same path | Exact paired sample references used by scoring. | Quantization evaluation builder. |
| `evaluation/results/int8/sample_references/kan_Knda-eng_Latn.jsonl` (ignored) | KEEP | same path | Exact paired sample references used by scoring. | Quantization evaluation builder. |
| `evaluation/results/int8/sample_references/kan_Knda-tam_Taml.jsonl` (ignored) | KEEP | same path | Exact paired sample references used by scoring. | Quantization evaluation builder. |
| `evaluation/results/int8/sample_references/tam_Taml-eng_Latn.jsonl` (ignored) | KEEP | same path | Exact paired sample references used by scoring. | Quantization evaluation builder. |
| `evaluation/results/int8/sample_references/tam_Taml-kan_Knda.jsonl` (ignored) | KEEP | same path | Exact paired sample references used by scoring. | Quantization evaluation builder. |
| `evaluation/results/int8/score_fp32/failed_predictions.json` (ignored) | KEEP | same path | FP32 same-sample failure evidence. | `score_evaluation.py` writes it; summary builder should cite it. |
| `evaluation/results/int8/score_fp32/final_results.json` (ignored) | KEEP | same path | FP32 same-sample quality/latency scores. | Quantization evaluation builder reads it. |
| `evaluation/results/int8/score_int8/failed_predictions.json` (ignored) | KEEP | same path | INT8 same-sample failure evidence. | `score_evaluation.py` writes it; summary builder should cite it. |
| `evaluation/results/int8/score_int8/final_results.json` (ignored) | KEEP | same path | INT8 same-sample quality/latency scores. | Quantization evaluation builder reads it. |
| `evaluation/results/eng_Latn-tam_Taml-pilot.jsonl` (ignored) | DELETE | — | Extra pilot export duplicated by the pilot prediction folder. | Stage 5.3 prompt only. |
| `evaluation/test_fixtures/parallel_5.jsonl` | DELETE after test-reference check | — | Orphan fixture; no code reads this exact path. | PROJECT_AUDIT mentions the folder only, not this fixture. |
| `evaluation/stage2_baseline_smoke_tests.json` | KEEP | same path | Translation-output baseline consumed by the current browser smoke runner and needed for the requested before/after equality check. | `scripts/run_browser_smoke.mjs`, `evaluation/nlp_pipeline_tests.json`. |
| `evaluation/stage4_ui_verification.json` (ignored) | DELETE | — | Old one-time UI verification result, superseded by the planned current regression run. | `.gitignore` and Stage 4.1 prompt only. |
| `evaluation/checkpoints/full_benchmark_checkpoint.json` (ignored) | DELETE | — | Completed resume checkpoint is not final result evidence. | `scripts/run_local_benchmark.mjs`, full validation report, old cleanup inventory. |
| `evaluation/logs/full_benchmark.log` (ignored) | DELETE | — | Verbose operational log; no final report requires it. | `scripts/run_local_benchmark.mjs`, old cleanup inventory. |
| `evaluation/test_runs/local_batch_smoke/checkpoint.json` (ignored) | DELETE | — | Temporary smoke-run state. | Benchmark runner’s custom-output naming convention only. |
| `evaluation/test_runs/local_batch_smoke/eng_Latn-tam_Taml.jsonl` (ignored) | DELETE | — | Temporary smoke prediction, separate from final evidence. | Benchmark runner’s custom output path only. |
| `evaluation/test_runs/local_batch_smoke/run.log` (ignored) | DELETE | — | Temporary smoke log. | Benchmark runner’s custom-output naming convention only. |

### Models, scripts, and external reference submodule

| Path | Action | New name | Reason | Referenced by |
|---|---|---|---|---|
| `models/README.md` | KEEP | — | Explains ONNX graphs, external sidecars, tokenizers, and local-weight policy. | README and old cleanup inventory. |
| `models/indictrans2/model_manifest.json` | KEEP | — | Required source-model layout/verification metadata; not a weight file. | `download_models.py`, `verify_models.py`, model docs. |
| `scripts/build_quantization_evaluation.py` | DELETE after migration | — | Current report generator is tied to uppercase report path and manually composes one report; port its source-file reads to the consolidated summarizer. | Writes `docs/QUANTIZATION_EVALUATION.md`; no package script/import found. |
| `scripts/download_evaluation_dataset.py` | KEEP | — | Reproducible FLORES download with access/license checks. | Manual dataset workflow in README/Evaluation. |
| `scripts/download_models.py` | KEEP | — | Reproducible model snapshot download. | Manual model setup workflow and manifest. |
| `scripts/indic_evaluation_preprocessing.py` | KEEP | — | Shared Indic normalization/tokenization for scoring. | Imported by `score_evaluation.py`. |
| `scripts/prepare_evaluation_pairs.py` | KEEP | — | Rebuilds six aligned references and pilot subsets from the dataset. | Manual evaluation preparation workflow. |
| `scripts/quantize_models.py` | KEEP | — | Reproducible INT8 conversion and graph/load report. | Quantization procedure in documentation; manual CLI tool. |
| `scripts/run_browser_smoke.mjs` | KEEP | — | Six-direction browser regression and local-network checks. | `package.json` `smoke` command; writes smoke evidence. |
| `scripts/run_local_benchmark.mjs` | KEEP | — | Runs local-model benchmark and checkpoints outputs. | `package.json` `benchmark:local`; README/evaluation workflow. |
| `scripts/score_evaluation.py` | KEEP | — | Validates aligned predictions and computes corpus BLEU/chrF++. | README and final evaluation commands; quant report uses it. |
| `scripts/stage_android_models.mjs` | KEEP | — | Stages the three quantized families into Android web assets. | Android build procedure; invoked before Capacitor sync. |
| `scripts/test_indicnlp.py` | KEEP | — | Direct Indic NLP environment check. | README test command. |
| `scripts/test_nlp_components.mjs` | KEEP | — | Component tests and machine-readable report. | README and browser smoke runner. |
| `scripts/verify_models.py` | KEEP | — | Checks local original model folders against manifest and CPU-loads graphs. | Model setup/verification instructions. |
| `references/indictrans2-onnx-browser-demo` (gitlink) | KEEP, untouched | same path | External reference submodule; not app source and not a model clone. | `.gitmodules` and parent Git index only. |
| `references/indictrans2-onnx-browser-demo/.github/workflows/deploy.yml` | KEEP, untouched | same path | External submodule content; do not edit during cleanup. | Submodule workflow. |
| `references/indictrans2-onnx-browser-demo/README.md` | KEEP, untouched | same path | Upstream submodule documentation. | Submodule only. |
| `references/indictrans2-onnx-browser-demo/app.js` | KEEP, untouched | same path | Upstream reference implementation; not imported by TriLingua. | Submodule HTML only. |
| `references/indictrans2-onnx-browser-demo/index.html` | KEEP, untouched | same path | Upstream reference page. | Submodule only. |
| `references/indictrans2-onnx-browser-demo/style.css` | KEEP, untouched | same path | Upstream reference styles. | Submodule HTML only. |
| `references/indictrans2-onnx-browser-demo/translator.js` | KEEP, untouched | same path | Upstream reference implementation; not imported by TriLingua. | Submodule app code only. |
| `references/indictrans2-onnx-browser-demo/transliterate.js` | KEEP, untouched | same path | Upstream reference transliteration code; not imported by TriLingua. | Submodule app code only. |

## 2. Results policy and document inputs

The final report must cite raw files by path; generated markdown is a view of those files, not a second source of truth. Preserve these files:

| Evidence | Files retained | Used by |
|---|---|---|
| Full FP32 benchmark | `evaluation/predictions/{eng_Latn-kan_Knda,eng_Latn-tam_Taml,kan_Knda-eng_Latn,kan_Knda-tam_Taml,tam_Taml-eng_Latn,tam_Taml-kan_Knda}.jsonl`; six corresponding un-suffixed `evaluation/references/*.jsonl`; `evaluation/results/final_results.json`; `evaluation/results/failed_predictions.json`; `evaluation/results/full_benchmark_validation_report.json`. | `docs/EVALUATION.md`; `scripts/summarize_results.py` reads scores/predictions and cross-checks counts/IDs. |
| INT8 paired sample | Six `evaluation/predictions_int8/*.jsonl`; six `evaluation/predictions_fp32_sample/*.jsonl`; six `evaluation/results/int8/sample_references/*.jsonl`; `evaluation/dataset/quantization_sample_ids.json`; `evaluation/results/int8/score_fp32/{final_results,failed_predictions}.json`; `evaluation/results/int8/score_int8/{final_results,failed_predictions}.json`; `evaluation/results/int8/browser_smoke_tests.json`; `evaluation/predictions_int8/{runtime_metrics,renderer_memory_samples}.json`. | `docs/EVALUATION.md`; summary generator reads score/metrics data and validates same IDs before formatting. |
| Error analysis | `evaluation/results/qualitative_error_analysis.md`. | `docs/EVALUATION.md`; clearly label it selective qualitative review, not a metric or exhaustive human evaluation. |
| NLP tests | `evaluation/nlp_component_tests.json`, `evaluation/nlp_pipeline_tests.json`, and `evaluation/stage2_baseline_smoke_tests.json`. | `docs/EVALUATION.md` and `docs/NLP_PIPELINE.md`; baseline is used by `scripts/run_browser_smoke.mjs`. |
| Android results | Move `docs/ANDROID_TEST_RESULTS.md` to `evaluation/results/android_test_results.md`; add a structured `evaluation/results/android_test_results.json` from the retained device evidence before producing machine-generated comparison tables. | `docs/ANDROID.md`, `docs/EVALUATION.md`, and `scripts/summarize_results.py`. |
| Dataset/provenance | `evaluation/dataset/dataset_metadata.json`; `evaluation/dataset/flores200_devtest_parallel.jsonl` retained locally; `models/indictrans2/model_manifest.json`. | Evaluation methods and setup docs. Check dataset redistribution terms before adding the ignored FLORES file to Git. |

Delete other generated evaluation outputs listed in the inventory: pilot-only predictions/references/scores, one-off smoke/preflight/UI outputs, temporary checkpoints/logs, empty templates, and duplicate text references. Keep source scripts and inputs that can regenerate these. The current full-score CSV is **not** evidence: `evaluation/results/final_results.csv` has `incomplete` status on all six rows; use the JSON score file as canonical and remove the invalid CSV after its old prompt reference is retired.

References found before those deletion proposals include:

- `scripts/score_evaluation.py` reads/writes pilot paths using `-pilot`, `pilot_results.json`, `pilot_failed_predictions.json`, `direction_comparison.csv`, and `evaluation_summary.md`; `scripts/prepare_evaluation_pairs.py` writes both JSONL and `.txt` reference variants. Keep the scripts, update docs, and delete only completed pilot artifacts/duplicate `.txt` outputs.
- `scripts/run_local_benchmark.mjs` creates the full/custom checkpoint and log paths. `evaluation/results/full_benchmark_validation_report.json` records the completed checkpoint path/status. Keep that validation record; the checkpoint/log files themselves are operational state.
- `scripts/run_browser_smoke.mjs` writes `android_stage8_3a_browser_smoke.json` and `nlp_pipeline_tests.json`, reads `stage2_baseline_smoke_tests.json`, and reads the component-test report. Keep the baseline/components; delete stale one-off smoke JSON after README/architecture references are updated.
- `scripts/build_quantization_evaluation.py` reads the paired predictions, sample references, score JSON, browser smoke, runtime metrics and renderer samples, and writes `docs/QUANTIZATION_EVALUATION.md`. Migrate those inputs into `summarize_results.py` before deleting the builder/report.
- README, `docs/PROJECT_AUDIT.md`, the final evidence doc, old cleanup reports, and archived prompts name result paths. Rewrite README/canonical docs first; remove prompts and obsolete reports as one planned batch.
- Search for `evaluation/test_fixtures/parallel_5.jsonl` and Android sample-test class names found no code consumer. `.idea/modules.xml` is the only reference to `.idea/Machine_Translator.iml`; all `.idea` references are internal to the directory.

## 3. Naming scheme and rename/reference map

- Keep source module filenames descriptive camelCase where they are existing JS imports; use `snake_case.py` for Python scripts and `kebab-case` for new static data names. Keep language-pair result names as `<source-code>-<target-code>.jsonl`; `-pilot` remains supported by the scorer but pilot files are not shipped.
- Preserve model directory names in this cleanup. The quantized copies inherit `-fp32` folder suffixes, but renaming very large model folders would require coordinated staging/router/manifest updates and is unnecessary for a docs-focused submission. Label them “INT8” in docs and describe this suffix as inherited.
- Keep canonical narrative names exactly: `README.md`, `docs/ARCHITECTURE.md`, `docs/NLP_PIPELINE.md`, `docs/EVALUATION.md`, `docs/ANDROID.md`, `docs/CHALLENGES.md`.

| Existing path | Proposed target/action | References to update before finalizing |
|---|---|---|
| `docs/ANDROID_COMPATIBILITY_STUDY.md` | Merge/rewrite into `docs/ANDROID.md`, then remove old file. | README and docs that link to old Android feasibility study; exact-code search found no app import. |
| `docs/ANDROID_TEST_RESULTS.md` | Move to `evaluation/results/android_test_results.md`. | `docs/development-prompts/stage8_4.md` is removed; new `docs/ANDROID.md` and `docs/EVALUATION.md` must link to the retained evidence path. |
| `docs/final_project_documentation_evidence.md` | Split across the five canonical docs; remove old source after review. | README line 182, `docs/repository_cleanup_inventory.md`, `docs/repository_cleanup_report.md`, Stage 7 prompt. Remove/rewrite each. |
| `docs/PROJECT_AUDIT.md` | Merge only verified findings into Architecture/Evaluation; remove old audit. | Its internal links to old summaries/pilot results are retired; no app import. |
| `docs/QUANTIZATION_EVALUATION.md` | Generated as `docs/EVALUATION.md`. | `scripts/build_quantization_evaluation.py` output path; replace writer and all README/report links. |
| `documentation/architecture/nlp_pipeline.md` | `docs/NLP_PIPELINE.md`. | Old `pipeline_comparison.md`, Stage 3 prompt, and README description; all are migrated/removed. |
| `documentation/architecture/translation_engine.md` | `docs/ARCHITECTURE.md`. | Stage 2/7 prompts and README old-doc note; remove/rewrite those links. |
| `documentation/challenges.md` | `docs/CHALLENGES.md`. | Stage 3/7 prompts; prompts are removed after content migration. |
| `documentation/evaluation/bleu_evaluation.md` | Merge into `docs/EVALUATION.md`. | PROJECT_AUDIT and Stage 5 prompt; remove after migration. |
| `documentation/nlp_concepts.md` | Merge into `docs/NLP_PIPELINE.md`. | Stage 3 prompt; remove after migration. |
| `documentation/ui/frontend_design.md` | Merge lasting accessibility/responsive details into `docs/ARCHITECTURE.md`. | Stage 4/7 prompts; remove after migration. |
| All `docs/development-prompts/*` (17 paths listed above) | Delete only after canonical docs and reference links are complete. | Filename search found no runtime import/package reference; internal prompt mentions disappear with the archive. |
| `scripts/build_quantization_evaluation.py` | Port report inputs to `scripts/summarize_results.py`; delete old builder. | Its only report output is the old quantization doc; no `package.json` script or code import was found. |
| `evaluation/predictions_fp32_sample/` | Keep path for this submission. | The quantization report builder uses this exact directory; no rename is worth changing evidence paths. |
| `docs/CLEANUP_PLAN.md` | Delete in the final cleanup phase. | This file only; no lasting project reference should be added. |

## 4. Proposed final tree

```text
README.md
package.json / package-lock.json / requirements.txt / vite.config.js
capacitor.config.json / .gitignore / .gitmodules
app/
  index.html
  evaluation.html                 # developer-only source; excluded from shipped build
  src/{js,css}/
android/                           # tracked Gradle wrapper/config/resources; build output ignored
docs/
  ARCHITECTURE.md
  NLP_PIPELINE.md
  EVALUATION.md
  ANDROID.md
  CHALLENGES.md
evaluation/
  dataset/{dataset_metadata.json,quantization_sample_ids.json,flores...jsonl}
  references/{six canonical direction JSONL files}
  predictions/{six full FP32 direction JSONL files}
  predictions_fp32_sample/{six paired sample JSONL files}
  predictions_int8/{six INT8 sample JSONL files,runtime_metrics.json,renderer_memory_samples.json}
  results/
    final_results.json / failed_predictions.json / full_benchmark_validation_report.json
    qualitative_error_analysis.md / android_test_results.md / android_test_results.json
    int8/{browser_smoke_tests.json,sample_references,score_fp32,score_int8}
  nlp_component_tests.json / nlp_pipeline_tests.json / stage2_baseline_smoke_tests.json
  test_fixtures/                   # retain only if it is wired into tests
models/{README.md,indictrans2/model_manifest.json}
scripts/{download,verify,quantize,stage,smoke,benchmark,score,summarize,test}*
references/indictrans2-onnx-browser-demo  # untouched external submodule
```

Local ONNX weights, quantized copies, `node_modules`, `.venv`, Capacitor-copied Android web assets, `dist`, Android build outputs, Gradle caches, and IDE metadata are not part of the clean source tree.

## 5. Six-document content plan

1. **`README.md`** — What TriLingua does, supported directions, prerequisites, install/run, offline behavior boundaries, short test commands, and direct links to the five technical docs. Remove hand-entered benchmark tables and stale “no APK”/“documentation remains under documentation/” claims.
2. **`docs/ARCHITECTURE.md`** — Browser/Capacitor architecture, model-family routing, ONNX graphs/sidecars/tokenizers, WASM asset loading, app build/staging boundary, and offline limits. Cite model manifest/build configuration rather than duplicate raw facts.
3. **`docs/NLP_PIPELINE.md`** — Map each actual module to its NLP concept, input, output, and call site: `preprocessing.js` (normalization/validation), `sentenceSegmenter.js` (sentence boundaries/token-budget chunking), `entityProtection.js` (rule-based entity candidates and placeholder restoration), `markerSupport.js` (tested route gate), `glossary.js` (lexicon matching), `translator.js` (tokenization/encoder-decoder inference), `postprocessing.js` (script transliteration/normalization), `nlpPipeline.js` (orchestration), `modelRouter.js` (direction routing), and `editDistance.js` (edit-distance spelling suggestions). Distinguish heuristic functions from trained NLP models.
4. **`docs/EVALUATION.md`** — Full FP32 results, paired INT8 comparison, latency and browser memory, errors/quality caveats, NLP component/pipeline tests, and links to Android evidence. Every displayed number must be loaded from a named result file and rendered by `scripts/summarize_results.py`; list the exact source paths beside each table. Do not copy score values into source Markdown.
5. **`docs/ANDROID.md`** — Capacitor/SDK prerequisites, one-family staging procedure, current all-family test build, relative WASM/model paths, `noCompress`, exact build/install/log commands, and link to Android evidence. Distinguish debug APK from a release-signed store artifact.
6. **`docs/CHALLENGES.md`** — Curated challenges from `documentation/challenges.md`: Unicode normalization/script handling, sentence/token limits, marker survival differences by direction, quality differences across model families, latency, and memory. Include what failed and how it was verified; remove prompt chronology.

`models/README.md` remains model-local usage documentation and is not an additional narrative file in the six-file docs plan. The Android results artifact lives under `evaluation/results/` so it remains evidence rather than a seventh guide.

### `scripts/summarize_results.py` proposal

Read the full and paired INT8 score JSON, aligned prediction/reference JSONL, sample IDs, runtime/renderer metrics, browser smoke report, NLP test JSON, Android result JSON, and qualitative error-analysis path. Validate row counts and paired IDs; calculate macro means/deltas and quality flags from predictions; render the evaluation tables and Android summary block. Write `docs/EVALUATION.md` (and optionally a machine-readable derived summary beside it). Fail loudly on missing/misaligned inputs. The generator must not run translations, recalculate source scores with different settings, or contain literal metric/memory values. Keep `score_evaluation.py` as the scorer and `build_quantization_evaluation.py` only until its inputs/formatting are migrated.

## 6. UI and pipeline review (source plus current built page)

The source `app/index.html` and Vite-built `dist/index.html` contain the same translation UI. The built page has a hidden developer evaluation output page at `dist/evaluation.html`, and Vite’s two HTML inputs mean `npx cap sync` copies it into Android too. Plan to keep `app/evaluation.html` for local developer work but build the shipped web/Android app from only `app/index.html`; give evaluation a separate explicit dev/build command. The hidden `#smoke-output` element has no source consumer and can be removed after a repository-wide reference check.

| UI item/current copy | Action | Reason/proposal |
|---|---|---|
| Brand letter `T`; “TriLingua”; “Offline Multilingual Translator” | KEEP / REWORD | Keep brand; use an actual accessible logo/mark instead of an isolated letter once approved. |
| Status “Ready · models stay on this device” | REWORD | Say “Ready · runs on this device”; do not imply offline install/cache until the deployment has been disconnected-tested. |
| History clock icon (`◷`, title/aria “History”); Settings gear (`⚙`) | KEEP | Preserve buttons and accessible names; use consistent SVG/icon assets if the icon design is revised. |
| Hero eyebrow “PRIVATE BY DESIGN · POWERED BY INDIC TRANS 2” | REWORD | Use plain case and accurate privacy wording; local inference does not by itself prove every browser request is local. |
| Hero: “Your Languages. Your Translation. Completely Offline.” and “Translate between English, Tamil, and Kannada with local neural models. Your text stays in your browser.” | REWORD | Avoid an absolute offline guarantee without packaged-asset/disconnected deployment coverage; explain the local model files must be available. |
| Workspace eyebrow “TRANSLATION WORKSPACE”; heading “What would you like to translate?” | KEEP | Clear task heading. |
| Model chip “English → Indic · 200M” and dynamic family labels | KEEP | Helpful family status; ensure precision shown as INT8 when quantized is the selected build. |
| “FROM” / “TO”, language selectors “Translate from” / “Translate to” | KEEP | Clear, accessible route controls. |
| Swap icon `⇄`, title/aria “Swap languages” | KEEP | Keep action and accessible text. |
| Source panel “Your text”; source language; textarea “Enter your text here…” | KEEP | Keep native script entry. Clarify 20,000-character limit and that Indic UI counter currently counts JS string length/UTF-16 code units. |
| Character/word counts “0 / 20000” and “0 words” | REWORD | Localize pluralization/labels and make the hard limit visible before input reaches it. |
| Source “Clear” button | KEEP | Clear source text. |
| “Try an example” and Robotics/AI sentence | REWORD | Keep as a user demo, but choose short natural example in the selected source language; current hard-coded English example is confusing on non-English routes. |
| Output heading “Translation”; target language; placeholder “Your translation will appear here.” | KEEP | Clear output state. |
| “Translation time will appear here.” | REWORD | Use “Translation time” and separate model-load time from inference time. |
| Output “Copy” / transient “Copied”; output “Clear” | KEEP | Preserve copy/clear. Announce copied state through the existing live region. |
| “Model details appear after translation.”; dynamic family/token count | REWORD | Keep concise details; gate extra tokens/family data behind developer diagnostics if it distracts from course users. |
| “English spelling suggestion”, “Apply suggestion”, “Dismiss” | REWORD | Only show for English source text; the listener currently runs for all routes but the feature is explicitly English-only. |
| “Translate” / transient “Translating” with arrow and spinner | KEEP | `app.js` does set “Translating” and a busy class before awaiting the NLP call; the state is not absent. |
| “Model loads locally when needed” / “Model loaded in … s” | KEEP | Distinguish this from per-input translation time. |
| “Unload model” | REWRITE | `disabled` is present in HTML and no code enables it. Enable only after a successful model load, or hide until loaded; the handler already calls the unload API. |
| Progress text “Ready to translate offline” / “Preparing the local model” / callback status | KEEP / REWORD | Progress text updates exist. The `<progress>` value and percent label are never updated by the callback, so the visual bar stays at zero; wire percent or hide the bar. |
| Hidden `#error-message` | KEEP | Error output is accessible via `role=alert`; align failure text with actionable local-file/input errors. |
| “NLP Processing Details”; “See how your input is prepared…”; chevron and info icon | KEEP | Useful teaching surface; explain route-gated stages accurately. |
| Diagnostics: Input normalization, Sentence count, Chunk count, Source tokens, Generated tokens, Entities, Entity protection, Glossary, Model family, Preprocessing time, Translation time, Postprocessing time | KEEP / REWORD | Keep diagnostic values for course review; hide the Entity protection row when unsupported and Glossary row when reference-only, as requested, while retaining code/tests/docs. |
| “Entity protection: Disabled for this route” | REMOVE from normal diagnostics | Unsupported placeholder survival is why the feature is off. Explain this in `docs/NLP_PIPELINE.md`; only show a concise inactive-state note in developer mode if needed. |
| “Glossary: Reference only (… entries)” | REMOVE from normal diagnostics | No glossary marker route is currently enabled. Preserve the glossary manager and tests; document that substitutions remain off until marker preservation is verified. |
| Static note: glossary application only where placeholder preservation is verified | REWORD | Plain explanation that glossary entries are stored but may not be applied on every direction. |
| “LOCAL TERMINOLOGY”, “Glossary”, count (“30 terms”), “Manage preferred terms…” | KEEP / REWORD | Keep glossary management; explain the count is filtered for selected language pair, and mark sample terms as examples. |
| Glossary FROM/TO selectors; “Search terms” | KEEP | Functional labels and search. |
| Glossary rows: term arrow, “Preferred terminology”, “Edit”, “Enable/Disable”, “Delete” | KEEP | Preserve accessible CRUD controls and current status labels. |
| “Add a term”, “Source term”, “Preferred translation”, “Add term”, “Cancel” | KEEP | Clear glossary form; make validation errors announced. |
| Privacy icon `▣` and “Your translations run locally. No translation API or cloud service is used.” | REWORD | Icon is unclear; use a lock/device symbol and qualify local runtime/network behavior based on request-log tests. |
| Hidden `#smoke-output` | REMOVE | No code reference found; automated smoke uses its own result object/CDP. |
| History dialog: “ON THIS DEVICE”, “Translation history”, close `×`, “Reuse input”, “Copy”, “Delete”, “Clear history”, “Done” | KEEP / REWORD | Keep history actions; make close button text “Close history” for accessibility. Clarify storage is local to this browser/app instance. |
| Settings dialog: “PREFERENCES”, close `×`, “Save translation history”, helper “Keep up to 20 successful translations in this browser.” | KEEP / REWORD | Keep; confirm retention count is true and say “on this device/browser.” |
| “Clear translation history”; “Clear glossary data” | KEEP | Preserve destructive actions with existing confirmation for glossary clear; history clear should also confirm or offer undo. |
| “Developer diagnostics”; helper “Show extra model details in the output area.” | KEEP / REWORD | Keep but gate diagnostic detail rows and ensure the toggle actually controls the described output. |
| Settings `TriLingua v0.4.0`, “Available local model families”, 200M/320M list, “Model status: Not loaded” | REWORD | Version conflicts with package version `0.1.0`; derive version from one metadata source. Do not imply all families are bundled in Android if only a selected family is staged for that build. |
| Evaluation page text: “TriLingua Model Evaluation”, dataset JSONL, direction, export format, JSONL/CSV/TXT | KEEP on dev-only page | Developer-only tool; not included in production web or Android build. |
| Evaluation buttons: “Run 25-sentence pilot”, “Run complete direction”, “Pause”, “Resume”, “Cancel”, “Export predictions”, “Clear temporary cache” | KEEP on dev-only page | Keep runner functionality for research; omit from the consumer build. |
| Evaluation status “Load a local dataset JSONL to begin.”, progress bar, IndexedDB checkpoint explanation | KEEP on dev-only page | Accurate developer copy; retain docs for evaluation procedure. |

### Pipeline, long text, repaint, and model defaults

- Long input is limited to 20,000 JS string units; `nlpPipeline.js` splits newlines into paragraphs and `sentenceSegmenter.js` groups sentences to the active model’s token budget, splitting an overlong sentence at whitespace. Empty/control-only inputs and unsupported/equal-language pairs are rejected. Extremely long text means many sequential ONNX calls; there is no “one-shot 20k character” guarantee. Add visible limit/cost guidance and preserve a chunk-count diagnostic.
- During a 5–7 second inference, the handler updates the button/status before the first await and receives progress messages from asynchronous model calls. However, this phase did not run a paint-timing experiment. Inference uses WASM with one thread and no explicit Web Worker; a long synchronous WASM segment could still delay repaint. Keep the spinner/text, add a measurable UI repaint regression check in the final phase, and do not claim it is verified based on source alone.
- Entity placeholders are enabled only for Kannada→English; all other routes are gated off in `markerSupport.js`. Glossary placeholders are off for all six routes. Keep those gates and tests; hide inactive rows in normal UI and explain the reason in NLP docs.
- The current default model-router behavior is FP32 unless `VITE_MODELS=quantized` or `?models=quantized` is set. Recommend quantized models as the default for shipped web and Android builds, and FP32 only for explicit evaluation/reference runs: all three INT8 families have been staged and exercised on the phone, and quantized bundles are substantially smaller. Keep an explicit override for research reproducibility. **This changes the default web download size and is a user decision before implementation.**
- The evaluation page is a current production/Android build leak: `vite.config.js` includes both `app/index.html` and `app/evaluation.html`, and `dist/evaluation.html` exists; Capacitor copies the `dist` directory. Exclude the evaluation HTML input from production/Android output while retaining an explicit developer route/build.
- Source config says app name `TriLingua`, app id `com.trilingua.app`, and web title `TriLingua | Offline Translator`. The Android launcher-resource filenames are present, but their artwork and rendered Android label/title were not inspected in this no-change audit. Align them with TriLingua and replace scaffold artwork after the user approves a logo. The visible `T` mark and blank `data:,` favicon are not a finished icon system.

## 7. Readability and viva explanations

| File | Finding | Proposed treatment / student explanation |
|---|---|---|
| `app/src/js/app.js` | 25 lines, max 1,653 characters; many handlers, rendering, diagnostics, and translation orchestration are compressed onto single lines. | Reformat first. Split into DOM/UI rendering, event wiring, and diagnostics only if behavior-preserving tests support it. Explain event → NLP call → output/history update. |
| `app/src/js/evaluationRunner.js` | 45 lines, max 1,160 characters; IndexedDB transactions and pause/resume state are dense. | Reformat functions and name state transitions; explain checkpoint, prediction records, and resumable run IDs. |
| `app/src/js/nlpPipeline.js` | Pipeline logic is readable relative to UI but has nontrivial route gates/chunk aggregation. | Add a small stage diagram/comment and explain validation → normalization → segmentation → optional markers → inference → restoration/postprocessing. |
| `app/src/js/translator.js` | Session construction, sidecar buffers, cache tensor names, and manual tensor disposal are subtle. | Add short comments on ownership/release and decoder KV cache; explain why model load is outside per-input preprocessing time. |
| `app/src/css/style.css` | One 8,022-character CSS line. | Reformat into normal rules; preserve tokens, responsive breakpoints, focus states, live/progress visibility. |
| `app/src/css/evaluation.css` | One 551-character line. | Reformat while keeping it developer-only. |
| `scripts/run_local_benchmark.mjs` | 122 lines, max 1,722 characters; 21 lines exceed 200 chars. | Reformat orchestration, atomic writes, resume/checkpoint and CDP metrics into named helpers. |
| `scripts/score_evaluation.py` | 83 lines, max 739 chars, compact multi-statement lines. | Reformat CLI, alignment validation, normalization, score output; explain corpus BLEU vs macro direction mean. |
| `scripts/build_quantization_evaluation.py` | 146 lines, max 700 chars; report generator will be replaced. | Port clear input/validation logic to `summarize_results.py`; remove duplicate formatting only after parity. |
| `scripts/quantize_models.py` | 427 lines, max 467 chars; most logic is already structured. | Keep, add only concise comments around shared external data and per-graph output paths. |
| `scripts/download_evaluation_dataset.py`, `scripts/prepare_evaluation_pairs.py`, `scripts/test_nlp_components.mjs` | Compact statements but smaller surface. | Reformat as touched; comments should explain alignment/checksum and exact test assertion, not narrate syntax. |

Suggested viva comments: why source and target language tags are model inputs; how `Intl.Segmenter` plus tokenizer counts obey model source limits; why transliteration changes script but does not translate meaning; why placeholder preservation is route-tested; what encoder/decoder-with-past cache tensors do; why BLEU/chrF++ are not human judgments; and why local ONNX inference does not automatically equal a cached offline PWA.

## 8. Dependencies, metadata, and ignore gaps

- `package.json` entries all have an observed role: Vite builds/serves; Transformers.js tokenizers; ONNX Runtime Web executes; Capacitor core/android/CLI provides native bridge/build. No unused npm dependency is identified from static imports/build configuration. Do not run `npm audit fix`.
- `package.json` name `trilingua` is valid; description is generic but accurate. Author is blank and `ISC` is set without a project license decision. Ask who owns the project and which license may be granted before changing either. Version `0.1.0` conflicts with settings text `v0.4.0`; choose one source of truth.
- Python source directly imports `datasets`, `huggingface_hub`, `indicnlp`, `sacrebleu`, `onnx`, `onnxruntime`, and `psutil`. `onnx` and `psutil` are absent from `requirements.txt`; add pinned direct dependencies after verifying the existing `.venv` and a clean install. Most other current pins (`click`, `colorama`, `filelock`, `flatbuffers`, `fsspec`, HTTP libraries, `idna`, `packaging`, `protobuf`, `PyYAML`, `regex`, `tokenizers`, `tqdm`, etc.) are transitive/runtime support packages and are not imported by project scripts directly; avoid labeling them unused until an actual dependency-tree check.
- Existing `scripts` are used or are explicit manual setup tools; `build_quantization_evaluation.py` is the one planned replacement. `app/src/css/responsive.css` and `evaluation/test_fixtures/parallel_5.jsonl` have no direct consumer; the fixture is proposed for deletion, while the stylesheet should be deleted only if a full CSS import search confirms it is orphaned.
- `.gitignore` already covers model weights, `node_modules`, `dist`, Android build/copy output, local SDK/cache folders, checkpoints/logs/test runs, and most generated score outputs. It currently ignores the full FP32 predictions and result artifacts that the final submission must retain. Add narrow exceptions for the exact evidence files in §2; do not broadly unignore all benchmark outputs. Preserve ignored-by-default behavior for scratch runs and model weights.
- The FLORES dataset metadata records a redistribution license; verify its current dataset card and course-submission rules before tracking the dataset itself. Predictions/references/results remain the cited evidence whether the bulky source corpus is committed or locally supplied.

## 9. Regression sequence for the final cleanup phase

1. Before any edits, run `npm.cmd run smoke`, save the six-direction translations and timings to a temporary baseline outside the retained result set, and confirm they match `evaluation/stage2_baseline_smoke_tests.json`. Save current NLP component outputs, `npm.cmd run build` outcome, and the three staged Android family file lists.
2. Make one batch at a time: docs/results/path cleanup; then UI/build/dependency changes; then readability-only refactors. After each batch, rerun the smoke test and compare all six translations byte-for-byte with the saved baseline; run `node scripts/test_nlp_components.mjs` and `python scripts/test_indicnlp.py`; run `npm.cmd run build`; run `node scripts/stage_android_models.mjs` and verify each family has three graphs, all referenced sidecars, and tokenizer/config JSON.
3. Before deleting the full benchmark checkpoint/log, verify the retained full score JSON, prediction/reference alignment, validation report, and qualitative error analysis. Never rerun the FP32 benchmark as part of cleanup.
4. Before a release APK build, verify only the production HTML entry is in `dist`, local WASM/model URLs are relative, no evaluation page is packaged, noCompress still applies, then `npx cap sync android` and a one-worker Gradle build. Compare the package contents/path and install on the test phone only if the final implementation phase authorizes device testing.
5. Run `python scripts/summarize_results.py --check` first; verify every rendered numeric cell matches its source result JSON/JSONL; only then regenerate `docs/EVALUATION.md` and compare the diff for accidental hand-entered constants.

## 10. Unverified items and decisions for the final phase

- This read-only phase did not run smoke, unit/component tests, builds, APK inspection, current phone tests, dependency installation, or `npm audit`; no implementation changes are included here.
- The current Android launcher artwork and actual native label/title were not visually inspected under the generated Android-folder boundary. Check both before changing resources.
- A 5–7 second UI repaint was not measured. The handler sets a “Translating” state, but the progress percentage is unwired and single-thread WASM may still block painting.
- The full FP32 `final_results.csv` is incomplete and must not be cited; verify the canonical `final_results.json`/validation report again before generating the final report.
- Decide whether quantized models become the default for all shipped web builds; the recommendation is INT8 default and FP32 evaluation-only, but this is a user-visible default change.
- Decide author name and license; do not infer legal ownership or grant a license.
- Confirm whether the FLORES dataset may be redistributed in the course submission before unignoring/tracking its JSONL.
- Confirm whether the upstream `references/indictrans2-onnx-browser-demo` submodule belongs in the submitted repository. It is left untouched in this plan; no action is proposed without your direction.
- Confirm whether the Android evaluation page should be available in a separate debug-only build or only from the local developer server; it should not be in the production APK either way.
- Final phase must remove this `docs/CLEANUP_PLAN.md` after implementing the approved plan.
