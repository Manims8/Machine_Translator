# STAGE 1 – Environment Setup and Pretrained Model Download
## Project: TriLingua – Offline English, Tamil and Kannada Machine Translator

Act as a senior software engineer and NLP engineer. Your task is to set up the complete development environment and download the required pretrained machine translation models for my college NLP assignment.

Do not just provide instructions. Execute the setup commands, create the folders and files, install dependencies, download the model files, and verify the results wherever possible.

---

# 1. PROJECT BACKGROUND

Project Name: TriLingua

Project Description:

I am a third-year Robotics and Artificial Intelligence engineering student developing an offline multilingual machine translation application using Natural Language Processing.

The application must translate between:

1. English → Tamil
2. English → Kannada
3. Tamil → English
4. Kannada → English
5. Tamil → Kannada
6. Kannada → Tamil

I do not want to train a neural machine translation model from scratch.

I want to integrate pretrained IndicTrans2 models and build my own NLP preprocessing, postprocessing, translation routing and evaluation components.

The final application will have:

- HTML frontend
- CSS styling
- JavaScript application logic
- ONNX Runtime Web for local model execution
- IndicTrans2 pretrained ONNX models
- Capacitor for Android APK packaging
- Python for BLEU evaluation

The application must eventually work without an Internet connection on both laptop and Android.

---

# 2. MY DEVELOPMENT ENVIRONMENT

My current configuration:

- Operating System: Windows 11
- RAM: 16 GB
- Programming Language: Python
- Frontend: HTML, CSS and JavaScript
- Mobile Target: Android APK
- Development IDE: VS Code / Codex

Use Windows PowerShell commands.

Do not use Linux-specific commands unless there is no Windows alternative.

Use a Python virtual environment. Do not install Python libraries globally.

Do not install unnecessary machine learning libraries.

---

# 3. IMPORTANT MODEL SELECTION

Use the following THREE pretrained ONNX models.

These are ONNX exports of AI4Bharat IndicTrans2 distilled models.

## Model 1: English to Indic

Hugging Face repository:

https://huggingface.co/hari31416/indictrans2-en-indic-dist-200M-ONNX

Model ID:

hari31416/indictrans2-en-indic-dist-200M-ONNX

Supports:

- English → Tamil
- English → Kannada

Language configuration:

Source: eng_Latn

Target Tamil: tam_Taml

Target Kannada: kan_Knda

## Model 2: Indic to English

Hugging Face repository:

https://huggingface.co/hari31416/indictrans2-indic-en-dist-200M-ONNX

Model ID:

hari31416/indictrans2-indic-en-dist-200M-ONNX

Supports:

- Tamil → English
- Kannada → English

Language configuration:

Source Tamil: tam_Taml

Source Kannada: kan_Knda

Target: eng_Latn

## Model 3: Indic to Indic

Hugging Face repository:

https://huggingface.co/hari31416/indictrans2-indic-indic-dist-320M-ONNX

Model ID:

hari31416/indictrans2-indic-indic-dist-320M-ONNX

Supports:

- Tamil → Kannada
- Kannada → Tamil

Language configuration:

Source Tamil: tam_Taml

Source Kannada: kan_Knda

Target Tamil: tam_Taml

Target Kannada: kan_Knda

IMPORTANT:

Use the distilled versions only.

Do not download the 1-billion-parameter models.

Do not download the original PyTorch model repositories from ai4bharat for this browser-based implementation.

Do not attempt model training or fine-tuning.

Initially use the FP32 ONNX model repositories as the quality reference.

Do not silently substitute another model if a repository is unavailable. Report the error.

---

# 4. CREATE THE PROJECT DIRECTORY STRUCTURE

Create a project directory named:

TriLingua

Use the current VS Code workspace if it is suitable. Otherwise create:

%USERPROFILE%\Projects\TriLingua

Create this folder structure:

TriLingua/

    app/

        index.html

        src/

            css/

                style.css

                responsive.css

            js/

                app.js

                language.js

                modelRouter.js

                translator.js

                preprocessing.js

                postprocessing.js

                glossary.js

                history.js

        assets/

            images/

            fonts/

    models/

        indictrans2/

            en-indic-200m-fp32/

            indic-en-200m-fp32/

            indic-indic-320m-fp32/

    scripts/

        download_models.py

        verify_models.py

    evaluation/

        dataset/

        references/

        predictions/

        results/

    documentation/

        architecture/

        screenshots/

    references/

        indictrans2-onnx-browser-demo/

    .venv/

    package.json

    requirements.txt

    .gitignore

    README.md

Do not create the final user interface or complete translation engine during this stage.

Only create the required placeholder files and environment setup files.

Do not overwrite existing user files. Inspect the workspace before making changes.

---

# 5. CHECK AND CONFIGURE PYTHON

First check the installed Python versions.

Use:

py --list

I prefer Python 3.11.

If Python 3.11 is installed, use it.

If it is not installed, inform me and provide the official installation link:

https://www.python.org/downloads/

Do not install an incompatible Python version.

Create a virtual environment inside the project directory.

PowerShell:

