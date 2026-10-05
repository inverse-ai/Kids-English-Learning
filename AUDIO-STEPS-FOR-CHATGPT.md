# Steps to run on the PC (for ChatGPT / Codex)

Claude made the code changes from the cloud and pushed them to GitHub (`origin/main`). Claude's workspace cannot reach the speech service, so the audio has to be generated on this PC, and the site has to be published from here. Run everything from `D:\Office Repos\Kids English Learning`.

## Step 0 — Sync this folder with GitHub

The files in this folder were already written by Claude and are identical to `origin/main`, but git here does not know that yet. Bring the local history in line:

```
git fetch origin
git status
git reset --hard origin/main
```

(`git status` will list the files Claude changed; `reset --hard` keeps them because `origin/main` has exactly the same content. Untracked folders such as `.sites-runtime` and `qa\*.png` are not touched.)

## Step 1 — One voice for all lessons

103 older lesson clips still use the American voice (Jenny). This records them again with the main British voice (Sonia), with word timings, and switches the app to the new clips. Nothing is deleted.

```
.audio-tools\Scripts\python tools\generate-pending-audio.py voice
```

Expected last lines: `Voice job done. 0 clips still on the old voice.` and `Finished.`

## Step 2 — Words for the -all family

The -all chart (ball, call, hall, mall, small) needs four word clips and the ending "all":

```
.audio-tools\Scripts\python tools\generate-pending-audio.py family
```

## Step 3 — Bangla narration (Math, Science, Stories, Letters & Words games)

Lessons now read every sentence aloud automatically, in English and then in Bangla. Stories were added in this update (ordinary stories and values stories, with and without games). Most English recordings already exist; the Bangla ones (937 lines) and 22 short English instruction lines do not. The collector lists them, the generator records them:

```
node tools\collect-narration-lines.mjs
.audio-tools\Scripts\python tools\generate-pending-audio.py bangla
```

Expected: `Untranslated: 0.` from the collector, then `Bangla job done: 937 Bangla clips available.` (or more). The clips are written to `dist\audio\` and listed in `dist\bangla-speech.js`. This takes a while; if it stops on a network error, run the same command again — finished clips are skipped.

The Arabic refuge phrase in “My brother, my friend” keeps its real Arabic recording. It is never recorded with a Bangla or English voice.

Voice: `bn-BD-NabanitaNeural`. If Tahlil prefers a male voice, change `BANGLA_VOICE` at the top of `tools\generate-pending-audio.py` to `bn-BD-PradeepNeural` before running.

## Step 3b — Cheerful letter names for the alphabet

The alphabet used to say “The letter A, the letter B…”. Now it says just “A! B! C!” in a cheerful child's voice (`en-GB-MaisieNeural`). Record the 26 clips:

```
.audio-tools\Scripts\python tools\generate-pending-audio.py letters
```

Expected: `Letters job done: 26 cheerful letter names.` Until these exist the app keeps the old clips, so nothing breaks.

## Step 3c — Two more lesson voices for the Settings page

The app now has a ⚙ Settings page where a child can pick the lesson voice: Sonia (teacher, default), Maisie (girl) or Leo (boy). Sonia's clips exist. This records about 2,700 English lesson clips in each of the two new voices (long job, can take an hour or more):

```
.audio-tools\Scripts\python tools\generate-pending-audio.py voices
```

It saves progress every 200 clips to `dist\voice-speech.js`, so if it stops, run the same command again and it continues. Expected last line: `Voices job done: {'maisie': ..., 'leo': ...} skipped 0`. Bangla, Arabic, letter names and letter sounds are not re-recorded. Leo is Ryan's voice made higher (pitch +45Hz) because there is no boy's voice in the service; after the first batch, play Leo on the Settings page and tell Tahlil how it sounds.

## Step 4 — Check, commit, push, publish

```
npm run check
```

Then open `dist\sw.js` and change `APP_VERSION` (for example add `-audio` at the end) so phones pick up the new clips. Commit and push:

```
git add -A
git commit -m "Record Bangla narration clips"
git push origin main
```

Finally publish the `dist` folder to the site exactly as the last update was published (the site project is in `.openai\hosting.json`; the live site is kids-english-learning.tahlil.chatgpt.site).

## Later — Real recitation for the Arabic opening (when Tahlil sends the MP3)

```
node tools\install-opening-recitation.mjs "C:\path\to\recitation.mp3" "Reciter name"
```

Then change `APP_VERSION` in `dist\sw.js` again, commit, push and publish.

## Do not
- Do not regenerate or replace the Arabic or letter-sound (phonics) recordings.
- Do not delete files in `dist\audio`.
- Do not change lesson text. Bangla translations live in `dist\bangla-lines.js` (section `banglaDrafts`); edit them there if a Bangla speaker corrects one, then run Step 3 again (only changed lines are re-recorded).
- If a command fails with a network error, run the same command again; finished clips are skipped.
