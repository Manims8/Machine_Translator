# TriLingua – Repository Cleanup, Restructuring and GitHub Push

I want to thoroughly clean and organize my TriLingua machine translation project before starting the formal Stage 5 evaluation.

Project location:
`D:\python\Machine_Translator`

The project is an offline English–Tamil–Kannada machine translation application using local ONNX models.

It supports six translation directions:
1. English → Tamil
2. English → Kannada
3. Tamil → English
4. Kannada → English
5. Tamil → Kannada
6. Kannada → Tamil

The project includes:
- Python backend and evaluation scripts.
- Vite/JavaScript frontend.
- Local ONNX models.
- Tokenizer files and model configuration.
- NLP preprocessing.
- Indic NLP resources.
- Evaluation datasets and FLORES-200 references.
- IndexedDB prediction storage.
- BLEU and chrF++ scoring.
- Documentation and tests.

## Main objective

Clean the repository, remove genuinely unnecessary files, standardize naming, organize folders, verify all file paths, and push a clean, working version to GitHub.

## Phase 1 – Repository audit (do not delete anything yet)

Inspect the entire repository.

Identify:
- Duplicate files.
- Unused scripts.
- Old test files.
- Temporary files.
- Debug files.
- Unused dependencies.
- Build artifacts.
- Cache directories.
- Old exported predictions.
- Obsolete documentation.
- Unused model downloads.
- Incorrectly named files.
- Files referenced by code but located in unexpected folders.

For each suspected unnecessary file, explain:
1. Its purpose.
2. Whether any code references it.
3. Whether it is safe to delete.
4. Whether it should be retained locally but excluded from Git.

Do not delete anything during this initial audit.

## Phase 2 – Protect important project assets

Never delete or modify these without explicit justification:

- ONNX model files.
- Model configuration files.
- Tokenizer files.
- Required model vocabulary files.
- Indic NLP resources.
- Evaluation reference datasets.
- Evaluation preprocessing scripts.
- Working translation code.
- Working evaluation code.
- Required Python dependencies.
- Test files needed to verify the project.

Preserve the complete original 1,012-record reference datasets for all six directions.

Do not overwrite any pilot or full evaluation results.

Do not delete the virtual environment unless there is a compelling reason. It should normally be excluded from Git using `.gitignore`.

## Phase 3 – Organize the repository

Inspect the current structure and propose a clean structure similar to this:

Machine_Translator/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── scripts/
│   └── requirements.txt
│
├── models/
│   ├── eng_to_indic/
│   ├── indic_to_eng/
│   └── indic_to_indic/
│
├── resources/
│   └── indic_nlp_resources/
│
├── evaluation/
│   ├── datasets/
│   ├── references/
│   ├── predictions/
│   └── results/
│
├── tests/
│
├── docs/
│
├── scripts/
│
├── .gitignore
├── README.md
└── LICENSE

This is a proposed structure, not permission to move everything blindly.

Adapt it to the existing application. Preserve working paths or update every reference consistently if files must be moved.

Do not unnecessarily duplicate model files or datasets.

## Phase 4 – Standardize naming

Check all evaluation filenames and direction identifiers.

Use these exact direction identifiers consistently:

- eng_Latn-tam_Taml
- eng_Latn-kan_Knda
- tam_Taml-eng_Latn
- kan_Knda-eng_Latn
- tam_Taml-kan_Knda
- kan_Knda-tam_Taml

Naming rules:

Full reference files:
`<direction>.jsonl`

Pilot reference files:
`<direction>-pilot.jsonl`

Full prediction files:
`<direction>.jsonl`

Pilot prediction files:
`<direction>-pilot.jsonl`

Keep pilot and full results separate.

Ensure that the frontend export function, IndexedDB storage, Python scorer, and documentation all follow the same naming rules.

Do not rename the original full reference files.

## Phase 5 – Clean dependencies and configuration

Check:
- Python requirements.
- Node dependencies.
- Package scripts.
- Environment variables.
- Model paths.
- Resource paths.
- Evaluation paths.

Remove unused dependencies only after confirming they are not required.

Ensure the application works from the documented project directory.

Do not hardcode absolute paths specific to my computer where project-relative paths can be used.

Preserve offline operation. The application must not unexpectedly download models or call online translation APIs.

## Phase 6 – Git ignore and repository size

Create or update `.gitignore`.

Exclude:
- `.venv/`
- `node_modules/`
- `dist/`
- Python `__pycache__/`
- `.pytest_cache/`
- Temporary logs.
- Local environment files containing secrets.
- Browser cache and temporary files.
- Generated evaluation predictions and results unless deliberately selected for version control.

Important:
- Do not automatically exclude source code, documentation, tests, or evaluation references.
- Do not commit private credentials or API keys.
- Inspect model file sizes and GitHub's file-size restrictions.
- Do not commit huge ONNX model binaries or model snapshots directly if they exceed GitHub limits. Document how to obtain them and their required locations.
- Do not silently remove models required for offline execution.
- Check whether Git LFS is appropriate if large model files need version control.

## Phase 7 – Verify after cleanup

Run the available checks:

1. Python tests.
2. Frontend npm build.
3. All six translation-direction smoke tests.
4. Model and tokenizer path checks.
5. Indic NLP resource checks.
6. Evaluation reference integrity checks.
7. JSONL schema validation.
8. Pilot and full filename-selection checks.
9. Offline refresh test.
10. Check for broken imports and missing files.

Verify that the working 5-sentence and 25-sentence evaluation workflows remain functional.

Do not run the full 6,072-translation benchmark during repository cleanup.

## Phase 8 – Documentation

Update README.md with:

- Project overview.
- Features.
- Supported languages.
- Six translation directions.
- Technology stack.
- Installation instructions.
- Python environment setup.
- Frontend startup instructions.
- Model placement and setup.
- Indic NLP resource setup.
- Offline operation instructions.
- Evaluation instructions.
- Pilot and full evaluation commands.
- Testing instructions.
- Repository folder structure.

Also document any large assets excluded from Git and how to restore them.

Keep explanations understandable for a third-year engineering student.

## Phase 9 – GitHub commit and push

Before pushing:

1. Check `git status`.
2. Inspect all staged files.
3. Check for secrets and accidentally included large files.
4. Confirm no important model, reference, or resource files were deleted locally.
5. Confirm the application builds and tests pass.

Then:

- Create a meaningful commit message, such as:
  `chore: clean and organize TriLingua repository`
- Push to the existing GitHub remote and current working branch.
- Do not create a new repository unnecessarily.
- Do not force-push.
- Do not overwrite remote history.
- If there are uncommitted user changes, preserve them.
- If there are merge conflicts or unexpected remote changes, stop and report them instead of forcing a push.

## Final report

After completing the work, report:

1. Files deleted.
2. Files moved.
3. Files retained.
4. Dependencies removed or changed.
5. New folder structure.
6. `.gitignore` changes.
7. Tests and build results.
8. Git commit hash.
9. GitHub branch and push status.
10. Any remaining warnings or limitations.

**Important execution rule:**

First complete the repository audit and show me the proposed deletion and restructuring plan.

Wait for my approval before deleting files, moving important assets, or making irreversible changes.

After approval, perform the cleanup, verify the application, commit, and push to GitHub.

Never sacrifice working offline translation functionality just to make the repository look cleaner.