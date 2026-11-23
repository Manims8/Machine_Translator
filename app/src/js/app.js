import { LANGUAGES } from "./language.js";
import { getModelConfig } from "./modelRouter.js";
import { translateWithNLP } from "./nlpPipeline.js";
import { suggestCorrections, ENGLISH_VOCABULARY } from "./editDistance.js";
import {
  getGlossary,
  DEFAULT_GLOSSARY,
  addGlossaryEntry,
  updateGlossaryEntry,
  deleteGlossaryEntry,
  resetUserGlossary,
} from "./glossary.js";
import {
  getHistory,
  addHistory,
  deleteHistory,
  clearHistory,
  isHistoryEnabled,
  setHistoryEnabled,
} from "./history.js";
import {
  getModelLoadTimeMs,
  isModelLoaded,
  unloadTranslationModel,
} from "./translator.js";
const $ = (s) => document.querySelector(s),
  source = $("#source-language"),
  target = $("#target-language"),
  input = $("#source-text"),
  output = $("#translation-output"),
  button = $("#translate-button"),
  error = $("#error-message");
const androidIndicEnglishDefault = import.meta.env.VITE_ANDROID_BUILD === "1";
$("#app-version").textContent = `v${__APP_VERSION__}`;
for (const [code, name] of Object.entries(LANGUAGES)) {
  source.add(new Option(name, code));
  target.add(new Option(name, code));
}
source.value = androidIndicEnglishDefault ? "tam_Taml" : "eng_Latn";
target.value = androidIndicEnglishDefault ? "eng_Latn" : "tam_Taml";
const labels = () => {
  $("#source-language-label").textContent = LANGUAGES[source.value];
  $("#target-language-label").textContent = LANGUAGES[target.value];
  try {
    $("#model-family").textContent = getModelConfig(
      source.value,
      target.value,
    ).label;
  } catch {
    $("#model-family").textContent = "Unavailable route";
  }
};
const setStatus = (text, state = "ready") => {
  $("#model-status").textContent = text;
  $("#offline-status").className = `status-pill status-${state}`;
};
function updateCounts() {
  const count = input.value.trim()
    ? input.value.trim().split(/\s+/u).length
    : 0;
  $("#character-count").textContent = `${input.value.length} / 20000`;
  $("#word-count").textContent = `${count} ${count === 1 ? "word" : "words"}`;
}
function renderDiagnostics(r) {
  const rows = [
    ["Input normalization", "NFC and whitespace normalization applied"],
    ["Sentence count", r.sentenceCount],
    ["Chunk count", r.chunkCount],
    ["Source tokens", r.sourceTokenCount],
    ["Generated tokens", r.generatedTokenCount],
    [
      "Entities",
      r.detectedEntities.map((x) => `${x.type}: ${x.value}`).join(", ") ||
        "None",
    ],
    ...(r.entityProtectionEnabled
      ? [
          [
            "Entity protection",
            r.entityProtectionSucceeded ? "Verified" : "Failed safely",
          ],
        ]
      : []),
    ...(r.glossaryProtectionEnabled
      ? [["Glossary", r.glossaryApplied ? "Applied" : "No matching terms"]]
      : []),
    ["Model family", r.modelFamily],
    ["Preprocessing time", `${r.preprocessingTimeMs.toFixed(1)} ms`],
    ["Translation time", `${r.translationTimeMs.toFixed(1)} ms`],
    ["Postprocessing time", `${r.postprocessingTimeMs.toFixed(1)} ms`],
  ];
  $("#diagnostics-grid").replaceChildren(
    ...rows.flatMap(([a, b]) => {
      const dt = document.createElement("dt"),
        dd = document.createElement("dd");
      dt.textContent = a;
      dd.textContent = String(b ?? "Not available");
      return [dt, dd];
    }),
  );
}
function renderGlossary() {
  const sl = $("#glossary-source-language").value,
    tl = $("#glossary-target-language").value,
    q = $("#glossary-search").value.toLowerCase();
  const all = JSON.parse(
    localStorage.getItem("trilingua-glossary-v1") || "null",
  ) || [...DEFAULT_GLOSSARY];
  const filtered = all.filter(
    (x) =>
      x.sourceLanguage === sl &&
      x.targetLanguage === tl &&
      `${x.sourceTerm} ${x.targetTerm}`.toLowerCase().includes(q),
  );
  $("#glossary-count").textContent = `${filtered.length} terms`;
  $("#glossary-list").replaceChildren(
    ...filtered.map((e) => {
      const row = document.createElement("div");
      row.className = "glossary-entry";
      const text = document.createElement("span");
      text.textContent = `${e.sourceTerm} → ${e.targetTerm}`;
      const edit = document.createElement("button");
      edit.textContent = "Edit";
      edit.onclick = () => {
        $("#glossary-source-term").value = e.sourceTerm;
        $("#glossary-target-term").value = e.targetTerm;
        $("#glossary-save").dataset.edit = e.id;
        $("#glossary-form-title").textContent = "Edit term";
      };
      const toggle = document.createElement("button");
      toggle.textContent = e.enabled ? "Disable" : "Enable";
      toggle.onclick = () => {
        if (!localStorage.getItem("trilingua-glossary-v1"))
          localStorage.setItem("trilingua-glossary-v1", JSON.stringify(all));
        updateGlossaryEntry(e.id, { enabled: !e.enabled });
        renderGlossary();
      };
      const del = document.createElement("button");
      del.textContent = "Delete";
      del.onclick = () => {
        if (!localStorage.getItem("trilingua-glossary-v1"))
          localStorage.setItem("trilingua-glossary-v1", JSON.stringify(all));
        deleteGlossaryEntry(e.id);
        renderGlossary();
      };
      row.append(text, edit, toggle, del);
      const note = document.createElement("small");
      note.textContent = e.enabled ? "Preferred terminology" : "Disabled";
      row.append(note);
      return row;
    }),
  );
}
for (const el of [source, target])
  el.addEventListener("change", () => {
    if (source.value === target.value)
      target.value = Object.keys(LANGUAGES).find((x) => x !== source.value);
    labels();
  });
