import {showParagraph} from './story-helpers.mjs';
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {stories} from '../dist/stage-data.js';
import {stageSpeech} from '../dist/stage-speech.js';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext();
await context.addInitScript(()=>{const Native=Audio;window.clips=[];window.Audio=function(...args){const a=new Native(...args);a.playbackRate=8;Object.defineProperty(a,'playbackRate',{get:()=>8,set:()=>{}});window.clips.push(a);return a;};});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:4174/');await page.locator('[data-action="stage"][data-stage="stories"]').click();
 for(const id of ['little-ship','rain-snail','train-trip']){
  const s=stories.find(s=>s.id===id);
  assert(!s.sentences.some(line=>/\b(sea|seat|leaf)\b/.test(line)));
  await page.locator('.story-grid [data-action="stages-story-open"][data-id="'+id+'"]').click();await expect(page.getByRole('heading',{name:s.title,exact:true})).toBeVisible();await showParagraph(page);await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));
  await page.evaluate(()=>{window.clips=[];});await page.locator('[data-action="stages-story-audio"]').click();await expect(page.locator('#audio-status')).toHaveText('Ready to listen again.',{timeout:15000});assert.deepEqual(await page.evaluate(()=>window.clips.map(a=>new URL(a.src).pathname)),s.sentences.map(line=>stageSpeech['text:'+line]));
  await page.locator('[data-action="stages-story-finish"]').click();await page.locator('[data-action="stages-story-mode"][data-mode="blanks"]').click();for(const [i,b]of s.blanks.entries()){await page.locator('[data-action="stages-story-answer"][data-blank="'+i+'"][data-word="'+b.word+'"]').click();if(i+1<s.blanks.length)await page.locator('[data-action="stages-story-blank-next"]').click();}await expect(page.locator('.story-paragraph')).toHaveText(s.sentences.join(' '));await page.locator('[data-action="stage"][data-stage="stories"]').click();
 }
 let decoded=0;
 for(const file of new Set(Object.values(stageSpeech))){
  const bytes=(await readFile('dist'+file)).toString('base64');const result=await page.evaluate(async encoded=>{const ctx=new AudioContext();try{const b=await ctx.decodeAudioData(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)).buffer);return b.duration>.1&&b.getChannelData(0).some(n=>Math.abs(n)>.01);}finally{await ctx.close();}},bytes);assert(result,file);decoded++;
 }
 assert.deepEqual(errors,[]);const report=JSON.parse(await readFile('qa/stages-report.json','utf8'));assert(report.passed);report.decodedClips=decoded;report.checks.push('final ai stories keep ea reading for the later group, with matching audio and blanks');await writeFile('qa/stages-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,recheckedStories:3,decodedClips:decoded}));
}finally{await browser.close();}
