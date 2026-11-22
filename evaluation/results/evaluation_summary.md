# TriLingua Stage 5.3 Pilot Evaluation

Local ONNX pilot: 25 sentences per direction, 150 total translation attempts.

| Translation direction | Sentences | Successful | Failed | BLEU | chrF++ |
|---|---:|---:|---:|---:|---:|
| English → Tamil | 25 | 25 | 0 | 22.6493 | 56.8682 |
| English → Kannada | 25 | 25 | 0 | 22.0074 | 55.7205 |
| Tamil → English | 25 | 25 | 0 | 39.2472 | 63.0370 |
| Kannada → English | 25 | 25 | 0 | 35.6856 | 63.7808 |
| Tamil → Kannada | 25 | 25 | 0 | 17.0990 | 48.1127 |
| Kannada → Tamil | 25 | 25 | 0 | 17.4881 | 51.4541 |

**Macro-average BLEU:** 25.6961
**Macro-average chrF++:** 56.4956

SacreBLEU: 2.6.0. English uses `13a`; Tamil/Kannada use Indic NLP `IndicNormalizerFactory` plus `trivial_tokenize`, applied to candidates and references. This 25-sentence pilot checks pipeline integrity and is not sufficient to establish final model performance.

## English → Tamil examples

### Example 1 (ID 1)
- Source: "We now have 4-month-old mice that are non-diabetic that used to be diabetic," he added.
- Reference: """எங்களிடம் இப்போது  4-மாத-வயதுடைய எலி ஒன்று உள்ளது, முன்னர் அதற்கு நீரிழிவு இருந்தது தற்போது இல்லை"" என்று அவர் மேலும் கூறினார்."
- Prediction: " இப்போது நம்மிடம் 4 மாத எலிகள் உள்ளன, அவை நீரிழிவு அல்லாதவை, அவை முன்பு நீரிழிவு நோயால் பாதிக்கப்பட்டவை " என்று அவர் மேலும் கூறினார்.

### Example 2 (ID 2)
- Source: Dr. Ehud Ur, professor of medicine at Dalhousie University in Halifax, Nova Scotia and chair of the clinical and scientific division of the Canadian Diabetes Association cautioned that the research is still in its early days.
- Reference: ஹாலிஃபாக்ஸில் உள்ள டல்ஹெளசி பல்கலைக்கழகத்தின் மருத்துவப் பேராசிரியரும், நோவா ஸ்கோட்டியா மற்றும் கனேடிய நீரிழிவு சங்கத்தின் மருத்துவ மற்றும் அறிவியல் பிரிவின் தலைவருமான டாக்டர் இஹுத் உர், ஆராய்ச்சி இன்னும் ஆரம்ப நாட்களில்தான் உள்ளது என்று எச்சரித்துள்ளார்.
- Prediction: ஹாலிஃபாக்ஸ் நோவா ஸ்கோடியாவில் உள்ள டல்ஹெளசி பல்கலைக்கழகத்தின் மருத்துவப் பேராசிரியரும், கனேடிய நீரிழிவு சங்கத்தின் மருத்துவ மற்றும் அறிவியல் பிரிவின் தலைவருமான டாக்டர் எஹுத் உர், ஆராய்ச்சி இன்னும் அதன் ஆரம்ப நாட்களில் இருப்பதாக எச்சரித்தார்.

### Example 3 (ID 3)
- Source: Like some other experts, he is skeptical about whether diabetes can be cured, noting that these findings have no relevance to people who already have Type 1 diabetes.
- Reference: பிற வல்லுனர்கள் போலவே அவரும், ஏற்கனவே டைப் 1 இரத்த சர்க்கரை நோயுள்ளவர்களுக்கு இந்த கண்டுபிடிப்புகள் பொருந்தவில்லை என்பதால் இரத்த சர்க்கரை நோயிற்கு நிவாரணம் உள்ளதா என்பது குறித்து சந்தேகமடைகிறார்.
- Prediction: வேறு சில நிபுணர்களைப் போலவே, நீரிழிவு நோயைக் குணப்படுத்த முடியுமா என்பதில் அவருக்கு சந்தேகம் உள்ளது, இந்த கண்டுபிடிப்புகள் ஏற்கனவே வகை 1 நீரிழிவு நோயால் பாதிக்கப்பட்டவர்களுக்கு எந்த தொடர்பும் இல்லை என்பதைக் குறிப்பிடுகிறது.

## English → Kannada examples

### Example 1 (ID 1)
- Source: "We now have 4-month-old mice that are non-diabetic that used to be diabetic," he added.
- Reference: " ಈ ಮೊದಲು ಡಯಾಬೆಟಿಕ್ ಆಗಿದ್ದ ಆದರೆ ಈಗ  ಡಯಾಬೆಟಿಕ್ ಅಲ್ಲದ 4 ತಿಂಗಳ ಇಲಿಗಳು ನಮ್ಮ  ಬಳಿ ಇವೆ," ಎಂದು ಅವನು ಹೇಳಿದ.
- Prediction: " ಈಗ ನಮ್ಮಲ್ಲಿ 4 ತಿಂಗಳ ಇಲಿಗಳಿವೆ, ಅವು ಮಧುಮೇಹವಲ್ಲದವು, ಅವು ಮಧುಮೇಹದಿಂದ ಬಳಲುತ್ತಿದ್ದವು " ಎಂದು ಅವರು ಹೇಳಿದರು.

### Example 2 (ID 2)
- Source: Dr. Ehud Ur, professor of medicine at Dalhousie University in Halifax, Nova Scotia and chair of the clinical and scientific division of the Canadian Diabetes Association cautioned that the research is still in its early days.
- Reference: ನೋವಾ ಸ್ಕಾಟಿಯಾದ ಹ್ಯಾಲಿಫ್ಯಾಕ್ಸ್‌ನ ಡಾಲ್‌ಹೌಸಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ವೈದ್ಯಕೀಯ ಪ್ರಾಧ್ಯಾಪಕ ಮತ್ತು ಕೆನಡಿಯನ್ ಡಯಾಬಿಟಿಸ್ ಅಸೋಸಿಯೇಷನ್‌ನ ಕ್ಲಿನಿಕಲ್ ಮತ್ತು ವೈಜ್ಞಾನಿಕ ವಿಭಾಗದ ಅಧ್ಯಕ್ಷರಾದ ಡಾ. ಎಹುದ್ ಉರ್ ಅವರು ಸಂಶೋಧನೆಯು ಇನ್ನೂ ಆರಂಭಿಕ ದಿನಗಳಲ್ಲಿದೆ ಎಂದು ಮಾರ್ಮಿಕವಾಗಿ ಎಚ್ಚರಿಸಿದ್ದಾರೆ.
- Prediction: ಹ್ಯಾಲಿಫ್ಯಾಕ್ಸ್ನಲ್ಲಿರುವ ಡಾಲ್ಹೌಸಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ವೈದ್ಯಕೀಯ ಪ್ರಾಧ್ಯಾಪಕರಾದ ಮತ್ತು ಕೆನಡಿಯನ್ ಡಯಾಬಿಟಿಸ್ ಅಸೋಸಿಯೇಷನ್ನ ಕ್ಲಿನಿಕಲ್ ಮತ್ತು ವೈಜ್ಞಾನಿಕ ವಿಭಾಗದ ಅಧ್ಯಕ್ಷರಾದ ಡಾ. ಎಹುದ್ ಉರ್ ಅವರು ಈ ಸಂಶೋಧನೆಯು ಇನ್ನೂ ಆರಂಭಿಕ ಹಂತದಲ್ಲಿದೆ ಎಂದು ಎಚ್ಚರಿಸಿದ್ದಾರೆ.

### Example 3 (ID 3)
- Source: Like some other experts, he is skeptical about whether diabetes can be cured, noting that these findings have no relevance to people who already have Type 1 diabetes.
- Reference: ಮಧುಮೇಹವನ್ನು ಗುಣಪಡಿಸಲು ಸಾಧ್ಯವೇ ಎಂಬ ಬಗ್ಗೆ ಇತರೆ ಇತರ ಕೆಲವು ತಜ್ಞರಂತೆ ಅವರು ಕೂಡ ಸಂಶಯ ವ್ಯಕ್ತಪಡಿಸುತ್ತಾರೆ, ಈ ಸಂಶೋಧನೆಗಳು ಈಗಾಗಲೇ ಟೈಪ್ 1 ಮಧುಮೇಹ ಹೊಂದಿರುವ ಜನರಿಗೆ ಯಾವುದೇ ಪ್ರಯೋಜನಗಳನ್ನು ನೀಡಿಲ್ಲ.
- Prediction: ಇತರ ಕೆಲವು ತಜ್ಞರಂತೆ, ಮಧುಮೇಹವನ್ನು ಗುಣಪಡಿಸಬಹುದೇ ಎಂಬುದರ ಬಗ್ಗೆ ಆತನಿಗೆ ಸಂಶಯವಿದೆ, ಈ ಸಂಶೋಧನೆಗಳು ಈಗಾಗಲೇ ಟೈಪ್ 1 ಮಧುಮೇಹ ಹೊಂದಿರುವ ಜನರಿಗೆ ಯಾವುದೇ ಪ್ರಸ್ತುತತೆಯನ್ನು ಹೊಂದಿಲ್ಲ ಎಂದು ಗಮನಿಸುತ್ತಾರೆ.

## Tamil → English examples

### Example 1 (ID 1)
- Source: """எங்களிடம் இப்போது  4-மாத-வயதுடைய எலி ஒன்று உள்ளது, முன்னர் அதற்கு நீரிழிவு இருந்தது தற்போது இல்லை"" என்று அவர் மேலும் கூறினார்."
- Reference: "We now have 4-month-old mice that are non-diabetic that used to be diabetic," he added.
- Prediction: " We now have a 4-month-old rat that was previously diabetic and is no longer, " he added.

