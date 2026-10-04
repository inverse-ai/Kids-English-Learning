import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext();
 await context.addInitScript(()=>{window.speechEvents=[];const Native=window.SpeechSynthesisUtterance;window.SpeechSynthesisUtterance=function(text){const speech=new Native(text);speech.addEventListener('start',()=>window.speechEvents.push('start'));speech.addEventListener('end',()=>window.speechEvents.push('end'));speech.addEventListener('error',e=>window.speechEvents.push(e.error));return speech;};});
 const page=await context.newPage();await page.goto('http://localhost:4174');
 await page.getByRole('button',{name:'For parents',exact:true}).click();
 await page.waitForFunction(()=>speechSynthesis.getVoices().some(v=>v.localService&&v.lang.startsWith('en')));
 const systemVoice=await page.evaluate(()=>speechSynthesis.getVoices().find(v=>v.localService&&v.lang.startsWith('en')).voiceURI);
 await page.getByLabel('English listening voice').selectOption(systemVoice);
 await page.getByRole('button',{name:'Test voice',exact:true}).click();
 await page.waitForFunction(()=>window.speechEvents.includes('end'),{timeout:10000});
 await page.getByRole('button',{name:'Test voice',exact:true}).click();
 await page.getByRole('button',{name:'Test voice',exact:true}).click();
 await expect(page.locator('#audio-status')).not.toContainText('could not');
 const speechEvents=await page.evaluate(()=>window.speechEvents);
 await page.getByRole('button',{name:'← Learning path',exact:true}).click();
 await page.getByRole('button',{name:/Word Adventurer Age 6/}).click();
 for(let n=1;n<=9;n++){await page.getByRole('button',{name:new RegExp(`^Lesson ${n}:`)}).click();await expect(page.getByRole('heading',{name:/Meet the word/})).toBeVisible();await page.getByRole('button',{name:'← Learning path',exact:true}).click();}
 await page.getByRole('button',{name:/^Lesson 1:/}).click();
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Let’s try →',exact:true}).click();
 await page.getByRole('button',{name:'Letter c',exact:true}).focus();await page.keyboard.press('Enter');
 assert(await page.locator('.tile:not(:disabled)').evaluateAll(nodes=>nodes.includes(document.activeElement)));
 await page.getByRole('button',{name:'Letter a',exact:true}).click();await page.getByRole('button',{name:'Letter t',exact:true}).click();await expect(page.getByRole('button',{name:'Next →',exact:true})).toBeFocused();
 await page.getByRole('button',{name:'← Learning path',exact:true}).click();
 await page.evaluate(()=>localStorage.setItem('little-english-v1','malformed'));
 await page.reload();await expect(page.getByText('Saved progress could not be read.',{exact:false})).toBeVisible();
 await expect(page.getByRole('button',{name:'Start lesson'})).toBeVisible();
 const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage is unavailable');}});Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],addEventListener:()=>{},cancel:()=>{}}});});
 await unavailable.route('**/audio/*.mp3',route=>route.abort());
 const fallback=await unavailable.newPage();await fallback.goto('http://localhost:4174');await fallback.getByRole('button',{name:'Start lesson'}).click();await fallback.getByRole('button',{name:'◖)) Hear the name & word',exact:true}).click();await expect(fallback.locator('#audio-status')).toContainText('Audio is unavailable');await fallback.getByRole('button',{name:'Next →',exact:true}).click();
 console.log(JSON.stringify({passed:true,speechEvents,checks:['native English speech starts and finishes','repeated audio clicks do not show false errors','all nine word lessons open','word building works by keyboard','corrupt saved progress recovers visibly','no-storage and no-voice fallback remains usable']}));
}finally{await browser.close();}
