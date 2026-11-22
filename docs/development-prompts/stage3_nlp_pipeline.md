# STAGE 3 – NLP ENHANCEMENT, TEXT PREPROCESSING AND POSTPROCESSING

## Project: TriLingua – Offline English, Tamil and Kannada Machine Translator

Act as a senior NLP engineer and software developer.

Stage 1 and Stage 2 have been completed successfully.

Your task is to enhance the existing machine translation application by implementing an explainable NLP processing pipeline around the already functioning IndicTrans2 translation engine.

This stage must demonstrate practical NLP concepts from my third-year Robotics and Artificial Intelligence Natural Language Processing syllabus.

IMPORTANT:

Do not rebuild the translation engine.

Do not replace the pretrained model.

Do not train or fine-tune any model.

Do not break the existing six translation directions.

Do not redesign the complete frontend.

Preserve the current translation functionality and enhance the NLP pipeline in a modular and explainable way.

Work directly in the existing project, implement the functionality, run the tests and document actual results.

---

# 1. CURRENT PROJECT INFORMATION

Project location:

D:\python\Machine_Translator

Operating system:

Windows 11

RAM:

16 GB

Python:

3.12.10

Node.js:

24.20.0

npm:

11.19.0

Existing JavaScript dependencies:

- Vite 8.3.8
- @huggingface/transformers 3.0.2
- onnxruntime-web 1.21.0

Python virtual environment:

.venv/

Use npm.cmd instead of npm because npm.ps1 is blocked by the current PowerShell execution policy.

Existing project folders:

- app/
- models/
- scripts/
- evaluation/
- documentation/
- references/

Three pretrained IndicTrans2 ONNX model families are already downloaded locally.

Do not redownload them.

---

# 2. EXISTING FUNCTIONALITY – MUST BE PRESERVED

The application currently supports:

1. English → Tamil
2. English → Kannada
3. Tamil → English
4. Kannada → English
5. Tamil → Kannada
6. Kannada → Tamil

Existing working components:

- app/src/js/app.js
- app/src/js/modelRouter.js
- app/src/js/translator.js
- app/src/js/preprocessing.js
- app/src/js/postprocessing.js
- app/index.html
- app/src/css/style.css
- vite.config.js

Inspect all these files before modifying anything.

Read:

documentation/architecture/translation_engine.md

Also inspect:

evaluation/preliminary_smoke_tests.json

The existing Stage 2 implementation has passed six actual browser translations.

Recorded baseline translation times:

| Direction | Baseline translation time |
|---|---:|
| English → Tamil | 363 ms |
| English → Kannada | 343 ms |
| Tamil → English | 424 ms |
| Kannada → English | 330 ms |
| Tamil → Kannada | 413 ms |
| Kannada → Tamil | 531 ms |

Model-loading times:

- English-Indic: 6.78 seconds
- Indic-English: 5.57 seconds
- Indic-Indic: 7.52 seconds

These are existing baseline measurements, not guaranteed future performance.

Before modifying the code, run:

npm.cmd run smoke

Save or preserve the baseline results.

If a baseline test fails, investigate it before proceeding.

Do not overwrite the original smoke-test evidence.

---

# 3. OBJECTIVE OF STAGE 3

Create a modular NLP pipeline.

The proposed processing flow is:

USER INPUT
    |
    v
INPUT VALIDATION
    |
    v
UNICODE NORMALIZATION
    |
    v
TEXT CLEANING
    |
    v
SENTENCE SEGMENTATION
    |
    v
ENTITY DETECTION AND PROTECTION
    |
    v
OPTIONAL GLOSSARY APPLICATION
    |
    v
MODEL TOKENIZATION
    |
    v
INDICTRANS2 TRANSLATION
    |
    v
ENTITY AND GLOSSARY RESTORATION
    |
    v
TARGET SCRIPT CONVERSION
    |
    v
OUTPUT NORMALIZATION
    |
    v
TRANSLATED TEXT

The existing translator.js must remain the primary translation engine.

Create an additional orchestration module if necessary.

Recommended file:

app/src/js/nlpPipeline.js

This module coordinates preprocessing, translation and postprocessing.

Keep all functionality modular.

---

# 4. FEATURE 1 – TEXT NORMALIZATION

NLP concept:

Text preprocessing, Unicode normalization and regular expressions.

Modify or improve:

app/src/js/preprocessing.js

