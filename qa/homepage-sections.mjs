import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {learningSections} from '../dist/section-registry.js';
const url=process.argv[2]||'http://localhost:4174',live=url.startsWith('https:'),ids=learningSections.map(s=>s.id);
const browser=await chromium.launch({channel:'msedge',headless:true}),report={url,sections:learningSections,layouts:[],destinations:[]},errors=[];
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'}),page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false})));
const action=name=>page.locator('[data-action="'+name+'"]');
async function layout(label){const value=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,clipped:[...document.querySelectorAll('button,main h1,main svg')].filter(e=>e.getClientRects().length).filter(e=>{const b=e.getBoundingClientRect();return b.left<-.5||b.right>innerWidth+.5;}).map(e=>e.textContent.trim().slice(0,45))}));assert.equal(value.scroll,value.width,label);assert.deepEqual(value.clipped,[],label);report.layouts.push({label,...value});}
function section(id){return page.locator('.home-stage[data-stage="'+id+'"]');}
async function destination(id){
 await expect(page.locator('.app-home')).toHaveCount(0);
 assert.deepEqual(await page.locator('.stage-nav [data-stage]').evaluateAll(es=>es.map(e=>e.dataset.stage)),ids);
 const target={letters:'.alphabet-reader',words:'.words-menu',stories:'.story-grid',move:'.move-library',math:'.math-library',science:'.science-library'}[id];
 if(id==='letters')await expect(page.locator('h1')).toContainText('Read the alphabet');else await expect(page.locator(target).first()).toBeVisible();
 if(id==='math'){await expect(page.locator('.math-lesson-card')).toHaveCount(12);await page.locator('[data-action=stages-math-open]').first().click();await expect(page.locator('.math-player')).toHaveAttribute('data-math-step','0');}
 if(id==='science'){await expect(page.locator('.science-lesson-card')).toHaveCount(10);await page.locator('[data-action=stages-science-open]').first().click();await expect(page.locator('.science-player')).toHaveAttribute('data-science-step','0');}
}
try{
 await page.goto(url);await page.waitForSelector('.home-stage');
 for(const width of live?[390]:[320,360,390,430,768,1366]){
  await page.setViewportSize({width,height:844});
  for(const profile of ['little','big']){
   await page.evaluate(profile=>localStorage.setItem('little-english-v1',JSON.stringify({profile,learning:{letter:20,lettersDone:['a','b'],math:{level:1}}})),profile);await page.reload();
   assert.deepEqual(await page.locator('.home-stage').evaluateAll(es=>es.map(e=>e.dataset.stage)),ids);await layout(profile+' home '+width);
   if(profile==='little'&&width===390)await page.screenshot({path:'qa/homepage-'+(live?'live':'local')+'-390.png',fullPage:true});
   for(const id of ids){await section(id).click();await destination(id);await layout(profile+' '+id+' '+width);report.destinations.push({profile,width,id,works:true});await action('home').first().click();}
   // Stage navigation reaches exactly the same six chapters.
   await section('words').click();for(const id of ids){await page.locator('.stage-nav [data-stage="'+id+'"]').click();await destination(id);}await action('home').first().click();
  }
 }
 const registry=await (await page.request.get(new URL('/section-registry.js',url).href)).text();assert(registry.includes("id:'math'"));assert(registry.includes("id:'science'"));assert.deepEqual(errors,[]);
 report.passed=true;await writeFile('qa/homepage-'+(live?'live':'local')+'-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,url,layouts:report.layouts.length,destinations:report.destinations.length,errors}));
}finally{await context.close();await browser.close();}
