# Little English — fix list for Claude Code

Project: `D:\Office Repos\Kids English Learning` (Little English, kids phonics/reading PWA).
Live site: kids-english-learning.tahlil.chatgpt.site (static hosting of `dist/`, see `.openai/hosting.json`).

## Read this first

- There is **no build step**. The hand-written source *is* `dist/`. Edit files in `dist/` directly.
- `server.mjs` is a local-only static server (`npm start`, port 4174). It serves only an explicit allow-list of files.
- Every new JS file must be added in **three places**: `server.mjs` (file map), `dist/sw.js` (`FILES`), `package.json` (`check` script).
- Whenever shipped files change, bump `APP_VERSION` in `dist/sw.js`.
- Audio clips live in `dist/audio/` as `<24 hex>.mp3|wav`. They are referenced from `recorded-speech.js`, `stage-speech.js`, `family-speech.js`, `opening-audio-data.js`, and word timings in `audio-timings.js`.
- Audio generation tools are in `tools/` (edge-tts 7.2.8, Python venv in `.audio-tools/`). QA scripts (Playwright) are in `qa/`.
- Do not touch learner progress storage formats (`progress-store.js`, `playful-store.js`); existing saved progress must keep working.
- Do not replace Arabic audio with English or transliterated speech. Do not replace a recorded clip with the device's built-in voice.
- After every task: run `npm run check`, run the related `qa/*.mjs` script, and do a manual check in the browser at phone width (390px).
- Work **one task at a time**, in the order below. Commit after each task with a clear message. Stop and ask before deleting files.

## Task 0 — English for Math & English for Science: lesson audio and navigation (DO THIS FIRST)

Scope: only the Math and Science sections, in both modes: **without game** (`dist/math-flow.js`, `dist/science-flow.js`) and **with game** (`dist/playful-flow.js` + `playful-data.js` for the math/science paths). Lesson text is in `dist/math-data.js` and `dist/science-data.js`. Keep all existing lesson content and saved progress. Do not redesign other sections. Fix the audio first (parts 1, 2 and 5), then the presentation (part 3) and navigation (part 4).

### What causes the incomplete narration today (found in review, confirm before changing)
- Narration never starts by itself. `speak()` in `math-flow.js` / `science-flow.js` runs only when the child taps the audio button (`action==='audio'`).
- `speak()` plays only part of the step:
  - word steps: `math-word:<word>` / `science-word:<word>` (the single word, e.g. "tree") plus one example `text:` sentence;
  - sentence steps: only `st.text`;
  - question steps: only `st.prompt`.
  Other sentence lines shown on screen are not read.
- **No Bangla audio exists.** The Bangla translations are in the data (e.g. `s('The fruit costs eight taka.', 'shop-total', 'ফলের দাম আট টাকা।')`, word meanings like `v('ফুল', 'One flower.', ...)`), but there are no Bangla clips in `stage-speech.js` (it only has `text:`, `word:`, `move:`, `sound:`, `help:`, `name:` keys). `qa/playful-notes.md` confirms: "New Math/Science Bangla help remains written; no new Bangla recordings."
- In game mode, `playful-flow.js` shows a central vocabulary/meaning card, and its audio follows that word card.

### 1. Automatic lesson audio (first priority)
- When a lesson or a new step opens, automatically play **all English sentences of the step, then their Bangla translations**. Play the sequence once, not in a loop.
- No separate "Listen" tap per step.
- A clearly visible **Replay** button restarts the whole English + Bangla sequence from the start. Add **Pause/Resume**.
- Autoplay: reuse the app's existing user-gesture audio unlock (the tap that opens the lesson counts as a gesture; see how `opening-audio.js` handles a blocked `play()`). If `play()` is still rejected, show **one** obvious "Start lesson" button that unlocks audio and immediately starts the narration. The lesson must never sit silently waiting for repeated Listen taps.

### 2. Read the complete sentences
- Narrate **every** instructional/story sentence line shown for the current step, in visual reading order (lines above and below the vocabulary word, the question prompt, etc.).
- Read whole sentences, never just the keyword or the word meaning.
- Each English sentence is followed by its complete Bangla translation.
- Use only the real lesson text. Do not invent text. Do not silently skip a line: if a line has no clip, log it and show it in the QA report.
- Keep the sentence visible while it is read. Highlight the spoken words when reliable timings exist (`audio-timings.js`); otherwise highlight the whole current sentence.