Implement the following functions.

A. normalizeUnicode(text)

Use Unicode NFC normalization.

Example:

text.normalize("NFC")

Do not automatically use NFKC because compatibility normalization can alter valid text distinctions.

B. normalizeWhitespace(text)

Requirements:

- Remove unnecessary leading and trailing whitespace.
- Collapse repeated spaces.
- Preserve meaningful sentence boundaries.
- Preserve paragraph breaks.
- Preserve tabs and line breaks where meaningful.

C. sanitizeInput(text)

Requirements:

- Handle empty text.
- Handle whitespace-only input.
- Detect unsupported control characters.
- Avoid removing valid Unicode characters.
- Preserve Tamil characters.
- Preserve Kannada characters.
- Preserve English punctuation.

IMPORTANT:

Do not blindly remove zero-width joiners or non-joiners. They can be meaningful in Indic text.

D. validateInput(text, source, target)

Check:

- Empty input.
- Same source and target languages.
- Input length.
- Invalid language combinations.

Return structured validation results.

Example:

{
    valid: true,
    normalizedText: "...",
    warnings: []
}

Do not perform aggressive automatic spelling correction.

Do not modify the intended meaning of the input.

---

# 5. FEATURE 2 – SENTENCE SEGMENTATION

NLP concept:

Sentence boundary detection and text segmentation.

Implement:

app/src/js/sentenceSegmenter.js

The goal is to handle paragraphs and long input safely.

Requirements:

1. Detect sentence boundaries.
2. Support English, Tamil and Kannada text.
3. Support punctuation such as full stops, question marks and exclamation marks.
4. Preserve punctuation.
5. Preserve original sentence ordering.
6. Preserve paragraph structure where practical.
7. Avoid splitting decimals unnecessarily.
8. Avoid incorrectly splitting common English abbreviations.
9. Avoid splitting URLs in the middle.
10. Avoid dropping empty or meaningful punctuation.

Use Intl.Segmenter where appropriate, with a reliable fallback for supported browsers.

IMPORTANT:

Do not translate every short sentence independently by default.

Independent sentence translation can remove useful context.

Instead:

- Keep ordinary short inputs together.
- Group adjacent sentences into chunks.
- Split only when the token count approaches the model's safe input limit.
- Preserve sentence order.
- Preserve paragraph boundaries.
- Never exceed the configured maximum token length.

Determine the actual model maximum source length by inspecting the existing tokenizer and configuration.

Do not invent a maximum sequence length.

Create:

segmentText(text, options)

Return an array of chunks.

Test with:

English:

I am a robotics student. I study artificial intelligence. I want to build a translator.

Tamil:

நான் ஒரு ரோபோட்டிக்ஸ் மாணவன். நான் செயற்கை நுண்ணறிவு படிக்கிறேன்.

Kannada:

ನಾನು ರೊಬೋಟಿಕ್ಸ್ ವಿದ್ಯಾರ್ಥಿ. ನಾನು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯನ್ನು ಕಲಿಯುತ್ತಿದ್ದೇನೆ.

Ensure the output preserves all original text information.

---

# 6. FEATURE 3 – ENTITY DETECTION AND PROTECTION

NLP concept:

Named entities, regular expressions and information preservation.

Implement:

app/src/js/entityProtection.js

Detect useful entities:

- Email addresses.
- URLs.
- Phone numbers.
- Dates.
- Decimal numbers.
- Currency amounts.
- IDs and alphanumeric identifiers.

Example input:

My appointment is on 25/11/2026 at 10:30 AM. My email is student@example.com.

The system should attempt to preserve these entities during translation.

IMPORTANT:

Machine translation models may modify, transliterate or accidentally alter names, numerical values or identifiers.

Do not assume that an arbitrary placeholder will always survive model translation.

Implement a reversible placeholder strategy.

Before enabling entity protection:

1. Generate a unique placeholder for each detected entity.
2. Pass the placeholder through the actual source tokenizer.
3. Test whether the translation model preserves it.
4. Test the placeholder through all relevant translation directions.
5. Verify that it can be restored exactly.
6. Detect duplicate or missing placeholders.
7. Detect placeholders that have been modified by the model.

If the marker is not reliably preserved, do not silently restore incorrect data.

Use a safe fallback strategy:

- Leave the original text untouched.
- Disable protection for the unsupported entity type or model direction.
- Display a warning in diagnostics.
- Never corrupt the translation.

