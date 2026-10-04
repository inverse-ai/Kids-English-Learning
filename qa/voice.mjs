import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
import {recordedSpeech} from '../dist/recorded-speech.js';
const expected=JSON.parse(execFileSync('node',['tools/collect-audio.mjs'],{encoding:'utf8'}));
assert.deepEqual(Object.keys(recordedSpeech).sort(),expected);
assert.equal(expected.length,134);
for(const path of Object.values(recordedSpeech)){assert(/^\/audio\/[a-f0-9]{24}\.mp3$/.test(path));assert((await stat('dist'+path)).size>500);}
const browser=await chromium.launch({channel:'msedge',headless:true});
const instrument=()=>{
 window.testAudio=[];const NativeAudio=window.Audio;
 window.Audio=function(...args){const instance=new NativeAudio(...args);window.testAudio.push(instance);return instance;};
};
const errors=[];
const external=[];
try{
 const context=await browser.newContext();await context.addInitScript(instrument);
 await context.route('**/*',route=>{if(new URL(route.request().url()).hostname!=='localhost'){external.push(route.request().url());return route.abort();}return route.continue();});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.goto('http://localhost:4174/');
 // Decode every actual file, including short words, rather than trusting a download status.
 let decoded=0;
 for(const path of Object.values(recordedSpeech)){
  const response=await context.request.get('http://localhost:4174'+path);assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/audio\/mpeg/);
  const bytes=(await response.body()).toString('base64');
  const result=await page.evaluate(async encoded=>{const decoder=new AudioContext();try{const data=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));const buffer=await decoder.decodeAudioData(data.buffer);const samples=buffer.getChannelData(0);return{duration:buffer.duration,audible:samples.some(value=>Math.abs(value)>.01)};}finally{await decoder.close();}},bytes);
  assert(result.duration>.1&&result.duration<20);assert(result.audible);decoded++;
 }
 await page.getByRole('button',{name:'For parents',exact:true}).click();
 await expect(page.getByLabel('English listening voice')).toHaveValue('recorded');
 await page.getByRole('button',{name:'Test voice',exact:true}).click();
 await page.waitForFunction(()=>window.testAudio.some(audio=>audio.currentTime>0&&!audio.paused));
 const source=await page.evaluate(()=>window.testAudio.at(-1).currentSrc);assert(source.startsWith('http://localhost:4174/audio/'));
 await page.waitForFunction(()=>window.testAudio.at(-1).ended);
 await page.getByLabel('Listening speed').selectOption('0.85');
 await page.getByRole('button',{name:'Test voice',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.testAudio.at(-1).playbackRate),.85);
 await page.reload();await page.getByRole('button',{name:'For parents',exact:true}).click();
 await expect(page.getByLabel('Listening speed')).toHaveValue('0.85');
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Test voice',exact:true}).click();
 await page.waitForFunction(()=>window.testAudio.at(-1).currentTime>0);
 assert.equal(await page.evaluate(()=>window.testAudio.filter(audio=>!audio.paused).length),1);
 await page.getByRole('button',{name:'← Learning path',exact:true}).click();assert(await page.evaluate(()=>window.testAudio.every(audio=>audio.paused)));
 await page.getByRole('button',{name:'For parents',exact:true}).click();
 await page.screenshot({path:'qa/voice-settings.png',fullPage:true});
 const head=await context.request.head('http://localhost:4174'+Object.values(recordedSpeech)[0]);assert.equal(head.status(),200);assert(Number(head.headers()['content-length'])>500);
 for(const path of ['/audio/no-such.mp3','/audio/generate-audio.py','/package.json'])assert.equal((await context.request.get('http://localhost:4174'+path)).status(),404);
 // Recordings work even when browser speech synthesis has no installed voices.
 const offline=await browser.newContext();await offline.addInitScript(instrument);await offline.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],addEventListener:()=>{},cancel:()=>{},speak:()=>{throw new Error('System voice should not be needed');}}});});
 await offline.route('**/*',route=>new URL(route.request().url()).hostname==='localhost'?route.continue():route.abort());
 const local=await offline.newPage();local.on('pageerror',error=>errors.push(error.message));await local.goto('http://localhost:4174/');await local.getByRole('button',{name:'Start lesson'}).click();await local.getByRole('button',{name:'◖)) Hear the name & word',exact:true}).click();await local.waitForFunction(()=>window.testAudio.at(-1)?.currentTime>0);
 await expect(local.locator('#audio-status')).not.toContainText('unavailable');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log(JSON.stringify({passed:true,decodedClips:decoded,checks:['all lesson prompts have decodable non-silent recordings','default playback uses local audio','slower playback persists','repeated clicks do not overlap','leaving a lesson stops playback','no internet requests during lesson use','recordings work without installed system voices','audio route only serves named MP3 files']}));
}finally{await browser.close();}
