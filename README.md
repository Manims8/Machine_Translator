# TriLingua

TriLingua is a local English, Tamil, and Kannada machine translation project. It uses downloaded IndicTrans2 ONNX models and ONNX Runtime Web in the browser. Stage 3 adds explainable preprocessing and model-tokenizer-based chunking; Stage 4 provides a responsive translation workspace with local history, glossary tools, and settings.

## Features

- Translate between English, Tamil, and Kannada in all six directions.
- Run IndicTrans2 locally in the browser without a translation API.
- Inspect actual NLP and tokenizer diagnostics.
- Manage preferred terminology and optional English spelling suggestions.
- Keep up to 20 successful translations in local browser storage; history can be disabled.
- Use responsive desktop and mobile layouts with Tamil/Kannada system-font fallbacks.

## Screenshots

Screenshots will be added after a visual browser capture is performed. No fabricated images are included.

## Supported directions

- English ↔ Tamil
- English ↔ Kannada
- Tamil ↔ Kannada

Language tags are `eng_Latn`, `tam_Taml`, and `kan_Knda`. The router selects the English-to-Indic, Indic-to-English, or Indic-to-Indic model family for each pair.

## Run the development app

Use Node.js and npm already installed for this project. From the repository root:

```powershell
npm.cmd run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite. In PowerShell, `npm.ps1` may be blocked by execution policy, so use `npm.cmd`.

Build the frontend with:

```powershell
npm.cmd run build
```

Run all six browser translation smoke tests, error checks, and the offline refresh check with:

```powershell
npm.cmd run smoke
```

The smoke runner uses headless Chrome or Edge and writes actual translations, model loading times, translation times, and statuses to `evaluation/preliminary_smoke_tests.json`.

## How translation works

1. `modelRouter.js` chooses one model family for the requested language pair.
2. The engine loads that family's local configuration, source and target tokenizers, external ONNX weights, and three ONNX graphs.
3. Indic input is converted to the shared internal script, then tokenized with source and target language tags.
4. The encoder reads the source tokens. The decoder generates one token at a time and reuses its key/value cache between steps.
5. The target tokenizer decodes the generated IDs. Indic output is converted into the requested Tamil or Kannada script.

Only one model family is kept loaded at a time. Models and tokenizer files are served by Vite from `models/indictrans2/`; the 3.2 GiB of model data is not copied into the web build. The WASM runtime is served from the locally installed npm package. The translation pipeline does not use Hugging Face model downloads, CDNs, or a translation API.

See [the engine architecture notes](documentation/architecture/translation_engine.md) for module responsibilities and the token-generation flow.

## Models

- English → Tamil/Kannada: `hari31416/indictrans2-en-indic-dist-200M-ONNX`.
- Tamil/Kannada → English: `hari31416/indictrans2-indic-en-dist-200M-ONNX`.
- Tamil ↔ Kannada: `hari31416/indictrans2-indic-indic-dist-320M-ONNX`.

Model weights are downloaded separately and must not be committed to Git. `.gitignore` excludes the weight folders while keeping the model manifest trackable. The checked-in `plan` files describe the Stage 1 and Stage 2 work.

## First-time environment setup

The project currently has a Python 3.12 virtual environment. To use it in PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Python 3.11 was not installed during Stage 1; install it from [the official Python downloads page](https://www.python.org/downloads/) only if your assignment requires that version. The Stage 1 model download and verification scripts are `scripts/download_models.py` and `scripts/verify_models.py`.

The model documentation is in `models/README.md`; model names, file mappings, and verification status are in `models/indictrans2/model_manifest.json`.

The original browser demo is kept unchanged as a Git submodule under `references/indictrans2-onnx-browser-demo/`. Clone this project with `git clone --recurse-submodules` to fetch it, or run `git submodule update --init --recursive` after cloning.
