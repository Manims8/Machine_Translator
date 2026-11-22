import { LANGUAGES } from './language.js'
import { getModelConfig } from './modelRouter.js'
import { translateWithNLP } from './nlpPipeline.js'
import { suggestCorrections, ENGLISH_VOCABULARY } from './editDistance.js'
import { addGlossaryEntry, deleteGlossaryEntry, getGlossary, matchGlossaryTerms, resetUserGlossary, restoreGlossaryTerms, updateGlossaryEntry } from './glossary.js'
import { segmentText } from './sentenceSegmenter.js'
import { protectEntities, restoreEntities } from './entityProtection.js'
import { entityMarkersSupported, glossaryMarkersSupported } from './markerSupport.js'
import {
  getModelLoadTimeMs,
  getModelMaxSourceTokens,
  getLoadedModelId,
  isModelLoaded,
  loadTranslationModel,
  countSourceTokens,
  translateText,
  unloadTranslationModel,
} from './translator.js'

const elements = {
  sourceLanguage: document.querySelector('#source-language'),
  targetLanguage: document.querySelector('#target-language'),
  sourceText: document.querySelector('#source-text'),
  translationOutput: document.querySelector('#translation-output'),
  translationTime: document.querySelector('#translation-time'),
  loadTime: document.querySelector('#load-time'),
  modelFamily: document.querySelector('#model-family'),
  modelStatus: document.querySelector('#model-status'),
  progress: document.querySelector('#model-progress'),
  progressPercent: document.querySelector('#progress-percent'),
  error: document.querySelector('#error-message'),
  translateButton: document.querySelector('#translate-button'),
  unloadButton: document.querySelector('#unload-button'),
  swapButton: document.querySelector('#swap-languages'),
  characterCount: document.querySelector('#character-count'),
  smokeOutput: document.querySelector('#smoke-output'),
  diagnostics: document.querySelector('#diagnostics-grid'),
  glossarySelect: document.querySelector('#glossary-entry-select'),
  glossarySource: document.querySelector('#glossary-source-term'),
  glossaryTarget: document.querySelector('#glossary-target-term'),
  glossarySave: document.querySelector('#glossary-save'),
  glossaryDelete: document.querySelector('#glossary-delete'),
  glossaryReset: document.querySelector('#glossary-reset'),
  spellingButton: document.querySelector('#spelling-suggest'),
  spellingOutput: document.querySelector('#spelling-output'),
}

let busy = false

for (const [code, name] of Object.entries(LANGUAGES)) {
  elements.sourceLanguage.add(new Option(name, code))
  elements.targetLanguage.add(new Option(name, code))
}
elements.sourceLanguage.value = 'eng_Latn'
elements.targetLanguage.value = 'tam_Taml'

function selectedConfig() {
  return getModelConfig(elements.sourceLanguage.value, elements.targetLanguage.value)
}

function clearError() {
  elements.error.hidden = true
  elements.error.textContent = ''
}

function showError(message) {
  elements.error.textContent = message
  elements.error.hidden = false
}

function renderDiagnostics(result) {
  if (!result) return
  const rows = [
    ['Original input', result.originalText], ['Normalized input', result.normalizedText],
    ['Sentences / chunks', `${result.sentenceCount} / ${result.chunkCount}`],
    ['Detected entities', result.detectedEntities.map((item) => `${item.type}: ${item.value}`).join('\n') || 'None'],
    ['Entity protection', result.entityProtectionEnabled ? (result.entityProtectionSucceeded ? 'Enabled; markers validated' : 'Enabled; marker validation failed safely') : 'Disabled for this model direction'],
    ['Glossary', result.glossaryApplied ? 'Applied' : `Reference only (${result.glossaryReferenceCount} entries)`],
    ['Glossary terms', result.appliedGlossaryTerms.map((item) => `${item.sourceTerm} → ${item.targetTerm}`).join('\n') || 'None'],
    ['Source / generated tokens', `${result.sourceTokenCount} / ${result.generatedTokenCount}`],
    ['Model', result.modelFamily],
    ['Pre / translate / post (ms)', `${result.preprocessingTimeMs.toFixed(1)} / ${result.translationTimeMs.toFixed(1)} / ${result.postprocessingTimeMs.toFixed(1)}`],
    ['Warnings', result.warnings.join('\n') || 'None'],
  ]
  elements.diagnostics.replaceChildren(...rows.flatMap(([label, value]) => {
    const dt = document.createElement('dt'); dt.textContent = label
    const dd = document.createElement('dd'); dd.textContent = String(value ?? '')
    return [dt, dd]
  }))
}

