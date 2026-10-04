import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {atSteps,atStory,atHelpingWords,atReviewWords,atAudioSpecs,normalizeAtReading,isAtQuestion} from '../dist/at-reading-data.js';
import {pictureFamilies,familyWords,familyRounds,normalizeFamilyProgress} from '../dist/family-data.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {familySpeech} from '../dist/family-speech.js';
import {audioTimings} from '../dist/audio-timings.js';
import {normalizeProgress} from '../dist/curriculum.js';
const committed=async file=>{let source=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'});if(file==='dist/family-data.js')source=source.replace(/^import.*normalizeAtReading.*\r?\n/u,'');return await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));};
const oldFamilies=await committed('dist/family-data.js'),oldSpeech=(await committed('dist/stage-speech.js')).stageSpeech,oldTimings=(await committed('dist/audio-timings.js')).audioTimings;
for(const [name,value]of Object.entries({pictureFamilies,familyWords,familyRounds}))assert.deepEqual(value,oldFamilies[name]);
for(const [key,path]of Object.entries(oldSpeech))assert.equal(stageSpeech[key],path,'retained audio: '+key);
for(const [path,value]of Object.entries(oldTimings))assert.deepEqual(audioTimings[path],value);
for(const file of ['dist/app.js','dist/curriculum.js','dist/stage-data.js','dist/stage-lessons.js','dist/lesson-audio.js','dist/stage-audio.js','dist/spelling-data.js','dist/story-flow.js','dist/story-words.js','dist/family-speech.js','dist/recorded-speech.js'])assert.equal((await readFile(file,'utf8')).replaceAll('\r\n','\n'),execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'}).replaceAll('\r\n','\n'),file+' remains unchanged');
assert.deepEqual(atStory,['I see a cat.','The cat is on a mat.','The cat has a hat.','The hat is on the cat.','A rat is on the mat too.']);
assert.deepEqual(atHelpingWords.map(w=>w.word),['a','I','see','the','is','on','has','too']);
assert.equal(atHelpingWords[6].meaning,'বিড়ালটির একটি টুপি আছে।');assert.equal(atHelpingWords[7].meaning,'একটি ইঁদুরও মাদুরটির ওপর আছে।');
assert(!JSON.stringify(atHelpingWords).includes('অত্যধিক'));
assert.deepEqual(atSteps.filter(s=>s.type==='phrase').map(s=>s.text),['a cat','a mat','a hat']);
for(const s of atSteps.filter(isAtQuestion)){assert.equal(s.choices.length,3);assert.equal(new Set(s.choices).size,3);assert.equal(s.choices.filter(c=>c===s.answer).length,1);}
for(const word of atReviewWords){assert.equal(stageSpeech['at-review-word:'+word],familySpeech['word:'+word]);assert.equal(stageSpeech['at-review-meaning:'+word],familySpeech['meaning:'+word]);}
for(const h of atHelpingWords)if(!['a','the'].includes(h.word))assert(stageSpeech['word:'+h.word]);
assert.equal(normalizeAtReading({step:99,completed:['bad'],answers:{bad:{}},wordsNeedingPractice:['bad'],star:true}).star,false);
const seed=normalizeProgress({profile:'big',completed:{little:['letters-pin'],big:['words-9']},inProgress:{big:{'words-1':{lessonId:'words-1',step:3,tiles:['c','a','t'],placed:[0]}}},currentLesson:{big:'words-1'},pictureFamilies:{completed:['picture-at-2'],inProgress:{'picture-at-1':{step:1,tiles:['c','a','t'],placed:[0]}},current:'picture-at-1',lastFamily:'at',selected:{at:'cat'},writing:{completed:['mat'],drafts:{cat:{drawing:[[[.1,.2],[.3,.4]]],showGuide:false}},current:'cat'}},learning:{letter:12,lettersDone:['m'],words:{'first-cat':{step:3,answer:'cat',done:true}},stories:{'cat-rat':{phase:'blanks',line:3,blank:1,answers:['cat',null],done:true}},storyCurrent:'cat-rat',storyWordsMet:['i','see','too'],patterns:['sh'],spelling:{letter:0,position:2,done:['b']}}});
const oldProgress=value=>{const copy=structuredClone(value);delete copy.pictureFamilies.reading;delete copy.pictureFamilies.lastFamily;delete copy.learning.stage;delete copy.audioSpeed;return copy;};
const profile=await mkdtemp(join(tmpdir(),'kids-at-reading-'));
let context,page;const errors=[],networkErrors=[],layouts=[];
async function open(){
 context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:{width:390,height:844}});
 await context.addInitScript(()=>{
  const Native=Audio,rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.multiplier=8;window.clips=[];window.audioLog=[];window.samples=[];window.overlap=false;
  window.Audio=function(...args){
   const audio=new Native(...args),entry={path:new URL(audio.src).pathname,started:null,ended:null,rate:null};window.clips.push(audio);window.audioLog.push(entry);
   Object.defineProperty(audio,'playbackRate',{get:()=>rate.get.call(audio),set:value=>{entry.rate=value;rate.set.call(audio,Math.min(16,value*window.multiplier));}});
   audio.addEventListener('playing',()=>{entry.started??=performance.now();if(window.clips.filter(a=>!a.paused&&!a.ended).length>1)window.overlap=true;setTimeout(()=>requestAnimationFrame(sample),0);});
   function sample(){if(audio.paused||audio.ended)return;window.samples.push({path:entry.path,time:audio.currentTime,rate:entry.rate,marks:[...document.querySelectorAll('.speech-highlight')].map(el=>({text:el.textContent,from:Number(el.dataset.from),to:Number(el.dataset.to),line:el.closest('[data-line]')?.dataset.line,part:el.dataset.part,word:el.classList.contains('spoken-word')}))});requestAnimationFrame(sample);}
   audio.addEventListener('ended',()=>entry.ended=performance.now());audio.addEventListener('error',()=>entry.error=audio.error?.code);return audio;
  };
 });
 page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)networkErrors.push(r.status()+' '+r.url());});await page.goto('http://localhost:4174/');
}
const nav=stage=>page.locator('[data-action="stage"][data-stage="'+stage+'"]').click();
const act=(name,extra='')=>page.locator('[data-action="family-reading-'+name+'"]'+extra);
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
const reading=async()=> (await data()).pictureFamilies.reading.at;
const clear=()=>page.evaluate(()=>{window.clips=[];window.audioLog=[];window.samples=[];});
const audioDone=()=>expect(page.locator('#audio-status')).toHaveText('Ready to listen again.',{timeout:30000});
const stepId=()=>page.locator('.at-reading-player').getAttribute('data-reading-step');
const next=()=>act('next').click();
async function library(){await nav('words');await page.locator('[data-action="stages-families"]').click();}
async function board(){await library();await page.locator('[data-action="family-open"][data-family="at"]').click();}
async function fit(viewport,controls=true){
 await page.evaluate(()=>scrollTo(0,0));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow at '+await stepId());
 await expect(page.locator('.stage-nav button')).toHaveCount(3);
 if(controls)for(const control of await page.locator('.at-audio-controls button,.at-reading-paging button,.at-reading-choices button').all()){
  const r=await control.boundingBox();assert(r.width>=44&&r.height>=44,'tap target: '+await control.textContent());assert(r.y+r.height<=viewport.height,'main control below screen: '+await stepId()+' '+await control.textContent()+' bottom '+(r.y+r.height));
 }
}
async function scene(objects,relations={}){
 const actual=await page.locator('.at-reading-player>.at-scene [data-object]').evaluateAll(els=>els.map(e=>({object:e.dataset.object,on:e.dataset.on||null})));
 assert.deepEqual(actual.map(o=>o.object).sort(),[...objects].sort());for(const [object,on]of Object.entries(relations))assert.equal(actual.find(o=>o.object===object).on,on);
}
async function freeze(control=act('pause').first()){
 await expect.poll(()=>page.locator('.speech-highlight').count()).toBeGreaterThan(0);await control.click();await expect(control).toHaveText('Resume');
 const snapshot=await page.evaluate(()=>({time:window.clips.findLast(a=>a.src&&!a.ended)?.currentTime,marks:[...document.querySelectorAll('.speech-highlight')].map(e=>e.textContent)}));await page.waitForTimeout(220);
 assert.deepEqual(await page.locator('.speech-highlight').allTextContents(),snapshot.marks);assert(Math.abs(await page.evaluate(()=>window.clips.findLast(a=>a.src&&!a.ended)?.currentTime)-snapshot.time)<.03);await control.click();
}
function timed(captured,text,line){
 const metadata=audioTimings[stageSpeech['text:'+text]],seen=new Set();assert(metadata);
 for(const sample of captured.filter(s=>s.path===stageSpeech['text:'+text])){
  const index=metadata.words.findIndex(w=>{const margin=Math.min(.012,(w.end-w.start)/5);return sample.time>w.start+margin&&sample.time<w.end-margin;});if(index<0)continue;
  const marks=sample.marks.filter(m=>m.word);assert.equal(marks.length,1,'one spoken word for '+text);assert.equal(marks[0].from,metadata.words[index].from);if(line!==undefined)assert.equal(Number(marks[0].line),line);seen.add(index);
 }
 assert.equal(seen.size,metadata.words.length,'each actual audio word highlighted: '+text);
}
const report={changedFamily:'at only',steps:atSteps.length,story:atStory,checks:[],layouts:[],audio:{},unverified:['Physical phones and tablets','English and Bengali pronunciation by ear']};
try{
 await open();await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),seed);await page.reload();await board();
 await expect(page.locator('.family-pick')).toHaveCount(8);await expect(page.getByRole('heading',{name:'Explore words',exact:true})).toBeVisible();await expect(act('open')).toHaveText('Read sentences & a story');await expect(act('continue')).toHaveCount(0);
 await act('review').click();for(const [index,word]of atReviewWords.entries()){
  await expect(page.locator('.at-demo-word')).toHaveText(word);await expect(page.locator('.family-picture')).toHaveClass(new RegExp('picture-'+word));await clear();await act('audio').click();await audioDone();assert.equal(await page.evaluate(()=>window.audioLog[0].path),familySpeech['word:'+word]);
  await act('meaning').click();await expect(page.locator('dialog')).toBeVisible();await expect(page.locator('.at-meaning-text')).toHaveText(familyWords[word].meaning);await act('meaning-audio').click();await audioDone();await page.keyboard.press('Escape');
  if(index<3)await act('review-next').click();
 }await act('review-skip').click();assert.equal(await stepId(),'help-a');assert.deepEqual((await data()).pictureFamilies.completed,seed.pictureFamilies.completed);
 for(const h of atHelpingWords){
  await expect(page.locator('.at-help-word')).toHaveText(h.word);await expect(page.locator('.at-sentence')).toHaveText(h.example);assert.equal(await page.locator('dialog[open]').count(),0);
  await clear();await act('audio').click();await audioDone();assert((await page.evaluate(()=>window.audioLog.map(e=>e.path))).includes(stageSpeech['text:'+h.example]));
  await act('meaning').click();await expect(page.locator('.at-meaning-text')).toHaveText(h.meaning);await act('meaning-audio').click();await audioDone();assert.equal(await page.evaluate(()=>window.audioLog.at(-1).path),stageSpeech['at-meaning:'+h.word.toLowerCase()]);await page.keyboard.press('Escape');
  assert.equal(await act('meaning').evaluate(e=>e===document.activeElement),true);await next();
 }
 for(const word of atReviewWords.slice(0,3)){await expect(page.locator('.at-sentence')).toHaveText('a '+word);await clear();await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>window.audioLog.length),0,'reading is optional');await next();}
 for(const [index,text]of atStory.entries()){
  assert.equal(await stepId(),'sentence-'+index);await expect(page.locator('.at-sentence')).toHaveText(text);await scene([['cat'],['cat','mat'],['cat','mat','hat'],['cat','hat'],['cat','mat','hat','rat']][index]);await clear();await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.audioLog.length),0);await act('audio').click();await audioDone();
  if(index===3){await act('meaning').click();await act('meaning-audio').click();await audioDone();await page.keyboard.press('Escape');}
  if(index===4)await page.screenshot({path:'qa/at-complete-scene-mobile.png',fullPage:true});await next();
 }
 // A wrong answer fills the sentence, waits for retry, then demonstrates sounds.
 await scene(['cat']);await expect(page.locator('.at-choice')).toHaveText(['cat','mat','hat']);await act('answer','[data-choice="mat"]').click();await expect(page.locator('.at-sentence')).toHaveText('I see a mat.');await expect(act('next')).toBeDisabled();await expect(page.locator('.at-feedback')).toContainText('animal');
 await act('answer','[data-choice="hat"]').click();await expect(page.locator('.at-demo-word')).toHaveText('cat');await expect(act('help-retry')).toBeVisible();await audioDone();assert.deepEqual(await page.evaluate(()=>window.audioLog.slice(-4).map(e=>e.path)),['sound:c','sound:a','sound:t','at-review-word:cat'].map(k=>stageSpeech[k]||familySpeech[k]));
 await context.close();context=null;await open();await library();await expect(act('continue')).toBeVisible();await act('continue').click();await expect(page.locator('.at-demo-word')).toHaveText('cat');await act('help-retry').click();await expect(page.locator('.at-easier')).toContainText('cat');await act('answer','[data-choice="cat"]').click();await expect(page.locator('.at-filled')).toHaveText('cat.');await expect(page.locator('.at-feedback')).toContainText('✓');await expect(page.locator('.at-sentence')).toHaveText('I see a cat.');assert.equal(await stepId(),'blank-cat');await audioDone();assert((await page.evaluate(()=>window.audioLog.map(e=>e.path))).includes(stageSpeech['at-tone:success']));
 const helped=(await reading()).answers['blank-cat'];assert.equal(helped.attempts,3);assert.equal(helped.incorrect,2);assert.equal(helped.firstAttemptCorrect,false);assert.equal(helped.firstChoice,'mat');assert.equal(helped.assisted,true);assert.equal(helped.easier,true);assert.equal(helped.assistedAttempts,2);await next();
 await scene(['cat','mat'],{cat:'mat'});await expect(page.locator('.at-choice')).toHaveText(['mat','hat','rat']);await act('answer','[data-choice="mat"]').click();await expect(page.locator('.at-sentence')).toHaveText('The cat is on a mat.');await next();
 await scene(['cat','hat'],{hat:'cat'});await expect(page.locator('.at-choice')).toHaveText(['hat','mat','rat']);await page.screenshot({path:'qa/at-blank-hat-mobile.png',fullPage:true});await act('answer','[data-choice="hat"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.at-sentence')).toHaveText('The hat is on the cat.');await next();
 // Only one active paragraph gap and one three-choice set at a time.
 await scene(['mat','cat','hat','rat'],{cat:'mat',hat:'cat',rat:'mat'});await expect(page.locator('.at-paragraph')).toHaveText('I see a cat. The cat is on a ___. The cat has a hat. The ___ is on the cat. A rat is on the mat too.');await expect(page.locator('.at-slot.current')).toHaveCount(1);await expect(page.locator('.at-choice')).toHaveText(['mat','hat','rat']);await act('answer','[data-choice="mat"]').click();await expect(page.locator('.at-paragraph .at-filled')).toHaveText('mat.');assert.equal(await stepId(),'paragraph-mat');await next();await expect(page.locator('.at-slot.current')).toHaveCount(1);await expect(page.locator('.at-choice')).toHaveText(['hat','mat','rat']);await act('previous').click();await expect(page.locator('.at-paragraph .at-filled')).toHaveText('mat.');await next();
 await page.reload();await board();await act('continue').click();assert.equal(await stepId(),'paragraph-hat');await expect(page.locator('.at-paragraph .at-filled')).toHaveText('mat.');await act('answer','[data-choice="hat"]').click();await expect(page.locator('.at-paragraph .at-filled')).toHaveText(['mat.','hat']);await next();
 await expect(page.locator('.at-paragraph')).toHaveText(atStory.join(' '));await clear();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.audioLog.length),0,'paragraph plays only when requested');
 // Real normal and slow recordings, every word in order, pause and replay.
 for(const speed of ['1','0.85']){
  await page.locator('#family-speed').selectOption(speed);await page.evaluate(()=>window.multiplier=1);await clear();const boxes=await page.locator('.at-paragraph .spoken-word').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}));
  await act('audio').click();await freeze();await audioDone();const captured=await page.evaluate(()=>window.samples);atStory.forEach((text,index)=>timed(captured,text,index));assert(captured.every(s=>s.rate===Number(speed)));assert.deepEqual(await page.locator('.at-paragraph .spoken-word').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];})),boxes);await expect(page.locator('.speech-highlight')).toHaveCount(0);
  await clear();await act('audio').click();await expect.poll(()=>page.locator('.speech-highlight').first().textContent()).toBe('I');await act('audio').click();await expect.poll(()=>page.locator('.speech-highlight').first().textContent()).toBe('I');await act('previous').click();await expect(page.locator('.speech-highlight')).toHaveCount(0);assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));await page.evaluate(()=>{for(const audio of window.clips){audio.dispatchEvent(new Event('playing'));audio.dispatchEvent(new Event('timeupdate'));audio.dispatchEvent(new Event('ended'));}});await expect(page.locator('.speech-highlight')).toHaveCount(0);await next();
 }await page.evaluate(()=>window.multiplier=8);await next();
 await expect(page.locator('.at-choice')).toHaveCount(3);await audioDone();assert.equal(await page.evaluate(()=>window.audioLog.at(-1).path),familySpeech['word:cat']);await act('answer','[data-choice="cat"]').click();await next();
 await scene(['hat']);await expect(page.locator('.at-letter-gap')).toHaveText('_at');await expect(page.locator('.at-choice')).toHaveText(['h','c','m']);await act('answer','[data-choice="h"]').click();await expect(page.locator('.at-letter-gap')).toHaveText('hat');await next();
 await scene(['cat','hat'],{hat:'cat'});await expect(page.locator('.at-sentence')).toHaveText('The cat has a ___.');await act('answer','[data-choice="hat"]').click();await next();await expect(page.locator('.at-earned-star')).toHaveText('★');await expect(page.locator('.at-completion-note')).toHaveText('We practised with help.');assert.equal((await reading()).star,true);assert((await reading()).wordsNeedingPractice.includes('cat'));assert.equal((await reading()).answers['blank-mat'].firstAttemptCorrect,true);assert.equal((await reading()).answers['blank-mat'].assisted,false);assert.deepEqual(oldProgress(await data()),oldProgress(seed));assert.deepEqual(normalizeFamilyProgress((await data()).pictureFamilies).reading.at,await reading());
 await act('back').last().click();await expect(act('continue')).toBeVisible();await page.locator('[data-action="family-library"]').click();await page.locator('[data-action="family-open"][data-family="an"]').click();await expect(act('open')).toHaveCount(0);await library();await expect(page.locator('.family-card')).toHaveCount(10);await act('continue').click();await page.locator('.at-revisit summary').click();await act('visit','[data-step="11"]').click();assert.equal(await stepId(),'sentence-0');
 // The full sequence at PC and both phone viewport sizes; text enlargement can scroll.
 const completed=await data();
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:568}]){
  await page.setViewportSize(viewport);
  for(const [index,s]of atSteps.entries()){
   const test=structuredClone(completed);test.pictureFamilies.reading.at.step=index;test.pictureFamilies.reading.at.review=null;test.pictureFamilies.reading.at.meaningOpen=false;
   await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),test);await page.reload();await library();await act('continue').click();await fit(viewport,s.type!=='finish');
   if(['paragraph-read','blank-mat','finish'].includes(s.id))await page.screenshot({path:'qa/at-'+s.id+'-'+viewport.width+'.png',fullPage:true});
  }
  layouts.push({...viewport,steps:atSteps.length});
 }
 await page.setViewportSize({width:320,height:568});await page.locator('.at-revisit summary').click();await act('visit','[data-step="21"]').click();await page.evaluate(()=>document.documentElement.style.fontSize='32px');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await expect(act('next')).toBeVisible();await act('next').scrollIntoViewIfNeeded();await expect(act('next')).toBeInViewport();
 // Decode new English, Bengali and chime assets: every clip is audible and valid.
 let decoded=0;const newPaths=[...new Set([...atAudioSpecs.map(s=>stageSpeech[s.key]),stageSpeech['at-tone:success']])];
 for(const path of newPaths){
  const bytes=await readFile('dist'+path);assert.equal('/audio/'+createHash('sha256').update(bytes).digest('hex').slice(0,24)+(path.endsWith('.wav')?'.wav':'.mp3'),path);assert.equal((await context.request.get('http://localhost:4174'+path)).status(),200);
  const decodedAudio=await page.evaluate(async base64=>{const ctx=new AudioContext();try{const a=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);return {duration:a.duration,audible:a.getChannelData(0).some(v=>Math.abs(v)>.01)};}finally{await ctx.close();}},bytes.toString('base64'));
  assert(decodedAudio.audible);assert(decodedAudio.duration>.1);if(audioTimings[path])assert(audioTimings[path].words.at(-1).end<=decodedAudio.duration);decoded++;
 }
 assert.deepEqual(errors,[]);assert.deepEqual(networkErrors,[]);assert.equal(await page.evaluate(()=>window.overlap),false);
 report.checks=['Existing family data and old audio unchanged','Optional four-word review','Eight contextual Bengali hints on request with working clips','Exact phrases and five sentences','Unambiguous three-choice scenes','Wrong choice fills gap; helpful retry; two misses demonstrate phonics','First-attempt and assisted records survive reopening','Correct sentence stays visible until Next','Previous preserves completed answers','Sequential paragraph gaps and full story','Normal and slow audio-clock word highlighting with no layout movement','Pause/resume, Replay and cancellation','Three play questions, praise and gentle sound','One completion star including assistance','Revisit completed steps','Old stars, unfinished word tiles and writing untouched','No extra -at card or other-family reading button','Keyboard answers and modal Escape','Text enlargement scrolls without horizontal overflow'];
 report.layouts=layouts;report.audio={decodedReadingAssets:decoded,english:'Recorded WordBoundary timestamps from the same audio; every paragraph word tested at 1 and 0.85.',bengali:'Existing and new Bengali recordings play; the meaning is highlighted as a whole during its clip.'};
 await writeFile('qa/at-reading-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{if(context)await context.close();}