### Example 2 (ID 2)
- Source: ஹாலிஃபாக்ஸில் உள்ள டல்ஹெளசி பல்கலைக்கழகத்தின் மருத்துவப் பேராசிரியரும், நோவா ஸ்கோட்டியா மற்றும் கனேடிய நீரிழிவு சங்கத்தின் மருத்துவ மற்றும் அறிவியல் பிரிவின் தலைவருமான டாக்டர் இஹுத் உர், ஆராய்ச்சி இன்னும் ஆரம்ப நாட்களில்தான் உள்ளது என்று எச்சரித்துள்ளார்.
- Reference: Dr. Ehud Ur, professor of medicine at Dalhousie University in Halifax, Nova Scotia and chair of the clinical and scientific division of the Canadian Diabetes Association cautioned that the research is still in its early days.
- Prediction: Dr. Yehud Ur, a professor of medicine at Dalhousie University in Halifax and head of the medical and science division at the Nova Scotia and Canadian Diabetes Association, warns that the research is still in its early days.

### Example 3 (ID 3)
- Source: பிற வல்லுனர்கள் போலவே அவரும், ஏற்கனவே டைப் 1 இரத்த சர்க்கரை நோயுள்ளவர்களுக்கு இந்த கண்டுபிடிப்புகள் பொருந்தவில்லை என்பதால் இரத்த சர்க்கரை நோயிற்கு நிவாரணம் உள்ளதா என்பது குறித்து சந்தேகமடைகிறார்.
- Reference: Like some other experts, he is skeptical about whether diabetes can be cured, noting that these findings have no relevance to people who already have Type 1 diabetes.
- Prediction: Like other experts, he is skeptical about whether there is a cure for hypertension because the findings do not apply to people with type 1 hypertension already.

