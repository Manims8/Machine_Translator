# STAGE 2 – Build and Verify the Offline Machine Translation Engine

## Project: TriLingua – English, Tamil and Kannada Machine Translator

Act as a senior NLP engineer and JavaScript/ONNX developer.

Stage 1 has been successfully completed. Your task now is to implement the actual pretrained machine translation inference engine using the locally downloaded IndicTrans2 ONNX models.

Do not just generate code snippets or provide theoretical instructions.

Work directly inside my existing project, modify the required files, execute the application, debug errors and verify actual translations.

The ultimate objective is to obtain a fully functional offline translation engine supporting all six translation directions.

---

# 1. EXISTING PROJECT ENVIRONMENT

Project directory:

D:\python\Machine_Translator

Environment:

- Windows 11
- Python 3.12.10
- Node.js 24.20.0
- npm 11.19.0
- Vite 8.3.8
- @huggingface/transformers 3.0.2
- onnxruntime-web 1.21.0
- Python onnxruntime 1.32.0
- RAM: 16 GB

IMPORTANT:

npm.ps1 is blocked by my PowerShell execution policy.

Use npm.cmd instead of npm.

Example:

npm.cmd run dev

The Python virtual environment is already available at:

.venv/

Activate it using:

.\.venv\Scripts\Activate.ps1

Do not recreate the environment.

Do not reinstall all dependencies.

Do not upgrade existing packages unnecessarily.

---

# 2. EXISTING PRETRAINED MODELS

Three complete FP32 ONNX model repositories are already downloaded.

Do not download them again.

Do not modify their contents.

Do not delete any model files.

Model locations:

MODEL 1:

models/indictrans2/en-indic-200m-fp32/

Repository:

hari31416/indictrans2-en-indic-dist-200M-ONNX

Supports:

English → Tamil

English → Kannada

MODEL 2:

models/indictrans2/indic-en-200m-fp32/

Repository:

hari31416/indictrans2-indic-en-dist-200M-ONNX

Supports:

Tamil → English

Kannada → English

MODEL 3:

models/indictrans2/indic-indic-320m-fp32/

Repository:

hari31416/indictrans2-indic-indic-dist-320M-ONNX

Supports:

Tamil → Kannada

Kannada → Tamil

All three models were verified successfully using Python ONNX Runtime.

All nine ONNX computation graphs loaded with CPUExecutionProvider.

Total model storage is approximately 3.2 GiB.

Before writing code, inspect the existing model_manifest.json and all three actual model directories.

Identify the exact filenames of:

- Encoder graph.
- Decoder graph.
- Decoder with past graph.
- Encoder external weight sidecars.
- Decoder external weight sidecars.
- Source tokenizer.
- Target tokenizer.
- Tokenizer metadata.
- Model configuration.
- Generation configuration.

Do not assume all models use exactly the same external sidecar filenames.

Read the actual files and use their correct filenames.

---

# 3. REFERENCE IMPLEMENTATION

Use the existing cloned repository as the main reference for translation logic.

Location:

references/indictrans2-onnx-browser-demo/

GitHub:

https://github.com/Hari31416/indictrans2-onnx-browser-demo

Study these files carefully:

- translator.js
- transliterate.js
- app.js
- index.html
- README.md

Particularly understand:

1. How the source tokenizer works.
2. How the target tokenizer works.
3. How language tags are added.
4. How encoder inference is performed.
5. How the decoder generates tokens.
6. How decoder key/value cache is passed between generation steps.
7. How EOS token detection works.
8. How external ONNX weight sidecars are loaded.
9. How Indic script transliteration is implemented.
10. How translation results are converted into their original scripts.

Use the existing implementation as a reference.

You may reuse or adapt its inference logic where appropriate, preserving the original repository in the references folder.

Do not unnecessarily rewrite the complete Transformer inference algorithm from scratch.

IMPORTANT:

The original browser demo uses remote model URLs and CDN imports.

Our implementation must use the already installed npm packages and local model files.

Do not leave remote Hugging Face or jsDelivr dependencies in the actual translation pipeline.

---

# 4. LOCAL MODEL SERVING

Our model directories currently exist outside the frontend application directory.

Configure Vite so that the frontend can load the existing model files locally without copying 3.2 GiB of data into another folder.

Inspect the current Vite configuration and project structure.

A recommended approach is:

- Set the Vite application root to the existing app directory if required.
- Configure the models directory as a local public asset directory.
- Set build.copyPublicDir to false so the model weights are not copied into the normal web build.
- Use correct local model URLs.
- Do not create duplicate copies of the model weights.

For example, a model path may resolve to:

/indictrans2/en-indic-200m-fp32/encoder_model.onnx

Adjust the exact URL based on your Vite configuration.

