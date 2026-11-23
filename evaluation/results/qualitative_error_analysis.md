# Qualitative Translation Error Analysis

## Introduction

This report qualitatively reviews the actual 6,072 full-benchmark predictions. It complements the Stage 6.2 metric results rather than recalculating or changing them.

The full benchmark macro results are BLEU **20.759961** and chrF++ **52.203931**, with **6,072** successful records and **0** failed predictions.

## Methodology

- Compared source, reference, and prediction JSONL records for all six full-benchmark directions.
- Reviewed the opening records of each direction, several representative medical, legal, technical, sports, and named-entity passages, and the lowest sentence-BLEU examples identified from the complete corpora.
- Did not treat wording differences from the reference as errors when the prediction preserved the source meaning.
- Did not use the reference as the only source of truth; the source text was the primary check for semantic correctness.
- Error categories below describe representative findings, not exhaustive 6,072-record manual annotation. Where an automated surface pattern is reported, it is identified separately from inferred semantic accuracy.

## Error Categories and Counts

| Direction | Repeated 5-token sequences | Entity placeholders or encoded-ID artifacts | Mojibake markers |
|---|---:|---:|---:|
| eng_Latn -> tam_Taml | 3 | 0 | 1 |
| eng_Latn -> kan_Knda | 2 | 0 | 1 |
| tam_Taml -> eng_Latn | 4 | 0 | 0 |
| kan_Knda -> eng_Latn | 4 | 9 | 0 |
| tam_Taml -> kan_Knda | 6 | 0 | 0 |
| kan_Knda -> tam_Taml | 2 | 0 | 0 |

Counts cover obvious repeated sequences and malformed surface artifacts detectable directly in predictions. They are not estimates of all grammatical or semantic errors.

## eng_Latn to tam_Taml

### Accurate translation

- **ID 14:** The USA Gymnastics and Olympic Committee passage is preserved closely, including its meaning about a safe environment for athletes.
- **ID 11:** The Ebola passage correctly states that one experimental vaccine appears promising while no existing drug has been clearly shown suitable for the infection.

### Representative issues

- **ID 659 - missing and awkward wording**
  - Source: "One end of the spectrum is trying to remain one of the guys (or gals)."
  - Prediction: "ஸ்பெக்ட்ரமின் ஒரு முனை தோழர்களில் ஒருவராக இருக்க முயற்சிக்கிறது."
  - The prediction keeps the general idea but drops the gender-neutral "(or gals)" detail and leaves "spectrum" in English. This is an information loss plus an avoidable transliteration/terminology issue.

- **ID 408 - proper-name transliteration**
  - "Vichy" becomes "விச்சி/விச்ய" variants and "Vichy" is understandable, but spelling consistency is weak.
  - "Germans" is translated accurately.

- **ID 12 - encoding artifact**
  - `ZMapp` becomes `ZMappÂ`.
  - The medical name is still recognizable, but a stray character and inconsistent letter handling make it less reliable.

- **ID 861 - grammar and terminology**
  - It says the visa "saves time and money" but omits the reference to paperwork and slightly changes how savings are described.
  - The overall Schengen-visa meaning remains understandable.

**Strength:** Usually good at preserving long-sentence meaning.
**Weakness:** Transliteration, formatting artifacts, omissions, and awkward English borrowings.

## eng_Latn to kan_Knda

### Accurate translation

- **ID 14:** The USA Gymnastics statement retains the support for a safe environment and the Olympic Committee's position.
- **ID 11:** The Ebola vaccine and drug statements remain medically coherent.

### Representative issues

- **ID 322 - name and pronoun errors**
  - "Luna" is translated as "ಚಂದ್ರ" ("moon"), changing a person's name into a generic noun.
  - The prediction also uses inconsistent pronouns. This is a serious named-entity and referential error.

- **ID 416 - word order and missing nuance**
  - The Congress passage is understandable, but rearranging "no national executive or judiciary" and "state authorities" weakens the exact causal structure.
  - It remains a generally faithful description.

- **ID 227 - singular/plural and tense detail**
  - It says the lead singer was injured and the tour was cancelled, which is semantically close.
  - The Kannada output handles the event well, although the date and event structure are less natural.

- **ID 12 - encoding artifact**
  - `ZMappÂ` adds an unwanted character to a clinical trial name.

