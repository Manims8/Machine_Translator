Stage 8.4 - bundle all three INT8 families, build, and measure on the phone

Project: D:\python\Machine_Translator (phone: Samsung SM-A146B, USB connected)

RULES
- Do not modify originals in models/ or any existing results.
- Web/laptop behaviour unchanged. Keep diffs small. No commit/push.
- Build with ONE Gradle worker. Do not install anything outside this
  project without asking me first.
- Check free disk space on D: before building and tell me the number.

TASKS
1. Extend scripts/stage_android_models.mjs to stage all three INT8
   families (en-indic-200m, indic-en-200m, indic-indic-320m) into dist/.
   Verify the file list per family and that every graph, sidecar and
   tokenizer/config file is present.
2. If packaging runs out of memory, raise org.gradle.jvmargs (report the
   value). Keep .onnx/.data/.json uncompressed.
3. cap sync, build the debug APK, report its size. Install on the phone
   with adb install -r (tell me if it fails and the exact error).
4. On the phone, for each of the six directions, run a short sentence and
   a 4-5 sentence paragraph (use adb input or the UI; if the UI cannot be
   driven by adb, give me a checklist and I will do it by hand).
   Record load time and translation time for each.
5. Measure memory: after loading each family, run
   adb shell dumpsys meminfo <app package> and record total PSS and the
   WebView/renderer process memory. Also watch adb logcat for
   "lowmemorykiller", "OOM", "Out of memory" and process death, and report
   any hit with timestamps.
6. Test switching families in this order: indic-en -> en-indic ->
   indic-indic -> indic-en. Report whether the previous model unloads and
   memory returns.
7. Write docs/ANDROID_TEST_RESULTS.md with a table: direction, input
   length, load time, translation time, result OK/FAIL, notes.

RETURN: APK size, install result, the results table, memory figures, any
crashes or kills, and what you could not verify.