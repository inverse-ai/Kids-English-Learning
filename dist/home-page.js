import {playfulLesson} from './playful-data.js';
import {learningSections} from './section-registry.js';
import {finishIllustration} from './illustration-style.js';
import {scienceLessons} from './science-data.js';
import {mathLessons} from './math-data.js';
import {allMoveLessons} from './move-data.js';
import {valuesStories} from './values-stories.js';
import {alphabet,wordLessons,stories,patternLessons} from './stage-data.js';
import {pictureFamilies,familyRounds,familyWords} from './family-data.js';
import {profiles} from './curriculum.js';

export function validResume(r){
 if(!r||typeof r!=='object')return null;
 if(r.kind==='playful'&&typeof r.id==='string'&&playfulLesson(r.id))return {kind:'playful',id:r.id};
 if(r.kind==='stage'){
  if(r.page==='letter'&&Number.isInteger(r.index)&&alphabet[r.index])return {kind:r.kind,page:r.page,index:r.index};
  if(r.page==='spelling')return {kind:r.kind,page:r.page};
  if(r.page==='letter-match')return {kind:r.kind,page:r.page};
  if(r.page==='alphabet')return {kind:r.kind,page:r.page};
  const lists={word:wordLessons,story:stories,pattern:patternLessons,'value-story':valuesStories,'move-lesson':allMoveLessons,'math-lesson':mathLessons,'science-lesson':scienceLessons};
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
 if(p.learning.science?.current)return validResume({kind:'stage',page:'science-lesson',id:p.learning.science.current});
 if(p.learning.math?.current)return validResume({kind:'stage',page:'math-lesson',id:p.learning.math.current});
 if(p.learning.moveCurrent)return validResume({kind:'stage',page:'move-lesson',id:p.learning.moveCurrent});
 if(p.learning.valueCurrent)return validResume({kind:'stage',page:'value-story',id:p.learning.valueCurrent});
 if(p.learning.storyCurrent)return validResume({kind:'stage',page:'story',id:p.learning.storyCurrent});
 if(p.pictureFamilies.reading.at.started)return {kind:'family',page:'reading'};
 if(p.learning.spelling.letter||p.learning.spelling.position||p.learning.spelling.done.length)return {kind:'stage',page:'spelling'};
 if(p.learning.words[p.learning.wordCurrent])return validResume({kind:'stage',page:'word',id:p.learning.wordCurrent});
 if(p.learning.letter||p.learning.lettersDone.length)return {kind:'stage',page:'letter',index:p.learning.letter};
 if(p.learning.letterMatching?.started)return {kind:'stage',page:'letter-match'};
 if(p.learning.alphabetReading?.started)return {kind:'stage',page:'alphabet'};
 if(p.pictureFamilies.lastFamily)return validResume({kind:'family',page:'board',family:p.pictureFamilies.lastFamily});
 const completed=p.completed[p.profile].at(-1);if(completed)return validResume({kind:'legacy',profile:p.profile,id:completed});
 return null;
}
export function resumeName(r,p){
 if(r.kind==='legacy')return profiles[r.profile].lessons.find(x=>x.id===r.id).title;
 if(r.kind==='family')return r.page==='reading'?'The -at family · Read sentences & a story':r.page==='writing'?'Write '+r.word:r.page==='lesson'?'The -'+familyRounds.find(x=>x.id===r.round).family+' family · Round '+familyRounds.find(x=>x.id===r.round).number:'The -'+r.family+' word family';
 if(r.kind==='playful')return playfulLesson(r.id).title+' · Play & practise';
 if(r.page==='spelling'){const a=alphabet[p.learning.spelling.letter];return 'Spell picture words · '+a.letter.toUpperCase()+a.letter;}
 if(r.page==='letter-match')return 'Big and small letters · '+(p.learning.letterMatching?.phase==='review'?'Review':'Round '+((p.learning.letterMatching?.round||0)+1));
 if(r.page==='alphabet')return 'Letters · Read the alphabet';
 if(r.page==='letter'){const a=alphabet[r.index];return 'Letters · '+a.letter.toUpperCase()+a.letter;}
 return ({word:wordLessons,story:stories,pattern:patternLessons,'value-story':valuesStories,'move-lesson':allMoveLessons,'math-lesson':mathLessons,'science-lesson':scienceLessons})[r.page].find(x=>x.id===r.id).title||'Read '+wordLessons.find(x=>x.id===r.id)?.word;
}
// Home illustrations are vectors with padded view boxes: no cropping or platform emoji.
const welcome=`<svg viewBox="0 0 360 230" class="welcome-art" role="img" aria-label="A smiling cat and a little bird sharing a storybook">
 <path d="M34 178C8 88 71 26 165 33s174 27 159 120-243 78-290 25Z" fill="#d8efee"/>
 <circle cx="286" cy="46" r="24" fill="#ffd267"/><path d="m285 11 1-6m29 23 6-3m-53-1-5-4m50 48 6 3" stroke="#e9ac31" stroke-width="4" stroke-linecap="round"/>
 <path d="M51 64q12-18 27-2 17-12 27 6H45q-1-6 6-4" fill="#fffdf6"/><ellipse cx="180" cy="207" rx="143" ry="11" fill="#b9dcce"/>
 <path d="M69 178q-35-8-24-42" fill="none" stroke="#eb9552" stroke-width="15" stroke-linecap="round"/>
 <path d="m82 95-7-44 37 21m47 20 13-42-38 22" fill="#f4b470" stroke="#a15d38" stroke-width="3" stroke-linejoin="round"/>
 <path d="m83 75-3-15 15 13m56 2 13-15-4 17" fill="#f7d0bd"/>
 <ellipse cx="120" cy="145" rx="47" ry="54" fill="#f4b470"/><ellipse cx="121" cy="105" rx="48" ry="38" fill="#ffc887"/>
 <path d="m108 73 5 12m13-14v13m13-10-4 11" stroke="#e9954b" stroke-width="4" stroke-linecap="round"/>
 <path d="M97 101q6-7 12 0m23 0q6-7 12 0" fill="none" stroke="#553f3b" stroke-width="3.5" stroke-linecap="round"/>
 <ellipse cx="94" cy="113" rx="7" ry="4" fill="#ee9c84"/><ellipse cx="148" cy="113" rx="7" ry="4" fill="#ee9c84"/>
 <path d="m116 110 6 4 6-4m-6 4v6m-10 0q10 12 20 0" fill="none" stroke="#7a4940" stroke-width="3" stroke-linecap="round"/>
 <ellipse cx="249" cy="159" rx="34" ry="35" fill="#69bfc9"/><circle cx="253" cy="126" r="27" fill="#8bd4d9"/>
 <path d="m253 99-5-12m7 12 5-10" stroke="#55aab6" stroke-width="3" stroke-linecap="round"/><path d="M258 123q5-6 10 0" fill="none" stroke="#344d5a" stroke-width="3" stroke-linecap="round"/>
 <path d="m277 130 18 8-20 7" fill="#efaa42"/><path d="M226 153q-20-10-18 15l22 7" fill="#3997ab"/>
 <path d="m239 191-2 11m20-12 4 12" stroke="#a87632" stroke-width="4" stroke-linecap="round"/>
 <path d="m126 155 57-10 54 10v49l-54-9-57 9Z" fill="#fffdf6" stroke="#5269ad" stroke-width="4" stroke-linejoin="round"/>
 <path d="M183 147v48" stroke="#5269ad" stroke-width="3"/><path d="m139 170 29-5m-29 16 29-5m29-10 26 5m-26 7 26 5" stroke="#a0b9d5" stroke-width="3" stroke-linecap="round"/>
 <ellipse cx="126" cy="170" rx="11" ry="8" fill="#ffc887"/><ellipse cx="237" cy="170" rx="10" ry="7" fill="#8bd4d9"/>
 <path d="M308 203v-31m0 16q-19-1-18-15 19-1 18 15m1-7q19-1 18-15-19-1-18 15" fill="#67ae87" stroke="#42866b" stroke-width="2"/>
 <path d="m45 98 3-8 4 8 8 3-8 4-4 8-3-8-8-4Z" fill="#ad9be1"/><circle cx="207" cy="60" r="5" fill="#ef9d88"/>
</svg>`;
const illustration=content=>'<svg viewBox="0 0 160 120" aria-hidden="true" focusable="false">'+content+'</svg>';
const sectionArt={
 letters:illustration('<ellipse cx="81" cy="108" rx="64" ry="6" fill="#bedde9"/><g transform="rotate(-8 54 59)"><rect x="18" y="21" width="67" height="76" rx="15" fill="#ffd468" stroke="#d6a43e" stroke-width="2"/><text x="51" y="77" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="54" font-weight="bold" fill="#3d5081">A</text></g><g transform="rotate(8 103 71)"><rect x="74" y="43" width="65" height="60" rx="14" fill="#7dbedc" stroke="#4a95bd" stroke-width="2"/><text x="106" y="85" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="47" font-weight="bold" fill="#193954">a</text></g><path d="m133 18 3-8 4 8 8 3-8 4-4 8-3-8-8-4Z" fill="#ef957d"/>'),
 words:illustration('<ellipse cx="79" cy="108" rx="62" ry="6" fill="#ebc3ae"/><path d="M37 81q-22-4-17-24" stroke="#e99452" stroke-width="10" stroke-linecap="round" fill="none"/><ellipse cx="74" cy="73" rx="33" ry="30" fill="#efaa68"/><path d="m45 42-3-26 25 15m28 11 10-26-26 15" fill="#efaa68" stroke="#a36e4b" stroke-width="2"/><ellipse cx="74" cy="45" rx="32" ry="25" fill="#ffc58b"/><circle cx="63" cy="43" r="3" fill="#523f39"/><circle cx="86" cy="43" r="3" fill="#523f39"/><path d="m71 50 4 3 4-3m-4 3v4m-7 0q7 8 14 0" stroke="#86594b" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="34" y="79" width="92" height="29" rx="9" fill="#fff9ed" stroke="#bb7d68" stroke-width="2"/><text x="80" y="100" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="25" font-weight="bold" letter-spacing="6" fill="#743f35">cat</text><path d="m130 39 3-7 4 7 7 3-7 3-4 7-3-7-7-3Z" fill="#d28da6"/>'),
 stories:illustration('<ellipse cx="80" cy="108" rx="66" ry="6" fill="#d3c4e8"/><path d="m17 39 63-10 63 10v67l-63-10-63 10Z" fill="#9582cb" stroke="#655590" stroke-width="3" stroke-linejoin="round"/><path d="m22 33 58 10 58-10v65l-58-9-58 9Z" fill="#fffaf0" stroke="#655590" stroke-width="2.5" stroke-linejoin="round"/><path d="M80 43v45" stroke="#a79ac5" stroke-width="2"/><circle cx="113" cy="53" r="10" fill="#ffd06a"/><path d="m91 83 15-21 12 16 8-10 8 22" fill="#8ab995"/><path d="M31 61q18-23 39 0v22H31Z" fill="#cbe9ec"/><path d="m37 59 6-13 8 13m6 0 7-13 5 13" fill="#edac73"/><path d="M40 60h22v19H40Z" fill="#edac73"/><path d="m32 90 36-5" stroke="#d2bea4" stroke-width="3" stroke-linecap="round"/><path d="m78 14 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="#e8b54b"/>'),
 science:illustration('<rect x="20" y="18" width="120" height="94" rx="20" fill="#e2f5ec" stroke="#75ab91" stroke-width="2"/><circle cx="110" cy="42" r="16" fill="#ffd774"/><path d="M60 95V59m0 17q-33-1-27-26 27-4 27 26m0-8q34-1 28-26-27-4-28 26" fill="#8bc694" stroke="#589365" stroke-width="3"/><path d="M41 94h38l-6 12H47Z" fill="#e5a482"/>'),
 math:illustration('<rect x="18" y="18" width="124" height="91" rx="18" fill="#fff3cd" stroke="#d2aa51" stroke-width="2"/><path d="M45 84V48m35 36V38m35 46V51" stroke="#61a178" stroke-width="5"/><circle cx="45" cy="44" r="15" fill="#ed9aad"/><circle cx="80" cy="34" r="15" fill="#f4c957"/><circle cx="115" cy="47" r="15" fill="#9aace1"/><text x="80" y="103" text-anchor="middle" font-size="18" font-weight="bold" fill="#654e39">1  2  3</text>'),
 move:illustration('<ellipse cx="81" cy="109" rx="66" ry="6" fill="#b9d8ca"/><path d="m76 43 32-13 33 13v50l-33 14-32-14Z" fill="#f1b767" stroke="#8c6743" stroke-width="2.5" stroke-linejoin="round"/><path d="m76 43 32 13 33-13m-33 13v51" fill="none" stroke="#8c6743" stroke-width="2.5"/><path d="m78 44 29-11 30 11-29 11Z" fill="#aa7547"/><circle cx="36" cy="86" r="21" fill="#6eaacb" stroke="#366987" stroke-width="2.5"/><path d="M15 86h42m-21-21q-13 21 0 42m0-42q13 21 0 42" fill="none" stroke="#e2f5fa" stroke-width="2.5"/><path d="M30 47Q48 15 81 23" fill="none" stroke="#3c8c78" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 7"/><path d="m72 16 12 8-12 6" fill="none" stroke="#3c8c78" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
};
export function homePage(resume,p,esc){
 return '<section class="app-home"><div class="home-welcome"><div class="home-welcome-copy"><span class="home-hello">Hello, little explorer!</span><h1>Little English</h1><p>Big discoveries. <br>One little step at a time.</p><button class="btn primary home-continue" data-action="'+(resume?'continue-home':'start-home')+'"><span class="home-continue-title">'+(resume?'Continue':'Start learning')+' <span aria-hidden="true">→</span></span><span class="home-continue-lesson">'+(resume?esc(resumeName(resume,p)):'Letters · A–Z')+'</span></button></div>'+finishIllustration(welcome)+'</div><h2 class="home-section-title">What shall we explore?</h2><div class="home-stages">'+learningSections.map(({id,title,age,caption})=>'<button class="home-stage home-'+id+'" data-action="stage" data-stage="'+id+'"><span class="home-stage-art" aria-hidden="true">'+finishIllustration(sectionArt[id])+'</span><span class="home-stage-copy"><b>'+title+'</b><small>'+caption+'</small><em>'+(age?'Suggested age '+age:'All ages welcome')+'</em></span><span class="home-stage-arrow" aria-hidden="true">→</span></button>').join('')+'</div><p class="home-guidance">Start wherever you feel ready. Ages are a guide.</p></section>';
}
