import { getModelConfig } from './modelRouter.js'

export const MAX_SOURCE_CHARACTERS = 20000
const UNSUPPORTED_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u

export function normalizeUnicode(text) {
  return String(text).normalize('NFC')
}

export function normalizeWhitespace(text) {
  return normalizeUnicode(text)
    .replace(/[\t\f\v ]+/gu, ' ')
    .replace(/ *\r?\n */gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()
}

export function sanitizeInput(text) {
  if (typeof text !== 'string') return { valid: false, normalizedText: '', errors: ['Enter text to translate.'], warnings: [] }
  if (UNSUPPORTED_CONTROLS.test(text)) {
    return { valid: false, normalizedText: '', errors: ['Input contains unsupported control characters.'], warnings: [] }
  }
  const normalizedText = normalizeWhitespace(text)
  if (!normalizedText) return { valid: false, normalizedText, errors: ['Enter text to translate.'], warnings: [] }
  if (normalizedText.length > MAX_SOURCE_CHARACTERS) {
    return { valid: false, normalizedText, errors: [`Input exceeds ${MAX_SOURCE_CHARACTERS} characters.`], warnings: [] }
  }
  return { valid: true, normalizedText, errors: [], warnings: [] }
}

export function validateInput(text, sourceLanguage, targetLanguage) {
  const clean = sanitizeInput(text)
  if (!clean.valid) return { ...clean, valid: false }
  try {
    getModelConfig(sourceLanguage, targetLanguage)
  } catch (error) {
    return { ...clean, valid: false, errors: [error.message] }
  }
  return clean
}

// Kept for the Stage 2 translator API.
export function preprocessText(text) {
  const result = sanitizeInput(text)
  if (!result.valid) throw new Error(result.errors[0])
  return result.normalizedText
}
