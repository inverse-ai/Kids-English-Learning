// Walks the app two clicks deep from every section and lists screens without a way back.
import {chromium} from 'playwright';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await ctx.newPage();p.setDefaultTimeout(2500);
await p.addInitScript(()=>{if(location.protocol!=='http:')return;localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));HTMLMediaElement.prototype.play=function(){return Promise.resolve();};});
const back=()=>p.evaluate(()=>{const m=document.querySelector('main');if(!m)return {ok:false,title:''};const btns=[...m.querySelectorAll('button,a')].filter(e=>e.offsetParent&&/←|\bBack\b|Home|Stories →|Return/i.test(e.textContent));return {ok:btns.length>0,title:(m.querySelector('h1')?.textContent||m.querySelector('h2')?.textContent||'').trim().slice(0,50),btn:btns[0]?.textContent.trim().slice(0,30)};});
const missing=[],seen=new Set();
async function fresh(){await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(250);}
for(const sec of ['letters','words','stories','move','math','science']){
 await fresh();await p.click('.stage-nav [data-stage='+sec+'],[data-stage='+sec+']');await p.waitForTimeout(250);
 const cards=await p.evaluate(()=>[...document.querySelectorAll('main [data-action^=stages-]')].filter(e=>e.offsetParent).map(e=>({a:e.dataset.action,id:e.dataset.id||'',i:e.dataset.index||''})));
 const uniq=[];for(const c of cards){const k=c.a;if(!uniq.some(u=>u.a===k))uniq.push(c);}
 for(const c of uniq.slice(0,14)){
  await fresh();await p.click('.stage-nav [data-stage='+sec+'],[data-stage='+sec+']');await p.waitForTimeout(200);
  const sel='main [data-action="'+c.a+'"]'+(c.id?'[data-id="'+c.id+'"]':'')+(c.i?'[data-index="'+c.i+'"]':'');
  try{await p.click(sel);}catch{continue;}await p.waitForTimeout(300);
  let r=await back();const key=sec+' > '+c.a;if(!r.ok)missing.push(key+' : '+r.title);
  // one more level
  const inner=await p.evaluate(()=>[...document.querySelectorAll('main [data-action]')].filter(e=>e.offsetParent&&/open|start|library|lesson/.test(e.dataset.action)&&!/back|home/.test(e.dataset.action)).slice(0,2).map(e=>({a:e.dataset.action,id:e.dataset.id||''})));
  for(const d of inner){try{await p.click('main [data-action="'+d.a+'"]'+(d.id?'[data-id="'+d.id+'"]':''));}catch{continue;}await p.waitForTimeout(300);r=await back();if(!r.ok)missing.push(key+' > '+d.a+' : '+r.title);break;}
 }
}
for(const v of ['settings','parents']){await fresh();await p.click('[data-action='+v+']').catch(()=>{});await p.waitForTimeout(250);const r=await back();if(!r.ok)missing.push(v);}
console.log(missing.length?missing.join('\n'):'every screen visited has a way back');
await b.close();