py -3.11 -m venv .venv

Activate:

.\.venv\Scripts\Activate.ps1

Upgrade pip:

python -m pip install --upgrade pip

Install these Python packages:

python -m pip install numpy

python -m pip install onnxruntime

python -m pip install tokenizers

python -m pip install "huggingface_hub[hf_xet]"

python -m pip install sacrebleu

The purpose of these packages:

- numpy: Numerical operations.
- onnxruntime: Running ONNX inference and checking model compatibility.
- tokenizers: Tokenization operations.
- huggingface_hub: Downloading pretrained model repositories.
- sacrebleu: Future BLEU score evaluation.

Record the installed package versions in requirements.txt.

Do not install PyTorch, CUDA, Fairseq or Transformers unless there is a specific dependency requirement discovered during verification.

Our selected ONNX-based architecture does not require training a model.

---

# 6. CHECK AND CONFIGURE NODE.JS

Check whether Node.js and npm are installed.

Execute:

node --version

npm --version

git --version

Use a currently supported Node.js LTS version compatible with Vite.

If Node.js is missing, provide the official installation page:

https://nodejs.org/

Do not modify the global Node.js environment unnecessarily.

Inside the TriLingua project:

Initialize npm:

npm init -y

Install the development dependency:

npm install --save-dev vite

Install the JavaScript inference libraries, using the versions referenced by the existing IndicTrans2 browser demonstration:

npm install @huggingface/transformers@3.0.2 onnxruntime-web@1.21.0

Configure package.json with:

- type: module
- dev: vite
- build: vite build
- preview: vite preview

Make sure the libraries are locally installed, not dependent on CDN imports.

We need local JavaScript dependencies eventually because the Android APK must work offline.

Do not build the final UI in this stage.

---

# 7. CLONE THE EXISTING INDIC TRANS ONNX BROWSER DEMO

Clone this repository into:

references/indictrans2-onnx-browser-demo/

Repository:

https://github.com/Hari31416/indictrans2-onnx-browser-demo

Use:

git clone --depth 1 https://github.com/Hari31416/indictrans2-onnx-browser-demo.git references/indictrans2-onnx-browser-demo

Inspect the following files:

- README.md
- index.html
- app.js
- translator.js
- transliterate.js
- style.css

Understand how the current implementation:

1. Loads pretrained ONNX models.
2. Loads source and target tokenizers.
3. Uses ONNX Runtime Web.
4. Performs encoder inference.
5. Performs autoregressive decoder inference.
6. Uses cached decoder outputs.
7. Handles Tamil and Kannada script conversion.
8. Uses WebAssembly and WebGPU.
9. Handles model downloads and browser caching.

IMPORTANT:

This repository is a reference implementation, not the final application.

Do not blindly copy its complete UI.

Do not assume its online model-download behaviour is sufficient for permanent offline operation.

We will customise it during later stages.

Keep the original repository unchanged.

---

# 8. DOWNLOAD ALL THREE PRETRAINED ONNX MODEL REPOSITORIES

This is the most important task of Stage 1.

Use Python huggingface_hub.snapshot_download().

Download the complete model repository for each of the three model IDs.

Do not download only encoder_model.onnx.

Do not selectively download only the main ONNX graph files.

Download the complete repository snapshot, including all external weight sidecars, tokenizer files and configurations.

Use these exact destination folders:

MODEL 1:

models/indictrans2/en-indic-200m-fp32/

Repository:

hari31416/indictrans2-en-indic-dist-200M-ONNX

MODEL 2:

models/indictrans2/indic-en-200m-fp32/

Repository:

hari31416/indictrans2-indic-en-dist-200M-ONNX

MODEL 3:

models/indictrans2/indic-indic-320m-fp32/

Repository:

hari31416/indictrans2-indic-indic-dist-320M-ONNX

Implement the download process inside:

scripts/download_models.py

Use:

from huggingface_hub import snapshot_download

Use the repository IDs specified above.

Use local_dir to store each complete repository in its corresponding directory.

Do not set restrictive allow_patterns. I want complete repository snapshots during initial setup.

Download sequentially to avoid consuming excessive system memory.

Use progress reporting.

Handle network interruptions and allow downloads to resume using Hugging Face's normal download/cache mechanisms.

If one model fails, report exactly which repository failed and why.

Do not silently substitute an alternative repository.

Before downloading, check that the computer has sufficient free disk space.

Require at least 10 GB free space for this initial setup, including temporary storage.

If sufficient space is unavailable, stop before downloading and explain the issue.

Do not put Hugging Face authentication tokens inside Python scripts, JavaScript files or Git-tracked configuration files.

If authentication is required, tell me to authenticate separately using the official Hugging Face CLI.

---

# 9. VERIFY THE DOWNLOADED MODEL FILES

Create:

scripts/verify_models.py

Verify that every model directory contains the required ONNX and tokenizer files.

For each of the three models, check for:

1. encoder_model.onnx
2. encoder_model.onnx.data
3. decoder_model.onnx
4. decoder_with_past_model.onnx
5. decoder_shared.onnx.data
6. tokenizer_src.json
7. tokenizer_tgt.json
8. tokenizer_meta.json
9. config.json
10. generation_config.json

