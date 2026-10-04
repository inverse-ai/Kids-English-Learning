"""Create only the ordinary spoken Arabic opening; retain existing lesson audio."""
import asyncio, hashlib, json
from pathlib import Path
import edge_tts
ROOT = Path(__file__).resolve().parents[1]
TEXT = 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ، بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ، رَبِّ زِدْنِي عِلْمًا'
VOICE = 'ar-SA-ZariyahNeural'
async def main():
    name = hashlib.sha256((VOICE+'|'+TEXT).encode()).hexdigest()[:24]+'.mp3'
    target = ROOT/'dist'/'audio'/name
    if not target.exists():
        temporary = target.with_suffix('.part')
        await asyncio.wait_for(edge_tts.Communicate(TEXT, VOICE, rate='+0%', volume='+0%', pitch='+0Hz').save(str(temporary)), timeout=60)
        if temporary.stat().st_size < 500: raise RuntimeError('Empty opening recording')
        temporary.replace(target)
    source={'text':TEXT,'voice':VOICE,'rate':'+0%','clip':'/audio/'+name,'style':'ordinary neural speech; no music, echo, chanting or effects','humanListeningVerified':False}
    (ROOT/'qa'/'opening-audio-source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'dist'/'opening-audio-data.js').write_text('export const openingAudioSource='+json.dumps(source,ensure_ascii=False)+';\n',encoding='utf-8')
    print('Prepared ordinary Arabic speech; human pronunciation and voice review remains required.')
asyncio.run(main())
