# Model files

TriLingua uses ONNX exports rather than original PyTorch checkpoints. ONNX graphs describe computation in a portable inference format; external `.onnx.data` files hold large graph weights outside the graph file itself. Source and target tokenizer JSON files map text to and from model token IDs. Configuration and generation files describe model settings.

Download complete repository snapshots because graphs can refer to external weight sidecars and inference also needs both tokenizers and configuration files. Keep the model weights out of Git; `model_manifest.json` records their expected layout and verification status.
