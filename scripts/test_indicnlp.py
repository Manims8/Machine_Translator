import os
import json
from pathlib import Path

from indicnlp import common
from indicnlp.normalize.indic_normalize import IndicNormalizerFactory
from indicnlp.tokenize import indic_tokenize


# Configure the local IndicNLP resource directory.
PROJECT_ROOT = Path(__file__).resolve().parents[1]

RESOURCE_PATH = PROJECT_ROOT / "resources" / "indic_nlp_resources"

os.environ["INDIC_RESOURCES_PATH"] = str(RESOURCE_PATH)

common.init()

factory = IndicNormalizerFactory()

# Tamil and Kannada test sentences.
tests = [
    ("ta", "நான் இன்று கல்லூரிக்குச் செல்கிறேன்.", "Tamil", (0x0B80, 0x0BFF)),
    ("kn", "ನಾನು ಇಂದು ಕಾಲೇಜಿಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ.", "Kannada", (0x0C80, 0x0CFF)),
]


def count_script_characters(text, script_range):
    lower, upper = script_range

    return sum(1 for char in text if lower <= ord(char) <= upper)


results = []

for lang, text, name, script_range in tests:
    normalizer = factory.get_normalizer(lang)

    normalized = normalizer.normalize(text)

    tokens = indic_tokenize.trivial_tokenize(normalized, lang)

    original_count = count_script_characters(text, script_range)

    normalized_count = count_script_characters(normalized, script_range)

    # Verify that actual Indic characters reached Python.
    assert original_count > 0, f"{name}: Original Unicode characters missing"

    assert normalized_count > 0, f"{name}: Normalized Unicode characters missing"

    assert tokens, f"{name}: Tokenization returned no tokens"

    assert "?" not in text, f"{name}: Input contains replacement question marks"

    results.append(
        {
            "language": name,
            "original": text.encode("unicode_escape").decode("ascii"),
            "normalized": normalized.encode("unicode_escape").decode("ascii"),
            "tokens": [
                token.encode("unicode_escape").decode("ascii") for token in tokens
            ],
            "original_script_characters": original_count,
            "normalized_script_characters": normalized_count,
            "token_count": len(tokens),
            "status": "PASS",
        }
    )


print(json.dumps(results, indent=2, ensure_ascii=True))

print("\nBoth IndicNLP language tests passed.")
