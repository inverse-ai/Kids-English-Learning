"""Download Mishary Rashid Alafasy's real recitations for the Arabic opening.

Run on the PC (Claude's workspace cannot reach these sites):
    .audio-tools\\Scripts\\python tools\\fetch-opening-sources.py

It saves three MP3 files in tools/opening-sources/ and does not change the app.
Claude then cuts out the three phrases and installs the opening:
    a'udhu billahi min ash-shaytan ir-rajim  (from the start of Al-Fatiha, mp3quran.net)
    bismillah ir-rahman ir-rahim               (Quran 1:1, Quran.com)
    rabbi zidni ilma                           (end of Quran 20:114, Quran.com)
"""
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent / 'opening-sources'
SOURCES = {
    'alafasy-001-fatiha-full.mp3': 'https://server8.mp3quran.net/afs/001.mp3',
    'alafasy-001001-bismillah.mp3': 'https://verses.quran.com/Alafasy/mp3/001001.mp3',
    'alafasy-020114.mp3': 'https://verses.quran.com/Alafasy/mp3/020114.mp3',
}

OUT.mkdir(exist_ok=True)
for name, url in SOURCES.items():
    target = OUT / name
    if target.exists() and target.stat().st_size > 10000:
        print('already have', name)
        continue
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Little English app)'})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    if len(data) < 10000:
        raise SystemExit('Download looks wrong for ' + url + ' (' + str(len(data)) + ' bytes)')
    target.write_bytes(data)
    print('saved', name, len(data) // 1024, 'KB')
print('Done. Commit tools/opening-sources and push, so Claude can prepare the opening.')
