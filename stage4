# STAGE 4 – PROFESSIONAL FRONTEND DEVELOPMENT

## Project: TriLingua – Offline English, Tamil and Kannada Translator

Act as a professional UI/UX designer and senior frontend developer.

Stages 1, 2 and 3 have been completed.

Your task is to transform the existing functional translation application into a polished, responsive, professional web interface suitable for a third-year Robotics and AI engineering project demonstration.

The interface must be modern and visually attractive, but not unnecessarily complicated.

The application must remain understandable to a student who knows HTML, CSS and JavaScript.

DO NOT rebuild the translation engine.

DO NOT replace IndicTrans2.

DO NOT modify the working NLP algorithms unless absolutely necessary.

DO NOT introduce a backend.

DO NOT use external translation APIs.

DO NOT remove any existing functionality.

Your primary responsibility is frontend design and integration with the existing JavaScript functionality.

Work directly in the existing project and test the complete application.

---

# 1. EXISTING PROJECT ENVIRONMENT

Project directory:

D:\python\Machine_Translator

Operating System:

Windows 11

RAM:

16 GB

Python:

3.12.10

Node.js:

24.20.0

npm:

11.19.0

Vite:

8.3.8

Existing JavaScript dependencies:

- @huggingface/transformers 3.0.2
- onnxruntime-web 1.21.0

Use npm.cmd instead of npm.

Run commands using:

npm.cmd run build

npm.cmd run smoke

Do not recreate the Python environment.

Do not redownload pretrained models.

Do not upgrade packages without a demonstrated reason.

---

# 2. EXISTING APPLICATION FUNCTIONALITY

The application already supports six translation directions:

1. English → Tamil
2. English → Kannada
3. Tamil → English
4. Kannada → English
5. Tamil → Kannada
6. Kannada → Tamil

The three pretrained IndicTrans2 models are already working locally.

The existing ONNX Runtime Web inference engine has passed all six translation regression tests.

NLP components already implemented:

- Unicode normalization.
- Input validation.
- Whitespace processing.
- Sentence segmentation.
- Tokenizer-based chunking.
- Entity detection.
- Verified entity protection for Kannada → English only.
- Local glossary controls.
- Minimum Edit Distance.
- English spelling suggestions.
- NLP diagnostics.
- Offline inference.

Inspect the existing source code before changing the UI.

Important files include:

app/index.html

app/src/css/style.css

app/src/js/app.js

app/src/js/language.js

app/src/js/modelRouter.js

app/src/js/translator.js

app/src/js/preprocessing.js

app/src/js/postprocessing.js

app/src/js/nlpPipeline.js

app/src/js/glossary.js

app/src/js/entityProtection.js

app/src/js/editDistance.js

app/src/js/sentenceSegmenter.js

Read the existing implementation and identify the functions currently used by the interface.

Reuse those functions.

Do not create duplicate translation functionality.

---

# 3. DESIGN OBJECTIVE

Create a professional interface called:

TriLingua

Tagline:

Your Languages. Your Translation. Completely Offline.

The application's primary purpose is:

English ↔ Tamil ↔ Kannada machine translation.

Use a clean, elegant, modern design.

The UI should resemble a polished modern translation application rather than a basic college assignment webpage.

However, avoid copying another product's exact design.

## Visual design direction

Use:

- Light neutral background.
- Dark teal or deep green as primary colour.
- White content surfaces.
- Subtle borders.
- Soft shadows.
- Rounded corners.
- Clear typography.
- Moderate spacing.
- Small, meaningful icons.
- Smooth but restrained transitions.

Suggested colours:

Primary: #174C46

Primary hover: #103B36

Background: #F5F7F6

Surface: #FFFFFF

Main text: #192B29

Secondary text: #70817D

Borders: #E2E9E6

Success: #27845E

Warning: #B7791F

Error: #C14545

Use CSS variables so that colours can be changed centrally.

Do not use excessive gradients.

Do not use too many colours.

Do not make the interface look like an administrative dashboard.

The translation workspace must remain the main focus.

---

# 4. RESPONSIVE LAYOUT

