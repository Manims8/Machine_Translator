const MAX_SOURCE_CHARACTERS = 5000

/** Normalize representation and spacing without changing sentence meaning. */
export function preprocessText(value) {
  if (typeof value !== 'string') throw new Error('Enter text to translate.')
  const text = value.normalize('NFC').replace(/[\s\u00a0]+/gu, ' ').trim()
  if (!text) throw new Error('Enter text to translate.')
  if (text.length > MAX_SOURCE_CHARACTERS) {
    throw new Error(`Text is too long (${text.length} characters). Keep it under ${MAX_SOURCE_CHARACTERS} characters.`)
  }
  return text
}
