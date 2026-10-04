import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {recordedSpeech} from '../dist/recorded-speech.js';
import {familySpeech} from '../dist/family-speech.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {audioTimings} from '../dist/audio-timings.js';
import {valuesStories} from '../dist/values-stories.js';
import {items} from '../dist/practice-data.js';
import {stageClip} from '../dist/stage-audio.js';
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{const Native=Audio;window.clips=[];window.Audio=function(...args){const a=new Native(...args);window.clips.push(a);return a;};});
const clips=[...new Set([...Object.values(recordedSpeech),...Object.values(familySpeech),...Object.values(stageSpeech)])],report={decoded:0,timings:0,playback:[]};
try{
 await page.goto('http://localhost:4174');
 for(const clip of clips){assert(/^\/audio\/[a-f0-9]{24}\.(mp3|wav)$/.test(clip));const bytes=await readFile('dist'+clip);const result=await page.evaluate(async base64=>{const ctx=new AudioContext();try{const b=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);return{duration:b.duration,audible:b.getChannelData(0).some(v=>Math.abs(v)>.001)};}finally{await ctx.close();}},bytes.toString('base64'));assert(result.duration>0&&result.audible,clip);report.decoded++;const cues=audioTimings[clip];if(cues){for(const cue of cues.words){assert(cue.end>=cue.start&&cue.end<=result.duration+.15);assert(cue.from>=0&&cue.to<=cues.text.length);}report.timings++;}}
 for(const q of Object.values(items).filter(q=>q.kind==='word'))assert(stageClip('word:'+q.answer)||stageClip('legacy:'+q.answer)||valuesStories.flatMap(s=>s.vocabulary).some(v=>v.word.toLowerCase()===q.answer&&stageClip('value-word:'+v.word)),q.answer);
 for(const speed of [1,.85]){
  await page.evaluate(speed=>localStorage.setItem('little-english-v1',JSON.stringify({audioSpeed:speed})),speed);await page.reload();await page.locator('[data-action=stage][data-stage=words]').click();await page.locator('[data-action=stages-build-open]').click();await page.locator('[data-action=stages-families]').click();await page.locator('[data-action=family-open][data-family=at]').click();
  // Existing family's English and Bangla meanings/pronunciation use their original keys.
  for(const kind of ['word','meaning','approx']){const control=page.locator('[data-action=family-audio][data-word=cat][data-kind="'+kind+'"]').first();await control.click();await page.waitForFunction(()=>window.clips.at(-1)?.currentTime>0);const clip=await page.evaluate(()=>new URL(window.clips.at(-1).src).pathname);assert.equal(clip,familySpeech[(kind==='word'?'word':kind==='meaning'?'meaning':'approx')+':cat']);assert.equal(await page.evaluate(()=>window.clips.at(-1).playbackRate),speed);await page.locator('[data-action=audio-pause]').click();const t=await page.evaluate(()=>window.clips.at(-1).currentTime);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.clips.at(-1).currentTime),t);await page.locator('[data-action=audio-pause]').click();report.playback.push({kind,speed,correctClip:true,pauseResume:true});}
  await page.locator('[data-action=home]').first().click();assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));assert.equal(await page.locator('[data-speech-active]').count(),0);
 }
 assert.deepEqual(errors,[]);report.passed=true;report.limitations=['Decoding and playback cannot establish human-perceived clarity or accent accuracy','A parent should listen to English names, isolated phonics (especially vowels, Q and X), brisk/slower spelling, all Bangla meanings/pronunciation helpers and Bengali story explanations','Arabic refuge audio is preserved and provenance/hash checked by values-audio; human Arabic pronunciation review remains needed','No recordings were replaced or generated in this change'];await writeFile('qa/audio-catalog-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
