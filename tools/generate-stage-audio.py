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

async def main():
    specs = json.loads(subprocess.check_output(['node', 'tools/collect-stage-audio.mjs'], cwd=ROOT, encoding='utf-8'))
    raw = await asyncio.to_thread(lambda: urllib.request.urlopen(SOURCE + 'assets/xml/phonics.xml', timeout=30).read())
    names = {}
    for item in ET.fromstring(raw.decode('utf-8-sig')).iter('item'):
        name = re.sub(r'<[^>]+>', '', item.findtext('phonic', '')).strip()
        if item.get('sound1'):
            names[name] = SOURCE + item.get('sound1')
    aliases = {'c':'k','qu':'kw','x':'ks','ck':'k','ea':'ee'}
    for sound in list('abcdefghijklmnoprstuvwxyz') + ['qu','sh','ch','ck','ai','ea']:
        specs.append({'key':'sound:'+sound,'url':names[aliases.get(sound,sound)]})
    slots = asyncio.Semaphore(4)
    completed = 0
    async def generate(spec):
        nonlocal completed
        seed = spec.get('url') or '|'.join([spec['voice'],spec['rate'],spec['text']])
        target = DEST / (hashlib.sha256(seed.encode()).hexdigest()[:24]+'.mp3')
        async with slots:
            if not target.exists() or target.stat().st_size < 500:
                temporary = target.with_suffix('.part')
                for attempt in range(3):
                    try:
                        if spec.get('url'):
                            data = await asyncio.to_thread(lambda: urllib.request.urlopen(spec['url'],timeout=30).read())
                            temporary.write_bytes(data)
                        else:
                            await asyncio.wait_for(edge_tts.Communicate(spec['text'],spec['voice'],rate=spec['rate']).save(str(temporary)),timeout=45)
                        if temporary.stat().st_size < 500:
                            raise RuntimeError('Empty clip: '+spec['key'])
                        temporary.replace(target)
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2)
            completed += 1
            if completed % 30 == 0 or completed == len(specs):
                print(f'Prepared {completed}/{len(specs)} stage clips',flush=True)
            return spec['key'],'/audio/'+target.name
    results = await asyncio.gather(*(generate(spec) for spec in specs))
    target = ROOT / 'dist' / 'stage-speech.js'
    temporary = target.with_suffix('.tmp')
    temporary.write_text('export const stageSpeech=Object.freeze('+json.dumps(dict(results),ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
    temporary.replace(target)
    (ROOT/'tools'/'stage-audio-source.json').write_text(json.dumps({'voice':'en-GB-SoniaNeural','bengaliVoice':'bn-BD-NabanitaNeural','phonemeSource':SOURCE+'index.html?id=ae','phonemes':[s for s in specs if s.get('url')],'clips':len(results)},indent=2),encoding='utf-8')

asyncio.run(main())