Test that the browser can successfully fetch a local model file.

Also verify that the ONNX external weight sidecars are accessible.

Use the Vite development server for now.

The future Android packaging stage will handle copying the model files into the mobile application's assets.

Do not implement Android packaging during this stage.

---

# 5. IMPLEMENT THE MODEL CONFIGURATION

Create or update:

app/src/js/modelRouter.js

The router must select the correct model based on the source and target language.

Use these language codes:

English:

eng_Latn

Tamil:

tam_Taml

Kannada:

kan_Knda

Implement the following logic:

IF source = English:

Use English-to-Indic model.

IF target = English:

Use Indic-to-English model.

IF source = Tamil AND target = Kannada:

Use Indic-to-Indic model.

IF source = Kannada AND target = Tamil:

Use Indic-to-Indic model.

Create a clean configuration structure.

Each configuration should contain:

- Model identifier.
- Local model folder.
- Source language.
- Target language.
- Model direction.
- Tokenizer source path.
- Tokenizer target path.
- Configuration file paths.
- Graph filenames.
- External data sidecar filenames.

Provide a function:

getModelConfig(sourceLanguage, targetLanguage)

It must return the correct configuration.

Also create:

getLanguageCode(languageName)

Do not hardcode model selection in multiple JavaScript files.

The model router must be the single source of truth.

---

# 6. IMPLEMENT THE TRANSLATION ENGINE

Create or update:

app/src/js/translator.js

This file is responsible for actual machine translation.

Use:

- @huggingface/transformers
- onnxruntime-web

Use the versions already installed in node_modules.

Avoid CDN imports.

Ensure the ONNX Runtime Web WASM files are served locally from the installed package, not downloaded from jsDelivr during translation.

Use WASM CPU inference as the default execution provider.

WebGPU may be added as an optional enhancement only if it is correctly supported and tested.

## A. Model loading

Implement:

loadTranslationModel(config)

This function should:

1. Identify the selected model directory.
2. Load tokenizer metadata.
3. Load generation configuration.
4. Load the source tokenizer.
5. Load the target tokenizer.
6. Load required external weight sidecars.
7. Load encoder_model.onnx.
8. Load decoder_model.onnx.
9. Load decoder_with_past_model.onnx.
10. Store the loaded sessions in memory.

Important:

The ONNX models use external weight files.

Read the existing reference implementation to understand how to pass externalData into ONNX Runtime Web.

Make sure the sidecar paths match the filenames declared in the model's ONNX graph.

Do not assume that loading just the ONNX graph is sufficient.

Provide progress callbacks for:

- Loading model configuration.
- Loading tokenizers.
- Loading external weights.
- Loading encoder.
- Loading decoder.
- Loading decoder with past.

Provide meaningful error messages when a file is missing or corrupted.

## B. Model memory management

The system has three models, but do not load all three simultaneously.

Only load the model needed for the current translation.

Keep the currently selected model loaded when translating multiple sentences in the same direction.

When changing model families:

- Release or unload the previous ONNX sessions.
- Clear unused references to the previous tokenizer.
- Load the required model.
- Avoid unnecessary simultaneous model allocations.

Do not add complicated model download functionality.

All model files already exist locally.

## C. Tokenization

Use the model's corresponding source and target tokenizer JSON files.

Use the tokenizer configuration and metadata supplied by the downloaded ONNX repository.

Do not implement a custom vocabulary.

Do not replace the tokenizer with a basic whitespace tokenizer.

Use language tags correctly.

For example:

English → Tamil:

Source tag: eng_Latn

Target tag: tam_Taml

Tamil → Kannada:

Source tag: tam_Taml

Target tag: kan_Knda

Follow the tokenization logic of the reference implementation, including its handling of language tags and vocabulary IDs.

Pay attention to the prefix-space handling workaround present in the reference implementation.

## D. Encoder-decoder inference

Use the existing ONNX inference architecture.

The translation flow is:

Input text
    ↓
Source tokenizer
    ↓
Input IDs and attention mask
    ↓
Encoder ONNX
    ↓
Encoder hidden states
    ↓
Decoder ONNX
    ↓
Decoder with past ONNX
    ↓
Generated token IDs
    ↓
Target tokenizer
    ↓
Translated text

Use autoregressive token generation.

Use the generation configuration supplied by the model.

Use EOS detection to stop generation.

Preserve the decoder key/value cache between generation steps.

Avoid loading or computing the full decoder context unnecessarily during every token-generation step.

Add a maximum-generation safeguard to prevent endless generation.

Return:

{
    translation: "...",
    totalTokens: 0,
    totalTimeMs: 0
}

Use the actual generated result and actual timing measurements.

Do not return hardcoded sample translations.

---

# 7. IMPLEMENT INDIC SCRIPT TRANSLITERATION

