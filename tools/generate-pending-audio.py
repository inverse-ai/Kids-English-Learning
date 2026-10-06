"""Generate the audio that could not be made in Claude's cloud workspace.

Run from the project root on the Windows PC (internet needed):

    .audio-tools\\Scripts\\python tools\\generate-pending-audio.py voice
    .audio-tools\\Scripts\\python tools\\generate-pending-audio.py bangla
    .audio-tools\\Scripts\\python tools\\generate-pending-audio.py family
    .audio-tools\\Scripts\\python tools\\generate-pending-audio.py all

Jobs
  family  Record the -all word family words (call, hall, mall, small) and the
          ending "all" with Sonia, so every tap on the -all chart speaks.
  voice   Re-record every lesson clip in dist/recorded-speech.js that still uses
          the old US voice (Jenny) with the app's main voice (Sonia, en-GB,
          rate -12%), with word timings, and point recorded-speech.js at the new
          clips. Old files stay in dist/audio (nothing is deleted).
  letters Record 26 cheerful letter names ("A!", "B!") in a child's voice
          for the alphabet; they replace "The letter A" everywhere.
  voices  Record the English lesson clips again in the two extra voices
          (Maisie, a girl; Leo, a boy) for the Settings page. Long job.
  bangla  Record every Bangla narration line listed in tools/narration-lines.json
          (written by `node tools/collect-narration-lines.mjs`) with
          bn-BD-NabanitaNeural and add them to dist/bangla-speech.js.
          Also records any English narration line that has no clip yet.

The script never changes lesson text, never deletes audio and never replaces
Arabic or phonics recordings. It is safe to run again: finished clips are skipped.
"""
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
AUDIO = DIST / 'audio'
SPEECH = DIST / 'stage-speech.js'
TIMINGS = DIST / 'audio-timings.js'
RECORDED = DIST / 'recorded-speech.js'
BANGLA = DIST / 'bangla-speech.js'
LINES = ROOT / 'tools' / 'narration-lines.json'
VOICES_FILE = DIST / 'voice-speech.js'
FAMILY_SPEECH = DIST / 'family-speech.js'

ENGLISH_VOICE, ENGLISH_RATE = 'en-GB-SoniaNeural', '-12%'
BANGLA_VOICE, BANGLA_RATE = 'bn-BD-NabanitaNeural', '-8%'
# Cheerful letter names ("A!", "B!") for the alphabet: a child's voice, a little higher.
LETTER_VOICE, LETTER_RATE, LETTER_PITCH = 'en-GB-MaisieNeural', '-5%', '+6Hz'


def read_map(path):
    if not path.exists():
        return {}
    text = path.read_text(encoding='utf-8')
    return json.loads(text.split('Object.freeze(', 1)[1].rsplit(');', 1)[0])


def write_map(path, name, data, prefix=''):
    path.write_text(prefix + 'export const ' + name + '=Object.freeze(' + json.dumps(data, ensure_ascii=False, indent=2) + ');\n', encoding='utf-8')


async def record(text, voice, rate, slots, want_words, pitch='+0Hz'):
    """Return (clip path, timing record or None)."""
    async with slots:
        for attempt in range(4):
            try:
                data, events = bytearray(), []
                speaker = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary='WordBoundary' if want_words else 'SentenceBoundary')
                async for event in speaker.stream():
                    if event['type'] == 'audio':
                        data.extend(event['data'])
                    elif event['type'] in ('WordBoundary', 'SentenceBoundary'):
                        events.append(event)
                if len(data) < 500:
                    raise RuntimeError('No audio returned for: ' + text)
                words, cursor = [], 0
                if want_words:
                    for event in events:
                        if event['type'] != 'WordBoundary':
                            continue
                        token = event['text'].strip('.,!?;:"“”')
                        if not token:
                            continue
                        start = text.lower().find(token.lower(), cursor)
                        if start < 0:
                            continue
                        cursor = start + len(token)
                        words.append({'start': event['offset'] / 10_000_000, 'end': (event['offset'] + event['duration']) / 10_000_000, 'from': start, 'to': cursor})
                    if not words:
                        raise RuntimeError('No word timings for: ' + text)
                name = hashlib.sha256(data).hexdigest()[:24] + '.mp3'
                (AUDIO / name).write_bytes(data)
                clip = '/audio/' + name
                timing = {'text': text, 'voice': voice, 'rate': rate, 'source': 'WordBoundary from the same audio stream', 'words': words} if words else None
                return clip, timing
            except Exception as error:  # network hiccups: retry, then stop loudly
                if attempt == 3:
                    raise RuntimeError('Could not record "' + text + '": ' + str(error))
                await asyncio.sleep(3)


