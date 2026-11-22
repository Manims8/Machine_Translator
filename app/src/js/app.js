import { LANGUAGES } from './language.js'
import { getModelConfig } from './modelRouter.js'
import {
  getModelLoadTimeMs,
  getLoadedModelId,
  isModelLoaded,
  loadTranslationModel,
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
    const result = await translateText(elements.sourceText.value, config, showProgress)
    elements.translationOutput.textContent = result.translation
    elements.translationTime.textContent = `Translation time: ${(result.totalTimeMs / 1000).toFixed(2)} s · ${result.totalTokens} tokens`
    const modelLoadTime = getModelLoadTimeMs()
    elements.loadTime.textContent = modelLoadTime === null
      ? 'Model load time unavailable'
      : `Model loaded in ${(modelLoadTime / 1000).toFixed(1)} s`
    elements.unloadButton.disabled = false
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
  elements.characterCount.textContent = `${elements.sourceText.value.length} / 5000 characters`
})
elements.sourceLanguage.addEventListener('change', updateSelectedModel)
elements.targetLanguage.addEventListener('change', updateSelectedModel)
elements.swapButton.addEventListener('click', () => {
  const source = elements.sourceLanguage.value
  elements.sourceLanguage.value = elements.targetLanguage.value
  elements.targetLanguage.value = source
  const output = elements.translationOutput.textContent
  if (output && output !== 'Your translation will appear here.' && output !== 'No translation available.') {
    elements.sourceText.value = output
    elements.characterCount.textContent = `${output.length} / 5000 characters`
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
  const result = await translateText(testCase.input, config, showProgress)
  const correctScript = outputHasTargetScript(result.translation, testCase.targetLanguage)
  return {
    sourceLanguage: testCase.sourceLanguage,
    targetLanguage: testCase.targetLanguage,
    input: testCase.input,
    translation: result.translation,
    modelUsed: config.id,
    modelLoadTimeMs: getModelLoadTimeMs(),
    translationTimeMs: result.totalTimeMs,
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
  const result = await translateText(testCase.input, config, showProgress)
  return {
    ...testCase,
    translation: result.translation,
    modelUsed: config.id,
    modelLoadTimeMs: getModelLoadTimeMs(),
    translationTimeMs: result.totalTimeMs,
    status: outputHasTargetScript(result.translation, testCase.targetLanguage) ? 'passed' : 'failed',
  }
}

async function runErrorHandlingChecks() {
  const validConfig = getModelConfig('eng_Latn', 'tam_Taml')
  const checks = []
  for (const [name, callback, expectedText] of [
    ['empty input', () => translateText('', validConfig), 'Enter text to translate'],
    ['long input', () => translateText('x'.repeat(5001), validConfig), 'too long'],
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
window.__trilinguaSmokePromise = null
window.__trilinguaSmokeProgress = null
updateSelectedModel()

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