function updateSelectedModel() {
  try {
    const config = selectedConfig()
    elements.modelFamily.textContent = config.label
    clearError()
  } catch (error) {
    elements.modelFamily.textContent = 'No model for this direction'
    showError(error.message)
  }
}

function updateBusyState(value) {
  busy = value
  elements.translateButton.disabled = value
  elements.sourceLanguage.disabled = value
  elements.targetLanguage.disabled = value
  elements.swapButton.disabled = value
  elements.unloadButton.disabled = value || !isModelLoaded()
}

function showProgress(update) {
  if (update.message) elements.modelStatus.textContent = update.message
  if (Number.isFinite(update.percent)) {
    const percent = Math.max(0, Math.min(100, update.percent))
    elements.progress.value = percent
    elements.progressPercent.textContent = `${Math.round(percent)}%`
  } else if (update.phase === 'translation') {
    elements.progress.value = 0
    elements.progressPercent.textContent = 'Working'
  }
}

async function translateFromInterface() {
  if (busy) return null
  clearError()
  let config
  try {
    config = selectedConfig()
  } catch (error) {
    showError(error.message)
    return null
  }

  updateBusyState(true)
  elements.translationOutput.textContent = 'Preparing the local translation model…'
  elements.translationTime.textContent = 'Translation time: measuring…'
  elements.progress.value = 0
  elements.progressPercent.textContent = ''
  try {
    const result = await translateWithNLP({ text: elements.sourceText.value, sourceLanguage: config.sourceLanguage, targetLanguage: config.targetLanguage, onProgress: showProgress })
    elements.translationOutput.textContent = result.translation
    elements.translationTime.textContent = `Translation time: ${(result.translationTimeMs / 1000).toFixed(2)} s · ${result.generatedTokenCount} tokens`
    const modelLoadTime = result.modelLoadTimeMs ?? getModelLoadTimeMs()
    elements.loadTime.textContent = modelLoadTime === null
      ? 'Model load time unavailable'
      : `Model loaded in ${(modelLoadTime / 1000).toFixed(1)} s`
    elements.unloadButton.disabled = false
    renderDiagnostics(result)
    return {
      ...result,
      modelUsed: config.id,
      modelLoadTimeMs: modelLoadTime,
      status: 'passed',
    }
  } catch (error) {
    elements.translationOutput.textContent = 'No translation available.'
    elements.translationTime.textContent = 'Translation did not complete.'
    showError(error.message || String(error))
    elements.modelStatus.textContent = 'Translation failed. Check the local model files and error details.'
    return {
      sourceLanguage: config.sourceLanguage,
      targetLanguage: config.targetLanguage,
      input: elements.sourceText.value,
      translation: '',
      modelUsed: config.id,
      modelLoadTimeMs: getModelLoadTimeMs(),
      translationTimeMs: null,
      status: 'failed',
      error: error.message || String(error),
    }
  } finally {
    elements.unloadButton.disabled = !isModelLoaded()
    updateBusyState(false)
  }
}