async def job_voice(timings, speech):
    recorded_text = RECORDED.read_text(encoding='utf-8')
    recorded = read_map(RECORDED)
    slots = asyncio.Semaphore(4)
    todo = [t for t, clip in recorded.items() if 'Sonia' not in timings.get(clip, {}).get('voice', '')]
    print(len(todo), 'lesson clips still use the old voice.', flush=True)

    async def one(text):
        twin = speech.get('text:' + text)
        if twin and 'Sonia' in timings.get(twin, {}).get('voice', ''):
            recorded[text] = twin
            return
        known = next((c for c, m in timings.items() if m.get('text') == text and m.get('voice') == ENGLISH_VOICE and m.get('rate') == ENGLISH_RATE), None)
        if known:
            recorded[text] = known
            return
        clip, timing = await record(text, ENGLISH_VOICE, ENGLISH_RATE, slots, True)
        recorded[text] = clip
        timings[clip] = timing
        print('  recorded:', text, flush=True)

    await asyncio.gather(*(one(t) for t in todo))
    write_map(RECORDED, 'recordedSpeech', recorded, prefix='export const recordingVoice = "Sonia \\u00b7 English (UK)";\n')
    left = [t for t, clip in recorded.items() if 'Sonia' not in timings.get(clip, {}).get('voice', '')]
    print('Voice job done.', len(left), 'clips still on the old voice.', flush=True)
    return left


async def job_bangla(timings, speech):
    if not LINES.exists():
        raise SystemExit('Missing tools/narration-lines.json. Run: node tools/collect-narration-lines.mjs')
    lines = json.loads(LINES.read_text(encoding='utf-8'))
    bangla = read_map(BANGLA)
    slots = asyncio.Semaphore(4)

    async def one_bn(text):
        if bangla.get(text) and (DIST / bangla[text].lstrip('/')).exists():
            return
        clip, _ = await record(text, BANGLA_VOICE, BANGLA_RATE, slots, False)
        bangla[text] = clip
        print('  বাংলা:', text, flush=True)

    async def one_en(text):
        if speech.get('text:' + text):
            return
        clip, timing = await record(text, ENGLISH_VOICE, ENGLISH_RATE, slots, True)
        speech['text:' + text] = clip
        timings[clip] = timing
        print('  English:', text, flush=True)

    await asyncio.gather(*(one_bn(t) for t in lines.get('bangla', [])))
    await asyncio.gather(*(one_en(t) for t in lines.get('english', [])))
    write_map(BANGLA, 'banglaSpeech', dict(sorted(bangla.items())))
    print('Bangla job done:', len(bangla), 'Bangla clips available.', flush=True)


FAMILY_WORDS = ['ball', 'call', 'hall', 'mall', 'small']


async def job_family(timings, speech):
    slots = asyncio.Semaphore(4)

    async def one(key, text):
        if speech.get(key) and (DIST / speech[key].lstrip('/')).exists():
            return
        clip, timing = await record(text, ENGLISH_VOICE, ENGLISH_RATE, slots, True)
        speech[key] = clip
        timings[clip] = timing
        print('  recorded:', key, flush=True)

    await asyncio.gather(*([one('word:' + w, w) for w in FAMILY_WORDS] + [one('ending:all', 'all')]))
    print('Family job done.', flush=True)


