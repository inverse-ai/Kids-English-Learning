import asyncio
import hashlib
import json
import re
import subprocess
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'dist' / 'audio'
SOURCE = 'https://cdn.oxfordowl.co.uk/2016/05/05/20/22/32/561/20097_content/'
SOURCE_PAGE = SOURCE + 'index.html?id=ae'

def get_bytes(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read()

async def main():
    specs = json.loads(subprocess.check_output(['node', 'tools/collect-family-audio.mjs'], cwd=ROOT, encoding='utf-8'))
    DEST.mkdir(parents=True, exist_ok=True)
    phonics_xml = await asyncio.to_thread(get_bytes, SOURCE + 'assets/xml/phonics.xml')
    names = {}
    for item in ET.fromstring(phonics_xml.decode('utf-8-sig')).iter('item'):
        name = re.sub(r'<[^>]+>', '', item.findtext('phonic', '')).strip()
        if item.get('sound1'):
            names[name] = SOURCE + item.get('sound1')
    letters = set(''.join(spec['text'] for spec in specs if spec['key'].startswith('word:')))
    for letter in sorted(letters):
        specs.append({'key':'sound:'+letter, 'url':names['k' if letter=='c' else letter]})
    slots = asyncio.Semaphore(3)
    completed = 0
    async def generate(spec):
        nonlocal completed
        seed = spec.get('url') or '|'.join([spec['voice'], spec['rate'], spec['text']])
        target = DEST / (hashlib.sha256(seed.encode()).hexdigest()[:24] + '.mp3')
        async with slots:
            if not target.exists() or target.stat().st_size < 500:
                temporary = target.with_suffix('.part')
                for attempt in range(3):
                    try:
                        if spec.get('url'):
                            data = await asyncio.to_thread(get_bytes, spec['url'])
                            temporary.write_bytes(data)
                        else:
                            await asyncio.wait_for(edge_tts.Communicate(spec['text'], spec['voice'], rate=spec['rate']).save(str(temporary)), timeout=40)
                        if temporary.stat().st_size < 500:
                            raise RuntimeError('Empty clip for ' + spec['key'])
                        temporary.replace(target)
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2)
            completed += 1
            if completed % 20 == 0 or completed == len(specs):
                print(f'Prepared {completed}/{len(specs)} word-family clips', flush=True)
            return spec['key'], '/audio/' + target.name
    results = await asyncio.gather(*(generate(spec) for spec in specs))
    manifest = 'export const familySpeech = Object.freeze(' + json.dumps(dict(results), ensure_ascii=False, indent=2) + ');\n'
    target = ROOT / 'dist' / 'family-speech.js'
    temporary = target.with_suffix('.tmp')
    temporary.write_text(manifest, encoding='utf-8')
    temporary.replace(target)
    (ROOT / 'tools' / 'family-audio-source.json').write_text(json.dumps({'englishVoice':'en-GB-SoniaNeural','bengaliVoice':'bn-BD-NabanitaNeural','phonemeSource':SOURCE_PAGE,'phonemes':[spec for spec in specs if spec.get('url')],'clips':len(results)}, ensure_ascii=False, indent=2), encoding='utf-8')
    print('All word-family audio saved locally.', flush=True)

asyncio.run(main())