This is extremely important.

IndicTrans2 uses a shared internal script-processing approach for Indic languages.

The reference browser implementation includes transliteration functionality.

Study:

references/indictrans2-onnx-browser-demo/transliterate.js

Adapt the necessary functionality into:

app/src/js/postprocessing.js

Preserve the correct language-specific conversion logic.

For Indic input:

Tamil → Internal Devanagari representation.

Kannada → Internal Devanagari representation.

For Indic output:

Internal Devanagari representation → Tamil.

Internal Devanagari representation → Kannada.

English does not require Indic transliteration.

Expected flow:

Tamil input
    ↓
Convert Tamil script to internal representation
    ↓
IndicTrans2 model
    ↓
Convert generated representation to Kannada script
    ↓
Kannada output

For Kannada → Tamil, reverse the corresponding script conversion.

For English → Tamil and English → Kannada, convert the model's output to the correct target script.

For Tamil → English and Kannada → English, restore output directly as English.

Do not treat script transliteration as word-for-word translation.

Do not attempt to translate by replacing individual Tamil and Kannada words.

Use the reference implementation's actual transliteration algorithm and verify both input and output conversion.

---

# 8. BASIC PREPROCESSING AND POSTPROCESSING

For this stage, implement only reliable basic operations.

Create:

app/src/js/preprocessing.js

Implement:

1. Unicode NFC normalization.
2. Trimming unnecessary whitespace.
3. Consolidating repeated whitespace.
4. Preserve meaningful punctuation.
5. Preserve numbers and names as far as possible.
6. Empty input validation.

Do not add aggressive spelling correction.

Do not modify the semantic content of the user's sentence.

Do not blindly replace words after translation.

Advanced NLP preprocessing and glossary functionality will be handled in a later stage.

Postprocessing should:

- Decode token IDs.
- Restore the correct target-language script.
- Normalize whitespace.
- Preserve valid Unicode.
- Return clean text to the interface.

---

# 9. IMPLEMENT A SIMPLE TRANSLATION TEST INTERFACE

Do not design the final professional frontend yet.

Create a basic development test interface.

Use:

app/index.html

app/src/css/style.css

app/src/js/app.js

The interface should contain:

1. Source language dropdown.
2. Target language dropdown.
3. Text input area.
4. Translate button.
5. Translation output area.
6. Model-loading status.
7. Translation progress.
8. Translation time display.
9. Error message area.

The interface may be simple.

Its only purpose is to verify that the real translation engine works.

Add an option to unload the current model.

Add a button to swap languages.

Display the selected model family.

Do not add history, glossary, animations, analytics or advanced design at this stage.

---

# 10. SUPPORT ALL SIX TRANSLATION DIRECTIONS

Implement the following test cases.

Test case 1:

Source: English

Target: Tamil

Input:

How are you today?

Expected:

A valid Tamil-script translation.

Test case 2:

Source: English

Target: Kannada

Input:

I am going to college.

Expected:

A valid Kannada-script translation.

Test case 3:

Source: Tamil

Target: English

Input:

நான் இன்று கல்லூரிக்குச் செல்கிறேன்.

Expected:

A valid English translation.

Test case 4:

Source: Kannada

Target: English

Input:

ನಾನು ಇಂದು ಕಾಲೇಜಿಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ.

Expected:

A valid English translation.

Test case 5:

Source: Tamil

Target: Kannada

Input:

வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?

Expected:

A valid Kannada-script translation.

Test case 6:

Source: Kannada

Target: Tamil

Input:

ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?

Expected:

A valid Tamil-script translation.

IMPORTANT:

The expected descriptions above specify the output language, not the exact wording.

The generated translation must come from the pretrained model.

Do not hardcode expected results.

Do not claim a direction is successful unless an actual translation was executed.

Save actual outputs and status information in:

evaluation/preliminary_smoke_tests.json

Include:

- Source language.
- Target language.
- Input.
- Generated translation.
- Model used.
- Translation time.
- Execution status.

These are preliminary functional test examples, not the final BLEU evaluation dataset.

---

# 11. OFFLINE TESTING

Offline execution is a major project requirement.

During this stage, the application must use:

- Locally installed npm packages.
- Local model files.
- Local tokenizer files.
- Local ONNX sidecars.
- Local WASM runtime assets.
- Local script transliteration code.

No model file should be fetched from Hugging Face.

No library should be imported from jsDelivr.

No external translation API should be used.

No cloud service should be required.

After successful online setup, perform this test:

1. Start the local Vite server.
2. Load the application.
3. Load one translation model.
4. Perform a translation.
5. Disconnect Wi-Fi and mobile Internet, keeping localhost available.
6. Refresh the application.
7. Load the same model.
8. Perform another translation.
9. Verify that no external network dependency is required.