### Audio to generate
- **English**: check that every Math/Science sentence, prompt and help line has a `text:` clip in `stage-speech.js`. Generate any missing ones with the same voice and settings as the existing clips (en-GB-SoniaNeural, rate -12%), with word timings, using the tools in `tools/` (see `generate-math-audio.py`, `generate-science-audio.py`).
- **Bangla**: generate a clip for every Bangla translation with an edge-tts Bangla voice (e.g. `bn-BD-NabanitaNeural`; try `bn-BD-PradeepNeural` too and let Tahlil pick). Add them under a new key prefix (e.g. `bn:<exact Bangla text>`) in the speech map, with sentence-level timing at minimum. Ask Tahlil to listen to a sample of 5 Bangla clips before generating the full set.
- New files must follow the `<24 hex>.mp3` naming in `dist/audio/` (the server and service worker only accept that pattern).

### 3. Different presentation for game and non-game modes
- **Without game:** keep the existing vocabulary and word-meaning presentation. Single words may keep their own pronunciation and Bangla meaning. Also keep the full sentence with its English + Bangla narration.
- **With game:** show the full sentence(s), the illustration and the game task. **Remove the separate central vocabulary/word-meaning card** in this mode (vocabulary may still appear naturally inside sentences). Narrate the full sentences followed by their Bangla translations. Replay repeats the sentence narration, not the isolated word. Sentence audio stays available while the child plays the activity.

### 4. Make lesson sequences easy for children to find
- Show the Math lessons and the Science lessons in one clear, consistent learning order, with visible lesson numbers, short names and recognisable illustrations.
- Clearly mark current, completed and next lessons.
- Obvious **Back to Lessons** and **Next Lesson** buttons, easy to reach on phones.
- **Continue** resumes the current child's (profile's) lesson and step.
- The order on the lesson cards must match the Next/Back order.

### 5. Audio reliability
- Stop the previous narration when the lesson or step changes. No overlapping audio.
- Auto-narration must start **once per step entry**. Track it by a key such as `lessonId:stepIndex:mode`. It must not restart because of a re-render, a drag, an answer choice or any other state update (`render()` is called often in these files).
- Replay deliberately restarts the whole sequence.
- Show loading and playback failures visibly, with a retry.
- Respect the existing audio-off / opening-audio preferences and the speed setting.
- Answer feedback audio (`math-feedback:`, `math-hint:` etc.) must stop the narration first and must not trigger a new auto-narration.

### Verify (390px phone viewport, plus 1366px desktop)
- Math and Science, in both game and non-game modes: first step, a later step, Replay, Pause/Resume, Next/Back, Back to Lessons, Continue.
- For every step of every Math and Science lesson: list the visible sentences and confirm each is read completely in English and then in Bangla (write an automated check in `qa/`, e.g. `qa/math-science-narration.mjs`, that compares the visible sentence lines with the narration queue).
- No overlap when tapping quickly through steps; no restart after dragging or answering.
- Autoplay blocked (e.g. Playwright with a fresh context and no gesture): the "Start lesson" button appears once and starts narration.
- Bump `APP_VERSION` in `sw.js`. Run `npm run check`, the existing `qa/english-math.mjs`, `qa/english-science.mjs` and `qa/playful*.mjs` scripts.

### Report back to Tahlil
1. What caused the incomplete narration.
2. What was fixed (game mode and non-game mode separately).
3. Any remaining autoplay limitations (for example iOS Safari, or when the page is opened without a tap).
4. Which lines (if any) still have no English or Bangla clip.

## Task 0B — Words 5+ word-family lessons: illustrated family map (do after Task 0)

Scope: the picture word-family lessons only (`dist/family-data.js`, `dist/family-lessons.js`, `dist/family-speech.js`, `dist/style.css`, and the game-mode path in `playful-flow.js` if it shows these lessons). Keep all existing activities and saved progress. Do not redesign other sections.

### Current state (found in review, confirm first)
- There are **10 families**, with these words (from `pictureFamilies` in `family-data.js`):
  - -at: cat, hat, mat, rat, bat, pat, sat, fat
  - -an: can, man, pan, fan, van, ran
  - -ig: pig, big, dig, wig
  - -op: hop, mop, top, pop
  - -un: sun, run, bun, fun, gun
  - -en: hen, pen, ten, den
  - -in: pin, tin, fin, bin
  - -ap: cap, map, tap, nap
  - -og: dog, log, fog, jog
  - -ug: bug, mug, rug, hug
- The supplied example posters (`/pictures/family-{at,an,ig,op,un}.jpeg`) exist for only 5 families. They are shown inside a closed accordion: `<details class="family-poster"><summary>See your original picture chart</summary>`. The other 5 families have no map at all.
- Every family already has a picture sheet `/pictures/family-<id>.png` (1254×1254 grid, one picture per word, `columns`/`rows` in the data, in word order). These are the finished per-word illustrations to reuse. Check each cell matches its word (e.g. `-en`: hen, pen, ten stars, fox in den).
- Each word already has English audio (`word:<word>` in `family-speech.js`) and a Bangla meaning. There is **no audio for the family endings** ("-at", "-ig", ...): only single letter sounds (`sound:a`, `sound:t`, ...).

