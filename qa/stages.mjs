import {showParagraph} from './story-helpers.mjs';
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,stat,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {alphabet,wordLessons,stories,patternLessons,normalizeLearning} from '../dist/stage-data.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {familySpeech} from '../dist/family-speech.js';
import {normalizeProgress,profiles} from '../dist/curriculum.js';
assert.equal(alphabet.length,26);assert(alphabet.every(a=>a.examples.length===2));assert.deepEqual(alphabet[0].examples,['apple','ant']);assert.deepEqual(alphabet[1].examples,['ball','bat']);
assert.deepEqual(wordLessons.map(l=>l.word),['cat','mat','sat','sit','pen','hen','pig','sun','run']);assert.equal(stories.length,24);
assert.equal(new Set(stories.map(s=>s.title)).size,24);assert.equal(new Set(stories.map(s=>s.sentences.join(' '))).size,24);
for(const l of wordLessons){assert.equal(l.choices.length,3);assert(l.choices.includes(l.word));assert(!profiles.big.lessons.some(old=>old.sentence===l.sentence));}
for(const s of stories)for(const b of s.blanks){assert.equal(b.choices.length,3);assert(new RegExp('\\b'+b.word+'\\b').test(s.sentences[b.line]));}
for(const a of alphabet){assert(stageSpeech['name:'+a.letter]);assert(stageSpeech['sound:'+a.sound]);for(const word of a.examples)assert(stageSpeech['word:'+word]);}
assert(stageSpeech['sound:ai']&&stageSpeech['sound:ea']&&stageSpeech['sound:sh']&&stageSpeech['sound:ch']);
assert.equal(stageSpeech['sound:c'],stageSpeech['sound:k']);assert.notEqual(stageSpeech['sound:qu'],stageSpeech['sound:k']);
for(const file of new Set(Object.values(stageSpeech)))assert((await stat('dist'+file)).size>500);
const invalid=normalizeLearning({letter:99,lettersDone:['a','bad','a'],patterns:['ai','bad'],words:{'first-cat':{step:100,answer:'bad'}},stories:{'hen-sun':{mode:'bad',answers:['bad']}}});
assert.equal(invalid.letter,0);assert.deepEqual(invalid.lettersDone,['a']);assert.equal(invalid.words['first-cat'].step,0);assert.equal(invalid.stories['hen-sun'].answers[0],null);
const seed={profile:'big',completed:{little:['letters-sat'],big:['words-1','words-16']},inProgress:{little:{'letters-pin':{lessonId:'letters-pin',step:1}},big:{'words-2':{lessonId:'words-2',step:3,tiles:['p','a','n'],placed:[0]}}},currentLesson:{big:'words-2'},pictureFamilies:{completed:['picture-at-2'],inProgress:{'picture-at-1':{step:1,tiles:['c','a','t'],placed:[0]}},current:'picture-at-1',writing:{drafts:{cat:{drawing:[[[.1,.2],[.3,.4]]],showGuide:false}},current:'cat'}}};
const old=normalizeProgress(seed),errors=[],external=[];let context,page;
const profile=await mkdtemp(join(tmpdir(),'kids-three-stages-'));
async function open(){
 context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:{width:1280,height:1000}});
 await context.addInitScript(()=>{const Native=window.Audio,descriptor=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.clips=[];window.Audio=function(...args){const a=new Native(...args);Object.defineProperty(a,'playbackRate',{get:()=>descriptor.get.call(a),set:v=>descriptor.set.call(a,Math.min(16,v*8))});window.clips.push(a);return a;};});
 page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4174/')&&!r.url().startsWith('data:'))external.push(r.url());});await page.goto('http://localhost:4174/');
}
async function nav(stage){await page.locator('[data-action="stage"][data-stage="'+stage+'"]').click();}
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
async function fit(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');await expect(page.getByRole('navigation',{name:'Learning stages'})).toBeVisible();}
async function letterDone(){await expect(page.locator('#letter-phase')).toHaveText('Ready to replay',{timeout:15000});}
try{
 await open();await expect(page.getByRole('heading',{name:'Say hello to Aa.',exact:true})).toBeVisible();
 assert.equal(await page.evaluate(()=>window.clips.length),0);await expect(page.locator('[data-action="stages-letter-start"]').first()).toHaveText('Start');
 await page.screenshot({path:'qa/stages-letters-desktop.png',fullPage:true});
 await page.locator('[data-action="stages-letter-start"]').first().click();
 await page.waitForFunction(()=>window.clips.at(-1)?.currentTime>0);
 await page.locator('[data-action="stages-pause"]').click();await expect(page.locator('[data-action="stages-pause"]')).toHaveText('Resume');
 const pausedCount=await page.evaluate(()=>window.clips.length);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.clips.length),pausedCount);
 await page.locator('[data-action="stages-pause"]').click();await letterDone();
 await expect(page.getByRole('heading',{name:'Say hello to Aa.',exact:true})).toBeVisible();
 const expected=a=>a.examples.flatMap(w=>['name:'+a.letter,'sound:'+a.sound,'word:'+w]).map(k=>stageSpeech[k]);
 assert.deepEqual(await page.evaluate(()=>window.clips.map(a=>new URL(a.src).pathname)),expected(alphabet[0]));
 for(let i=1;i<26;i++){
  await page.evaluate(()=>{window.clips=[];});await page.locator('.letter-paging [data-action="stages-letter-next"]').last().click();
  await expect(page.getByRole('heading',{name:'Say hello to '+alphabet[i].letter.toUpperCase()+alphabet[i].letter+'.',exact:true})).toBeVisible();await letterDone();
  assert.deepEqual(await page.evaluate(()=>window.clips.map(a=>new URL(a.src).pathname)),expected(alphabet[i]));
 }
 await expect(page.locator('.letter-paging [data-action="stages-letter-next"]').last()).toBeDisabled();
 await page.locator('[data-action="stages-letter-next"]').first().click();await letterDone();await expect(page.getByRole('heading',{name:'Say hello to Yy.',exact:true})).toBeVisible();
 await page.locator('[data-action="stages-letter-start"]').last().click();await page.waitForFunction(()=>window.clips.at(-1)?.currentTime>0);await nav('words');
 console.log('PASS: all 26 letter sequences, pause/resume, replay and manual navigation.');
 assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));await fit();
 await page.evaluate(()=>{window.clips=[];});await page.locator('[data-action="stages-blend"][data-word="sat"]').click();await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.');
 assert.deepEqual(await page.evaluate(()=>window.clips.map(a=>new URL(a.src).pathname)),['sound:s','sound:a','sound:t','word:sat'].map(k=>stageSpeech[k]));
 // Import old progress after checking all letters; the first screen still opens on Aa.
 await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),seed);await page.reload();await expect(page.getByRole('heading',{name:'Say hello to Aa.',exact:true})).toBeVisible();
 await nav('letters');await page.locator('.stage-practice').last().locator('summary').click();await expect(page.locator('[data-action="stages-legacy"][data-profile="little"]')).toHaveCount(9);
 await nav('words');await page.locator('.stage-practice summary').click();await expect(page.locator('[data-action="stages-legacy"]')).toHaveCount(15);
 await page.locator('[data-action="stages-legacy"][data-index="1"]').click();await expect(page.getByRole('heading',{name:'Can you build the word?',exact:true})).toBeVisible();await expect(page.locator('.slots')).toHaveAttribute('aria-label','Your word: p');await nav('words');
 await page.screenshot({path:'qa/stages-words-desktop.png',fullPage:true});
 for(const l of wordLessons){
  await page.locator('.word-path [data-action="stages-word-open"][data-id="'+l.id+'"]').click();await page.locator('[data-action="stages-word-next"]').click();await expect(page.locator('.helper-card')).toHaveCount(l.helpers.length);
  await page.locator('[data-action="stages-word-next"]').click();await expect(page.locator('.sentence')).toHaveText(l.phrase);await page.locator('[data-action="stages-word-next"]').click();
  await page.locator('[data-action="stages-word-answer"][data-word="'+l.choices.find(w=>w!==l.word)+'"]').click();assert.equal(await page.locator('[data-action="stages-word-finish"]').count(),0);
  await page.locator('[data-action="stages-word-answer"][data-word="'+l.word+'"]').click();await expect(page.locator('.completed-sentence')).toHaveText(l.sentence);
  await page.reload();await nav('words');await page.locator('.word-path [data-action="stages-word-open"][data-id="'+l.id+'"]').click();await expect(page.locator('.completed-sentence')).toHaveText(l.sentence);
  await page.locator('[data-action="stages-word-finish"]').click();await expect(page.locator('.completed-sentence')).toHaveText(l.sentence);await nav('words');
 }
 await nav('stories');await expect(page.locator('.story-card')).toHaveCount(24);await page.locator('.stage-practice summary').click();await expect(page.locator('[data-action="stages-legacy"]')).toHaveCount(3);
 await page.screenshot({path:'qa/stages-stories-desktop.png',fullPage:true});
 for(const p of patternLessons){
  await page.locator('[data-action="stages-pattern"][data-id="'+p.id+'"]').click();await expect(page.locator('.pattern-word-grid>div')).toHaveCount(3);
  const i=p.id==='ea'?1:0;await page.evaluate(()=>{window.clips=[];});await page.locator('[data-action="stages-pattern-blend"][data-index="'+i+'"]').click();await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.');
  assert.deepEqual(await page.evaluate(()=>window.clips.map(a=>new URL(a.src).pathname)),p.parts[i].map(part=>stageSpeech['sound:'+part]).concat(stageSpeech['word:'+p.words[i]]));
  await page.locator('[data-action="stages-pattern-finish"]').click();
 }
 for(const s of stories){
  await page.locator('.story-grid [data-action="stages-story-open"][data-id="'+s.id+'"]').click();await showParagraph(page);await expect(page.locator('.story-line')).toHaveCount(s.sentences.length);await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));
  if(['cat-rat','sea-seat'].includes(s.id)){
   await page.evaluate(()=>{window.clips=[];});await page.locator('[data-action="stages-story-audio"]').click();await expect(page.locator('.story-line.playing')).toHaveCount(1);await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.',{timeout:15000});
   assert.deepEqual(await page.evaluate(()=>window.clips.map(a=>new URL(a.src).pathname)),s.sentences.map(line=>stageSpeech['text:'+line]));
  }
  if(await page.locator('[data-action="stages-story-finish"]').count())await page.locator('[data-action="stages-story-finish"]').click();
  await page.locator('[data-action="stages-story-mode"][data-mode="blanks"]').click();
  for(const [i,b]of s.blanks.entries()){
   const buttons=page.locator('[data-action="stages-story-answer"][data-blank="'+i+'"]');await expect(buttons).toHaveCount(3);
   await buttons.filter({hasText:new RegExp('^'+b.choices.find(w=>w!==b.word)+'$')}).click();assert.equal(await page.locator('[data-action="stages-story-finish"]').count(),0);
   await buttons.filter({hasText:new RegExp('^'+b.word+'$')}).click();if(i+1<s.blanks.length)await page.locator('[data-action="stages-story-blank-next"]').click();
  }
  await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));await page.locator('[data-action="stages-story-finish"]').click();
  if(s.id==='cat-rat'){await page.screenshot({path:'qa/stages-complete-paragraph.png',fullPage:true});await page.reload();await nav('stories');await page.locator('.story-grid [data-action="stages-story-open"][data-id="'+s.id+'"]').click();await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));}
  await nav('stories');
 }
 const saved=await data();assert.deepEqual(saved.completed,old.completed);assert.deepEqual(saved.inProgress,old.inProgress);assert.deepEqual(saved.pictureFamilies,old.pictureFamilies);assert.equal(Object.values(saved.learning.words).filter(p=>p.done).length,9);assert.equal(Object.values(saved.learning.stories).filter(p=>p.done).length,24);
 console.log('PASS: blending, nine new word lessons, four patterns, 24 stories and retained legacy progress.');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:900});for(const stage of ['letters','words','stories']){await nav(stage);await fit();}await page.screenshot({path:'qa/stages-stories-'+width+'.png',fullPage:true});
  await page.locator('.story-grid [data-action="stages-story-open"][data-id="cat-rat"]').click();await fit();await page.screenshot({path:'qa/stages-paragraph-'+width+'.png',fullPage:true});
  await showParagraph(page);await fit();
  await nav('words');await page.locator('.word-path [data-action="stages-word-open"][data-id="first-cat"]').click();await fit();
  await nav('letters');await page.locator('.stage-practice').first().locator('summary').click();await fit();
 }
 await nav('letters');await page.screenshot({path:'qa/stages-letters-mobile.png',fullPage:true});
 // Decode the complete recording manifest, including new phonemes and story sentences.
 let decoded=0;
 for(const file of new Set(Object.values(stageSpeech))){
  const bytes=(await readFile('dist'+file)).toString('base64');const result=await page.evaluate(async encoded=>{const ctx=new AudioContext();try{const b=await ctx.decodeAudioData(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer);return {duration:b.duration,audible:b.getChannelData(0).some(n=>Math.abs(n)>.01)};}finally{await ctx.close();}},bytes);
  assert(result.duration>.1&&result.audible,file);decoded++;
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={passed:true,letters:26,letterExamples:52,coreWords:9,stories:24,patterns:['sh','ch','ai','ea'],decodedClips:decoded,checks:['Aa first screen with Start and persistent navigation','all 26 letters play six synchronized clips without extra Listen','pause/resume, replay and manual previous/next only','old exercises remain in appropriate stages','old stars and checkpoints unchanged','explicit helper words and phrases before sentence blanks','correct sentences and paragraphs stay visible','all story blanks and all core lessons complete','reload restores answers','320px and 390px layouts fit','every new recording decodes and contains audio','no page errors or external runtime requests']};
 await writeFile('qa/stages-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(context)await context.close();}
