import {chromium} from '@playwright/test';
import {valuesStories} from '../dist/values-stories.js';
import {valueScene} from '../dist/values-scenes.js';
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1500,height:1000}});
for(let start=0;start<valuesStories.length;start+=4){const group=valuesStories.slice(start,start+4);await page.setContent('<html><body style="margin:8px;font:16px Arial">'+group.map(s=>'<h2>'+s.title+'</h2><div style="display:flex">'+s.sourceLines.map((t,i)=>'<div style="width:20%;padding:6px;box-sizing:border-box">'+valueScene(s,s.sceneLines.indexOf(i))+'<p>'+t+'</p></div>').join('')+'</div>').join('')+'</body></html>');await page.screenshot({path:'qa/values-scenes-'+start+'.png',fullPage:true});}
await browser.close();
