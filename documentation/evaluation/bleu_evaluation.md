# BLEU and chrF++ evaluation procedure

The Stage 5 evaluation uses the FLORES-200 `devtest` split (English `eng_Latn`, Tamil `tam_Taml`, Kannada `kan_Knda`) as aligned human references for six directions. Dataset access is controlled by Hugging Face conditions; the downloader stops with instructions if access or the required `datasets` package is unavailable. It does not bypass gated access or fabricate references.

BLEU compares corpus-level word n-gram overlap: clipped n-gram precision from 1 to 4 is combined geometrically, with a brevity penalty when hypotheses are shorter than references. It is a surface metric, not a semantic or grammaticality guarantee. chrF++ compares character n-grams and word n-grams (word order 2); character overlap can be informative for morphologically rich scripts where small spelling differences affect word-level matches. chrF++ is a separate metric, not a BLEU variant.

`scripts/download_evaluation_dataset.py` validates columns, unique IDs, nonempty strings, and the expected 1,012 examples before writing UTF-8 JSONL with a SHA-256 metadata record. FLORES-200 is attributed to its official dataset card and CC-BY-SA 4.0; check that card for current terms. `scripts/prepare_evaluation_pairs.py` exports six ordered reference text/JSONL files and a separate empty native-speaker custom-evaluation template.

Prediction generation must call the browser production `translateWithNLP` pipeline. Python scoring must use local SacreBLEU and record versions/signatures. Indic-target references and predictions require a consistent documented IndicNLP normalization/tokenization convention; do not compare scores with different tokenization signatures as if directly equivalent. English targets use SacreBLEU's standard English tokenization. Validate IDs, counts, empty outputs, UTF-8, language direction, and target scripts before scoring. Missing hypotheses make a direction incomplete and must not be silently omitted.

FLORES-200 `devtest` is a benchmark split, not training material. Prediction generation and scoring should run sequentially and checkpoint per sentence. BLEU and chrF++ should be supplemented by human fluency, adequacy, and meaning-preservation review. No scores or translations are reported until genuine predictions and complete references exist.

Sources: [FLORES-200 dataset card](https://huggingface.co/datasets/facebook/flores); [IndicTrans2 repository and evaluation materials](https://github.com/AI4Bharat/IndicTrans2).
