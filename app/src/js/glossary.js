import { createId } from './id.js'

const STORAGE_KEY = 'trilingua-glossary-v1'
const LANG = { en: 'eng_Latn', ta: 'tam_Taml', kn: 'kan_Knda' }
const TERMS = [
  ['Robot', 'ரோபோ', 'ರೋಬೋಟ್'],
  ['Artificial Intelligence', 'செயற்கை நுண்ணறிவு', 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ'],
  ['Machine Learning', 'இயந்திரக் கற்றல்', 'ಯಂತ್ರ ಕಲಿಕೆ'],
  ['Neural Network', 'நரம்பியல் வலைப்பின்னல்', 'ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್'],
  ['Translation', 'மொழிபெயர்ப்பு', 'ಅನುವಾದ'],
]

export const DEFAULT_GLOSSARY = Object.freeze(TERMS.flatMap(([en, ta, kn]) => [
  [LANG.en, LANG.ta, en, ta], [LANG.en, LANG.kn, en, kn],
  [LANG.ta, LANG.en, ta, en], [LANG.kn, LANG.en, kn, en],
  [LANG.ta, LANG.kn, ta, kn], [LANG.kn, LANG.ta, kn, ta],
].map(([sourceLanguage, targetLanguage, sourceTerm, targetTerm], index) => ({
  id: `sample-${sourceLanguage}-${targetLanguage}-${index}-${sourceTerm.length}`,
  sourceLanguage, targetLanguage, sourceTerm, targetTerm, enabled: true, sample: true,
}))))

function readEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return Array.isArray(parsed) ? parsed : [...DEFAULT_GLOSSARY]
  } catch {
    return [...DEFAULT_GLOSSARY]
  }
}

function writeEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return entries
}

export function validateGlossaryEntry(entry) {
  const errors = []
  if (!entry || typeof entry !== 'object') return { valid: false, errors: ['Entry must be an object.'] }
  if (!['eng_Latn', 'tam_Taml', 'kan_Knda'].includes(entry.sourceLanguage)) errors.push('Unsupported source language.')
  if (!['eng_Latn', 'tam_Taml', 'kan_Knda'].includes(entry.targetLanguage)) errors.push('Unsupported target language.')
  if (entry.sourceLanguage === entry.targetLanguage) errors.push('Source and target languages must differ.')
  if (typeof entry.sourceTerm !== 'string' || !entry.sourceTerm.trim()) errors.push('Enter a source term.')
  if (typeof entry.targetTerm !== 'string' || !entry.targetTerm.trim()) errors.push('Enter a target term.')
  return { valid: errors.length === 0, errors }
}

export function getGlossary(source, target) {
  return readEntries().filter((entry) => entry.enabled && entry.sourceLanguage === source && entry.targetLanguage === target)
}

export function addGlossaryEntry(entry) {
  const validation = validateGlossaryEntry(entry)
  if (!validation.valid) throw new Error(validation.errors.join(' '))
  const entries = readEntries()
  const added = { ...entry, id: entry.id ?? `user-${createId()}`, enabled: entry.enabled ?? true, sample: false }
  writeEntries([...entries, added])
  return added
}

export function updateGlossaryEntry(id, patch) {
  const entries = readEntries()
  const index = entries.findIndex((entry) => entry.id === id)
  if (index < 0) throw new Error(`Glossary entry ${id} was not found.`)
  const updated = { ...entries[index], ...patch, id, sample: entries[index].sample ?? false }
  const validation = validateGlossaryEntry(updated)
  if (!validation.valid) throw new Error(validation.errors.join(' '))
  entries[index] = updated
  writeEntries(entries)
  return updated
}

export function deleteGlossaryEntry(id) {
  const entries = readEntries()
  const next = entries.filter((entry) => entry.id !== id)
  writeEntries(next)
  return next.length !== entries.length
}

export function resetUserGlossary() {
  writeEntries([...DEFAULT_GLOSSARY])
  return [...DEFAULT_GLOSSARY]
}

export function matchGlossaryTerms(text, source, target) {
  const entries = getGlossary(source, target).sort((a, b) => b.sourceTerm.length - a.sourceTerm.length)
  const matches = []
  let output = text
  for (const entry of entries) {
    const escaped = entry.sourceTerm.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
    const boundary = /^[\p{L}\p{N}_]/u.test(entry.sourceTerm[0]) && /[\p{L}\p{N}_]$/u.test(entry.sourceTerm.at(-1))
      ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`
      : escaped
    const regex = new RegExp(boundary, 'giu')
    output = output.replace(regex, (match) => {
      const marker = `ZXQGLOSSARYQ${matches.length}QXZ`
      matches.push({ marker, original: match, targetTerm: entry.targetTerm, entryId: entry.id })
      return marker
    })
  }
  return { protectedText: output, matches }
}

export function restoreGlossaryTerms(text, matches) {
  const missing = matches.filter(({ marker }) => !text.includes(marker))
  const duplicated = matches.filter(({ marker }) => text.split(marker).length - 1 !== 1)
  if (missing.length || duplicated.length) {
    return { text, restored: false, warning: 'Glossary marker validation failed; no terminology was substituted.', missing: missing.map(({ marker }) => marker), duplicated: duplicated.map(({ marker }) => marker) }
  }
  let output = text
  for (const match of matches) output = output.replace(match.marker, match.targetTerm)
  return { text: output, restored: true, warning: null, missing: [], duplicated: [] }
}
