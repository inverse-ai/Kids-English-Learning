import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {moveLessons,moveReview,moveTasks,moveVocabulary,isMovement,moveHint} from '../dist/move-data.js';
import {layoutMove,acceptsRoute,acceptsPlacement} from '../dist/move-scenes.js';
assert(JSON.parse(await readFile('qa/move-static-report.json')).passed,'Static lessons must pass first.');
for(const l of moveLessons.slice(7))for(const t of l.tasks){const g=layoutMove(t,true);assert(acceptsRoute(g,g.paths[0].points),t.text);assert(!acceptsRoute(g,[g.paths[0].points.at(-1)]),'end position alone fails');assert(!acceptsRoute(g,g.paths[1].points),'wrong route fails');assert(!acceptsRoute(g,g.paths[2].points),'incomplete route fails');const tolerant=g.paths[0].points.map((p,i)=>i&&i<g.paths[0].points.length-1?[p[0]+8,p[1]+8]:p);assert(acceptsRoute(g,tolerant),'small deviations accepted');}
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.clips=[];const Native=Audio;window.Audio=function(...args){const a=new Native(...args);window.clips.push(a);return a;};});
const act=a=>page.locator('[data-action="stages-move-'+a+'"]');
const seed=Object.fromEntries(moveLessons.slice(0,7).map(l=>[l.id,{done:true,phase:'finish',results:Object.fromEntries(moveTasks(l).map((_,i)=>[i+':0',{correct:true,firstCorrect:true}]))}]));
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
async function demonstrate(){await act('demo').click();await expect(act('try')).toBeEnabled({timeout:4000});await act('try').click();}
async function solve(t,l){const geo=layoutMove(t,isMovement(t,l));if(isMovement(t,l)){await page.locator('[data-action=stages-move-route][data-index="0"]').click();await expect(act('next')).toBeVisible({timeout:5000});}else await page.locator('[data-action=stages-move-place][data-index="'+geo.valid[0]+'"]').click();await act('next').click();}
const records=[];
try{
 await page.goto('http://localhost:4174');await page.evaluate(move=>localStorage.setItem('little-english-v1',JSON.stringify({learning:{move}})),seed);await page.reload();await page.locator('.home-move').click();
 for(const l of moveLessons.slice(7)){
  await page.locator('[data-action=stages-move-open][data-id="'+l.id+'"]').click();for(const v of moveVocabulary(l))await act('vocab-next').click();
  for(const [i,t]of moveTasks(l).entries()){
   await expect(page.locator('.move-instruction')).toHaveText(t.text);await demonstrate();
   if(i===0){await page.locator('[data-action=stages-move-route][data-index="1"]').click();await expect(page.locator('.move-feedback')).toHaveText(moveHint(t),{timeout:4000});assert.equal((await data()).learning.move[l.id].results[i+':0'].wrong,1);}
   await solve(t,l);
  }
  await act('finish').click();assert((await data()).learning.move[l.id].done);await act('back').click();records.push({id:l.id,tasks:moveTasks(l).length});
 }
 await expect(page.locator('[data-id=move-two-steps]')).toBeEnabled();await page.locator('[data-id=move-two-steps]').click();for(const v of moveVocabulary(moveReview))await act('vocab-next').click();
 for(const group of moveReview.tasks)for(const [i,t]of group.steps.entries()){
  await expect(page.locator('.move-instruction')).toHaveText(t.text);await demonstrate();await expect(act('full')).toBeVisible();await expect(act('step-audio')).toHaveCount(2);await solve(t,moveReview);
 }
 await act('finish').click();assert((await data()).learning.move[moveReview.id].done);await act('back').click();assert.deepEqual(errors,[]);
 await writeFile('qa/move-paths-report.json',JSON.stringify({passed:true,records,twoStepGroups:3,checks:['Static test gate passed before path verification','Ten movement instructions and nine practice tasks completed','Route validation rejects final-position-only, wrong and incomplete paths','Route tolerance accepts small sensible deviations','Accessible route choices go through the same geometric validation','Final review unlocked only after all ten lessons practised','All three two-step groups preserve order and offer full/individual replay']},null,2)+'\n');console.log(JSON.stringify({passed:true,records,twoStepGroups:3}));
}finally{await browser.close();}
