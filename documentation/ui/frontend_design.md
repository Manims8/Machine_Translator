# Stage 4 frontend design

TriLingua uses a light neutral canvas, deep teal actions, white workspace surfaces, clear borders, and modest shadows. The translation workspace is the visual center; history and settings are native dialogs, while NLP diagnostics and glossary management sit below the editor.

## Components

- Header: product mark, local execution status, history, and settings.
- Workspace: source/target selectors, swap, multiline input, counts, example, translate/progress/error state, translated output, copy/clear actions, and selected model details.
- NLP details: collapsible diagnostics populated from `translateWithNLP`, plus the glossary safety note.
- Glossary: pair selectors, search, entry list, and add/edit/toggle/delete actions backed by `glossary.js`.
- History: recent successful translations stored locally, capped at 20; settings can disable saving.
- Settings: history preference, clear actions, version, and model-family information.

## Responsive behavior

At desktop widths the language controls and source/output panels are side by side with a centered content width. Tablet widths reduce margins and stack the secondary sections. At narrow mobile widths the translation panels stack, language controls remain prominent, actions wrap, and Tamil/Kannada text wraps inside the output panel. `responsive.css` contains the small-screen adjustments.

## Accessibility and offline behavior

Controls have labels and accessible names, semantic sections/dialogs, live output status, keyboard focus styling, and touch-sized controls. System font fallbacks include Nirmala UI and Tunga; remote fonts are not loaded. Text panels allow Unicode wrapping. The UI calls the existing local NLP pipeline and model router; it adds no backend, remote translation service, or external asset dependency.

Colors are centralized in CSS custom properties in `app/src/css/style.css`. Existing actual-tokenizer diagnostics remain below the workspace. Glossary messaging explains that preferred terms are references and auto-protection is limited to verified model directions.

## Verification notes

`npm.cmd run build` passed. `npm.cmd run smoke` completed six browser translations and an offline refresh with zero external origins. The smoke runner is not an automated UI interaction suite; manual copy/history/glossary interactions and mobile viewport overflow were not separately exercised. No screenshots are included because no visual screenshot capture was performed for this stage.
