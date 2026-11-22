export const LANGUAGES = Object.freeze({
  eng_Latn: 'English',
  tam_Taml: 'Tamil',
  kan_Knda: 'Kannada',
})

const LANGUAGE_CODES = new Map(
  Object.entries(LANGUAGES).flatMap(([code, name]) => [
    [name.toLowerCase(), code],
    [code.toLowerCase(), code],
  ]),
)

export function getLanguageCode(languageName) {
  if (typeof languageName !== 'string') return null
  return LANGUAGE_CODES.get(languageName.trim().toLowerCase()) ?? null
}