## Kannada → English examples

### Example 1 (ID 1)
- Source: " ಈ ಮೊದಲು ಡಯಾಬೆಟಿಕ್ ಆಗಿದ್ದ ಆದರೆ ಈಗ  ಡಯಾಬೆಟಿಕ್ ಅಲ್ಲದ 4 ತಿಂಗಳ ಇಲಿಗಳು ನಮ್ಮ  ಬಳಿ ಇವೆ," ಎಂದು ಅವನು ಹೇಳಿದ.
- Reference: "We now have 4-month-old mice that are non-diabetic that used to be diabetic," he added.
- Prediction: " We have 4 month old mice who were diabetic earlier but are now non-diabetic, " he said.

### Example 2 (ID 2)
- Source: ನೋವಾ ಸ್ಕಾಟಿಯಾದ ಹ್ಯಾಲಿಫ್ಯಾಕ್ಸ್‌ನ ಡಾಲ್‌ಹೌಸಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ವೈದ್ಯಕೀಯ ಪ್ರಾಧ್ಯಾಪಕ ಮತ್ತು ಕೆನಡಿಯನ್ ಡಯಾಬಿಟಿಸ್ ಅಸೋಸಿಯೇಷನ್‌ನ ಕ್ಲಿನಿಕಲ್ ಮತ್ತು ವೈಜ್ಞಾನಿಕ ವಿಭಾಗದ ಅಧ್ಯಕ್ಷರಾದ ಡಾ. ಎಹುದ್ ಉರ್ ಅವರು ಸಂಶೋಧನೆಯು ಇನ್ನೂ ಆರಂಭಿಕ ದಿನಗಳಲ್ಲಿದೆ ಎಂದು ಮಾರ್ಮಿಕವಾಗಿ ಎಚ್ಚರಿಸಿದ್ದಾರೆ.
- Reference: Dr. Ehud Ur, professor of medicine at Dalhousie University in Halifax, Nova Scotia and chair of the clinical and scientific division of the Canadian Diabetes Association cautioned that the research is still in its early days.
- Prediction: Dr. Ehud Ur, a medical professor at Dalhousie University in Halifax, Nova Scotia, and president of the Clinical and Scientific Division of the Canadian Diabetes Association, poignantly warns that the research is still in its early days.

