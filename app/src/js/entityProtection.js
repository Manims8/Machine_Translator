const ENTITY_PATTERNS = [
  ['url', /https?:\/\/[^\s<>]+/giu],
  ['email', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu],
  ['date', /\b(?:\d{1,4}[/-]\d{1,2}[/-]\d{1,4}|\d{1,2}:\d{2}(?:\s?[AP]M)?)\b/giu],
  ['currency', /(?:[$€£₹]\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|INR|GBP))/giu],
  ['decimal', /\b\d+\.\d+\b/gu],
  ['phone', /\b(?:\+?\d[\d ()-]{7,}\d)\b/gu],
  ['identifier', /\b(?=[A-Z0-9_-]*[A-Z])(?=[A-Z0-9_-]*\d)[A-Z0-9_-]{5,}\b/giu],
]

export function detectEntities(text) {
  const found = []
  for (const [type, pattern] of ENTITY_PATTERNS) {
    pattern.lastIndex = 0
    for (const match of text.matchAll(pattern)) found.push({ type, value: match[0], start: match.index, end: match.index + match[0].length })
  }
  found.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))
  const accepted = []
  for (const item of found) {
    if (accepted.some((prior) => item.start < prior.end && item.end > prior.start)) continue
    accepted.push(item)
  }
  return accepted
}

function makeMarker(index, nonce) {
  return `ZXQENTITYQ${nonce}Q${index}QXZ`
}

export function protectEntities(text, { nonce = Math.random().toString(36).slice(2, 10) } = {}) {
  const entities = detectEntities(text)
  let cursor = 0
  let protectedText = ''
  const entityMap = []
  for (const [index, entity] of entities.entries()) {
    protectedText += text.slice(cursor, entity.start)
    const marker = makeMarker(index, nonce)
    protectedText += marker
    entityMap.push({ ...entity, marker })
    cursor = entity.end
  }
  protectedText += text.slice(cursor)
  return { protectedText, entityMap, detectedEntities: entities }
}

export function validateProtectedEntities(text, entityMap) {
  const markers = entityMap.map((item) => item.marker)
  const missing = markers.filter((marker) => !text.includes(marker))
  const duplicated = markers.filter((marker) => text.split(marker).length - 1 !== 1)
  const unexpected = [...text.matchAll(/ZXQENTITYQ[\w]+?Q\d+QXZ/gu)].map((match) => match[0]).filter((marker) => !markers.includes(marker))
  return { valid: missing.length === 0 && duplicated.length === 0 && unexpected.length === 0, missing, duplicated, unexpected }
}

export function restoreEntities(text, entityMap) {
  const validation = validateProtectedEntities(text, entityMap)
  if (!validation.valid) return { text, restored: false, validation, warning: 'Protected entity markers changed or disappeared; original values were not substituted.' }
  let restoredText = text
  for (const entity of entityMap) restoredText = restoredText.replace(entity.marker, entity.value)
  return { text: restoredText, restored: true, validation, warning: null }
}

export const ENTITY_MARKER_EXAMPLE = makeMarker(0, 'TEST2026')
