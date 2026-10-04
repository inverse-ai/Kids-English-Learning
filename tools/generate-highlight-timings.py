"""Capture word boundaries and their audio together; never attach timings to another take."""
import asyncio
import hashlib
import json
import re
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'dist' / 'audio-timings.js'
PREFIX = 'export const audioTimings=Object.freeze('

async def main():
    specs = json.loads(subprocess.check_output(['node', 'tools/collect-stage-audio.mjs'], cwd=ROOT, encoding='utf-8'))
    specs = [s for s in specs if s['key'].startswith(('alphabet-case:', 'alphabet-example:', 'text:'))]
    legacy_file = ROOT / 'dist' / 'recorded-speech.js'
    legacy_source = legacy_file.read_text(encoding='utf-8')
    legacy = json.loads(legacy_source.split('Object.freeze(', 1)[1].rsplit(');', 1)[0])
    specs.extend({'key': 'legacy:' + text, 'text': text, 'voice': 'en-US-JennyNeural', 'rate': '-8%'} for text in legacy if text.startswith(('The letter ', 'Find the little letter ')))
    speech_file = ROOT / 'dist' / 'stage-speech.js'
    speech = json.loads(speech_file.read_text(encoding='utf-8').split('Object.freeze(', 1)[1].rsplit(');', 1)[0])
    timings = json.loads(MANIFEST.read_text(encoding='utf-8')[len(PREFIX):].rsplit(');', 1)[0]) if MANIFEST.exists() else {}
    slots = asyncio.Semaphore(4)
    completed = 0

    async def generate(spec):
        nonlocal completed
        source_map = legacy if spec['key'].startswith('legacy:') else speech
        source_key = spec['text'] if spec['key'].startswith('legacy:') else spec['key']
        existing = timings.get(source_map.get(source_key))
        if existing and existing['text'] == spec['text'] and existing.get('voice') == spec['voice'] and existing.get('rate') == spec['rate']:
            existing.update({'voice': spec['voice'], 'rate': spec['rate'], 'source': 'WordBoundary from the same audio stream'})
            completed += 1
            return
        async with slots:
            for attempt in range(3):
                try:
                    data = bytearray()
                    boundaries = []
                    voice = edge_tts.Communicate(spec['text'], spec['voice'], rate=spec['rate'], boundary='WordBoundary')
                    async for event in voice.stream():
                        if event['type'] == 'audio':
                            data.extend(event['data'])
                        elif event['type'] == 'WordBoundary':
                            boundaries.append(event)
                    if len(data) < 500 or not boundaries:
                        raise RuntimeError('Missing audio or word boundaries: ' + spec['key'])
                    words = []
                    cursor = 0
                    for event in boundaries:
                        token = event['text'].strip('.,!?;:')
                        match = re.search(re.escape(token), spec['text'][cursor:], flags=re.I)
                        if not match:
                            raise RuntimeError('Unmatched speech boundary: ' + repr(event))
                        start = cursor + match.start()
                        end = cursor + match.end()
                        words.append({'start': event['offset'] / 10_000_000, 'end': (event['offset'] + event['duration']) / 10_000_000, 'from': start, 'to': end})
                        cursor = end
                    # Content address the actual bytes. Old immutable recordings remain valid.
                    filename = hashlib.sha256(data).hexdigest()[:24] + '.mp3'
                    (ROOT / 'dist' / 'audio' / filename).write_bytes(data)
                    clip = '/audio/' + filename
                    source_map[source_key] = clip
                    timings[clip] = {'text': spec['text'], 'voice': spec['voice'], 'rate': spec['rate'], 'source': 'WordBoundary from the same audio stream', 'words': words}
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2)
            completed += 1
            if completed % 20 == 0 or completed == len(specs):
                print(f'Captured {completed}/{len(specs)} timed clips', flush=True)
    await asyncio.gather(*(generate(s) for s in specs))
    speech_file.write_text('export const stageSpeech=Object.freeze(' + json.dumps(speech, ensure_ascii=False, indent=2) + ');\n', encoding='utf-8')
    legacy_file.write_text(legacy_source.split('Object.freeze(', 1)[0] + 'Object.freeze(' + json.dumps(legacy, ensure_ascii=False, indent=2) + ');\n', encoding='utf-8')
    MANIFEST.write_text(PREFIX + json.dumps(timings, ensure_ascii=False, separators=(',', ':')) + ');\n', encoding='utf-8')
    print(f'Timestamps captured from the same audio stream: {len(timings)} clips', flush=True)

asyncio.run(main())
