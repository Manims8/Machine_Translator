import { spawn } from 'node:child_process'
import { access, appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const evaluationRoot = path.join(root, 'evaluation')
const pairs = [
  ['eng_Latn', 'tam_Taml'], ['eng_Latn', 'kan_Knda'],
  ['tam_Taml', 'eng_Latn'], ['kan_Knda', 'eng_Latn'],
  ['tam_Taml', 'kan_Knda'], ['kan_Knda', 'tam_Taml'],
]
const modelByDirection = {
  'eng_Latn-tam_Taml': 'en-indic-200m', 'eng_Latn-kan_Knda': 'en-indic-200m',
  'tam_Taml-eng_Latn': 'indic-en-200m', 'kan_Knda-eng_Latn': 'indic-en-200m',
  'tam_Taml-kan_Knda': 'indic-indic-320m', 'kan_Knda-tam_Taml': 'indic-indic-320m',
}

function args() {
  const values = new Set(process.argv.slice(2))
  const value = (name) => process.argv.find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1)
  const max = value('--max-sentences')
  if (max !== undefined && (!/^\d+$/.test(max) || Number(max) < 1 || Number(max) > 1012)) throw new Error('--max-sentences must be between 1 and 1012.')
  return { execute: values.has('--execute'), maxSentences: max ? Number(max) : 1012, direction: value('--direction'), outputDir: value('--output-dir'), idsFile: value('--ids-file'), models: value('--models') }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function unusedPort() {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}
async function findBrowser() {
  const candidates = [process.env.CHROME_PATH, process.env.EDGE_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean)
  for (const candidate of candidates) { try { await access(candidate); return candidate } catch {} }
  throw new Error('Chrome/Edge not found. Set CHROME_PATH or EDGE_PATH.')
}
function stop(handle) {
  if (!handle) return Promise.resolve()
  if (process.platform !== 'win32') { handle.kill('SIGTERM'); return Promise.resolve() }
  return new Promise((resolve) => { const killer = spawn('taskkill', ['/PID', String(handle.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); killer.once('exit', resolve); setTimeout(resolve, 5000).unref() })
}
async function waitFor(url, handle) {
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) { if (handle.exitCode !== null) throw new Error('Vite exited before becoming ready.'); try { if ((await fetch(url)).ok) return } catch {} await delay(300) }
  throw new Error(`Timed out waiting for ${url}`)
}
class Cdp {
  constructor(socket) { this.socket = socket; this.next = 1; this.pending = new Map(); this.listeners = new Map(); socket.addEventListener('message', ({ data }) => { const message = JSON.parse(String(data)); const pending = this.pending.get(message.id); if (pending) { this.pending.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); return } for (const listener of this.listeners.get(message.method) ?? []) listener(message.params) }) }
  on(method, listener) { const listeners = this.listeners.get(method) ?? []; listeners.push(listener); this.listeners.set(method, listeners) }
  send(method, params = {}) { const id = this.next++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })) }) }
  async evaluate(expression, awaitPromise = false) { const result = await this.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text); return result.result?.value }
}
async function connectBrowser(url) {
  const browserPath = await findBrowser(); const port = await unusedPort(); const profile = await import('node:fs/promises').then(({ mkdtemp }) => mkdtemp(path.join(os.tmpdir(), 'trilingua-batch-')))
  const browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-sync', '--disable-extensions', '--no-sandbox', '--enable-precise-memory-info', '--remote-allow-origins=*', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1', 'about:blank'], { windowsHide: true, stdio: 'ignore' })
  const base = `http://127.0.0.1:${port}`; let version
  for (let i = 0; i < 120; i += 1) { try { const response = await fetch(`${base}/json/version`); if (response.ok) { version = await response.json(); break } } catch {} await delay(250) }
  if (!version) { await stop(browser); throw new Error('Timed out waiting for browser DevTools.') }
  const target = await (await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json(); const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  return { browser, cdp: new Cdp(socket), profile }
}
async function readJsonl(file) { return (await readFile(file, 'utf8')).split(/\r?\n/u).filter(Boolean).map((line, index) => { try { return JSON.parse(line) } catch (error) { throw new Error(`${file}:${index + 1}: malformed JSON (${error.message})`) } }) }
async function atomicJson(file, value) { const temp = `${file}.tmp-${process.pid}`; await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(temp, file) }
async function atomicJsonl(file, rows) { const temp = `${file}.tmp-${process.pid}`; await writeFile(temp, `${rows.map((item) => JSON.stringify(item)).join('\n')}\n`, 'utf8'); await rename(temp, file) }
async function loadExisting(file, referenceIds) {
  try { await access(file) } catch { return new Map() }
  const rows = await readJsonl(file); const map = new Map()
  for (const row of rows) { if (!referenceIds.has(row.id)) throw new Error(`${file}: prediction ID ${row.id} is not in the reference set.`); if (map.has(row.id)) throw new Error(`${file}: duplicate prediction ID ${row.id}.`); map.set(row.id, row) }
  return map
}
async function main() {
  const options = args();
  if (options.direction && !pairs.some(([src, tgt]) => `${src}-${tgt}` === options.direction)) throw new Error(`Unsupported direction: ${options.direction}`)
  const selected = options.direction ? pairs.filter(([src, tgt]) => `${src}-${tgt}` === options.direction) : pairs
  const outputDir = path.resolve(root, options.outputDir ?? path.join('evaluation', 'predictions'))
  const testRun = options.maxSentences < 1012 || options.outputDir
  let sampleIds = null
  if (options.idsFile) {
    sampleIds = JSON.parse(await readFile(path.resolve(root, options.idsFile), 'utf8'))
    if (!Array.isArray(sampleIds) || sampleIds.some((id) => !Number.isInteger(id)) || new Set(sampleIds).size !== sampleIds.length) throw new Error('--ids-file must contain a JSON array of unique integer IDs.')
  }
  if (!options.execute) {
    const runtimeDir = testRun && options.outputDir ? outputDir : evaluationRoot
    const plannedSentences = sampleIds?.length ?? options.maxSentences
    console.log(JSON.stringify({ mode: 'dry-run', directions: selected.map(([src, tgt]) => `${src}-${tgt}`), sentencesPerDirection: plannedSentences, totalAttempts: selected.length * plannedSentences, sampleIdsFile: options.idsFile ?? null, models: options.models ?? 'default', outputDir, checkpoint: testRun && options.outputDir ? path.join(runtimeDir, 'checkpoint.json') : path.join(runtimeDir, 'checkpoints', 'full_benchmark_checkpoint.json'), failureReport: testRun && options.outputDir ? path.join(runtimeDir, 'failed_predictions.json') : path.join(runtimeDir, 'results', 'failed_predictions.json'), browserRequired: true, externalNetwork: 'blocked' }, null, 2)); return
  }
  if (testRun && !options.outputDir) throw new Error('Test-limited execution requires --output-dir so benchmark artifacts cannot be touched.')
  await mkdir(outputDir, { recursive: true }); const checkpointDir = path.join(evaluationRoot, 'checkpoints'); const logDir = path.join(evaluationRoot, 'logs'); await mkdir(checkpointDir, { recursive: true }); await mkdir(logDir, { recursive: true })
  const checkpointFile = testRun ? path.join(outputDir, 'checkpoint.json') : path.join(checkpointDir, 'full_benchmark_checkpoint.json'); const logFile = testRun ? path.join(outputDir, 'run.log') : path.join(logDir, 'full_benchmark.log'); const failureFile = testRun ? path.join(outputDir, 'failed_predictions.json') : path.join(evaluationRoot, 'results', 'failed_predictions.json')
  const checkpoint = { version: 1, mode: testRun ? 'test' : 'full', startedAt: new Date().toISOString(), directions: {} }
  const runtimeMetricsFile = path.join(outputDir, 'runtime_metrics.json')
  const runtimeMetrics = { models: options.models ?? 'default', families: {} }
  const log = async (message) => { const line = `[${new Date().toISOString()}] ${message}\n`; process.stdout.write(line); await appendFile(logFile, line, 'utf8') }
  let browserContext
  try {
    for (const [src, tgt] of selected) {
      const direction = `${src}-${tgt}`; const referenceFile = path.join(evaluationRoot, 'references', `${direction}.jsonl`); const predictionFile = path.join(outputDir, `${direction}.jsonl`); const refs = await readJsonl(referenceFile)
      if (refs.length !== 1012 && options.maxSentences === 1012) throw new Error(`${referenceFile}: expected 1012 records, found ${refs.length}.`)
      const idSet = sampleIds ? new Set(sampleIds) : null
      const subset = idSet ? refs.filter((row) => idSet.has(row.id)) : refs.slice(0, options.maxSentences)
      if (idSet && subset.length !== idSet.size) throw new Error(`${direction}: reference set does not contain all ${idSet.size} requested sample IDs.`)
      const referenceIds = new Set(subset.map((row) => row.id)); const predictions = await loadExisting(predictionFile, referenceIds); checkpoint.directions[direction] = { completedIds: [...predictions.keys()], status: 'running' }; await atomicJson(checkpointFile, checkpoint); await log(`${direction}: ${predictions.size}/${subset.length} already persisted`)
      if (!browserContext) { const port = await unusedPort(); const vite = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run dev -- --host 127.0.0.1 --port ${port} --strictPort`], { cwd: root, windowsHide: true, stdio: 'ignore' }); await waitFor(`http://127.0.0.1:${port}/evaluation.html`, vite); const modelsQuery = options.models ? `&models=${encodeURIComponent(options.models)}` : ''; browserContext = await connectBrowser(`http://127.0.0.1:${port}/evaluation.html?batch=1${modelsQuery}`); browserContext.vite = vite; const browserErrors = []; browserContext.cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => browserErrors.push(exceptionDetails.exception?.description ?? exceptionDetails.text)); browserContext.cdp.on('Log.entryAdded', ({ entry }) => { if (entry.level === 'error') browserErrors.push(entry.text) }); await browserContext.cdp.send('Runtime.enable'); await browserContext.cdp.send('Performance.enable'); await browserContext.cdp.send('Log.enable'); const hookDeadline = Date.now() + 45_000; while (Date.now() < hookDeadline) { if (await browserContext.cdp.evaluate('typeof window.__trilinguaBatchTranslate === "function"')) break; await delay(250) } if (!(await browserContext.cdp.evaluate('typeof window.__trilinguaBatchTranslate === "function"'))) { const pageState = await browserContext.cdp.evaluate('JSON.stringify({readyState:document.readyState,title:document.title,url:location.href})'); throw new Error(`Batch translation hook did not initialize. ${browserErrors.join(' | ') || pageState}`) } }
      for (const row of subset) {
        if (predictions.has(row.id)) continue
        const started = Date.now(); const expression = `window.__trilinguaBatchTranslate(${JSON.stringify({ text: row.source, sourceLanguage: src, targetLanguage: tgt })})`; const response = await browserContext.cdp.evaluate(expression, true); const elapsed = Number(response.elapsedMs ?? Date.now() - started)
        if (response.ok && response.result?.translation?.trim()) { const result = response.result; predictions.set(row.id, { id: row.id, source: row.source, reference: row.reference, prediction: result.translation, source_language: src, target_language: tgt, model: result.modelFamily ?? modelByDirection[direction], translation_time_ms: elapsed, status: 'success', diagnostics: { sourceTokenCount: result.sourceTokenCount, generatedTokenCount: result.generatedTokenCount, chunkCount: result.chunkCount, warnings: result.warnings } }); await atomicJsonl(predictionFile, [...predictions.values()]); const family = modelByDirection[direction]; if (!runtimeMetrics.families[family]) { const heap = await browserContext.cdp.send('Runtime.getHeapUsage').catch((error) => ({ error: error.message })); const performanceResult = await browserContext.cdp.send('Performance.getMetrics').catch((error) => ({ error: error.message })); const metrics = Object.fromEntries((performanceResult.metrics ?? []).map((item) => [item.name, item.value])); runtimeMetrics.families[family] = { captured_after_sample_id: row.id, model_load_time_ms: result.modelLoadTimeMs ?? null, js_heap_used_bytes: metrics.JSHeapUsedSize ?? null, js_heap_total_bytes: metrics.JSHeapTotalSize ?? null, wasm_and_arraybuffer_backing_store_bytes: heap.backingStorageSize ?? null, renderer_private_memory_bytes: metrics.ProcessPrivateMemory ?? null, renderer_resident_set_bytes: metrics.ProcessResidentSet ?? null, cdp_heap_error: heap.error ?? null, cdp_performance_error: performanceResult.error ?? null, note: 'V8 backingStorageSize is a WASM/ArrayBuffer proxy, not an isolated ONNX WASM memory counter.' }; await atomicJson(runtimeMetricsFile, runtimeMetrics) } }
        else { const failures = await (async () => { try { return JSON.parse(await readFile(failureFile, 'utf8')) } catch { return [] } })(); const failureKey = `${direction}:${row.id}`; const nextFailures = failures.filter((item) => `${item.direction}:${item.id}` !== failureKey); nextFailures.push({ direction, id: row.id, source: row.source, error: response.error ?? 'empty translation', translation_time_ms: elapsed }); await atomicJson(failureFile, nextFailures); await log(`${direction}: FAILED id=${row.id}: ${response.error ?? 'empty translation'}`) }
        checkpoint.directions[direction] = { completedIds: [...predictions.keys()], status: 'running' }; await atomicJson(checkpointFile, checkpoint); await log(`${direction}: ${predictions.size}/${subset.length} successful; ${elapsed.toFixed(1)} ms`)
      }
      const missing = subset.filter((row) => !predictions.has(row.id)).map((row) => row.id); checkpoint.directions[direction] = { completedIds: [...predictions.keys()], missingIds: missing, status: missing.length ? 'failed' : 'complete' }; await atomicJson(checkpointFile, checkpoint); if (missing.length) throw new Error(`${direction}: ${missing.length} records failed; see failed_predictions.json.`); await log(`${direction}: complete ${predictions.size}/${subset.length}`)
    }
    checkpoint.status = 'complete'; await atomicJson(checkpointFile, checkpoint); await log('Benchmark run complete.')
  } finally { if (browserContext?.cdp?.socket) browserContext.cdp.socket.close(); await stop(browserContext?.browser); await stop(browserContext?.vite) }
}
main().catch((error) => { console.error(`[benchmark] ERROR: ${error.message}`); process.exitCode = 1 })
