const ABBREVIATIONS = new Set(['mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'vs.', 'etc.', 'e.g.', 'i.e.', 'u.s.', 'no.'])

function protectInlinePeriods(text) {
  const protectedText = []
  let working = text
  const replacements = []
  const keep = (value) => {
    const index = replacements.length
    replacements.push(value)
    return `\uE000${index}\uE001`
  }
  working = working.replace(/https?:\/\/[^\s<>]+/giu, keep)
  working = working.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, keep)
  working = working.replace(/\b(?:\d+\.\d+|[A-Za-z](?:\.[A-Za-z])+\.)/gu, (match) => {
    if (/^\d/u.test(match)) return keep(match)
    return keep(match)
  })
  protectedText.push(working)
  return { text: working, replacements, restore(value) {
    return value.replace(/\uE000(\d+)\uE001/gu, (_, index) => replacements[Number(index)] ?? '')
  } }
}

function fallbackSentences(paragraph) {
  const protectedValue = protectInlinePeriods(paragraph)
  const text = protectedValue.text
  const parts = []
  let start = 0
  for (let i = 0; i < text.length; i += 1) {
    if (!/[.!?。？！।]/u.test(text[i])) continue
    if (text[i] === '.' && /\d/u.test(text[i - 1] ?? '') && /\d/u.test(text[i + 1] ?? '')) continue
    let end = i + 1
    while (/[.!?。？！।”’"')\]}]/u.test(text[end] ?? '')) end += 1
    if (end < text.length && !/\s/u.test(text[end])) continue
    const candidate = text.slice(start, end).trim()
    const lastWord = candidate.split(/\s+/u).at(-1)?.toLowerCase()
    if (ABBREVIATIONS.has(lastWord) && end < text.length) continue
    if (candidate) parts.push(protectedValue.restore(candidate))
    start = end
    while (/\s/u.test(text[start] ?? '')) start += 1
    i = start - 1
  }
  const tail = text.slice(start).trim()
  if (tail) parts.push(protectedValue.restore(tail))
  return parts.length ? parts : [paragraph]
}

function sentencesForParagraph(paragraph, language) {
  if (typeof Intl.Segmenter === 'function') {
    try {
      const segmenter = new Intl.Segmenter(language, { granularity: 'sentence' })
      const parts = [...segmenter.segment(paragraph)].map(({ segment }) => segment.trim()).filter(Boolean)
      if (parts.length) return parts
    } catch {
      // Unsupported locale data uses the punctuation-aware fallback below.
    }
  }
  return fallbackSentences(paragraph)
}

/** Segment and group adjacent sentences; tokenCounter can provide real tokenizer lengths. */
export async function segmentText(text, { language = 'en', maxTokens = 256, tokenCounter = null, reserveTokens = 2 } = {}) {
  const paragraphs = String(text).split(/\n+/u)
  const grouped = []
  for (const rawParagraph of paragraphs) {
    const paragraph = rawParagraph.trim()
    if (!paragraph) continue
    const sentences = sentencesForParagraph(paragraph, language)
    let chunk = ''
    for (const sentence of sentences) {
      const candidate = chunk ? `${chunk} ${sentence}` : sentence
      const count = tokenCounter ? await tokenCounter(candidate) : candidate.length
      if (chunk && count + reserveTokens > maxTokens) {
        grouped.push(chunk)
        chunk = sentence
      } else {
        chunk = candidate
      }
      if (tokenCounter && await tokenCounter(chunk) + reserveTokens > maxTokens) {
        // A single sentence can exceed the model limit; split only at whitespace.
        const words = chunk.split(/\s+/u)
        let safe = ''
        for (const word of words) {
          const next = safe ? `${safe} ${word}` : word
          if (safe && await tokenCounter(next) + reserveTokens > maxTokens) {
            grouped.push(safe)
            safe = word
          } else safe = next
        }
        chunk = safe
      }
    }
    if (chunk) grouped.push(chunk)
  }
  return grouped.length ? grouped : []
}
