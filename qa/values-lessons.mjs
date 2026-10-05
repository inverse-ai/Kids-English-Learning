import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {valuesStories,valuesOrder,valueSteps,valueAudioSpecs,normalizeValuesLearning} from '../dist/values-stories.js';
import {valueScene,valueObject} from '../dist/values-scenes.js';
import {stories,alphabet,wordLessons} from '../dist/stage-data.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {audioTimings} from '../dist/audio-timings.js';
import {normalizeProgress} from '../dist/curriculum.js';
const old=await import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show','HEAD:dist/stage-data.js'],{encoding:'utf8'}).replace(/from '(\.\/[^']+)'/g,(_,path)=>"from '"+pathToFileURL(resolve('dist',path)).href+"'")).toString('base64'));
assert.deepEqual(stories,old.stories);assert.deepEqual(alphabet,old.alphabet);assert.deepEqual(wordLessons,old.wordLessons);
const oldSpeech=await import('data:text/javascript;base64,'+Buffer.from(execFileSync('git',['show','HEAD:dist/stage-speech.js'])).toString('base64'));
for(const [key,clip]of Object.entries(oldSpeech.stageSpeech))assert.equal(stageSpeech[key],clip,'old audio changed: '+key);
assert.equal(valuesStories.length,23);assert.equal(new Set(valuesStories.map(s=>s.id)).size,23);
const duplicates=valuesStories.filter(s=>stories.some(o=>o.sentences.join(' ')===s.sourceLines.join(' ')));
assert.equal(duplicates.length,0);
for(const s of valuesStories){
 assert.equal(s.sourceLines.length,5);assert.equal(s.sentences.join(' '),s.sourceLines.join(' '));
 assert(s.note&&s.question&&s.answer&&s.explanation&&s.demand);
 assert.equal(s.questions.length,2);assert.equal(s.play.length,3);
 s.sentences.forEach((_,i)=>assert(valueScene(s,i).includes('role="img"')));
 for(const v of s.vocabulary){assert(v.meaning&&v.example);if(v.kind==='object')valueObject(v.object);assert(stageSpeech['value-word:'+v.word]);}
 for(const q of s.questions){assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.equal(q.choices.filter(w=>w===q.word).length,1);assert(s.sentences[q.line].includes(q.word));assert(q.hint&&!q.hint.includes('Read around'));}
 s.play.filter(q=>q.type==='listen').forEach(q=>q.choices.forEach(valueObject));
}
for(const a of valueAudioSpecs)assert(stageSpeech[a.key],a.key);
assert(!valueAudioSpecs.some(a=>a.text.includes('A‘udhu')),'no English transliteration TTS');
assert.deepEqual(normalizeValuesLearning({valueStories:{bad:{done:true}},valueWordsMet:'bad',valueCurrent:'bad'}),{valueStories:{},valueWordsMet:[],valueCurrent:null});
const seed={completed:{little:['letters-pin'],big:['words-9']},pictureFamilies:{completed:['picture-at-2'],writing:{drafts:{cat:{drawing:[[[.1,.2],[.3,.4]]],showGuide:false}},current:'cat'},reading:{at:{started:true,step:17,completed:['helper-a'],star:false}}},learning:{stories:{'pig-pen':{phase:'blanks',line:1,blank:0,answers:['sit'],done:false}},spelling:{letter:1,position:0,done:[]}}};
const normalized=normalizeProgress(seed);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));const Native=Audio;window.clips=[];window.Audio=function(...args){const a=new Native(...args);window.clips.push(a);return a;};});
const act=a=>page.locator('[data-action="stages-value-story-'+a+'"]');
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
const next=()=>act('next').click();
const stop=()=>act('stop').first().click();
const home=()=>page.locator('[data-action=home]').first().click();
const phase=()=>page.locator('.value-player').getAttribute('data-phase');
const flows=[],durations=[];
try{
 await page.goto('http://localhost:4174');await page.evaluate(v=>localStorage.setItem('little-english-v1',JSON.stringify(v)),seed);await page.reload();
 await page.locator('[data-action=stage][data-stage=stories]').click();
 await expect(page.locator('.story-grid .story-card')).toHaveCount(47);
 assert.deepEqual(await page.locator('[data-action=stages-value-story-open]').evaluateAll(nodes=>nodes.map(n=>n.dataset.id)),valuesOrder);
 for(const s of valuesStories){
  await page.locator('.story-grid [data-id="'+s.id+'"]').click();
  await expect(page.locator('.value-player')).toHaveAttribute('data-phase','vocabulary');
  assert.equal(await page.locator('.story-parents').getAttribute('open'),null);
  assert.equal(await page.locator('.value-lesson-note').isVisible(),false,'morals parents only');
  assert.equal(await page.locator('.value-player .value-lesson-note').count(),0);
  await act('word').click();await page.waitForFunction(()=>window.clips.at(-1)?.currentTime>0);
  await act('vocab-next').click();
  await act('skip').click();
  for(let line=0;line<s.sentences.length;line++){
   assert.equal(await phase(),'sentence');await expect(page.locator('.story-sentence')).toHaveText(s.sentences[line]);
   if(line===1){await act('previous').click();await expect(page.locator('.story-sentence')).toHaveText(s.sentences[0]);await next();}
   await next();
  }
  for(const [i,q]of s.questions.entries()){
   assert.equal(await phase(),'sentence-gap');await expect(page.locator('.story-answer-choices button')).toHaveCount(3);
   const wrong=q.choices.find(w=>w!==q.word);
   await page.locator('[data-action=stages-value-story-answer][data-word="'+wrong+'"]').click();
   await expect(page.locator('.story-feedback')).toContainText(q.hint);
   await page.locator('[data-action=stages-value-story-answer][data-word="'+wrong+'"]').click();
   await expect(page.locator('.story-demonstration')).toBeVisible();
   await act('retry').click();await expect(page.locator('.story-answer-choices button')).toHaveCount(2);
   await page.locator('[data-action=stages-value-story-answer][data-word="'+q.word+'"]').click();
   await expect(page.locator('.paragraph-blank.filled')).toHaveText(q.word);assert.equal(await phase(),'sentence-gap');
   const p=(await data()).learning.valueStories[s.id];assert(p.attempts[q.id].assisted&&p.attempts[q.id].firstCorrect===false&&p.attempts[q.id].demonstrated);
   await next();
  }
  assert.equal(await phase(),'paragraph-gaps');
  for(const [i,q]of s.questions.entries()){
   await expect(page.locator('.paragraph-blank.current')).toHaveCount(1);
   await expect(page.locator('.story-answer-choices button')).toHaveCount(3);
   await page.locator('[data-action=stages-value-story-answer][data-word="'+q.word+'"]').click();
   await expect(page.locator('.paragraph-blank.filled')).toHaveCount(i+1);await next();
  }
  assert.equal(await phase(),'complete');await expect(page.locator('.story-paragraph')).toHaveText(s.sourceLines.join(' '));
  const count=await page.evaluate(()=>window.clips.length);await home();await page.reload();await page.locator('[data-action=continue-home]').click();
  assert.equal(await phase(),'complete');assert.equal(await page.evaluate(()=>window.clips.length),0,'quiet resume');
  await act('review').click();assert.equal(await phase(),'vocabulary');await act('skip').click();assert.equal(await phase(),'complete');
  await next();
  for(const q of s.play){
   assert.equal(await phase(),'play');await expect(page.locator('.story-answer-choices button')).toHaveCount(3);
   if(q.type==='recall')await expect(page.locator('.blank-prompt')).toHaveText('Which word was in the story?');
   await page.locator('[data-action=stages-value-story-answer][data-word="'+q.word+'"]').click();await next();
  }
  assert.equal(await phase(),'finish');assert.equal((await data()).learning.valueStories[s.id].star,false);
  await act('finish').click();const p=(await data()).learning.valueStories[s.id];assert(p.star&&p.done&&p.assisted);assert.equal(Object.values(p.answers).length,7);
  await page.locator('[data-action=practice-back]').click();await page.locator('[data-action=stages-story-back]').click();flows.push({id:s.id,title:s.title,sentences:s.sentences.length,vocabulary:s.vocabulary.length,assisted:true});
 }
 const final=await data();assert.deepEqual(final.completed,normalized.completed);assert.deepEqual(final.pictureFamilies,normalized.pictureFamilies);assert.deepEqual(final.learning.stories,normalized.learning.stories);assert.deepEqual(final.learning.spelling,normalized.learning.spelling);
 for(const spec of valueAudioSpecs.filter(a=>a.key.startsWith('value-note:'))){
  const clip=stageSpeech[spec.key],bytes=await readFile('dist'+clip),duration=await page.evaluate(async base64=>{const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));const ctx=new AudioContext();const b=await ctx.decodeAudioData(bytes.buffer);await ctx.close();return b.duration;},bytes.toString('base64'));
  durations.push({id:spec.key.slice(11),seconds:duration});
 }
 assert.deepEqual(errors,[]);
 const report={passed:true,totalStories:47,newStories:23,duplicates:[],difficultyOrder:valuesOrder.map(id=>({id,title:valuesStories.find(s=>s.id===id).title,patterns:valuesStories.find(s=>s.id===id).demand})),flows,explanationDurations:durations,checks:['All original stories, letters, word lessons and audio aliases unchanged','All 23 lessons navigated end to end','46 scene gaps: wrong twice, demonstration, easier retry, assisted recording, manual Next','46 paragraph gaps: one active choice set, filled words retained','69 play questions: explicit recall task, one star','All 23 complete paragraphs preserved exactly','Parent-only moral notes collapsed and optional','Home and reload continue at saved step without autoplay','Existing completion, writing, -at reading, story answers and spelling progress preserved'],limitations:['Arabic recording has no word timestamps; whole phrase highlights','Synthetic pronunciation has not had a human listening review','Headless mobile and desktop testing does not replace physical-device testing']};
 await writeFile('qa/values-lessons-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,flows:flows.length,durations}));
 // Gallery of all authored sentence scenes for visual review.
 for(let start=0;start<valuesStories.length;start+=4){const group=valuesStories.slice(start,start+4);await page.setViewportSize({width:1500,height:1000});await page.setContent('<html><body style="margin:8px;font:16px Arial">'+group.map(s=>'<h2>'+s.title+'</h2><div style="display:flex">'+s.sourceLines.map((t,i)=>'<div style="width:20%;padding:6px;box-sizing:border-box">'+valueScene(s,s.sceneLines.indexOf(i))+'<p>'+t+'</p></div>').join('')+'</div>').join('')+'</body></html>');await page.screenshot({path:'qa/values-scenes-'+start+'.png',fullPage:true});}
}finally{await browser.close();}