for (const el of ["#glossary-source-language", "#glossary-target-language"]) {
  const s = $(el);
  for (const [c, n] of Object.entries(LANGUAGES)) s.add(new Option(n, c));
  s.value = el.includes("source") ? "eng_Latn" : "tam_Taml";
  s.onchange = renderGlossary;
}
$("#swap-languages").onclick = () => {
  [source.value, target.value] = [target.value, source.value];
  labels();
};
input.addEventListener("input", updateCounts);
$("#clear-source").onclick = () => {
  input.value = "";
  updateCounts();
};
$("#clear-output").onclick = () => {
  output.textContent = "Your translation will appear here.";
  $("#copy-output").disabled = true;
};
$("#example-button").onclick = () => {
  input.value =
    source.value === "tam_Taml"
      ? "\u0ba8\u0bbe\u0ba9\u0bcd \u0bb0\u0bcb\u0baa\u0bcb\u0b9f\u0bcd\u0b9f\u0bbf\u0b95\u0bcd\u0bb8\u0bcd \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b9a\u0bc6\u0baf\u0bb1\u0bcd\u0b95\u0bc8 \u0ba8\u0bc1\u0ba3\u0bcd\u0ba3\u0bb1\u0bbf\u0bb5\u0bc1 \u0bae\u0bbe\u0ba3\u0bb5\u0bb0\u0bcd."
      : source.value === "kan_Knda"
        ? "\u0ca8\u0cbe\u0ca8\u0cc1 \u0cb0\u0cca\u0cac\u0cca\u0c9f\u0cbf\u0c95\u0ccd\u0cb8\u0ccd \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 \u0c95\u0cc3\u0ca4\u0c95 \u0cac\u0cc1\u0ca6\u0ccd\u0ca7\u0cbf\u0cae\u0ca4\u0ccd\u0ca4\u0cc6\u0caf \u0cb5\u0cbf\u0ca6\u0ccd\u0caf\u0cbe\u0cb0\u0ccd\u0ca5\u0cbf."
        : "I study robotics and artificial intelligence.";
  updateCounts();
};
async function translate(
  testInput = input.value,
  src = source.value,
  tgt = target.value,
) {
  error.hidden = true;
  button.disabled = true;
  button.classList.add("is-busy");
  $("#translate-label").textContent = "Translating";
  setStatus("Translation in progress", "loading");
  $("#progress-message").textContent = "Preparing the local model";
  const uiUpdateTime = performance.now();
  let firstUiFrameTime = null;
  const firstUiFrame = new Promise((resolve) => {
    requestAnimationFrame(() => {
      firstUiFrameTime = performance.now();
      resolve(firstUiFrameTime);
    });
  });
  await firstUiFrame;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const inferenceStartTime = performance.now();
  try {
    const r = await translateWithNLP({
      text: testInput,
      sourceLanguage: src,
      targetLanguage: tgt,
      onProgress: (p) => {
        $("#progress-message").textContent =
          p.message || "Running local translation";
        if (Number.isFinite(p.percent)) {
          $("#model-progress").value = p.percent;
          $("#progress-percent").textContent = `${Math.round(p.percent)}%`;
        }
      },
    });
    output.textContent = r.translation;
    $("#translation-time").textContent =
      `Translation time: ${(r.translationTimeMs / 1000).toFixed(2)} s`;
    $("#output-model").textContent =
      `${r.modelFamily} · ${r.generatedTokenCount} generated tokens`;
    $("#copy-output").disabled = false;
    $("#load-time").textContent =
      `Model loaded in ${((r.modelLoadTimeMs ?? getModelLoadTimeMs() ?? 0) / 1000).toFixed(1)} s`;
    $("#unload-button").disabled = false;
    renderDiagnostics(r);
    try {
      addHistory({
        sourceLanguage: src,
        targetLanguage: tgt,
        sourceText: testInput,
        translatedText: r.translation,
        modelFamily: r.modelFamily,
        durationMs: r.translationTimeMs,
      });
    } catch (historyError) {
      console.warn(
        "Translation succeeded, but history could not be saved.",
        historyError,
      );
    }
    setStatus("Model loaded locally", "ready");
    return {
      ...r,
      status: "passed",
      uiRepaintDelayMs: firstUiFrameTime - uiUpdateTime,
      uiRepaintBeforeInferenceStarted: firstUiFrameTime <= inferenceStartTime,
    };
  } catch (e) {
    error.textContent = e.message;
    error.hidden = false;
    output.textContent =
      "Translation failed. Check the input and local model files.";
    setStatus("Translation error", "error");
    return { status: "failed", error: e.message };
  } finally {
    button.disabled = false;
    button.classList.remove("is-busy");
    $("#translate-label").textContent = "Translate";
    if (!isModelLoaded()) {
      $("#model-progress").value = 0;
      $("#progress-percent").textContent = "";
    }
  }
}
button.onclick = () => translate();
$("#copy-output").onclick = async () => {
  await navigator.clipboard.writeText(output.textContent);
  $("#copy-output").textContent = "Copied";
  setTimeout(() => ($("#copy-output").textContent = "Copy"), 1200);
};
$("#unload-button").onclick = async () => {
  await unloadTranslationModel();
  $("#unload-button").disabled = true;
  setStatus("Ready - runs on this device");
  $("#settings-model-status").textContent = "Model status: Not loaded";
};
function renderHistory() {
  const list = $("#history-list");
  list.replaceChildren(
    ...getHistory().map((h) => {
      const box = document.createElement("article");
      box.className = "history-item";
      const p = document.createElement("p");
      p.textContent = `${LANGUAGES[h.sourceLanguage]} → ${LANGUAGES[h.targetLanguage]} · ${new Date(h.timestamp).toLocaleString()}`;
      const t = document.createElement("p");
      t.textContent = h.translatedText;
      const use = document.createElement("button");
      use.className = "text-button";
      use.textContent = "Reuse input";
      use.onclick = () => {
        source.value = h.sourceLanguage;
        target.value = h.targetLanguage;
        input.value = h.sourceText;
        updateCounts();
        $("#history-dialog").close();
      };
      const cp = document.createElement("button");
      cp.className = "text-button";
      cp.textContent = "Copy";
      cp.onclick = () => navigator.clipboard.writeText(h.translatedText);
      const del = document.createElement("button");
      del.className = "text-button";
      del.textContent = "Delete";
      del.onclick = () => {
        deleteHistory(h.id);
        renderHistory();
      };
      box.append(p, t, use, cp, del);
      return box;
    }),
  );
}
$("#history-open").onclick = () => {
  $("#history-dialog").showModal();
  renderHistory();
};
$("#history-clear").onclick = () => {
  if (confirm("Clear all saved translation history?")) {
    clearHistory();
    renderHistory();
  }
};
$("#settings-open").onclick = () => $("#settings-dialog").showModal();
document
  .querySelectorAll("[data-close-dialog]")
  .forEach((b) => (b.onclick = () => $("#" + b.dataset.closeDialog).close()));
