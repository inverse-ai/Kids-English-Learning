import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pictureFamilies,familyWords,familyRounds,familyStages,normalizeFamilyProgress} from '../dist/family-data.js';
import {familySpeech} from '../dist/family-speech.js';
import {profiles,normalizeProgress} from '../dist/curriculum.js';
const URL='http://localhost:4174/';
assert.equal(pictureFamilies.length,10);assert.equal(Object.keys(familyWords).length,47);assert.equal(familyRounds.flatMap(r=>r.items).length,47);
assert.equal(Object.keys(familySpeech).length,162);
for(const [word,entry] of Object.entries(familyWords)){
 assert.equal(word.length,3);assert(word.endsWith(entry.family));
 assert(entry.approx&&entry.meaning);assert(entry.meaningText.includes(entry.meaning));assert(entry.approxText.includes(entry.approx));
 for(const key of ['word:','meaning:','approx:'])assert(familySpeech[key+word]);
 for(const c of word)assert(familySpeech['sound:'+c]);
}
for(const path of new Set(Object.values(familySpeech))){assert(/^\/audio\/[a-f0-9]{24}\.mp3$/.test(path));assert((await stat('dist'+path)).size>500);}
const invalid=normalizeFamilyProgress({completed:['picture-at-1','bad','picture-at-1'],inProgress:{'picture-at-1':{step:1,tiles:['c','a','t'],placed:[0,0]},'bad':{step:2}},selected:{at:'<script>'},current:'bad'});
assert.deepEqual(invalid.completed,['picture-at-1']);assert.deepEqual(invalid.inProgress['picture-at-1'].placed,[]);assert.equal(invalid.current,null);assert.deepEqual(invalid.selected,{});
assert.equal(Object.keys(normalizeFamilyProgress({inProgress:{'picture-at-1':{step:99}}}).inProgress).length,0);
const seed={profile:'big',completed:{little:['letters-sat'],big:profiles.big.lessons.map(l=>l.id)},audioSpeed:1,audioMode:'recorded',inProgress:{little:{'letters-pin':{lessonId:'letters-pin',step:1}},big:{'words-2':{lessonId:'words-2',step:3,tiles:['p','a','n'],placed:[0]}}},currentLesson:{little:'letters-pin',big:'words-2'}};
const expectedOld=normalizeProgress(seed);
const profileDir=await mkdtemp(join(tmpdir(),'little-english-picture-'));
let context,page;const errors=[],external=[],csp=[];
async function open(){
 context=await chromium.launchPersistentContext(profileDir,{channel:'msedge',headless:true,viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{
  const NativeAudio=window.Audio;window.familyAudio=[];
  window.Audio=function(...args){const audio=new NativeAudio(...args);window.familyAudio.push(audio);return audio;};
 });
 page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')csp.push(m.text());});
 page.on('request',r=>{if(!r.url().startsWith(URL)&&!r.url().startsWith('data:'))external.push(r.url());});
 await page.goto(URL);
}
async function reopen(){await context.close();await open();}
async function fit(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');}
async function finishedAudio(){await page.waitForFunction(()=>window.familyAudio.at(-1)?.ended);}
async function beginFamily(id){await page.locator('[data-action="family-open"][data-family="'+id+'"]').click();}
try{
 await open();await page.evaluate(value=>localStorage.setItem('little-english-v1',JSON.stringify(value)),seed);await page.reload();
 await expect(page.getByText('18 of 18 lessons explored',{exact:true})).toBeVisible();
 await page.locator('[data-action="family-library"]').click();await expect(page.locator('.family-card')).toHaveCount(10);
 await page.screenshot({path:'qa/picture-library.png',fullPage:true});
 // Every generated and supplied picture is loaded, with no runtime internet dependency.
 for(const family of pictureFamilies){
  const response=await context.request.get(URL.slice(0,-1)+(family.poster||family.sheet));assert.equal(response.status(),200);
  await beginFamily(family.id);
  await expect(page.locator('.family-pick')).toHaveCount(family.words.length);
  for(const word of family.words){
   await page.locator('[data-action="family-word"][data-word="'+word+'"]').click();
   await expect(page.locator('.family-spotlight .family-word')).toHaveText(word);
   await expect(page.locator('.bangla-helper p')).toContainText(familyWords[word].approx);
   await expect(page.locator('.bangla-helper p')).toContainText(familyWords[word].meaning);
   const image=await page.locator('.family-spotlight .family-picture').evaluate(async element=>{
    const url=getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
    return await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve({ok:true,width:img.width,height:img.height});img.onerror=()=>resolve({ok:false});img.src=url;});
   });assert(image.ok&&image.width>=1024);
  }
  await page.locator('[data-action="family-word"]').first().click();
  if(['at','en','og'].includes(family.id))await page.screenshot({path:'qa/picture-'+family.id+'-desktop.png',fullPage:true});
  await fit();await page.locator('[data-action="family-library"]').click();
 }
 await beginFamily('at');await page.locator('[data-action="family-word"][data-word="cat"]').click();
 // Real English, meaning and approximation playback must use their own local files.
 for(const kind of ['word','meaning','approx']){
  await page.locator('[data-action="family-audio"][data-kind="'+kind+'"]').click();
  await page.waitForFunction(()=>window.familyAudio.at(-1)?.currentTime>0&&!window.familyAudio.at(-1).paused);
  assert.equal(await page.evaluate(()=>new URL(window.familyAudio.at(-1).currentSrc).pathname),familySpeech[kind+':cat']);
  await finishedAudio();
 }
 await page.evaluate(()=>{window.familyAudio=[];});
 await page.locator('[data-action="family-audio"][data-kind="blend"]').click();
 await page.waitForFunction(()=>window.familyAudio.length===4&&window.familyAudio.at(-1).ended);
 assert.deepEqual(await page.evaluate(()=>window.familyAudio.map(a=>new URL(a.src).pathname)),['sound:c','sound:a','sound:t','word:cat'].map(key=>familySpeech[key]));
 assert.equal(await page.locator('.blend-sound.playing').count(),0);
 await page.getByLabel('Listening speed').selectOption('0.85');
 await page.locator('[data-action="family-audio"][data-kind="approx"]').click();
 assert.equal(await page.evaluate(()=>window.familyAudio.at(-1).playbackRate),.85);
 for(let i=0;i<3;i++)await page.locator('[data-action="family-audio"][data-kind="blend"]').click();
 await page.waitForFunction(()=>window.familyAudio.at(-1)?.currentTime>0);
 assert.equal(await page.evaluate(()=>window.familyAudio.filter(a=>!a.paused).length),1);
 await page.locator('[data-action="family-library"]').click();
 await page.waitForTimeout(300);assert(await page.evaluate(()=>window.familyAudio.every(a=>a.paused)));
 await beginFamily('at');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:900});await fit();
  await page.screenshot({path:'qa/picture-at-'+width+'.png',fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('[data-action="family-start"][data-round="picture-at-1"]').click();
 await expect(page.getByRole('heading',{name:'Look, listen, and say it.',exact:true})).toBeVisible();
 await page.locator('[data-action="family-next"]').click();
 await expect(page.getByRole('heading',{name:'Can you build the word?',exact:true})).toBeVisible();
 await expect(page.locator('h1')).not.toContainText('cat');
 assert.equal(await page.locator('.bangla-helper').count(),0); // answer isn't printed while building.
 for(const c of ['t','a','c'])await page.locator('.tile:not(:disabled)').filter({hasText:new RegExp('^'+c+'$')}).first().click();
 await expect(page.locator('.feedback')).toContainText('Good try');assert.equal(await page.locator('[data-action="family-next"]').count(),0);
 await page.locator('[data-action="family-undo"]').click();
 await page.getByRole('button',{name:'Letter c',exact:true}).focus();await page.keyboard.press('Enter');
 await page.getByRole('button',{name:'Letter a',exact:true}).click();
 const order=await page.locator('.tile').allTextContents();
 await reopen();await expect(page.locator('[data-action="family-resume"]')).toBeVisible();await page.locator('[data-action="family-resume"]').click();
 assert.deepEqual(await page.locator('.tile').allTextContents(),order);await expect(page.locator('.slots')).toHaveAttribute('aria-label','Your word: ca');
 await page.getByRole('button',{name:'Letter t',exact:true}).click();await expect(page.locator('[data-action="family-next"]')).toBeFocused();
 await page.locator('[data-action="family-next"]').click();
 const wrong=await page.locator('.family-choice').evaluateAll(nodes=>nodes.find(n=>n.dataset.word!=='cat').dataset.word);
 await page.locator('[data-action="family-answer"][data-word="'+wrong+'"]').click();await expect(page.locator('.feedback')).toContainText('Good try');
 await reopen();await page.locator('[data-action="family-resume"]').click();await expect(page.locator('.family-choice.retry')).toHaveCount(1);
 await page.locator('[data-action="family-answer"][data-word="cat"]').click();await page.locator('[data-action="family-next"]').click();
 await page.locator('[data-action="family-back"]').click();await page.locator('[data-action="family-library"]').click();
 // Complete every round through real UI interactions.
 for(const round of familyRounds){
  await beginFamily(round.family);
  const start=page.locator('[data-round="'+round.id+'"]');await start.click();
  const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('little-english-v1')).pictureFamilies.inProgress[id],round.id);
  const stages=familyStages(round);
  for(let i=saved.step;i<stages.length;i++){
   const stage=stages[i];
   if(stage.type==='build'){
    await page.locator('[data-action="family-undo"]').click();
    for(const c of stage.item)await page.locator('.tile:not(:disabled)').filter({hasText:new RegExp('^'+c+'$')}).first().click();
   }else if(stage.type==='match')await page.locator('[data-action="family-answer"][data-word="'+stage.item+'"]').click();
   if(round.id==='picture-at-1'&&i===1)await page.screenshot({path:'qa/picture-build.png',fullPage:true});
   await page.locator('[data-action="family-next"]').click();
  }
  await expect(page.getByRole('heading',{name:'You built little words!',exact:true})).toBeVisible();
  await page.locator('[data-action="family-library"]').click();
 }
 await page.reload();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));
 assert.deepEqual(stored.completed,expectedOld.completed);assert.deepEqual(stored.inProgress,expectedOld.inProgress);
 assert.deepEqual(stored.currentLesson,expectedOld.currentLesson);
 assert.deepEqual([...stored.pictureFamilies.completed].sort(),familyRounds.map(r=>r.id).sort());assert.deepEqual(stored.pictureFamilies.inProgress,{});
 assert.equal(stored.audioSpeed,.85);
 await page.getByRole('button',{name:/Little Explorer Age 5/}).click();await expect(page.locator('.lesson-card')).toHaveCount(9);await expect(page.locator('.family-entry')).toHaveCount(0);
 await page.getByRole('button',{name:/Word Adventurer Age 6/}).click();
 await page.locator('[data-action="family-library"]').click();await beginFamily('op');
 await page.setViewportSize({width:320,height:900});
 await page.locator('[data-action="family-start"][data-round="picture-op-1"]').click();await fit();
 await page.screenshot({path:'qa/picture-learn-mobile.png',fullPage:true});
 await page.locator('[data-action="family-next"]').click();await fit();
 for(const c of 'hop')await page.locator('.tile:not(:disabled)').filter({hasText:new RegExp('^'+c+'$')}).first().click();await page.locator('[data-action="family-next"]').click();await fit();
 await page.screenshot({path:'qa/picture-match-mobile.png',fullPage:true});
 await page.locator('[data-action="family-back"]').click();await page.locator('[data-action="family-library"]').click();
 await page.setViewportSize({width:1440,height:1000});
 // Decode every stored clip and prove it contains sound rather than a successful empty download.
 const decoded=[];
 for(const [key,path]of Object.entries(familySpeech)){
  const bytes=(await readFile('dist'+path)).toString('base64');
  const result=await page.evaluate(async encoded=>{
   const decoder=new AudioContext();try{
    const data=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));const buffer=await decoder.decodeAudioData(data.buffer);const samples=buffer.getChannelData(0);
    return {duration:buffer.duration,audible:samples.some(v=>Math.abs(v)>.01)};
   }finally{await decoder.close();}
  },bytes);
  assert(result.duration>.1&&result.duration<25,'duration: '+key);assert(result.audible,'silent: '+key);decoded.push({key,...result});
 }
 await writeFile('qa/picture-audio-checks.json',JSON.stringify(decoded,null,2));
 for(const path of ['/pictures/family-at.exe','/pictures/missing.jpeg','/tools/generate-family-audio.py','/package.json'])assert.equal((await context.request.get(URL.slice(0,-1)+path)).status(),404);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(csp,[]);
 console.log(JSON.stringify({passed:true,families:10,pictureWords:47,rounds:familyRounds.length,decodedClips:decoded.length,checks:['all words pictured with both Bengali helpers','actual English and Bengali playback','phonemes then whole word play in order','slower speed persists','no overlapping or leaked playback','wrong and correct answers','close/reopen resumes tiles and answers','all rounds finish','existing stars and both learner checkpoints preserved','320px and 390px layouts fit','all clips decode and contain sound','no runtime external requests or script errors']}));
}finally{if(context)await context.close();}
