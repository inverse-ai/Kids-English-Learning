import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {alphabet,wordLessons,stories,patternLessons,supportingWords,pictureSymbols} from '../dist/stage-data.js';
import {audioTimings} from '../dist/audio-timings.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {normalizeProgress} from '../dist/curriculum.js';

// Compare the retained content and audio to the committed app, independently of the player.
const committed=async file=>import('data:text/javascript;base64,'+execFileSync('git',['show','HEAD:'+file]).toString('base64'));
const before=await committed('dist/stage-data.js'),oldAudio=(await committed('dist/stage-speech.js')).stageSpeech;
for(const [name,value]of Object.entries({alphabet,wordLessons,stories,patternLessons,supportingWords,pictureSymbols}))assert.deepEqual(value,before[name]);
for(const [key,file]of Object.entries(oldAudio))assert(stageSpeech[key]===file||audioTimings[stageSpeech[key]],'retained narration must have matching timings: '+key);
for(const file of ['dist/curriculum.js','dist/family-data.js','dist/family-speech.js','dist/story-words.js','dist/story-scenes.js','dist/index.html','dist/style.css'])assert.equal(file==='dist/style.css'?(await readFile(file,'utf8')).replaceAll('\r\n','\n').startsWith(execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'}).replaceAll('\r\n','\n')):(await readFile(file,'utf8')).replaceAll('\r\n','\n')===execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'}).replaceAll('\r\n','\n'),true,'unrelated section changed: '+file);
const specs=JSON.parse(execFileSync('node',['tools/collect-stage-audio.mjs'],{encoding:'utf8'}));
const texts=new Map(specs.map(s=>[s.key,s.text]));
assert.equal(texts.get('alphabet-example:a:apple'),'A for apple.');
assert.equal(texts.get('alphabet-example:a:ant'),'A for ant.');
assert.equal(texts.get('alphabet-example:b:ball'),'B for ball.');
assert.equal(texts.get('alphabet-example:b:bat'),'B for bat.');
for(const a of alphabet){
 assert.equal(texts.get('alphabet-case:'+a.letter),'Uppercase '+a.letter.toUpperCase()+' and lowercase '+a.letter.toUpperCase()+'.');
 for(const word of a.examples){
  const phrase=texts.get('alphabet-example:'+a.letter+':'+word);
  assert.equal(phrase,a.letter==='q'?'Q with U for '+word+'.':a.letter==='x'?'X at the end of '+word+'.':a.letter.toUpperCase()+' for '+word+'.');
  assert(!/The letter|The sound is/i.test(phrase));
 }
}
const source=JSON.parse(await readFile('tools/stage-audio-source.json','utf8'));
assert(source.phonemes.find(s=>s.key==='sound:a').url.endsWith('/a.mp3'));
assert(source.phonemes.find(s=>s.key==='sound:b').url.endsWith('/b_alt1.mp3'));
assert(source.phonemes.find(s=>s.key==='sound:qu').url.endsWith('/Kw_new.mp3'));
assert(source.phonemes.find(s=>s.key==='sound:x').url.endsWith('/Ks_new.mp3'));
const expected=a=>['alphabet-case:'+a.letter,...a.examples.flatMap(word=>['alphabet-example:'+a.letter+':'+word,...Array(3).fill('sound:'+a.sound),'word:'+word])].map(key=>stageSpeech[key]);
const seed=normalizeProgress({profile:'big',completed:{little:['letters-pin'],big:['words-9']},inProgress:{big:{'words-1':{lessonId:'words-1',step:3,tiles:['c','a','t'],placed:[0]}}},currentLesson:{big:'words-1'},pictureFamilies:{completed:['picture-at-2'],writing:{drafts:{cat:{drawing:[[[.1,.2],[.3,.4]]],showGuide:false}},current:'cat'}},learning:{letter:12,lettersDone:['m'],words:{'first-cat':{step:3,answer:'cat',done:true},'first-hen':{step:2}},wordCurrent:'first-hen',stories:{'cat-rat':{phase:'blanks',line:3,blank:1,answers:['cat',null],done:true}},storyCurrent:'cat-rat',storyWordsMet:['i','see','too'],patterns:['sh']}});
const preserved=value=>{const copy=structuredClone(value);delete copy.learning.letter;delete copy.learning.lettersDone;return copy;};
const profile=await mkdtemp(join(tmpdir(),'kids-alphabet-narration-'));
const errors=[],external=[],completed=[];let context,page;
async function open(){
 context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:{width:390,height:844}});
 await context.addInitScript(()=>{
  const Native=Audio,rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');
  window.audioLog=[];window.nativeClips=[];window.rateMultiplier=8;
  window.Audio=function(...args){
   const audio=new Native(...args),entry={path:new URL(audio.src).pathname,started:null,ended:null,plays:0};
   Object.defineProperty(audio,'playbackRate',{get:()=>rate.get.call(audio),set:value=>rate.set.call(audio,Math.min(16,value*window.rateMultiplier))});
   const play=audio.play.bind(audio);
   audio.play=()=>{entry.plays++;if(entry.started===null)entry.started=performance.now();return play();};audio.addEventListener('playing',()=>setTimeout(()=>{if(entry.picture!==undefined)return;entry.picture=document.querySelector('.letter-example.playing')?.dataset.example??null;entry.phase=document.querySelector('#letter-phase')?.textContent;entry.heading=document.querySelector('h1')?.textContent;},0));
   audio.addEventListener('ended',()=>entry.ended=performance.now());
   audio.addEventListener('error',()=>entry.error=audio.error?.code);
   window.audioLog.push(entry);window.nativeClips.push(audio);return audio;
  };
 });
 page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4174/')&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto('http://localhost:4174/');
}
const log=()=>page.evaluate(()=>window.audioLog);
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
const pause=()=>page.locator('[data-action="stages-pause"]').click();
const replay=()=>page.locator('[data-action="stages-letter-start"]').last().click();
const nav=stage=>page.locator('[data-action="stage"][data-stage="'+stage+'"]').click();
const next=()=>page.locator('.letter-paging [data-action="stages-letter-next"]').last().click();
const previous=()=>page.locator('.letter-paging [data-action="stages-letter-next"]').first().click();
const done=()=>expect(page.locator('#letter-phase')).toHaveText('Ready to replay',{timeout:20000});
const reset=()=>page.evaluate(()=>{window.audioLog=[];window.nativeClips=[];});
async function checkSequence(a){
 const played=await log();assert.deepEqual(played.map(e=>e.path),expected(a));assert(played.every(e=>e.started!==null&&e.ended!==null&&!e.error));
 assert.equal(played[0].picture,null);assert.equal(played[0].phase,'Uppercase and lowercase: '+a.letter.toUpperCase()+a.letter);
 for(let example=0;example<2;example++){
  const offset=1+example*5;
  for(let part=0;part<5;part++)assert.equal(played[offset+part].picture,String(example),'picture must stay synchronized for '+a.examples[example]);
  for(let repeat=1;repeat<=3;repeat++)assert.equal(played[offset+repeat].phase,'Letter sound · '+repeat+' of 3');
 }
 assert(played[6].started-played[5].ended>=550,'short pause before the second example');
 await expect(page.getByRole('heading',{name:'Say hello to '+a.letter.toUpperCase()+a.letter+'.',exact:true})).toBeVisible();
 await expect(page.locator('[data-action="stages-pause"]')).toBeDisabled();
}
try{
 await open();await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),seed);await page.reload();
 await expect(page.getByRole('heading',{name:'Say hello to Aa.',exact:true})).toBeVisible();assert.equal((await log()).length,0);
 await expect(page.locator('[data-action="stages-letter-start"]').first()).toHaveText('Start');await expect(page.locator('.letter-paging button').first()).toBeDisabled();
 await expect(page.getByRole('button',{name:'Continue that letter →',exact:true})).toBeVisible();
 // Pause during real speech, retain its position, and resume the same recording.
 await page.evaluate(()=>window.rateMultiplier=1);await page.locator('[data-action="stages-letter-start"]').first().click();await page.waitForFunction(()=>window.nativeClips[0]?.currentTime>0);
 await pause();await expect(page.locator('[data-action="stages-pause"]')).toHaveText('Resume');
 const pausedTime=await page.evaluate(()=>window.nativeClips[0].currentTime);await page.waitForTimeout(500);
 assert.equal((await log()).length,1);assert(Math.abs(await page.evaluate(()=>window.nativeClips[0].currentTime)-pausedTime)<.02);
 await pause();assert.equal((await log()).length,1);await page.evaluate(()=>{window.rateMultiplier=8;window.nativeClips[0].playbackRate=1;});
 // Pause during the 600ms silence after apple. The remaining silence resumes too.
 await page.waitForFunction(()=>window.nativeClips.length===6&&window.nativeClips[5].ended,null,{polling:'raf'});await pause();
 await page.waitForTimeout(800);assert.equal((await log()).length,6);const resumedAt=await page.evaluate(()=>performance.now());await pause();
 await page.waitForFunction(()=>window.nativeClips.length===7);assert((await log())[6].started-resumedAt>300,'resume should keep the remaining example pause');
 await done();await checkSequence(alphabet[0]);completed.push('a');
 await page.waitForTimeout(400);assert.equal((await log()).length,11);await expect(page.getByRole('heading',{name:'Say hello to Aa.',exact:true})).toBeVisible();
 console.log('PASS: A narration, synchronized pictures, pause/resume within speech and silence.');
 for(let index=1;index<26;index++){
  await reset();await next();await done();await checkSequence(alphabet[index]);completed.push(alphabet[index].letter);
  if(index%5===0||index===25)console.log('PASS: narrated '+completed.length+'/26 letters, including '+alphabet[index].letter.toUpperCase()+'.');
 }
 await expect(page.locator('.letter-paging button').last()).toBeDisabled();
 assert.equal((await data()).learning.lettersDone.length,26);assert.deepEqual(preserved(await data()),preserved(seed));
 // Previous autoplays. Replay cancels the current recording before restarting.
 await reset();await previous();await done();await checkSequence(alphabet[24]);
 await reset();await page.evaluate(()=>window.rateMultiplier=1);await replay();await page.waitForFunction(()=>window.nativeClips[0]?.currentTime>0);await replay();
 assert(await page.evaluate(()=>window.nativeClips[0].paused&&!window.nativeClips[0].getAttribute('src')));assert.equal((await log())[1].path,stageSpeech['alphabet-case:y']);
 // Rapid Next/Previous cancels both playing and queued audio; even a stale ended event cannot restart it.
 await next();await previous();assert(await page.evaluate(()=>window.nativeClips.slice(0,-1).every(a=>a.paused&&!a.getAttribute('src'))));
 const count=(await log()).length;await page.evaluate(()=>window.nativeClips[0].dispatchEvent(new Event('ended')));await page.waitForTimeout(250);assert.equal((await log()).length,count);
 await nav('words');assert(await page.evaluate(()=>window.nativeClips.every(a=>a.paused)));await page.waitForTimeout(800);assert.equal((await log()).length,count);
 await expect(page.getByRole('heading',{name:'Sounds become words.',exact:true})).toBeVisible();
 // The shared audio player's normal 180ms pacing is unchanged for other stages.
 await reset();await page.evaluate(()=>window.rateMultiplier=8);await page.locator('[data-action="stages-blend"][data-word="sat"]').click();await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.',{timeout:15000});
 const blend=await log();assert.deepEqual(blend.map(e=>e.path),['sound:s','sound:a','sound:t','word:sat'].map(key=>stageSpeech[key]));assert(blend[1].started-blend[0].ended>=150&&blend[1].started-blend[0].ended<500);
 await nav('stories');await expect(page.getByRole('heading',{name:'Little stories to read.',exact:true})).toBeVisible();assert.deepEqual(preserved(await data()),preserved(seed));
 await context.close();context=null;await open();assert.equal((await log()).length,0);await expect(page.getByRole('heading',{name:'Say hello to Aa.',exact:true})).toBeVisible();assert.deepEqual(preserved(await data()),preserved(seed));assert.equal((await data()).learning.lettersDone.length,26);
 // All clips used by the alphabet decode, have audible samples, and are available locally.
 let decoded=0;const alphabetFiles=new Set(alphabet.flatMap(expected));
 for(const file of alphabetFiles){
  const bytes=(await readFile('dist'+file)).toString('base64');
  const result=await page.evaluate(async encoded=>{const ctx=new AudioContext();try{const b=await ctx.decodeAudioData(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer);return {duration:b.duration,audible:b.getChannelData(0).some(n=>Math.abs(n)>.01)};}finally{await ctx.close();}},bytes);
  assert(result.duration>.03&&result.audible,file);decoded++;
 }
 await page.screenshot({path:'qa/alphabet-narration-mobile.png',fullPage:true});
 // A missing recording reports the failure and navigation remains available.
 await page.route('**'+stageSpeech['alphabet-case:a'],route=>route.abort());await replay();await expect(page.locator('#audio-status')).toContainText('Audio could not play');await expect(page.locator('[data-action="stages-pause"]')).toBeDisabled();await next();await expect(page.getByRole('heading',{name:'Say hello to Bb.',exact:true})).toBeVisible();await nav('words');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={passed:true,letters:26,examples:52,phonemeRepetitionsPerExample:3,clipsPerLetter:11,decodedAlphabetClips:decoded,newNarrationRecordings:specs.filter(s=>s.key.startsWith('alphabet-')).length,checks:['one uppercase/lowercase introduction per letter playback','requested A and B narration with X and Q exceptions','all 26 letters play in order with synchronized pictures','short pause between examples and no automatic letter advance','pause/resume within speech and example silence','Replay and rapid manual Next/Previous cancel old audio','old progress including partial word/story/writing answers survives and reloads','existing narration, voices and other stage content preserved','shared player retains default timing for word blending','missing audio reports failure and permits navigation','no browser errors or external runtime requests'],unverifiedAudio:['No perceptual listening review of the 78 new synthesized narration recordings or every reused phoneme. Browser playback, clip source mapping and decoding were verified; automated checks do not prove pronunciation quality.']};
 await writeFile('qa/alphabet-narration-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{if(context)await context.close();}