Build the application for:

- Laptop.
- Desktop.
- Tablet.
- Android mobile screen.

Desktop:

- Maximum content width approximately 1150px.
- Header at the top.
- Main translation section in the centre.
- Source and target text panels displayed side by side.
- NLP diagnostics below the translation workspace.
- Secondary functionality arranged in simple sections.

Tablet:

- Reduce outer margins.
- Keep translation panels readable.
- Maintain appropriate spacing.

Mobile:

- Stack source and output panels vertically.
- Put language selectors prominently at the top.
- Make buttons touch-friendly.
- Keep copy and clear actions accessible.
- Make panels fit small screens without horizontal scrolling.
- Ensure Tamil and Kannada text can wrap correctly.

Do not create a separate mobile website.

Use CSS media queries.

---

# 5. HEADER SECTION

Create a clean header.

Left side:

TriLingua logo or icon.

Application name:

TriLingua

Tagline:

Offline Multilingual Translator

Right side:

- Offline status indicator.
- History button.
- Settings button or small menu.

The offline badge must represent the application's actual local execution architecture.

Do not display "Offline ready" if the local models have not been loaded or required assets are unavailable.

Display an appropriate status such as:

- Ready.
- Loading model.
- Model loaded.
- Translation in progress.
- Error.

Use meaningful status colours.

---

# 6. MAIN TRANSLATION WORKSPACE

This is the most important UI component.

Create a central translation card.

## Language selection

Provide exactly three languages:

English

தமிழ்

ಕನ್ನಡ

Use clear language names.

Example:

FROM:

English ▼

TO:

தமிழ் ▼

Put a swap-languages button between the two selectors on desktop.

On mobile, place the selectors and swap button in an arrangement that is comfortable to use.

Rules:

- Prevent selecting the same language on both sides.
- Swapping must correctly exchange the language selections.
- Changing languages must update the correct model selection.
- The six translation directions must continue working.

## Source text panel

Display:

- Source language name.
- Text input area.
- Character count.
- Word count where supported.
- Clear button.
- Optional example sentence button.

Placeholder:

Enter your text here...

Example text:

I am a Robotics and Artificial Intelligence student.

Make the textarea large enough for paragraph input.

Support multiline text.

## Translate button

Make this the primary call-to-action.

Label:

Translate

Show a loading state when translation is running.

During inference:

- Disable duplicate translation requests.
- Display a loading indicator.
- Show meaningful progress messages.
- Prevent accidental duplicate model loading.
- Display errors clearly.

Use actual progress callbacks from the existing translation engine.

Do not fake progress percentages.

## Output panel

Display:

- Target language.
- Translated output.
- Copy button.
- Clear output option.
- Translation time.
- Selected model family.

If translation fails, show an understandable error.

If there is no translated text yet, show a helpful empty state.

Do not display hardcoded translation examples as actual model outputs.

---

# 7. TRANSLATION HISTORY

Create a history panel or modal.

Store translation records locally.

Use the existing localStorage or another local browser storage method where appropriate.

Do not use a cloud database.

Each record should include:

- Timestamp.
- Source language.
- Target language.
- Source text.
- Translated text.
- Model family.
- Translation duration.

Features:

- View previous translation.
- Copy previous translation.
- Reuse previous input.
- Delete one history entry.
- Clear all history.

Limit history to the most recent 20 records.

Avoid saving empty or failed translations as successful results.

Ensure stored entries remain available after refreshing the page.

Add an optional setting to disable history storage.

---

# 8. GLOSSARY MANAGEMENT

Create a dedicated Glossary section.

Provide:

- Add terminology.
- Edit terminology.
- Delete terminology.
- Select source language.
- Select target language.
- Search glossary entries.
- Enable/disable glossary reference entries.

The supported language pairs should be:

English → Tamil

English → Kannada

Tamil → English

Kannada → English

Tamil → Kannada

Kannada → Tamil

Use the existing glossary.js implementation.

Do not duplicate glossary storage logic.

Example entries:

Robot | ரோபோ | ರೋಬೋಟ್