elements.translateButton.addEventListener('click', translateFromInterface)
elements.sourceText.addEventListener('input', () => {
  elements.characterCount.textContent = `${elements.sourceText.value.length} / 20000 characters`
})
elements.sourceLanguage.addEventListener('change', updateSelectedModel)
elements.targetLanguage.addEventListener('change', updateSelectedModel)
elements.sourceLanguage.addEventListener('change', refreshGlossaryOptions)
elements.targetLanguage.addEventListener('change', refreshGlossaryOptions)
elements.swapButton.addEventListener('click', () => {
  const source = elements.sourceLanguage.value
  elements.sourceLanguage.value = elements.targetLanguage.value
  elements.targetLanguage.value = source
  const output = elements.translationOutput.textContent
  if (output && output !== 'Your translation will appear here.' && output !== 'No translation available.') {
    elements.sourceText.value = output
    elements.characterCount.textContent = `${output.length} / 20000 characters`
  }
  elements.translationOutput.textContent = 'Your translation will appear here.'
  elements.translationTime.textContent = 'Translation time will appear here.'
  updateSelectedModel()
})
elements.unloadButton.addEventListener('click', async () => {
  if (busy) return
  updateBusyState(true)
  elements.modelStatus.textContent = 'Releasing ONNX sessions…'
  try {
    await unloadTranslationModel()
    elements.loadTime.textContent = 'No model loaded'
    elements.modelStatus.textContent = 'Model unloaded. No model sessions are being kept in memory.'
    elements.progress.value = 0
    elements.progressPercent.textContent = ''
  } catch (error) {
    showError(`Could not unload the model cleanly: ${error.message}`)
  } finally {
    updateBusyState(false)
  }
})

function outputHasTargetScript(text, languageCode) {
  if (languageCode === 'tam_Taml') return /[\u0b80-\u0bff]/u.test(text)
  if (languageCode === 'kan_Knda') return /[\u0c80-\u0cff]/u.test(text)
  return /[A-Za-z]/u.test(text)
}

const SMOKE_CASES = [
  { sourceLanguage: 'eng_Latn', targetLanguage: 'tam_Taml', input: 'How are you today?' },
  { sourceLanguage: 'eng_Latn', targetLanguage: 'kan_Knda', input: 'I am going to college.' },
  { sourceLanguage: 'tam_Taml', targetLanguage: 'eng_Latn', input: 'நான் இன்று கல்லூரிக்குச் செல்கிறேன்.' },
  { sourceLanguage: 'kan_Knda', targetLanguage: 'eng_Latn', input: 'ನಾನು ಇಂದು ಕಾಲೇಜಿಗೆ ಹೋಗುತ್ತಿದ್ದೇನೆ.' },
  { sourceLanguage: 'tam_Taml', targetLanguage: 'kan_Knda', input: 'வணக்கம், நீங்கள் எப்படி இருக்கிறீர்கள்?' },
  { sourceLanguage: 'kan_Knda', targetLanguage: 'tam_Taml', input: 'ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?' },
]

async function executeSmokeCase(testCase) {
  const config = getModelConfig(testCase.sourceLanguage, testCase.targetLanguage)
  const result = await translateWithNLP({ text: testCase.input, sourceLanguage: config.sourceLanguage, targetLanguage: config.targetLanguage, onProgress: showProgress })
  const correctScript = outputHasTargetScript(result.translation, testCase.targetLanguage)
  return {
    sourceLanguage: testCase.sourceLanguage,
    targetLanguage: testCase.targetLanguage,
    input: testCase.input,
    translation: result.translation,
    modelUsed: config.id,
    modelLoadTimeMs: getModelLoadTimeMs(),
    translationTimeMs: result.translationTimeMs,
    sourceTokenCount: result.sourceTokenCount,
    chunkCount: result.chunkCount,
    warnings: result.warnings,
    totalTokens: result.totalTokens,
    targetScriptCheck: correctScript ? 'passed' : 'failed',
    status: correctScript ? 'passed' : 'failed',
    ...(!correctScript ? { error: `Output did not contain the expected ${LANGUAGES[testCase.targetLanguage]} script.` } : {}),
  }
}

