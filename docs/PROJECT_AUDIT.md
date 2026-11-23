# TriLingua Project Audit

Audit date: 2026-11-23. Read-only inspection; this file is the only file created. Evidence is given as repository-relative `path:line` unless a command result is named. Existing worktree state was already dirty: `.gitignore`, `README.md`, and `scripts/run_local_benchmark.mjs` modified; four docs untracked (`git status --short`). These were not changed.

## Executive summary

- The app implements all six directions with three shared FP32 ONNX families; the route logic is explicit (`app/src/js/modelRouter.js:39-60,70-100`).
- The offline claim is credible for a local build after model assets are present, but no service worker, manifest, or Android wrapper is in this repository tree.
- Full FLORES results exist: 6,072/6,072 translations succeeded; the best corpus BLEU shown is Kannada→English 32.743, and cross-script BLEU is about 11 (`evaluation/results/final_results.json`; `evaluation/results/full_benchmark_summary.md`).
- NLP preparation runs, but glossary and entity substitutions are disabled on 11/12 route gates; it has not been measured against a no-pipeline baseline (`markerSupport.js:2-18`).
- The UI has useful workflow features, but dense/minified source, visible mojibake, and stale docs weaken demo and viva readiness.
- The most urgent work is a controlled NLP ablation, model memory/mobile testing, APK packaging, then documentation cleanup.

## A. Architecture and repository map

```text
Translate button (app/index.html:34)
  -> app.js button.onclick (app/src/js/app.js:18-19)
  -> translateWithNLP (nlpPipeline.js:17)
  -> validate/normalize -> modelRouter.getModelConfig -> count tokens/load model
  -> segmentText -> per chunk translateText -> ONNX encoder/greedy decoder
  -> restore enabled markers -> script postprocess -> app.js writes #translation-output
```

Top-level tree (excluding `.git`, `node_modules`, weights, and generated `dist`): `app/{index.html,evaluation.html,src/{js,css}}`; `docs/{development-prompts,*.md}`; `documentation/{architecture,evaluation,ui,*.md}`; `evaluation/{dataset,references,test_fixtures,results,predictions,logs,checkpoints}`; `models/{README.md,indictrans2/model_manifest.json}`; `references/indictrans2-onnx-browser-demo`; `resources`; `scripts`; root `README.md`, `package.json`, lockfile, `requirements.txt`, `vite.config.js`, `.gitignore`, `.gitmodules`. The submodule points to an external GitHub project (`.gitmodules:1-3`).

JS file map (line counts from `Get-Content | Measure-Object -Line`; imports shown):

| File | Purpose / exported API | Imported by |
|---|---|---|
| `app.js` (25) | UI event wiring; no exports; `translate`, renderers, smoke hooks | HTML module entry |
| `editDistance.js` (29) | `levenshteinDistance(a,b)->number`; `suggestCorrections(word,dictionary,options)->ranked array`; vocabulary constant | `app.js` |
| `entityProtection.js` (62) | detect, markerize, validate, restore entities; each takes text and returns lists/object | `nlpPipeline.js`; tests |
| `evaluationRunner.js` (44) | browser batch runner; no exports; checkpoints predictions in IndexedDB | `evaluation.html` |
| `glossary.js` (about 100) | validate/get/add/update/delete/reset/match/restore glossary records | `app.js`, `nlpPipeline.js` |
| `history.js` (about 20) | localStorage history/settings CRUD | `app.js` |
| `language.js` (about 20) | language labels/codes and conversion helpers | app/router |
| `markerSupport.js` (31) | query route enablement booleans | `nlpPipeline.js` |
| `modelRouter.js` (103) | `getModelConfig(source,target)->frozen config`; model-family table | app, translator, preprocessing, evaluation |
| `nlpPipeline.js` (125) | `translateWithNLP({text,sourceLanguage,targetLanguage,onProgress})->result` | app, evaluation |
| `postprocessing.js` (54) | `transliterate(text,from,to)` and `postprocessText(text,target)->string` | translator, pipeline |
| `preprocessing.js` (47) | normalize, sanitize, validate strings; returns normalized text/errors | pipeline, translator |
| `sentenceSegmenter.js` (96) | async `segmentText(text,options)->chunks` | pipeline |
| `translator.js` (about 390) | load/release ONNX sessions, tokenize, generate translation, count tokens | pipeline, app |

