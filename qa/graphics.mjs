import {comprehension} from '../dist/practice-data.js';
import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {alphabet,pictureSymbols,stories} from '../dist/stage-data.js';
import {familyWords} from '../dist/family-data.js';
import {letters,words} from '../dist/curriculum.js';
import {wordIllustration} from '../dist/word-art.js';
import {storyScene} from '../dist/story-scenes.js';
import {valuesStories} from '../dist/values-stories.js';
import {valueScene} from '../dist/values-scenes.js';
import {mathLessons,mathSteps} from '../dist/math-data.js';
import {mathScene} from '../dist/math-scenes.js';
import {scienceLessons,scienceSteps} from '../dist/science-data.js';
import {scienceScene} from '../dist/science-scenes.js';
import {allMoveLessons,moveTasks,isMovement} from '../dist/move-data.js';
import {movePreview} from '../dist/move-scenes.js';
const vocabulary=[...new Set([...Object.keys(pictureSymbols),...Object.keys(familyWords),...Object.keys(words),...Object.values(letters).map(x=>x.word),...alphabet.flatMap(l=>l.examples),...comprehension.flatMap(q=>q.choices.filter(w=>/^(cat|pig|hen|ball|cup|hat|bun|apple|bird|ant|truck|bike|towel|flower|pencil|box)$/.test(w)))])];
const art=vocabulary.map(word=>({label:word,svg:wordIllustration(word)}));
const scenes=[...stories.flatMap(s=>s.sentences.map((text,i)=>({label:s.title+' · '+(i+1),svg:storyScene(s,i)}))),...valuesStories.flatMap(s=>s.sentences.map((text,i)=>({label:s.title+' · '+(i+1),svg:valueScene(s,i)}))),...[...new Set(mathLessons.flatMap(l=>mathSteps(l).flatMap(s=>[s.scene,...(s.choices||[]).map(c=>c.scene)]).filter(Boolean)))].map(scene=>({label:scene,svg:mathScene(scene)})),...[...new Set(scienceLessons.flatMap(l=>scienceSteps(l).flatMap(s=>[s.scene,...(s.choices||[]).map(c=>c.scene),...(s.action?.options||[]).map(c=>c.scene)]).filter(Boolean)))].map(scene=>({label:scene,svg:scienceScene(scene)})),...allMoveLessons.map(l=>{const t=moveTasks(l)[0].steps?.[0]||moveTasks(l)[0];return{label:l.title,svg:movePreview(t,isMovement(t,l))};})];
const browser=await chromium.launch({channel:'msedge',headless:true}),report={vocabulary:vocabulary.length,scenes:scenes.length,layouts:[],checks:[]},errors=[];
// The isolated audit gallery needs its own inline stylesheet. Production keeps
// its strict CSP; lesson checks below still use the app's external stylesheet.
const context=await browser.newContext({viewport:{width:1200,height:900},serviceWorkers:'block',bypassCSP:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false})));
const action=a=>page.locator('[data-action="'+a+'"]');
try{
 await page.goto('http://localhost:4174');
 async function gallery(items,path,columns){await page.setContent('<style>body{margin:16px;background:#fffaf0;font:16px Arial;color:#314760}.gallery{display:grid;grid-template-columns:repeat('+columns+',minmax(0,1fr));gap:12px}.tile{background:white;border:1px solid #e2e8e7;border-radius:16px;padding:10px;text-align:center;min-width:0}.tile svg{display:block;width:100%;height:auto;max-height:160px;aspect-ratio:1;object-fit:contain}.tile p{margin:6px 0;font-size:14px}</style><div class="gallery">'+items.map(x=>'<div class="tile">'+x.svg+'<p>'+x.label+'</p></div>').join('')+'</div>');const invalid=await page.evaluate(()=>{const bad=[];for(const s of document.querySelectorAll('svg')){const ids=new Set([...s.querySelectorAll('[id]')].map(x=>x.id));for(const e of s.querySelectorAll('[fill]')){const match=e.getAttribute('fill').match(/^url\(#(.+)\)$/);if(match&&!ids.has(match[1]))bad.push(match[1]);}}return bad;});assert.deepEqual(invalid,[]);assert.equal(await page.locator('svg[data-art-version="2"]').count(),items.length);await page.screenshot({path,fullPage:true});}
 await gallery(art,'qa/graphics-vocabulary.png',10);
 // Separate sheets keep each illustration large enough for a real visual audit.
 for(let i=0;i<scenes.length;i+=40)await gallery(scenes.slice(i,i+40),'qa/graphics-scenes-'+(i/40)+'.png',5);
 for(const width of [320,360,390,430,768,1366]){
  await page.setViewportSize({width,height:900});await page.goto('http://localhost:4174');
  async function layout(label){const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,clipped:[...document.querySelectorAll('button,main svg')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().width>0).filter(e=>{const b=e.getBoundingClientRect();return b.left<-.5||b.right>innerWidth+.5;}).map(e=>e.getAttribute('aria-label')||e.textContent.slice(0,40))}));assert.equal(result.scroll,width,label);assert.deepEqual(result.clipped,[],label);report.layouts.push({label,...result});}
  await layout('Home '+width);if([390,1366].includes(width))await page.screenshot({path:'qa/graphics-home-'+width+'.png',fullPage:true});
  await page.locator('.home-stage[data-stage=letters]').click();await action('stages-alphabet-next').click();await layout('Aa '+width);await expect(page.locator('.letter-example .word-illustration')).toHaveCount(2);await action('home').first().click();
  await page.locator('.home-stage[data-stage=words]').click();await action('stages-spelling-open').click();await layout('Spelling '+width);await expect(page.locator('.spelling-example .word-illustration')).toHaveCount(2);if(width===390)await page.screenshot({path:'qa/graphics-spelling-390.png',fullPage:true});await action('home').first().click();
  for(const stage of ['stories','move','math','science']){await page.locator('.home-stage[data-stage='+stage+']').click();await layout(stage+' library '+width);await action('home').first().click();}
 }
 assert.deepEqual(errors,[]);report.checks.push('All alphabet, family and legacy vocabulary has drawn art; no emoji or unrelated picture fallback','Every story sentence, Math/Science scene and movement preview renders with valid, locally scoped gradients','All six sections fit at 320/360/390/430/768/1366px');report.passed=true;await writeFile('qa/graphics-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,vocabulary:report.vocabulary,scenes:report.scenes,layouts:report.layouts.length}));
}finally{await context.close();await browser.close();}
