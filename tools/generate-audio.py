import asyncio
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICE = 'en-US-JennyNeural'
RATE = '-8%'
DEST = ROOT / 'dist' / 'audio'

async def main():
    texts = json.loads(subprocess.check_output(['node', str(ROOT / 'tools' / 'collect-audio.mjs')], cwd=ROOT, encoding='utf-8'))
    DEST.mkdir(parents=True, exist_ok=True)
    timing_file = ROOT / 'dist' / 'audio-timings.js'
    speech_file = ROOT / 'dist' / 'recorded-speech.js'
    timings = json.loads(timing_file.read_text(encoding='utf-8').split('Object.freeze(', 1)[1].rsplit(');', 1)[0]) if timing_file.exists() else {}
    prior_speech = json.loads(speech_file.read_text(encoding='utf-8').split('Object.freeze(', 1)[1].rsplit(');', 1)[0]) if speech_file.exists() else {}
    slots = asyncio.Semaphore(3)
    completed = 0
    async def generate(text):
        nonlocal completed
        prior = prior_speech.get(text)
        metadata = timings.get(prior)
        if metadata and metadata['text'] == text and metadata.get('voice') == VOICE and metadata.get('rate') == RATE and (ROOT / 'dist' / prior.lstrip('/')).exists():
            completed += 1
            return text, prior
        digest = hashlib.sha256(f'{VOICE}|{RATE}|{text}'.encode()).hexdigest()[:24]
        target = DEST / f'{digest}.mp3'
        async with slots:
            if not target.exists() or target.stat().st_size < 500:
                temporary = target.with_suffix('.part')
                for attempt in range(2):
                    try:
                        await asyncio.wait_for(edge_tts.Communicate(text, VOICE, rate=RATE).save(str(temporary)), timeout=35)
                        if temporary.stat().st_size < 500:
                            raise RuntimeError('Empty audio file')
                        temporary.replace(target)
                        break
                    except Exception:
                        if attempt == 1:
                            raise
                        await asyncio.sleep(1)
            completed += 1
            if completed % 20 == 0 or completed == len(texts):
                print(f'Prepared {completed}/{len(texts)} audio clips', flush=True)
            return text, f'/audio/{target.name}'
    results = await asyncio.gather(*(generate(text) for text in texts))
    data = dict(results)
    manifest = 'export const recordingVoice = ' + json.dumps('Jenny · English (US)') + ';\nexport const recordedSpeech = Object.freeze(' + json.dumps(data, ensure_ascii=False, indent=2) + ');\n'
    target = ROOT / 'dist' / 'recorded-speech.js'
    temporary = target.with_suffix('.tmp')
    temporary.write_text(manifest, encoding='utf-8')
    temporary.replace(target)
    (ROOT / 'tools' / 'audio-source.json').write_text(json.dumps({'voice':VOICE,'rate':RATE,'generator':'edge-tts 7.2.8','clips':len(data)},indent=2),encoding='utf-8')
    print(f'Saved {len(data)} lesson clips locally.', flush=True)

asyncio.run(main())
subprocess.check_call([sys.executable, str(ROOT / 'tools' / 'generate-highlight-timings.py')], cwd=ROOT)
