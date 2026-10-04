import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {alphabet,wordLessons,stories,patternLessons,supportingWords,alphabetCaseText,alphabetExampleText} from '../dist/stage-data.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {audioTimings} from '../dist/audio-timings.js';
import {recordedSpeech} from '../dist/recorded-speech.js';
const before=await import('data:text/javascript;base64,'+execFileSync('git',['show','HEAD:dist/stage-data.js']).toString('base64'));
for(const [name,value]of Object.entries({alphabet,wordLessons,stories,patternLessons,supportingWords}))assert.deepEqual(value,before[name]);
for(const a of alphabet){
 assert.equal(audioTimings[stageSpeech['alphabet-case:'+a.letter]].text,alphabetCaseText(a.letter));
 for(const word of a.examples)assert.equal(audioTimings[stageSpeech['alphabet-example:'+a.letter+':'+word]].text,alphabetExampleText(a.letter,word));
}
for(const sentence of [...wordLessons.flatMap(l=>[l.phrase,l.sentence]),...stories.flatMap(s=>s.sentences)])assert.equal(audioTimings[stageSpeech['text:'+sentence]].text,sentence);
for(const metadata of Object.values(audioTimings)){
 assert(metadata.words.length);let prior=-1;
 for(const cue of metadata.words){assert(cue.start>=prior&&cue.end>cue.start);assert(cue.from>=0&&cue.to>cue.from&&cue.to<=metadata.text.length);prior=cue.end;}
}
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await context.addInitScript(()=>{
 const Native=Audio;window.clips=[];window.samples=[];
 window.Audio=function(...args){
  const audio=new Native(...args),id=window.clips.length;window.clips.push(audio);
  const sample=()=>{if(audio.paused||audio.ended)return;window.samples.push({id,path:new URL(audio.src).pathname,time:audio.currentTime,rate:audio.playbackRate,marks:[...document.querySelectorAll('.speech-highlight')].map(el=>({text:el.textContent,case:el.dataset.case,index:el.dataset.letterIndex,example:el.closest('[data-example]')?.dataset.example,from:Number(el.dataset.from),line:el.closest('[data-line]')?.dataset.line,word:el.classList.contains('spoken-word')}))});requestAnimationFrame(sample);};
  audio.addEventListener('playing',()=>setTimeout(()=>requestAnimationFrame(sample),0));return audio;
 };
});
const nav=stage=>page.locator('[data-action="stage"][data-stage="'+stage+'"]').click();
const fresh=async speed=>{await page.goto('http://localhost:4174/');await page.evaluate(speed=>{localStorage.setItem('little-english-v1',JSON.stringify({audioSpeed:speed,learning:{stories:{'cat-rat':{phase:'sentence',line:0,skipIntro:true,answers:[null,null]}}}}));},speed);await page.reload();};
const active=()=>page.evaluate(()=>window.clips.findLast(audio=>!audio.paused&&!audio.ended));
const samples=()=>page.evaluate(()=>window.samples);
const clear=()=>page.evaluate(()=>{window.samples=[];window.clips=[];});
const ended=()=>expect.poll(()=>page.evaluate(()=>window.clips.length>0&&window.clips.every(a=>a.ended||!a.src)),{timeout:30000}).toBe(true);
const result={timedRecordings:Object.keys(audioTimings).length,speeds:[],mobile:[],checks:[],fallback:'Retained sentence recordings without word metadata highlight the complete sentence. System voices use word boundaries when supplied.',unverified:'Physical mobile devices and pronunciation by ear were not verified.'};
function checkSentenceSamples(captured,key){
 const clip=stageSpeech[key],metadata=audioTimings[clip],seen=new Set();let checked=0;
 for(const sample of captured.filter(s=>s.path===clip)){
  const index=metadata.words.findIndex(w=>{const margin=Math.min(.02,(w.end-w.start)/10);return sample.time>w.start+margin&&sample.time<w.end-margin;});if(index<0)continue;
  const cue=metadata.words[index],marks=sample.marks.filter(m=>m.word);assert.equal(marks.length,1,'one current spoken word');assert.equal(marks[0].from,cue.from,'word follows audio.currentTime');seen.add(index);checked++;
 }
 assert(checked>2);assert.equal(seen.size,metadata.words.length,'every word highlighted in order: '+key);
}
async function freeze(control){
 await expect.poll(()=>page.locator('.speech-highlight').count()).toBeGreaterThan(0);
 await control.click();await expect(control).toHaveText('Resume');
 const paused=await page.evaluate(()=>({time:window.clips.findLast(a=>a.src&&!a.ended)?.currentTime,marks:[...document.querySelectorAll('.speech-highlight')].map(e=>e.textContent)}));
 await page.waitForTimeout(250);
 assert.deepEqual(await page.locator('.speech-highlight').allTextContents(),paused.marks);
 assert(Math.abs(await page.evaluate(()=>window.clips.findLast(a=>a.src&&!a.ended)?.currentTime)-paused.time)<.035);
 await control.click();await expect(control).toHaveText('Pause');
}
try{
 for(const speed of [1,.85]){
  await fresh(speed);await clear();await page.locator('[data-action="stages-letter-start"]').first().click();
  await freeze(page.locator('[data-action="stages-pause"]'));
  await expect(page.locator('#letter-phase')).toHaveText('Ready to replay',{timeout:30000});
  const letterSamples=await samples(),caseClip=stageSpeech['alphabet-case:a'],meta=audioTimings[caseClip],seen=new Set();
  for(const sample of letterSamples.filter(s=>s.path===caseClip)){
   const index=meta.words.findIndex(w=>sample.time>w.start+.02&&sample.time<w.end-.02);if(index<0)continue;
   const expected=index<2?'upper':index>=3?'lower':null;
   if(expected){assert.deepEqual(sample.marks.map(m=>m.case),[expected]);seen.add(expected);}else assert.equal(sample.marks.length,0);
  }
  assert.deepEqual([...seen],['upper','lower']);
  for(const sample of letterSamples.filter(s=>s.path===stageSpeech['sound:a']))assert.deepEqual(sample.marks.map(m=>m.case),['lower']);
  assert(letterSamples.every(s=>s.rate===speed));await expect(page.locator('.speech-highlight')).toHaveCount(0);
  await nav('words');await clear();await page.locator('[data-action="stages-spelling-open"]').click();
  await expect.poll(()=>page.evaluate(()=>document.querySelector('.spelling-letter.speech-highlight')?.dataset.letterIndex)).toBe('2');
  await freeze(page.locator('[data-action="stages-spelling-pause"]'));
  await expect(page.locator('#spelling-phase')).toHaveText('Ready to replay',{timeout:30000});
  const spelling=await samples(),pSamples=spelling.filter(s=>s.path===stageSpeech['spelling-name:p']);assert.deepEqual([...new Set(pSamples.flatMap(s=>s.marks.map(m=>m.index)))],['1','2']);assert(spelling.every(s=>s.marks.length===1&&s.rate===speed));
  await page.locator('[data-action="stages-spelling-replay"]').click();await expect.poll(()=>page.evaluate(()=>document.querySelector('.spelling-letter.speech-highlight')?.dataset.letterIndex)).toBe('0');
  await page.locator('.spelling-paging button').last().click();await expect(page.locator('.spelling-guide b')).toHaveText('Bb picture words');
  assert(await page.evaluate(()=>window.clips.slice(0,-1).every(a=>a.paused)));
  await nav('words');await expect(page.locator('.speech-highlight')).toHaveCount(0);await clear();
  await page.locator('[data-action="stages-word-open"][data-id="first-cat"]').first().click();await page.locator('[data-action="stages-word-next"]').click();await page.locator('[data-action="stages-word-next"]').click();
  await page.locator('[data-action="stages-audio"]').click();await ended();checkSentenceSamples(await samples(),'text:a cat');
  await page.locator('[data-action="stages-word-next"]').click();await page.locator('[data-action="stages-word-answer"][data-word="cat"]').click();await clear();await page.locator('[data-action="stages-audio"]').click();await freeze(page.locator('[data-action="stages-pause"]'));await ended();checkSentenceSamples(await samples(),'text:I see a cat.');
  await nav('stories');await page.locator('[data-action="stages-story-open"][data-id="cat-rat"]').click();await clear();
  await page.locator('[data-action="stages-story-sentence-audio"]').click();await ended();checkSentenceSamples(await samples(),'text:I see a cat.');
  for(let i=0;i<4;i++)await page.locator('[data-action="stages-story-next"]').click();
  await expect(page.locator('.story-player')).toHaveAttribute('data-phase','paragraph');await clear();
  const boxes=await page.locator('.spoken-word').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}));
  await page.locator('[data-action="stages-story-audio"]').click();await freeze(page.locator('[data-action="stages-pause"]'));await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.',{timeout:30000});await ended();
  for(const sentence of stories.find(s=>s.id==='cat-rat').sentences)checkSentenceSamples(await samples(),'text:'+sentence);
  assert.deepEqual(await page.locator('.spoken-word').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height];})),boxes,'highlighting does not move text');
  await page.locator('[data-action="stages-story-audio"]').click();await expect.poll(()=>page.locator('.speech-highlight').count()).toBeGreaterThan(0);await nav('letters');await expect(page.locator('.speech-highlight')).toHaveCount(0);
  await page.evaluate(()=>{for(const audio of window.clips){audio.dispatchEvent(new Event('playing'));audio.dispatchEvent(new Event('timeupdate'));audio.dispatchEvent(new Event('ended'));}});await expect(page.locator('.speech-highlight')).toHaveCount(0);
  result.speeds.push({rate:speed,letters:true,spellingRepeatedLetters:true,words:true,storySentence:true,paragraphAllWords:true,pauseResume:true,replayAndNavigation:true});
 }
 // Q and X still use the established exception narration and pure phonics.
 for(const letter of ['b','q','x']){
  await fresh(1);await clear();await page.locator('.stage-practice').first().locator('summary').click();await page.locator('[data-action="stages-letter-next"][data-index="'+alphabet.findIndex(a=>a.letter===letter)+'"]').first().click();
  await expect(page.locator('#letter-phase')).toHaveText('Ready to replay',{timeout:30000});const captured=await samples();assert(captured.some(s=>s.marks.some(m=>m.case==='upper')));assert(captured.some(s=>s.marks.some(m=>m.case==='lower')));
  if(letter==='q')assert(captured.some(s=>s.marks.some(m=>m.text==='u')));
 }
 // Real untimed retained sentence recording: whole-sentence fallback and pause.
 await fresh(1);await page.evaluate(async text=>{const root=document.querySelector('#main');root.innerHTML='<p class="sentence"></p><button data-action="audio-pause">Pause</button>';root.querySelector('p').textContent=text;const {prepareSpokenText}=await import('/speech-highlights.js');prepareSpokenText(root);const {playLessonAudio}=await import('/lesson-audio.js');playLessonAudio(text,{speed:1},()=>{});},'A cat sat.');
 await expect.poll(()=>page.locator('.sentence.speech-highlight').count()).toBe(1);await freeze(page.locator('[data-action="audio-pause"]'));await ended();await expect(page.locator('.speech-highlight')).toHaveCount(0);assert(!audioTimings[recordedSpeech['A cat sat.']]);
 for(const viewport of [{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(viewport);await fresh(.85);await nav('stories');await page.locator('[data-action="stages-story-open"][data-id="cat-rat"]').click();await page.locator('[data-action="stages-story-sentence-audio"]').click();await expect.poll(()=>page.locator('.speech-highlight').count()).toBeGreaterThan(0);await page.screenshot({path:'qa/highlight-story-'+viewport.width+'.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));for(const control of await page.locator('.story-listen button,.story-controls button').all()){const r=await control.boundingBox();assert(r.y+r.height<=viewport.height,'mobile story controls fit');}
  await nav('words');await page.locator('[data-action="stages-spelling-open"]').click();await expect.poll(()=>page.locator('.speech-highlight').count()).toBeGreaterThan(0);await page.screenshot({path:'qa/highlight-spelling-'+viewport.width+'.png',fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const control of await page.locator('.spelling-controls button,.spelling-paging button').all()){const r=await control.boundingBox();assert(r.y+r.height<=viewport.height,'mobile spelling controls fit');}
  result.mobile.push(viewport);
 }
 assert.deepEqual(errors,[]);result.checks=['Unchanged curriculum and narration text','Captured timestamp order and character ranges','Audio-clock word order at normal and slow speed','Uppercase/lowercase separately','Repeated p separately','Pause freezes time and highlight','Replay begins at first letter','Navigation and stale events clear highlights','Q/U and final X','Whole-sentence fallback','No layout movement'];
 await writeFile('qa/speech-highlights-report.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
