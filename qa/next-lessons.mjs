import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {profiles,wordParts,normalizeProgress} from '../dist/curriculum.js';
assert.equal(profiles.big.lessons.length,18);
assert.equal(profiles.little.lessons.length,9);
const originalWords=[['cat','mat','sat'],['pan','fan','man'],['cap','map','tap'],['pin','tin','fin'],['sit','hit','fit'],['dog','log','fog'],['hen','pen','ten'],['bug','mug','rug'],['cup','sun','bus']];
assert.deepEqual(profiles.big.lessons.slice(0,9).map(l=>l.items),originalWords);
assert.deepEqual(profiles.big.lessons.slice(0,9).map(l=>l.id),Array.from({length:9},(_,i)=>`words-${i+1}`));
assert.deepEqual(wordParts('ship'),['sh','i','p']);assert.deepEqual(wordParts('chin'),['ch','i','n']);assert.deepEqual(wordParts('duck'),['d','u','ck']);assert.deepEqual(wordParts('stop'),['s','t','o','p']);
const old={profile:'big',completed:{little:['letters-sat'],big:profiles.big.lessons.slice(0,9).map(l=>l.id)},inProgress:{little:{'letters-pin':{lessonId:'letters-pin',step:1}},big:{}}};
assert.deepEqual(normalizeProgress(old).completed,old.completed);
const profileDir=await mkdtemp(join(tmpdir(),'little-english-next-lessons-'));
let context,page;
const errors=[];
async function open(){context=await chromium.launchPersistentContext(profileDir,{channel:'msedge',headless:true,viewport:{width:1280,height:1000}});page=context.pages()[0];page.on('pageerror',error=>errors.push(error.message));await page.goto('http://localhost:4174/');}
async function reopen(){await context.close();await open();await page.getByRole('button',{name:'Continue lesson →',exact:true}).click();}
async function fits(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const clipped=await page.locator('.slot,.tile').evaluateAll(nodes=>nodes.some(node=>{const rect=node.getBoundingClientRect();return rect.left<0||rect.right>innerWidth||node.scrollWidth>node.clientWidth+1;}));assert(!clipped);}
try{
 await open();await page.evaluate(data=>localStorage.setItem('little-english-v1',JSON.stringify(data)),old);await page.reload();
 await expect(page.getByText('9 of 18 lessons explored',{exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'More short-a words',exact:true})).toBeVisible();
 await expect(page.locator('.lesson-card')).toHaveCount(18);
 await page.screenshot({path:'qa/next-lessons-home.png',fullPage:true});
 for(const [index,lesson]of profiles.big.lessons.entries()){
  if(index<9)continue;
  await page.getByRole('button',{name:'Start lesson →',exact:true}).click();
  for(const word of lesson.items){
   await expect(page.getByRole('heading',{name:`Meet the word ${word}.`,exact:true})).toBeVisible();
   assert.deepEqual(await page.locator('.slots .slot').allTextContents(),wordParts(word));
   if(word==='ship'){
    await expect(page.locator('.sound-guide')).toContainText('The two letters make one sound');
    await page.screenshot({path:'qa/sh-sounds.png',fullPage:true});
   }
   await page.getByRole('button',{name:'Let’s try →',exact:true}).click();
  }
  for(const word of lesson.items){
   await expect(page.getByRole('heading',{name:'Can you build the word?',exact:true})).toBeVisible();
   await expect(page.locator('.slots .slot')).toHaveCount(word.length);
   await expect(page.getByRole('button',{name:'◖)) Hear the word',exact:true})).toHaveAttribute('data-text',word);
   if(word==='tent'||word==='ship'){
    for(const width of [390,320]){await page.setViewportSize({width,height:900});await fits();}
    await page.screenshot({path:`qa/${word}-mobile.png`,fullPage:true});
    await page.setViewportSize({width:1280,height:1000});
   }
   let partial='';
   for(const [i,letter]of [...word].entries()){
    await page.locator('.tile:not(:disabled)').filter({hasText:new RegExp(`^${letter}$`)}).first().click();partial+=letter;
    if(word==='tent'&&i===1){await reopen();await expect(page.locator('.slots')).toHaveAttribute('aria-label','Your word: te');}
    await expect(page.locator('.slots')).toHaveAttribute('aria-label',`Your word: ${partial}`);
    if(i<word.length-1)await expect(page.getByRole('button',{name:'Next →',exact:true})).toHaveCount(0);
   }
   if(word==='duck'){
    await reopen();await expect(page.locator('.slots')).toHaveAttribute('aria-label','Your word: duck');
    await page.screenshot({path:'qa/four-letter-complete.png',fullPage:true});
   }
   await page.getByRole('button',{name:'Next →',exact:true}).click();
  }
  for(const word of lesson.items){await page.getByRole('button',{name:word,exact:true}).click();await page.getByRole('button',{name:'Next →',exact:true}).click();}
  await expect(page.locator('.sentence')).toHaveText(lesson.sentence);
  await page.getByRole('button',{name:lesson.answer,exact:true}).click();await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.getByRole('button',{name:'We tried it! Finish ★',exact:true}).click();
  await expect(page.getByRole('heading',{name:'You did it, Word Adventurer!',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back to my path',exact:true}).click();
  await expect(page.getByText(`${index+1} of 18 lessons explored`,{exact:true})).toBeVisible();
 }
 await page.reload();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
 assert.deepEqual(saved.completed.big,profiles.big.lessons.map(l=>l.id));
 assert.deepEqual(saved.completed.little,old.completed.little);assert.equal(saved.inProgress.little['letters-pin'].step,1);
 await page.getByRole('button',{name:/Little Explorer Age 5/}).click();await expect(page.locator('.lesson-card')).toHaveCount(9);
 await page.getByRole('button',{name:'For parents',exact:true}).click();await expect(page.getByText('18 lessons introduce 54 words.',{exact:false})).toBeVisible();
 assert.deepEqual(errors,[]);
 console.log('PASS: all nine new lessons complete through the UI; old progress and younger path preserved; four-letter and repeated-letter words build and resume; sh/ch/ck group correctly; 320px and 390px layouts fit.');
}finally{if(context)await context.close();}
