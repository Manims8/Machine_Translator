import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // Serve the app from app/ and expose the already-downloaded models as public
  // URLs without copying their 3.2 GiB into dist/.
  root: 'app',
  publicDir: '../models',
  server: {
    fs: { allow: ['..'] },
  },
  // Transformers.js defaults to its WebGPU/JSEP bundle. Stage 2 uses the
  // installed WASM-only runtime so its CPU backend has a fully local asset set.
  resolve: {
    alias: [{ find: /^#onnxruntime-webgpu$/, replacement: 'onnxruntime-web/wasm' }],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'app/index.html'),
        evaluation: resolve(projectRoot, 'app/evaluation.html'),
      },
    },
  },
})
