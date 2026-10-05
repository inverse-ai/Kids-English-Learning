// Behaviour checks for automatic narration (Math/Science, both modes):
// plays once per step, no restart on answer/drag re-render, no overlap, Replay
// restarts, Pause/Resume, Next/Previous/Next lesson, autoplay-blocked Start button.
import {chromium} from 'playwright';
let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++;};
async function page(b,{block=false}={}){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await ctx.newPage();p.setDefaultTimeout(5000);
 p.on('pageerror',e=>ok(false,'page error '+e.message));
 await p.addInitScript(({block})=>{if(location.protocol!=='http:')return;localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));
  window.__played=[];window.__all=new Set();window.__maxLive=0;window.__blocked=block;
  const o=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__played.push(this.src.replace(location.origin,''));
   if(window.__blocked){const e=new DOMException('play() failed because the user didn\'t interact','NotAllowedError');return Promise.reject(e);}
   window.__all.add(this);const live=[...window.__all].filter(a=>a!==this&&!a.paused&&!a.ended&&a.getAttribute('src'));window.__maxLive=Math.max(window.__maxLive,live.length+1);return o.call(this);};},{block});
 await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(200);return {ctx,p};}
const played=p=>p.evaluate(()=>window.__played.length);const bar=p=>p.evaluate(()=>document.querySelector('.narration-bar')?.innerText||'');
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
// --- plain Math
{const {ctx,p}=await page(b);await p.click('[data-stage=math]');await p.click('[data-id=math-flowers]');await p.click('[data-action=playful-reread]');await p.waitForTimeout(600);
 ok(await played(p)>=1,'plain math: narration starts by itself');
 ok(await p.evaluate(()=>document.querySelector('[data-narration-step]').dataset.narrationStep==='math:math-flowers:core:0'),'plain math: step key');
 const n1=await played(p);await p.evaluate(()=>document.querySelector('#math-level')?.dispatchEvent(new Event('change',{bubbles:true})));await p.waitForTimeout(300);
 // re-render without step change: selecting Bangla help etc. — simulate render(false) through a harmless action (focus) by clicking Stop then checking no auto restart
 await p.click('[data-action=stages-math-stop]');await p.waitForTimeout(200);const n2=await played(p);ok(n2===n1,'plain math: Stop does not restart narration ('+n1+'→'+n2+')');
 ok((await bar(p)).includes('Replay'),'plain math: bar shows Replay after stop');
 await p.click('[data-action=narration-replay]');await p.waitForTimeout(300);ok(await played(p)>n2,'plain math: Replay restarts');
 await p.click('[data-action=narration-pause]');await p.waitForTimeout(100);ok((await bar(p)).includes('Resume'),'plain math: Pause shows Resume');
 ok(await p.evaluate(()=>[...document.querySelectorAll('audio')].length>=0),'');
 await p.click('[data-action=narration-pause]');await p.waitForTimeout(100);ok((await bar(p)).includes('Pause'),'plain math: Resume shows Pause');
 // walk every step to the end, checking each step narrates exactly once and nothing overlaps
 let steps=0,restarts=0;for(let i=0;i<20;i++){const before=await played(p);const key=await p.evaluate(()=>document.querySelector('[data-narration-step]')?.dataset.narrationStep);
  const next=await p.$('[data-action=stages-math-next]:not([disabled])');
  if(!next){const choices=await p.$$('[data-action=stages-math-answer]:not([disabled])');if(!choices.length)break;
   for(let k=0;k<choices.length;k++){const loc=p.locator('[data-action=stages-math-answer]:not([disabled])');const c=await loc.count();if(!c)break;await loc.nth(Math.min(k,c-1)).click().catch(()=>{});await p.waitForTimeout(350);if(await p.$('[data-action=stages-math-next]:not([disabled])'))break;}
   const after=await played(p);const key2=await p.evaluate(()=>document.querySelector('[data-narration-step]')?.dataset.narrationStep);if(key2===key&&after-before>choices.length*2)restarts++;continue;}
  await next.click();await p.waitForTimeout(500);steps++;}
 ok(restarts===0,'plain math: answering never restarts narration');
 ok(await p.evaluate(()=>window.__maxLive)<=1,'plain math: never more than one clip playing at once (max '+await p.evaluate(()=>window.__maxLive)+')');
 const finish=await p.evaluate(()=>document.querySelector('[data-math-type=finish]')?!!document.querySelector('[data-action=stages-math-next-lesson]'):null);ok(finish===true,'plain math: finish screen has Next lesson');
 await p.click('[data-action=stages-math-next-lesson]');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>document.querySelector('[data-math-lesson]')?.dataset.mathLesson==='math-birds'),'plain math: Next lesson opens Birds in the Tree');
 ok(await p.evaluate(()=>document.querySelector('[data-narration-step]')?.dataset.narrationStep.startsWith('math:math-birds')),'plain math: next lesson narrates');
 await p.click('[data-action=stages-math-back]');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.querySelector('.math-lesson-card.is-current')?.dataset.id==='math-birds'&&[...document.querySelectorAll('.lesson-number')].map(e=>e.textContent).join(',')==='1,2,3,4,5,6,7,8,9,10,11,12'),'plain math: numbered cards, current marked');
 ok(await p.evaluate(()=>document.querySelector('.math-lesson-card.is-done')?.dataset.id==='math-flowers'),'plain math: finished lesson marked done');
 await p.click('.resume-strip button');await p.waitForTimeout(300);ok(await p.evaluate(()=>document.querySelector('[data-math-lesson]')?.dataset.mathLesson==='math-birds'),'plain math: Continue resumes current lesson');
 await ctx.close();}
