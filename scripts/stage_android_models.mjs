import { cp, mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const families = [
  'en-indic-200m-fp32',
  'indic-en-200m-fp32',
  'indic-indic-320m-fp32',
]
const graphNames = [
  'encoder_model.onnx',
  'decoder_model.onnx',
  'decoder_with_past_model.onnx',
]
const dist = path.join(root, 'dist')

for (const family of families) {
  const source = path.join(root, 'models', 'quantized', family)
  const destination = path.join(dist, 'quantized', family)
  if (!path.resolve(destination).startsWith(`${path.resolve(dist)}${path.sep}`)) {
    throw new Error(`Refusing to stage model files outside dist: ${destination}`)
  }

  const entries = await readdir(source, { withFileTypes: true })
  const names = entries.map((entry) => entry.name).sort()
  const required = [
    'config.json', 'generation_config.json', 'tokenizer_config.json',
    'tokenizer_meta.json', 'tokenizer_src.json', 'tokenizer_tgt.json',
    ...graphNames,
    ...graphNames.map((name) => `${name}.data`),
  ]
  const missing = required.filter((name) => !names.includes(name))
  const unexpected = entries.filter((entry) =>
    !entry.isFile() || !/\.(?:onnx|data|json)$/u.test(entry.name),
  )
  if (missing.length || unexpected.length) {
    throw new Error(`Unexpected ${family} contents. Missing: ${missing.join(', ') || 'none'}; invalid: ${unexpected.map((entry) => entry.name).join(', ') || 'none'}`)
  }

  await mkdir(destination, { recursive: true })
  let totalBytes = 0
  for (const name of names) {
    const input = path.join(source, name)
    await cp(input, path.join(destination, name))
    totalBytes += (await stat(input)).size
  }
  console.log(`Staged ${family}: ${names.length} files, ${(totalBytes / 1e6).toFixed(3)} MB, dist/quantized/${family}/`)
  console.log(`  ${names.join(', ')}`)
}
