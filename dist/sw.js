// Bump APP_VERSION whenever shipped shell/lesson sources change. Audio is immutable.
const APP_VERSION='little-english-2026-10-05-english-math-v6';
const SHELL=APP_VERSION+'-shell',MEDIA='little-english-audio-v1';
const FILES=['/','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/maskable-512.png','/icons/apple-touch-icon.png','/style.css',...['app','curriculum','lesson-audio','recorded-speech','family-data','family-lessons','family-speech','stage-data','stage-lessons','stage-audio','stage-speech','story-flow','story-words','story-scenes','spelling-data','spelling-flow','speech-highlights','audio-timings','at-reading-data','at-reading-scene','at-reading','story-gaps','home-page','values-stories','values-scenes','values-flow','move-data','move-scenes','move-flow','practice-data','practice-flow','progress-store','pwa'].map(n=>'/'+n+'.js'),...['at','an','ig','op','un','en','in','ap','og','ug'].map(n=>'/pictures/family-'+n+'.png')];
FILES.push('/letter-match.js','/letter-match-data.js');
FILES.push('/math-data.js','/math-scenes.js','/math-flow.js');
FILES.push('/alphabet-reading.js','/alphabet-reading-data.js','/opening-audio.js','/opening-audio-data.js');
self.addEventListener('install',event=>{event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('little-english-')&&key!==SHELL&&key!==MEDIA)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 // Cache only shipped assets. Never cache exports, profile records, or arbitrary URLs.
 if(FILES.includes(url.pathname)){event.respondWith(caches.open(SHELL).then(async cache=>(await cache.match(url.pathname))||fetch(req)));return;}
 if(/^\/audio\/[a-f0-9]{24}\.(mp3|wav)$/.test(url.pathname)){event.respondWith((async()=>{const cache=await caches.open(MEDIA),cached=await cache.match(url.pathname);if(cached)return cached;try{const response=await fetch(req);if(response.ok&&response.status===200){await cache.put(url.pathname,response.clone());const keys=await cache.keys();if(keys.length>300)await cache.delete(keys[0]);}return response;}catch{return new Response('This audio has not been saved offline. Connect and replay it.',{status:503});}})());}
});
