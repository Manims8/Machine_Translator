# Android build and test notes

The Android application is a Capacitor wrapper around the Vite production web build. The checked-in project can build a debug APK; a release-signed store artifact requires a separate signing and distribution setup.

## Prerequisites

- Node.js and npm as described in the root README
- Android Studio, Android SDK/platform tools, and a compatible JDK
- A device or emulator; large ONNX model files need substantial storage and memory

## Build with quantized models

From the repository root in PowerShell:

```powershell
npm.cmd install
npm.cmd run build:android
npm.cmd run android:stage
npx cap sync android
cd android
.\gradlew.bat --no-daemon --max-workers=1 assembleDebug
```

The stage script copies all three INT8 model families into `dist/quantized/`; Capacitor sync then copies them into Android's generated public assets. The families serve the six directions through English-Indic 200M, Indic-English 200M, and Indic-Indic 320M. To stage a smaller selection or inspect exact files, read `scripts/stage_android_models.mjs` before changing its family list. Do not stage FP32 models by copying directories manually; `modelRouter.js` expects the selected model root and sidecar layout.

Gradle's `noCompress` setting covers `.onnx`, `.data`, and JSON assets so model files retain the access pattern expected by the local fetch loader. The Vite output uses relative assets when `VITE_BASE=./` is set for Android. The evaluation page is excluded from the production `dist/` input and therefore from Capacitor sync.

## Device evidence

The recorded INT8 test evidence is in [`evaluation/results/android_test_results.md`](../evaluation/results/android_test_results.md), with structured rows in [`android_test_results.json`](../evaluation/results/android_test_results.json). It documents a connected Samsung SM-A146B test run, successful translations across all six directions, family switching, unload behavior, and point-in-time memory readings. It is evidence from one device/run, not a general RAM guarantee or disconnected installation test.

Install a locally built debug APK with `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`; inspect logs with `adb logcat`. Device installation/testing is a separate step from compiling the APK.

## Size and memory constraints

The three staged INT8 families total about 1.42 GB of model files before the app bundle. The Android test evidence records a debug APK of about 1.33 GiB and substantial WebView memory use on the tested handset. These values are specific to the saved run; allow additional free space for installation and updates, and do not infer minimum RAM from disk size.

The current workflow bundles all INT8 families. A smaller app with one-family import would reduce initial package size, but requires a model picker/import flow, integrity checks, interruption recovery, and a reliable local file serving bridge. That installation workflow is not implemented. A native ONNX Runtime port would require a separate tokenizer and generation bridge and would not reduce the weight payload by itself.