### What to build
1. **An illustrated map for every one of the 10 families**, built in code (HTML/SVG + CSS), **not** by showing the supplied posters. The posters are design references only.
   - Large central circle with the family ending ("-at", "-in"...).
   - Every word of that family arranged around the circle, each joined to the centre by a clear line.
   - Each word shows its picture (crop the right cell of `family-<id>.png` with CSS `background-position`, or cut the sheets into separate image files), with the word written beside it.
   - In every word, the shared ending is highlighted the same way (same colour as the centre), e.g. c**at**, h**at**.
   - Use only the family's existing lesson words. Action words (sat, ran, run, dig, hop, jog, hug, pat, pop, tap, nap) must use their action picture.
2. **Layout:** the map sits directly under the lesson heading, visible by default. Remove the "See your original picture chart" accordion. Order: short introduction → map → existing practice activities. Do not put the map under exercises or long text.
3. **Interaction:**
   - Tap the centre circle → play the ending's sound.
   - Tap a word or its picture → play the full word (`word:<word>`), with the word highlighted while it plays.
   - Use the existing audio functions (`playFamilyAudio` in `lesson-audio.js`), so audio stops or overlaps correctly like the rest of the app.
4. **Ending sounds:** generate 10 clips (at, an, ig, op, un, en, in, ap, og, ug) in the same voice as the other word clips (en-GB-SoniaNeural). TTS often spells out non-words like "ug" or "og", so check each clip. If a clip is wrong, try SSML phonemes, and if still wrong, fall back to playing the existing letter sounds in sequence (e.g. `sound:u` + `sound:g`). **Ask Tahlil to listen to all 10 before shipping.** Add the new clips to the service worker if needed and bump `APP_VERSION`.
5. **Mobile:** readable at 320, 360 and 390 px wide and on desktop. No horizontal scroll, no overlapping labels, tap targets at least 48 px. On narrow phones, 8 words (-at) won't fit in one ring: use a two-ring or top/bottom arrangement, keep the lines, and keep the centre circle large.
6. Make sure the new pictures (sheets) are cached for offline use like the rest of the shell.

### Content check for Tahlil (ask before changing)
- "-at" includes **fat** (shown as a fat cat) and "-un" includes **gun** (shown as a toy water gun). Ask Tahlil whether to keep these two words or remove them. Don't change the word lists without approval.

### Verify
- All 10 families: map is visible on opening the lesson **without tapping or expanding anything**, at 320, 390 and 1366 px. Take a screenshot of each into `qa/` (e.g. `qa/family-map-<id>-390.png`).
- Every word in each family appears once, with the right picture, and links to the centre.
- Tapping the centre plays the ending; tapping each word plays that word; no overlapping audio.
- Existing family activities and saved progress still work. Run `npm run check` and the existing family QA scripts (`qa/picture-families.mjs`, `qa/picture-edge-cases.mjs`).

### Report back to Tahlil
- Which family maps were created (all 10 expected), and confirmation that each is visible without expanding anything (with the screenshots).
- Which ending sounds came from TTS and which fell back to letter sounds.
- Any picture that didn't match its word.

## Tasks (in priority order)

### 1. One voice for all English recordings
- Problem: ~2,334 clips use `en-GB-SoniaNeural`; the older clips use `en-US-JennyNeural` (134 clips in `recorded-speech.js` plus 52 entries in `audio-timings.js`). The child hears two accents. The parent page says "Sonia" but `recordedSpeech` is labelled `recordingVoice = "Jenny · English (US)"`.
- Do: regenerate every Jenny clip with Sonia (same rate as the other Sonia clips, `-12%`), regenerate their word timings, update the mappings and the `recordingVoice` label. Do not remove the old files until the new ones are wired and tested.
- Done when: `grep -o '"voice":"[^"]*"' dist/audio-timings.js | sort | uniq -c` shows only Sonia, and highlighting still follows the words.