# Spelled the way they sound so the voice says the letter name, never a word.
LETTER_SAYINGS = {'a': 'Ay!', 'b': 'Bee!', 'c': 'See!', 'd': 'Dee!', 'e': 'Ee!', 'f': 'Eff!', 'g': 'Jee!', 'h': 'Aitch!', 'i': 'Eye!', 'j': 'Jay!', 'k': 'Kay!', 'l': 'Ell!', 'm': 'Em!', 'n': 'En!', 'o': 'Oh!', 'p': 'Pee!', 'q': 'Cue!', 'r': 'Ar!', 's': 'Ess!', 't': 'Tee!', 'u': 'You!', 'v': 'Vee!', 'w': 'Double you!', 'x': 'Ex!', 'y': 'Why!', 'z': 'Zed!'}


async def job_letters(timings, speech):
    slots = asyncio.Semaphore(4)

    async def one(letter, text):
        key = 'letter-joy:' + letter
        if speech.get(key) and (DIST / speech[key].lstrip('/')).exists():
            return
        clip, _ = await record(text, LETTER_VOICE, LETTER_RATE, slots, False, LETTER_PITCH)
        speech[key] = clip
        print('  recorded:', key, flush=True)

    await asyncio.gather(*(one(l, t) for l, t in LETTER_SAYINGS.items()))
    print('Letters job done: 26 cheerful letter names.', flush=True)


# Extra lesson voices chosen on the Settings page. Sonia stays the default.
# (voice, rate, pitch). There is no boy's voice in the speech service, so Leo is
# Ryan's voice raised in pitch. If Leo sounds odd, change '+45Hz' and run again
# after deleting the "leo" entries in dist/voice-speech.js.
EXTRA_VOICES = {'maisie': ('en-GB-MaisieNeural', '-5%', '+0Hz'), 'leo': ('en-GB-RyanNeural', '+0%', '+45Hz')}
# English clips that are re-recorded in each extra voice. Letter names, letter
# sounds, spelling, Bangla and Arabic are never re-recorded.
VOICE_PREFIXES = ('text', 'word', 'move', 'help', 'math-word', 'math-feedback', 'math-hint', 'math-demo',
                  'science-word', 'science-feedback', 'science-demo', 'science-hint', 'value-word',
                  'value-instruction', 'value-praise', 'value-refuge-prefix', 'story-hint', 'at-say', 'at-review-word')
SUFFIX_IS_TEXT = ('text', 'word', 'move', 'math-word', 'science-word', 'value-word', 'story-hint', 'at-review-word')


async def job_voices(timings, speech):
    family = read_map(FAMILY_SPEECH)
    voices = read_map(VOICES_FILE) or {}
    jobs = []
    for key, clip in list(speech.items()) + [(k, v) for k, v in family.items() if k.startswith('word:')]:
        prefix = key.split(':', 1)[0]
        if prefix not in VOICE_PREFIXES:
            continue
        text = (timings.get(clip) or {}).get('text') or (key.split(':', 1)[1] if prefix in SUFFIX_IS_TEXT and ':' in key else '')
        if text:
            jobs.append((key, text))
    # The Settings page 'Listen' sample first, so each voice can be heard after the first batch.
    first = ('text:I see a cat.', 'move:Well done!')
    jobs.sort(key=lambda j: 0 if j[0] in first else 1)
    slots = asyncio.Semaphore(4)
    failed = []

    async def one(vid, voice, rate, pitch, key, text):
        bucket = voices.setdefault(vid, {})
        if bucket.get(key) and (DIST / bucket[key].lstrip('/')).exists():
            return
        try:
            clip, timing = await record(text, voice, rate, slots, ' ' in text.strip(), pitch)
        except Exception as error:
            failed.append(vid + ' ' + key)
            print('  skipped:', vid, key, error, flush=True)
            return
        bucket[key] = clip
        if timing:
            timings[clip] = timing

    for vid, (voice, rate, pitch) in EXTRA_VOICES.items():
        print('Recording', len(jobs), 'lesson clips in', voice, '...', flush=True)
        batch = [one(vid, voice, rate, pitch, k, tx) for k, tx in jobs]
        for i in range(0, len(batch), 200):
            await asyncio.gather(*batch[i:i + 200])
            write_map(VOICES_FILE, 'voiceSpeech', voices, '// English lesson clips in the extra voices, keyed like stage-speech.js.\n// Filled by tools/generate-pending-audio.py voices\n')
            print('  ', vid, min(i + 200, len(batch)), '/', len(batch), flush=True)
    print('Voices job done:', {k: len(v) for k, v in voices.items()}, 'skipped', len(failed), flush=True)