Record the test results.

If complete offline mode is not achieved, clearly identify which asset still requires the Internet.

Do not claim offline success based only on local model files existing.

---

# 12. TESTING AND ERROR HANDLING

Test the following:

| Test | Expected behaviour |
|---|---|
| Empty input | Validation message |
| Same source and target | Prevent translation |
| Model not loaded | Load model or display a clear instruction |
| Missing ONNX sidecar | Meaningful error |
| Invalid model path | Meaningful error |
| Empty model response | Error handling |
| Long text | Warn or handle safely |
| Unicode Tamil input | Correct script processing |
| Unicode Kannada input | Correct script processing |
| Offline operation | Translation continues without remote access |

Also test the model router separately.

Examples:

getModelConfig("eng_Latn", "tam_Taml")

Must return en-indic model.

getModelConfig("kan_Knda", "eng_Latn")

Must return indic-en model.

getModelConfig("tam_Taml", "kan_Knda")

Must return indic-indic model.

---

# 13. MAINTAIN CODE CLARITY

The assignment gives 30 marks for code clarity, comments and documentation.

Use separate modules.

Avoid putting all translation logic inside app.js.

Provide meaningful comments describing:

- Why language tags are necessary.
- How source tokenization works.
- What the encoder does.
- What the decoder does.
- Why decoder past states are used.
- Why script transliteration is needed.
- How model selection works.
- How external ONNX weights are loaded.

Use understandable variable and function names.

Write functions that can be explained by a third-year engineering student.

Avoid unnecessary abstractions and design patterns.

---

# 14. PERFORMANCE AND MEMORY

My laptop has 16 GB RAM.

Use the CPU/WASM backend first.

Add WebGPU only as an optional improvement if it can be tested successfully.

Important:

- Load only one model family at a time.
- Avoid unnecessary duplication of model buffers.
- Avoid loading multiple large ONNX sessions simultaneously.
- Release unused sessions when supported by the installed runtime.
- Avoid keeping large unused ArrayBuffers in memory.
- Show model-loading time separately from translation time.

Do not optimise model precision or quantize the model during this stage.

Use the downloaded FP32 models as the reference implementation.

---

# 15. IMPORTANT SECURITY AND DEPENDENCY RESTRICTIONS

Stage 1 reported two high-severity npm audit findings through a transitive sharp dependency.

Do not run:

npm audit fix --force

Do not blindly upgrade Transformers.js or ONNX Runtime Web.

Do not modify the working version numbers unless a demonstrated compatibility issue requires it.

Record any unresolved warnings.

Avoid adding unnecessary dependencies.

Keep node_modules and model weights excluded from Git.

---

# 16. BUILD AND VALIDATION

After implementing the translation engine:

Run:

npm.cmd run build

Fix actual build errors.

Start the development server:

npm.cmd run dev -- --host 127.0.0.1

Use the local browser interface to execute all six translations.

Check browser console errors.

Check browser network activity to ensure that model and runtime files are coming from the local application environment.

Run the model loading tests.

Do not mark incomplete translation directions as successful.

---

# 17. STAGE 2 ACCEPTANCE CRITERIA

The stage is complete only when:

[ ] Correct model routing works.

[ ] English-to-Indic model loads.

[ ] Indic-to-English model loads.

[ ] Indic-to-Indic model loads.

[ ] Source tokenizer loads locally.

[ ] Target tokenizer loads locally.

[ ] All required ONNX sidecars load locally.

[ ] Encoder ONNX executes.

[ ] Decoder ONNX executes.

[ ] Decoder-with-past ONNX executes.

[ ] Token generation produces real output.

[ ] Tamil input is handled correctly.

[ ] Kannada input is handled correctly.

[ ] Tamil output uses Tamil script.

[ ] Kannada output uses Kannada script.

[ ] All six translation directions are tested.

[ ] Translation latency is measured.

[ ] Basic error handling works.

[ ] Local inference does not depend on remote model downloads.

[ ] npm build succeeds.

[ ] Preliminary smoke-test results are saved.

---

# 18. FINAL REPORT

At the end, provide me with:

1. Files created.
2. Files modified.
3. Translation architecture.
4. How model routing works.
5. How tokenization works.
6. How encoder-decoder inference works.
7. How Indic transliteration works.
8. Actual test results for all six directions.
9. Model loading times.
10. Translation times.
11. Offline testing results.
12. Errors encountered.
13. Solutions implemented.
14. Remaining problems.
15. Exact commands to run the application.

Explain the implementation in simple language so that I can understand and present the code during my NLP assignment evaluation.

Do not start Stage 3 automatically.

Stop after the actual translation engine is functioning and all six smoke tests have been attempted and reported.