### Example 3 (ID 3)
- Source: ಮಧುಮೇಹವನ್ನು ಗುಣಪಡಿಸಲು ಸಾಧ್ಯವೇ ಎಂಬ ಬಗ್ಗೆ ಇತರೆ ಇತರ ಕೆಲವು ತಜ್ಞರಂತೆ ಅವರು ಕೂಡ ಸಂಶಯ ವ್ಯಕ್ತಪಡಿಸುತ್ತಾರೆ, ಈ ಸಂಶೋಧನೆಗಳು ಈಗಾಗಲೇ ಟೈಪ್ 1 ಮಧುಮೇಹ ಹೊಂದಿರುವ ಜನರಿಗೆ ಯಾವುದೇ ಪ್ರಯೋಜನಗಳನ್ನು ನೀಡಿಲ್ಲ.
- Reference: Like some other experts, he is skeptical about whether diabetes can be cured, noting that these findings have no relevance to people who already have Type 1 diabetes.
- Prediction: Like some other experts, they are skeptical about whether diabetes can be cured ; these findings have not already shown any benefits for people with type 1 diabetes.

## Tamil → Kannada examples

### Example 1 (ID 1)
- Source: """எங்களிடம் இப்போது  4-மாத-வயதுடைய எலி ஒன்று உள்ளது, முன்னர் அதற்கு நீரிழிவு இருந்தது தற்போது இல்லை"" என்று அவர் மேலும் கூறினார்."
- Reference: " ಈ ಮೊದಲು ಡಯಾಬೆಟಿಕ್ ಆಗಿದ್ದ ಆದರೆ ಈಗ  ಡಯಾಬೆಟಿಕ್ ಅಲ್ಲದ 4 ತಿಂಗಳ ಇಲಿಗಳು ನಮ್ಮ  ಬಳಿ ಇವೆ," ಎಂದು ಅವನು ಹೇಳಿದ.
- Prediction: " ಈಗ ನಮ್ಮಲ್ಲಿ ೪ ತಿಂಗಳ ಎಲೆಯೊಂದು ಇದೆ, ಅದು ಮಧುಮೇಹದಿಂದ ಬಳಲುತ್ತಿದೆ, ಈಗ ಇಲ್ಲ " ಎಂದು ಅವರು ಹೇಳಿದರು.

### Example 2 (ID 2)
- Source: ஹாலிஃபாக்ஸில் உள்ள டல்ஹெளசி பல்கலைக்கழகத்தின் மருத்துவப் பேராசிரியரும், நோவா ஸ்கோட்டியா மற்றும் கனேடிய நீரிழிவு சங்கத்தின் மருத்துவ மற்றும் அறிவியல் பிரிவின் தலைவருமான டாக்டர் இஹுத் உர், ஆராய்ச்சி இன்னும் ஆரம்ப நாட்களில்தான் உள்ளது என்று எச்சரித்துள்ளார்.
- Reference: ನೋವಾ ಸ್ಕಾಟಿಯಾದ ಹ್ಯಾಲಿಫ್ಯಾಕ್ಸ್‌ನ ಡಾಲ್‌ಹೌಸಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ವೈದ್ಯಕೀಯ ಪ್ರಾಧ್ಯಾಪಕ ಮತ್ತು ಕೆನಡಿಯನ್ ಡಯಾಬಿಟಿಸ್ ಅಸೋಸಿಯೇಷನ್‌ನ ಕ್ಲಿನಿಕಲ್ ಮತ್ತು ವೈಜ್ಞಾನಿಕ ವಿಭಾಗದ ಅಧ್ಯಕ್ಷರಾದ ಡಾ. ಎಹುದ್ ಉರ್ ಅವರು ಸಂಶೋಧನೆಯು ಇನ್ನೂ ಆರಂಭಿಕ ದಿನಗಳಲ್ಲಿದೆ ಎಂದು ಮಾರ್ಮಿಕವಾಗಿ ಎಚ್ಚರಿಸಿದ್ದಾರೆ.
- Prediction: ಹಾಲಿಫ್ಯಾಕ್ಸ್ನಲ್ಲಿರುವ ಡಲ್ಹೆಲೆಸಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ವೈದ್ಯಕೀಯ ಪ್ರಾಧ್ಯಾಪಕರಾದ ಡಾ. ಜುಯಿತ್ ಉರ್, ನೋವಾ ಸ್ಕೋಟಿಯಾ ಮತ್ತು ಕೆನಡಿಯನ್ ಡಯಾಬಿಟಿಸ್ ಸೊಸೈಟಿಯ ವೈದ್ಯಕೀಯ ಮತ್ತು ವಿಜ್ಞಾನ ವಿಭಾಗದ ಅಧ್ಯಕ್ಷರಾದರು, ಸಂಶೋಧನೆಯು ಇನ್ನೂ ಆರಂಭಿಕ ಹಂತದಲ್ಲಿದೆ ಎಂದು ಎಚ್ಚರಿಸಿದ್ದಾರೆ.

### Example 3 (ID 3)
- Source: பிற வல்லுனர்கள் போலவே அவரும், ஏற்கனவே டைப் 1 இரத்த சர்க்கரை நோயுள்ளவர்களுக்கு இந்த கண்டுபிடிப்புகள் பொருந்தவில்லை என்பதால் இரத்த சர்க்கரை நோயிற்கு நிவாரணம் உள்ளதா என்பது குறித்து சந்தேகமடைகிறார்.
- Reference: ಮಧುಮೇಹವನ್ನು ಗುಣಪಡಿಸಲು ಸಾಧ್ಯವೇ ಎಂಬ ಬಗ್ಗೆ ಇತರೆ ಇತರ ಕೆಲವು ತಜ್ಞರಂತೆ ಅವರು ಕೂಡ ಸಂಶಯ ವ್ಯಕ್ತಪಡಿಸುತ್ತಾರೆ, ಈ ಸಂಶೋಧನೆಗಳು ಈಗಾಗಲೇ ಟೈಪ್ 1 ಮಧುಮೇಹ ಹೊಂದಿರುವ ಜನರಿಗೆ ಯಾವುದೇ ಪ್ರಯೋಜನಗಳನ್ನು ನೀಡಿಲ್ಲ.
- Prediction: ಇತರ ತಜ್ಞರಂತೆ, ಈ ಸಂಶೋಧನೆಗಳು ಈಗಾಗಲೇ ಟೈಪ್ 1 ಮಧುಮೇಹ ಹೊಂದಿರುವವರಿಗೆ ಅನ್ವಯಿಸುವುದಿಲ್ಲವಾದ್ದರಿಂದ, ರಕ್ತದಲ್ಲಿನ ಸಕ್ಕರೆ ಉಪಶಮನವಿದೆಯೇ ಎಂದು ಆತ ಅನುಮಾನಿಸುತ್ತಾನೆ.

## Kannada → Tamil examples

### Example 1 (ID 1)
- Source: " ಈ ಮೊದಲು ಡಯಾಬೆಟಿಕ್ ಆಗಿದ್ದ ಆದರೆ ಈಗ  ಡಯಾಬೆಟಿಕ್ ಅಲ್ಲದ 4 ತಿಂಗಳ ಇಲಿಗಳು ನಮ್ಮ  ಬಳಿ ಇವೆ," ಎಂದು ಅವನು ಹೇಳಿದ.
- Reference: """எங்களிடம் இப்போது  4-மாத-வயதுடைய எலி ஒன்று உள்ளது, முன்னர் அதற்கு நீரிழிவு இருந்தது தற்போது இல்லை"" என்று அவர் மேலும் கூறினார்."
- Prediction: " முன்பு நீரிழிவு நோயால் பாதிக்கப்பட்டிருந்த 4 மாத எலிகள் இப்போது நீரிழிவு நோயால் பாதிக்கப்படாதவை " என்று அவர் கூறினார்.

