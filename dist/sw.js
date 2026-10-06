// Bump APP_VERSION whenever shipped shell/lesson sources change. Audio is immutable.
const APP_VERSION='little-english-2026-10-06-opening-voices-v41';
const SHELL=APP_VERSION+'-shell',MEDIA='little-english-audio-v1';
const FILES=['/','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/icons/apple-touch-icon.png','/style.css',...['app','curriculum','lesson-audio','recorded-speech','family-data','family-lessons','family-speech','stage-data','stage-lessons','stage-audio','stage-speech','story-flow','story-words','story-scenes','spelling-data','spelling-flow','speech-highlights','audio-timings','at-reading-data','at-reading-scene','at-reading','story-gaps','home-page','values-stories','values-scenes','values-flow','move-data','move-scenes','move-flow','practice-data','practice-flow','progress-store','pwa'].map(n=>'/'+n+'.js'),...['at','an','ig','op','un','en','in','ap','og','ug'].map(n=>'/pictures/family-'+n+'.png')];
FILES.push('/letter-match.js','/letter-match-data.js');
FILES.push('/science-data.js','/science-scenes.js','/science-flow.js');
FILES.push('/math-data.js','/math-scenes.js','/math-flow.js');
FILES.push('/alphabet-reading.js','/alphabet-reading-data.js','/opening-audio.js','/opening-audio-data.js');
FILES.push('/playful-review.js');
FILES.push(...['cat','hat','mat','rat','bat','pat','sat','fat','can','man','pan','fan','van','ran','pig','big','dig','wig','hop','mop','top','pop','sun','run','bun','fun','gun','hen','pen','ten','den','pin','tin','fin','bin','cap','map','tap','nap','dog','log','fog','jog','bug','mug','rug','hug'].map(w=>'/pictures/words/'+w+'.webp'));
FILES.push('/playful-data.js','/playful-store.js','/playful-flow.js','/playful-audio.js','/letter-trails.js');
FILES.push('/word-family-maps.js','/pictures/posters/all.png');
FILES.push('/narration.js','/bangla-lines.js','/bangla-speech.js','/app-settings.js','/voice-speech.js','/lesson-stickers.js');
FILES.push('/sentence-writing.js','/sentence-writing-data.js');
FILES.push('/illustration-style.js','/word-art.js','/character-art.js','/value-object-art.js','/section-registry.js');
self.addEventListener('install',event=>{event.waitUntil((async()=>{
 const cache=await caches.open(SHELL);
 // Fetch the complete new shell from the server, bypassing old HTTP caches.
 // A failed install leaves the previous working shell active.
 await cache.addAll(FILES.map(path=>new Request(path,{cache:'reload'})));
 await self.skipWaiting();
})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
 const oldShells=(await caches.keys()).filter(key=>key.startsWith('little-english-')&&key!==SHELL&&key!==MEDIA);
 for(const key of oldShells)await caches.delete(key);
 await self.clients.claim();
 if(oldShells.length){
  // Older app scripts cannot display the new update UI. Refresh those windows
  // once; their existing pagehide handler saves unfinished work and stops audio.
  // Do not await navigation: its fetch waits for this activation to finish.
  for(const client of await self.clients.matchAll({type:'window'}))client.navigate(client.url).catch(()=>{});
 }
})());});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 // Cache only shipped assets. Never cache exports, profile records, or arbitrary URLs.
 if(FILES.includes(url.pathname)){event.respondWith(caches.open(SHELL).then(async cache=>(await cache.match(url.pathname))||fetch(req)));return;}
 if(/^\/audio\/[a-f0-9]{24}\.(mp3|wav)$/.test(url.pathname)){event.respondWith((async()=>{const cache=await caches.open(MEDIA),cached=await cache.match(url.pathname);if(cached)return cached;try{const response=await fetch(req);if(response.ok&&response.status===200){await cache.put(url.pathname,response.clone());const keys=await cache.keys();if(keys.length>300)await cache.delete(keys[0]);}return response;}catch{return new Response('This audio has not been saved offline. Connect and replay it.',{status:503});}})());}
});
