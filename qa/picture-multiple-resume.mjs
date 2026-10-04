import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://localhost:4174/');
 await page.getByRole('button',{name:/Word Adventurer Age 6/}).click();
 await page.locator('[data-action="family-library"]').click();await page.locator('[data-action="family-open"][data-family="at"]').click();
 await page.locator('[data-action="family-start"][data-round="picture-at-1"]').click();await page.locator('[data-action="family-next"]').click();
 await page.getByRole('button',{name:'Letter c',exact:true}).click();
 await page.locator('[data-action="family-back"]').click();await page.locator('[data-action="family-library"]').click();
 await page.locator('[data-action="family-open"][data-family="en"]').click();await page.locator('[data-action="family-start"][data-round="picture-en-2"]').click();
 for(const c of 'den'){
  // The second en round contains only den: learn, build, find.
  if(c==='d'){await page.locator('[data-action="family-next"]').click();}
  await page.getByRole('button',{name:'Letter '+c,exact:true}).click();
 }
 await page.locator('[data-action="family-next"]').click();await page.locator('[data-action="family-answer"][data-word="den"]').click();await page.locator('[data-action="family-next"]').click();
 await page.locator('[data-action="family-library"]').click();await expect(page.locator('[data-action="family-resume"]')).toBeVisible();
 await page.reload();await page.locator('[data-action="family-resume"]').click();
 await expect(page.locator('.slots')).toHaveAttribute('aria-label','Your word: c');
 const p=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')).pictureFamilies);
 assert(p.completed.includes('picture-en-2'));assert.equal(p.current,'picture-at-1');
 await page.locator('[data-action="family-back"]').click();
 await page.locator('[data-action="family-audio"][data-kind="sound"]').first().click();
 await page.waitForFunction(()=>!document.querySelector('.blend-sound.playing')&&document.querySelector('#audio-status').textContent==='Ready to listen again.');
 console.log('PASS: completing another picture round keeps a visible resume path for earlier unfinished work; single-sound highlighting clears.');
}finally{await browser.close();}
