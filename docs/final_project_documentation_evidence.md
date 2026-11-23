# TriLingua Final Project Documentation and Evidence

## 1. Project Overview

TriLingua is a local browser-based neural machine translation application for English, Tamil, and Kannada. It is intended to operate without a remote translation API by loading downloaded IndicTrans2 ONNX models and running ONNX Runtime Web in the browser.

### Objectives

- Provide usable translation across English, Tamil, and Kannada.
- Keep model inference and browser text processing local.
- Support long-text chunking and real-time progress feedback.
- Provide NLP diagnostics, glossary controls, entity protection, and English spelling suggestions.
- Preserve pilot and full-benchmark evidence for academic reporting.

### Supported directions

- English -> Tamil
- English -> Kannada
- Tamil -> English
- Kannada -> English
- Tamil -> Kannada
- Kannada -> Tamil

## 2. Technology Stack

Verified in the repository/environment:

- Python 3.12.10
- Node.js 24.20.0
- npm 11.19.0
- Vite 8.3.8
- ONNX Runtime Web 1.21.0
- Transformers.js 3.0.2
- IndicTrans2 ONNX 200M/320M model families
- Indic NLP Library 0.92
- SacreBLEU 2.6.0
- NumPy and supporting Python packages listed in `requirements.txt`

The browser frontend uses JavaScript ES modules and CSS. The Python scripts support model download/verification, dataset preparation, Indic preprocessing, and metric scoring.

## 3. Model Architecture

`app/src/js/modelRouter.js` selects exactly one model family:

| Family | Local path | Source | Target |
|---|---|---|---|
| English to Indic | `models/indictrans2/en-indic-200m-fp32` | eng_Latn | tam_Taml or kan_Knda |
| Indic to English | `models/indictrans2/indic-en-200m-fp32` | tam_Taml or kan_Knda | eng_Latn |
| Indic to Indic | `models/indictrans2/indic-indic-320m-fp32` | Tamil or Kannada | Other Indic language |

Each family needs three ONNX graphs:

- `encoder_model.onnx`
- `decoder_model.onnx`
- `decoder_with_past_model.onnx`

They also need external ONNX sidecars, `tokenizer_src.json`, `tokenizer_tgt.json`, `tokenizer_meta.json`, `config.json`, `generation_config.json`, and tokenizer configuration. `models/indictrans2/model_manifest.json` records the verified layouts.

Only one family is kept active at a time. Loading a different family releases the previous model sessions before creating the new sessions.

## 4. Application Architecture

The UI entry point is `app/index.html`. `app/src/js/app.js` coordinates user input and output.

The main flow is:

1. The preprocessing module validates text and Unicode.
2. `nlpPipeline.js` loads the selected model family.
3. Entities and optional glossary terms are protected where marker support is verified.
4. Text is divided into paragraphs and sentence/token-budget chunks.
5. `translator.js` loads local tokenizers and ONNX graphs.
6. The encoder processes source tokens.
7. The decoder generates target tokens, reusing decoder-past cache tensors.
8. The target tokenizer decodes IDs.
9. Indic script postprocessing converts shared/internal output to Tamil or Kannada.
10. Restored entities/glossary terms and normalized whitespace are returned to the UI.

History is browser-local. Settings and glossary behavior are stored separately and can be disabled or reset.

## 5. NLP Processing

### Frontend preprocessing

The frontend normalizes Unicode to NFC, normalizes whitespace, rejects unsupported control characters, validates source/target route compatibility, and limits input to 20,000 characters.

### Chunking

Long input is divided by paragraph and sentence/token budget. The implementation checks source-token count using the active model tokenizer and reserves no additional tokens. Each chunk is translated separately and rejoined with paragraph boundaries preserved.

### Entity and glossary controls

Entities are recognized for URLs, email addresses, dates, currencies, decimals, phones, and identifiers. Marker protection is enabled only for verified directions. Glossary protection is verified or reference-only according to `markerSupport.js`.

Warnings explicitly report when entity or glossary protection is disabled for a direction.

### Postprocessing

Output is normalized to NFC and whitespace. The implementation includes script mapping for the Indic shared/internal representation and restores the requested Tamil or Kannada script.

### Spelling assistance

The English edit-distance module provides optional corrections for misspelled English input; it is not an automatic translation rewrite system.

## 6. Offline Architecture

The browser uses local models under Vite's public asset mapping and local ONNX Runtime Web WASM assets from the installed npm package. It disables remote Transformers.js model loading and uses browser-local files only.

