// Whole-app review. Opens every game lesson step (both modes reach the same data)
// and walks every section menu screen by screen. On each screen it taps every
// activity button and reports buttons that do nothing, page errors, failed
// requests, horizontal overflow and screens without a way back.
// Run: node qa/review-crawl.mjs   (server on :4174)   ONLY=letter:a to limit.
import {chromium} from 'playwright';
import fs from 'fs';
const D=new URL('../dist/',import.meta.url).href;
const {playfulLesson,playfulIds}=await import(D+'playful-data.js');
const BASE='http://127.0.0.1:4174/';
const only=process.env.ONLY,PART=process.env.PART||'game,plain';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--autoplay-policy=no-user-gesture-required']});
const report={dead:[],errors:[],failed:[],overflow:[],noBack:[],stuck:[],screens:0};
const NAV=/^stages-science-animation$|^stages-math-action$|^playful-stop$|stages-[a-z-]*-stop$|^stages-pause$|back|home|next|previous|prev|-open|library|reread|skip|finish|settings|parents|^stage$|legacy|continue|visit|review-next|review-previous|story-mode|helper-next|vocab-next|vocab-prev|blank-next|start-home|lesson$|^profile|export|import|pwa|families|menu/;

async function page(){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await ctx.newPage();p.setDefaultTimeout(2500);p.setDefaultNavigationTimeout(20000);
 p.on('pageerror',e=>report.errors.push({where:p.__where,msg:e.message}));
 p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))report.errors.push({where:p.__where,msg:'console: '+m.text()});});
 p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))report.failed.push({where:p.__where,url:r.url().replace(BASE,'/'),status:r.status()});});
 await p.addInitScript(()=>{if(location.protocol!=='http:')return;try{localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));}catch{}window.__played=[];HTMLMediaElement.prototype.play=function(){window.__played.push(this.src);setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve();};if(window.speechSynthesis)speechSynthesis.speak=u=>{window.__played.push('tts:'+u.text);setTimeout(()=>u.onend?.(),30);};});
 return p;}
const snap=p=>p.evaluate(()=>{const m=document.querySelector('main');const h=m?m.innerHTML:'';let x=0;for(let i=0;i<h.length;i+=7)x=(x*31+h.charCodeAt(i))|0;return {h:h.length+':'+x+':'+document.getAnimations().filter(a=>a.playState==='running').length,played:window.__played.length,url:location.href,dialog:!!document.querySelector('dialog[open]'),title:(m?.querySelector('h1')?.textContent||'').trim()};});
async function probe(p,where,reopen){
 p.__where=where;report.screens++;if(report.screens%100===0)console.log('…',report.screens,'screens',report.dead.length,'dead so far');
 const info=await p.evaluate(()=>{const m=document.querySelector('main');if(!m)return null;
  const back=[...m.querySelectorAll('button,a')].some(e=>e.offsetParent&&/←|\bBack\b|Home|Return|Stories →/i.test(e.textContent));
  const over=document.documentElement.scrollWidth>innerWidth+1;
  const btns=[...m.querySelectorAll('button:not([disabled])')].filter(e=>e.offsetParent&&e.dataset.action).map((e,i)=>({a:e.dataset.action,v:e.dataset.value||e.dataset.word||e.dataset.index||e.dataset.key||e.dataset.letter||'',t:e.textContent.trim().slice(0,40)}));
  return {back,over,btns};});
 if(!info)return;
 if(!info.back)report.noBack.push(where);
 if(info.over)report.overflow.push(where);
 const seen=new Set();
 for(const btn of info.btns){
  if(NAV.test(btn.a))continue;const key=btn.a+'|'+btn.v+'|'+btn.t;if(seen.has(key))continue;seen.add(key);
  const before=await snap(p);
  const ok=await p.evaluate(({a,v,t})=>{const el=[...document.querySelectorAll('main button:not([disabled])')].find(e=>e.offsetParent&&e.dataset.action===a&&(e.dataset.value||e.dataset.word||e.dataset.index||e.dataset.key||e.dataset.letter||'')===v&&e.textContent.trim().slice(0,40)===t);if(!el)return false;el.click();return true;},btn);
  if(!ok)continue;await p.waitForTimeout(260);
  const after=await snap(p);
  if(after.h===before.h&&after.played===before.played&&after.url===before.url&&!after.dialog)report.dead.push({where,action:btn.a,value:btn.v,text:btn.t});
  if(after.dialog)await p.keyboard.press('Escape').catch(()=>{});
  if(after.title!==before.title&&reopen){await reopen();}
 }
}
async function resume(p,id,step){
 await p.goto('about:blank');await p.goto(BASE,{waitUntil:'domcontentloaded'});await p.waitForTimeout(150);
 await p.evaluate(({id,step})=>{const raw=JSON.parse(localStorage.getItem('little-english-v1')||'null');if(!raw)return;raw.lastActivity={kind:'playful',id};for(const L of [raw.learning,raw.profileData?.[raw.profile]?.learning].filter(Boolean)){L.playful??={current:null,wordsMet:[],lessons:{}};L.playful.wordsMet=[];L.storyWordsMet=[];L.valueWordsMet=[];L.playful.lessons[id]={step,completed:[],work:{},attempts:{},done:false};L.playful.current=id;}if(raw.profileData?.[raw.profile])raw.profileData[raw.profile].lastActivity={kind:'playful',id};localStorage.setItem('little-english-v1',JSON.stringify(raw));},{id,step});
 await p.goto('about:blank');await p.goto(BASE,{waitUntil:'domcontentloaded'});await p.waitForTimeout(200);
 await p.click('main [data-action=continue-home]').catch(()=>{});await p.waitForTimeout(250);
 return p.evaluate(()=>document.querySelector('.playful-player')?.dataset.playfulStep);
}
async function seed(p){await p.goto(BASE,{waitUntil:'domcontentloaded'});await p.waitForTimeout(200);await p.click('[data-stage=letters]');await p.waitForTimeout(200);await p.click('main [data-action=stages-letter-open]');await p.waitForTimeout(200);await p.click('main [data-action=playful-open]');await p.waitForTimeout(250);}

