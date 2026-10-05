// Stories: visits every game-mode step (state override) and walks every
// without-games story screen by screen. Records what the narration will read.
import {chromium} from 'playwright';
import fs from 'fs';
const D=new URL('../dist/',import.meta.url).href;
const {playfulLesson,playfulIds}=await import(D+'playful-data.js');
const ids=playfulIds().filter(i=>i.startsWith('story:'));const only=process.env.ONLY;
const jobs=[];for(const id of ids.filter(i=>!only||i.includes(only))){jobs.push({id,mode:'game',n:playfulLesson(id).steps.length});jobs.push({id,mode:'plain'});}
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--autoplay-policy=no-user-gesture-required']});
const results=[];
const snap=p=>p.evaluate(async()=>{const a=await import('/stage-audio.js'),n=await import('/narration.js');const step=document.querySelector('[data-narration-step]');const q=n.narrationQueue();
 const lines=[...(step?.querySelectorAll('[data-narrate=en]')||[])].map(l=>({en:l.dataset.en,bn:l.dataset.bn||'',key:l.dataset.key||'',parts:l.dataset.parts||'',bnKey:l.dataset.bnKey||''}));
 const root=document.querySelector('.activity');
 const unmarked=[...(root?.querySelectorAll('.sentence,.story-line,.story-sentence,.playful-instruction,.blank-prompt,.value-context')||[])].filter(e=>!e.closest('[data-narrate]')&&!e.closest('button')&&e.offsetParent&&!e.querySelector('.paragraph-blank')&&!e.closest('.story-demonstration')).map(e=>e.textContent.trim()).filter(Boolean);
 return {key:step?.dataset.narrationStep||null,phase:root?.dataset.phase||root?.dataset.playfulType,lines,parts:q.parts.map(p=>p.key),missing:q.missing,unmarked,played:window.__played.slice(),bar:document.querySelector('.narration-bar')?.innerText.replace(/\n/g,' ')||''};});
async function worker(queue){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await ctx.newPage();p.setDefaultTimeout(3000);
 p.on('pageerror',e=>results.push({error:e.message}));
 await p.addInitScript(()=>{if(location.protocol!=='http:')return;localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));window.__played=[];const o=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__played.push(this.src.replace(location.origin,''));return o.call(this);};});
 await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(300);
 while(queue.length){const j=queue.shift(),sid=j.id.slice(6),values=sid.startsWith('values-');try{
  if(j.mode==='game'){for(let s=0;s<j.n;s++){
   await p.goto('about:blank');await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(120);
   await p.evaluate(({j,s})=>{const raw=JSON.parse(localStorage.getItem('little-english-v1')||'null');if(!raw)return;for(const L of [raw.learning,raw.profileData?.[raw.profile]?.learning].filter(Boolean)){L.playful??={current:null,wordsMet:[],lessons:{}};L.playful.wordsMet=[];L.storyWordsMet=[];L.valueWordsMet=[];L.playful.lessons[j.id]={step:s,completed:[],work:{},attempts:{},done:false};L.playful.current=j.id;}localStorage.setItem('little-english-v1',JSON.stringify(raw));},{j,s});
   await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(200);
   await p.click('[data-stage=stories]');await p.click('[data-action=stages-'+(values?'value-':'')+'story-open][data-id="'+sid+'"]');await p.waitForTimeout(350);
   results.push({...j,step:s,...await snap(p)});}}
  else{await p.goto('about:blank');await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(120);
   await p.evaluate(()=>{localStorage.clear();localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));});
   await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(200);
   await p.click('[data-stage=stories]');await p.click('[data-action=stages-'+(values?'value-':'')+'story-open][data-id="'+sid+'"]');await p.waitForTimeout(300);
   if(await p.$('[data-action=playful-reread]')){await p.click('[data-action=playful-reread]');await p.waitForTimeout(300);}
   const seen=new Set();
   for(let screen=0;screen<120;screen++){
    const r=await snap(p);if(r.key&&!seen.has(r.key)){seen.add(r.key);results.push({...j,screen,...r});}
    // advance
    const next=['[data-action=stages-story-helper-next]','[data-action=stages-story-next]','[data-action=stages-value-story-vocab-next]','[data-action=stages-story-mode]','[data-action=stages-story-blank-next]','[data-action=stages-value-story-next]','[data-action=stages-value-story-retry]','[data-action=stages-story-retry]'];
    let moved=false;for(const s of next){const el=await p.$(s);if(el&&await el.isEnabled()&&await el.isVisible()){await el.click();moved=true;break;}}
    if(!moved){const count=await p.locator('.story-answer-choices button').count();let done=false;for(let i=0;i<count&&!done;i++){await p.locator('.story-answer-choices button').nth(i).click({timeout:1000}).catch(()=>{});await p.waitForTimeout(100);if(await p.$('[data-action=stages-story-blank-next],[data-action=stages-value-story-next],[data-action=stages-story-finish],[data-action=stages-value-story-retry],[data-action=stages-story-retry]'))done=true;}
     if(!done&&!count)break;}
    await p.waitForTimeout(140);
   }}
  }catch(e){results.push({error:j.id+' '+j.mode+': '+e.message.split('\n')[0]});}
 }
 await ctx.close();}
const queue=[...jobs];await Promise.all([1,2,3,4,5,6].map(()=>worker(queue)));await b.close();
fs.mkdirSync('qa/out',{recursive:true});fs.writeFileSync('qa/out/story-crawl.json',JSON.stringify(results,null,1));
const steps=results.filter(r=>!r.error);
console.log('screens',steps.length,'game',steps.filter(r=>r.mode==='game').length,'plain',steps.filter(r=>r.mode==='plain').length,'errors',[...new Set(results.filter(r=>r.error).map(r=>r.error))].slice(0,5));
console.log('no key (game, not finish)',steps.filter(r=>r.mode==='game'&&!r.key&&r.phase!=='finish').map(r=>r.id+'#'+r.step+':'+r.phase).slice(0,20));
console.log('no lines',steps.filter(r=>r.key&&!r.lines.length).map(r=>r.key).slice(0,20));
console.log('unmarked',steps.filter(r=>r.unmarked.length).map(r=>r.key+': '+r.unmarked.join(' / ')).slice(0,20));
const miss=steps.flatMap(r=>r.missing);const by=l=>[...new Set(miss.filter(m=>m.lang===l).map(m=>m.text))];
console.log('missing EN',by('en').length,by('en').slice(0,15));console.log('untranslated',by('bn-translation'));console.log('BN to record',by('bn').length);
console.log('not autoplayed',steps.filter(r=>r.key&&r.parts.length&&!r.played.length).map(r=>r.key).slice(0,10));
const plain=new Set(steps.filter(r=>r.mode==='plain').map(r=>r.id));console.log('plain stories walked',plain.size,'of',ids.length);
console.log('plain phases',[...new Set(steps.filter(r=>r.mode==='plain').map(r=>r.key?.split(':')[2]))]);