Do not implement automatic proper-noun recognition using untested assumptions.

Allow manually supplied glossary entries to represent names and technical terminology.

Create:

protectEntities(text)
restoreEntities(text, entityMap)
validateProtectedEntities(text, entityMap)

Return detailed diagnostic information.

---

# 7. FEATURE 4 – BILINGUAL TERMINOLOGY GLOSSARY

NLP concept:

Lexical resources and domain-specific vocabulary.

Implement:

app/src/js/glossary.js

Create a local glossary supporting all six translation directions.

Initially provide these sample terms:

English:
Robot

Tamil:
ரோபோ

Kannada:
ರೋಬೋಟ್

English:
Artificial Intelligence

Tamil:
செயற்கை நுண்ணறிவு

Kannada:
ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ

English:
Machine Learning

Tamil:
இயந்திரக் கற்றல்

Kannada:
ಯಂತ್ರ ಕಲಿಕೆ

English:
Neural Network

Tamil:
நரம்பியல் வலைப்பின்னல்

Kannada:
ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್

English:
Translation

Tamil:
மொழிபெயர்ப்பு

Kannada:
ಅನುವಾದ

These are starting examples and should be reviewed by native speakers.

Glossary schema:

{
    id: "...",
    sourceLanguage: "English",
    targetLanguage: "Tamil",
    sourceTerm: "Artificial Intelligence",
    targetTerm: "செயற்கை நுண்ணறிவு",
    enabled: true
}

Implement functions:

getGlossary(source, target)

addGlossaryEntry(entry)

updateGlossaryEntry(id, entry)

deleteGlossaryEntry(id)

validateGlossaryEntry(entry)

Store glossary entries locally.

Use localStorage or IndexedDB as appropriate.

Do not use an external database or cloud API.

## Glossary translation integration

I want glossary entries to influence actual translations, not simply appear in a table.

Investigate a reversible phrase-protection approach.

However, only enable it when the actual model preserves the chosen placeholders reliably.

Requirements:

- Support multiword phrases.
- Match longer phrases before shorter overlapping phrases.
- Avoid accidental substring replacements.
- Respect Unicode.
- Handle different model families separately.
- Restore target terminology exactly after successful inference.

Test glossary protection independently for all six directions.

If placeholder preservation fails for a particular direction, disable automatic glossary insertion for that direction and expose a safe manual terminology reference.

Do not blindly replace words in translated sentences.

Do not destroy target-language grammar.

Document the difference between a glossary reference and enforced terminology.

---

# 8. FEATURE 5 – MINIMUM EDIT DISTANCE

NLP concept:

Module 2 – Minimum Edit Distance.

Implement:

app/src/js/editDistance.js

Use the Levenshtein distance algorithm.

The algorithm must calculate the minimum number of:

- Insertions.
- Deletions.
- Substitutions.

needed to transform one word into another.

Example:

artifical → artificial

The function should return the minimum edit distance.

Implement:

levenshteinDistance(word1, word2)

Also implement:

suggestCorrections(word, dictionary)

Only implement English spelling suggestions during this stage.

Create a small local English vocabulary file containing:

- artificial
- intelligence
- robotics
- translation
- language
- neural
- network
- computer
- science
- learning
- algorithm
- technology
- machine
- model

Use the glossary to extend this dictionary where appropriate.

Do not claim that this is a complete English spell checker.

Do not automatically change user input.

Display suggestions as optional recommendations.

Tamil and Kannada spelling correction is out of scope for this stage.

Explain the edit-distance algorithm in comments and documentation.

---

# 9. FEATURE 6 – MODEL TOKENIZATION DIAGNOSTICS

NLP concept:

Tokenization and subword representation.

The project already has the correct pretrained model tokenizers.

Do not create a new tokenizer.

Implement a diagnostic function that uses the currently selected model's actual tokenizer.

Return:

{
    sourceTokenCount: 0,
    targetTokenCount: 0,
    sourceLanguage: "...",
    targetLanguage: "...",
    modelFamily: "..."
}

Measure:

- Number of source tokens.
- Number of generated target tokens.
- Number of text chunks.
- Model family used.

Do not display internal token IDs to ordinary users.

Provide a developer-only or expandable diagnostics section.

Explain in comments that the Transformer operates on token IDs rather than raw strings.

---

# 10. FEATURE 7 – INTEGRATE THE NLP PIPELINE