**Strength:** Strong treatment of public-information and medical passages.
**Weakness:** Proper names and technical terminology are less reliable than sentence-level meaning.

## tam_Taml to eng_Latn

### Accurate translation

- **ID 9:** "In late 2017, Siminoff appeared on shopping television channel QVC" is preserved accurately.
- **ID 13:** The PALM trial sentence correctly explains ZMapp as a control baseline used to compare three treatments.
- **ID 14:** The USA Gymnastics passage is close to the source and is understandable.

### Representative issues

- **ID 189 - severe output corruption**
  - The source names Chambers and explains his lawsuit as frivolous.
  - The prediction collapses into quotation-mark characters and has no usable translation. This is a complete information failure.

- **ID 857 - major meaning and category change**
  - The source discusses skiing speed and cross-country travel under good conditions.
  - The prediction says skiing can be faster on tracks for "overweight men." It adds a group and changes the technical meaning.

- **ID 12 - medical terminology**
  - "Antibody cocktail" becomes "antimicrobial snack."
  - This is a serious terminology failure: an antibody treatment is confused with an edible item or a different treatment type.

- **ID 16 - serious semantic distortion**
  - The Larry Nassar abuse investigation passage becomes a "spontaneous effort" and claims there was a "compound" that was affected.
  - The source's central meaning about abuse survivors and an independent investigation is obscured.

- **ID 15 - missing and changed legal meaning**
  - "Decertification" is rendered as "determined by it," removing the clear contrast between organizational change and decertification.

**Strength:** Accurate for straightforward news and trial descriptions.
**Weakness:** Severe failures on specialized terminology and heavily quoted or sensitive passages.

## kan_Knda to eng_Latn

### Accurate translation

- **ID 599:** The biological-clock explanation is accurate: a self-sustaining oscillator continues free-running even without external cues.
- **ID 11:** The Ebola passage preserves the experimental-vaccine and drug-availability meaning.
- **ID 12:** The ZMapp passage remains understandable and close in meaning.

### Representative issues

- **ID 135 - entity/formatting corruption**
  - The source gives a 10:00-11:00 pm MDT time range.
  - The prediction contains `ZXQENTITYQYNSFSA0Q0QQXZ-ZXQENTITYQYNSFSA0Q1QXZ` instead of the time range. It also says a prisoner was set on fire rather than that inmates started a fire in the yard.
  - This combines a severe entity replacement with a serious event distinction.

- **ID 14 - proper noun error**
  - "USA Gymnastics" becomes "USA Agosthap."
  - The rest of the Olympic-safety sentence is usable, but the organization name is not.

- **ID 598 - entity and reference check**
  - This direction has several entity placeholders, as listed in the automated count.
  - Placeholder handling is a major weak point even though many ordinary words translate correctly.

- **ID 15 - omitted legal/organizational term**
  - "Rather than decertification" is replaced by "rather than by decision-making."
  - The central alternative is lost, changing the formal meaning.

- **ID 16 - named-person and abuse meaning**
  - Larry Nassar is misspelled or distorted as "Larry Nasarn."
  - "So much crime" and "escaped detection" partly preserve the topic but obscure the exact survivor-centered meaning.

**Strength:** High-quality grammar in many general-domain sentences.
**Weakness:** This direction has the most visible entity-placeholder failures and repeated proper-noun damage.

## tam_Taml to kan_Knda

### Accurate translation

- **ID 10:** The lawsuit with the competing security company ADT is conveyed clearly.
- **ID 11:** The Ebola vaccination sentence is still understandable and preserves the distinction between a promising vaccine and lack of proven drug treatment.

### Representative issues

- **ID 46 - severe output corruption**
  - The source quote from Miller is replaced by repeated quotation marks and no spoken content.
  - The entire claim and context are lost.

- **ID 190 - severe repetition**
  - The French-opera sentence degenerates into a repeated sequence of "Saint/Saint".
  - This destroys the Camille Saint-Saens and subject-of-the-life meaning.

- **ID 12 - medical and named-entity error**
  - `ZMapp` becomes "प्रतिरೋಧಕ ತಿಂಡಿಗಳು ಮತ್ತು ಝಡ್-ಆಪ್" (roughly resistant snacks and Z-app).
  - This confuses an antibody drug cocktail with food and other entities.