Per-function signatures are evident in each module; e.g., model route selector and normalized output are explicit at `modelRouter.js:70-100`, `preprocessing.js:6-47`, and `sentenceSegmenter.js:61-96`. Line counts can vary by tooling because the files use LF/CRLF; audit counts are approximate where marked.

## B. Translation engine

Route families: English→Tamil/Kannada share 200M English→Indic; Tamil/Kannada→English share 200M Indic→English; Tamil↔Kannada share 320M Indic→Indic (`modelRouter.js:39-60,81-100`). Manifest disk sizes are 1,136,925,513; 951,712,545; and 1,347,246,950 bytes respectively (`model_manifest.json`, `size_bytes`). On-disk folders measured locally: 1,136,903,781; 951,691,244; 1,347,224,988 bytes. All are FP32; no quantized model is listed (`model_manifest.json`).

`fetchBytes` streams response chunks into a `chunks` array, then copies them into one final `Uint8Array` (`translator.js:43-79`). So it is streamed from fetch but fully buffered before session creation, not truly incremental ONNX loading. For the largest sidecar this temporarily holds roughly two copies (~2.7 GB decimal) plus runtime/session tensors; the two decoder graphs share that sidecar (`modelRouter.js:29-35`). This makes 6 GB phone support doubtful without real-device profiling. Sessions use `executionProviders:['wasm']`, one WASM thread, no proxy (`translator.js:8-13,126-138`). The code comment says one thread avoids cross-origin isolation requirements (`translator.js:8-9`).

Generation is greedy: `selectNextToken` takes the largest last-position logit (`translator.js:246-259`); loop cap is min(128, configured target positions) and EOS ends decoding (`translator.js:304-362`). No beam search. Source and target tokenizer JSON files load separately; source tokenizer encodes input and both language tags, target tokenizer decodes output (`translator.js:85-110,273-301,363-370`). Indic input is transliterated to Hindi/Devanagari before encoding; decoded Indic output is mapped from that shared script (`translator.js:275-281`; `postprocessing.js:1-10,46-53`).

## C. NLP pipeline

| Module/concept | Executed and output effect | Syllabus mapping to verify |
|---|---|---|
| preprocessing: Unicode NFC + whitespace cleanup/input validation | Always applied; changes model input (`preprocessing.js:6-47`, pipeline:18-21) | Text normalization, Unicode |
| sentenceSegmenter: sentence boundaries and tokenizer-budget chunks | Always run, using actual model token counts; affects chunking/output joining (`sentenceSegmenter.js:48-96`, pipeline:35-47) | Sentence segmentation, tokenization |
| entityProtection: regex detection + marker substitution | Detection all routes; actual marker substitution only Kannada→English; otherwise diagnostics/warnings (`markerSupport.js:2-10`, pipeline:23,58-75) | Named entities, information preservation |
| glossary: preferred terminology and marker restore | Entries can be shown/managed all routes; replacement only if route gate true; all six false (`markerSupport.js:11-18`, pipeline:24,60-82) | Lexicons, terminology management |
| markerSupport: route validation switches | Entity true only `kan_Knda>eng_Latn`; other five false. Glossary all six false (`markerSupport.js:2-18`) | Robust evaluation/ablation |
| editDistance: Levenshtein suggestions | English typing assistant only, not translation input unless user applies it (`editDistance.js:1-29`; `app.js:23`) | Dynamic programming, spelling correction |
| postprocessing: Indic script mapping + whitespace/NFC | Always affects display; script mapping is codepoint substitution, not word translation (`postprocessing.js:24-53`) | Transliteration, Unicode |

There is no with/without NLP quality comparison in the results. Therefore measured translation benefit from pipeline features is UNVERIFIED. A displayed “glossary applied” flag cannot occur on the current false route gates.

## D. Front end