async function runSmokeTests() {
  const results = []
  for (let index = 0; index < SMOKE_CASES.length; index += 1) {
    const testCase = SMOKE_CASES[index]
    window.__trilinguaSmokeProgress = { index: index + 1, total: SMOKE_CASES.length, sourceLanguage: testCase.sourceLanguage, targetLanguage: testCase.targetLanguage, state: 'running' }
    elements.sourceLanguage.value = testCase.sourceLanguage
    elements.targetLanguage.value = testCase.targetLanguage
    elements.sourceText.value = testCase.input
    updateSelectedModel()
    let result
    try {
      result = await executeSmokeCase(testCase)
    } catch (error) {
      const config = getModelConfig(testCase.sourceLanguage, testCase.targetLanguage)
      result = {
        ...testCase,
        translation: '',
        modelUsed: config.id,
        modelLoadTimeMs: getModelLoadTimeMs(),
        translationTimeMs: null,
        targetScriptCheck: 'not run',
        status: 'failed',
        error: error.message || String(error),
      }
    }
    results.push(result)
    window.__trilinguaSmokeProgress = { ...window.__trilinguaSmokeProgress, state: result.status }
  }
  const summary = {
    testType: 'Preliminary model smoke tests',
    generatedAt: new Date().toISOString(),
    executionBackend: 'ONNX Runtime Web WASM, one thread',
    results,
    passed: results.filter((result) => result.status === 'passed').length,
    failed: results.filter((result) => result.status !== 'passed').length,
  }
  elements.smokeOutput.hidden = false
  elements.smokeOutput.textContent = JSON.stringify(summary, null, 2)
  return summary
}

async function runOfflineRefreshTest() {
  const testCase = SMOKE_CASES[0]
  const config = getModelConfig(testCase.sourceLanguage, testCase.targetLanguage)
  const result = await translateWithNLP({ text: testCase.input, sourceLanguage: config.sourceLanguage, targetLanguage: config.targetLanguage, onProgress: showProgress })
  return {
    ...testCase,
    translation: result.translation,
    modelUsed: config.id,
    modelLoadTimeMs: getModelLoadTimeMs(),
    translationTimeMs: result.translationTimeMs,
    status: outputHasTargetScript(result.translation, testCase.targetLanguage) ? 'passed' : 'failed',
  }
}

