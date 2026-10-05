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

ENGLISH_VOICE, ENGLISH_RATE = 'en-GB-SoniaNeural', '-12%'
BANGLA_VOICE, BANGLA_RATE = 'bn-BD-NabanitaNeural', '-8%'


def read_map(path):
    if not path.exists():
        return {}
    text = path.read_text(encoding='utf-8')
    return json.loads(text.split('Object.freeze(', 1)[1].rsplit(');', 1)[0])


def write_map(path, name, data, prefix=''):
    path.write_text(prefix + 'export const ' + name + '=Object.freeze(' + json.dumps(data, ensure_ascii=False, indent=2) + ');\n', encoding='utf-8')


async def record(text, voice, rate, slots, want_words):
    """Return (clip path, timing record or None)."""
    async with slots:
        for attempt in range(4):
            try:
                data, events = bytearray(), []
                speaker = edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary' if want_words else 'SentenceBoundary')
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


async def main(jobs):
    AUDIO.mkdir(parents=True, exist_ok=True)
    timings, speech = read_map(TIMINGS), read_map(SPEECH)
    if 'voice' in jobs:
        await job_voice(timings, speech)
    if 'family' in jobs:
        await job_family(timings, speech)
    if 'bangla' in jobs:
        await job_bangla(timings, speech)
    write_map(SPEECH, 'stageSpeech', speech)
    TIMINGS.write_text('export const audioTimings=Object.freeze(' + json.dumps(timings, ensure_ascii=False, separators=(',', ':')) + ');\n', encoding='utf-8')
    print('Finished. Now run: npm run check, then bump APP_VERSION in dist/sw.js.', flush=True)


if __name__ == '__main__':
    args = set(sys.argv[1:]) or {'all'}
    if 'all' in args:
        args = {'voice', 'family', 'bangla'}
    unknown = args - {'voice', 'family', 'bangla'}
    if unknown:
        raise SystemExit('Unknown job: ' + ', '.join(sorted(unknown)))
    asyncio.run(main(args))
