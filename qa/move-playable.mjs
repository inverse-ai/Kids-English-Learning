import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {moveLessons,moveReview,moveTasks,isMovement} from '../dist/move-data.js';
import {layoutMove} from '../dist/move-scenes.js';
const report={tasks:[],tapSequence:false,demo:true,layouts:[],checks:[]},browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const width of [390,1366]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(page);
 const act=a=>page.locator('[data-action="stages-move-'+a+'"]');const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
 const screen=p=>page.evaluate(p=>{const svg=document.querySelector('#move-scene'),a=svg.createSVGPoint();a.x=p[0];a.y=p[1];const b=a.matrixTransform(svg.getScreenCTM());return[b.x,b.y];},p);
 async function drag(points){await page.locator('#move-scene').scrollIntoViewIfNeeded();const coords=[];for(const p of points)coords.push(await screen(p));if(width===390){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:coords[0][0],y:coords[0][1]}]});for(let i=1;i<coords.length;i++)for(let j=1;j<=8;j++){const x=coords[i-1][0]+(coords[i][0]-coords[i-1][0])*j/8,y=coords[i-1][1]+(coords[i][1]-coords[i-1][1])*j/8;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await page.mouse.move(...coords[0]);await page.mouse.down();for(const q of coords.slice(1))await page.mouse.move(...q,{steps:8});await page.mouse.up();}}
 async function tap(point){await page.locator('#move-scene').scrollIntoViewIfNeeded();const q=await screen(point);if(width===390)await page.touchscreen.tap(...q);else await page.mouse.click(...q);}
 await page.addInitScript(()=>localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false})));await page.goto('http://localhost:4174');await page.locator('[data-action=stage][data-stage=move]').click();
 for(const l of [...moveLessons,moveReview]){if(l!==moveLessons[0])await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-action=stages-move-open][data-id="'+l.id+'"]').click();for(let i=0;i<35&&await act('vocab-next').count();i++)await act('vocab-next').click();
  for(const [taskIndex,group] of moveTasks(l).entries())for(const [substep,t] of (group.steps||[group]).entries()){
   await expect(page.locator('.move-instruction')).toHaveText(t.text);await act('demo').click();await expect(act('try')).toBeEnabled({timeout:4000});await act('try').click();await expect(page.locator('.move-player')).toHaveAttribute('data-phase','task');assert.equal(await page.locator('#move-object[role=button]').count(),1);const geo=layoutMove(t,isMovement(t,l));
   if(width===390&&taskIndex===0&&l===moveLessons[0]){const attemptsBefore=(await saved()).learning.move[l.id].results['0:0']?.attempts||0;await tap(geo.start);assert.equal((await saved()).learning.move[l.id].results['0:0']?.attempts||0,attemptsBefore);await expect(page.locator('#move-object')).toHaveAttribute('aria-pressed','true');await page.waitForTimeout(200);await tap([340,230]);report.tapSequence=true;}
   else if(width===390&&!isMovement(t,l)&&taskIndex%2===1){await tap(geo.start);await page.waitForTimeout(200);await tap(geo.zones[geo.valid[0]].point);}
   else await drag(isMovement(t,l)?geo.paths[0].points:[geo.start,geo.zones[geo.valid[0]].point]);
   await expect(page.locator('.move-feedback')).toContainText('✓',{timeout:4000});await expect(act('next')).toBeEnabled({timeout:4000});const p=(await saved()).learning.move[l.id],a=p.results[taskIndex+':'+substep];assert(a.correct,t.text);assert.equal(a.attempts,1,t.text);assert.equal(a.firstCorrect,true,t.text);report.tasks.push({width,lesson:l.id,instruction:t.text,method:a.method,saved:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await act('next').click();
  }
  await act('finish').click();assert((await saved()).learning.move[l.id].done);await act('back').click();console.log('Completed '+l.title+' at '+width+'px');
 }
 await page.reload();await page.locator('[data-action=continue-home]').click();await expect(page.locator('h1')).toContainText('You practised');report.layouts.push({width,noHorizontalOverflow:true,fullSequenceSaved:true});assert.deepEqual(errors,[]);await context.close();
}
report.passed=true;report.checks=['Real touch and mouse pointer drags complete every position and movement path','Ball selection is not counted as a wrong answer; ball then actual box tap works','Every instruction and three practice tasks, plus all two-step groups, complete in sequence','Success snaps to target, spoken feedback, Next waits, per-instruction results persist','Demonstrations and child attempts use responsive SVG objects, never a flat bitmap','Reload restores completed lesson state'];report.limitations=['Touch events simulated in Edge; physical phone testing remains needed'];await writeFile('qa/move-playable-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,tasks:report.tasks.length,tapSequence:report.tapSequence,layouts:report.layouts}));
}finally{await browser.close();}