# The Arabic opening read slowly by Sonia from a careful transliteration
# (Tahlil asked for Sonia's voice). Saved for review only; nothing in the app changes.
OPENING_SONIA_TEXT = 'A-oodhu billaahi minash-shaytaanir-rajeem. ... Bismillaahir-rahmaanir-raheem. ... Rabbi zidnee ilmaa.'


async def job_opening_sonia(timings, speech):
    slots = asyncio.Semaphore(1)
    # Arabic voice (better letters and tajweed sounds than an English voice).
    # The words are written joined the way they are recited (wasl), so the voice
    # says "bismillaahir-rahmaanir-raheem", not "bism allah".
    arabic = 'أَعُوذُ بِاللّٰهِ مِنَشْ شَيْطَانِرْ رَجِيمْ. ... بِسْمِلّٰهِرْ رَحْمٰنِرْ رَحِيمْ. ... رَبِّ زِدْنِي عِلْمَا.'
    for name, rate, pitch in (('arabic', '-18%', '+0Hz'), ('arabic-young', '-18%', '+30Hz')):
        clip, _ = await record(arabic, 'ar-SA-ZariyahNeural', rate, slots, False, pitch)
        preview = ROOT / 'tools' / ('opening-preview-' + name + '.mp3')
        preview.write_bytes((DIST / clip.lstrip('/')).read_bytes())
        print('Opening preview saved: tools/opening-preview-' + name + '.mp3 (' + clip + ')', flush=True)
    return
    # Two previews: Maisie (the girl's voice, Tahlil's choice) and Sonia.
    for name, voice, rate in (('maisie', LETTER_VOICE, '-20%'), ('sonia', ENGLISH_VOICE, '-25%')):
        clip, _ = await record(OPENING_SONIA_TEXT, voice, rate, slots, False)
        preview = ROOT / 'tools' / ('opening-preview-' + name + '.mp3')
        preview.write_bytes((DIST / clip.lstrip('/')).read_bytes())
        print('Opening preview saved: tools/opening-preview-' + name + '.mp3 (' + clip + ')', flush=True)


async def main(jobs):
    AUDIO.mkdir(parents=True, exist_ok=True)
    timings, speech = read_map(TIMINGS), read_map(SPEECH)
    if 'voice' in jobs:
        await job_voice(timings, speech)
    if 'family' in jobs:
        await job_family(timings, speech)
    if 'bangla' in jobs:
        await job_bangla(timings, speech)
    if 'letters' in jobs:
        await job_letters(timings, speech)
    if 'voices' in jobs:
        await job_voices(timings, speech)
    if 'opening-sonia' in jobs:
        await job_opening_sonia(timings, speech)
    write_map(SPEECH, 'stageSpeech', speech)
    TIMINGS.write_text('export const audioTimings=Object.freeze(' + json.dumps(timings, ensure_ascii=False, separators=(',', ':')) + ');\n', encoding='utf-8')
    print('Finished. Now run: npm run check, then bump APP_VERSION in dist/sw.js.', flush=True)


if __name__ == '__main__':
    args = set(sys.argv[1:]) or {'all'}
    if 'all' in args:
        args = {'voice', 'family', 'bangla', 'letters'}
    unknown = args - {'voice', 'family', 'bangla', 'letters', 'voices', 'opening-sonia'}
    if unknown:
        raise SystemExit('Unknown job: ' + ', '.join(sorted(unknown)))
    asyncio.run(main(args))