async function runMarkerPreservationTests() {
  const checks = []
  for (const [sourceLanguage, targetLanguage] of [
    ['eng_Latn', 'tam_Taml'], ['eng_Latn', 'kan_Knda'], ['tam_Taml', 'eng_Latn'],
    ['kan_Knda', 'eng_Latn'], ['tam_Taml', 'kan_Knda'], ['kan_Knda', 'tam_Taml'],
  ]) {
    const config = getModelConfig(sourceLanguage, targetLanguage)
    const entityMarker = `ZXQENTITYQSTAGE3Q${checks.length}QXZ`
    const glossaryMarker = `ZXQGLOSSARYQSTAGE3Q${checks.length}QXZ`
    try {
      const result = await translateText(`Keep ${entityMarker} and ${glossaryMarker} exactly.`, config, showProgress)
      const entityPreserved = result.translation.split(entityMarker).length - 1 === 1
      const glossaryPreserved = result.translation.split(glossaryMarker).length - 1 === 1
      const preserved = entityPreserved && glossaryPreserved
      checks.push({ sourceLanguage, targetLanguage, modelFamily: config.id, entityMarker, glossaryMarker, entityPreserved, glossaryPreserved, translation: result.translation, preserved, status: preserved ? 'passed' : 'failed' })
    } catch (error) {
      checks.push({ sourceLanguage, targetLanguage, modelFamily: config.id, entityMarker, glossaryMarker, entityPreserved: false, glossaryPreserved: false, preserved: false, status: 'failed', error: error.message })
    }
  }
  const entityTests = []
  for (const check of checks.filter((item) => item.entityPreserved)) {
    const config = getModelConfig(check.sourceLanguage, check.targetLanguage)
    const entityInput = check.sourceLanguage === 'eng_Latn'
      ? 'Visit https://example.com/path and email student@example.com on 25/11/2026.'
      : 'TRI2026A001 25/11/2026'
    try {
      const protectedValue = protectEntities(entityInput)
      const result = await translateText(protectedValue.protectedText, config, showProgress)
      const restored = restoreEntities(result.translation, protectedValue.entityMap)
      const exactRestoration = restored.restored && protectedValue.entityMap.every((item) => restored.text.includes(item.value))
      entityTests.push({ sourceLanguage: check.sourceLanguage, targetLanguage: check.targetLanguage, modelFamily: config.id, input: entityInput, entities: protectedValue.entityMap.map(({ type, value, marker }) => ({ type, value, marker })), translation: result.translation, restoredText: restored.text, exactRestoration, status: exactRestoration ? 'passed' : 'failed', warning: restored.warning })
    } catch (error) {
      entityTests.push({ sourceLanguage: check.sourceLanguage, targetLanguage: check.targetLanguage, modelFamily: config.id, input: entityInput, exactRestoration: false, status: 'failed', error: error.message })
    }
  }
  const glossaryTests = []
  for (const check of checks.filter((item) => item.glossaryPreserved)) {
    const entries = getGlossary(check.sourceLanguage, check.targetLanguage)
    const entry = entries[0]
    if (!entry) continue
    try {
      const config = getModelConfig(check.sourceLanguage, check.targetLanguage)
      const protectedValue = matchGlossaryTerms(entry.sourceTerm, check.sourceLanguage, check.targetLanguage)
      const result = await translateText(protectedValue.protectedText, config, showProgress)
      const restored = restoreGlossaryTerms(result.translation, protectedValue.matches)
      const exactTargetPresent = restored.restored && restored.text.includes(entry.targetTerm)
      glossaryTests.push({ sourceLanguage: check.sourceLanguage, targetLanguage: check.targetLanguage, modelFamily: config.id, sourceTerm: entry.sourceTerm, targetTerm: entry.targetTerm, marker: protectedValue.matches[0]?.marker, translation: result.translation, restoredText: restored.text, exactTargetPresent, status: exactTargetPresent ? 'passed' : 'failed', warning: restored.warning })
    } catch (error) {
      glossaryTests.push({ sourceLanguage: check.sourceLanguage, targetLanguage: check.targetLanguage, sourceTerm: entry.sourceTerm, targetTerm: entry.targetTerm, exactTargetPresent: false, status: 'failed', error: error.message })
    }
  }
  const supportGateChecks = checks.map((check) => {
    const direction = `${check.sourceLanguage}>${check.targetLanguage}`
    const entityTest = entityTests.find((item) => `${item.sourceLanguage}>${item.targetLanguage}` === direction)
    const glossaryTest = glossaryTests.find((item) => `${item.sourceLanguage}>${item.targetLanguage}` === direction)
    const expectedEntitySupport = entityTest?.status === 'passed'
    const expectedGlossarySupport = glossaryTest?.status === 'passed'
    const actualEntitySupport = entityMarkersSupported(check.sourceLanguage, check.targetLanguage)
    const actualGlossarySupport = glossaryMarkersSupported(check.sourceLanguage, check.targetLanguage)
    const matches = expectedEntitySupport === actualEntitySupport && expectedGlossarySupport === actualGlossarySupport
    return { sourceLanguage: check.sourceLanguage, targetLanguage: check.targetLanguage, expectedEntitySupport, actualEntitySupport, expectedGlossarySupport, actualGlossarySupport, matches, status: matches ? 'passed' : 'failed' }
  })
  return {
    checks,
    supportedDirections: [],
    entitySupportedDirections: entityTests.filter((item) => item.status === 'passed').map((item) => `${item.sourceLanguage}>${item.targetLanguage}`),
    glossarySupportedDirections: glossaryTests.filter((item) => item.status === 'passed').map((item) => `${item.sourceLanguage}>${item.targetLanguage}`),
    entityTests,
    glossaryTests,
    supportGateChecks,
  }
}

