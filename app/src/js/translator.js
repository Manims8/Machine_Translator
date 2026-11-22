import * as ort from 'onnxruntime-web/wasm'
import wasmBinaryUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url'
import wasmModuleUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url'
import { postprocessText, transliterate } from './postprocessing.js'
import { preprocessText } from './preprocessing.js'

// Point ONNX Runtime at npm-installed assets before Transformers.js initializes
// its backend. A single WASM thread avoids requiring cross-origin isolation.
globalThis[Symbol.for('onnxruntime')] = ort
ort.env.wasm.numThreads = 1
ort.env.wasm.proxy = false
ort.env.wasm.wasmPaths = { wasm: wasmBinaryUrl, mjs: wasmModuleUrl }

const { AutoTokenizer, env: transformersEnv } = await import('@huggingface/transformers')
transformersEnv.allowLocalModels = true
transformersEnv.allowRemoteModels = false
transformersEnv.localModelPath = '/'
transformersEnv.useBrowserCache = false
transformersEnv.backends.onnx.wasm.numThreads = 1
transformersEnv.backends.onnx.wasm.wasmPaths = { wasm: wasmBinaryUrl, mjs: wasmModuleUrl }

const MAX_GENERATED_TOKENS = 128
let activeModel = null
let modelLoadPromise = null

function progress(onProgress, phase, message, percent = null) {
  onProgress?.({ phase, message, percent })
}

async function fetchResponse(url, label) {
  let response
  try {
    response = await fetch(url, { cache: 'no-store' })
  } catch (error) {
    throw new Error(`Could not reach local ${label} at ${url}. Is the Vite server running? (${error.message})`)
  }
  if (!response.ok) {
    throw new Error(`Local ${label} is unavailable (${response.status}) at ${url}.`)
  }
  return response
}

async function fetchJson(url, label) {
  const response = await fetchResponse(url, label)
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`Local ${label} at ${url} returned an HTML page instead of JSON; the file is missing or the path is incorrect.`)
  }
  try {
    return await response.json()
  } catch (error) {
    throw new Error(`${label} at ${url} is not valid JSON: ${error.message}`)
  }
}

async function fetchBytes(url, label, onProgress, percentStart = 0, percentWidth = 100) {
  const response = await fetchResponse(url, label)
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`Local ${label} at ${url} returned an HTML page; the file is missing or the path is incorrect.`)
  }
  if (!response.body) {
    const buffer = await response.arrayBuffer()
    progress(onProgress, 'weights', `Loaded ${label}`, percentStart + percentWidth)
    return new Uint8Array(buffer)
  }

  const total = Number(response.headers.get('content-length')) || 0
  const reader = response.body.getReader()
  const chunks = []
  let loaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.byteLength
    if (total > 0) {
      const fraction = Math.min(1, loaded / total)
      progress(onProgress, 'weights', `Loading ${label}: ${Math.round(fraction * 100)}%`, percentStart + fraction * percentWidth)
    }
  }
  if (total > 0 && loaded !== total) {
    throw new Error(`${label} download was incomplete: expected ${total} bytes, received ${loaded}.`)
  }
  const result = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  progress(onProgress, 'weights', `Loaded ${label}`, percentStart + percentWidth)
  return result
}

