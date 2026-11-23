# INT8 Quantization Evaluation

Generated 2026-11-23. Paired evaluation uses 202 sample IDs per direction (1,212 outputs). IDs are every fifth ID in the original 1,012-row corpus: 5, 10, …, 1010. The identical list is saved at `evaluation/dataset/quantization_sample_ids.json`.

## ONNX Runtime Web compatibility inspection

Inspection was completed before inference. All nine quantized graphs report IR version 8 and import `ai.onnx` opset 17. Operator types include standard-domain `DynamicQuantizeLinear`, `MatMulInteger`, and `DequantizeLinear`; `LayerNormalization`; and `com.microsoft` contrib operators `FusedMatMul` and `BiasGelu`. ORT Web 1.21.0 documents WASM as supporting ONNX operators, but contrib operators are a separate domain with their own registered kernels, so the graph/operator scan alone could not prove compatibility ([ORT Web guide](https://onnxruntime.ai/docs/tutorials/web/), [contrib operator reference](https://onnxruntime.ai/docs/reference/operators/ContribOperators.html)). The six-direction smoke test and full INT8 sample benchmark ran in Chromium without runtime errors, confirming these graphs execute on the tested WASM path in this setup.

Quantized external-data references match these files: encoder uses `encoder_model.onnx.data`; decoder uses `decoder_model.onnx.data`; decoder-with-past uses `decoder_with_past_model.onnx.data`. The two decoder graphs have separate external files. The separate exports duplicate byte-identical decoder weights: 126.383 MB for English→Indic, 17.303 MB for Indic→English, and 63.575 MB for Indic↔Indic, or 207.261 MB total. This duplication is included in the generated sizes below. Repacking both graphs to point at shared external ranges could save these amounts, but would require rewriting offsets and revalidating; it was not attempted.

Browser: Chrome 158.0.8127.36; package lock resolves `onnxruntime-web` 1.21.0. Smoke test: 6/6 passed, zero failed, no browser errors, no external origins requested; offline refresh passed. Smoke translations:

- eng_Latn → tam_Taml: இன்று எப்படி இருக்கிறீர்கள்?
- eng_Latn → kan_Knda: ನಾನು ಕಾಲೇಜಿಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ.
- tam_Taml → eng_Latn: I am going to college today.
- kan_Knda → eng_Latn: I'm going to college today.
- tam_Taml → kan_Knda: ಹಲೋ, ನೀವು ಹೇಗಿದ್ದೀರಿ
- kan_Knda → tam_Taml: வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்

## Paired quality and latency

Both variants were scored using `scripts/score_evaluation.py --mode full --expected-count 202`, the same 202-reference slice, and identical settings. Existing FP32 predictions were sliced from the full predictions; no FP32 benchmark was rerun. SacreBLEU 2.6.0 uses `13a` for English targets and `none` after Indic NLP 0.92 normalization plus trivial tokenization for Tamil/Kannada targets, with exponential smoothing. chrF++ uses word order 2. Deltas are INT8 minus FP32. Latency is the mean recorded per-sentence translation time in each sample; hardware/runtime conditions differed, so interpret speed comparisons cautiously.

| Direction | FP32 BLEU | INT8 BLEU | Δ BLEU | FP32 chrF++ | INT8 chrF++ | Δ chrF++ | FP32 ms/sent | INT8 ms/sent |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| English → Tamil | 17.748 | 18.043 | +0.295 | 54.833 | 54.633 | -0.200 | 1417.9 | 1391.7 |
| English → Kannada | 20.228 | 19.956 | -0.272 | 55.295 | 54.930 | -0.365 | 1332.0 | 1291.1 |
| Tamil → English | 33.748 | 33.968 | +0.220 | 58.156 | 58.039 | -0.118 | 892.6 | 876.7 |
| Kannada → English | 33.939 | 33.012 | -0.928 | 59.239 | 58.655 | -0.585 | 895.9 | 871.6 |
| Tamil → Kannada | 10.982 | 11.440 | +0.458 | 43.352 | 43.860 | +0.508 | 1367.8 | 1348.2 |
| Kannada → Tamil | 10.305 | 10.592 | +0.287 | 45.612 | 45.297 | -0.315 | 1420.1 | 1416.8 |
| **Macro average** | **21.158** | **21.169** | **+0.010** | **52.748** | **52.569** | **-0.179** | **1221.1** | **1199.4** |

The quantized on-disk totals from the Stage 7.5 report are 497.765 MB (English→Indic), 358.951 MB (Indic→English), and 564.012 MB (Indic↔Indic), **1.421 GB grand total** (decimal units, all three families installed). Deduplicating the identified identical decoder ranges would reduce that by 207.261 MB to approximately 1.213 GB, before any metadata/alignment overhead; this is a calculated potential saving, not a generated artifact.

Quality flags: empty output means blank prediction text; repetition loop means an adjacent repeated sequence of at least three word tokens; wrong-script is a Unicode-range heuristic that flags non-target Indic scripts (for English, any Indic script). Latin names in Indic output are allowed. This is a screening heuristic, not linguistic review.

| Direction | FP32 empty | INT8 empty | FP32 repeat loops | INT8 repeat loops | FP32 wrong script | INT8 wrong script |
|---|---:|---:|---:|---:|---:|---:|
| English → Tamil | 0 | 0 | 3 | 2 | 0 | 0 |
| English → Kannada | 0 | 0 | 1 | 1 | 0 | 0 |
| Tamil → English | 0 | 0 | 0 | 0 | 0 | 0 |
| Kannada → English | 0 | 0 | 0 | 0 | 0 | 0 |
| Tamil → Kannada | 0 | 0 | 2 | 2 | 0 | 0 |
| Kannada → Tamil | 0 | 0 | 3 | 1 | 1 | 1 |

## Browser memory after model load

The benchmark recorded page JS heap, V8 backing storage, and model-load time after the first successful sample per family. CDP `Performance.getMetrics` did not expose `ProcessPrivateMemory` or `ProcessResidentSet` in this run (both null). A separate Windows process snapshot recorded summed working set/private bytes for Chromium renderer processes belonging to the benchmark profile. These are cumulative renderer totals at each sample; earlier model families may still have been resident, so they are not per-model incremental allocations. V8 backing storage is a WASM/ArrayBuffer proxy, not an isolated WASM memory counter.

| Quantized family | Load ms | JS heap used MB | JS heap total MB | V8 backing storage MB | renderer RSS MB | renderer private MB |
|---|---:|---:|---:|---:|---:|---:|
| en-indic-200m | 3651.5 | 53.0 | 94.4 | 527.7 | 931.1 | 872.9 |
| indic-en-200m | 3097.3 | 52.7 | 104.6 | 465.9 | 1496.9 | 1438.9 |
| indic-indic-320m | 4049.5 | 70.3 | 145.6 | 568.1 | 1696.1 | 1589.2 |

### Phone RAM estimate (not device-tested)

These are rough estimates from desktop browser measurements and the 1.421 GB on-disk model total, not measured Android results. The benchmark's aggregate renderer RSS reached about 1.70 GB after all three families had loaded, before accounting for the full Android OS and other foreground apps. If the app retains all three families at once, 4 GB phones are high risk for memory pressure or process termination; 6 GB is more plausible but still sensitive to OS load and cache policy; 8 GB is the most realistic of these choices. Loading and evicting one family at a time would lower the memory requirement, but was not measured here. All three model files also require roughly 1.42 GB of storage, separate from RAM.

## Five largest output differences per direction

Ranked by normalized character dissimilarity (`1 - difflib.SequenceMatcher.ratio()`); this is a selection heuristic, not an evaluation metric.

### English → Tamil

#### 1. ID 575 (difference 0.539)
- Source: Many people don't think about them as dinosaurs because they have feathers and can fly.
- Reference: நிறைய மக்கள் தங்களை டைனோஸர்ஸ் என்று நினைப்பதில்லை ஏனெனில் அவற்றிற்கு இறகுகள் உள்ளன மற்றும் அவைகளால் பறக்க முடியும்.
- FP32: இறகுகள் இருப்பதால் பறக்கக்கூடியவை என்பதால் பலர் அவற்றை டைனோசர்கள் என்று நினைக்கவில்லை.
- INT8: பல மக்கள் அவற்றை டைனோசர்கள் என்று நினைக்கவில்லை, ஏனெனில் அவை இறகுகளைக் கொண்டுள்ளன மற்றும் பறக்க முடியும்.

#### 2. ID 30 (difference 0.345)
- Source: The find also grants insight into the evolution of feathers in birds.
- Reference: கண்டுபிடிப்பானது பறவைகளில் இறகுகளின் பரிணாம வளர்ச்சியைப் பற்றிய நுண்ணறிவை வழங்குகிறது.
- FP32: பறவைகளில் இறகுகளின் பரிணாமம் குறித்த நுண்ணறிவையும் இந்த கண்டுபிடிப்பு வழங்குகிறது.
- INT8: இந்த கண்டுபிடிப்பு பறவைகளில் இறகுகளின் பரிணாம வளர்ச்சியைப் பற்றிய நுண்ணறிவையும் வழங்குகிறது.

#### 3. ID 550 (difference 0.336)
- Source: Using ships to transport goods is by far the most efficient way to move large amounts of people and goods across oceans.
- Reference: கப்பல்களைப் பயன்படுத்தி பொருள்களை கொண்டு போவது என்பது இதுவரை உள்ளவற்றில் பெருமளவு மக்களையும் பொருட்களையும் கடலுக்கு அப்பால் கொண்டு செல்ல மிகச் சிறந்த வழி ஆகும்.
- FP32: பொருட்களைக் கொண்டு செல்ல கப்பல்களைப் பயன்படுத்துவது பெருங்கடல்களைக் கடந்து அதிக அளவு மக்களையும் பொருட்களையும் நகர்த்துவதற்கான மிகவும் திறமையான வழியாகும்.
- INT8: பெருங்கடல்களைக் கடந்து அதிக அளவு மக்களையும் பொருட்களையும் கொண்டு செல்வதற்கு கப்பல்களைப் பயன்படுத்துவதே மிகவும் திறமையான வழியாகும்.

#### 4. ID 325 (difference 0.326)
- Source: 34 per cent of those in the poll share this view, wanting Queen Elizabeth II to be Australia's last monarch.
- Reference: ஆஸ்திரேலியாவின் கடைசி மன்னராக இரண்டாம் எலிசபெத் மகாராணி இருக்க வேண்டும் என்று 34 சதவீதம் பேர் வாக்களித்து உள்ளனர்.
- FP32: வாக்கெடுப்பில் உள்ளவர்களில் 34 சதவீதம் பேர் இரண்டாம் எலிசபெத் மகாராணி ஆஸ்திரேலியாவின் கடைசி மன்னராக இருக்க வேண்டும் என்று விரும்புகிறார்கள்.
- INT8: இரண்டாம் எலிசபெத் மகாராணி ஆஸ்திரேலியாவின் கடைசி மன்னராக இருக்க வேண்டும் என்று கருத்துக் கணிப்பில் உள்ளவர்களில் 34 சதவீதம் பேர் விரும்புகிறார்கள்.

#### 5. ID 515 (difference 0.315)
- Source: We perceive the Foster Care System to be a safety zone for these children.
- Reference: இந்தக் குழந்தைகளுக்கு வளர்ப்புக் காப்பு அமைப்பு ஒரு பாதுகாப்பான இடமாக இருக்கும் என்று கருதுகிறோம்.
- FP32: இந்த குழந்தைகளுக்கான பாதுகாப்பு மண்டலமாக வளர்ப்பு பராமரிப்பு அமைப்பை நாங்கள் கருதுகிறோம்.
- INT8: வளர்ப்பு பராமரிப்பு அமைப்பு இந்த குழந்தைகளுக்கான பாதுகாப்பு மண்டலமாக நாங்கள் கருதுகிறோம்.

### English → Kannada

#### 1. ID 365 (difference 0.318)
- Source: The females are usually closely related to each other, being a large family of sisters and daughters.
- Reference: ಸಹೋದರಿಯರು  ಮತ್ತು ಪುತ್ರಿಯರ ಅತಿ ದೊಡ್ಡ ಕುಟುಂಬವಾಗಿರುವುದರಿಂದ ಹೆಣ್ಣುಗಳಲ್ಲಿ  ಹತ್ತಿರದ ಸಂಬಂಧವಿರುತ್ತದೆ.
- FP32: ಸಹೋದರಿಯರು ಮತ್ತು ಪುತ್ರಿಯರ ದೊಡ್ಡ ಕುಟುಂಬವಾಗಿರುವುದರಿಂದ ಮಹಿಳೆಯರು ಸಾಮಾನ್ಯವಾಗಿ ಪರಸ್ಪರ ನಿಕಟ ಸಂಬಂಧವನ್ನು ಹೊಂದಿರುತ್ತಾರೆ.
- INT8: ಮಹಿಳೆಯರು ಸಾಮಾನ್ಯವಾಗಿ ಸಹೋದರಿಯರು ಮತ್ತು ಹೆಣ್ಣುಮಕ್ಕಳ ದೊಡ್ಡ ಕುಟುಂಬವಾಗಿರುವುದರಿಂದ ಪರಸ್ಪರ ನಿಕಟ ಸಂಬಂಧ ಹೊಂದಿದ್ದಾರೆ.

#### 2. ID 865 (difference 0.307)
- Source: Reindeer husbandry is an important livelihood among the Sámi and the culture surrounding the trade is important also for many with other professions.
- Reference: ಹಿಮಸಾರಂಗದ ಸಾಕಾಣಿಕೆ ಸಾಮಿ ಜನರ ಒಂದು ಬಹುಮುಖ್ಯ ಜೀವನಾಧಾರ ಹಾಗೂ ತಮ್ಮ ವ್ಯವಹಾರವನ್ನು ಸುತ್ತುವರಿದ ಸಂಸ್ಕ್ರತಿ ವಿವಿಧ ವೃತ್ತಿಗಳಲ್ಲಿರುವರಿಗೆ ಬಹಳ ಮುಖ್ಯವಾಗುತ್ತದೆ.
- FP32: ಹಿಮಸಾರಂಗದ ಸಾಕಣೆಯು ಸಾಮಿಯವರಲ್ಲಿ ಪ್ರಮುಖ ಜೀವನೋಪಾಯವಾಗಿದೆ ಮತ್ತು ವ್ಯಾಪಾರದ ಸುತ್ತಲಿನ ಸಂಸ್ಕೃತಿಯು ಇತರ ವೃತ್ತಿಗಳೊಂದಿಗೆ ಅನೇಕರಿಗೆ ಮುಖ್ಯವಾಗಿದೆ.
- INT8: ಹಿಮಸಾರಂಗದ ಕೃಷಿಯು ಸಾಮಿಯವರಲ್ಲಿ ಪ್ರಮುಖ ಜೀವನೋಪಾಯವಾಗಿದೆ ಮತ್ತು ಇತರ ವೃತ್ತಿಗಳೊಂದಿಗೆ ವ್ಯಾಪಾರವನ್ನು ಸುತ್ತುವರೆದಿರುವ ಸಂಸ್ಕೃತಿಯು ಸಹ ಮುಖ್ಯವಾಗಿದೆ.

#### 3. ID 310 (difference 0.275)
- Source: A former Filipino policeman has kept Hong Kong tourists hostage by hijacking their bus in Manila, the capital of the Philippines.
- Reference: ಫಿಲಿಪೈನ್ಸ್‌ನ ರಾಜಧಾನಿಯಾದ ಮನಿಲಾದಲ್ಲಿ ಅಲ್ಲಿನ ಓರ್ವ ಮಾಜಿ ಪೋಲೀಸ್ ಅಧಿಕಾರಿ ಹಾಂಗ್‌‌ಕಾಂಗ್ ಪ್ರವಾಸಿಗರ ಬಸ್ಸನ್ನು ಅಪಹರಿಸಿ ಅವರನ್ನು ಒತ್ತೆಯಾಳುಗಳನ್ನಾಗಿ ಇರಿಸಿಕೊಂಡಿದ್ದಾರೆ.
- FP32: ಫಿಲಿಪೈನ್ಸ್ನ ರಾಜಧಾನಿಯಾದ ಮನಿಲಾದಲ್ಲಿ ಹಾಂಗ್ ಕಾಂಗ್ ಪ್ರವಾಸಿಗರ ಬಸ್ ಅನ್ನು ಅಪಹರಿಸುವ ಮೂಲಕ ಮಾಜಿ ಫಿಲಿಪಿನೋ ಪೊಲೀಸ್ ಒತ್ತೆಯಾಳಾಗಿಟ್ಟುಕೊಂಡಿದ್ದಾರೆ.
- INT8: ಫಿಲಿಪೈನ್ಸ್ನ ರಾಜಧಾನಿಯಾದ ಮನಿಲಾದಲ್ಲಿ ಹಾಂಗ್ ಕಾಂಗ್ ಪ್ರವಾಸಿಗರ ಬಸ್ ಅನ್ನು ಅಪಹರಿಸಿ ಅವರನ್ನು ಒತ್ತೆಯಾಳಾಗಿಟ್ಟುಕೊಂಡಿದ್ದನ್ನು ಮಾಜಿ ಫಿಲಿಪಿನೋ ಪೊಲೀಸ್ ಅಧಿಕಾರಿಯೊಬ್ಬರು ತಿಳಿಸಿದ್ದಾರೆ.

#### 4. ID 785 (difference 0.274)
- Source: Still, take advice from authorities, obey all signs, and pay close attention to safety warnings.
- Reference: ಅದರೂ, ಪ್ರಾಧಿಕಾರಗಳಿಂದ ಸಲಹೆ ಪಡೆಯಿರಿ, ಎಲ್ಲ ಚಿಹ್ನೆಗಳಿಗೆ ಬದ್ಧರಾಗಿ ಮತ್ತು ಸುರಕ್ಷತೆ ಎಚ್ಚರಿಕೆಗಳ ಬಗ್ಗೆ ಹೆಚ್ಚು ಗಮನ ಹರಿಸಿ.
- FP32: ಇನ್ನೂ ಅಧಿಕಾರಿಗಳಿಂದ ಸಲಹೆಯನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ - ಎಲ್ಲಾ ಚಿಹ್ನೆಗಳನ್ನು ಪಾಲಿಸಿ ಮತ್ತು ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆಗಳ ಬಗ್ಗೆ ಹೆಚ್ಚು ಗಮನ ಕೊಡಿ.
- INT8: ಇನ್ನೂ ಎಲ್ಲಾ ಚಿಹ್ನೆಗಳಿಗೆ ಬದ್ಧರಾಗಿರಿ ಮತ್ತು ಸುರಕ್ಷತಾ ಎಚ್ಚರಿಕೆಗಳ ಬಗ್ಗೆ ಹೆಚ್ಚು ಗಮನ ಕೊಡಿ.

#### 5. ID 850 (difference 0.248)
- Source: Downhill snowsports, which include skiing and snowboarding, are popular sports involving sliding down snow-covered terrain with skis or a snowboard attached to your feet.
- Reference: ಸ್ಕೀಯಿಂಗ್ ಮತ್ತು ಸ್ನೋ ಬೋರ್ಡಿಂಗ್ ಒಳಗೊಂಡ ಇಳಿಜಾರಿನ ಹಿಮ ಕ್ರೀಡೆಗಳು, ಸ್ಕೀ ಅಥವಾ ಸ್ನೋ ಬೋರ್ಡ್‍‌ ಅನ್ನು ಕಾಲಿಗೆ ಸಿಗಿಸಿಕೊಂಡು ಹಿಮಾಚ್ಚಾದಿತ ಬೆಟ್ಟಗಳಲ್ಲಿ ಜಾರುವಿಕೆ ಬಹಳ ಜನಪ್ರಿಯ ಕ್ರೀಡೆಗಳು.
- FP32: ಸ್ಕೀಯಿಂಗ್ ಮತ್ತು ಸ್ನೋಬೋರ್ಡಿಂಗ್ ಸೇರಿದಂತೆ ಕೆಳಭಾಗದ ಸ್ನೋಬೋರ್ಡಿಂಗ್ ಕ್ರೀಡೆಗಳು ಹಿಮದಿಂದ ಆವೃತವಾದ ಭೂಪ್ರದೇಶದಲ್ಲಿ ಸ್ಕೀ ಅಥವಾ ನಿಮ್ಮ ಪಾದಗಳಿಗೆ ಜೋಡಿಸಲಾದ ಸ್ನೋಬೋರ್ಡ್ ಅನ್ನು ಸ್ಲೈಡಿಂಗ್ ಮಾಡುವ ಜನಪ್ರಿಯ ಕ್ರೀಡೆಗಳಾಗಿವೆ.
- INT8: ಸ್ಕೀಯಿಂಗ್ ಮತ್ತು ಸ್ನೋಬೋರ್ಡಿಂಗ್ ಅನ್ನು ಒಳಗೊಂಡಿರುವ ಡೌನ್ಹಿಲ್ ಸ್ನೋಸ್ಪೋರ್ಟ್ಸ್ ಜನಪ್ರಿಯ ಕ್ರೀಡೆಗಳಾಗಿದ್ದು, ಹಿಮದಿಂದ ಆವೃತವಾದ ಭೂಪ್ರದೇಶದಲ್ಲಿ ಸ್ಕೀ ಅಥವಾ ನಿಮ್ಮ ಪಾದಗಳಿಗೆ ಜೋಡಿಸಲಾದ ಸ್ನೋಬೋರ್ಡ್ ಅನ್ನು ಸ್ಲೈಡಿಂಗ್ ಮಾಡುವುದನ್ನು ಒಳಗೊಂಡಿರುತ್ತದೆ.

### Tamil → English

#### 1. ID 990 (difference 0.483)
- Source: "சரியாக ஏற்பாடு செய்யப்பட்ட தோட்டத்திற்குள் சென்றால், ""மாதிரிகள்"" சேகரிப்பது வாக்குவாதம் இல்லாமல் உங்களை வெளியேற செய்கிறது."
- Reference: If visiting a formally arranged garden, collecting "specimens" is also going to get you ejected, without discussion.
- FP32: " Gathering specimens makes you leave without argument if you go into a well-organized garden. "
- INT8: " Going into a well-organized garden and collecting " " specimens " " makes you leave without argument. "

#### 2. ID 445 (difference 0.385)
- Source: பிரிட்டன் எந்தக் கப்பலும் கடலின் சில பகுதிகளில் நுழையாமல் தடுக்க, சர்வதேச நீர் வளங்களிலும் கண்ணி வெடிகளைப் புதைத்து, நடுநிலையான கப்பல்களுக்கும் அபாயத்தை ஏற்படுத்தியது.
- Reference: Britain mined international waters to prevent any ships from entering entire sections of ocean, causing danger to even neutral ships.
- FP32: Britain also buried mesh bombs in international water resources to prevent any ships from entering parts of the sea and to threaten neutral vessels.
- INT8: Britain also blocked any ships from entering parts of the sea and buried mesh bombs in international water resources, posing a risk to neutral vessels.

#### 3. ID 555 (difference 0.333)
- Source: தோராயமாக 10,000 ஆண்டுகளுக்கு முன் ஈரானின் ஜாகரோஸ் மலைகளில் முதன் முதலில் ஆடுகள், வீட்டு விலங்காக வளர்க்கப்பட்டதாக தெரிகிறது.
- Reference: Goats seem to have been first domesticated roughly 10,000 years ago in the Zagros Mountains of Iran.
- FP32: Goats appear to have been domesticated as domestic animals for the first time in the Zagros Mountains of Iran, approximately 10,000 years ago.
- INT8: It appears that sheep were first domesticated in the Zagros Mountains of Iran about 10,000 years ago.

#### 4. ID 685 (difference 0.292)
- Source: உண்மைக்கு நிகரான களப் பயணங்களின் மூலம் தொழில்நுட்பமானது  தீர்வு வழங்குகிறது. மாணவர்கள் அருங்காட்சியக கலைப்பொருட்களைப் பார்க்கலாம், ஒரு மீன் காட்சியகத்தைப் பார்வையிடலாம் அல்லது தங்கள் வகுப்பில் உட்கார்ந்துக்கொண்டே அழகான கலையைப் பாராட்டலாம்.
- Reference: Technology offers the solution with virtual field trips. Students can look at museum artifacts, visit an aquarium, or admire beautiful art while sitting with their class.
- FP32: Technology provides the solution through real-world field trips. Students can visit museum artifacts, visit an aquarium, or simply sit in their class and admire beautiful art.
- INT8: Technology provides the solution through fact-checking field trips. Students can visit museum artifacts. Visit a fish showroom or appreciate beautiful art while sitting in their class.

#### 5. ID 890 (difference 0.292)
- Source: நீருக்கு அடியில் இடவியல் காரணமாக, மீண்டும் திரும்பும் நீர் சில ஆழமான பிரிவுகளில் குவிந்துள்ளது, மேலும் ஆழமான இடத்தை நோக்கிய வேகமான அலை அங்கு உருவாகக்கூடும்.
- Reference: Due to the underwater topology the return flow is concentrated at a few deeper sections, and a fast current to deep water may form there.
- FP32: The backwater has accumulated in some deep sections due to the topology of the underwater and a fast wave towards the deep space may form there.
- INT8: Due to underwater topology, the recirculating water has accumulated in some deep sections and a fast wave towards the deep space may form there.

### Kannada → English

#### 1. ID 315 (difference 0.466)
- Source: ಲಿಗ್ಗಿನ್ಸ್ ತನ್ನ ತಂದೆಯ ಆದರ್ಶಗಳನ್ನೇ ಅನುಸರಿಸುವ ಮೂಲಕ ವೈದ್ಯಕೀಯ ವೃತ್ತಿಯನ್ನು ಪ್ರವೇಶಿಸಿದರು.
- Reference: Liggins followed in his father’s footsteps and entered a career in medicine.
- FP32: Liggins entered the medical profession following the ideals of her father.
- INT8: Liggins followed her father's ideals and entered the medical profession.

#### 2. ID 270 (difference 0.416)
- Source: 25 ವರ್ಷದ ನಿಕೋಲಸ್ ಆಲ್ಡೆನ್ ಮತ್ತು 21 ರ ಜಕಾರಿ ಕುಡ್ಡೆಬ್ಯಾಕ್ ಸಾವಿಗೀಡಾಗಿದ್ದು, ಕುಡ್ಡೆಬ್ಯಾಕ್ ವಾಹನವನ್ನು ಚಲಾಯಿಸುತ್ತಿದ್ದರು.
- Reference: The fatalities were Nicholas Alden, 25, and Zachary Cuddeback, 21. Cuddeback had been the driver.
- FP32: Nicholas Alden, 25, and Zachary Cuddeback, 21, were killed and Cuddeback was driving the vehicle.
- INT8: The deceased were identified as 25-year-old Nicholas Alden and 21-year-old Zachary Cuddeback, who was driving the vehicle.

#### 3. ID 545 (difference 0.408)
- Source: ಎರಡನೇ ಪ್ರಪಂಚ ಯುದ್ಧದಲ್ಲಿ ಜರ್ಮನಿ  ಇಬ್ಬರ ಶತ್ರುವಾಗಿದ್ದರಿಂದ ರಷ್ಯಾ ಮತ್ತು ಅಮೇರಿಕಾದ ನಡುವೆ ಸಹಕಾರ ಉಂಟುಮಾಡಿತು. ಯುದ್ಧ ಮುಗಿದಂತೆ, ವ್ಯವಸ್ಥೆ, ಪ್ರಕ್ರಿಯೆ ಮತ್ತು ಸಂಸ್ಕೃತಿಯ ನಡುವೆ ಘರ್ಷಣೆ ನಡೆದು ಆ ದೇಶಗಳ ನಡುವೆ ಬಿರುಕು ಮೂಡಿತು.
- Reference: Germany was a common enemy in World War 2, leading to cooperation between the USSR and USA. With the end of the war the clashes of system, process and culture led to the countries falling out.
- FP32: Germany's hostility to both in World War II led to cooperation between Russia and the United States. As the war ended, the system and culture clashed, and the countries became fractured.
- INT8: Germany was an enemy of both countries in World War II, which led to cooperation between Russia and the United States.

#### 4. ID 210 (difference 0.301)
- Source: ಹಾವರ್ಡ್ ಯುನಿವರ್ಸಿಟಿ ಆಸ್ಪತ್ರೆಯು ರೋಗಿಯನ್ನು ಸ್ಥಿರವಾದ ಸ್ಥಿತಿಯಲ್ಲಿ ದಾಖಲಿಸಲಾಗಿದೆ ಎಂದು ಹ್ಯಾಮಿಲ್ಟನ್ ದೃಢಪಡಿಸಿದ್ದಾರೆ.
- Reference: Hamilton confirmed Howard University Hospital admitted the patient in stable condition.
- FP32: Hamilton confirmed that the patient was admitted to Howard University Hospital in stable condition.
- INT8: Howard University Hospital confirmed that the patient was admitted in stable condition.

#### 5. ID 715 (difference 0.300)
- Source: ಗೋಮಾ ಸಾಕಷ್ಟು ಸುರಕ್ಷಿತವಾಗಿದ್ದರೂ, ಉತ್ತರ ಕಿವಿನಲ್ಲಿ ನಡೆಯುತ್ತಿರುವ ಹೋರಾಟವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಗೋಮಾದ ಹೊರಗಿನ ಯಾವುದೇ ಭೇಟಿಯನ್ನು ಅಧ್ಯಯನ ಮಾಡಬೇಕು.
- Reference: While Goma is reasonably safe, any visits outside of Goma should be researched to understand the state of the fighting that persists in the North Kivu province.
- FP32: Goma is fairly safe, but any visit outside Goma should be studied to understand the fighting in the North Kee.
- INT8: Any visit outside Goma should be studied to understand the ongoing fighting in the North Kee to understand if Goma is safe enough.

### Tamil → Kannada

#### 1. ID 190 (difference 0.790)
- Source: "பிரெஞ்சு ஓபராவில், கேமில் செயிண்ட்-சேன்ஸ் சொன்ன கதை, ஒரு கலைஞரின் ""போதைப்பொருள் மற்றும் ஜப்பான் மீதான அன்பினால் உருவான வாழ்க்கை."""
- Reference: ಕ್ಯಾಮಿಲ್ಲೆ ಸೇಂಟ್-ಸೇನ್ಸ್ ಅವರು ಫ್ರೆಂಚ್ ಒಪೆರಾದಲ್ಲಿ ಪ್ರಸ್ತುತಪಡಿಸಿದ ಕಥೆಯು ಒಬ್ಬ ಕಲಾವಿದನ ಕುರಿತಾದದ್ದು, "ಅವರ ಜೀವನವನ್ನು ಔಷಧಗಳು ಮತ್ತು ಜಪಾನ್ ಮೇಲಿನ ಪ್ರೀತಿಯಿಂದ ಪ್ರಸ್ತುತಪಡಿಸಲಾಗಿದೆ".
- FP32: " ಫ್ರೆಂಚ್ ಒಪೇರಾದಲ್ಲಿ ಸೇಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ - ಸೆಯಿಂಟ್ -
- INT8: " ಫ್ರೆಂಚ್ ಒಪೇರಾದಲ್ಲಿ ಸೇಂಟ್ - ಸೆಯಿಂಟ್ಸ್ ಮತ್ತು ಕ್ಯಾಮೆಲ್ನಲ್ಲಿ " ಜಪಾನಿನ ಬಗೆಗಿನ ಸಾಹಿತ್ಯ ಮತ್ತು ಪ್ರೀತಿಯಿಂದ ಸೃಷ್ಟಿಯಾದ ಒಬ್ಬ ಕಲಾವಿದನ ಜೀವನ ".

#### 2. ID 110 (difference 0.396)
- Source: அவர் இருந்த இடத்திலிருந்து 500 அடி தூரத்தில் இருந்த தனது கருப்பு ஓல்ட்ஸ்மொபைல் இண்ட்ரிக்கை நோக்கி அதிகாரிகளை அனுப்பினார்.
- Reference: ಆಕೆ 500 ಅಡಿ ದೂರದಲ್ಲಿರುವ ತನ್ನ ಕಪ್ಪು ಓಲ್ಡ್ಸ್‌ಮೊಬೈಲ್ ಒಳಸಂಚಿಗೆ ಅಧಿಕಾರಿಗಳನ್ನು ನಿರ್ದೇಶಿಸಿದಳು.
- FP32: ಅವನು ತನ್ನ ಕಪ್ಪು ಓಲ್ಡ್ಸ್ಮೊಬೈಲ್ ಅನ್ನು ತನ್ನ ಸ್ಥಳದಿಂದ 500 ಅಡಿ ದೂರದಲ್ಲಿರುವ ಇಂಟ್ರಿಕ್ಗೆ ಕಳುಹಿಸಿದನು.
- INT8: ಅವರು ತಮ್ಮ ಸ್ಥಳದಿಂದ 500 ಅಡಿ ದೂರದಲ್ಲಿರುವ ತಮ್ಮ ಕಪ್ಪು ಓಲ್ಡ್ಸ್ಮೊಬೈಲ್ ಇಂಟ್ರಿಕ್ಗೆ ಅಧಿಕಾರಿಗಳನ್ನು ಕಳುಹಿಸಿದರು.

#### 3. ID 60 (difference 0.365)
- Source: இறுதிச்சடங்கில் கலந்துகொள்வதற்கு நான்கு மில்லியனுக்கும் அதிகமான மக்கள் ரோம் சென்றனர்.
- Reference: ನಾಲ್ಕು ಮಿಲಿಯನ್‌ಗೂ ಹೆಚ್ಚು ಜನರು ಅಂತ್ಯಸಂಸ್ಕಾರಕ್ಕೆ ತೆರಳಿದ್ದರು.
- FP32: 40 ಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ಜನರು ಅಂತ್ಯಕ್ರಿಯೆಯಲ್ಲಿ ಭಾಗವಹಿಸಲು ರೋಮ್ಗೆ ಪ್ರಯಾಣಿಸಿದರು.
- INT8: ಅಂತ್ಯಕ್ರಿಯೆಯಲ್ಲಿ ಭಾಗವಹಿಸಲು ನಾಲ್ಕು ದಶಲಕ್ಷಕ್ಕೂ ಹೆಚ್ಚು ಜನರು ರೋಮ್ಗೆ ಪ್ರಯಾಣಿಸಿದರು.

#### 4. ID 950 (difference 0.349)
- Source: வழக்கமாக சின்ட்ராவுக்கு செல்லும் ஸ்காட்டர்ப் பேருந்து 403, கேபோ டா ரோகாவில் நிற்கிறது.
- Reference: ಸ್ಕಾಟ್‌ಬರ್ಗ್ ಬಸ್ 403 ನಿಯಮಿತವಾಗಿ ಸಿಂಟ್ರಾ ನಗರಕ್ಕೆ ಸಂಚರಿಸಲಿದ್ದು, ಕ್ಯಾಬೊ ಡಾ ರೋಕಾದಲ್ಲಿ ಮಾತ್ರ ಸ್ಟಾಪ್ ನೀಡುತ್ತದೆ.
- FP32: ಸಾಮಾನ್ಯವಾಗಿ ಸಿಂಟ್ರಾಗೆ ಹೋಗುವ ಸ್ಕಾಟರ್ಬ್ ಬಸ್ 403 ಮತ್ತು ಕ್ಯಾಬೊ ಡಾ ರೋಕಾದಲ್ಲಿ ನಿಲ್ಲುತ್ತದೆ.
- INT8: ಸ್ಕಾಟರ್ಬ್ ಬಸ್ 403 ಸಾಮಾನ್ಯವಾಗಿ ಸಿಂಡ್ರಾಗೆ ಹೋಗುತ್ತದೆ ಮತ್ತು ಕ್ಯಾಬೊ ಡಾ ರೋಕಾದಲ್ಲಿ ನಿಲ್ಲುತ್ತದೆ.

#### 5. ID 580 (difference 0.324)
- Source: உள் நஞ்சு உடனடியாக வெளிப்படையாகத் தெரியாமல் போகலாம். வாந்தி போன்ற அறிகுறிகள், உடனடியாக நோயறிதலை மேற்கொள்ள முடியாத அளவுக்கு பொதுவானவையாகும்.
- Reference: ಆಂತರಿಕ ವಿಷವು ತಕ್ಷಣವೇ ಗೋಚರಿಸುವುದಿಲ್ಲ. ವಾಂತಿ ಮುಂತಾದ ಲಕ್ಷಣಗಳು ಬಹಳ ಸಾಮಾನ್ಯವಾಗಿದ್ದು ತಕ್ಷಣ ರೋಗನಿರ್ಣಯ ಮಾಡಲಾಗುವುದಿಲ್ಲ.
- FP32: ಒಳಗಿನ ಹುಣ್ಣು ತಕ್ಷಣವೇ ಸ್ಪಷ್ಟವಾಗುವುದಿಲ್ಲ. ವಾಂತಿ ಮುಂತಾದ ರೋಗಲಕ್ಷಣಗಳು ತಕ್ಷಣದ ರೋಗನಿರ್ಣಯವನ್ನು ಮಾಡಲು ಸಾಧ್ಯವಾಗದಷ್ಟು ಸಾಮಾನ್ಯವಾಗಿರುತ್ತವೆ.
- INT8: ಒಳಗಿನ ಹುಣ್ಣು ತಕ್ಷಣವೇ ಕಾಣಿಸಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗುವುದಿಲ್ಲ. ವಾಂತಿಯಂತಹ ರೋಗಲಕ್ಷಣಗಳು ಅಷ್ಟು ಸಾಮಾನ್ಯವಾಗಿರುತ್ತವೆ, ಅಷ್ಟು ಬೇಗ ರೋಗನಿರ್ಣಯವನ್ನು ಮಾಡಲು ಸಾಧ್ಯವಾಗುವುದಿಲ್ಲ.

### Kannada → Tamil

#### 1. ID 690 (difference 0.603)
- Source: ಬ್ಲಾಗಿಂಗ್ "ವಿದ್ಯಾರ್ಥಿಗಳು ತಮ್ಮ ಸುತ್ತಲಿನ ಪ್ರಪಂಚದ ಬಗ್ಗೆ ಹೆಚ್ಚು ತಿಳಿದುಕೊಳ್ಳುವಂತೆ ಮಾಡುತ್ತದೆ." ಪ್ರೇಕ್ಷಕರ ಆಸಕ್ತಿಗೆ ಅನುಗುಣವಾಗಿ ವಿಷಯವನ್ನು ಪ್ರಸ್ತುತಪಡಿಸುವ ಅಗತ್ಯವು ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಬುದ್ಧಿವಂತ ಮತ್ತು ಆಸಕ್ತಿದಾಯಕವಾಗಿರಲು ಪ್ರೇರೇಪಿಸುತ್ತದೆ (ಟೊಟೊ, 2004).
- Reference: "மேலும் வலைப்பதிவுகள் ""மாணவர்களை அவர்களைச் சுற்றியுள்ள உலகத்தைப் பற்றி ஆர்வமுள்ளவர்களாக ஆக்குகிறது. "" வாசிப்பவர்களின் ஆர்வத்துக்கு உணவளிக்க வேண்டும் என்ற கருத்து அவர்களைப் புத்திசாலித்தனமாகவும் சுவாரசியமாகவும் ஆகத் தூண்டுகிறது. (டொட்டோ, 2004). "
- FP32: வலைப்பதிவுகள் " மாணவர்களை தங்கள் சுற்றுப்புறத்தின் உலகத்தைப் பற்றி மேலும் அறிய வைக்கிறது... பார்வையாளர்களின் ஆர்வத்திற்கு ஏற்ப உள்ளடக்கத்தை வழங்க வேண்டியதன் அவசியம் மாணவர்களை புத்திசாலித்தனமாகவும் சுவாரஸ்யமாகவும் இருக்க ஊக்குவிக்கிறது ( படம் 2004 ).
- INT8: வலைப்பதிவுகள் " மாணவர்களை தங்கள் சுற்றுப்புறத்தின் உலகத்தைப் பற்றி மேலும் அறிய வைக்கும்................................................................................................................

#### 2. ID 150 (difference 0.522)
- Source: ಅಪಘಾತ ಸ್ಥಳದ ಹುಡುಕಾಟದ ಪ್ರಯತ್ನಕ್ಕೆ ಕೆಟ್ಟ ಹವಾಮಾನ ಮತ್ತು ಕಡಿದಾದ ಪರ್ವತ ಅಡ್ಡಿಯಾಯಿತು.
- Reference: விபத்து நடந்த தளத்தைத் தேடுவதற்கான முயற்சிகள், மோசமான வானிலை மற்றும் கடுமையான நிலப்பரப்பால் தடைபடுகின்றன.
- FP32: மோசமான வானிலை மற்றும் செங்குத்தான மலை விபத்து நடந்த இடத்தைத் தேடுவதற்கான முயற்சியில் இடையூறு விளைவித்தது.
- INT8: விபத்துக்குள்ளான இடத்தை தேடுவதற்கான முயற்சியில் மோசமான வானிலை மற்றும் செங்குத்தான மலை இடையூறு ஏற்பட்டது.

#### 3. ID 625 (difference 0.494)
- Source: ಇದು ಸಂವೇದನಾಶೀಲವಾಗಿದೆ ಎಂದು ತೋರುತ್ತದೆ, ಏಕೆಂದರೆ ಭೂಮಿಯು ಚಲಿಸುತ್ತಿದೆಯೆಂದು ಅದು ಭಾವಿಸುವುದಿಲ್ಲ, ಅಲ್ಲವೇ?
- Reference: இது விவேகமானதாகத் தோன்றுகிறது, ஏனென்றால் பூமி நகர்வதைப் போல உணரவில்லை, இல்லையா?
- FP32: பூமி நகர்வதாக அது நினைக்கவில்லை அல்லது இல்லை என்பதால் இது உணர்திறன் மிக்கதாகத் தெரிகிறது.
- INT8: இது உணர்திறன் மிக்கதாகத் தெரிகிறது, ஏனெனில் பூமி நகர்வதாக அது நினைக்கவில்லை அல்லது இல்லை.

#### 4. ID 365 (difference 0.453)
- Source: ಸಹೋದರಿಯರು  ಮತ್ತು ಪುತ್ರಿಯರ ಅತಿ ದೊಡ್ಡ ಕುಟುಂಬವಾಗಿರುವುದರಿಂದ ಹೆಣ್ಣುಗಳಲ್ಲಿ  ಹತ್ತಿರದ ಸಂಬಂಧವಿರುತ್ತದೆ.
- Reference: பெரிய குடும்பத்துக்குள் உள்ள சகோதரிகள் மற்றும் மகள்கள் பெண்கள் என பொதுவாக ஒருவருக்கொருவர் நெருக்கமாக தொடர்புடையவர்கள்.
- FP32: பெண்கள் நெருங்கிய உறவைக் கொண்டுள்ளனர், ஏனெனில் அவர்கள் சகோதரிகள் மற்றும் மகள்களின் மிகப்பெரிய குடும்பமாக உள்ளனர்.
- INT8: சகோதரிகள் மற்றும் மகள்களின் மிகப்பெரிய குடும்பமாக இருப்பதால் பெண்கள் நெருங்கிய உறவைக் கொண்டுள்ளனர்.

#### 5. ID 885 (difference 0.357)
- Source: ಲಿಂಗವನ್ನು ಹೇಳದ (X) ಅಥವಾ ಅಪೇಕ್ಷಿತ ಹೆಸರು ಮತ್ತು ಲಿಂಗಕ್ಕೆ ಹೊಂದಿಕೆಯಾಗುವಂತೆ ನವೀಕರಿಸಿದ ದಾಖಲೆಗಳೊಂದಿಗೆ ಪಾಸ್‌ಪೋರ್ಟ್‌ಗಳನ್ನು ನೀಡಲು ಸರ್ಕಾರಗಳ ಇಚ್ಚೆಯಂತೆ ಬದಲಾಗುತ್ತದೆ.
- Reference: பாலினம் குறிப்பிடப்படாத (X) பாஸ்போர்ட்களை வழங்கிட அல்லது விரும்பும் ஒரு பெயர் அல்லது பாலினம் பொருந்திட ஆவணங்களை  நிகழ்நிலைப்படுத்திட அரசுகளின் விருப்பங்கள் மாறுபடுகிறது.
- FP32: பாலினத்தை குறிப்பிடாத ( எக்ஸ் ) பாஸ்போர்ட்டுகளை வழங்குவதற்கான அரசாங்கங்களின் விருப்பப்படி அல்லது விரும்பிய பெயர் மற்றும் பாலினத்துடன் பொருந்தக்கூடிய புதுப்பிக்கப்பட்ட ஆவணங்களுடன் மாறுபடும்.
- INT8: பாலினம் ( எக்ஸ் ) அல்லது விரும்பிய பெயர் மற்றும் பாலினத்துடன் பொருந்தக்கூடிய புதுப்பிக்கப்பட்ட ஆவணங்களுடன் பாஸ்போர்ட்டுகளை வழங்குவதற்கான அரசாங்கங்களின் விருப்பம் மாறுபடும்.

## Errors and limitations

- Browser smoke passed 6/6; no browser console errors or external origins were recorded. The full benchmark completed all six 202-item directions (1,212/1,212 successful).
- Scoring emitted SacreBLEU warnings that 100 lines ended in a tokenized period in several corpus calls. Both variants were scored consistently with the same settings.
- Renderer RSS aggregates this benchmark’s Chromium renderer process(es), sampled after first load per family. It is environment-specific and not a phone RAM estimate.
- Wrong-script and repetition-loop counts are heuristic and do not replace human review.
- Phone memory feasibility cannot be established from desktop browser usage; runtime, tokenizer, activations, decoder cache, and OS/app overhead all affect actual phone RAM.
