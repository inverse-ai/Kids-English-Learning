"""Update alphabet case narration and add spelling intros; retain all audio assets."""
import asyncio
import hashlib
import json
import subprocess
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
SPEECH = ROOT / 'dist' / 'stage-speech.js'
TIMINGS = ROOT / 'dist' / 'audio-timings.js'
def read_map(path):
    return json.loads(path.read_text(encoding='utf-8').split('Object.freeze(', 1)[1].rsplit(');', 1)[0])

async def main():
    source = "import{alphabet,alphabetCaseText,alphabetExampleText}from'./dist/stage-data.js';import{spellingIntroText}from'./dist/spelling-data.js';import{letters}from'./dist/curriculum.js';const specs=[];const add=(key,text,rate='-12%')=>specs.push({key,text,voice:'en-GB-SoniaNeural',rate});for(const a of alphabet){add('alphabet-case:'+a.letter,alphabetCaseText(a.letter));for(const word of a.examples)add('spelling-intro:'+a.letter+':'+word,spellingIntroText(a.letter,word),'+0%');add('alphabet-example:'+a.letter+':'+letters[a.letter].word,alphabetExampleText(a.letter,letters[a.letter].word));add('word:'+letters[a.letter].word,letters[a.letter].word);}process.stdout.write(JSON.stringify(specs));"
    specs = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', source], cwd=ROOT, encoding='utf-8'))
    speech, timings, family = read_map(SPEECH), read_map(TIMINGS), read_map(ROOT / 'dist' / 'family-speech.js')
    slots = asyncio.Semaphore(4)
    async def generate(spec):
        existing = speech.get(spec['key'])
        if existing and not spec['key'].startswith(('alphabet-case:', 'spelling-intro:')):
            return
        if existing and (ROOT / 'dist' / existing.lstrip('/')).exists():
            if spec['voice'].startswith('bn-') or timings.get(existing, {}).get('text') == spec['text']:
                return
        known = next((clip for clip, m in timings.items() if m['text'] == spec['text'] and m['voice'] == spec['voice'] and m['rate'] == spec['rate']), None)
        if known:
            speech[spec['key']] = known
            return
        async with slots:
            for attempt in range(3):
                try:
                    data, events = bytearray(), []
                    english = spec['voice'].startswith('en-')
                    voice = edge_tts.Communicate(spec['text'], spec['voice'], rate=spec['rate'], boundary='WordBoundary' if english else 'SentenceBoundary')
                    async for event in voice.stream():
                        if event['type'] == 'audio':
                            data.extend(event['data'])
                        elif event['type'] == 'WordBoundary':
                            events.append(event)
                    if len(data) < 500 or english and not events:
                        raise RuntimeError('Missing audio/boundaries: ' + spec['key'])
                    words, cursor = [], 0
                    for event in events:
                        token = event['text'].strip('.,!?;:')
                        start = spec['text'].lower().index(token.lower(), cursor)
                        cursor = start + len(token)
                        words.append({'start': event['offset'] / 10_000_000, 'end': (event['offset'] + event['duration']) / 10_000_000, 'from': start, 'to': cursor})
                    filename = hashlib.sha256(data).hexdigest()[:24] + '.mp3'
                    (ROOT / 'dist' / 'audio' / filename).write_bytes(data)
                    clip = '/audio/' + filename
                    speech[spec['key']] = clip
                    if words:
                        timings[clip] = {'text': spec['text'], 'voice': spec['voice'], 'rate': spec['rate'], 'source': 'WordBoundary from the same audio stream', 'words': words}
                    print('Prepared ' + spec['key'], flush=True)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2)
    await asyncio.gather(*(generate(spec) for spec in {spec['key']: spec for spec in specs}.values()))
    SPEECH.write_text('export const stageSpeech=Object.freeze(' + json.dumps(speech, ensure_ascii=False, indent=2) + ');\n', encoding='utf-8')
    TIMINGS.write_text('export const audioTimings=Object.freeze(' + json.dumps(timings, ensure_ascii=False, separators=(',', ':')) + ');\n', encoding='utf-8')
    print('Alphabet and spelling introductions are ready.', flush=True)

asyncio.run(main())