async function loadTokenizer(jsonPath, tokenizerName, label) {
  const tokenizerJson = await fetchJson(jsonPath, label)
  const originalFetch = window.fetch
  const configJson = { tokenizer_class: 'PreTrainedTokenizerFast' }
  // The ONNX export names its files tokenizer_src.json/tokenizer_tgt.json.
  // Transformers.js expects tokenizer.json, so provide the already fetched
  // local JSON in memory while it constructs its normal tokenizer class.
  window.fetch = async (input, init) => {
    const requested = input instanceof Request ? input.url : String(input)
    const pathname = new URL(requested, window.location.href).pathname
    if (pathname.endsWith('/tokenizer.json')) {
      return new Response(JSON.stringify(tokenizerJson), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (pathname.endsWith('/tokenizer_config.json')) {
      return new Response(JSON.stringify(configJson), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return originalFetch(input, init)
  }
  try {
    return await AutoTokenizer.from_pretrained(tokenizerName, { local_files_only: true })
  } catch (error) {
    throw new Error(`Could not construct ${label} from the local tokenizer JSON: ${error.message}`)
  } finally {
    window.fetch = originalFetch
  }
}

function externalDataForGraph(graphName, sidecarBuffers, config) {
  const files = config.externalDataByGraph[graphName] ?? []
  return files.map((filename) => {
    const data = sidecarBuffers.get(filename)
    if (!data) throw new Error(`Missing external weight sidecar "${filename}" required by ${graphName}.`)
    return { path: filename, data }
  })
}

async function createSession(config, graphName, sidecarBuffers, onProgress, phase, message) {
  const graphPath = `${config.modelFolder}/${graphName}`
  const graphData = await fetchBytes(graphPath, graphName, (update) => onProgress?.(update), 0, 0)
  progress(onProgress, phase, `Creating ${message} WASM session`, 50)
  try {
    const session = await ort.InferenceSession.create(graphData, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      externalData: externalDataForGraph(graphName, sidecarBuffers, config),
    })
    progress(onProgress, phase, `${message} ready`, 100)
    return session
  } catch (error) {
    throw new Error(`Failed to initialize ${graphName} with its local external weights: ${error.message}`)
  }
}

async function releaseSessions(sessions) {
  if (!sessions) return
  for (const session of [sessions.encoder, sessions.decoder, sessions.decoderWithPast]) {
    try {
      await session?.release()
    } catch {
      // Continue releasing the other sessions even if one runtime release fails.
    }
  }
}

export function isModelLoaded() {
  return activeModel !== null
}

export function getLoadedModelId() {
  return activeModel?.id ?? null
}

export function getModelLoadTimeMs() {
  return activeModel?.loadTimeMs ?? null
}

export async function unloadTranslationModel() {
  const previous = activeModel
  activeModel = null
  if (previous) await releaseSessions(previous.sessions)
  if (typeof globalThis.gc === 'function') globalThis.gc()
}

export async function loadTranslationModel(config, onProgress = () => {}) {
  if (!config?.id || !config.modelFolder) throw new Error('A valid local model configuration is required.')
  if (activeModel?.id === config.id) return activeModel
  if (modelLoadPromise) {
    await modelLoadPromise
    if (activeModel?.id === config.id) return activeModel
  }

  modelLoadPromise = (async () => {
    await unloadTranslationModel()
    const startedAt = performance.now()
    const sessions = {}
    const sidecarBuffers = new Map()
    try {
      progress(onProgress, 'configuration', 'Loading local model configuration', 0)
      const [modelConfig, generationConfig, tokenizerMeta] = await Promise.all([
        fetchJson(config.modelConfigPath, 'model configuration'),
        fetchJson(config.generationConfigPath, 'generation configuration'),
        fetchJson(config.tokenizerMetaPath, 'tokenizer metadata'),
      ])
      if (!modelConfig.max_source_positions || !tokenizerMeta.src_dict_size || !tokenizerMeta.tgt_dict_size) {
        throw new Error('Model configuration or tokenizer metadata is missing required vocabulary/sequence settings.')
      }
      progress(onProgress, 'configuration', 'Model configuration loaded', 100)

      progress(onProgress, 'tokenizers', 'Loading source tokenizer JSON', 0)
      const sourceTokenizer = await loadTokenizer(config.tokenizerSourcePath, `${config.id}-source`, 'source tokenizer')
      progress(onProgress, 'tokenizers', 'Source tokenizer ready; loading target tokenizer', 50)
      const targetTokenizer = await loadTokenizer(config.tokenizerTargetPath, `${config.id}-target`, 'target tokenizer')
      progress(onProgress, 'tokenizers', 'Both local tokenizers are ready', 100)

      const sidecarNames = [...new Set(Object.values(config.externalDataByGraph).flat())]
      if (sidecarNames.length === 0) throw new Error('This model configuration declares no ONNX external weight files.')
      for (let index = 0; index < sidecarNames.length; index += 1) {
        const filename = sidecarNames[index]
        const start = (index / sidecarNames.length) * 100
        const width = 100 / sidecarNames.length
        const data = await fetchBytes(`${config.modelFolder}/${filename}`, `external ONNX weight file ${filename}`, onProgress, start, width)
        if (data.byteLength === 0) throw new Error(`External ONNX weight sidecar ${filename} is empty.`)
        sidecarBuffers.set(filename, data)
      }

      sessions.encoder = await createSession(config, config.graphs.encoder, sidecarBuffers, onProgress, 'encoder', 'Encoder')
      sessions.decoder = await createSession(config, config.graphs.decoder, sidecarBuffers, onProgress, 'decoder', 'Decoder')
      sessions.decoderWithPast = await createSession(config, config.graphs.decoderWithPast, sidecarBuffers, onProgress, 'decoderWithPast', 'Decoder-with-past')
      const cacheTensorCount = sessions.decoder.outputNames.length - 1
      if (cacheTensorCount <= 0 || cacheTensorCount % 4 !== 0) {
        throw new Error(`Decoder exposes ${cacheTensorCount} cache outputs; expected four key/value tensors per layer.`)
      }

      activeModel = {
        id: config.id,
        config,
        modelConfig,
        generationConfig,
        tokenizerMeta,
        sourceTokenizer,
        targetTokenizer,
        numCacheLayers: cacheTensorCount / 4,
        sessions,
        loadTimeMs: performance.now() - startedAt,
      }
      progress(onProgress, 'ready', `${config.label} loaded in ${(activeModel.loadTimeMs / 1000).toFixed(1)} s`, 100)
      return activeModel
    } catch (error) {
      await releaseSessions(sessions)
      throw new Error(`Could not load ${config.label}: ${error.message}`)
    } finally {
      // Sessions own the weights once they are created. Drop JS-side buffers
      // before inference to avoid retaining a second copy of multi-GB weights.
      sidecarBuffers.clear()
      modelLoadPromise = null
    }
  })()

  return modelLoadPromise
}

async function tokenizeLanguage(tokenizer, code, label) {
  const encoded = await tokenizer(code, { add_special_tokens: false })
  const values = Array.from(encoded.input_ids.data, Number)
  if (values.length !== 1) throw new Error(`${label} language tag ${code} did not map to one tokenizer ID.`)
  return values[0]
}

function makeInt64Tensor(values) {
  return new ort.Tensor('int64', BigInt64Array.from(values, (value) => BigInt(value)), [1, values.length])
}

function disposeOutput(output) {
  if (!output) return
  for (const value of Object.values(output)) value?.dispose?.()
}

function makePastFeed(presentOutputs, layerCount) {
  const feed = {}
  for (let layer = 0; layer < layerCount; layer += 1) {
    for (const component of ['decoder.key', 'decoder.value', 'encoder.key', 'encoder.value']) {
      const outputName = `present.${layer}.${component}`
      const inputName = `past_key_values.${layer}.${component}`
      if (!presentOutputs[outputName]) throw new Error(`Decoder cache is missing ${outputName}.`)
      feed[inputName] = presentOutputs[outputName]
    }
  }
  return feed
}

function selectNextToken(logits) {
  const [batchSize, sequenceLength, vocabSize] = logits.dims
  if (batchSize !== 1 || !sequenceLength || !vocabSize) throw new Error('Decoder returned logits with an unexpected shape.')
  const offset = (sequenceLength - 1) * vocabSize
  let bestId = 0
  let bestValue = -Infinity
  for (let id = 0; id < vocabSize; id += 1) {
    const value = logits.data[offset + id]
    if (value > bestValue) {
      bestValue = value
      bestId = id
    }
  }
  if (!Number.isFinite(bestValue)) throw new Error('Decoder returned invalid token scores.')
  return bestId
}

export async function translateText(inputText, config, onProgress = () => {}) {
  const input = preprocessText(inputText)
  const model = await loadTranslationModel(config, onProgress)
  const startedAt = performance.now()
  const { sourceLanguage, targetLanguage } = config
  let encodedText
  let encoderInput
  let attentionMask
  let encoderOutput
  let presentOutputs = null
  let decoderInput = null
  const generatedIds = []
  let completed = false

  try {
    const modelText = sourceLanguage === 'eng_Latn'
      ? input
      : transliterate(input, sourceLanguage, 'hin_Deva')
    const sourceTagId = await tokenizeLanguage(model.sourceTokenizer, sourceLanguage, 'Source')
    // The language tags are vocabulary entries in the source tokenizer too.
    const targetTagId = await tokenizeLanguage(model.sourceTokenizer, targetLanguage, 'Target')
    encodedText = await model.sourceTokenizer(modelText.startsWith(' ') ? modelText : ` ${modelText}`)
    const textIds = Array.from(encodedText.input_ids.data, Number)
    const inputIds = [sourceTagId, targetTagId, ...textIds].map((id) =>
      id < model.tokenizerMeta.src_dict_size ? id : Number(model.tokenizerMeta.unk_id))
    if (inputIds.length > model.modelConfig.max_source_positions) {
      throw new Error(`This sentence tokenizes to ${inputIds.length} tokens; the model limit is ${model.modelConfig.max_source_positions}. Shorten the text and try again.`)
    }

    const textMask = Array.from(encodedText.attention_mask.data, Number)
    encoderInput = makeInt64Tensor(inputIds)
    attentionMask = makeInt64Tensor([1, 1, ...textMask])
    progress(onProgress, 'translation', 'Running encoder', null)
    encoderOutput = await model.sessions.encoder.run({ input_ids: encoderInput, attention_mask: attentionMask })
    encoderInput.dispose()
    encoderInput = null

    const decoderStartId = Number(model.generationConfig.decoder_start_token_id ?? model.modelConfig.decoder_start_token_id ?? 2)
    const eosId = Number(model.generationConfig.eos_token_id ?? model.modelConfig.eos_token_id ?? 2)
    decoderInput = makeInt64Tensor([decoderStartId])
    let tokenCount = 0
    const maxTokens = Math.min(MAX_GENERATED_TOKENS, model.modelConfig.max_target_positions ?? MAX_GENERATED_TOKENS)
    progress(onProgress, 'translation', 'Generating translation tokens', 0)

    for (let step = 0; step < maxTokens; step += 1) {
      let outputs
      if (step === 0) {
        outputs = await model.sessions.decoder.run({
          input_ids: decoderInput,
          encoder_hidden_states: encoderOutput.last_hidden_state,
          encoder_attention_mask: attentionMask,
        })
      } else {
        const priorPresent = presentOutputs
        outputs = await model.sessions.decoderWithPast.run({
          input_ids: decoderInput,
          encoder_attention_mask: attentionMask,
          ...makePastFeed(priorPresent, model.numCacheLayers),
        })
        disposeOutput(priorPresent)
      }
      decoderInput.dispose()
      decoderInput = null

      const logits = outputs.logits
      if (!logits) {
        disposeOutput(outputs)
        throw new Error('Decoder did not return token logits.')
      }
      const nextId = selectNextToken(logits)
      logits.dispose?.()
      presentOutputs = Object.fromEntries(
        Object.entries(outputs).filter(([name]) => name.startsWith('present.')),
      )
      tokenCount += 1
      if (presentOutputs && Object.keys(presentOutputs).length === 0) {
        throw new Error('Decoder returned no key/value cache for the next generation step.')
      }
      if (tokenCount === 1 || tokenCount % 4 === 0) {
        progress(onProgress, 'translation', `Generated ${tokenCount} token${tokenCount === 1 ? '' : 's'}`, Math.min(99, tokenCount / maxTokens * 100))
      }
      if (nextId === eosId) break
      generatedIds.push(nextId)
      decoderInput = makeInt64Tensor([nextId])
    }

    if (tokenCount >= maxTokens && generatedIds.length > 0) {
      // Reaching the cap is allowed; it prevents unbounded decoding.
      progress(onProgress, 'translation', `Stopped at the ${maxTokens}-token safety limit`, 100)
    }
    const safeOutputIds = generatedIds.map((id) =>
      id < model.tokenizerMeta.tgt_dict_size ? id : Number(model.tokenizerMeta.unk_id))
    const decoded = await model.targetTokenizer.decode(safeOutputIds, { skip_special_tokens: true })
    const translation = postprocessText(decoded, targetLanguage)
    if (!translation) throw new Error('The model returned an empty translation.')
    completed = true
    progress(onProgress, 'complete', 'Translation complete', 100)
    return {
      translation,
      totalTokens: tokenCount,
      totalTimeMs: performance.now() - startedAt,
    }
  } finally {
    encoderInput?.dispose?.()
    attentionMask?.dispose?.()
    decoderInput?.dispose?.()
    disposeOutput(encoderOutput)
    disposeOutput(presentOutputs)
    if (!completed) progress(onProgress, 'error', 'Translation failed', null)
  }
}\n