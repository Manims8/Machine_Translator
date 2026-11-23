import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appUrl = "http://127.0.0.1:5173/?run-smoke=1&models=quantized";
const pipelineOutputPath = path.join(
  root,
  "evaluation",
  "nlp_pipeline_tests.json",
);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    process.env.EDGE_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next standard install location.
    }
  }
  throw new Error(
    "Could not find Microsoft Edge or Google Chrome. Set CHROME_PATH or EDGE_PATH to its executable.",
  );
}

async function unusedPort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

function stopProcess(processHandle) {
  if (!processHandle) return Promise.resolve();
  if (process.platform !== "win32") {
    processHandle.kill("SIGTERM");
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const killer = spawn(
      "taskkill",
      ["/PID", String(processHandle.pid), "/T", "/F"],
      { windowsHide: true, stdio: "ignore" },
    );
    killer.once("exit", resolve);
    setTimeout(resolve, 5000).unref();
  });
}

async function waitForHttp(url, processHandles, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processHandles.some((handle) => handle.exitCode !== null))
      throw new Error("The Vite server exited before it became ready.");
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await delay(350);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(String(data));
      if (message.id) {
        const waiting = this.pending.get(message.id);
        if (waiting) {
          this.pending.delete(message.id);
          if (message.error) waiting.reject(new Error(message.error.message));
          else waiting.resolve(message.result);
        }
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? [])
        listener(message.params);
    });
  }

  on(event, listener) {
    const items = this.listeners.get(event) ?? [];
    items.push(listener);
    this.listeners.set(event, items);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression, awaitPromise = false) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ??
          result.exceptionDetails.text,
      );
    }
    return result.result?.value;
  }
}

let vite;
let browser;
let devtools;
let profileDir;
const externalRequests = new Set();
const localRequests = new Set();
const localRuntimeRequests = new Set();
const browserErrors = [];

