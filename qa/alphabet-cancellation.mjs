import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {stageSpeech} from '../dist/stage-speech.js';

const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext();
 await context.addInitScript(()=>{
  const Native=Audio,rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.clips=[];window.paths=[];
  window.Audio=function(...args){const audio=new Native(...args);Object.defineProperty(audio,'playbackRate',{get:()=>rate.get.call(audio),set:v=>rate.set.call(audio,v*8)});window.clips.push(audio);window.paths.push(new URL(audio.src).pathname);return audio;};
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4174/');
 const next=()=>page.locator('.letter-paging button').last().click();
 const bSequence=['alphabet-case:b','alphabet-example:b:ball','sound:b','sound:b','sound:b','word:ball','alphabet-example:b:bat','sound:b','sound:b','sound:b','word:bat'].map(key=>stageSpeech[key]);
 for(const paused of [true,false]){
  if(paused)await page.locator('[data-action="stages-letter-start"]').first().click();
  else{await page.evaluate(()=>{window.clips=[];window.paths=[];});await page.locator('.letter-paging button').first().click();}
  await page.waitForFunction(()=>window.clips.length===6&&window.clips[5].ended,null,{polling:'raf'});
  if(paused){await page.locator('[data-action="stages-pause"]').click();await expect(page.locator('[data-action="stages-pause"]')).toHaveText('Resume');}
  await next();await expect(page.locator('[data-action="stages-pause"]')).toHaveText('Pause');await expect(page.getByRole('heading',{name:'Say hello to Bb.',exact:true})).toBeVisible();
  await expect(page.locator('#letter-phase')).toHaveText('Ready to replay',{timeout:15000});
  const paths=await page.evaluate(()=>window.paths);assert.equal(paths.length,17);assert.deepEqual(paths.slice(6),bSequence);assert(!paths.includes(stageSpeech['alphabet-example:a:ant']));
  assert(await page.evaluate(()=>window.clips.every(a=>a.paused)));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));assert.deepEqual(saved.learning.lettersDone,['b']);assert.equal(saved.learning.letter,1);
 }
 assert.deepEqual(errors,[]);
 const report={passed:true,checks:['Next during a paused example gap resets Pause and starts the new letter','Next during an active example gap cancels the old queued example','interrupted A never plays ant or receives a completion mark','B completes and remains on B after both transitions']};
 await writeFile('qa/alphabet-cancellation-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