### Example 2 (ID 2)
- Source: ನೋವಾ ಸ್ಕಾಟಿಯಾದ ಹ್ಯಾಲಿಫ್ಯಾಕ್ಸ್‌ನ ಡಾಲ್‌ಹೌಸಿ ವಿಶ್ವವಿದ್ಯಾಲಯದ ವೈದ್ಯಕೀಯ ಪ್ರಾಧ್ಯಾಪಕ ಮತ್ತು ಕೆನಡಿಯನ್ ಡಯಾಬಿಟಿಸ್ ಅಸೋಸಿಯೇಷನ್‌ನ ಕ್ಲಿನಿಕಲ್ ಮತ್ತು ವೈಜ್ಞಾನಿಕ ವಿಭಾಗದ ಅಧ್ಯಕ್ಷರಾದ ಡಾ. ಎಹುದ್ ಉರ್ ಅವರು ಸಂಶೋಧನೆಯು ಇನ್ನೂ ಆರಂಭಿಕ ದಿನಗಳಲ್ಲಿದೆ ಎಂದು ಮಾರ್ಮಿಕವಾಗಿ ಎಚ್ಚರಿಸಿದ್ದಾರೆ.
- Reference: ஹாலிஃபாக்ஸில் உள்ள டல்ஹெளசி பல்கலைக்கழகத்தின் மருத்துவப் பேராசிரியரும், நோவா ஸ்கோட்டியா மற்றும் கனேடிய நீரிழிவு சங்கத்தின் மருத்துவ மற்றும் அறிவியல் பிரிவின் தலைவருமான டாக்டர் இஹுத் உர், ஆராய்ச்சி இன்னும் ஆரம்ப நாட்களில்தான் உள்ளது என்று எச்சரித்துள்ளார்.
- Prediction: நோவா ஸ்காடியாவின் ஹாலிஃபாக்ஸில் உள்ள டால் ஹவுசி பல்கலைக்கழகத்தின் மருத்துவ பேராசிரியரும், கனேடிய நீரிழிவு சங்கத்தின் மருத்துவ மற்றும் அறிவியல் பிரிவின் தலைவருமான டாக்டர் எஹுத் உர், ஆராய்ச்சி இன்னும் ஆரம்ப நாட்களில் இருப்பதாக மனப்பூர்வமாக எச்சரித்துள்ளார்.

