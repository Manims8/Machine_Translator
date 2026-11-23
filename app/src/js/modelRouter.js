import { getLanguageCode, LANGUAGES } from './language.js'

const USE_QUANTIZED_MODELS = import.meta.env?.VITE_MODELS === 'quantized' || new URLSearchParams(globalThis.location?.search ?? '').get('models') === 'quantized'
const ROOT = USE_QUANTIZED_MODELS ? '/quantized' : '/indictrans2'
const GRAPHS = Object.freeze({
  encoder: 'encoder_model.onnx',
  decoder: 'decoder_model.onnx',
  decoderWithPast: 'decoder_with_past_model.onnx',
})

function buildFamily({ id, label, folder, direction, baseModelParameterSize }) {
  const basePath = `${ROOT}/${folder}`
  return Object.freeze({
    id,
    label,
    direction,
    baseModelParameterSize,
    modelFolder: basePath,
    configurationPaths: Object.freeze({
      model: `${basePath}/config.json`,
      generation: `${basePath}/generation_config.json`,
      tokenizerMeta: `${basePath}/tokenizer_meta.json`,
      tokenizerConfig: `${basePath}/tokenizer_config.json`,
    }),
    tokenizerPaths: Object.freeze({
      source: `${basePath}/tokenizer_src.json`,
      target: `${basePath}/tokenizer_tgt.json`,
    }),
    graphs: GRAPHS,
    // Read these names from each graph's external-data references. FP32
    // decoder graphs share one sidecar; quantized decoders use separate files.
    externalDataByGraph: Object.freeze({
      [GRAPHS.encoder]: Object.freeze(['encoder_model.onnx.data']),
      [GRAPHS.decoder]: Object.freeze([USE_QUANTIZED_MODELS ? 'decoder_model.onnx.data' : 'decoder_shared.onnx.data']),
      [GRAPHS.decoderWithPast]: Object.freeze([USE_QUANTIZED_MODELS ? 'decoder_with_past_model.onnx.data' : 'decoder_shared.onnx.data']),
    }),
  })
}

export const MODEL_CONFIGS = Object.freeze({
  enIndic: buildFamily({
    id: 'en-indic-200m',
    label: 'English → Indic (200M)',
    folder: 'en-indic-200m-fp32',
    direction: 'English to Tamil or Kannada',
    baseModelParameterSize: '200M',
  }),
  indicEn: buildFamily({
    id: 'indic-en-200m',
    label: 'Indic → English (200M)',
    folder: 'indic-en-200m-fp32',
    direction: 'Tamil or Kannada to English',
    baseModelParameterSize: '200M',
  }),
  indicIndic: buildFamily({
    id: 'indic-indic-320m',
    label: 'Indic → Indic (320M)',
    folder: 'indic-indic-320m-fp32',
    direction: 'Tamil ↔ Kannada',
    baseModelParameterSize: '320M',
  }),
})

const CODE_SET = new Set(Object.keys(LANGUAGES))

function normalizeLanguage(value) {
  if (CODE_SET.has(value)) return value
  return getLanguageCode(value)
}

/** Select the only model family that supports the requested language pair. */
export function getModelConfig(sourceLanguage, targetLanguage) {
  const source = normalizeLanguage(sourceLanguage)
  const target = normalizeLanguage(targetLanguage)
  if (!source || !target) {
    throw new Error('Choose English, Tamil, or Kannada for both languages.')
  }
  if (source === target) {
    throw new Error('Source and target languages must be different.')
  }

  let family
  if (source === 'eng_Latn') family = MODEL_CONFIGS.enIndic
  else if (target === 'eng_Latn') family = MODEL_CONFIGS.indicEn
  else if (
    (source === 'tam_Taml' && target === 'kan_Knda') ||
    (source === 'kan_Knda' && target === 'tam_Taml')
  ) family = MODEL_CONFIGS.indicIndic

  if (!family) throw new Error('This language direction is not supported.')
  return Object.freeze({
    ...family,
    sourceLanguage: source,
    targetLanguage: target,
    tokenizerSourcePath: family.tokenizerPaths.source,
    tokenizerTargetPath: family.tokenizerPaths.target,
    modelConfigPath: family.configurationPaths.model,
    generationConfigPath: family.configurationPaths.generation,
    tokenizerMetaPath: family.configurationPaths.tokenizerMeta,
    tokenizerConfigPath: family.configurationPaths.tokenizerConfig,
  })
}

export { getLanguageCode }
