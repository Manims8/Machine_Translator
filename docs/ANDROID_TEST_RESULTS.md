# Android INT8 model test results

Tested the debug APK on a USB-connected Samsung SM-A146B (Android 15). The APK contains all three quantized families. The device reports `MemTotal: 7,641,344 kB` (about 7.29 GiB usable) and had 49 GiB free on `/data` before installation.

The APK built successfully with one Gradle worker and `org.gradle.jvmargs=-Xmx1536m`; no heap increase was needed. `adb install -r` succeeded. APK: `android/app/build/outputs/apk/debug/app-debug.apk`, 1,429,001,046 bytes (1.33 GiB).

## Translation results

Input length is Unicode characters. Paragraph inputs contain four sentences. Load time is the UI-reported family load time, repeated for both directions that use that family. Translation time is the UI-reported inference time for that input.

| Direction | Input | Length | Load time | Translation time | Result | Translation |
|---|---|---:|---:|---:|---|---|
| Tamil → English | Short | 29 chars | 8.0 s | 0.80 s | OK | The bus arrived early. |
| Tamil → English | 4-sentence paragraph | 231 chars | 8.0 s | 3.37 s | OK | The rain stopped before noon. We went to the nearby library. My sister returned two books and picked up a new novel. On the way home, we bought new fruits at a small store. |
| Kannada → English | Short | 17 chars | 8.0 s | 0.50 s | OK | The bus arrived quickly. |
| Kannada → English | 4-sentence paragraph | 218 chars | 8.0 s | 3.99 s | OK | The rain stopped before noon. We walked to the nearest library. My sister returned two books and picked up a new novel. On the way home, we bought fresh fruit from a small store. |
| English → Tamil | Short | 22 chars | 9.1 s | 0.95 s | OK | பேருந்து சீக்கிரம் வந்து சேர்ந்தது. |
| English → Tamil | 4-sentence paragraph | 181 chars | 9.1 s | 6.08 s | OK | மதியத்திற்கு முன்பு மழை நின்றுவிட்டது. நாங்கள் பக்கத்து நூலகத்திற்கு நடந்து சென்றோம். என் சகோதரி இரண்டு புத்தகங்களைத் திருப்பிக் கொடுத்து ஒரு புதிய நாவலைக் கடன் வாங்கினார். வீட்டிற்குச் செல்லும் வழியில் ஒரு சிறிய கடையில் இருந்து புதிய பழங்களை வாங்கினோம். |
| English → Kannada | Short | 22 chars | 9.1 s | 0.89 s | OK | ಬಸ್ ಬೇಗನೆ ಬಂದಿತು. |
| English → Kannada | 4-sentence paragraph | 181 chars | 9.1 s | 6.49 s | OK | ಮಧ್ಯಾಹ್ನದ ಮೊದಲು ಮಳೆ ನಿಲ್ಲಿತು. ನಾವು ನೆರೆಹೊರೆಯ ಗ್ರಂಥಾಲಯಕ್ಕೆ ಹೋದೆವು. ನನ್ನ ಸಹೋದರಿ ಎರಡು ಪುಸ್ತಕಗಳನ್ನು ಹಿಂದಿರುಗಿಸಿ ಹೊಸ ಕಾದಂಬರಿಯನ್ನು ಎರವಲು ಪಡೆದರು. ಮನೆಗೆ ಹೋಗುವ ದಾರಿಯಲ್ಲಿ ನಾವು ಒಂದು ಸಣ್ಣ ಅಂಗಡಿಯಿಂದ ತಾಜಾ ಹಣ್ಣುಗಳನ್ನು ಖರೀದಿಸಿದೆವು. |
| Tamil → Kannada | Short | 29 chars | 10.7 s | 1.15 s | OK | ಬಸ್ ಮುಂಚಿತವಾಗಿ ಬಂದಿತು. |
| Tamil → Kannada | 4-sentence paragraph | 231 chars | 10.7 s | 7.05 s | OK | ಮಧ್ಯಾಹ್ನದ ಮೊದಲು ಮಳೆ ನಿಲ್ಲಿತು. ನಾವು ಹತ್ತಿರದ ಗ್ರಂಥಾಲಯಕ್ಕೆ ಹೋದೆವು. ನನ್ನ ಸಹೋದರಿ ಎರಡು ಪುಸ್ತಕಗಳನ್ನು ಹಿಂದಿರುಗಿಸಿ ಹೊಸ ಕಾದಂಬರಿಯನ್ನು ತೆಗೆದುಕೊಂಡಳು. ಮನೆಗೆ ಹೋಗುವ ದಾರಿಯಲ್ಲಿ ಒಂದು ಸಣ್ಣ ಅಂಗಡಿಯಲ್ಲಿ ನಾವು ಹೊಸ ಹಣ್ಣುಗಳನ್ನು ಖರೀದಿಸಿದೆವು. |
| Kannada → Tamil | Short | 17 chars | 10.7 s | 0.87 s | OK | பேருந்து விரைவாக வந்தது. |
| Kannada → Tamil | 4-sentence paragraph | 218 chars | 10.7 s | 7.50 s | OK | மதியத்திற்கு முன்பு மழை நிறுத்தப்பட்டது. நாங்கள் அருகிலுள்ள நூலகத்திற்குச் சென்றோம். என் சகோதரி இரண்டு புத்தகங்களை திருப்பிக் கொடுத்து ஒரு புதிய நாவலை எடுத்துக் கொண்டார். வீட்டிற்குத் திரும்பும் போது ஒரு சிறிய கடையில் இருந்து புதிய பழங்களை வாங்கினார். |

