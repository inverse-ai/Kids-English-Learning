import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {valuesStories,valueSteps,valueAudioSpecs} from '../dist/values-stories.js';
import {stageSpeech} from '../dist/stage-speech.js';
import {audioTimings} from '../dist/audio-timings.js';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{const Native=Audio;window.clips=[];window.samples=[];window.Audio=function(...args){const a=new Native(...args);window.clips.push(a);a.addEventListener('playing',sample);function sample(){if(a.paused||a.ended)return;window.samples.push({time:a.currentTime,path:new URL(a.src).pathname,active:[...document.querySelectorAll('[data-speech-active]')].map(e=>({text:e.textContent,from:e.dataset.from,arabic:e.lang==='ar'}))});requestAnimationFrame(sample);}return a;};});
const report={decoded:[],playback:[],limitations:['Arabic and Bengali explanation clips use whole-phrase highlighting; no reliable word timings','Human review of synthetic pronunciation and Arabic recitation remains unverified','Mobile/PC viewport tests run in Edge; physical devices unverified']};
const act=a=>page.locator('[data-action="stages-value-story-'+a+'"]');
async function seed(s,type,speed=1){const step=valueSteps(s).findIndex(p=>p.type===type);await page.evaluate(({s,step,speed})=>localStorage.setItem('little-english-v1',JSON.stringify({audioSpeed:speed,lastActivity:{kind:'stage',page:'value-story',id:s.id},learning:{valueCurrent:s.id,valueStories:{[s.id]:{step}}}})),{s:{id:s.id},step,speed});await page.reload();await page.locator('[data-action=continue-home]').click();}
try{
 await page.addInitScript(()=>localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false})));await page.goto('http://localhost:4174');
 for(const clip of new Set([...valueAudioSpecs.map(s=>stageSpeech[s.key]),stageSpeech['value-refuge-arabic']])){
  assert(clip);const bytes=await readFile('dist'+clip),seconds=await page.evaluate(async b64=>{const ctx=new AudioContext(),b=await ctx.decodeAudioData(Uint8Array.from(atob(b64),c=>c.charCodeAt(0)).buffer);await ctx.close();return b.duration;},bytes.toString('base64'));
  assert(seconds>0);const timing=audioTimings[clip];if(timing)for(const cue of timing.words){assert(cue.start>=0&&cue.end>=cue.start&&cue.end<=seconds+.08,clip);assert(cue.from<cue.to&&cue.to<=timing.text.length);}
  report.decoded.push({clip,seconds,words:timing?.words.length||0});
 }
 const refuge=JSON.parse(await readFile('qa/refuge-audio-source.json'));assert.equal(createHash('sha256').update(await readFile('dist'+refuge.clip)).digest('hex'),refuge.sha256);
 const s=valuesStories.find(s=>s.id==='values-brothers-truck');
 for(const speed of [1,.85]){
  await seed(s,'sentence',speed);await act('sentence-audio').click();await page.waitForFunction(()=>document.querySelector('.spoken-word.speech-highlight'));
  const native=await page.evaluate(()=>window.clips.at(-1).playbackRate);assert.equal(native,speed);
  await page.locator('[data-action=stages-pause]').click();const frozen=await page.evaluate(()=>({time:window.clips.at(-1).currentTime,marks:[...document.querySelectorAll('[data-speech-active]')].map(e=>e.textContent)}));await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>({time:window.clips.at(-1).currentTime,marks:[...document.querySelectorAll('[data-speech-active]')].map(e=>e.textContent)})),frozen);
  await page.locator('[data-action=stages-pause]').click();await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.',{timeout:20000});
  const samples=await page.evaluate(()=>window.samples);const timing=audioTimings[stageSpeech['text:'+s.sentences[0]]];for(const cue of timing.words)assert(samples.some(sample=>sample.path===stageSpeech['text:'+s.sentences[0]]&&sample.active.some(mark=>Number(mark.from)<cue.to&&Number(mark.from)>=cue.from)),s.sentences[0].slice(cue.from,cue.to));
  await act('sentence-audio').click();await page.waitForFunction(()=>window.clips.at(-1).currentTime>0);await act('next').click();assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));assert.equal(await page.locator('[data-speech-active]').count(),0);
  report.playback.push({speed,wordHighlights:true,pauseFreeze:true,resume:true,replay:true,navigationStops:true});
 }
 const ar=valuesStories.find(s=>s.id==='values-brother-friend');await seed(ar,'complete');await act('refuge').click();await page.waitForFunction(()=>document.querySelector('.refuge-phrase [lang=ar].speech-highlight'));assert.equal(await page.evaluate(()=>new URL(window.clips.at(-1).src).pathname),refuge.clip);await act('stop').first().click();assert.equal(await page.locator('[data-speech-active]').count(),0);
 await page.locator('.story-parents summary').click();await act('note').first().click();await page.waitForFunction(()=>window.clips.at(-1).currentTime>0);assert.equal(await page.evaluate(()=>window.clips.filter(a=>!a.paused&&!a.ended).length),1);assert.equal(await page.evaluate(()=>new URL(window.clips.at(-1).src).pathname),stageSpeech['value-note:'+ar.id]);await act('stop').first().click();
 await act('paragraph-audio').click();await page.waitForFunction(()=>window.clips.at(-1).currentTime>0);await page.locator('[data-action=home]').first().click();assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));assert.equal(await page.locator('[data-speech-active]').count(),0);
 assert.deepEqual(errors,[]);report.passed=true;report.arabic={hashVerified:true,nativePlayback:true,wholePhraseHighlight:true};report.nonOverlap=true;await writeFile('qa/values-audio-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,decoded:report.decoded.length,playback:report.playback,arabic:report.arabic}));
}finally{await browser.close();}