### 2. Replace the Arabic opening with a real recitation
- Problem: the opening (isti'adha, basmala, "Rabbi zidni ilma") is synthetic Arabic speech (`opening-audio-data.js`, clip `/audio/10f8257b3e6c1bbcc61c21b1.mp3`, about 9 s). No human has checked the pronunciation.
- Do: prepare the code so a human recitation file can be dropped in (Tahlil will supply the recording). Keep the same flow and setting. Update the settings text in `opening-audio.js` so it no longer talks about synthetic speech.
- **Wait for Tahlil to provide the audio file. Do not generate a new synthetic version.**

### 3. Replace the Oxford Owl phonics clips
- Problem: the parent page (`app.js`) says isolated letter sounds use Oxford Owl's clips. These belong to Oxford University Press, so shipping them on a public website is a licensing risk.
- Do: find every clip that came from Oxford Owl (search the tools/ and qa/ reports for the source list), list them for Tahlil, and prepare to swap in our own recordings. Update the parent-page text. The link to Oxford Owl as a reading resource may stay.
- **Ask Tahlil how the replacement sounds will be recorded before generating anything** (TTS is bad at isolated phonemes).

### 4. Don't make the first tap wait for the opening
- Problem: browsers block autoplay, so the opening starts on the child's first tap, and `beforeInteraction` in `opening-audio.js` holds that tap until the 9-second clip ends. The app looks frozen.
- Do: let the tap go through right away. Either play the opening on a dedicated "Start" screen, or let it play while the chosen screen opens. Keep the "Skip" option and the saved on/off setting.

### 5. Offline audio cache is far too small
- Problem: `dist/sw.js` keeps at most 300 clips in `little-english-audio-v1`, but there are 3,327 clips. It deletes `keys[0]` (the earliest saved), so the first lessons lose audio offline. The message in `pwa.js` ("Audio becomes available offline after it has been played online") becomes untrue.
- Do: raise or remove the limit (total audio is about 69 MB), and add an optional per-section "Save for offline" download in the parent area. Fix the message text to match what really happens.

### 6. iPhone/iPad audio (Range requests)
- Problem: Safari needs partial responses (HTTP 206) for media. `server.mjs` ignores the `Range` header and always returns 200 with the whole file (tested). The service worker also returns a full cached 200 response for Range requests, so offline audio on iOS will likely fail. In `sw.js`, audio is cached only when status is 200, so 206 responses from the host are never cached.
- Do: add Range/206 support (and `Accept-Ranges: bytes`) to `server.mjs`. In `sw.js`, cache the full file (fetch without Range) and answer Range requests by slicing the cached body into a 206 response.
- Done when: audio plays online and offline in Safari (test on a real iPhone if possible) and Chrome Android.

### 7. Word-family posters missing offline
- Problem: `family-data.js` uses `/pictures/family-{at,an,ig,op,un}.jpeg` posters, but `sw.js` caches only the `.png` sheets. The posters are blank offline.
- Do: add the 5 `.jpeg` files to `FILES` in `sw.js` and bump `APP_VERSION`.

### 8. Missing recordings fall back to the device voice
- Problem: `playful-audio.js` uses the phone's built-in voice for practice text that has no recording. Many Android phones have no offline English voice, so the child gets "Audio unavailable" or a robotic third voice.
- Do: list every playful text with no recording, generate Sonia recordings plus timings for them (same tools as the other playful audio), and wire them up so the device voice is only a last resort.

### 9. No fallback when a stage clip fails
- Problem: in `stage-audio.js`, `fail()` only shows an error. Stories, words and practice go silent when one clip fails to load.
- Do: retry the clip once (after a network error), then show a clear "Tap to try again" button. Keep the message friendly for parents.

### 10. Remove unused audio clips
- Problem: 236 files in `dist/audio/` are not referenced by any JS file, but are shipped on every deploy.
- Do: write a script in `tools/` that lists unreferenced clips (check all `dist/*.js` for the 24-hex IDs). **Show the list to Tahlil and wait for approval** before moving them out of `dist/` (move them to an `archive` folder; don't delete).

### 11. Faster first load
- Problem: about 2 MB of JS loads before anything shows. `audio-timings.js` alone is 1.2 MB and `stage-speech.js` is 243 KB, and everything is statically imported from `app.js`.
- Do: lazy-load each section's modules (`import()`) when the section opens, and split `audio-timings.js` per section (or load the timings for one clip on demand). Keep offline caching working: the SW must still pre-cache the split files.

### 12. One list of shipped files
- Problem: shipped files are listed by hand in `server.mjs`, `sw.js` and `package.json`.
- Do: create one manifest (for example `dist/files.json` or a small generator script in `tools/`) that all three use, so a new file can't be forgotten.

### 13. Refresh the audio QA report
- Problem: `qa/audio-catalog-report.json` covers 1,998 clips; there are now 3,327.
- Do: rerun or update `qa/audio-catalog.mjs` so it checks every clip, including the playful ones.

## Needs a human (Claude Code cannot do these)
- Listen to the English, Bangla and Arabic audio for pronunciation and clarity.
- Provide the Arabic recitation (task 2) and decide how the phonics sounds get recorded (task 3).
- Test on a real Android phone and a real iPhone, including "Add to Home Screen".
