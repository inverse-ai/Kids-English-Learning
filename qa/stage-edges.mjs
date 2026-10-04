import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
let context;
const directory=await mkdtemp(join(tmpdir(),'kids-stage-resume-'));
let page;
async function open(){context=await chromium.launchPersistentContext(directory,{channel:'msedge',headless:true});page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4174/');}
async function legacy(stage,index){
 await page.locator('[data-action="stage"][data-stage="'+stage+'"]').click();
 await page.locator('.stage-practice').last().locator('summary').click();
 await page.locator('[data-action="stages-legacy"][data-index="'+index+'"]').click();
}
async function reopen(){await context.close();await open();}
try{
 await open();await legacy('letters',0);
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Next →',exact:true}).click();
 await page.getByRole('button',{name:'Lowercase s',exact:true}).click();await page.getByRole('button',{name:'Next →',exact:true}).click();
 await page.getByRole('button',{name:/Lowercase (?!a$)/}).first().click();
 await reopen();await legacy('letters',0);await expect(page.getByRole('heading',{name:'Find the little A.',exact:true})).toBeVisible();await expect(page.locator('#feedback')).toContainText('Good try');
 for(const c of ['a','t']){await page.getByRole('button',{name:'Lowercase '+c,exact:true}).click();await page.getByRole('button',{name:'Next →',exact:true}).click();}
 const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();await page.mouse.move(box.x+90,box.y+90,{steps:8});await page.mouse.up();
 await reopen();await legacy('letters',0);assert(await page.locator('canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(n=>n>0)));
 await page.getByRole('button',{name:'Clear drawing',exact:true}).click();await reopen();await legacy('letters',0);assert(!(await page.locator('canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(n=>n>0))));
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'We practised →',exact:true}).click();await page.getByRole('button',{name:'We tried it! Finish ★',exact:true}).click();
 await legacy('words',0);for(let i=0;i<3;i++)await page.getByRole('button',{name:'Let’s try →',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Can you build the word?',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Letter c',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Letter a',exact:true}).click();
 const order=await page.locator('.tile').allTextContents();await reopen();await legacy('words',0);await expect(page.locator('.slots')).toHaveAttribute('aria-label','Your word: ca');assert.deepEqual(await page.locator('.tile').allTextContents(),order);
 await page.getByRole('button',{name:'Letter t',exact:true}).click();await expect(page.getByRole('button',{name:'Next →',exact:true})).toBeFocused();
 await page.locator('[data-action="stage"][data-stage="words"]').click();await page.locator('.word-path [data-action="stages-word-open"][data-id="first-hen"]').click();await page.locator('[data-action="stages-word-next"]').click();
 await reopen();await page.locator('[data-action="stage"][data-stage="words"]').click();await page.getByRole('button',{name:'Continue hen →',exact:true}).click();await expect(page.getByRole('heading',{name:'A few words to help you read.',exact:true})).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));assert(saved.completed.little.includes('letters-sat'));assert(!saved.inProgress.little['letters-sat']);assert(saved.inProgress.big['words-1']);
 await context.close();context=null;
 const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Unavailable');}});});await unavailable.route('**/audio/*.mp3',route=>route.abort());
 const fallback=await unavailable.newPage();fallback.on('pageerror',e=>errors.push(e.message));await fallback.goto('http://localhost:4174/');
 await fallback.locator('[data-action="stages-letter-start"]').first().click();await expect(fallback.locator('#audio-status')).toContainText('Audio could not play');await expect(fallback.locator('[data-action="stages-pause"]')).toBeDisabled();
 await fallback.locator('[data-action="stage"][data-stage="words"]').click();await fallback.locator('.word-path [data-action="stages-word-open"]').first().click();await expect(fallback.locator('#save-status')).toHaveText('Progress not saved');await expect(fallback.locator('#save-notice')).toBeVisible();
 for(let i=0;i<3;i++)await fallback.locator('[data-action="stages-word-next"]').click();await fallback.locator('[data-action="stages-word-answer"][data-word="cat"]').click();await expect(fallback.locator('.completed-sentence')).toHaveText('I see a cat.');await fallback.locator('[data-action="stages-word-finish"]').click();await expect(fallback.locator('#audio-status')).toContainText('could not be saved');
 await fallback.locator('[data-action="stage"][data-stage="stories"]').click();await fallback.locator('.story-grid [data-action="stages-story-open"]').first().click();await expect(fallback.locator('#save-status')).toHaveText('Progress not saved');await expect(fallback.locator('.story-paragraph')).toBeVisible();await unavailable.close();
 const audio=await browser.newContext();await audio.addInitScript(()=>{const Native=Audio;window.clips=[];window.Audio=function(...args){const a=new Native(...args);a.playbackRate=8;Object.defineProperty(a,'playbackRate',{get:()=>8,set:()=>{}});window.clips.push(a);return a;};});
 const paused=await audio.newPage();await paused.goto('http://localhost:4174/');await paused.locator('[data-action="stages-letter-start"]').first().click();await paused.waitForFunction(()=>window.clips.length===1&&window.clips[0].ended);
 await paused.locator('[data-action="stages-pause"]').click();await paused.waitForTimeout(400);assert.equal(await paused.evaluate(()=>window.clips.length),1);await paused.locator('[data-action="stages-pause"]').click();await expect(paused.locator('#letter-phase')).toHaveText('Ready to replay');assert.equal(await paused.evaluate(()=>window.clips.length),6);await audio.close();
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,checks:['legacy matching answers survive browser close','legacy writing strokes and clearing survive browser close','completed letter lesson clears only its own checkpoint','hidden word-building answers and keyboard controls remain','new unfinished word has a Continue path','storage and audio failures remain usable and reported','pause/resume between clips retains the sequence']}));
}finally{if(context)await context.close();await browser.close();}
