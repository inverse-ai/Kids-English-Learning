// Visits every step of the narrated sections in both modes and records what is
// shown and what the narration queue will read. Output: qa/out/narration-crawl.json
import {chromium} from 'playwright';
import fs from 'fs';
const D=new URL('../dist/',import.meta.url).href;
const {mathLessons,mathSteps}=await import(D+'math-data.js');
const {scienceLessons,scienceSteps}=await import(D+'science-data.js');
const {playfulLesson}=await import(D+'playful-data.js');
const jobs=[];
for(const l of mathLessons){jobs.push({sec:'math',lid:l.id,mode:'game',n:playfulLesson('math:'+l.id).steps.length});jobs.push({sec:'math',lid:l.id,mode:'plain',n:mathSteps(l).length});}
for(const l of scienceLessons){jobs.push({sec:'science',lid:l.id,mode:'game',n:playfulLesson('science:'+l.id).steps.length});jobs.push({sec:'science',lid:l.id,mode:'plain',n:scienceSteps(l).length});}
const only=process.env.ONLY;const list=jobs.filter(j=>!only||j.lid===only);
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const results=[];
async function worker(queue){const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await ctx.newPage();p.setDefaultTimeout(4000);
 p.on('pageerror',e=>results.push({error:e.message}));
 await p.addInitScript(()=>{if(location.protocol!=='http:')return;localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));window.__played=[];const o=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__played.push(this.src.replace(location.origin,''));return o.call(this);};});
 await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(300);
 // create base progress by opening once
 while(queue.length){const j=queue.shift();
  for(let s=0;s<j.n;s++){
   await p.goto('about:blank');await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(150);
   await p.evaluate(({j,s})=>{const raw=JSON.parse(localStorage.getItem('little-english-v1')||'null');if(!raw)return;for(const L of [raw.learning,raw.profileData?.[raw.profile]?.learning].filter(Boolean)){
    if(j.mode==='game'){L.playful??={current:null,wordsMet:[],lessons:{}};L.playful.lessons[j.sec+':'+j.lid]={step:s,completed:[],work:{},attempts:{},done:false};L.playful.current=j.sec+':'+j.lid;}
    else{if(j.sec==='math'){L.math??={level:2,current:null,wordsMet:[],lessons:{}};L.math.lessons[j.lid]={step:s,extra:false,extraStep:0,done:false,extraDone:false,answers:{},attempts:{},completed:[],extraCompleted:[]};L.math.current=j.lid;}
     else{L.science??={current:null,wordsMet:[],lessons:{}};L.science.lessons[j.lid]={step:s,done:false,answers:{},attempts:{},experiments:{},completed:[]};L.science.current=j.lid;}}}
    localStorage.setItem('little-english-v1',JSON.stringify(raw));},{j,s});
   await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(250);
   try{await p.click('[data-stage='+j.sec+']');}catch(e){results.push({error:'stage '+j.lid+'#'+s+' '+e.message.split('\n')[0]});continue;}
   await p.click('[data-action=stages-'+j.sec+'-open][data-id='+j.lid+']');await p.waitForTimeout(250);
   if(j.mode==='plain'){await p.click('[data-action=playful-reread]').catch(()=>{});await p.waitForTimeout(250);}
   const r=await p.evaluate(async()=>{const m=await import('/narration.js'),a=await import('/stage-audio.js');const step=document.querySelector('[data-narration-step]');
    const lines=[...(step?.querySelectorAll('[data-narrate=en]')||[])].map(l=>({en:l.dataset.en,key:l.dataset.key||'text:'+l.dataset.en,enClip:!!a.stageClip(l.dataset.key||'text:'+l.dataset.en),bn:l.dataset.bn||'',bnClip:!!(l.dataset.bn&&a.stageClip('bn:'+l.dataset.bn))}));
    const root=step||document.querySelector('.activity');
    const unmarked=[...(root?.querySelectorAll('.sentence,.story-line,.story-sentence,.playful-instruction,p[lang=en]')||[])].filter(e=>!e.closest('[data-narrate]')&&!e.closest('button')&&e.offsetParent).map(e=>e.textContent.trim()).filter(Boolean);
    const otherText=[...(root?.querySelectorAll('p,h2,li')||[])].filter(e=>!e.closest('[data-narrate],button,details,.narration-bar,.math-navigation,.playful-navigation,.playful-exit,.status,[role=status]')&&e.offsetParent&&!e.matches('[data-narrate]')).map(e=>e.className+'|'+e.textContent.trim()).filter(t=>t.split('|')[1]);
    return {key:step?.dataset.narrationStep||null,type:root?.dataset.playfulType||root?.dataset.mathType||root?.dataset.scienceType,lines,unmarked,otherText,played:window.__played.slice(0,3),bar:document.querySelector('.narration-bar')?.innerText||''};});
   results.push({...j,step:s,...r});
  }}
 await ctx.close();}
const queue=[...list];await Promise.all([1,2,3,4,5,6].map(()=>worker(queue)));
await b.close();
fs.writeFileSync('qa/out/narration-crawl.json',JSON.stringify(results,null,1));
const steps=results.filter(r=>r.step!==undefined);
console.log('steps',steps.length,'errors',results.filter(r=>r.error).map(r=>r.error).slice(0,5));
console.log('no narration key',steps.filter(r=>!r.key).map(r=>r.sec+'/'+r.lid+'/'+r.mode+'#'+r.step+':'+r.type).slice(0,40));
console.log('no lines',steps.filter(r=>r.key&&!r.lines.length).length);
console.log('unmarked',steps.filter(r=>r.unmarked.length).map(r=>r.lid+'/'+r.mode+'#'+r.step+': '+r.unmarked.join(' / ')).slice(0,40));
const lines=steps.flatMap(r=>r.lines);console.log('lines',lines.length,'missing EN clip',new Set(lines.filter(l=>!l.enClip).map(l=>l.en)).size,'missing BN translation',new Set(lines.filter(l=>!l.bn).map(l=>l.en)).size,'distinct BN',new Set(lines.filter(l=>l.bn).map(l=>l.bn)).size);
console.log('not played first',steps.filter(r=>r.key&&r.lines.some(l=>l.enClip)&&!r.played.length).map(r=>r.lid+'/'+r.mode+'#'+r.step).slice(0,20));