async function runLongInputTokenizationTest() {
  const sourceLanguage = 'eng_Latn'
  const targetLanguage = 'tam_Taml'
  const config = getModelConfig(sourceLanguage, targetLanguage)
  const input = Array.from({ length: 80 }, (_, index) => `Robotics sentence number ${index + 1} tests safe grouping.`).join(' ')
  await countSourceTokens('x', config)
  const maxTokens = getModelMaxSourceTokens()
  const chunks = await segmentText(input, {
    language: 'en',
    maxTokens,
    reserveTokens: 0,
    tokenCounter: (candidate) => countSourceTokens(candidate, config),
  })
  const tokenCounts = await Promise.all(chunks.map((chunk) => countSourceTokens(chunk, config)))
  const withinLimit = tokenCounts.every((count) => count <= maxTokens)
  return {
    name: 'Long input is chunked under actual tokenizer limit',
    input: '[80 short English sentences; actual input retained in local test only]',
    expected: `More than one chunk, each at most ${maxTokens} model source tokens`,
    actual: { chunkCount: chunks.length, maxSourceTokens: maxTokens, sourceTokenCounts: tokenCounts },
    status: chunks.length > 1 && withinLimit ? 'passed' : 'failed',
  }
}

function refreshGlossaryOptions() {
  const entries = getGlossary(elements.sourceLanguage.value, elements.targetLanguage.value)
  elements.glossarySelect.replaceChildren(...entries.map((entry) => new Option(`${entry.sourceTerm} → ${entry.targetTerm}${entry.sample ? ' (sample)' : ''}`, entry.id)))
  elements.glossarySource.value = ''
  elements.glossaryTarget.value = ''
}

elements.glossarySelect.addEventListener('change', () => {
  const selected = getGlossary(elements.sourceLanguage.value, elements.targetLanguage.value).find((item) => item.id === elements.glossarySelect.value)
  if (selected) { elements.glossarySource.value = selected.sourceTerm; elements.glossaryTarget.value = selected.targetTerm }
})
elements.glossarySave.addEventListener('click', () => {
  try {
    const current = getGlossary(elements.sourceLanguage.value, elements.targetLanguage.value).find((item) => item.id === elements.glossarySelect.value)
    const entry = { sourceLanguage: elements.sourceLanguage.value, targetLanguage: elements.targetLanguage.value, sourceTerm: elements.glossarySource.value, targetTerm: elements.glossaryTarget.value, enabled: true }
    if (current && !current.sample) updateGlossaryEntry(current.id, entry)
    else addGlossaryEntry(entry)
    refreshGlossaryOptions()
    clearError()
  } catch (error) { showError(error.message) }
})
elements.glossaryDelete.addEventListener('click', () => {
  const id = elements.glossarySelect.value
  if (id && !id.startsWith('sample-')) deleteGlossaryEntry(id)
  refreshGlossaryOptions()
})
elements.glossaryReset.addEventListener('click', () => { resetUserGlossary(); refreshGlossaryOptions() })
elements.spellingButton.addEventListener('click', () => {
  const words = elements.sourceText.value.match(/[A-Za-z]+/gu) ?? []
  const glossaryEnglishTerms = [
    ...getGlossary('eng_Latn', 'tam_Taml').map((entry) => entry.sourceTerm),
    ...getGlossary('eng_Latn', 'kan_Knda').map((entry) => entry.sourceTerm),
    ...getGlossary('tam_Taml', 'eng_Latn').map((entry) => entry.targetTerm),
    ...getGlossary('kan_Knda', 'eng_Latn').map((entry) => entry.targetTerm),
  ].filter((term) => /^[A-Za-z]+$/u.test(term))
  const dictionary = [...new Set([...ENGLISH_VOCABULARY, ...glossaryEnglishTerms])]
  const suggestions = words.flatMap((word) => suggestCorrections(word, dictionary).map((item) => `${word} → ${item.word}`))
  elements.spellingOutput.textContent = suggestions.join(' · ') || 'No suggestions from the small local list.'
})

