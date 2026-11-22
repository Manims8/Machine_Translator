import { getModelConfig } from './modelRouter.js'
import { validateInput, normalizeWhitespace } from './preprocessing.js'
import { segmentText } from './sentenceSegmenter.js'
import { detectEntities, protectEntities, restoreEntities } from './entityProtection.js'
import { getGlossary, matchGlossaryTerms, restoreGlossaryTerms } from './glossary.js'
import { entityMarkersSupported, glossaryMarkersSupported } from './markerSupport.js'
import { postprocessText } from './postprocessing.js'
import {
  countSourceTokens,
  getModelMaxSourceTokens,
  getModelLoadTimeMs,
  translateText,
} from './translator.js'

const LANGUAGE_LOCALE = { eng_Latn: 'en', tam_Taml: 'ta', kan_Knda: 'kn' }

export async function translateWithNLP({ text, sourceLanguage, targetLanguage, onProgress = () => {} }) {
  const validation = validateInput(text, sourceLanguage, targetLanguage)
  if (!validation.valid) throw new Error(validation.errors.join(' '))
  const normalizedText = validation.normalizedText
  const config = getModelConfig(sourceLanguage, targetLanguage)
  const warnings = [...validation.warnings]
  const entityList = detectEntities(normalizedText)
  const glossaryEntries = getGlossary(sourceLanguage, targetLanguage)
  const entitySupport = entityMarkersSupported(sourceLanguage, targetLanguage)
  const glossarySupport = glossaryMarkersSupported(sourceLanguage, targetLanguage)
  if (entityList.length && !entitySupport) warnings.push('Entity protection is disabled for this direction because entity marker preservation has not been verified.')
  if (glossaryEntries.length && !glossarySupport) warnings.push('Glossary is reference-only for this direction because glossary marker preservation has not been verified.')

  // Load the model first so loading time is not counted as preprocessing.
  await countSourceTokens('x', config)
  const maxTokens = getModelMaxSourceTokens()
  if (!Number.isInteger(maxTokens) || maxTokens < 1) throw new Error('The loaded model did not expose a valid maximum source token length.')
  const preprocessingStarted = performance.now()
  const paragraphGroups = normalizedText.split(/\n+/u).map((paragraph) => paragraph.trim()).filter(Boolean)
  const chunks = []
  const paragraphChunkCounts = []
  for (const paragraph of paragraphGroups) {
    const paragraphChunks = await segmentText(paragraph, {
      language: LANGUAGE_LOCALE[sourceLanguage],
      maxTokens,
      tokenCounter: (candidate) => countSourceTokens(candidate, config),
      reserveTokens: 0, // countSourceTokens includes both language tags
    })
    chunks.push(...paragraphChunks)
    paragraphChunkCounts.push(paragraphChunks.length)
  }
  const preprocessingTimeMs = performance.now() - preprocessingStarted
  const translationStarted = performance.now()
  const translatedChunks = []
  let sourceTokenCount = 0
  let generatedTokenCount = 0
  let entityProtectionSucceeded = !entityList.length || entitySupport
  let glossaryApplied = false
  const chunkEntityDetails = []
  const chunkGlossaryDetails = []

  for (const chunk of chunks) {
    const entity = entitySupport ? protectEntities(chunk) : { protectedText: chunk, entityMap: [], detectedEntities: detectEntities(chunk) }
    const glossary = glossarySupport
      ? matchGlossaryTerms(entity.protectedText, sourceLanguage, targetLanguage)
      : { protectedText: entity.protectedText, matches: [] }
    const protectedTokenCount = await countSourceTokens(glossary.protectedText, config)
    if (protectedTokenCount > maxTokens) {
      throw new Error(`A protected input chunk is ${protectedTokenCount} tokens, above this model's ${maxTokens}-token limit. Shorten the text or disable protection for this direction.`)
    }
    const result = await translateText(glossary.protectedText, config, onProgress)
    sourceTokenCount += result.sourceTokenCount
    generatedTokenCount += result.totalTokens
    let translated = result.translation
    if (entitySupport && entity.entityMap.length) {
      const restored = restoreEntities(translated, entity.entityMap)
      entityProtectionSucceeded &&= restored.restored
      if (!restored.restored) warnings.push(restored.warning)
      translated = restored.text
    }
    if (glossarySupport && glossary.matches.length) {
      const restored = restoreGlossaryTerms(translated, glossary.matches)
      glossaryApplied ||= restored.restored && glossary.matches.length > 0
      if (!restored.restored) warnings.push(restored.warning)
      translated = restored.text
    }
    chunkEntityDetails.push(...entity.detectedEntities)
    chunkGlossaryDetails.push(...glossary.matches.map(({ original, targetTerm }) => ({ sourceTerm: original, targetTerm })))
    translatedChunks.push(translated)
  }

  const translationTimeMs = performance.now() - translationStarted
  const postprocessingStarted = performance.now()
  // Keep paragraph boundaries. Chunk splitting within a paragraph rejoins with
  // one space; segmentation exposes paragraph boundaries as separate groups.
  const outputGroups = []
  let outputIndex = 0
  for (const chunkCount of paragraphChunkCounts) {
    outputGroups.push(translatedChunks.slice(outputIndex, outputIndex + chunkCount).join(' '))
    outputIndex += chunkCount
  }
  const translation = normalizeWhitespace(postprocessText(outputGroups.join('\n\n'), targetLanguage))
  const postprocessingTimeMs = performance.now() - postprocessingStarted

  return {
    translation,
    sourceLanguage,
    targetLanguage,
    modelFamily: config.id,
    sourceTokenCount,
    generatedTokenCount,
    chunkCount: chunks.length,
    sentenceCount: normalizedText.match(/[.!?。？！।]+(?=\s|$)/gu)?.length || (normalizedText ? 1 : 0),
    originalText: text,
    normalizedText,
    detectedEntities: entityList,
    entityProtectionEnabled: entitySupport,
    entityProtectionSucceeded,
    glossaryProtectionEnabled: glossarySupport,
    glossaryApplied,
    glossaryReferenceCount: glossaryEntries.length,
    appliedGlossaryTerms: chunkGlossaryDetails,
    preprocessingTimeMs,
    translationTimeMs,
    postprocessingTimeMs,
    modelLoadTimeMs: getModelLoadTimeMs(),
    warnings: [...new Set(warnings)],
  }
}