Also retain all other downloaded repository files.

Some files are very large. Verify that files are not empty and that the model folder contains the expected external weight sidecars.

Parse the JSON configuration and tokenizer metadata files to ensure that they are valid JSON.

Check the ONNX Runtime installation:

import onnxruntime as ort

print(ort.get_available_providers())

Try loading each model's three ONNX graphs one model at a time with CPUExecutionProvider.

Do not load all three large models simultaneously.

Example:

ort.InferenceSession(
    "models/indictrans2/en-indic-200m-fp32/encoder_model.onnx",
    providers=["CPUExecutionProvider"]
)

Check all three model graphs.

Release each session before checking the next model.

Use garbage collection where necessary.

If the external ONNX weight files are missing or the runtime cannot load a graph, report that model as failed. Do not mark an incomplete download as successful.

---

# 10. CREATE MODEL CONFIGURATION DOCUMENTATION

Create:

models/indictrans2/model_manifest.json

It must contain:

- Model name.
- Hugging Face repository ID.
- Model direction.
- Base model parameter size.
- Model format.
- Precision.
- Local model directory.
- Supported source languages.
- Supported target languages.
- Required model graph files.
- Required sidecar files.
- Tokenizer files.
- Download status.
- Verification status.

For language codes, use:

English: eng_Latn

Tamil: tam_Taml

Kannada: kan_Knda

This configuration will later be consumed by the JavaScript model router.

Create:

models/README.md

Explain the difference between:

- Original PyTorch checkpoints.
- ONNX model graphs.
- External ONNX weight files.
- Source and target tokenizers.
- Model configuration files.

Also explain why downloading the ONNX repository as a complete directory is necessary.

---

# 11. CREATE A .GITIGNORE FILE

Make sure large model weights and local dependencies are not accidentally pushed to GitHub.

Include:

.venv/

node_modules/

dist/

models/indictrans2/*

__pycache__/

*.pyc

.env

.cache/

.vscode/

Keep README and model manifest files trackable.

Do not commit the actual model weights to Git.

---

# 12. CREATE THE MAIN README

Create the root README.md.

Include:

Project name: TriLingua

Description:

An offline multilingual neural machine translation application supporting English, Tamil and Kannada using pretrained IndicTrans2 models and ONNX Runtime.

Include:

- Project objectives.
- Supported languages.
- Six translation directions.
- Selected pretrained models.
- Environment requirements.
- Installation steps.
- Folder structure.
- Model download procedure.
- Model verification procedure.
- Offline execution approach.
- Technologies used.

Explain that the model weights are downloaded separately and must not be committed into the Git repository.

---

# 13. STAGE 1 ACCEPTANCE CRITERIA

Do not report Stage 1 as completed until you have attempted and verified these items.

[ ] Project directory created.

[ ] All required project folders created.

[ ] Python version verified.

[ ] Python virtual environment created.

[ ] Required Python packages installed.

[ ] Node.js and npm checked.

[ ] Vite installed.

[ ] ONNX Runtime Web installed.

[ ] Hugging Face Hub installed.

[ ] Existing IndicTrans2 browser demo cloned into references.

[ ] English-to-Indic ONNX repository downloaded.

[ ] Indic-to-English ONNX repository downloaded.

[ ] Indic-to-Indic ONNX repository downloaded.

[ ] External ONNX weight sidecars verified.

[ ] Tokenizer files verified.

[ ] Model configuration files verified.

[ ] ONNX graphs loaded successfully with CPUExecutionProvider, if the runtime check is supported.

[ ] Model manifest generated.

[ ] README generated.

[ ] .gitignore generated.

If any item fails, explain what failed and what I need to do.

Do not claim a model is working merely because its files were downloaded.

---

# 14. IMPORTANT SCOPE RESTRICTIONS

This is ONLY Stage 1.

Do not implement:

- Translation UI.
- Final frontend design.
- Translation routing.
- NLP preprocessing.
- NLP postprocessing.
- Glossary.
- Translation history.
- BLEU evaluation.
- Android APK.
- Model training.
- Model fine-tuning.
- Any backend API.

We will implement these in subsequent stages.

Do not introduce unnecessary technologies.

Do not create a complicated backend.

The goal is a clean and understandable development environment that a third-year engineering student can explain.

---

# 15. FINAL OUTPUT REQUIRED FROM YOU

After completing the setup, give me a structured report containing:

1. Project directory location.
2. Installed Python version.
3. Installed Node.js and npm versions.
4. Python dependencies installed.
5. JavaScript dependencies installed.
6. Three downloaded model repository names.
7. Local model folder locations.
8. Total downloaded storage size.
9. Model verification results.
10. ONNX Runtime verification results.
11. Any errors or warnings.
12. Exact commands to activate the Python environment.
13. Exact command to start the local JavaScript development server.
14. Any manual steps still pending.

Also explain, in simple language, what each of the three downloaded models does.

Do not start Stage 2 automatically.

Stop after completing Stage 1 and presenting the verification report.