async function gamePart(){
 const ids=playfulIds().filter(i=>!only||i===only||i.startsWith(only));const queue=ids.flatMap(id=>playfulLesson(id).steps.map((_,s)=>({id,s})));
 await Promise.all([1,2,3,4].map(async()=>{let p=await page();await seed(p);let used=0;
  while(queue.length){const {id,s}=queue.shift();
   // A fresh tab every 40 steps (or after a crash) keeps memory low.
   if(++used>40||p.isClosed()){await p.context().close().catch(()=>{});p=await page();await seed(p).catch(()=>{});used=1;}
   try{const got=await resume(p,id,s);if(String(got)!==String(s)){report.stuck.push({where:'game '+id+'#'+s,msg:'could not open step (got '+got+')'});continue;}
   await probe(p,'game '+id+'#'+s+' '+(await p.evaluate(()=>document.querySelector('.playful-player')?.dataset.playfulType)),()=>resume(p,id,s));}catch(e){report.stuck.push({where:'game '+id+'#'+s,msg:e.message.split('\n')[0]});if(/crash/i.test(e.message)){await p.context().close().catch(()=>{});p=await page();await seed(p).catch(()=>{});used=1;}}}
  await p.context().close();}));
}
// Without games: every section menu card, then up to 25 screens forward.
async function plainPart(){
 const p0=await page();await p0.goto(BASE,{waitUntil:'domcontentloaded'});await p0.waitForTimeout(250);
 const entries=[];
 for(const sec of ['letters','words','stories','move','math','science']){await p0.goto(BASE,{waitUntil:'domcontentloaded'});await p0.waitForTimeout(150);await p0.click('[data-stage='+sec+']');await p0.waitForTimeout(200);
  const cards=await p0.evaluate(()=>[...document.querySelectorAll('main [data-action]')].filter(e=>e.offsetParent&&/^stages-|^family-|^practice-/.test(e.dataset.action)).map(e=>({a:e.dataset.action,id:e.dataset.id||'',i:e.dataset.index||''})));
  const uniq=[];for(const c of cards)if(!uniq.some(u=>u.a===c.a&&u.id===c.id&&u.i===c.i))uniq.push(c);
  for(const c of uniq)entries.push({sec,...c});}
 await p0.context().close();
 const queue=entries.filter(e=>!only||e.sec===only);
 await Promise.all([1,2,3,4].map(async()=>{let p=await page();let used=0;
  while(queue.length){const e=queue.shift();if(++used>15||p.isClosed()){await p.context().close().catch(()=>{});p=await page();used=1;}const open=async()=>{await p.goto('about:blank');await p.goto(BASE,{waitUntil:'domcontentloaded'});await p.waitForTimeout(150);await p.click('[data-stage='+e.sec+']');await p.waitForTimeout(150);await p.click('main [data-action="'+e.a+'"]'+(e.id?'[data-id="'+e.id+'"]':'')+(e.i?'[data-index="'+e.i+'"]':''));await p.waitForTimeout(250);if(await p.$('main [data-action=playful-reread]')){await p.click('main [data-action=playful-reread]');await p.waitForTimeout(250);}};
   try{await open();}catch(err){report.stuck.push({where:'plain '+e.sec+' '+e.a+' '+e.id,msg:'open: '+err.message.split('\n')[0]});continue;}
   let last='';for(let n=0;n<25;n++){const t=await snap(p);if(t.h===last)break;last=t.h;const where='plain '+e.sec+' '+e.a+(e.id?' '+e.id:'')+' screen '+n+' «'+t.title.slice(0,30)+'»';
    // remember the way to this screen: re-open and replay the forward clicks
    const path=p.__path||[];const reopen=async()=>{await open();for(const sel of path){await p.click(sel).catch(()=>{});await p.waitForTimeout(200);}};
    try{await probe(p,where,reopen);}catch(err){report.stuck.push({where,msg:err.message.split('\n')[0]});}
    // forward
    const next=await p.evaluate(()=>{const ok=e=>e&&e.offsetParent&&!e.disabled;const cand=[...document.querySelectorAll('main button')].filter(ok).find(e=>/^(Next|Continue|Start|Let.s|Try|Read|Watch first|Next word|Next meaning|Start story|Step 2|I read|We tried|Done)/i.test(e.textContent.trim())&&!/Previous|←/.test(e.textContent));if(!cand)return null;const a=cand.dataset.action;const sel='main button[data-action="'+a+'"]';cand.click();return sel;});
    if(!next){// try answering: tap choices until a Next appears
     const n2=await p.evaluate(async()=>{const ch=[...document.querySelectorAll('main .choice,main .word-choice,main .at-choice,main .family-choice,main .playful-choice,main .math-choice,main .science-choice,main [data-action$=answer]')].filter(e=>e.offsetParent&&!e.disabled);for(const c of ch){c.click();await new Promise(r=>setTimeout(r,120));if([...document.querySelectorAll('main button')].some(e=>e.offsetParent&&!e.disabled&&/^(Next|Continue|Try with help)/i.test(e.textContent.trim())))return true;}return false;});
     if(!n2)break;continue;}
    p.__path=[...path,next];await p.waitForTimeout(250);
   }p.__path=[];}
  await p.context().close();}));
}
if(PART.includes('game'))await gamePart();
if(PART.includes('plain'))await plainPart();
await b.close();
fs.mkdirSync('qa/out',{recursive:true});fs.writeFileSync('qa/out/review-crawl.json',JSON.stringify(report,null,1));
const group=(list,f)=>{const m=new Map();for(const x of list){const k=f(x);m.set(k,(m.get(k)||0)+1);}return [...m].sort((a,b)=>b[1]-a[1]);};
console.log('screens',report.screens);
console.log('DEAD buttons by action:',group(report.dead,d=>d.action+' «'+d.text+'»').slice(0,40));
console.log('errors:',group(report.errors,e=>e.msg.slice(0,120)).slice(0,20));
console.log('failed requests:',group(report.failed,f=>f.status+' '+f.url).slice(0,20));
console.log('overflow:',report.overflow.slice(0,15));console.log('no back:',report.noBack.slice(0,15));console.log('stuck:',report.stuck.slice(0,15));
