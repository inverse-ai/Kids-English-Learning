import {allMoveLessons} from './move-data.js';
import {valuesStories} from './values-stories.js';
import {alphabet,wordLessons,stories,patternLessons} from './stage-data.js';
import {pictureFamilies,familyRounds,familyWords} from './family-data.js';
import {profiles} from './curriculum.js';

export function validResume(r){
 if(!r||typeof r!=='object')return null;
 if(r.kind==='stage'){
  if(r.page==='letter'&&Number.isInteger(r.index)&&alphabet[r.index])return {kind:r.kind,page:r.page,index:r.index};
  if(r.page==='spelling')return {kind:r.kind,page:r.page};
  const lists={word:wordLessons,story:stories,pattern:patternLessons,'value-story':valuesStories,'move-lesson':allMoveLessons};
  if(lists[r.page]?.some(x=>x.id===r.id))return {kind:r.kind,page:r.page,id:r.id};
 }
 if(r.kind==='legacy'&&profiles[r.profile]?.lessons.some(x=>x.id===r.id))return {kind:r.kind,profile:r.profile,id:r.id};
 if(r.kind==='family'){
  if(r.page==='reading')return {kind:r.kind,page:r.page};
  if(r.page==='lesson'&&familyRounds.some(x=>x.id===r.round))return {kind:r.kind,page:r.page,round:r.round};
  if(r.page==='writing'&&familyWords[r.word])return {kind:r.kind,page:r.page,word:r.word};
  if(r.page==='board'&&pictureFamilies.some(x=>x.id===r.family))return {kind:r.kind,page:r.page,family:r.family};
 }
 return null;
}
export function priorResume(p){
 const current=p.currentLesson[p.profile];
 if(current)return validResume({kind:'legacy',profile:p.profile,id:current});
 if(p.pictureFamilies.current)return validResume({kind:'family',page:'lesson',round:p.pictureFamilies.current});
 if(p.pictureFamilies.writing.current)return validResume({kind:'family',page:'writing',word:p.pictureFamilies.writing.current});
 if(p.learning.moveCurrent)return validResume({kind:'stage',page:'move-lesson',id:p.learning.moveCurrent});
 if(p.learning.valueCurrent)return validResume({kind:'stage',page:'value-story',id:p.learning.valueCurrent});
 if(p.learning.storyCurrent)return validResume({kind:'stage',page:'story',id:p.learning.storyCurrent});
 if(p.pictureFamilies.reading.at.started)return {kind:'family',page:'reading'};
 if(p.learning.spelling.letter||p.learning.spelling.position||p.learning.spelling.done.length)return {kind:'stage',page:'spelling'};
 if(p.learning.words[p.learning.wordCurrent])return validResume({kind:'stage',page:'word',id:p.learning.wordCurrent});
 if(p.learning.letter||p.learning.lettersDone.length)return {kind:'stage',page:'letter',index:p.learning.letter};
 if(p.pictureFamilies.lastFamily)return validResume({kind:'family',page:'board',family:p.pictureFamilies.lastFamily});
 const completed=p.completed[p.profile].at(-1);if(completed)return validResume({kind:'legacy',profile:p.profile,id:completed});
 return null;
}
export function resumeName(r,p){
 if(r.kind==='legacy')return profiles[r.profile].lessons.find(x=>x.id===r.id).title;
 if(r.kind==='family')return r.page==='reading'?'The -at family · Read sentences & a story':r.page==='writing'?'Write '+r.word:r.page==='lesson'?'The -'+familyRounds.find(x=>x.id===r.round).family+' family · Round '+familyRounds.find(x=>x.id===r.round).number:'The -'+r.family+' word family';
 if(r.page==='spelling'){const a=alphabet[p.learning.spelling.letter];return 'Spell picture words · '+a.letter.toUpperCase()+a.letter;}
 if(r.page==='letter'){const a=alphabet[r.index];return 'Letters · '+a.letter.toUpperCase()+a.letter;}
 return ({word:wordLessons,story:stories,pattern:patternLessons,'value-story':valuesStories,'move-lesson':allMoveLessons})[r.page].find(x=>x.id===r.id).title||'Read '+wordLessons.find(x=>x.id===r.id)?.word;
}
const welcome='<svg viewBox="0 0 320 145" class="welcome-art" role="img" aria-label="A friendly cat and little bird reading together"><ellipse cx="160" cy="131" rx="135" ry="9" fill="#dceee5"/><circle cx="265" cy="29" r="18" fill="#ffe3a0"/><path d="m80 54-13-29 29 13m37 16 15-29-30 13" fill="#e9ae74" stroke="#765439" stroke-width="3"/><ellipse cx="109" cy="83" rx="40" ry="42" fill="#f2bd88"/><circle cx="96" cy="65" r="3" fill="#443526"/><circle cx="120" cy="65" r="3" fill="#443526"/><path d="m104 77 5 4 5-4m-5 4v5m-10 0q10 9 20 0" fill="none" stroke="#765439" stroke-width="3" stroke-linecap="round"/><path d="M82 110Q42 100 57 75" fill="none" stroke="#e9ae74" stroke-width="12" stroke-linecap="round"/><ellipse cx="223" cy="100" rx="26" ry="27" fill="#8ac6d5"/><circle cx="227" cy="81" r="19" fill="#8ac6d5"/><circle cx="233" cy="77" r="3" fill="#334455"/><path d="m244 83 14 5-15 5" fill="#edb84c"/><path d="M196 97q-18-4-15 16l19-4" fill="#69aabb"/><path d="m136 105 30-7 29 7v33l-29-6-30 6Z" fill="#fffdf3" stroke="#618779" stroke-width="3"/><path d="M166 99v33m-23-21 16-4m-16 12 16-4m14-7 15 4m-15 4 15 4" stroke="#9eb6a7" stroke-width="2"/></svg>';
export function homePage(resume,p,esc){
 const cards=[['letters','Letters','4+','Aa<span class="home-apple">🍎</span>','Meet letters & sounds'],['words','Words','5+','<span class="family-picture picture-cat"></span>','Spell, build & read'],['stories','Stories','6+','📖','Read little stories'],['move','Listen & Move','','<svg viewBox="0 0 100 80" aria-hidden="true"><path d="m49 20 22-9 23 9v43l-23 10-22-10Z" fill="#f8b55e" stroke="#45527d" stroke-width="3"/><path d="m49 20 22 10 23-10m-23 10v43" fill="none" stroke="#45527d" stroke-width="3"/><circle cx="24" cy="50" r="19" fill="#ffca36" stroke="#45527d" stroke-width="3"/><path d="M5 50h38M24 31q-15 19 0 38M24 31q15 19 0 38" stroke="#fff8da" stroke-width="3" fill="none"/></svg>','Listen and move objects']];
 return '<section class="app-home"><div class="home-welcome">'+welcome+'<h1>Little English</h1><p>Let’s learn a little, together.</p><button class="btn primary home-continue" data-action="'+(resume?'continue-home':'start-home')+'">'+(resume?'Continue <span>'+esc(resumeName(resume,p))+'</span>':'Start learning <span>Letters · Aa</span>')+'</button></div><div class="home-stages">'+cards.map(([id,title,age,art,caption])=>'<button class="home-stage home-'+id+'" data-action="stage" data-stage="'+id+'"><span class="home-stage-art" aria-hidden="true">'+art+'</span><span><b>'+title+'</b><small>'+caption+'</small>'+(age?'<em>Suggested age '+age+'</em>':'<em>All ages welcome</em>')+'</span><span aria-hidden="true">→</span></button>').join('')+'</div><p class="home-guidance">Start wherever you feel ready. Ages are a guide.</p></section>';
}