All 12 requested inputs returned non-empty output. An additional Tamil → English short input also succeeded after returning to the first model family; that reload took 9.3 s and translation took 0.69 s.

## Memory and family switching

Memory was sampled after loading each family and after invoking the existing unload handler. `dumpsys meminfo com.trilingua.app` reports the app process. The WebView renderer is a separate isolated process; its PID was associated with TriLingua through `dumpsys activity processes` and measured with `dumpsys meminfo <renderer-pid>`. Values below are MiB (1024 KiB); combined PSS adds the app and its renderer.

| Family loaded | App PSS / RSS | WebView renderer PSS / RSS | Combined PSS | After unload: app PSS + renderer PSS | Combined after unload |
|---|---:|---:|---:|---:|---:|
| en-indic-200m | 616.2 / 669.3 MiB | 1,205.6 / 1,227.6 MiB | 1.78 GiB | 136.2 + 658.7 MiB | 0.78 GiB |
| indic-indic-320m | 679.2 / 732.3 MiB | 1,575.1 / 1,597.0 MiB | 2.20 GiB | 141.1 + 654.4 MiB | 0.78 GiB |
| indic-en-200m | 483.7 / 537.0 MiB | 703.6 / 725.4 MiB | 1.16 GiB | 136.3 + 698.7 MiB | 0.82 GiB |

The requested family order was exercised: indic-en → en-indic → indic-indic → indic-en. Family changes completed without translation errors. The model loader releases the previous sessions before loading another family. The “Unload model” button is disabled in the current UI, so for the post-unload readings the test harness enabled that existing button in the WebView and invoked its existing handler; no app source was changed. After unload, app-process PSS returned to about 136–141 MiB, while renderer PSS remained around 654–699 MiB. Memory therefore returned substantially but not to the initial renderer baseline.

The renderer is the dominant and variable measurement: loaded renderer PSS ranged from about 704 MiB to 1,575 MiB in these samples. These are point-in-time PSS/RSS readings, not a continuous peak measurement. At the highest sampled family total, app plus renderer PSS was about 2.20 GiB.

## Stability and limitations

- The test cleared logcat immediately before the translation run. Afterwards, there were no matching `lowmemorykiller`, `OOM`, `Out of memory`, or TriLingua process-kill lines. `dumpsys activity exit-info` showed only earlier user-requested task removals and the expected package-update exit; no test-time process death was recorded.
- No JavaScript runtime exceptions were captured by the WebView CDP listener.
- All three families and six directions were exercised on this connected handset. The measurements describe this device and this run; other device variants and long-duration memory behavior were not tested.
