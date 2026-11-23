# TriLingua

TriLingua translates between English, Tamil, and Kannada with local IndicTrans2 ONNX models in a browser. It has a Vite web interface and a Capacitor Android project. Model inference uses ONNX Runtime Web with WASM; no translation API is called. A working model folder must be present locally.

## Supported directions

English to Tamil or Kannada, Tamil or Kannada to English, and Tamil to Kannada or Kannada to Tamil.

## Requirements and setup

- Node.js 20.19+ or 22.12+ and npm
- Python 3.12 for evaluation/model utilities
- Local model files described in [models/README.md](models/README.md)

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

The local evaluation runner is available at `/evaluation.html` while Vite is serving the source tree. It is excluded from the production build. Use `npm.cmd run dev:evaluation` to open it directly.

Install the Python tools in a virtual environment with `python -m pip install -r requirements.txt`. Download models and the evaluation dataset only when needed with `scripts/download_models.py` and `scripts/download_evaluation_dataset.py`.

## Model selection

Shipped web builds select the staged INT8 model files by default. Set `VITE_MODELS=fp32` when starting Vite to use the original FP32 model folders. The query parameter `?models=fp32` or `?models=quantized` can override that setting for a session. Android model staging is explicit; see [Android setup](docs/ANDROID.md).

Model files, the ONNX WASM runtime, tokenizer files, and application assets must all be available locally for translation. The browser smoke procedure blocks external requests during a local-server run; it does not establish that a deployed PWA can launch after a disconnected reload.

## Commands

```powershell
npm.cmd run test:nlp
npm.cmd run test:indicnlp
npm.cmd run smoke
npm.cmd run build
python scripts/summarize_results.py --check
```

The smoke test exercises all six directions in a headless browser. The build creates the production web output under `dist/`; only `app/index.html` is a production HTML entry. To stage all INT8 model families in the Android project, run `npm.cmd run android:stage` before Capacitor sync.

## Project documentation

- [Architecture](docs/ARCHITECTURE.md)
- [NLP pipeline](docs/NLP_PIPELINE.md)
- [Evaluation](docs/EVALUATION.md)
- [Android](docs/ANDROID.md)
- [Challenges](docs/CHALLENGES.md)

The raw evidence paths and scoring method are documented in `docs/EVALUATION.md`. Model weights and the FLORES input dataset are local-only and are not tracked by Git.