Features: language selectors/swap; source input, counts, clear/example; translate/progress/error; output/copy/clear; spelling suggestion; model unload/status; diagnostics; local glossary CRUD/search; history CRUD/reuse; settings and history preference; smoke hooks (`app/index.html:13-50`, `app.js:9-25`). Responsive breakpoints are in `style.css:2` at 760/560 px; `responsive.css` is imported but its selectors such as `.translator-card`, `.section-heading`, `.language-row`, `.text-columns`, `.text-field`, `.action-row`, `.local-badge`, `.language-field` do not match the current HTML. Main CSS does have current responsive rules. Font stack includes Noto Sans Tamil/Kannada and Windows Nirmala UI/Tunga (`style.css:2`), but no bundled fonts. Form controls have labels/aria names and live output/progress (`index.html:25-36`); glossary term input labels use aria-label (`:41`). The code has a 20k input cap, but very long lines: `app.js` and `index.html` pack substantial UI logic/markup into single lines; `style.css` is 2 lines / 8KB. UTF-8 text renders as mojibake in inspected console output and likely source, e.g. `â†’` (`app.js:14,18`, `index.html:16,20`). Longest function >40 lines appears not obvious in production JS; source is highly compressed, reducing explainability. Five hardest viva files: `translator.js` (ONNX sessions/cache tensors/greedy loop), `nlpPipeline.js` (cross-module orchestration), `evaluationRunner.js` (IndexedDB pause/resume), `app.js` (many responsibilities in single lines), `sentenceSegmenter.js` (locale and fallback boundary logic).

## E. Offline/mobile

No PWA manifest, service worker, Capacitor/Cordova config, or Android directory appears in tree. Runtime model requests are local relative paths via `fetch` (`translator.js:30-42`, model root `modelRouter.js:3`); Vite bundles local WASM (`translator.js:1-13`). There are no analytics/CDN font imports in app code; however `style.css` uses `@import` to a local stylesheet. Build must include model files at `/indictrans2` for deployment. No APK/runtime phone test exists in inspected artifacts. Minimal Capacitor work: add config pointing webDir to built `dist`, Android platform/project and app id; stage model folders into the packaged asset/web directory (or split install asset delivery); ensure Vite base and `modelRouter.js` model root resolve to bundled files; allow large local files and test WebView fetch/ONNX WASM memory on target devices. Storage estimate alone cannot prove 6 GB viability; runtime memory, OS pressure, and WebView limits are UNVERIFIED.

## F. Evaluation

Dataset is FLORES-200 `devtest`, 1,012 aligned rows and six directions (`dataset_metadata.json`; `prepare_evaluation_pairs.py:3-17`). References are plain text and JSONL. Browser runner sequentially invokes production NLP and persists/checkpoints in IndexedDB (`evaluationRunner.js:1-24`; `app/evaluation.html:1`). Local benchmark uses Chromium DevTools and saves predictions/checkpoints (`run_local_benchmark.mjs:81-106`). Scorer validates IDs, text alignment, status, language, and count, then computes SacreBLEU BLEU (`smooth_method='exp'`; English 13a, Indic normalized/trivial tokenized) and CHRF with `word_order=2` (`score_evaluation.py:41-59`).

Full result JSON has 1012 successful rows per route and 0 failures. BLEU/chrF++: en→ta 17.7767/54.5856; en→kn 19.2553/53.5689; ta→en 32.2047/57.4378; kn→en 32.7427/58.2709; ta→kn 11.0453/43.2883; kn→ta 11.5351/46.0720 (`evaluation/results/final_results.json`). The 25-row pilot has all 150 successful and macro BLEU 25.6961 / chrF++ 56.4956 (`pilot_results.json`). Contradiction: `documentation/evaluation/results_analysis.md:3-5` claims no FLORES run/scores exist; stale after benchmark artifacts. `bleu_evaluation.md:11` says no scores are reported until complete references/predictions, also stale. Pilot summary explicitly correctly warns 25 examples are not final performance (`evaluation/results/evaluation_summary.md:1-20`).

