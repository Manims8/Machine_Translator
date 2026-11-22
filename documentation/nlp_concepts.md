# NLP syllabus concepts in TriLingua

This project is an offline IndicTrans2 machine translation demo with a small, inspectable NLP support pipeline. The surrounding modules demonstrate selected concepts; they are not a complete NLP toolkit.

## Module 1: language models

Traditional statistical n-gram language models estimate a word sequence from local context, such as `P(word_i | word_(i-1), …)`, and suffer from sparse counts as context grows. TriLingua instead uses pretrained multilingual Transformer encoder-decoder models exported to ONNX. Self-attention and learned representations let the model use broader context, while its decoder generates a target sequence conditioned on encoded source text and language tags. This is not an n-gram translator, and the project does not train a model.

## Module 2: text and string processing

- **Regular expressions:** conservative patterns identify common structured entities and controls. These patterns do not perform general named-entity recognition.
- **Unicode normalization:** NFC combines canonically equivalent sequences without the broader compatibility changes of NFKC. Zero-width joiners/non-joiners and valid Tamil/Kannada letters are retained.
- **Preprocessing:** surrounding/repeated horizontal whitespace is normalized; meaningful paragraph breaks remain. Empty, unsupported-control, same-language, unsupported-route, and over-limit input is rejected explicitly.
- **Sentence segmentation:** `Intl.Segmenter` is used when available, with a fallback that protects URLs, email, decimal numbers, and common abbreviations. Sentences are grouped to retain context, then bounded using the selected model's real tokenizer.
- **Tokenization:** the local Transformers.js tokenizer converts the source and the two language tags to model token IDs. Diagnostics count those actual IDs; characters and whitespace-delimited words are not treated as model tokens.
- **Minimum Edit Distance:** `levenshteinDistance` calculates insertions, deletions, and substitutions. `suggestCorrections` ranks candidates from a short local English vocabulary. Suggestions are optional and no automatic correction is applied.
- **Finite-state and morphology background:** language-specific morphology can change word forms and sentence structure. This application does not implement a finite-state transducer or a morphological analyzer; the pretrained translation model handles those phenomena implicitly to the extent learned during training.

## Module 3: classification and sentiment

Naive Bayes and sentiment analysis are not part of this implementation. They solve classification problems such as assigning a sentiment label from word features. Neural machine translation instead generates a sequence in another language. Adding a sentiment classifier would be a separate feature and would not itself translate text.

## Module 4: lexical resources

The bilingual glossary is a local lexical resource with sample and user-managed phrases for all six language directions. Longest phrases are matched first. When verified markers work for a model direction, source phrases can be temporarily protected and replaced with the selected target phrase after inference. In other directions, the same entries are a visible reference and do not constrain generated wording. Glossary entries may be useful for names and technical terms; they do not guarantee grammatical agreement.

WordNet is a lexical database organized around synsets and semantic relations such as synonymy and hypernymy. Those relations can inform word-sense or lexical lookup features, but this project has no WordNet dependency or integration.

## Module 5: neural machine translation

IndicTrans2 is a multilingual encoder-decoder system. Language tags route the input/output languages, and the shared model families support the six configured directions. Translation is difficult because languages differ in word order, morphology, agreement, idiom, and available training data. A single source sentence can have multiple valid translations; the smoke tests check execution and output script, not human translation quality. Low-resource and domain-specific terms may be mistranslated, and glossary protection is deliberately limited to directions with observed marker preservation.
