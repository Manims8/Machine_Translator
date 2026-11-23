"""IndicTrans2-compatible evaluation normalization; resource path is project-relative."""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESOURCE_PATH = ROOT / "resources" / "indic_nlp_resources"
os.environ.setdefault("INDIC_RESOURCES_PATH", str(RESOURCE_PATH))
from indicnlp.normalize.indic_normalize import IndicNormalizerFactory
from indicnlp.tokenize import indic_tokenize

NORMALIZERS = {x: IndicNormalizerFactory().get_normalizer(x) for x in ("ta", "kn")}


def normalize_and_tokenize(text, lang):
    if lang not in NORMALIZERS:
        raise ValueError("Indic language must be ta or kn")
    normalized = NORMALIZERS[lang].normalize(text)
    return " ".join(indic_tokenize.trivial_tokenize(normalized, lang))


def process(text, language_code):
    return normalize_and_tokenize(
        text, {"tam_Taml": "ta", "kan_Knda": "kn"}[language_code]
    )