The audited `failed_predictions.json` is `[]`; it cannot provide concrete failed-translation examples. Qualitative review is available in `evaluation/results/qualitative_error_analysis.md`, but is representative, not exhaustive. Example directly documented: en→ta ID 659 omits “(or gals)” and leaves “spectrum” in English; source and prediction are quoted in that report, but the adjacent lines do not include a reference for this case, so the requested source/reference/prediction triple is UNVERIFIED from this compact audit. It also reports repeated sequences and mojibake in multiple directions (same report table). Do not present translation quality as human certified.

## G. Tests and commands

Scripts: `test_nlp_components.mjs` checks preprocessing/segmentation/entities/glossary/marker gates/edit distance; `test_indicnlp.py` checks Indic normalization; `run_browser_smoke.mjs` checks local browser model loading, six directions, offline refresh and errors; `verify_models.py` checks files/JSON/ONNX; `run_local_benchmark.mjs` generates resumable prediction sets; `score_evaluation.py` validates and scores. Model/network tests should not be run as part of this read-only audit. No package test script is declared (`package.json:5-10`).

Commands confirmed by package metadata: `npm install` (install; can use lockfile via `npm ci` though not declared); `npm run dev`; `npm run build`; `npm run preview`; `npm run smoke` (requires browser, local models and server). Python: `.venv\\Scripts\\python.exe -m pip install -r requirements.txt` then `.venv\\Scripts\\python.exe scripts\\download_evaluation_dataset.py` (network/gated access required), `.venv\\Scripts\\python.exe scripts\\prepare_evaluation_pairs.py`, `node scripts\\run_local_benchmark.mjs --execute`, `.venv\\Scripts\\python.exe scripts\\score_evaluation.py --mode full`. Download commands are intentionally not run. Exact smoke prerequisites/arguments are in `scripts/run_browser_smoke.mjs`; exact invocation of a phone smoke test is UNVERIFIED because none exists. History (`git log --oneline -30`) returns only seven commits: Stage 2, Stage 3 NLP, Stage 4 frontend, cleanup, Stage 5.3 evaluation, pilot failure isolation, local benchmark runner; no commits beyond `72d0209` returned.

## H. Risks and prioritized plan

| Severity | Evidence | Impact | Suggested fix | Hours |
|---|---|---|---|---:|
| High | `translator.js:43-79,126-138`; model sizes above | Large transient memory may crash phone WebView; major APK risk | Measure on 6 GB device; replace FP32 with validated quantized assets and stream/load strategy | 3 |
| High | `markerSupport.js:2-18`; `nlpPipeline.js:58-82` | Most claimed entity/glossary NLP does not affect translations/marks | Run controlled enabled/disabled tests per route, enable only proven gates | 2 |
| High | no Android/PWA artifacts in tree; `vite.config.js:5-25` | Assignment APK requirement unmet | Add minimal Capacitor Android app, bundle assets, install and offline test | 2 |
| Medium | `results_analysis.md:3-5`, `bleu_evaluation.md:11` vs results | Viva contradiction undermines trust | Update docs against current full benchmark and limitations | 0.5 |
| Medium | `responsive.css:1-19`, `style.css:1-2` | Dead stylesheet rules and dense code slow explanation | Remove obsolete selectors and format JS/CSS; fix encoding | 0.5 |

8-hour order: (a) prove NLP value using same examples/model/settings with pipeline toggles and per-direction scores (2h); (b) benchmark model memory and validate a smaller/quantized model, record accuracy tradeoff (3h); (c) package/install offline APK with bundled files and phone checks (2h); (d) align stale docs and clean formatting/encoding (1h). Estimates are planning estimates, not measured work.

## Things I could not verify

- Exact human correctness of full benchmark predictions; automated BLEU/chrF are not human review.
- With-pipeline versus without-pipeline output/metric difference.
- Peak resident memory, speed, compatibility, and offline operation on an actual 6 GB phone/WebView; size-based estimate only.
- Presence of external deployment assets/config outside this checkout; only repository tree was checked.
- A source/reference/prediction triple for each direction’s meaning errors; `failed_predictions.json` is empty and qualitative examples are selective.
- Whether all listed model manifest checks still match current upstream provenance; models were not downloaded or refreshed.
- Full test pass status: no tests were run under the supplied read-only instructions.
- FLORES licensing/conditions current status; dataset metadata itself says verify current card.