- **ID 470 - missing causal context**
  - The bow-sound passage is compressed and confuses the source's up-bow/down-bow comparison.
  - The general musical topic survives, but the exact stronger/softer contrast is weakened.

- **ID 868 - repeated-word collapse**
  - The "Gypsy" passage is visible as repeated quotation-mark placeholders in the low-BLEU review.
  - This causes complete loss of the term and the explanation of prejudice.

**Strength:** Short news facts can be understandable.
**Weakness:** Long quoted passages and specialized Indic text are at greatest risk of collapse or severe repetition.

## kan_Knda to tam_Taml

### Accurate translation

- **ID 37:** The statement that all stars operate by brightness and rotation, with the Sun not exceptional, is preserved accurately.
- **ID 11:** The Ebola passage keeps the contrast between a promising experimental vaccine and insufficient evidence for drugs.
- **ID 9:** QVC, the shopping channel, and late-2017 timing remain clear.

### Representative issues

- **ID 584 - repeated-word collapse**
  - The prediction repeats "பழங்கால" many times and does not express the source meaning about parasitic bedbugs adapting to human life.
  - This is a complete loss of the technical sentence.

- **ID 16 - semantic and proper-name distortion**
  - Larry Nassar is changed to "லாரி நாசர்ன்," and the source's survivor-centered description becomes a claim that he escaped after committing crimes.
  - This is a serious named-person and abuse-context error.

- **ID 6 - added and omitted details**
  - The source about Jamie Siminoff, Ring, and the doorbell in the garage is compressed.
  - The prediction adds "door to the garage" details and does not clearly explain the original shop/garage situation. It is less complete and less natural.

- **ID 4 - generally accurate but names vary**
  - Bob Dylan and Sara Danius are understandable, although name spellings vary across Tamil and Kannada.
  - This is an acceptable named-entity transliteration issue unless strict spelling is required.

**Strength:** Better than the reverse Indic-to-Indic direction at simple factual facts.
**Weakness:** Repetition loops and sensitive named-person passages are serious failure points.

## Cross-Direction Strengths

- The models preserve many straightforward news facts, dates, organizations, and high-level event relations.
- English-to-Indic directions usually keep the main argument and public/medical topic.
- Indic-to-English is strongest in general sentence grammar and natural word order.
- The lower scores in Tamil-Kannada and Kannada-Tamil show that direct Indic-to-Indic transfer is harder, especially for quotes and rare technical terms.

## Cross-Direction Weaknesses

1. **Named entities:** Organizations, person names, and trial names vary or become unrelated words.
2. **Time and number entities:** Several dates and ranges appear with formatting corruption or inconsistent transliteration.
3. **Medical terminology:** "Antibody cocktail," ZMapp, vaccines, and bow-related technical terms are vulnerable.
4. **Pronoun and singular/plural errors:** Some predictions change people to "they," Luna to "moon," or mice to a different number or type.
5. **Missing information:** Formal alternatives such as decertification, paperwork, or gender-inclusive wording may be omitted.
6. **Output corruption:** Repeated tokens or placeholder strings create complete failures in some low-BLEU sentences.
7. **Grammar and word order:** The overall meaning is often preserved, but clauses and causal relations may become unnatural.

## Most Serious Directions

1. **Tamil to Kannada** has a large proportion of repeated/failure-style passages and can replace `ZMapp` and quoted content with unrelated or repetitive text.
2. **Kannada to Tamil** has repetition loops and severe named-person distortions, although some straightforward sentences are accurate.
3. **Kannada to English** has concentrated entity corruption, including the 10:00-11:00 MDT range and organization/time entities.
4. **Tamil to English** also has complete quote collapse and major medical terminology and skiing-mechanics errors.

The English-to-Indic directions are generally more stable, but neither is free from named entities, clinical names, or minor omission problems.

## Overall Observations and Limitations

- Zero structural failures does not mean zero semantic failures. All 6,072 predictions have fields and text, but meaning quality varies substantially.
- BLEU and chrF++ reward overlap and can miss whether a person, number, legal term, or medical term has been mistranslated.
- Reference wording can differ validly from a prediction. This analysis uses the source to separate acceptable paraphrase from real meaning change.
- The examples are representative and the automated counts are surface checks. They are not a complete severity-rated annotation of the full corpus.
- The strongest recurring problem is consistency: names and rare terms may be correct in one sentence and corrupted, transliterated differently, or mistranslated in the next.
