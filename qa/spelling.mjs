import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {alphabet,wordLessons,stories,patternLessons,supportingWords,normalizeLearning} from '../dist/stage-data.js';
import {spellingNames,spellingParts} from '../dist/spelling-data.js';
import {audioTimings} from '../dist/audio-timings.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {normalizeProgress} from '../dist/curriculum.js';

const committed=file=>execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'}).replaceAll('\r\n','\n');
const oldData=await import('data:text/javascript;base64,'+Buffer.from(committed('dist/stage-data.js')).toString('base64'));
const oldSpeech=(await import('data:text/javascript;base64,'+Buffer.from(committed('dist/stage-speech.js')).toString('base64'))).stageSpeech;
for(const [key,value]of Object.entries({alphabet,wordLessons,stories,patternLessons,supportingWords}))assert.deepEqual(value,oldData[key]);
for(const [key,file]of Object.entries(oldSpeech))assert(stageSpeech[key]===file||audioTimings[stageSpeech[key]],'old narration must be retained or have captured timings: '+key);
for(const file of ['dist/curriculum.js','dist/family-data.js','dist/family-speech.js','dist/story-words.js','dist/story-scenes.js','dist/index.html'])assert.equal((await readFile(file,'utf8')).replaceAll('\r\n','\n')===committed(file),true,'other stage changed: '+file);
assert((await readFile('dist/style.css','utf8')).replaceAll('\r\n','\n').startsWith(committed('dist/style.css')),'existing CSS must be retained');
// Alphabet narration remains covered by alphabet-narration.mjs; inline targets now support synchronized highlighting.
assert.deepEqual(spellingParts(0).map(p=>p.key),['spelling-name:a','spelling-name:p','spelling-name:p','spelling-name:l','spelling-name:e','word:apple','spelling-name:a','spelling-name:n','spelling-name:t','word:ant']);
assert.deepEqual(spellingParts(1).map(p=>p.key),['spelling-name:b','spelling-name:a','spelling-name:l','spelling-name:l','word:ball','spelling-name:b','spelling-name:a','spelling-name:t','word:bat']);
assert.equal(spellingNames.a,'ay.');assert.equal(spellingNames.b,'bee.');assert.equal(spellingNames.p,'pee.');assert.equal(spellingNames.l,'ell.');assert.equal(spellingNames.q,'cue.');assert.equal(spellingNames.x,'ex.');assert.equal(spellingNames.z,'zed.');
assert(Object.entries(spellingNames).every(([letter,text])=>letter==='w'||!text.includes('double')));
assert.deepEqual(normalizeLearning({spelling:{letter:99,position:999,done:['a','bad','a']}}).spelling,{letter:0,position:0,done:['a']});
assert.equal(normalizeLearning({spelling:{letter:24,position:9}}).spelling.position,9);
const expectedKeys=a=>a.examples.flatMap(word=>[...[...word].map(letter=>'spelling-name:'+(letter==='-'?'hyphen':letter)),'word:'+word]);
const seed=normalizeProgress({profile:'big',completed:{little:['letters-pin'],big:['words-9']},inProgress:{big:{'words-1':{lessonId:'words-1',step:3,tiles:['c','a','t'],placed:[0]}}},currentLesson:{big:'words-1'},pictureFamilies:{completed:['picture-at-2'],writing:{drafts:{cat:{drawing:[[[.1,.2],[.3,.4]]],showGuide:false}},current:'cat'}},learning:{letter:12,lettersDone:['m'],words:{'first-cat':{step:3,answer:'cat',done:true},'first-hen':{step:2}},wordCurrent:'first-hen',stories:{'cat-rat':{phase:'blanks',line:3,blank:1,answers:['cat',null],done:true}},storyCurrent:'cat-rat',storyWordsMet:['i','see','too'],patterns:['sh']}});
const preserved=value=>{const copy=structuredClone(value);delete copy.learning.spelling;return copy;};
const profile=await mkdtemp(join(tmpdir(),'kids-spelling-'));
const errors=[],external=[];let context,page;
async function open(){
 context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:{width:390,height:844}});
 await context.addInitScript(()=>{
  const Native=Audio,rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.audioLog=[];window.clips=[];window.multiplier=8;
  window.Audio=function(...args){
   const audio=new Native(...args),entry={path:new URL(audio.src).pathname,started:null,ended:null};
   Object.defineProperty(audio,'playbackRate',{get:()=>rate.get.call(audio),set:v=>rate.set.call(audio,Math.min(16,v*window.multiplier))});
   const play=audio.play.bind(audio);audio.play=()=>{if(entry.started===null)entry.started=performance.now();return play();};audio.addEventListener('playing',()=>setTimeout(()=>{if(entry.letter!==undefined)return;const letter=document.querySelector('.spelling-letter.playing');entry.letter=letter?.textContent??null;entry.index=letter?.dataset.letterIndex??null;entry.example=document.querySelector('.spelling-example.playing')?.dataset.example??null;entry.whole=document.querySelector('.spelling-word.whole-word')?.textContent??null;entry.highlightCount=document.querySelectorAll('.spelling-letter.playing').length;},0));
   audio.addEventListener('ended',()=>entry.ended=performance.now());audio.addEventListener('error',()=>entry.error=audio.error?.code);
   window.audioLog.push(entry);window.clips.push(audio);return audio;
  };
 });
 page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4174/')&&!r.url().startsWith('data:'))external.push(r.url());});await page.goto('http://localhost:4174/');
}
const log=()=>page.evaluate(()=>window.audioLog);
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
const nav=stage=>page.locator('[data-action="stage"][data-stage="'+stage+'"]').click();
const enter=()=>page.locator('[data-action="stages-spelling-open"]').click();
const replay=()=>page.locator('[data-action="stages-spelling-replay"]').click();
const pause=()=>page.locator('[data-action="stages-spelling-pause"]').click();
const next=()=>page.locator('.spelling-paging button').last().click();
const previous=()=>page.locator('.spelling-paging button').first().click();
const done=()=>expect(page.locator('#spelling-phase')).toHaveText('Ready to replay',{timeout:15000});
const reset=()=>page.evaluate(()=>{window.audioLog=[];window.clips=[];});
async function check(a,start=0){
 const actual=await log();assert.deepEqual(actual.map(p=>p.path),expectedKeys(a).slice(start).map(key=>stageSpeech[key]));
 let position=0;
 for(const [example,word]of a.examples.entries()){
  for(const [index,letter]of [...word].entries()){
   if(position>=start){const played=actual[position-start];assert.equal(played.letter,letter);assert.equal(played.index,String(index));assert.equal(played.example,String(example));assert.equal(played.highlightCount,1);assert.equal(played.whole,null);}position++;
  }
  if(position>=start){const played=actual[position-start];assert.equal(played.letter,null);assert.equal(played.highlightCount,0);assert.equal(played.whole,word);assert.equal(played.example,String(example));}position++;
 }
 assert(actual.every(a=>a.started!==null&&a.ended!==null&&!a.error));
 if(start===0){const afterFirstWord=a.examples[0].length+1;assert(actual[afterFirstWord].started-actual[afterFirstWord-1].ended>=550,'pause between examples');}
 await expect(page.locator('.spelling-guide b')).toHaveText(a.letter.toUpperCase()+a.letter+' picture words');await expect(page.locator('[data-action="stages-spelling-pause"]')).toBeDisabled();
 await expect(page.locator('.spelling-letter.playing')).toHaveCount(0);
}
async function fit(allControls=true){
 await page.evaluate(()=>scrollTo(0,0));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');await expect(page.getByRole('navigation',{name:'Learning stages'})).toBeVisible();
 if(allControls)for(const control of await page.locator('.spelling-controls button,.spelling-paging button,.spelling-reading button').all()){const box=await control.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=await page.evaluate(()=>innerHeight),'spelling control below mobile viewport: '+await control.textContent());}
}
try{
 await open();await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),seed);await page.reload();await nav('words');
 assert(await page.locator('.spelling-intro').evaluate(el=>el.compareDocumentPosition(document.querySelector('.blend-intro'))&Node.DOCUMENT_POSITION_FOLLOWING));
 await expect(page.locator('.spelling-preview b')).toHaveText(['apple','ant']);await expect(page.locator('[data-action="stages-spelling-open"]')).toHaveText('Start spelling →');await fit(false);await page.screenshot({path:'qa/spelling-words-intro-390.png',fullPage:true});
 await page.evaluate(()=>window.multiplier=1);await enter();await page.waitForFunction(()=>window.clips[0]?.currentTime>0);await pause();
 const pausedAt=await page.evaluate(()=>window.clips[0].currentTime);await page.waitForTimeout(400);assert.equal((await log()).length,1);assert(Math.abs(await page.evaluate(()=>window.clips[0].currentTime)-pausedAt)<.02);await pause();
 await page.waitForFunction(()=>window.clips.length===3&&window.clips[2].currentTime>0&&!window.clips[2].ended,null,{polling:'raf'});await pause();
 assert.equal((await data()).learning.spelling.position,2);await expect(page.locator('.spelling-letter.playing')).toHaveText('p');await expect(page.locator('.spelling-letter.playing')).toHaveAttribute('data-letter-index','2');await fit();await page.screenshot({path:'qa/spelling-apple-highlight-390.png',fullPage:true});
 await context.close();context=null;await open();await nav('words');await expect(page.locator('[data-action="stages-spelling-open"]')).toHaveText('Continue spelling →');await enter();
 await done();await check(alphabet[0],2);assert.deepEqual(preserved(await data()),preserved(seed));
 await reset();await replay();await done();await check(alphabet[0]);const aCount=(await log()).length;await page.waitForTimeout(400);assert.equal((await log()).length,aCount);assert.deepEqual((await data()).learning.spelling.done,['a']);
 console.log('PASS: separate repeated letter names, exact lowercase highlights, pause/resume and browser-close continuation.');
 for(let index=1;index<26;index++){await reset();await next();await done();await check(alphabet[index]);if(index%5===0||index===25)console.log('PASS: spelling '+(index+1)+'/26 picture pairs, through '+alphabet[index].letter.toUpperCase()+'.');}
 await expect(page.locator('.spelling-paging button').last()).toBeDisabled();assert.equal((await data()).learning.spelling.done.length,26);assert.deepEqual(preserved(await data()),preserved(seed));
 await reset();await previous();await done();await check(alphabet[24]);assert((await log()).some(e=>e.path===stageSpeech['spelling-name:hyphen']));
 // Replay and rapid manual navigation cancel active audio and old callbacks.
 await reset();await page.evaluate(()=>window.multiplier=1);await replay();await page.waitForFunction(()=>window.clips[0]?.currentTime>0);await next();await previous();assert(await page.evaluate(()=>window.clips.slice(0,-1).every(a=>a.paused&&!a.getAttribute('src'))));
 const count=(await log()).length;await page.evaluate(()=>window.clips[0].dispatchEvent(new Event('ended')));await page.waitForTimeout(250);assert.equal((await log()).length,count);
 await page.locator('[data-action="stages-spelling-blend"]').click();await expect(page.locator('.blend-intro')).toBeVisible();await expect(page.locator('.word-path-card')).toHaveCount(9);await page.waitForTimeout(800);assert.equal((await log()).length,count);assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));
 await reset();await page.evaluate(()=>window.multiplier=8);await page.locator('[data-action="stages-blend"][data-word="sat"]').click();await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.');assert.deepEqual((await log()).map(a=>a.path),['sound:s','sound:a','sound:t','word:sat'].map(key=>stageSpeech[key]));
 await nav('stories');await expect(page.locator('.story-card')).toHaveCount(24);assert.deepEqual(preserved(await data()),preserved(seed));
 // Retained Letters still uses names/phonics/examples, with no spelling clips.
 await nav('letters');await reset();await page.locator('[data-action="stages-letter-start"]').first().click();await expect(page.locator('#letter-phase')).toHaveText('Ready to replay',{timeout:15000});
 assert.deepEqual((await log()).map(a=>a.path),['alphabet-case:a','alphabet-example:a:apple','sound:a','sound:a','sound:a','word:apple','alphabet-example:a:ant','sound:a','sound:a','sound:a','word:ant'].map(key=>stageSpeech[key]));
 // Fit short screens with the longest example words, and allow enlarged text to scroll.
 for(const [width,height]of [[390,844],[320,568]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>{const value=JSON.parse(localStorage.getItem('little-english-v1'));value.learning.spelling.letter=4;value.learning.spelling.position=0;localStorage.setItem('little-english-v1',JSON.stringify(value));});await page.reload();await nav('words');await enter();await done();await fit();await expect(page.locator('.spelling-word')).toHaveText(['egg','elephant']);await page.screenshot({path:'qa/spelling-long-word-'+width+'.png',fullPage:true});
 }
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');await fit(false);assert(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight));await page.screenshot({path:'qa/spelling-large-text.png',fullPage:true});
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 let decoded=0;for(const file of new Set(Object.keys(spellingNames).map(letter=>stageSpeech['spelling-name:'+(letter==='-'?'hyphen':letter)]))){const bytes=(await readFile('dist'+file)).toString('base64');const result=await page.evaluate(async encoded=>{const context=new AudioContext();try{const audio=await context.decodeAudioData(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer);return {duration:audio.duration,audible:audio.getChannelData(0).some(n=>Math.abs(n)>.01)};}finally{await context.close();}},bytes);assert(result.duration>.03&&result.audible,file);decoded++;}
 await page.route('**'+stageSpeech['spelling-name:e'],route=>route.abort());await replay();await expect(page.locator('#audio-status')).toContainText('Audio could not play');await expect(page.locator('[data-action="stages-spelling-pause"]')).toBeDisabled();await expect(page.locator('.spelling-letter.playing')).toHaveCount(0);await next();await done();await nav('words');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={passed:true,letters:26,pictureWords:52,newNameRecordings:27,decodedNameClips:decoded,checks:['spelling introduction precedes existing blending','each repeated letter name is a separate audio clip','every lowercase character highlights at its exact spoken position','both examples play then stay on the same letter','Replay, Pause/Resume and rapid manual Previous/Next cancel old audio','unfinished spelling resumes at the saved letter position after browser close','old lessons and partial writing/building/story progress remain','Letters narration and pictures stay unchanged without word spelling','phonics blending still plays pure sounds and remains directly accessible','390x844 and 320x568 mobile controls fit including long words','200 percent text can scroll without horizontal overflow','all name recordings decode and contain audio','no page errors or external runtime requests'],unverifiedAudio:['Automated playback, spelling sequence and clip decoding passed. The 27 new spoken letter-name recordings have not had a perceptual listening review.']};
 await writeFile('qa/spelling-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{if(context)await context.close();}