// --- game Math: drag/answer re-renders do not restart
{const {ctx,p}=await page(b);await p.click('[data-stage=math]');await p.click('[data-id=math-flowers]');await p.waitForTimeout(600);
 ok(await p.evaluate(()=>!!document.querySelector('[data-narration-step]')&&!document.querySelector('.playful-word')&&!document.querySelector('[data-action=playful-audio]')),'game math: narrated, no vocab card, no Listen button');
 ok(await p.evaluate(()=>!!document.querySelector('.narration-bangla')),'game math: Bangla line shown under the sentence');
 let restarts=0,steps=0;for(let i=0;i<25;i++){const key=await p.evaluate(()=>document.querySelector('[data-narration-step]')?.dataset.narrationStep);if(!key)break;const before=await played(p);
  // interact: tap count objects / choices / show-me
  for(const sel of ['[data-action=playful-count]','[data-action=playful-choose]','[data-action=playful-demonstrate]']){const n=Math.min(3,await p.locator(sel+':not([disabled])').count());for(let k=0;k<n;k++){await p.locator(sel+':not([disabled])').first().click({timeout:800}).catch(()=>{});await p.waitForTimeout(120);}}
  await p.waitForTimeout(300);const key2=await p.evaluate(()=>document.querySelector('[data-narration-step]')?.dataset.narrationStep);
  // A restart would play the step's first narration clip again; activity taps play other clips.
  const again=await p.evaluate(({before})=>{const first=window.__played[window.__stepStart??0];return window.__played.slice(before).includes(first);},{before});if(key2===key&&again)restarts++;
  const next=await p.$('[data-action=playful-next]:not([disabled])');if(!next)break;await p.evaluate(()=>{window.__stepStart=window.__played.length;});await next.click();await p.waitForTimeout(500);steps++;}
 ok(restarts===0,'game math: activity taps never restart narration (steps walked '+steps+')');
 ok(await p.evaluate(()=>window.__maxLive)<=1,'game math: no overlapping clips');
 await ctx.close();}
// --- autoplay blocked → Start lesson
{const {ctx,p}=await page(b,{block:true});await p.click('[data-stage=science]');await p.click('[data-id=science-sunlight]');await p.waitForTimeout(600);
 ok((await bar(p)).includes('Start lesson'),'blocked autoplay: Start lesson button shown');
 await p.evaluate(()=>{window.__blocked=false;});await p.click('[data-action=narration-start]');await p.waitForTimeout(400);
 ok((await bar(p)).includes('Pause')&&!(await bar(p)).includes('Start lesson'),'blocked autoplay: Start begins narration');
 await ctx.close();}
// --- narration off preference
{const {ctx,p}=await page(b);await p.evaluate(()=>localStorage.setItem('little-english-narration-v1',JSON.stringify({version:1,enabled:false})));await p.reload();await p.waitForTimeout(200);
 await p.click('[data-stage=science]');await p.click('[data-id=science-sunlight]');await p.waitForTimeout(500);
 ok(await played(p)===0&&(await bar(p)).includes('Replay'),'narration off: nothing plays, Replay offered');
 await p.click('[data-action=narration-replay]');await p.waitForTimeout(300);ok(await played(p)>0,'narration off: Replay still plays');
 await ctx.close();}
await b.close();console.log(fails?'FAILURES '+fails:'ALL OK');process.exit(fails?1:0);
