import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {normalizeWordWriting,normalizeWordDrawing,familyWords} from '../dist/family-data.js';
import {normalizeProgress} from '../dist/curriculum.js';
import {familySpeech} from '../dist/family-speech.js';

const malformed=normalizeWordWriting({completed:['cat','bad','cat'],current:'bad',drafts:{cat:{drawing:[null,[[.1,.2],[2,0],[0,NaN]]],showGuide:false},bad:{drawing:[]}}});
assert.deepEqual(malformed,{completed:['cat'],current:null,drafts:{cat:{drawing:[[[.1,.2]]],showGuide:false}}});
assert.equal(normalizeWordDrawing([Array.from({length:21000},()=>[.1,.1])])[0].length,20000);
const seed={profile:'big',completed:{little:['letters-sat'],big:['words-1']},inProgress:{big:{'words-2':{lessonId:'words-2',step:3,tiles:['p','a','n'],placed:[0]}}},currentLesson:{big:'words-2'},pictureFamilies:{completed:['picture-at-2'],inProgress:{'picture-at-1':{step:1,tiles:['c','a','t'],placed:[0]}},current:'picture-at-1'}};
const old=normalizeProgress(seed),errors=[];
const profile=await mkdtemp(join(tmpdir(),'kids-word-writing-'));
let context,page;
async function open(){
 context=await chromium.launchPersistentContext(profile,{channel:'msedge',headless:true,viewport:{width:1280,height:1000}});
 await context.addInitScript(()=>{localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));const NativeAudio=window.Audio;window.clips=[];window.Audio=function(...args){const audio=new NativeAudio(...args);window.clips.push(audio);return audio;};});
 page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4174/');
}
async function openFamilies(){if(await page.locator('.app-home').count())await page.locator('.home-stage[data-stage=words]').click();if(await page.locator('[data-action=stages-build-open]').count())await page.locator('[data-action=stages-build-open]').click();await page.locator('[data-action=stages-families]').click();}
const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
async function draw(){
 await page.locator('#family-writing').scrollIntoViewIfNeeded();
 const box=await page.locator('#family-writing').boundingBox();
 await page.mouse.move(box.x+box.width*.2,box.y+box.height*.25);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.3,box.y+box.height*.7,{steps:6});await page.mouse.up();
}
const ink=()=>page.locator('#family-writing').evaluate(canvas=>{const bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;return bytes.some((n,i)=>i%4===3&&n>0);});
try{
 await open();await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),seed);await page.reload();
 await page.locator('[data-action="stage"][data-stage="words"]').click();await openFamilies();await page.locator('[data-action="family-open"][data-family="at"]').click();
 await page.locator('[data-action="family-write"][data-word="cat"]').click();
 await expect(page.getByRole('heading',{name:'Write a little word.',exact:true})).toBeVisible();
 await expect(page.locator('.word-writing-guide')).toHaveText('cat');await draw();assert(await ink());
 const drawing=(await stored()).pictureFamilies.writing.drafts.cat.drawing;
 assert(drawing[0].length>=7);
 await page.locator('[data-action="family-write-guide"]').click();await expect(page.locator('.word-writing-guide')).toBeHidden();assert(await ink());
 for(const kind of ['word','meaning','approx']){
  await page.locator('[data-action="family-audio"][data-kind="'+kind+'"]').click();
  await page.waitForFunction(()=>window.clips.at(-1)?.currentTime>0&&!window.clips.at(-1).paused);
  assert.equal(await page.evaluate(()=>new URL(window.clips.at(-1).src).pathname),familySpeech[kind+':cat']);
 }
 await page.screenshot({path:'qa/word-writing-desktop.png',fullPage:true});
 await context.close();await open();await page.locator('[data-action="stage"][data-stage="words"]').click();await openFamilies();await expect(page.locator('[data-action="family-write-resume"]')).toBeVisible();
 await page.locator('[data-action="family-write-resume"]').click();await expect(page.locator('.word-writing-guide')).toBeHidden();assert(await ink());
 assert.deepEqual((await stored()).pictureFamilies.writing.drafts.cat.drawing,drawing);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:900});await expect(page.locator('#family-writing')).toBeVisible();
  await page.waitForTimeout(100);assert(await ink());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.locator('[data-action="family-write-guide"]').click();await expect(page.locator('.word-writing-guide')).toBeVisible();assert(await ink());
 await page.screenshot({path:'qa/word-writing-mobile.png',fullPage:true});
 await page.locator('[data-action="family-write-clear"]').click();assert(!(await ink()));
 assert.deepEqual((await stored()).pictureFamilies.writing.drafts.cat.drawing,[]);
 await draw();await page.getByRole('button',{name:'For parents',exact:true}).click();
 await page.getByRole('button',{name:'← Back to learning',exact:true}).click();await openFamilies();await page.locator('[data-action="family-write-resume"]').click();assert(await ink());
 await page.locator('[data-action="family-back"]').click();await page.locator('[data-action="family-word"][data-word="hat"]').click();
 await page.locator('[data-action="family-write"][data-word="hat"]').click();await draw();
 await page.locator('[data-action="family-write-finish"]').click();
 await expect(page.getByRole('heading',{name:'You wrote a little word!',exact:true})).toBeVisible();
 let saved=await stored();assert.deepEqual(saved.pictureFamilies.writing.completed,['hat']);assert(!saved.pictureFamilies.writing.drafts.hat);assert(saved.pictureFamilies.writing.drafts.cat);
 assert.deepEqual(saved.completed,old.completed);assert.deepEqual(saved.inProgress,old.inProgress);assert.deepEqual(saved.pictureFamilies.completed,old.pictureFamilies.completed);assert.deepEqual(saved.pictureFamilies.inProgress,old.pictureFamilies.inProgress);
 await page.locator('[data-action="family-library"]').click();await page.locator('[data-action="family-write-resume"]').click();
 await expect(page.locator('.blend-row .family-word')).toHaveText('cat');assert(await ink());
 // Saving during an unfinished pointer stroke must also survive pagehide.
 await page.locator('#family-writing').scrollIntoViewIfNeeded();const box=await page.locator('#family-writing').boundingBox();await page.mouse.move(box.x+15,box.y+15);await page.mouse.down();await page.mouse.move(box.x+35,box.y+55,{steps:2});
 await page.reload();await page.mouse.up();await page.locator('[data-action="stage"][data-stage="words"]').click();await openFamilies();await page.locator('[data-action="family-write-resume"]').click();assert(await ink());
 saved=await stored();assert(saved.pictureFamilies.writing.drafts.cat.drawing.length>=2);
 await page.locator('[data-action="family-write-finish"]').click();
 // Paper practice works with keyboard buttons and no canvas input.
 await page.locator('[data-action="family-back"]').click();await page.locator('[data-action="family-word"][data-word="mat"]').click();await page.locator('[data-action="family-write"][data-word="mat"]').click();
 await page.locator('[data-action="family-write-finish"]').focus();await page.keyboard.press('Enter');
 saved=await stored();assert.deepEqual(saved.pictureFamilies.writing.completed,['hat','cat','mat']);assert.deepEqual(saved.pictureFamilies.writing.drafts,{});
 await page.locator('[data-action="family-back"]').click();await page.locator('[data-action="family-resume"][data-round="picture-at-1"]').click();
 await expect(page.getByRole('heading',{name:'Can you build the word?',exact:true})).toBeVisible();
 assert.equal(await page.locator('.word-writing-guide').count(),0);assert.equal(await page.locator('.bangla-helper').count(),0);
 await expect(page.locator('.slots')).toHaveAttribute('aria-label','Your word: c');
 assert.equal(Object.keys(familyWords).length,47);assert.deepEqual(errors,[]);
 console.log('PASS: word-writing ink survives guide toggles, 320px resizing, navigation, reload and browser close; drafts for multiple words resume separately; paper completion preserves original progress and hidden build answers; English and both Bengali clips play.');
}finally{if(context)await context.close();}
