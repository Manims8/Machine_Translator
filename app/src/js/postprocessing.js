// IndicTrans2's multilingual vocabulary uses Devanagari as the shared
// intermediate script. This maps corresponding script code points; the model
// still performs the actual translation between words and sentences.
const SCRIPT_RANGES = Object.freeze({ ta: 0x0b80, kn: 0x0c80, hi: 0x0900 })
const LANGUAGE_SCRIPT = Object.freeze({
  eng_Latn: null,
  tam_Taml: 'ta',
  kan_Knda: 'kn',
  hin_Deva: 'hi',
})

function correctTamilMapping(offset) {
  if (offset >= 0x15 && offset <= 0x28 && offset !== 0x1c) {
    const remainder = (offset - 0x15) % 5
    if (remainder !== 0 && remainder !== 4) {
      offset = 0x15 + 5 * Math.floor((offset - 0x15) / 5)
    }
  }
  if (offset === 0x2b || offset === 0x2c || offset === 0x2d) offset = 0x2a
  if (offset === 0x36) offset = 0x37
  return offset
}

/** Convert script only; this is not a word-level translation function. */
export function transliterate(text, sourceLanguage, targetLanguage) {
  const sourceScript = LANGUAGE_SCRIPT[sourceLanguage]
  const targetScript = LANGUAGE_SCRIPT[targetLanguage]
  if (!sourceScript || !targetScript || sourceScript === targetScript) return text

  const sourceStart = SCRIPT_RANGES[sourceScript]
  const targetStart = SCRIPT_RANGES[targetScript]
  const output = []
  for (const character of text) {
    const codePoint = character.codePointAt(0)
    let offset = codePoint - sourceStart
    if (offset >= 0 && offset <= 0x6f && character !== '\u0964' && character !== '\u0965') {
      if (targetScript === 'ta') offset = correctTamilMapping(offset)
      output.push(String.fromCodePoint(targetStart + offset))
    } else {
      output.push(character)
    }
  }
  return output.join('')
}

export function postprocessText(text, targetLanguage) {
  const internalLanguage = targetLanguage === 'eng_Latn' ? 'eng_Latn' : 'hin_Deva'
  return transliterate(text, internalLanguage, targetLanguage)
    .normalize('NFC')
    .replace(/[\s\u00a0]+/gu, ' ')
    .trim()
}\n