try {
  const browserPath = await findBrowser();
  vite = spawn(
    process.env.ComSpec ?? "cmd.exe",
    [
      "/d",
      "/s",
      "/c",
      "npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    ],
    {
      cwd: root,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  vite.stdout.on("data", (chunk) => process.stdout.write(`[vite] ${chunk}`));
  vite.stderr.on("data", (chunk) => process.stderr.write(`[vite] ${chunk}`));
  await waitForHttp(appUrl, [vite]);

  const requiredAssetChecks = [];
  for (const url of [
    "http://127.0.0.1:5173/quantized/en-indic-200m-fp32/encoder_model.onnx",
    "http://127.0.0.1:5173/quantized/en-indic-200m-fp32/encoder_model.onnx.data",
    "http://127.0.0.1:5173/quantized/en-indic-200m-fp32/decoder_model.onnx.data",
    "http://127.0.0.1:5173/quantized/en-indic-200m-fp32/decoder_with_past_model.onnx.data",
    "http://127.0.0.1:5173/quantized/en-indic-200m-fp32/tokenizer_src.json",
  ]) {
    const response = await fetch(url, { method: "HEAD" });
    requiredAssetChecks.push({
      url: new URL(url).pathname,
      status: response.status,
      contentLength: Number(response.headers.get("content-length") ?? 0),
    });
    if (
      !response.ok ||
      Number(response.headers.get("content-length") ?? 0) <= 0
    ) {
      throw new Error(
        `A required local model asset is not served correctly: ${url} returned ${response.status}.`,
      );
    }
  }

  const debugPort = await unusedPort();
  profileDir = await mkdtemp(
    path.join(os.tmpdir(), "trilingua-offline-smoke-"),
  );
  browser = spawn(
    browserPath,
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--disable-extensions",
      "--no-sandbox",
      "--remote-allow-origins=*",
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${debugPort}`,
      "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );

  const debugBase = `http://127.0.0.1:${debugPort}`;
  let versionInfo;
  const debugDeadline = Date.now() + 30_000;
  while (Date.now() < debugDeadline) {
    if (browser.exitCode !== null)
      throw new Error("The headless browser exited during startup.");
    try {
      const response = await fetch(`${debugBase}/json/version`);
      if (response.ok) {
        versionInfo = await response.json();
        break;
      }
    } catch {
      // Wait for the DevTools listener.
    }
    await delay(250);
  }
  if (!versionInfo)
    throw new Error("Timed out waiting for the browser DevTools endpoint.");

  const targetResponse = await fetch(
    `${debugBase}/json/new?${encodeURIComponent(appUrl)}`,
    { method: "PUT" },
  );
  if (!targetResponse.ok)
    throw new Error(
      `Could not create the browser page (${targetResponse.status}).`,
    );
  const target = await targetResponse.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  devtools = new DevTools(socket);
  devtools.on("Network.requestWillBeSent", ({ request }) => {
    try {
      const parsed = new URL(request.url);
      if (!["127.0.0.1", "localhost"].includes(parsed.hostname))
        externalRequests.add(parsed.origin);
      else {
        localRequests.add(`${parsed.origin}${parsed.pathname}`);
        if (/ort-wasm|ort\.wasm\.bundle/i.test(parsed.pathname))
          localRuntimeRequests.add(parsed.pathname);
      }
    } catch {
      // Ignore browser-internal URLs.
    }
  });
  devtools.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    browserErrors.push(
      exceptionDetails.exception?.description ?? exceptionDetails.text,
    );
  });
  devtools.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error") browserErrors.push(entry.text);
  });
  await devtools.send("Runtime.enable");
  await devtools.send("Network.enable");
  // Block HTTPS requests at the browser network layer as an additional offline
  // guard; the host resolver rule above also blocks external HTTP DNS lookups.
  await devtools.send("Network.setBlockedURLs", { urls: ["https://*/*"] });
  await devtools.send("Log.enable");
  await devtools.send("Page.enable");

  process.stdout.write(
    "\nRunning six translation directions in a browser with external DNS blocked; localhost remains available.\n",
  );
  let lastProgress = "";
  const deadline = Date.now() + 45 * 60_000;
  let smokeResult;
  while (Date.now() < deadline) {
    if (browser.exitCode !== null)
      throw new Error("The browser exited while translations were running.");
    const state = await devtools.evaluate(
      `window.__trilinguaSmokeProgress ? JSON.stringify(window.__trilinguaSmokeProgress) : ''`,
    );
    if (state && state !== lastProgress) {
      lastProgress = state;
      process.stdout.write(`[smoke] ${state}\n`);
    }
    const done = await devtools.evaluate(
      "Boolean(window.__trilinguaSmokePromise && window.__trilinguaSmokePromiseSettled)",
    );
    if (done) {
      smokeResult = await devtools.evaluate(
        "window.__trilinguaSmokeResult",
        false,
      );
      break;
    }
    // Promise completion is published by a small observer below once app.js has loaded.
    await delay(1500);
  }

  if (!smokeResult) {
    // If the completion observer has not fired, await the app's promise directly.
    smokeResult = await devtools.evaluate(
      "window.__trilinguaSmokePromise",
      true,
    );
  }

  process.stdout.write(
    "\nRefreshing the page and repeating a translation while external DNS remains blocked.\n",
  );
  const refreshUrl =
    "http://127.0.0.1:5173/?offline-refresh=1&models=quantized";
  await devtools.send("Page.navigate", { url: refreshUrl });
  const refreshDeadline = Date.now() + 30_000;
  let refreshReady = false;
  while (Date.now() < refreshDeadline) {
    refreshReady = await devtools.evaluate(
      'typeof window.__trilinguaRunOfflineRefreshTest === "function"',
    );
    if (refreshReady) break;
    await delay(250);
  }
  if (!refreshReady)
    throw new Error(
      "The reloaded app did not initialize the offline test hook.",
    );
  const offlineRefreshResult = await devtools.evaluate(
    "window.__trilinguaRunOfflineRefreshTest()",
    true,
  );
  process.stdout.write("Checking local validation and failure messages.\n");
  process.stdout.write(
    "Checking marker preservation in all six model directions.\n",
  );
  const markerPreservationTests = await devtools.evaluate(
    "window.__trilinguaRunMarkerPreservationTests()",
    true,
  );
  process.stdout.write(
    "Checking long-input token bounds with the actual source tokenizer.\n",
  );
  const longInputTokenizationTest = await devtools.evaluate(
    "window.__trilinguaRunLongInputTokenizationTest()",
    true,
  );
  const errorHandling = await devtools.evaluate(
    "window.__trilinguaRunErrorHandlingChecks()",
    true,
  );

  const output = {
    project: "TriLingua Stage 3",
    generatedAt: new Date().toISOString(),
    browser: versionInfo.Browser,
    offlineMethod:
      "Headless browser external DNS blocked with host-resolver-rules; localhost Vite access preserved.",
    offlineRefreshTest: offlineRefreshResult,
    markerPreservationTests,
    longInputTokenizationTest,
    errorHandling,
    localAssetChecks: requiredAssetChecks,
    localRequests: [...localRequests],
    localRuntimeRequests: [...localRuntimeRequests],
    externalOriginsRequested: [...externalRequests],
    browserErrors,
    ...smokeResult,
  };
  const baselinePath = path.join(
    root,
    "evaluation",
    "stage2_baseline_smoke_tests.json",
  );
  const componentPath = path.join(
    root,
    "evaluation",
    "nlp_component_tests.json",
  );
  const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
  const componentTests = JSON.parse(await readFile(componentPath, "utf8"));
  const baselineByDirection = new Map(
    (baseline.results ?? []).map((result) => [
      `${result.sourceLanguage}>${result.targetLanguage}`,
      result,
    ]),
  );
  const regressions = (smokeResult.results ?? []).map((result) => {
    const baselineResult = baselineByDirection.get(
      `${result.sourceLanguage}>${result.targetLanguage}`,
    );
    return {
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
      status: result.status,
      baselineTranslation: baselineResult?.translation ?? null,
      stage3Translation: result.translation,
      baselineTranslationTimeMs: baselineResult?.translationTimeMs ?? null,
      stage3TranslationTimeMs: result.translationTimeMs ?? null,
      sourceTokenCount: result.sourceTokenCount ?? null,
      chunkCount: result.chunkCount ?? null,
      uiRepaintDelayMs: result.uiRepaintDelayMs ?? null,
      uiRepaintBeforeInferenceStarted:
        result.uiRepaintBeforeInferenceStarted ?? false,
      warnings: result.warnings ?? [],
    };
  });
  const pipelineReport = {
    project: "TriLingua Stage 3 NLP pipeline evaluation",
    generatedAt: output.generatedAt,
    baseline: "evaluation/stage2_baseline_smoke_tests.json",
    browser: output.browser,
    offlineMethod: output.offlineMethod,
    sixDirectionRegressions: regressions,
    markerPreservationTests,
    longInputTokenizationTest,
    offlineRefreshTest: offlineRefreshResult,
    componentTests,
    errorHandling,
    localAssetChecks: requiredAssetChecks,
    localRuntimeRequests: [...localRuntimeRequests],
    externalOriginsRequested: [...externalRequests],
    browserErrors,
    passed: regressions.filter((item) => item.status === "passed").length,
    failed: regressions.filter((item) => item.status !== "passed").length,
    tests: [
      ...componentTests.tests,
      ...regressions.map((item) => ({
        name: `Six-direction regression ${item.sourceLanguage} to ${item.targetLanguage}`,
        input: (smokeResult.results ?? []).find(
          (result) =>
            result.sourceLanguage === item.sourceLanguage &&
            result.targetLanguage === item.targetLanguage,
        )?.input,
        expected:
          "Translation completes and contains the expected target script.",
        actual: {
          translation: item.stage3Translation,
          sourceTokenCount: item.sourceTokenCount,
          chunkCount: item.chunkCount,
        },
        status: item.status,
      })),
      ...markerPreservationTests.checks.map((item) => ({
        name: `Entity and glossary marker preservation ${item.sourceLanguage} to ${item.targetLanguage}`,
        input: `${item.entityMarker} ${item.glossaryMarker}`,
        expected:
          "Both markers survive exactly once, otherwise protection stays disabled for that route.",
        actual: {
          entityPreserved: item.entityPreserved,
          glossaryPreserved: item.glossaryPreserved,
          supported: item.preserved,
        },
        status: item.status,
      })),
      ...markerPreservationTests.entityTests.map((item) => ({
        name: `Exact entity restoration ${item.sourceLanguage} to ${item.targetLanguage}`,
        input: item.input,
        expected:
          "Every detected value is restored exactly once after actual model inference.",
        actual: { entities: item.entities, restoredText: item.restoredText },
        status: item.status,
      })),
      ...markerPreservationTests.glossaryTests.map((item) => ({
        name: `Glossary restoration ${item.sourceLanguage} to ${item.targetLanguage}`,
        input: item.sourceTerm,
        expected: `Target term is restored exactly: ${item.targetTerm}`,
        actual: {
          marker: item.marker,
          translation: item.translation,
          restoredText: item.restoredText,
        },
        status: item.status,
      })),
      ...markerPreservationTests.supportGateChecks.map((item) => ({
        name: `Safe marker support gate ${item.sourceLanguage} to ${item.targetLanguage}`,
        input: `${item.sourceLanguage}>${item.targetLanguage}`,
        expected:
          "Only features that passed generated-marker restoration are enabled.",
        actual: {
          entityEnabled: item.actualEntitySupport,
          glossaryEnabled: item.actualGlossarySupport,
        },
        status: item.status,
      })),
      longInputTokenizationTest,
    ],
  };
  pipelineReport.testSummary = {
    components: {
      passed: componentTests.passed,
      failed: componentTests.failed,
    },
    sixDirectionRegression: {
      passed: regressions.filter((item) => item.status === "passed").length,
      failed: regressions.filter((item) => item.status !== "passed").length,
    },
    uiRepaint: {
      passed: regressions.filter((item) => item.uiRepaintBeforeInferenceStarted)
        .length,
      failed: regressions.filter(
        (item) => !item.uiRepaintBeforeInferenceStarted,
      ).length,
      maxDelayMs: Math.max(
        ...regressions.map((item) => item.uiRepaintDelayMs ?? 0),
      ),
    },
    markerPreservationProbes: {
      passed: markerPreservationTests.checks.filter(
        (item) => item.status === "passed",
      ).length,
      failed: markerPreservationTests.checks.filter(
        (item) => item.status !== "passed",
      ).length,
    },
    entityRestoration: {
      passed: markerPreservationTests.entityTests.filter(
        (item) => item.status === "passed",
      ).length,
      failed: markerPreservationTests.entityTests.filter(
        (item) => item.status !== "passed",
      ).length,
    },
    glossaryRestoration: {
      passed: markerPreservationTests.glossaryTests.filter(
        (item) => item.status === "passed",
      ).length,
      failed: markerPreservationTests.glossaryTests.filter(
        (item) => item.status !== "passed",
      ).length,
    },
    safeFeatureGates: {
      passed: markerPreservationTests.supportGateChecks.filter(
        (item) => item.status === "passed",
      ).length,
      failed: markerPreservationTests.supportGateChecks.filter(
        (item) => item.status !== "passed",
      ).length,
    },
    longInputTokenizer: longInputTokenizationTest.status,
    offlineRefresh: offlineRefreshResult.status,
    errorHandling: {
      passed: errorHandling.passed,
      failed: errorHandling.failed,
    },
  };
  await mkdir(path.dirname(pipelineOutputPath), { recursive: true });
  await writeFile(
    pipelineOutputPath,
    `${JSON.stringify(pipelineReport, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`\nSaved browser results to ${pipelineOutputPath}\n`);
  process.stdout.write(
    `Six directions: ${output.passed ?? 0} passed, ${output.failed ?? 0} failed.\n`,
  );
  process.stdout.write(
    `Offline refresh test: ${offlineRefreshResult.status}. External origins requested: ${externalRequests.size}.\n`,
  );

  if (
    (output.failed ?? 6) > 0 ||
    pipelineReport.testSummary.uiRepaint.failed > 0 ||
    offlineRefreshResult.status !== "passed" ||
    errorHandling.failed > 0 ||
    externalRequests.size > 0
  )
    process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
} finally {
  try {
    devtools?.socket.close();
  } catch {
    /* best effort */
  }
  await Promise.all([stopProcess(browser), stopProcess(vite)]);
  if (profileDir) {
    const tempRoot = path.resolve(os.tmpdir());
    const target = path.resolve(profileDir);
    if (
      target.startsWith(tempRoot + path.sep) &&
      path.basename(target).startsWith("trilingua-offline-smoke-")
    ) {
      if (process.platform === "win32") {
        const escapedPath = target.replaceAll("'", "''");
        const cleanup = `$profile='${escapedPath}'; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like ('*' + $profile + '*') } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
        try {
          execFileSync("powershell.exe", ["-NoProfile", "-Command", cleanup], {
            stdio: "ignore",
          });
        } catch {
          /* no matching processes */
        }
      }
      await delay(400);
      try {
        await rm(target, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 500,
        });
      } catch (error) {
        process.stderr.write(
          `Could not remove isolated browser profile ${target}: ${error.message}\n`,
        );
      }
    }
  }
}