async function runErrorHandlingChecks() {
  const validConfig = getModelConfig('eng_Latn', 'tam_Taml')
  const checks = []
  for (const [name, callback, expectedText] of [
    ['empty input', () => translateText('', validConfig), 'Enter text to translate'],
    ['long input', () => translateText('x'.repeat(20001), validConfig), 'exceeds 20000'],
    ['same language route', () => getModelConfig('tam_Taml', 'tam_Taml'), 'must be different'],
  ]) {
    try {
      await callback()
      checks.push({ name, status: 'failed', error: 'Expected validation to reject this input.' })
    } catch (error) {
      const clear = error.message.toLowerCase().includes(expectedText.toLowerCase())
      checks.push({ name, status: clear ? 'passed' : 'failed', error: error.message })
    }
  }

  const invalidPath = {
    ...validConfig,
    id: 'invalid-model-path-test',
    modelConfigPath: '/missing-model-folder/config.json',
  }
  try {
    await loadTranslationModel(invalidPath)
    checks.push({ name: 'invalid model path', status: 'failed', error: 'Expected a missing local config to fail.' })
  } catch (error) {
    const clear = error.message.includes('/missing-model-folder/config.json') && /HTML|not valid JSON|unavailable|not found/i.test(error.message)
    checks.push({ name: 'invalid model path', status: clear ? 'passed' : 'failed', error: error.message })
  }

  const missingSidecar = {
    ...validConfig,
    id: 'missing-sidecar-test',
    externalDataByGraph: {
      ...validConfig.externalDataByGraph,
      [validConfig.graphs.encoder]: ['missing-encoder-weights.onnx.data'],
    },
  }
  try {
    await loadTranslationModel(missingSidecar)
    checks.push({ name: 'missing ONNX sidecar', status: 'failed', error: 'Expected the missing sidecar to fail.' })
  } catch (error) {
    const clear = error.message.includes('missing-encoder-weights.onnx.data') && /HTML|unavailable|missing/i.test(error.message)
    checks.push({ name: 'missing ONNX sidecar', status: clear ? 'passed' : 'failed', error: error.message })
  }

  const unloadedBeforeRetry = !isModelLoaded()
  let retryStatus = 'failed'
  let retryError
  try {
    const retry = await translateText('How are you today?', validConfig, showProgress)
    retryStatus = outputHasTargetScript(retry.translation, 'tam_Taml') ? 'passed' : 'failed'
  } catch (error) {
    retryError = error.message
  }
  checks.push({
    name: 'model not loaded then lazy-load',
    status: unloadedBeforeRetry && retryStatus === 'passed' ? 'passed' : 'failed',
    unloadedBeforeRetry,
    retryStatus,
    ...(retryError ? { error: retryError } : {}),
  })
  return { checks, passed: checks.filter((check) => check.status === 'passed').length, failed: checks.filter((check) => check.status !== 'passed').length }
}

window.__trilinguaRunSmokeTests = runSmokeTests
window.__trilinguaRunOfflineRefreshTest = runOfflineRefreshTest
window.__trilinguaRunErrorHandlingChecks = runErrorHandlingChecks
window.__trilinguaRunMarkerPreservationTests = runMarkerPreservationTests
window.__trilinguaRunLongInputTokenizationTest = runLongInputTokenizationTest
window.__trilinguaSmokePromise = null
window.__trilinguaSmokeProgress = null
updateSelectedModel()
refreshGlossaryOptions()

if (new URLSearchParams(window.location.search).get('run-smoke') === '1') {
  window.__trilinguaSmokePromise = runSmokeTests()
    .catch((error) => ({
      testType: 'Preliminary model smoke tests',
      fatalError: error.message || String(error),
      results: [],
      passed: 0,
      failed: SMOKE_CASES.length,
    }))
    .then((result) => {
      window.__trilinguaSmokeResult = result
      window.__trilinguaSmokePromiseSettled = true
      return result
    })
}

// Expose small read-only diagnostics for the local smoke runner.
window.__trilinguaDiagnostics = () => ({
  loadedModelId: getLoadedModelId(),
  isModelLoaded: isModelLoaded(),
  externalModelBase: '/indictrans2/',
})
