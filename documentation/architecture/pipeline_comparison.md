# Stage 2 and Stage 3 pipeline comparison

| Stage 2 | Stage 3 |
|---|---|
| UI sends input through basic preprocessing to `translator.js`. | `nlpPipeline.js` validates and normalizes input, then coordinates preprocessing, chunking, inference, and output diagnostics. |
| Basic input-size and route errors are handled by the translator. | Structured validation handles empty input, controls, language pair, Unicode NFC, whitespace, and a 20,000-character ceiling. |
| The tokenizer encodes the submitted input for inference. | The selected model's real tokenizer counts language tags and text; sentence groups are split before their configured positional limit. |
| One translation call handles the input. | Paragraphs and context-preserving sentence groups are translated as bounded chunks, then reassembled in order. |
| Decoded text is converted to the requested Indic script and normalized. | Existing target-script conversion remains, with paragraph-aware output normalization. |
| No glossary or NLP trace is shown. | An expandable panel reports tokenizer counts, model family, chunks, entities, glossary state, timings, and warnings. A local glossary can influence output only after route-specific marker and restoration checks; otherwise it is reference-only. |
| No spelling helper. | Optional English suggestions use Levenshtein distance and a small explicit local vocabulary; input is never changed automatically. |

The model families, ONNX weights, and core translation implementation remain the Stage 2 baseline. Stage 3 does not train or replace the pretrained model. See [pipeline architecture](nlp_pipeline.md) and [the six-direction regression report](../../evaluation/nlp_pipeline_tests.json).