The existing smoke test blocks external HTTPS requests and checks all six directions. This verifies the local-server browser workflow and that the required model assets are available. It does not prove a PWA works without the server or that an already-disconnected browser page has been cached for future reload.

## 7. Evaluation Methodology

The evaluation corpus is the FLORES-200 devtest parallel dataset. Each direction uses exactly 1,012 sentence pairs:

- English -> Tamil
- English -> Kannada
- Tamil -> English
- Kannada -> English
- Tamil -> Kannada
- Kannada -> Tamil

Total: 6,072 predictions.

The Stage 6.1 audit confirmed 1,012 unique IDs per direction, no missing/duplicate/extra records, valid JSONL and UTF-8, successful status, aligned source/reference text, and valid timing fields.

Metrics use SacreBLEU:

- BLEU uses corpus BLEU with exponential smoothing.
- chrF++ uses word order 2.
- English targets use SacreBLEU `13a` tokenization.
- Tamil and Kannada targets use the project Indic preprocessing helper:
  - IndicNormalizerFactory
  - `trivial_tokenize`

The preprocessing is applied to candidates and references for Indic targets.

## 8. Final Benchmark Results

Verified against `evaluation/results/final_results.json`:

| Direction | BLEU | chrF++ |
|---|---:|---:|
| English -> Tamil | 17.776693 | 54.585597 |
| English -> Kannada | 19.255344 | 53.568908 |
| Tamil -> English | 32.204653 | 57.437847 |
| Kannada -> English | 32.742676 | 58.270864 |
| Tamil -> Kannada | 11.045295 | 43.288348 |
| Kannada -> Tamil | 11.535107 | 46.072020 |

- Macro-average BLEU: 20.759961
- Macro-average chrF++: 52.203931
- Failed predictions: 0

Indic-to-English achieved the highest direction-level BLEU results. Direct Tamil/Kannada directions were lowest.

## 9. Qualitative Error Analysis

The qualitative report is `evaluation/results/qualitative_error_analysis.md`.

### Strengths

- Straightforward news facts, dates, organizations, and event relationships are often preserved.
- English-to-Indic directions generally preserve the main public or medical topic.
- Indic-to-English directions are often grammatically natural and readable.
- Many source meanings remain understandable despite reference wording differences.

### Weaknesses

- Named entities, organization names, and person names can be mistransliterated or replaced.
- Time ranges and date formatting can become placeholders or encoded-looking strings.
- Medical and technical terms can be mistranslated.
- Direct Indic-to-Indic directions can repeat tokens or collapse quoted passages.
- Pronoun, singular/plural, and formality details can change.
- Missing words or added context can alter formal/legal meaning.

The analysis identifies Tamil->Kannada and Kannada->Tamil as the weakest directions, with Kannada->English and Tamil->English also showing serious entity and terminology failures in a smaller set of examples.

## 10. Limitations and Future Work

Verified limitations:

- Browser CPU inference and memory are device-dependent.
- Entity protection and glossary protection are not uniformly verified across directions.
- Direct Indic-to-Indic quality is substantially weaker than the English-to-Indic and Indic-to-English directions.
- Proper nouns and rare technical terms require review.
- A PWA or native Android application is not implemented or claimed.
- Repeating or partially corrupted generated text remains possible, especially in quoted and rare-term passages.

Potential future work:

- Improve named-entity preservation and transliteration consistency.
- Expand and verify marker-preservation support for glossary and entity replacement.
- Improve handling of direct Indic-to-Indic technical vocabulary.
- Add output-confidence or quality-warning signals.
- Add a reproducible disconnected PWA deployment test.
- Increase human-reviewed qualitative coverage beyond representative examples.

## 11. Reproducibility

### Install

```powershell
npm.cmd install
python -m pip install -r requirements.txt
```

### Download or verify assets

```powershell
python scripts/download_models.py
python scripts/verify_models.py
python scripts/download_evaluation_dataset.py
```

Indic NLP resources must remain under `resources/indic_nlp_resources/`.

### Run the app

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

### Test

```powershell
node scripts/test_nlp_components.mjs
python scripts/test_indicnlp.py
npm.cmd run build
npm.cmd run smoke
```

### Validate and score

```powershell
python scripts/score_evaluation.py --mode full --expected-count 1012 --validate-only
python scripts/score_evaluation.py --mode full --expected-count 1012
```

Do not rerun full benchmark translations or modify prediction/reference JSONL files. Pilot mode must remain separate from full mode.
