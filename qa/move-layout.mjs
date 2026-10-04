import {chromium} from '@playwright/test';
import {allMoveLessons,moveLessons,moveTasks} from '../dist/move-data.js';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();
const complete=Object.fromEntries(moveLessons.map(l=>[l.id,{done:true,phase:'finish',results:Object.fromEntries(moveTasks(l).map((_,i)=>[i+':0',{correct:true}]))}]));
const states=[],outside=[];
try{
 await page.goto('http://localhost:4174');
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1366,height:900}]){
  await page.setViewportSize(viewport);
  for(const l of allMoveLessons)for(const [i,group]of l.tasks.entries())for(const [j,t]of (group.steps||[group]).entries()){
   const record={phase:'task',task:i,substep:j};await page.evaluate(({id,record,complete})=>localStorage.setItem('little-english-v1',JSON.stringify({lastActivity:{kind:'stage',page:'move-lesson',id},learning:{move:{...complete,[id]:record},moveCurrent:id}})),{id:l.id,record,complete});await page.reload();await page.locator('[data-action=continue-home]').click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow '+t.text);
   const controls=await page.locator('.move-controls button,.move-options button').evaluateAll(nodes=>nodes.filter(n=>!n.closest('details:not([open])')).map(n=>({text:n.textContent,rect:n.getBoundingClientRect().toJSON()})).filter(n=>n.rect.height>0));
   const bottom=Math.max(...controls.map(c=>c.rect.bottom));const entry={viewport,lesson:l.id,text:t.text,bottom};states.push(entry);if(bottom>viewport.height)outside.push(entry);
   for(const c of controls)assert(c.rect.height>=44,'tap target: '+c.text);
  }
 }
 await writeFile('qa/move-layout-report.json',JSON.stringify({passed:outside.length===0,states,outside},null,2)+'\n');console.log(JSON.stringify({states:states.length,outside}));assert.equal(outside.length,0,'main controls should fit');
}finally{await browser.close();}
