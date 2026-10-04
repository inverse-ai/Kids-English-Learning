"""Create only the ordinary spoken Arabic opening; retain existing lesson audio."""
import asyncio, hashlib, json
from pathlib import Path
import edge_tts
ROOT = Path(__file__).resolve().parents[1]
TEXT = 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ، بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ، رَبِّ زِدْنِي عِلْمًا'
VOICE = 'ar-SA-ZariyahNeural'
# Retain the fully vowelled Arabic. Full stops give each phrase a natural
# speaking pause; no recitation style or audio effects are used.
SPOKEN_TEXT = TEXT.replace('، ', '. ')+'.'
RATE = '-8%'
VOLUME = '-15%'
PITCH = '+0Hz'
async def main():
    # Prosody is part of the immutable asset identity, so installed apps cannot
    # mistake the revised recording for the old, cached audio.
    identity = json.dumps([VOICE, SPOKEN_TEXT, RATE, VOLUME, PITCH], ensure_ascii=False)
    name = hashlib.sha256(identity.encode()).hexdigest()[:24]+'.mp3'
    target = ROOT/'dist'/'audio'/name
    if not target.exists():
        temporary = target.with_suffix('.part')
        await asyncio.wait_for(edge_tts.Communicate(SPOKEN_TEXT, VOICE, rate=RATE, volume=VOLUME, pitch=PITCH).save(str(temporary)), timeout=60)
        if temporary.stat().st_size < 500: raise RuntimeError('Empty opening recording')
        temporary.replace(target)
    source={'text':TEXT,'spokenText':SPOKEN_TEXT,'voice':VOICE,'rate':RATE,'volume':VOLUME,'pitch':PITCH,'clip':'/audio/'+name,'style':'ordinary neural speech; separate phrase pauses; no music, echo, chanting or effects','humanListeningVerified':False,'textReferences':['https://sunnah.com/bukhari:6115','https://quran.com/1/1','https://quran.com/20/114']}
    (ROOT/'qa'/'opening-audio-source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'dist'/'opening-audio-data.js').write_text('export const openingAudioSource='+json.dumps(source,ensure_ascii=False)+';\n',encoding='utf-8')
    print('Prepared ordinary Arabic speech; human pronunciation and voice review remains required.')
asyncio.run(main())
