"""Assemble Stage 7.6 report from saved evaluation artifacts."""
import json
import re
import statistics
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVAL = ROOT / "evaluation"
DIRECTIONS = [
    "eng_Latn-tam_Taml", "eng_Latn-kan_Knda", "tam_Taml-eng_Latn",
    "kan_Knda-eng_Latn", "tam_Taml-kan_Knda", "kan_Knda-tam_Taml",
]
LABELS = dict(zip(DIRECTIONS, [
    "English → Tamil", "English → Kannada", "Tamil → English",
    "Kannada → English", "Tamil → Kannada", "Kannada → Tamil",
]))


def jsonl(path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def edit_distance(a, b):
    return 1 - SequenceMatcher(None, a, b, autojunk=False).ratio()


def repeated_phrase(text):
    words = re.findall(r"\w+", text, flags=re.UNICODE)
    for n in range(3, len(words) // 2 + 1):
        if any(words[i:i+n] == words[i+n:i+2*n] for i in range(len(words) - 2*n + 1)):
            return True
    return False


INDIC_RANGES = [(0x0900, 0x0DFF), (0x0F00, 0x109F), (0x1700, 0x18AF),
                (0xA800, 0xABFF), (0x11000, 0x11FFF)]


def wrong_script(text, target):
    for char in text:
        code = ord(char)
        if not any(lo <= code <= hi for lo, hi in INDIC_RANGES):
            continue
        if target == "tam_Taml" and 0x0B80 <= code <= 0x0BFF:
            continue
        if target == "kan_Knda" and 0x0C80 <= code <= 0x0CFF:
            continue
        return True
    return False


fp_scores = {x["direction"]: x for x in json.loads(
    (EVAL / "results/int8/score_fp32/final_results.json").read_text(encoding="utf-8"))["results"]}
q_scores = {x["direction"]: x for x in json.loads(
    (EVAL / "results/int8/score_int8/final_results.json").read_text(encoding="utf-8"))["results"]}
paired, counts = {}, {}
for direction in DIRECTIONS:
    fp = {x["id"]: x for x in jsonl(EVAL / "predictions_fp32_sample" / f"{direction}.jsonl")}
    quant = {x["id"]: x for x in jsonl(EVAL / "predictions_int8" / f"{direction}.jsonl")}
    refs = {x["id"]: x for x in jsonl(EVAL / "results/int8/sample_references" / f"{direction}.jsonl")}
    assert len(fp) == len(quant) == len(refs) == 202 and fp.keys() == quant.keys() == refs.keys()
    assert all(fp[i]["source"] == quant[i]["source"] == refs[i]["source"] for i in refs)
    paired[direction] = (fp, quant, refs)
    counts[direction] = {}
    target = direction.split("-")[1]
    for version, rows in (("FP32", fp), ("INT8", quant)):
        texts = [str(row.get("prediction", "")) for row in rows.values()]
        counts[direction][version] = {
            "empty": sum(not text.strip() for text in texts),
            "repeat": sum(repeated_phrase(text) for text in texts),
            "wrong": sum(wrong_script(text, target) for text in texts),
            "latency": statistics.mean(float(row["translation_time_ms"]) for row in rows.values()),
        }

lines = [
    "# INT8 Quantization Evaluation", "",
    "Generated 2026-11-23. Paired evaluation uses 202 sample IDs per direction (1,212 outputs). IDs are every fifth ID in the original 1,012-row corpus: 5, 10, …, 1010. The identical list is saved at `evaluation/dataset/quantization_sample_ids.json`.", "",
    "## ONNX Runtime Web compatibility inspection", "",
    "Inspection was completed before inference. All nine quantized graphs report IR version 8 and import `ai.onnx` opset 17. Operator types include standard-domain `DynamicQuantizeLinear`, `MatMulInteger`, and `DequantizeLinear`; `LayerNormalization`; and `com.microsoft` contrib operators `FusedMatMul` and `BiasGelu`. ORT Web 1.21.0 documents WASM as supporting ONNX operators, but this does not conclusively establish support for every contrib operator. There was therefore a compatibility risk to verify in the browser. The six-direction smoke test and full INT8 sample benchmark ran in Chromium without runtime errors, confirming these graphs execute on the tested WASM path in this setup.", "",
    "Quantized external-data references match these files: encoder uses `encoder_model.onnx.data`; decoder uses `decoder_model.onnx.data`; decoder-with-past uses `decoder_with_past_model.onnx.data`. The two decoder graphs have separate external files. The current separate exports duplicate the decoder weights that had shared one FP32 sidecar, increasing disk size relative to a genuinely shared representation. A repacking approach might deduplicate these tensors, but was not attempted.", "",
    "Browser: Chrome 158.0.8127.36; package lock resolves `onnxruntime-web` 1.21.0. Smoke test: 6/6 passed, zero failed, no browser errors, no external origins requested; offline refresh passed. Smoke translations:", "",
]
smoke = json.loads((EVAL / "results/int8/browser_smoke_tests.json").read_text(encoding="utf-8"))
for item in smoke["results"]:
    lines.append(f"- {item['sourceLanguage']} → {item['targetLanguage']}: {item['translation']}")

lines += [
    "", "## Paired quality and latency", "",
    "Both variants were scored using `scripts/score_evaluation.py --mode full --expected-count 202`, the same 202-reference slice, and identical settings. Existing FP32 predictions were sliced from the full predictions; no FP32 benchmark was rerun. SacreBLEU 2.6.0 uses `13a` for English targets and `none` after Indic NLP 0.92 normalization plus trivial tokenization for Tamil/Kannada targets, with exponential smoothing. chrF++ uses word order 2. Deltas are INT8 minus FP32. Latency is the mean recorded per-sentence translation time in each sample; hardware/runtime conditions differed, so interpret speed comparisons cautiously.", "",
    "| Direction | FP32 BLEU | INT8 BLEU | Δ BLEU | FP32 chrF++ | INT8 chrF++ | Δ chrF++ | FP32 ms/sent | INT8 ms/sent |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
]
for direction in DIRECTIONS:
    fp, q = fp_scores[direction], q_scores[direction]
    lines.append(f"| {LABELS[direction]} | {fp['bleu']:.3f} | {q['bleu']:.3f} | {q['bleu']-fp['bleu']:+.3f} | {fp['chrf++']:.3f} | {q['chrf++']:.3f} | {q['chrf++']-fp['chrf++']:+.3f} | {counts[direction]['FP32']['latency']:.1f} | {counts[direction]['INT8']['latency']:.1f} |")
mean = lambda version, key: statistics.mean((fp_scores if version == "FP32" else q_scores)[d][key] for d in DIRECTIONS)
fp_latency = statistics.mean(counts[d]["FP32"]["latency"] for d in DIRECTIONS)
q_latency = statistics.mean(counts[d]["INT8"]["latency"] for d in DIRECTIONS)
lines.append(f"| **Macro average** | **{mean('FP32','bleu'):.3f}** | **{mean('INT8','bleu'):.3f}** | **{mean('INT8','bleu')-mean('FP32','bleu'):+.3f}** | **{mean('FP32','chrf++'):.3f}** | **{mean('INT8','chrf++'):.3f}** | **{mean('INT8','chrf++')-mean('FP32','chrf++'):+.3f}** | **{fp_latency:.1f}** | **{q_latency:.1f}** |")
lines += [
    "", "Quality flags: empty output means blank prediction text; repetition loop means an adjacent repeated sequence of at least three word tokens; wrong-script is a Unicode-range heuristic that flags non-target Indic scripts (for English, any Indic script). Latin names in Indic output are allowed. This is a screening heuristic, not linguistic review.", "",
    "| Direction | FP32 empty | INT8 empty | FP32 repeat loops | INT8 repeat loops | FP32 wrong script | INT8 wrong script |",
    "|---|---:|---:|---:|---:|---:|---:|",
]
for direction in DIRECTIONS:
    a, b = counts[direction]["FP32"], counts[direction]["INT8"]
    lines.append(f"| {LABELS[direction]} | {a['empty']} | {b['empty']} | {a['repeat']} | {b['repeat']} | {a['wrong']} | {b['wrong']} |")

lines += [
    "", "## Browser memory after model load", "",
    "The benchmark recorded page JS heap, V8 backing storage, and model-load time after the first successful sample per family. CDP `Performance.getMetrics` did not expose `ProcessPrivateMemory` or `ProcessResidentSet` in this run (both null). A separate Windows process snapshot recorded summed working set/private bytes for Chromium renderer processes belonging to the benchmark profile. These are aggregate renderer RSS/private memory values, not per-model incremental allocation. V8 backing storage is a WASM/ArrayBuffer proxy, not an isolated WASM memory counter.", "",
    "| Quantized family | Load ms | JS heap used MB | JS heap total MB | V8 backing storage MB | renderer RSS MB | renderer private MB |",
    "|---|---:|---:|---:|---:|---:|---:|",
]
runtime = json.loads((EVAL / "predictions_int8/runtime_metrics.json").read_text(encoding="utf-8"))["families"]
memory = {x["family"]: x for x in json.loads((EVAL / "predictions_int8/renderer_memory_samples.json").read_text(encoding="utf-8-sig"))}
to_mb = lambda value: "n/a" if value is None else f"{value/1_000_000:.1f}"
for family in ("en-indic-200m", "indic-en-200m", "indic-indic-320m"):
    m, r = runtime[family], memory[family]
    lines.append(f"| {family} | {m['model_load_time_ms']:.1f} | {to_mb(m['js_heap_used_bytes'])} | {to_mb(m['js_heap_total_bytes'])} | {to_mb(m['wasm_and_arraybuffer_backing_store_bytes'])} | {to_mb(r['renderer_rss_total_bytes'])} | {to_mb(r['renderer_private_total_bytes'])} |")

lines += ["", "## Five largest output differences per direction", "", "Ranked by normalized character dissimilarity (`1 - difflib.SequenceMatcher.ratio()`); this is a selection heuristic, not an evaluation metric.", ""]
for direction in DIRECTIONS:
    fp, quant, refs = paired[direction]
    ranked = sorted(refs, key=lambda ident: edit_distance(fp[ident]["prediction"], quant[ident]["prediction"]), reverse=True)[:5]
    lines += [f"### {LABELS[direction]}", ""]
    for rank, ident in enumerate(ranked, 1):
        r = refs[ident]
        lines += [f"#### {rank}. ID {ident} (difference {edit_distance(fp[ident]['prediction'], quant[ident]['prediction']):.3f})", f"- Source: {r['source']}", f"- Reference: {r['reference']}", f"- FP32: {fp[ident]['prediction']}", f"- INT8: {quant[ident]['prediction']}", ""]

lines += [
    "## Errors and limitations", "",
    "- Browser smoke passed 6/6; no browser console errors or external origins were recorded. The full benchmark completed all six 202-item directions (1,212/1,212 successful).",
    "- Scoring emitted SacreBLEU warnings that 100 lines ended in a tokenized period in several corpus calls. Both variants were scored consistently with the same settings.",
    "- Renderer RSS aggregates this benchmark’s Chromium renderer process(es), sampled after first load per family. It is environment-specific and not a phone RAM estimate.",
    "- Wrong-script and repetition-loop counts are heuristic and do not replace human review.",
    "- Phone memory feasibility cannot be established from desktop browser usage; runtime, tokenizer, activations, decoder cache, and OS/app overhead all affect actual phone RAM.", "",
]
(ROOT / "docs/QUANTIZATION_EVALUATION.md").write_text("\n".join(lines), encoding="utf-8")
print("Report written to docs/QUANTIZATION_EVALUATION.md")
print(f"Macro BLEU: FP32 {mean('FP32','bleu'):.4f}; INT8 {mean('INT8','bleu'):.4f}")
print(f"Macro chrF++: FP32 {mean('FP32','chrf++'):.4f}; INT8 {mean('INT8','chrf++'):.4f}")
print(f"Macro latency ms/sentence: FP32 {fp_latency:.1f}; INT8 {q_latency:.1f}")
for direction in DIRECTIONS:
    print(direction, counts[direction])
