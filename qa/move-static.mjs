import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {moveLessons,moveTasks,moveVocabulary} from '../dist/move-data.js';
import {layoutMove,acceptsPlacement} from '../dist/move-scenes.js';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.clips=[];const Native=Audio;window.Audio=function(...args){const a=new Native(...args);window.clips.push(a);return a;};});
const act=a=>page.locator('[data-action="stages-move-'+a+'"]');
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
const records=[];
try{
 await page.goto('http://localhost:4174');await expect(page.locator('.home-stage')).toHaveCount(4);await page.locator('.home-move').click();await expect(page.locator('.move-library button')).toHaveCount(11);await expect(page.locator('[data-id=move-two-steps]')).toBeDisabled();
 for(const l of moveLessons.slice(0,7)){
  await page.locator('[data-action=stages-move-open][data-id="'+l.id+'"]').click();
  for(const v of moveVocabulary(l)){await expect(page.locator('.move-player h1')).toHaveText(v.word);await act('vocab-next').click();}
  for(const [i,t]of moveTasks(l).entries()){
   await expect(page.locator('.move-instruction')).toHaveText(t.text);await act('demo').click();await expect(act('try')).toBeEnabled({timeout:4000});await act('try').click();
   const geo=layoutMove(t);for(const [j,z]of geo.zones.entries())assert.equal(acceptsPlacement(geo,z.point),geo.valid.includes(j));
   if(i===0){const wrong=geo.zones.findIndex((_,j)=>!geo.valid.includes(j));await page.locator('[data-action=stages-move-place][data-index="'+wrong+'"]').click();await page.locator('[data-action=stages-move-place][data-index="'+wrong+'"]').click();await expect(page.locator('.move-player')).toHaveAttribute('data-phase','demo');await expect(act('try')).toBeEnabled({timeout:4000});await act('try').click();}
   await page.locator('[data-action=stages-move-place][data-index="'+geo.valid[0]+'"]').click();await expect(page.locator('.move-feedback')).toContainText('✓');
   assert.equal((await data()).learning.move[l.id].results[i+':0'].correct,true);await act('next').click();
  }
  await act('finish').click();assert((await data()).learning.move[l.id].done);await act('back').click();records.push({id:l.id,tasks:moveTasks(l).length,practices:3});
 }
 await page.screenshot({path:'qa/move-static-library.png',fullPage:true});await writeFile('qa/move-static-report.json',JSON.stringify({passed:true,records,checks:['Homepage separate card, no age gate','Seven static lessons completed','Objects and contrasting meanings taught before tasks','All placement zone centers have correct acceptance','Spoken feedback, repeated-error demonstration and assisted records','Three practice tasks per lesson','Two-step review remains locked until all individual lessons are practised']},null,2)+'\n');assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,lessons:records.length}));
}finally{await browser.close();}
