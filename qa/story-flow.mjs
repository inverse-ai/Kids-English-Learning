import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {alphabet,wordLessons,supportingWords,stories,normalizeLearning} from '../dist/stage-data.js';
import {storyWords,storyIntroductions} from '../dist/story-words.js';
import {storyScene} from '../dist/story-scenes.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {normalizeProgress} from '../dist/curriculum.js';
const before=await import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show','HEAD:dist/stage-data.js'])).toString('base64'));
const oldAudio=await import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show','HEAD:dist/stage-speech.js'])).toString('base64'));
assert.deepEqual(alphabet,before.alphabet);assert.deepEqual(wordLessons,before.wordLessons);assert.deepEqual(supportingWords,before.supportingWords);assert.deepEqual(stories,before.stories);
for(const [key,file]of Object.entries(oldAudio.stageSpeech))assert.equal(stageSpeech[key],file,'existing audio changed: '+key);
assert.equal(storyWords.get('too').meaning,'এছাড়াও / ও');
assert.deepEqual(storyIntroductions(stories.find(s=>s.id==='cat-rat'),0,normalizeLearning({words:{'first-cat':{step:2}}})),[]);
for(const [key,entry]of storyWords){assert(entry.meaning&&!entry.meaning.includes('অত্যধিক'));assert(stageSpeech['word:'+entry.word]);assert(stageSpeech['story-meaning:'+key]);}
for(const s of stories)for(const [line,sentence]of s.sentences.entries()){assert(stageSpeech['text:'+sentence]);assert(storyScene(s,line).includes('role="img"'));}
const invalid=normalizeLearning({storyWordsMet:['too','bad','too'],stories:{'cat-rat':{phase:'bad',line:90,blank:90,mode:'blanks',answers:['mat','run'],done:true}}});assert.deepEqual(invalid.storyWordsMet,['too']);assert.equal(invalid.stories['cat-rat'].phase,'blanks');assert.equal(invalid.stories['cat-rat'].line,0);
const seed={completed:{little:['letters-pin'],big:['words-9']},inProgress:{big:{'words-1':{lessonId:'words-1',step:3,tiles:['c','a','t'],placed:[0]}}},pictureFamilies:{completed:['picture-at-2'],writing:{drafts:{cat:{drawing:[[[.1,.2],[.3,.4]]],showGuide:false}},current:'cat'}}};
const profile=await mkdtemp(join(tmpdir(),'kids-guided-stories-'));
let context,page;const errors=[],external=[];
async function open(){
 context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:{width:390,height:844}});
 await context.addInitScript(()=>{const Native=Audio,rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.audioLog=[];window.nativeClips=[];window.Audio=function(...args){const a=new Native(...args);Object.defineProperty(a,'playbackRate',{get:()=>rate.get.call(a),set:v=>rate.set.call(a,Math.min(16,v*8))});window.audioLog.push(new URL(a.src).pathname);window.nativeClips.push(a);return a;};});
 page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://localhost:4174/')&&!r.url().startsWith('data:'))external.push(r.url());});await page.goto('http://localhost:4174/');
}
const phase=()=>page.locator('.story-player').getAttribute('data-phase');
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
async function enter(id){await page.locator('[data-action="stage"][data-stage="stories"]').click();await page.locator('.story-grid [data-action="stages-story-open"][data-id="'+id+'"]').click();}
async function audioDone(){await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.',{timeout:15000});}
async function fit(){
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
 for(const button of await page.locator('.story-controls button,.story-answer-choices button,.story-listen button,[data-action="stages-story-skip"]').all()){const b=await button.boundingBox();assert(b&&b.y>=0&&b.y+b.height<=await page.evaluate(()=>innerHeight),'main Story control below viewport');}
 await expect(page.getByRole('navigation',{name:'Learning stages'})).toBeVisible();assert.equal(await page.locator('.story-player .helper-card').count(),0);
}
try{
 await open();await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),seed);await page.reload();const original=normalizeProgress(seed);
 await enter('cat-rat');await expect(page.locator('.story-helper-word')).toHaveText('I');await fit();await page.screenshot({path:'qa/story-flow-helper-390.png',fullPage:true});
 const introduced=[];
 for(let line=0;line<4;line++){
  while(await phase()==='helper'){
   const word=await page.locator('.story-helper-word').textContent();introduced.push({word,line});await audioDone();
   assert.deepEqual(await page.evaluate(()=>window.audioLog.slice(-2)),[stageSpeech['word:'+word.trim()],stageSpeech['story-meaning:'+word.trim().toLowerCase()]]);
   await fit();await expect(page.locator('[data-action="stages-story-skip"]')).toBeVisible();
   if(word==='I'){await page.locator('[data-action="stages-story-helper-replay"]').click();await audioDone();assert.deepEqual(await page.evaluate(()=>window.audioLog.slice(-2)),[stageSpeech['word:I'],stageSpeech['story-meaning:i']]);}
   if(word==='too')await expect(page.locator('.story-helper-meaning')).toHaveText('এছাড়াও / ও');
   await page.locator('[data-action="stages-story-helper-next"]').click();
  }
  await expect(page.locator('.story-sentence')).toHaveText(stories.find(s=>s.id==='cat-rat').sentences[line]);await expect(page.locator('.sentence-scene')).toHaveCount(1);await fit();
  if(line===1){assert.equal(await page.locator('.sentence-scene [data-object="mat"]').count(),1);assert.equal(await page.locator('.sentence-scene [data-object="cat"]').count(),1);await page.screenshot({path:'qa/story-flow-cat-on-mat-390.png',fullPage:true});}
  if(line===2)await page.screenshot({path:'qa/story-flow-cat-rat-mat-390.png',fullPage:true});
  const count=await page.evaluate(()=>window.audioLog.length);await page.locator('[data-action="stages-story-sentence-audio"]').click();await audioDone();assert.equal(await page.evaluate(()=>window.audioLog.length),count+1);
  if(line===1){await context.close();await open();await enter('cat-rat');assert.equal(await phase(),'sentence');await expect(page.locator('.story-sentence')).toHaveText('The cat is on a mat.');await page.locator('[data-action="stages-story-previous"]').click();await expect(page.locator('.story-sentence')).toHaveText('I see a cat.');await page.locator('[data-action="stages-story-next"]').click();assert.equal(await phase(),'sentence');}
  await page.locator('[data-action="stages-story-next"]').click();
 }
 assert.deepEqual(introduced,[{word:'I',line:0},{word:'see',line:0},{word:'a',line:0},{word:'the',line:1},{word:'is',line:1},{word:'on',line:1},{word:'rat',line:2},{word:'too',line:2},{word:'and',line:3}]);
 assert.equal(await phase(),'paragraph');await expect(page.locator('.story-paragraph')).toHaveText(stories.find(s=>s.id==='cat-rat').sentences.join(' '));await fit();await page.screenshot({path:'qa/story-flow-paragraph-390.png',fullPage:true});
 assert(!(await data()).learning.stories['cat-rat'].done);assert.equal(await page.locator('[data-action="stages-story-mode"]').count(),0);
 await page.locator('[data-action="stages-story-audio"]').click();await audioDone();assert.deepEqual(await page.evaluate(()=>window.audioLog.slice(-4)),stories.find(s=>s.id==='cat-rat').sentences.map(text=>stageSpeech['text:'+text]));
 await page.locator('[data-action="stages-story-finish"]').click();assert((await data()).learning.stories['cat-rat'].done);await expect(page.locator('[data-action="stages-story-mode"]')).toBeVisible();await page.locator('[data-action="stages-story-mode"]').click();
 for(const [i,b]of stories.find(s=>s.id==='cat-rat').blanks.entries()){
  await expect(page.locator('.story-answer-choices button')).toHaveCount(3);await fit();await page.locator('[data-action="stages-story-answer"][data-word="'+b.choices.find(w=>w!==b.word)+'"]').click();await expect(page.locator('.story-feedback')).toContainText('Good try');await page.locator('[data-action="stages-story-answer"][data-word="'+b.word+'"]').click();await expect(page.locator('.paragraph-blank.filled')).toHaveCount(i+1);
  if(i===0){await page.reload();await enter('cat-rat');assert.equal(await phase(),'blanks');await expect(page.locator('.paragraph-blank.filled')).toHaveCount(1);await page.locator('[data-action="stages-story-blank-next"]').click();}
 }
 await expect(page.locator('.story-paragraph')).toHaveText(stories.find(s=>s.id==='cat-rat').sentences.join(' '));await page.locator('[data-action="stages-story-finish"]').click();await fit();
 // All existing stories use the same short flow and preserve their paragraphs and answers.
 for(const s of stories.filter(s=>s.id!=='cat-rat')){
  await enter(s.id);if(await phase()==='helper')await page.locator('[data-action="stages-story-skip"]').click();
  for(const sentence of s.sentences){if(await phase()==='helper')await page.locator('[data-action="stages-story-skip"]').click();await expect(page.locator('.story-sentence')).toHaveText(sentence);await expect(page.locator('.sentence-scene')).toHaveCount(1);await page.locator('[data-action="stages-story-next"]').click();}
  await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));await page.locator('[data-action="stages-story-finish"]').click();await page.locator('[data-action="stages-story-mode"]').click();
  for(const [i,b]of s.blanks.entries()){await page.locator('[data-action="stages-story-answer"][data-word="'+b.word+'"]').click();if(i+1<s.blanks.length)await page.locator('[data-action="stages-story-blank-next"]').click();}
  await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));
 }
 const saved=await data();assert.deepEqual(saved.completed,original.completed);assert.deepEqual(saved.inProgress,original.inProgress);assert.deepEqual(saved.pictureFamilies,original.pictureFamilies);
 // The requested lesson fits compact phones, while enlarged text remains scrollable.
 for(const [width,height]of [[390,844],[320,640],[320,568]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('little-english-v1'));p.learning.storyWordsMet=[];p.learning.stories['cat-rat']={phase:'sentence',line:0,answers:[],done:false};localStorage.setItem('little-english-v1',JSON.stringify(p));});await page.reload();await enter('cat-rat');await fit();await page.screenshot({path:'qa/story-flow-helper-'+width+'x'+height+'.png',fullPage:true});
  await page.locator('[data-action="stages-story-skip"]').click();assert(await page.evaluate(()=>window.nativeClips.every(a=>a.paused)));for(let i=0;i<4;i++){await fit();if(i===1)await page.screenshot({path:'qa/story-flow-sentence-'+width+'x'+height+'.png',fullPage:true});await page.locator('[data-action="stages-story-next"]').click();}await fit();await page.locator('[data-action="stages-story-finish"]').click();await page.locator('[data-action="stages-story-mode"]').click();await fit();await page.screenshot({path:'qa/story-flow-blanks-'+width+'x'+height+'.png',fullPage:true});
 }
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).fontSize),'32px');assert(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.story-controls button').first().scrollIntoViewIfNeeded();await expect(page.locator('.story-controls button').first()).toBeVisible();
 const clips=[...new Set([...storyWords.keys()].map(key=>stageSpeech['story-meaning:'+key]))];for(const file of clips){const bytes=(await readFile('dist'+file)).toString('base64');assert(await page.evaluate(async encoded=>{const ctx=new AudioContext();try{const b=await ctx.decodeAudioData(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer);return b.duration>.1&&b.getChannelData(0).some(n=>Math.abs(n)>.01);}finally{await ctx.close();}},bytes));}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={passed:true,stories:24,sentenceScenes:stories.reduce((sum,s)=>sum+s.sentences.length,0),meaningClipsDecoded:clips.length,checks:['story text and existing audio preserved','one unfamiliar word at its first use, with English then Bengali audio','too means also','Replay and Skip to story work','one sentence and matching scene, with optional audio and Previous/Next','sentence position survives browser close','full paragraph precedes blanks','completion records practice only','one blank question at a time and answers survive reload','all existing stories and blanks work','other stage progress preserved','390x844, 320x640 and 320x568 controls fit','200% text can scroll without clipping','no script errors or external runtime requests']};await writeFile('qa/story-flow-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{if(context)await context.close();}
