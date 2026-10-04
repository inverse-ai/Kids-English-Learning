import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {audioTimings} from '../dist/audio-timings.js';
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();let decoded=0;
try{
 await page.goto('http://localhost:4174/');
 for(const [path,metadata]of Object.entries(audioTimings)){
  const bytes=await readFile('dist'+path);assert.equal('/audio/'+createHash('sha256').update(bytes).digest('hex').slice(0,24)+'.mp3',path,'timings address their actual audio bytes');
  assert.equal(metadata.source,'WordBoundary from the same audio stream');assert(metadata.voice&&metadata.rate);
  const result=await page.evaluate(async base64=>{const context=new AudioContext();try{const audio=await context.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);return {duration:audio.duration,audible:audio.getChannelData(0).some(value=>Math.abs(value)>.01)};}finally{await context.close();}},bytes.toString('base64'));
  assert(result.audible);assert(metadata.words.at(-1).end<=result.duration,'word timestamps stay inside the clip');decoded++;
 }
 const report={passed:true,timedClipsDecoded:decoded,checks:['Exact audio content hashes match timing entries','All recorded boundary cues fit the decoded duration','All timed clips contain audible samples'],unverified:'Decoding does not verify pronunciation by ear.'};
 await writeFile('qa/timing-assets-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
