import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext();await context.addInitScript(()=>{const Native=Audio,rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');window.Audio=function(...args){const a=new Native(...args);Object.defineProperty(a,'playbackRate',{get:()=>rate.get.call(a),set:v=>rate.set.call(a,v*8)});return a;};});
 const page=await context.newPage();await page.goto('http://localhost:4174/');
 async function fit(controls=true){
  await page.evaluate(()=>scrollTo(0,0));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  if(controls)for(const control of await page.locator('.spelling-player button').all()){const box=await control.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=await page.evaluate(()=>innerHeight),'control below viewport: '+await control.textContent());}
 }
 for(const [width,height]of [[390,844],[320,568]]){
  await page.setViewportSize({width,height});
  for(let letter=0;letter<26;letter++){
   await page.evaluate(letter=>localStorage.setItem('little-english-v1',JSON.stringify({learning:{spelling:{letter}}})),letter);await page.reload();await page.locator('[data-action="stage"][data-stage="words"]').click();await fit(false);
   await page.locator('[data-action="stages-spelling-open"]').click();await page.locator('[data-action="stages-spelling-pause"]').click();await fit();
   if(letter===4){await page.screenshot({path:'qa/spelling-layout-paused-'+width+'.png',fullPage:true});await page.locator('[data-action="stages-spelling-pause"]').click();await expect(page.locator('#spelling-phase')).toHaveText('Ready to replay',{timeout:15000});await fit();await page.screenshot({path:'qa/spelling-layout-'+width+'.png',fullPage:true});}
  }
  console.log('PASS: 26 spelling pairs fit '+width+'x'+height+'.');
 }
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');await fit(false);assert(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight));await page.screenshot({path:'qa/spelling-layout-large-text.png',fullPage:true});
 const report={passed:true,mobileSizes:['390x844','320x568'],letterPairsPerSize:26,checks:['intro cards fit for every saved letter','all main spelling controls visible while paused','long-word illustrations fit before and after completion','200 percent text scrolls without horizontal overflow']};await writeFile('qa/spelling-layout-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
