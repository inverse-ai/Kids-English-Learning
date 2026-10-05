import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {playfulIds,playfulLesson} from '../dist/playful-data.js';
import {hydrateProfiles,exportProfile,validateExport,restoreProfile,selectProfile,syncProfile} from '../dist/progress-store.js';
import {normalizePractice,recordAttempt,DAY} from '../dist/practice-data.js';
const base=process.env.QA_URL||'http://localhost:4174',report={lessons:[],layouts:[],drag:[],checks:[]},errors=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
const act=(p,a)=>p.locator('[data-action="playful-'+a+'"]');
async function setup(width=390,realAudio=false){const c=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600,reducedMotion:'reduce'});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.stack));await p.addInitScript(real=>{localStorage.setItem('little-english-opening-audio-v1',JSON.stringify({version:1,enabled:false}));const seed=sessionStorage.getItem('playful-qa');if(seed){localStorage.setItem('little-english-v1',seed);sessionStorage.removeItem('playful-qa');}if(!real){window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.currentTime=0;this.duration=1;this.paused=true;}play(){this.paused=false;this.dispatchEvent(new Event('play'));setTimeout(()=>{if(!this.paused){this.currentTime=1;this.dispatchEvent(new Event('ended'));}},10);return Promise.resolve();}pause(){this.paused=true;}load(){}removeAttribute(){}};}},realAudio);await p.goto(base);await expect(p.locator('[data-action=start-home]')).toBeVisible();return{c,p};}
async function open(p,id,step=0){const data={profile:'little',learning:{playful:{current:id,wordsMet:[],lessons:{[id]:{step,completed:[],work:{},attempts:{},done:false}}}},lastActivity:{kind:'playful',id}};await p.evaluate(data=>sessionStorage.setItem('playful-qa',JSON.stringify(data)),data);await p.reload();await p.locator('[data-action=continue-home]').click();await expect(p.locator('.playful-player')).toHaveAttribute('data-playful-lesson',id);}
async function layout(p,label){const r=await p.evaluate(()=>{const visible=e=>e.getClientRects().length&&!e.closest('svg');const buttons=[...document.querySelectorAll('main button')].filter(visible),bad=buttons.filter(e=>{const b=e.getBoundingClientRect();return b.width<55.5||b.height<55.5;}).map(e=>e.textContent);const clipped=buttons.filter(e=>{const b=e.getBoundingClientRect();return b.left<-.5||b.right>innerWidth+.5;}).map(e=>e.textContent);return{width:innerWidth,scroll:document.documentElement.scrollWidth,bad,clipped,minText:Math.min(...[...document.querySelectorAll('.playful-player p,.playful-player summary')].filter(visible).map(e=>parseFloat(getComputedStyle(e).fontSize)))};});assert.equal(r.scroll,r.width,label);assert.deepEqual(r.bad,[],label);assert.deepEqual(r.clipped,[],label);if(r.width<600)assert(r.minText>=16,label);report.layouts.push({label,...r});}
async function doStep(p,st){const pick=(action,value)=>p.locator('[data-action="playful-'+action+'"][data-value="'+value+'"]');
 switch(st.type){
 case'read':case'paragraph':break;
 case'choose':case'change':await pick('choose',st.answer).click();break;
 case'predict':await act(p,'predict').first().click();break;
 case'letter-listen':for(const a of ['letter-name','letter-sound'])for(const c of ['upper','lower'])await p.locator('[data-action="playful-'+a+'"][data-case="'+c+'"]').click();break;
 case'pairs':for(const c of st.letters){await pick('pair','upper:'+c).click();await pick('pair','lower:'+c).click();}break;
 case'sound-pictures':for(const w of st.answers)await pick('sound-picture',w).click();break;
 case'trace':for(let i=0;i<2;i++){await act(p,'trace-help').click();await act(p,'trace-check').click();}break;
 case'hidden':await act(p,'hidden-listen').click();break;
 case'blend':await act(p,'blend-all').click();break;
 case'build':{const letters=await p.locator('.playful-tile').evaluateAll(els=>els.map(e=>({value:e.dataset.value,text:e.textContent})));const ordered=letters.sort((a,b)=>Number(a.value)-Number(b.value));for(let i=0;i<ordered.length;i++){await pick('tile',ordered[i].value).click();await pick('slot',i).click();}break;}
 case'order':for(const value of st.order)await pick('order',value).click();break;
 case'place':await act(p,'pick').filter({hasText:'Pick the'}).click();await act(p,'place').filter({hasText:'On the'}).click();break;
 case'count':for(let i=0;i<st.count;i++)await pick('count',i).filter({hasText:'Count'}).click();break;
 case'join':await act(p,'join').filter({hasText:'Bring'}).click();for(let i=0;i<5;i++)await pick('count',i).filter({hasText:'Count'}).click();break;
 case'away':await act(p,'away').filter({hasText:'Let one'}).click();break;
 case'share':case'chart':{if(st.object==='piece')await act(p,'cut').filter({hasText:'Cut into'}).click();const goals=st.goals||Array(st.targets).fill(st.each);let i=0;for(let target=0;target<st.targets;target++)for(let n=0;n<goals[target];n++){await pick('piece',i++).filter({hasText:/Pick|Move/}).click();await pick('target',target).filter({hasText:/Child|Basket|row/}).click();}break;}
 case'shape-match':for(const shape of st.pairs)await pick('shape',shape).click();break;
 case'align':await act(p,'align').filter({hasText:'Line up'}).click();break;
 case'pour':await act(p,'pour').click();break;
 case'collect':for(const v of st.values)await pick('collect',v).click();break;
 case'clock':await pick('clock','3').click();break;
 case'days':for(let i=0;i<4;i++)await act(p,'days').click();break;
 case'cycle':for(let i=0;i<st.values.length;i++)await act(p,'cycle').filter({hasText:/Show|Tap|Replay/}).click();break;
 case'earth':for(const v of ['night','day'])await pick('earth',v).click();break;
 case'explore':case'push-pull':case'switch':for(const v of st.values)await pick('explore',v).filter({hasText:v}).click();break;
 case'habitats':for(const v of st.targets)await pick('habitat',v).click();break;
 case'test':for(let i=0;i<st.values.length;i++){await pick('test-object',st.values[i]).click();await pick('test-predict',st.answers[i]).click();await act(p,'test').click();}break;
 case'sort':for(const o of st.objects){await pick('sort-pick',o.id).click();await pick('sort-bin',o.answer).click();}break;
 case'finish':await act(p,'finish').click();return;
 default:throw Error('Untested activity type '+st.type);
 }
 await expect(act(p,'next')).toBeEnabled();await act(p,'next').click();
}
const {c,p}=await setup();
for(const id of playfulIds().filter(id=>(!process.env.QA_KIND||id.startsWith(process.env.QA_KIND+':'))&&(!process.env.QA_ID||process.env.QA_ID===id))){
 await open(p,id);const lesson=playfulLesson(id);let visited=0;
 while(true){const index=Number(await p.locator('.playful-player').getAttribute('data-playful-step')),st=lesson.steps[index];if(visited++>lesson.steps.length+1)throw Error('No progress '+id);await layout(p,id+' '+index+' '+st.type);try{await doStep(p,st);}catch(error){console.error('FAILED',id,index,st.type,await p.locator('.playful-feedback').textContent());await p.screenshot({path:'qa/playful-failure.png',fullPage:true});throw error;}if(st.type==='finish')break;}
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('little-english-v1')));assert(saved.profileData.little.learning.playful.lessons[id].done,id);assert(!saved.profileData.big.learning.playful,id+' leaked to other profile');const exported=exportProfile(hydrateProfiles(saved),'little');validateExport(JSON.stringify(exported));report.lessons.push({id,activities:visited});console.log('Passed',id,visited);
}
// Fresh widths and enlarged text cover all interaction layouts.
for(const width of [320,360,430,768,1366]){const {c,p}=await setup(width);for(const [id,type]of [['letter:a','pairs'],['letter:b','trace'],['word:cat','build'],['math:math-cake','share'],['math:math-ribbon','align'],['science:science-rain','order'],['science:science-body','explore'],['story:values-brother-friend','paragraph']]){const step=playfulLesson(id).steps.findIndex(s=>s.type===type);await open(p,id,step);await layout(p,width+' '+type);}await c.close();}
assert.deepEqual(errors,[]);await writeFile('qa/playful-report.json',JSON.stringify(report,null,2));await c.close();await browser.close();console.log('PASS',report.lessons.length,'lessons;',report.layouts.length,'layouts');