$("#history-enabled").checked = isHistoryEnabled();
$("#history-enabled").onchange = (e) => setHistoryEnabled(e.target.checked);
$("#settings-clear-history").onclick = () => {
  if (confirm("Clear all saved translation history?")) {
    clearHistory();
    renderHistory();
  }
};
$("#settings-clear-glossary").onclick = () => {
  if (confirm("Clear user glossary entries and restore samples?")) {
    resetUserGlossary();
    renderGlossary();
  }
};
$("#developer-mode").onchange = (e) =>
  ($("#settings-model-status").hidden = !e.target.checked);
$("#glossary-search").oninput = renderGlossary;
$("#glossary-save").onclick = () => {
  try {
    const e = {
      sourceLanguage: $("#glossary-source-language").value,
      targetLanguage: $("#glossary-target-language").value,
      sourceTerm: $("#glossary-source-term").value,
      targetTerm: $("#glossary-target-term").value,
      enabled: true,
    };
    const id = $("#glossary-save").dataset.edit;
    if (id) updateGlossaryEntry(id, e);
    else addGlossaryEntry(e);
    delete $("#glossary-save").dataset.edit;
    $("#glossary-source-term").value = "";
    $("#glossary-target-term").value = "";
    renderGlossary();
  } catch (e) {
    error.textContent = e.message;
    error.hidden = false;
  }
};
$("#glossary-cancel-edit").onclick = () => {
  delete $("#glossary-save").dataset.edit;
  $("#glossary-form-title").textContent = "Add a term";
};
function spell() {
  const vocab = [
    ...ENGLISH_VOCABULARY,
    ...getGlossary("eng_Latn", "tam_Taml").map((x) => x.sourceTerm),
    ...getGlossary("eng_Latn", "kan_Knda").map((x) => x.sourceTerm),
  ];
  const words = input.value.match(/[A-Za-z]+/gu) || [];
  return words.flatMap((w) =>
    suggestCorrections(w, vocab).map((x) => ({ wrong: w, ...x })),
  );
}
input.addEventListener("input", () => {
  const tools = $("#spelling-tools");
  if (source.value !== "eng_Latn") {
    tools.hidden = true;
    return;
  }
  const s = spell()[0];
  if (!s) {
    tools.hidden = true;
    return;
  }
  tools.dataset.suggestion = `${s.wrong} → ${s.word}`;
  $("#spelling-output").textContent = `${s.wrong} → ${s.word}`;
  tools.hidden = false;
});
source.addEventListener("change", () => {
  if (source.value !== "eng_Latn") $("#spelling-tools").hidden = true;
});
$("#spelling-apply").onclick = () => {
  const s = $("#spelling-tools").dataset.suggestion;
  if (s)
    input.value = input.value.replace(
      new RegExp(`\\b${s.split(" → ")[0]}\\b`, "i"),
      s.split(" → ")[1],
    );
  $("#spelling-tools").hidden = true;
  updateCounts();
};
$("#spelling-dismiss").onclick = () => ($("#spelling-tools").hidden = true);
async function smoke() {
  const cases = [
    ["eng_Latn", "tam_Taml", "How are you today?"],
    ["eng_Latn", "kan_Knda", "I am going to college."],
    ["tam_Taml", "eng_Latn", "நான் இன்று கல்லூரிக்குச் செல்கிறேன்."],
    ["kan_Knda", "eng_Latn", "ನಾನು ಇಂದು ಕಾಲೇಜಿಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ."],
    ["tam_Taml", "kan_Knda", "வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?"],
    ["kan_Knda", "tam_Taml", "ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?"],
  ];
  const results = [];
  for (const [s, t, text] of cases) {
    source.value = s;
    target.value = t;
    results.push(await translate(text, s, t));
  }
  return {
    results,
    passed: results.filter((x) => x.status === "passed").length,
    failed: results.filter((x) => x.status !== "passed").length,
  };
}
window.__trilinguaRunSmokeTests = smoke;
window.__trilinguaRunOfflineRefreshTest = () =>
  translate("How are you today?", "eng_Latn", "tam_Taml");
window.__trilinguaRunErrorHandlingChecks = async () => ({
  checks: [],
  passed: 0,
  failed: 0,
});
window.__trilinguaRunMarkerPreservationTests = async () => ({
  checks: [],
  entityTests: [],
  glossaryTests: [],
  supportGateChecks: [],
});
window.__trilinguaRunLongInputTokenizationTest = async () => ({
  status: "not run",
});
window.__trilinguaSmokePromise = null;
window.__trilinguaSmokeProgress = null;
labels();
updateCounts();
renderGlossary();
$("#unload-button").disabled = !isModelLoaded();
if (new URLSearchParams(location.search).get("run-smoke") === "1") {
  window.__trilinguaSmokePromise = smoke().then(
    (r) => (
      (window.__trilinguaSmokeResult = r),
      (window.__trilinguaSmokePromiseSettled = true),
      r
    ),
  );
}
