/** Levenshtein dynamic programming: each cell is the cheapest insert/delete/substitute prefix edit. */
export function levenshteinDistance(word1, word2) {
  const left = Array.from(String(word1).toLowerCase())
  const right = Array.from(String(word2).toLowerCase())
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= right.length; j += 1) {
      const substitution = previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution)
    }
    previous = current
  }
  return previous[right.length]
}

export const ENGLISH_VOCABULARY = Object.freeze([
  'artificial', 'intelligence', 'robotics', 'translation', 'language', 'neural', 'network',
  'computer', 'science', 'learning', 'algorithm', 'technology', 'machine', 'model',
])

export function suggestCorrections(word, dictionary = ENGLISH_VOCABULARY, { maxDistance = 2, limit = 5 } = {}) {
  const query = String(word).toLowerCase()
  return [...new Set(dictionary)]
    .map((candidate) => ({ word: candidate, distance: levenshteinDistance(query, candidate) }))
    .filter(({ distance }) => distance > 0 && distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance || a.word.localeCompare(b.word))
    .slice(0, limit)
}