Create:

app/src/js/nlpPipeline.js

This must become the orchestration layer between input and the existing translator.

The public function should look conceptually like:

translateWithNLP({
    text,
    sourceLanguage,
    targetLanguage,
    onProgress
})

It should:

1. Validate source and target languages.
2. Normalize the input.
3. Split long input into safe chunks.
4. Apply verified entity protection when enabled.
5. Apply verified glossary handling when enabled.
6. Use the existing translator.js for actual neural translation.
7. Restore protected entities.
8. Restore glossary terms.
9. Apply target-language postprocessing.
10. Combine the translated chunks.
11. Return actual measurements and diagnostics.

Return:

{
    translation: "...",
    sourceLanguage: "...",
    targetLanguage: "...",
    modelFamily: "...",
    sourceTokenCount: 0,
    generatedTokenCount: 0,
    chunkCount: 0,
    preprocessingTimeMs: 0,
    translationTimeMs: 0,
    postprocessingTimeMs: 0,
    warnings: []
}

Use actual measured timings.

Do not generate fake results.

IMPORTANT:

Do not modify the core encoder-decoder inference code unless a genuine compatibility bug exists.

Keep the existing translate function available for regression comparison.

Ensure the six translation directions continue working.

---

# 11. FEATURE 8 – BASIC NLP DEMONSTRATION PANEL

Update the existing development interface only slightly.

Do not redesign the entire UI.

Add a collapsible panel titled:

NLP Processing Details

It should show:

1. Original input.
2. Normalized input.
3. Number of detected sentences.
4. Number of translation chunks.
5. Detected entities.
6. Whether entity protection was successful.
7. Whether glossary entries were applied.
8. Source token count.
9. Generated token count.
10. Selected model.
11. Preprocessing time.
12. Translation time.
13. Postprocessing time.

Also provide:

- Optional spelling suggestions.
- Glossary entry management.
- A button to clear glossary test data.

The interface must explain that these are diagnostic and enhancement features, not guaranteed translation-quality improvements.

Keep the main translation UI simple.

---

# 12. REGRESSION TESTING

Run the original six translation smoke tests again.

The six directions are:

1. English → Tamil.
2. English → Kannada.
3. Tamil → English.
4. Kannada → English.
5. Tamil → Kannada.
6. Kannada → Tamil.

Compare them against the Stage 2 baseline.

Record:

- Original input.
- Baseline translation.
- New pipeline translation.
- Selected model.
- Source token count.
- Output script.
- Translation latency.
- Warnings.

Do not require the translated wording to be identical to Stage 2.

However:

- Output must be in the requested language.
- Output must be in the correct script.
- No sentence or punctuation may be silently lost.
- No number or protected identifier may be corrupted.
- No failed placeholder may be silently restored.
- No input meaning should be changed by preprocessing.

---

# 13. SPECIFIC TEST CASES

Create tests for each component.

A. Unicode

Test:

- NFC normalization.
- Tamil characters.
- Kannada characters.
- Combining characters.
- Valid ZWJ and ZWNJ sequences.

B. Whitespace

Test:

Input with multiple spaces, tabs and paragraph breaks.

C. Sentence segmentation

Test:

- English multi-sentence paragraphs.
- Tamil multi-sentence paragraphs.
- Kannada multi-sentence paragraphs.
- Decimals.
- URLs.
- Abbreviations.

D. Entity protection

Test:

student@example.com

https://example.com

25/11/2026

10:30 AM

9876543210

TRI2026A001

E. Glossary

Test:

- Add an entry.
- Retrieve an entry.
- Delete an entry.
- Update an entry.
- Match a multiword phrase.
- Match overlapping terminology.

F. Minimum Edit Distance

Test:

artifical / artificial

kitten / sitting

robot / robots

G. Pipeline integration

Test all six translation directions.

---

# 14. PERFORMANCE REQUIREMENTS

Do not load all three translation models simultaneously.

Keep the existing one-model-at-a-time policy.

Avoid duplicate tokenization where possible.

Do not rerun preprocessing repeatedly on the same text.

Cache only small metadata or glossary information.

Do not store large model tensors in localStorage.

Measure preprocessing overhead separately from translation time.

Do not sacrifice translation correctness for speed.

---

# 15. OFFLINE REQUIREMENT

All newly implemented NLP functionality must work without Internet connectivity.

