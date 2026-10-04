import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {stageSpeech} from '../dist/stage-speech.js';
const browser=await chromium.launch({channel:'msedge',headless:true});const results=[];
try{
 for(const speed of [1,.85]){
  const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(()=>{const Native=Audio;window.clips=[];window.Audio=function(...args){const a=new Native(...args);window.clips.push(a);return a;};});
  const page=await context.newPage();await page.goto('http://localhost:4174/');await page.evaluate(speed=>localStorage.setItem('little-english-v1',JSON.stringify({audioSpeed:speed,learning:{stories:{'pig-pen':{phase:'blanks',answers:[],done:false}}}})),speed);await page.reload();
  await page.locator('[data-action="stage"][data-stage="stories"]').click();await page.locator('.story-grid [data-id="pig-pen"]').click();await page.locator('[data-word="sit"]').click();
  await expect.poll(()=>page.evaluate(()=>window.clips.at(-1)?.paused===false)).toBe(true);assert.equal(await page.evaluate(()=>window.clips.at(-1).playbackRate),speed);await expect(page.locator('.story-gap-hint.speech-highlight')).toBeVisible();
  await page.locator('.story-listen [data-action="stages-pause"]').click();const frozen=await page.evaluate(()=>({time:window.clips.at(-1).currentTime,text:document.querySelector('[data-speech-active]')?.textContent}));await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>({time:window.clips.at(-1).currentTime,text:document.querySelector('[data-speech-active]')?.textContent})),frozen);
  await page.locator('.story-listen [data-action="stages-pause"]').click();await expect.poll(()=>page.evaluate(()=>window.clips.at(-1).currentTime)).toBeGreaterThan(frozen.time);await page.locator('[data-action="stages-story-hint"]').click();assert(await page.evaluate(()=>window.clips.slice(0,-1).every(a=>a.paused)));assert.equal(await page.evaluate(()=>new URL(window.clips.at(-1).src).pathname),stageSpeech['story-hint:Look—the pig is running.']);
  await page.locator('[data-word="hop"]').click();await expect(page.locator('.story-demonstration')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.clips.at(-1)?.paused===false)).toBe(true);assert(await page.evaluate(()=>window.clips.slice(0,-1).every(a=>a.paused)));await page.locator('[data-action="stages-story-previous"]').click();assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));assert.equal(await page.locator('[data-speech-active]').count(),0);
  results.push({speed,actualPlayback:true,pauseFreeze:true,resume:true,replay:true,noOverlap:true,navigationClears:true});await context.close();
 }
 await writeFile('qa/story-audit-audio-report.json',JSON.stringify({passed:true,results,limitation:'Audible pronunciation has not been reviewed by a human listener.'},null,2));console.log(JSON.stringify({passed:true,results}));
}finally{await browser.close();}
