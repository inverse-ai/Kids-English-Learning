import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try{
 const context=await browser.newContext();
 await context.addInitScript(()=>{
  Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage unavailable');}});
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],addEventListener:()=>{},cancel:()=>{}}});
 });
 await context.route('**/audio/*.mp3',route=>route.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4174/');
 await page.getByRole('button',{name:/Word Adventurer Age 6/}).click();
 await page.locator('[data-action="family-library"]').click();await page.locator('[data-action="family-open"][data-family="at"]').click();
 await page.locator('[data-action="family-audio"][data-kind="meaning"]').click();
 await expect(page.locator('#audio-status')).toContainText('Audio could not play');
 await expect(page.locator('#save-notice')).toContainText('could not be saved');
 await page.locator('[data-action="family-start"][data-round="picture-at-1"]').click();
 await expect(page.locator('#save-status')).toHaveText('Progress not saved');
 await page.locator('[data-action="family-next"]').click();
 for(const c of 'cat')await page.getByRole('button',{name:'Letter '+c,exact:true}).click();
 await expect(page.locator('.feedback')).toContainText('You built it');
 await expect(page.locator('#save-status')).toHaveText('Progress not saved');
 assert.deepEqual(errors,[]);
 console.log('PASS: unavailable audio and blocked browser storage are reported accurately; picture-word building remains usable.');
}finally{await browser.close();}