Do not use:

- Cloud translation APIs.
- Google Translate APIs.
- Online spelling services.
- Remote dictionaries.
- External database services.
- CDN scripts.

All glossary data must remain local.

All spelling resources must remain local.

All text processing must execute in JavaScript locally.

---

# 16. DOCUMENTATION

Create:

documentation/architecture/nlp_pipeline.md

Explain the complete NLP pipeline with a flowchart.

Create:

documentation/nlp_concepts.md

Relate actual implementation to the college syllabus:

Module 1:
- Language modelling.
- Statistical N-grams versus Transformer-based models.
- Explain why our pretrained model is not a traditional N-gram translator.

Module 2:
- Regular expressions.
- Unicode normalization.
- Text preprocessing.
- Sentence segmentation.
- Tokenization.
- Minimum Edit Distance.
- Finite-state concepts and morphological differences as background, without claiming a full morphological analyser was implemented.

Module 3:
- Naive Bayes and sentiment analysis are not part of the actual translation engine.
- Explain why these classification techniques are separate from neural machine translation.

Module 4:
- Lexical resources.
- Bilingual glossary.
- WordNet concepts and their relevance to lexical meaning.
- Do not claim WordNet integration if it is not implemented.

Module 5:
- Encoder-decoder translation.
- Language divergence.
- Multilingual translation.
- Low-resource challenges.
- Translation quality limitations.

Create:

documentation/challenges.md

Record genuine challenges encountered, including:

- Unicode normalization issues.
- Sentence segmentation difficulties.
- Placeholder preservation failures.
- Glossary integration difficulties.
- Differences between the three model configurations.
- Translation context limitations.
- Memory and performance considerations.

For each actual challenge, document:

1. Problem.
2. Why it happened.
3. How it was investigated.
4. Solution attempted.
5. Final outcome.

Do not invent challenges or claim a solution worked without testing.

Create:

documentation/architecture/pipeline_comparison.md

Compare:

Original Stage 2 pipeline

versus

Enhanced Stage 3 pipeline.

Explain which additional NLP operations are now being applied.

---

# 17. AUTOMATED TESTS AND RESULTS

Create suitable tests in:

scripts/

or

evaluation/

Follow the existing project conventions.

Save test output in:

evaluation/nlp_pipeline_tests.json

The file should include:

- Test name.
- Input.
- Expected behaviour.
- Actual result.
- Pass/fail status.
- Relevant diagnostic values.

Preserve:

evaluation/preliminary_smoke_tests.json

Do not overwrite the Stage 2 baseline evidence.

Update the npm scripts only if necessary.

Ensure:

npm.cmd run build

works successfully.

Ensure:

npm.cmd run smoke

still works.

---

# 18. ACCEPTANCE CRITERIA

Stage 3 is complete when:

[ ] Existing six-direction translation works.

[ ] Unicode normalization works.

[ ] Whitespace normalization works.

[ ] Sentence segmentation works.

[ ] Punctuation is preserved.

[ ] Long inputs are handled safely.

[ ] Entity patterns are detected.

[ ] Entity protection is tested before activation.

[ ] Glossary CRUD works.

[ ] Glossary integration is verified or safely disabled when markers fail.

[ ] Minimum Edit Distance works.

[ ] English spelling suggestions work as an optional feature.

[ ] Actual tokenizer statistics are available.

[ ] NLP diagnostics panel works.

[ ] All six regression tests pass.

[ ] Offline operation is retained.

[ ] npm build succeeds.

[ ] Documentation is generated.

[ ] Genuine challenges are documented.

---

# 19. FINAL REPORT

After implementation, provide:

1. All files created.
2. All files modified.
3. Features implemented.
4. NLP concepts demonstrated.
5. Actual before-and-after translation comparisons.
6. Six-direction regression-test results.
7. Sentence segmentation test results.
8. Entity protection results.
9. Glossary test results.
10. Minimum Edit Distance examples.
11. Tokenization diagnostics.
12. Preprocessing overhead.
13. Translation performance.
14. Offline verification results.
15. Errors encountered.
16. Features that were disabled because they were not reliable.
17. Remaining limitations.
18. Exact commands to run the application.

Explain the implementation in simple language suitable for a third-year engineering student.

Do not claim improved translation accuracy without evaluation evidence.

Do not start Stage 4 automatically.

Stop after Stage 3 is implemented, tested and documented.