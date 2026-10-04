import {chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {alphabet} from '../dist/stage-data.js';
import {spellingNames} from '../dist/spelling-data.js';
import {stageSpeech} from '../dist/stage-speech.js';

// Reuse the established pronunciation. Only the normal spelling copies lose
// codec padding and silent tails; the slower and reading recordings stay intact.
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage(),clips={...stageSpeech},report=[];
try{
 await page.goto('about:blank');
 const keys=[...Object.keys(spellingNames).map(l=>'spelling-name:'+(l==='-'?'hyphen':l)),...[...new Set(alphabet.flatMap(a=>a.examples))].map(w=>'word:'+w)];
 for(const key of keys){
  const bytes=await readFile('dist'+stageSpeech[key]);
  const decoded=await page.evaluate(async base64=>{
   const context=new AudioContext({sampleRate:48000});
   try{
    const audio=await context.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer),samples=audio.getChannelData(0),rate=audio.sampleRate;
    // Windowed energy ignores the inaudible codec noise left in silent tails.
    const window=Math.round(rate*.01),active=[];
    for(let offset=0;offset<samples.length;offset+=window){let energy=0;const count=Math.min(window,samples.length-offset);for(let i=0;i<count;i++)energy+=samples[offset+i]**2;if(Math.sqrt(energy/count)>.002)active.push(offset);}
    if(!active.length)throw Error('Silent spelling recording');
    const start=Math.max(0,active[0]-Math.round(rate*.04)),end=Math.min(samples.length,active.at(-1)+window+Math.round(rate*.08));
    return {rate,start:start/rate,end:end/rate,original:audio.duration,samples:Array.from(samples.slice(start,end))};
   }finally{await context.close();}
  },bytes.toString('base64'));
  const data=Buffer.alloc(44+decoded.samples.length*2);
  data.write('RIFF',0);data.writeUInt32LE(data.length-8,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(decoded.rate,24);data.writeUInt32LE(decoded.rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(data.length-44,40);
  decoded.samples.forEach((sample,index)=>data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),44+index*2));
  const path='/audio/'+createHash('sha256').update(data).digest('hex').slice(0,24)+'.wav';
  await writeFile('dist'+path,data);clips['spelling-brisk-'+key]=path;
  report.push({key,path,original:decoded.original,start:decoded.start,end:decoded.end,duration:decoded.end-decoded.start});
 }
 await writeFile('dist/stage-speech.js','export const stageSpeech=Object.freeze('+JSON.stringify(clips,null,2)+');\n');
 await writeFile('qa/brisk-spelling-assets.json',JSON.stringify(report,null,2)+'\n');
 console.log('Prepared '+report.length+' normal spelling copies from unchanged spoken audio.');
}finally{await browser.close();}
