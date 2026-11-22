// Entity and glossary markers are tested independently against each model route.
export const MARKER_SUPPORT = Object.freeze({
  entity: Object.freeze({
    'eng_Latn>tam_Taml': false,
    'eng_Latn>kan_Knda': false,
    'tam_Taml>eng_Latn': false,
    'kan_Knda>eng_Latn': true,
    'tam_Taml>kan_Knda': false,
    'kan_Knda>tam_Taml': false,
  }),
  glossary: Object.freeze({
    'eng_Latn>tam_Taml': false,
    'eng_Latn>kan_Knda': false,
    'tam_Taml>eng_Latn': false,
    'kan_Knda>eng_Latn': false,
    'tam_Taml>kan_Knda': false,
    'kan_Knda>tam_Taml': false,
  }),
})

export function markersSupported(source, target) {
  return entityMarkersSupported(source, target) && glossaryMarkersSupported(source, target)
}

export function entityMarkersSupported(source, target) {
  return MARKER_SUPPORT.entity[`${source}>${target}`] === true
}

export function glossaryMarkersSupported(source, target) {
  return MARKER_SUPPORT.glossary[`${source}>${target}`] === true
}
