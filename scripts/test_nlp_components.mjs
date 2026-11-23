import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import {
  normalizeUnicode,
  normalizeWhitespace,
  sanitizeInput,
  validateInput,
} from "../app/src/js/preprocessing.js";
import { segmentText } from "../app/src/js/sentenceSegmenter.js";
import {
  detectEntities,
  protectEntities,
  restoreEntities,
  validateProtectedEntities,
} from "../app/src/js/entityProtection.js";
import {
  DEFAULT_GLOSSARY,
  addGlossaryEntry,
  deleteGlossaryEntry,
  getGlossary,
  matchGlossaryTerms,
  resetUserGlossary,
  updateGlossaryEntry,
} from "../app/src/js/glossary.js";
import {
  levenshteinDistance,
  suggestCorrections,
  ENGLISH_VOCABULARY,
} from "../app/src/js/editDistance.js";

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
};

const results = [];
function check(name, input, expected, callback) {
  try {
    const actual = callback();
    assert.deepEqual(actual, expected);
    results.push({ name, input, expected, actual, status: "passed" });
  } catch (error) {
    results.push({
      name,
      input,
      expected,
      actual: null,
      status: "failed",
      error: error.message,
    });
  }
}

check("Unicode NFC", "e + combining acute", "é", () =>
  normalizeUnicode(`e${String.fromCharCode(0x301)}`),
);
check(
  "Indic join controls preserved",
  "Tamil with ZWJ and Kannada with ZWNJ",
  true,
  () => {
    const value = `தமிழ்${String.fromCharCode(0x200d)}ಕನ್ನಡ${String.fromCharCode(0x200c)}`;
    return normalizeUnicode(value) === value;
  },
);
check(
  "Whitespace and paragraphs",
  "spaces, tabs, repeated newlines",
  "A B\n\nC",
  () => normalizeWhitespace("  A   B\t\n \n\n C  "),
);
check(
  "Unsupported controls rejected",
  "\\u0001",
  false,
  () => sanitizeInput(`bad${String.fromCharCode(1)}text`).valid,
);
check(
  "Tamil/Kannada unicode accepted",
  "Tamil and Kannada",
  true,
  () => sanitizeInput("தமிழ் ಕನ್ನಡ").valid,
);
check(
  "Same-language route rejected",
  "Tamil to Tamil",
  false,
  () => validateInput("வணக்கம்", "tam_Taml", "tam_Taml").valid,
);

for (const [language, text, expectedCount] of [
  [
    "en",
    "I am a robotics student. I study artificial intelligence. I want to build a translator.",
    3,
  ],
  ["ta", "நான் ஒரு ரோபோட்டிக்ஸ் மாணவன். நான் செயற்கை நுண்ணறிவு படிக்கிறேன்.", 2],
  ["kn", "ನಾನು ರೊಬೋಟಿಕ್ಸ್ ವಿದ್ಯಾರ್ಥಿ. ನಾನು ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯನ್ನು ಕಲಿಯುತ್ತಿದ್ದೇನೆ.", 2],
]) {
  const chunks = await segmentText(text, { language, maxTokens: 256 });
  check(
    `Sentence grouping and information preservation ${language}`,
    text,
    true,
    () =>
      chunks.length === 1 &&
      chunks[0] === text &&
      (text.match(/[.!?。？！।]+(?=\s|$)/gu) ?? []).length === expectedCount,
  );
}
const boundaryExample =
  "Dr. Smith saw 3.14. Visit https://example.com/a.b. Next sentence!";
const boundaryChunks = await segmentText(boundaryExample, { language: "en" });
check("Abbreviation, decimal and URL preserved", boundaryExample, true, () => {
  const joined = boundaryChunks.join(" ");
  return (
    joined.includes("Dr. Smith") &&
    joined.includes("3.14") &&
    joined.includes("https://example.com/a.b") &&
    joined.includes("Next sentence!")
  );
});

const entityInput =
  "Email student@example.com https://example.com on 25/11/2026 at 10:30 AM; call 9876543210; code TRI2026A001; value 3.14; pay $20.00.";
const detected = detectEntities(entityInput);
check(
  "Entity type recognition",
  entityInput,
  ["url", "email", "date", "currency", "decimal", "phone", "identifier"].every(
    (type) => detected.some((item) => item.type === type),
  ),
  () => true,
);
const protectedValue = protectEntities(entityInput, { nonce: "UNITTEST" });
check("Entity roundtrip and duplicate detection", entityInput, true, () => {
  const restored = restoreEntities(
    protectedValue.protectedText,
    protectedValue.entityMap,
  );
  return (
    restored.restored &&
    restored.text === entityInput &&
    validateProtectedEntities(
      protectedValue.protectedText,
      protectedValue.entityMap,
    ).valid
  );
});
check(
  "Modified marker rejected safely",
  "bad marker",
  false,
  () =>
    restoreEntities(
      protectedValue.protectedText.replace(
        protectedValue.entityMap[0].marker,
        "CHANGED",
      ),
      protectedValue.entityMap,
    ).restored,
);

const entry = addGlossaryEntry({
  sourceLanguage: "eng_Latn",
  targetLanguage: "tam_Taml",
  sourceTerm: "Artificial Intelligence Lab",
  targetTerm: "செயற்கை நுண்ணறிவு ஆய்வகம்",
});
check("Glossary add and retrieve", entry.id, true, () =>
  getGlossary("eng_Latn", "tam_Taml").some((item) => item.id === entry.id),
);
const updated = updateGlossaryEntry(entry.id, {
  targetTerm: "செயற்கை நுண்ணறிவு கூடம்",
});
check(
  "Glossary update",
  updated.targetTerm,
  "செயற்கை நுண்ணறிவு கூடம்",
  () =>
    getGlossary("eng_Latn", "tam_Taml").find((item) => item.id === entry.id)
      .targetTerm,
);
const overlap = matchGlossaryTerms(
  "Artificial Intelligence Lab and Artificial Intelligence",
  "eng_Latn",
  "tam_Taml",
);
check(
  "Longest overlapping phrase match",
  "Artificial Intelligence Lab before Artificial Intelligence",
  ["Artificial Intelligence Lab", "Artificial Intelligence"],
  () => overlap.matches.map((item) => item.original),
);
check("Glossary delete", entry.id, true, () => {
  deleteGlossaryEntry(entry.id);
  return !getGlossary("eng_Latn", "tam_Taml").some(
    (item) => item.id === entry.id,
  );
});
resetUserGlossary();
check(
  "Default glossary covers all pairs",
  DEFAULT_GLOSSARY.length,
  30,
  () => DEFAULT_GLOSSARY.length,
);

for (const [left, right, expected] of [
  ["artifical", "artificial", 1],
  ["kitten", "sitting", 3],
  ["robot", "robots", 1],
]) {
  check(`Levenshtein ${left}/${right}`, `${left} → ${right}`, expected, () =>
    levenshteinDistance(left, right),
  );
}
check("Optional correction suggestion", "artifical", true, () =>
  suggestCorrections("artifical", ENGLISH_VOCABULARY).some(
    (item) => item.word === "artificial",
  ),
);

const report = {
  suite: "Stage 3 NLP components",
  generatedAt: new Date().toISOString(),
  passed: results.filter((item) => item.status === "passed").length,
  failed: results.filter((item) => item.status !== "passed").length,
  tests: results,
};
await writeFile(
  new URL("../evaluation/nlp_component_tests.json", import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (report.failed) process.exitCode = 1;