### Example 3 (ID 3)
- Source: ಮಧುಮೇಹವನ್ನು ಗುಣಪಡಿಸಲು ಸಾಧ್ಯವೇ ಎಂಬ ಬಗ್ಗೆ ಇತರೆ ಇತರ ಕೆಲವು ತಜ್ಞರಂತೆ ಅವರು ಕೂಡ ಸಂಶಯ ವ್ಯಕ್ತಪಡಿಸುತ್ತಾರೆ, ಈ ಸಂಶೋಧನೆಗಳು ಈಗಾಗಲೇ ಟೈಪ್ 1 ಮಧುಮೇಹ ಹೊಂದಿರುವ ಜನರಿಗೆ ಯಾವುದೇ ಪ್ರಯೋಜನಗಳನ್ನು ನೀಡಿಲ್ಲ.
- Reference: பிற வல்லுனர்கள் போலவே அவரும், ஏற்கனவே டைப் 1 இரத்த சர்க்கரை நோயுள்ளவர்களுக்கு இந்த கண்டுபிடிப்புகள் பொருந்தவில்லை என்பதால் இரத்த சர்க்கரை நோயிற்கு நிவாரணம் உள்ளதா என்பது குறித்து சந்தேகமடைகிறார்.
- Prediction: நீரிழிவு நோயை குணப்படுத்த முடியுமா என்று மற்ற சில நிபுணர்களைப் போலவே அவர்களும் சந்தேகம் கொண்டுள்ளனர், மேலும் இந்த கண்டுபிடிப்புகள் ஏற்கனவே வகை 1 நீரிழிவு நோயாளிகளுக்கு எந்த நன்மைகளையும் வழங்கவில்லை.
