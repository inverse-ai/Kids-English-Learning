import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {stories,normalizeLearning} from '../dist/stage-data.js';
import {storyGap,gapHintSpecs} from '../dist/story-gaps.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {audioTimings} from '../dist/audio-timings.js';
import {normalizeProgress} from '../dist/curriculum.js';
const baseline='a548f3b744b3e3c64a8ff9f9398d3d6e55f35c67';
const before=await import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show',baseline+':dist/stage-data.js'])).toString('base64'));
assert.deepEqual(stories,before.stories,'all story content and original answer choices preserved');
for(const file of ['at-reading-data.js','at-reading-scene.js','at-reading.js','family-data.js','family-lessons.js','spelling-flow.js'])assert.equal((await readFile('dist/'+file,'utf8')).replaceAll('\r\n','\n'),execFileSync('git',['show',baseline+':dist/'+file],{encoding:'utf8'}).replaceAll('\r\n','\n'),file+' changed outside scope');
const oldSpeech=await import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show',baseline+':dist/stage-speech.js'])).toString('base64'));
for(const [key,clip]of Object.entries(oldSpeech.stageSpeech))assert.equal(stageSpeech[key],clip,'old audio '+key);
const saved=normalizeLearning({stories:{'pig-pen':{done:true,answers:['run'],phase:'blanks'}}}).stories['pig-pen'];assert(saved.done);assert.equal(saved.answers[0],'run');assert.equal(saved.gapAttempts[0].firstCorrect,null,'do not invent old attempt history');
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({bypassCSP:true,viewport:{width:390,height:844}});
await context.addInitScript(()=>{const Native=Audio,rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.clips=[];window.Audio=function(...args){const a=new Native(...args);Object.defineProperty(a,'playbackRate',{get:()=>rate.get.call(a),set:v=>rate.set.call(a,Math.min(16,v*8))});window.clips.push(a);return a;};});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4174/');
const seed={completed:{little:['letters-pin']},pictureFamilies:{completed:['picture-at-2'],writing:{drafts:{cat:{drawing:[[[.1,.2],[.3,.4]]],showGuide:false}},current:'cat'}},learning:{lettersDone:['a','b'],spelling:{letter:2,position:1,done:['a']},words:{'first-cat':{step:3,answer:'cat',done:true}},stories:{'hen-sun':{phase:'paragraph',done:true,answers:['hen']}}}};
const normalized=normalizeProgress(seed);
async function enter(s){await page.locator('[data-action="stage"][data-stage="stories"]').click();await page.locator('.story-grid [data-action="stages-story-open"][data-id="'+s.id+'"]').click();}
async function data(){return page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));}
await page.evaluate(seed=>localStorage.setItem('little-english-v1',JSON.stringify(seed)),seed);await page.reload();await page.locator('[data-action="stage"][data-stage="stories"]').click();
const thumb=page.locator('[data-id="pig-pen"] .story-thumb');await expect(thumb.locator('[data-object="pig"]')).toHaveCount(1);await expect(thumb.locator('[data-object="fence"]')).toHaveCount(2);await expect(thumb.locator('[data-object="pen"]')).toHaveCount(0);await thumb.screenshot({path:'qa/story-audit-pig-thumbnail.png'});
let questions=0;const changed=[];
for(const s of stories){
 await page.evaluate(({id,n})=>{const p=JSON.parse(localStorage.getItem('little-english-v1'));p.learning.stories[id]={phase:'blanks',mode:'blanks',blank:0,answers:Array(n).fill(null),done:false};localStorage.setItem('little-english-v1',JSON.stringify(p));},{id:s.id,n:s.blanks.length});await page.reload();await enter(s);
 for(const [i,b]of s.blanks.entries()){
  const q=storyGap(s,i),wrong=b.choices.find(w=>w!==b.word);questions++;changed.push({story:s.title,sentence:s.sentences[b.line],answer:b.word,task:q.task,hint:q.hint});
  await expect(page.locator('.blank-prompt')).toHaveText(q.task==='recall'?'Which word was in the story?':'Look, then fill the gap.');await expect(page.locator('.sentence-scene')).toHaveCount(1);
  await expect(page.locator('.paragraph-blank.current')).toHaveCount(1);await expect(page.locator('.story-answer-choices button')).toHaveCount(3);
  if(s.id==='pig-pen'){await expect(page.locator('[data-object="pig-run"]')).toHaveCount(1);await page.screenshot({path:'qa/story-audit-running-pig.png',fullPage:true});}
  await page.locator('[data-action="stages-story-answer"][data-word="'+wrong+'"]').click();await expect(page.locator('.story-gap-hint')).toHaveText(q.hint);await expect.poll(()=>page.evaluate(()=>window.clips.at(-1)?.src?new URL(window.clips.at(-1).src).pathname:'')).toBe(stageSpeech['story-hint:'+q.hint]);
  await page.locator('[data-action="stages-story-answer"][data-word="'+wrong+'"]').click();await expect(page.locator('.story-demonstration')).toContainText(s.sentences[b.line]);let p=(await data()).learning.stories[s.id];assert(p.gapAttempts[i].assisted&&p.gapAttempts[i].demonstrated&&p.assisted);
  if(s.id==='pig-pen'){await page.reload();await enter(s);await expect(page.locator('.story-demonstration')).toBeVisible();await page.screenshot({path:'qa/story-audit-assisted-retry.png',fullPage:true});}
  await page.locator('[data-action="stages-story-retry"]').click();await expect(page.locator('.story-answer-choices button')).toHaveCount(2);await page.locator('[data-action="stages-story-answer"][data-word="'+b.word+'"]').click();await expect(page.locator('.paragraph-blank.filled')).toHaveCount(i+1);await expect(page.locator('.story-feedback')).toContainText('Read');
  p=(await data()).learning.stories[s.id];assert.equal(p.gapAttempts[i].attempts,3);assert.equal(p.gapAttempts[i].firstChoice,wrong);assert.equal(p.gapAttempts[i].firstCorrect,false);assert.equal(p.answers[i],b.word);assert.equal(p.blank,i,'correct answer waits for Next');
  if(i+1<s.blanks.length)await page.locator('[data-action="stages-story-blank-next"]').click();
 }
 await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));await page.locator('[data-action="stages-story-finish"]').click();
}
const final=await data();assert.deepEqual(final.completed,normalized.completed);assert.deepEqual(final.pictureFamilies,normalized.pictureFamilies);assert.deepEqual(final.learning.lettersDone,normalized.learning.lettersDone);assert.deepEqual(final.learning.words,normalized.learning.words);assert.deepEqual(final.learning.spelling,normalized.learning.spelling);
// First-attempt success and reopening retain an honest attempt record.
await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('little-english-v1'));delete p.learning.stories['pig-pen'];p.learning.stories['pig-pen']={phase:'blanks',answers:[],done:false};localStorage.setItem('little-english-v1',JSON.stringify(p));});await page.reload();await enter(stories.find(s=>s.id==='pig-pen'));await page.locator('[data-word="run"]').click();assert.equal((await data()).learning.stories['pig-pen'].gapAttempts[0].firstCorrect,true);assert.equal((await data()).learning.stories['pig-pen'].assisted,false);await page.reload();await enter(stories.find(s=>s.id==='pig-pen'));await expect(page.locator('.paragraph-blank.filled')).toHaveText('run');
for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:568}]){
 await page.setViewportSize(viewport);await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('little-english-v1'));p.learning.stories['cat-rat']={phase:'blanks',answers:[],done:false};localStorage.setItem('little-english-v1',JSON.stringify(p));});await page.reload();await enter(stories.find(s=>s.id==='cat-rat'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'qa/story-audit-layout-'+viewport.width+'.png',fullPage:true});
 for(const el of await page.locator('.story-controls button,.story-answer-choices button').all()){const b=await el.boundingBox();assert(b&&b.y+b.height<=viewport.height,'default controls '+JSON.stringify(b)+' below viewport '+JSON.stringify(viewport));}
 await page.screenshot({path:'qa/story-audit-layout-'+viewport.width+'.png',fullPage:true});
}
await page.addStyleTag({content:'html{font-size:200%}'});assert(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight));await page.locator('.story-answer-choices button').first().focus();await page.keyboard.press('Enter');assert((await data()).learning.stories['cat-rat'].gapAttempts[0].attempts===1);
await page.locator('[data-action="stage"][data-stage="letters"]').click();assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));assert.equal(await page.locator('[data-speech-active]').count(),0);
const clips=await Promise.all(gapHintSpecs.map(async spec=>({spec,bytes:(await readFile('dist'+stageSpeech[spec.key])).toString('base64')})));
const decoded=await page.evaluate(async clips=>{const audio=new AudioContext();const result=[];for(const {spec,bytes}of clips){const b=Uint8Array.from(atob(bytes),c=>c.charCodeAt(0)),buffer=await audio.decodeAudioData(b.buffer);result.push({key:spec.key,duration:buffer.duration});}await audio.close();return result;},clips);assert(decoded.every(c=>c.duration>0));assert.deepEqual(errors,[]);
const report={passed:true,stories:stories.length,questions,changed,decoded,progressPreserved:true,layouts:['1440x1000','390x844','320x568','200% text scroll'],limitations:['Human listening review of synthesized hints and a physical mobile device were not available.']};await writeFile('qa/story-audit-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,stories:stories.length,questions,recall:changed.filter(q=>q.task==='recall').length,hintsDecoded:decoded.length}));await browser.close();
