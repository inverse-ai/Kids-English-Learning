import http from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.PORT || 4174);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be between 1024 and 65535.');
const files = new Map([['/', ['index.html','text/html; charset=utf-8']], ['/app.js',['app.js','text/javascript; charset=utf-8']], ['/lesson-audio.js',['lesson-audio.js','text/javascript; charset=utf-8']], ['/recorded-speech.js',['recorded-speech.js','text/javascript; charset=utf-8']], ['/curriculum.js',['curriculum.js','text/javascript; charset=utf-8']], ['/style.css',['style.css','text/css; charset=utf-8']], ...['family-data','family-lessons','family-speech'].map(name=>['/'+name+'.js',[name+'.js','text/javascript; charset=utf-8']])]);
for(const name of ['stage-data','stage-lessons','stage-audio','stage-speech','story-flow','story-words','story-scenes','spelling-data','spelling-flow','speech-highlights','audio-timings','at-reading-data','at-reading-scene','at-reading','story-gaps','home-page','values-stories','values-scenes','values-flow','move-data','move-scenes','move-flow','practice-data','practice-flow','progress-store','pwa','sw'])files.set('/'+name+'.js',[name+'.js','text/javascript; charset=utf-8']);
for(const name of ['letter-match','letter-match-data'])files.set('/'+name+'.js',[name+'.js','text/javascript; charset=utf-8']);
for(const name of ['science-data','science-scenes','science-flow','math-data','math-scenes','math-flow','opening-audio','opening-audio-data','alphabet-reading','alphabet-reading-data'])files.set('/'+name+'.js',[name+'.js','text/javascript; charset=utf-8']);
files.set('/manifest.webmanifest',['manifest.webmanifest','application/manifest+json']);
for(const name of ['icon-192','icon-512','maskable-512','apple-touch-icon'])files.set('/icons/'+name+'.png',['icons/'+name+'.png','image/png']);
const server = http.createServer(async (req,res) => {
  const headers = {'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"};
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{...headers,Allow:'GET, HEAD'}); return res.end(); }
  const path = new URL(req.url,'http://localhost').pathname;
  const isAudio = /^\/audio\/[a-f0-9]{24}\.(mp3|wav)$/.test(path);
  const isPicture = /^\/pictures\/family-(at|an|ig|op|un)\.jpeg$/.test(path)||/^\/pictures\/family-(at|an|ig|op|un|en|in|ap|og|ug)\.png$/.test(path);
  const file = files.get(path) || (isAudio ? [path.slice(1),path.endsWith('.wav')?'audio/wav':'audio/mpeg'] : isPicture ? [path.slice(1),path.endsWith('.png')?'image/png':'image/jpeg'] : undefined);
  if (!file) { res.writeHead(404,headers); return res.end('Not found'); }
  try { const body = await readFile(new URL('./dist/'+file[0], import.meta.url)); res.writeHead(200,{...headers,'Content-Type':file[1],'Content-Length':body.length,...(isAudio?{'Cache-Control':'public, max-age=31536000, immutable'}:{})}); res.end(req.method === 'HEAD' ? undefined : body); }
  catch (error) { const status=error.code==='ENOENT'?404:500; res.writeHead(status,headers); res.end(status===404?'Not found':'Could not load this page. Please restart Little English.'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. If Little English is already running, open http://localhost:${port}.` : error.message); process.exitCode=1; });
server.listen(port,'127.0.0.1',()=>console.log(`Little English is ready at http://localhost:${port}`));