Artificial Intelligence | செயற்கை நுண்ணறிவு | ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ

Machine Learning | இயந்திரக் கற்றல் | ಯಂತ್ರ ಕಲಿಕೆ

Neural Network | நரம்பியல் வலைப்பின்னல் | ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್

Translation | மொழிபெயர்ப்பு | ಅನುವಾದ

IMPORTANT:

The current glossary functionality is primarily a terminology reference.

Do not tell the user that glossary entries are automatically enforced in translation.

Display an explanatory note:

"Glossary entries provide preferred terminology. Automatic application is enabled only where model placeholder preservation has been verified."

Do not enable unverified automatic replacement.

---

# 9. NLP DIAGNOSTICS PANEL

Create a collapsible panel.

Title:

NLP Processing Details

This panel is important for demonstrating the concepts taught in our NLP course.

Display actual data from the existing nlpPipeline.js.

Include:

1. Input normalization status.
2. Sentence count.
3. Chunk count.
4. Source token count.
5. Generated token count.
6. Entity detection results.
7. Entity protection status.
8. Glossary status.
9. Selected model family.
10. Preprocessing time.
11. Translation time.
12. Postprocessing time.

Use compact cards or an organised table.

Avoid making this panel larger than the translation workspace.

Provide meaningful descriptions for unfamiliar NLP terms.

Example:

Tokenization:

"The input text is divided into smaller units called tokens before being passed to the translation model."

Sentence segmentation:

"Long text is divided into suitable translation chunks while maintaining sentence order."

Entity protection:

"Certain identifiers can be protected during translation when placeholder preservation is verified."

Never display fake values.

Use actual diagnostic information.

If information is not available, display Not available rather than zero.

---

# 10. SPELLING SUGGESTIONS

Add a small optional spelling suggestion feature.

Use the existing editDistance.js implementation.

Show suggestions only when actual suggestions are available.

Example:

Input:

Artifical Intelligence

Suggested:

Artificial Intelligence

Do not automatically replace user text.

Allow the user to choose whether to apply the suggestion.

Clearly label this functionality as English spelling assistance.

Do not claim Tamil or Kannada spell checking.

---

# 11. SETTINGS SECTION

Create a small settings modal or panel.

Include:

- Enable/disable translation history.
- Clear translation history.
- Clear glossary data (only after confirmation).
- Show application version.
- Show available model families.
- Display model status.
- Developer diagnostics toggle.

Avoid unnecessary settings.

Do not add login or authentication.

The application must remain completely local.

---

# 12. ACCESSIBILITY AND INDIAN LANGUAGE SUPPORT

Tamil and Kannada script rendering is extremely important.

Use appropriate system font fallbacks.

Suggested CSS font stack:

For English:

Arial, sans-serif.

For Tamil:

"Noto Sans Tamil", "Nirmala UI", sans-serif.

For Kannada:

"Noto Sans Kannada", "Tunga", sans-serif.

Do not import Google Fonts or remote font URLs.

The interface must work when Internet connectivity is unavailable.

Support:

- UTF-8.
- Unicode text.
- Multiline text.
- Tamil script.
- Kannada script.
- Keyboard navigation.
- Clear focus indicators.
- Appropriate text contrast.
- Accessible button labels.

Prevent Tamil and Kannada text from overflowing their panels.

---

# 13. ICONS AND UI ASSETS

Use simple SVG or locally installed icon libraries where appropriate.

Avoid external icon CDNs.

Do not add unnecessary dependencies.

Prefer simple CSS and inline SVG.

Keep the interface lightweight.

---

# 14. DESIGN QUALITY REQUIREMENTS

The finished UI must have:

- Consistent spacing.
- Consistent typography.
- Consistent border radius.
- Clean responsive behaviour.
- Hover states.
- Focus states.
- Loading states.
- Error states.
- Empty states.
- Success states.

Do not overuse animations.

Do not add decorative elements that reduce usability.

Ensure that the interface does not feel overcrowded.

The translation panel must always receive the most visual attention.

---

# 15. PRESERVE THE EXISTING ENGINE

This instruction is critical.

The following components must continue working:

- modelRouter.js
- translator.js
- preprocessing.js
- postprocessing.js
- nlpPipeline.js
- glossary.js
- entityProtection.js
- editDistance.js
- sentenceSegmenter.js

Use the existing exported functions.

Before connecting the redesigned UI, inspect the actual function signatures.

Do not guess function names.

Do not duplicate existing code.

Do not hardcode model-selection rules inside UI components.

Do not change ONNX inference logic for design purposes.

Do not move model files.

Do not modify the model repositories.

---

# 16. OFFLINE REQUIREMENT

The frontend must work offline.

Do not use:

- Remote APIs.
- Online translation services.
- External CDN scripts.
- Remote fonts.
- External image URLs.
- Cloud history storage.
- Remote databases.

Use all locally installed JavaScript packages.

Preserve the current local model paths and WASM runtime paths.

Do not copy the 3.2 GiB model directories into the normal Vite dist build.

Do not break the existing model-serving configuration.

---

# 17. PERFORMANCE AND BUILD

Keep the interface lightweight.

Do not install a large CSS framework.

Prefer plain CSS.

Avoid unnecessary dependencies.

The existing Transformers.js build warning and unresolved runtime URL warning must be documented.

Do not hide warnings without investigating them.

Run:

npm.cmd run build

Run:

npm.cmd run smoke

Fix any errors introduced by the UI work.

---

# 18. TESTING

Test:

A. Desktop

- Language selection.
- Swap languages.
- Text entry.
- Translation.
- Copy.
- Clear.
- History.
- Glossary.
- Diagnostics.
- Spelling suggestions.

B. Mobile

- Responsive layout.
- Touch interactions.
- Correct language display.
- No horizontal overflow.
- Tamil and Kannada text rendering.

C. Translation regression

Test all six translation directions.

D. Offline operation

Reload the application after blocking external network access while keeping localhost available.

Ensure the UI and translation engine still work.

E. Persistence

Refresh the browser.

Check history and glossary persistence.

F. Error handling

Check empty input, same-language selection and failed model loading.

Do not claim any test passed unless it was actually executed.

---

# 19. DOCUMENTATION

Create:

documentation/ui/frontend_design.md

Include:

- Design philosophy.
- Main application layout.
- Component descriptions.
- Responsive layout decisions.
- Colour palette.
- Accessibility decisions.
- Tamil and Kannada font support.
- UI-to-NLP integration.

Update:

README.md

Include:

- Application features.
- Screenshots section.
- How to run the application.
- Supported languages.
- Offline behaviour.

Capture actual screenshots if browser automation is available.

Save them in:

documentation/screenshots/

Do not create fabricated screenshots.

---

# 20. ACCEPTANCE CRITERIA

[ ] Professional homepage created.

[ ] Responsive desktop layout.

[ ] Responsive mobile layout.

[ ] Six translation directions still work.

[ ] Source and target language selection works.

[ ] Language swap works.

[ ] Translation loading state works.

[ ] Actual translation output is displayed.

[ ] Copy and clear actions work.

[ ] History works locally.

[ ] Glossary management works.

[ ] NLP diagnostics display actual data.

[ ] English spelling suggestions work.

[ ] Tamil text renders correctly.

[ ] Kannada text renders correctly.

[ ] No remote frontend dependencies.

[ ] Model weights remain outside dist.

[ ] Offline operation retained.

[ ] Existing regression tests pass.

[ ] npm build succeeds.

[ ] Documentation updated.

---

# 21. FINAL REPORT

After finishing Stage 4, provide:

1. UI components created.
2. Files modified.
3. Screenshots captured.
4. Features implemented.
5. Desktop testing results.
6. Mobile responsive testing results.
7. Six-direction translation regression results.
8. History and glossary testing results.
9. NLP diagnostics testing results.
10. Offline testing results.
11. Build results.
12. Remaining warnings.
13. Bugs encountered and solutions.
14. Exact commands to run the application.

Explain the frontend code in language suitable for a third-year engineering student.

Do not begin Stage 5 automatically.

Stop after completing and testing Stage 4.