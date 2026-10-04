import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {hydrateProfiles,syncProfile,selectProfile} from '../dist/progress-store.js';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),page=await context.newPage();
const report={layouts:[],checks:[]},errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;window.playCalls=0;HTMLMediaElement.prototype.play=function(...args){window.playCalls++;return play.apply(this,args);};});
const action=a=>page.locator('[data-action="'+a+'"]');
async function layout(width,enlarged){
 await page.setViewportSize({width,height:width<720?844:1000});await page.reload();
 if(enlarged)await page.evaluate(()=>document.documentElement.style.setProperty('font-size','32px','important'));
 await expect(page.locator('.home-stage')).toHaveCount(4);
 const result=await page.evaluate(()=>{
  const clipped=[...document.querySelectorAll('.is-home button,.is-home h1,.is-home h2,.is-home p,.home-stage-copy,.home-stage-art,.welcome-art')].filter(e=>{const b=e.getBoundingClientRect();return b.left<-.5||b.right>innerWidth+.5;}).map(e=>e.className.baseVal||e.className);
  const buttons=[...document.querySelectorAll('.is-home button')].map(e=>({text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
  const art=[...document.querySelectorAll('.app-home svg')].map(e=>{const b=e.getBBox(),v=e.viewBox.baseVal;return{inside:b.x>=v.x&&b.y>=v.y&&b.x+b.width<=v.x+v.width&&b.y+b.height<=v.y+v.height,fit:e.getBoundingClientRect().width<=e.parentElement.getBoundingClientRect().width+1};});
  const text=[...document.querySelectorAll('.is-home p,.is-home small,.is-home em,.home-hello,.active-profile')].map(e=>parseFloat(getComputedStyle(e).fontSize));
  return{width:innerWidth,scroll:document.documentElement.scrollWidth,clipped,buttons,art,minText:Math.min(...text),plays:window.playCalls,colors:[...document.querySelectorAll('.home-stage')].map(e=>getComputedStyle(e).backgroundColor)};
 });
 assert.equal(result.scroll,width);assert.deepEqual(result.clipped,[]);assert(result.buttons.every(b=>b.width>=55.5&&b.height>=55.5));assert(result.art.every(a=>a.inside&&a.fit));assert.equal(result.art.length,5);assert.equal(new Set(result.colors).size,4);assert.equal(result.plays,0);if(width<720)assert(result.minText>=16);
 report.layouts.push({width,enlarged,...result});if(!enlarged&&[390,1366].includes(width))await page.screenshot({path:'qa/home-refresh-'+width+'.png',fullPage:true});
}
try{
 await page.goto('http://localhost:4174');await action('start-home').click();await expect(page.locator('h1')).toContainText('Aa');await action('home').first().click();await expect(action('continue-home')).toContainText('Letters · Aa');
 for(const width of [320,390,768,1366])for(const enlarged of [false,true])await layout(width,enlarged);
 report.checks.push('Four distinct palettes, five fully contained vector illustrations, 56px buttons, no horizontal overflow at 320/390/768/1366px and 200% text','New-learner Start opens Aa; returning Home preserves position without audio');
 // Keep resume destinations and both profile records intact.
 const p=hydrateProfiles(null);p.learning.letter=1;p.lastActivity={kind:'stage',page:'letter',index:1};syncProfile(p,'little');selectProfile(p,'big');p.lastActivity={kind:'stage',page:'story',id:'pig-pen'};p.learning.stories['pig-pen']={phase:'blanks',line:1,blank:0,answers:['sit'],done:false};syncProfile(p,'big');selectProfile(p,'little');
 await page.evaluate(p=>localStorage.setItem('little-english-v1',JSON.stringify(p)),p);await page.reload();await expect(action('continue-home')).toContainText('Bb');await action('continue-home').click();await expect(page.locator('h1')).toContainText('Bb');await action('home').first().click();
 await action('parents').click();await action('profile').filter({hasText:'Word Adventurer'}).click();await action('home').first().click();await expect(action('continue-home')).toContainText('The pig pen');await action('continue-home').click();await expect(page.locator('.story-player')).toHaveAttribute('data-phase','blanks');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')).learning.stories['pig-pen'].answers[0]),'sit');await action('home').first().click();
 report.checks.push('Little profile Bb and big profile unfinished pig-pen blank resume independently');
 for(const stage of ['letters','words','stories','move']){await page.locator('.home-stage[data-stage="'+stage+'"]').click();await expect(page.locator('.app-home')).toHaveCount(0);await action('home').first().click();await expect(page.locator('.app-home')).toBeVisible();}
 report.checks.push('All four section cards retain their existing destinations');
 // Compare a lesson against the pre-refresh stylesheet, not just Home.
 await page.setViewportSize({width:390,height:844});await page.locator('.home-stage[data-stage=letters]').click();
 const metrics=()=>page.evaluate(()=>['.topbar','.stage-nav','.letter-player','h1','.letter-paging'].map(s=>{const e=document.querySelector(s);if(!e)return null;const c=getComputedStyle(e),b=e.getBoundingClientRect();return{s,color:c.color,background:c.backgroundColor,font:c.fontSize,width:b.width,height:b.height};}));
 const current=await metrics(),oldCss=execFileSync('git',['show','HEAD:dist/style.css'],{encoding:'utf8'});await page.route('**/style.css',route=>route.fulfill({contentType:'text/css',body:oldCss}));await page.reload();await action('continue-home').click();assert.deepEqual(await metrics(),current);report.checks.push('Letter lesson layout, typography and colors match the pre-refresh stylesheet');
 assert.deepEqual(errors,[]);report.passed=true;await writeFile('qa/home-design-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,layouts:report.layouts.length,checks:report.checks}));
}finally{await browser.close();}
