import {storyScene} from './story-scenes.js';
import {alphabet,stageInfo,wordLessons,supportingWords,stories,patternLessons,pictureSymbols} from './stage-data.js';
import {createStoryFlow} from './story-flow.js';
import {createSpellingFlow} from './spelling-flow.js';
import {familyWords} from './family-data.js';
import {profiles} from './curriculum.js';
import {playStageSequence,toggleStagePause,stopStageAudio,stageAudioState} from './stage-audio.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,data='',classes='')=>'<button class="btn '+classes+'" data-action="stages-'+action+'" '+data+'>'+label+'</button>';
const icons={igloo:'<path d="M14 85a46 46 0 0 1 92 0Z" fill="#dceefb" stroke="#446887" stroke-width="3"/><path d="M50 85V65a13 13 0 0 1 26 0v20" fill="#6087a9"/><path d="M20 64h80M31 45h57M47 25v20M36 45v19M82 45v19M24 65v20M95 65v20" fill="none" stroke="#91b7d2" stroke-width="2"/>',zip:'<rect x="20" y="12" width="80" height="96" rx="12" fill="#a2d9e7"/><path d="M60 13v95" stroke="#4b5d75" stroke-width="14"/><path d="M55 20h10m-10 10h10m-10 10h10m-10 10h10m-10 10h10m-10 10h10m-10 10h10m-10 10h10" stroke="#efdf75" stroke-width="4"/><rect x="46" y="42" width="28" height="22" rx="5" fill="#a8b9c9" stroke="#384f69"/><rect x="52" y="55" width="16" height="26" rx="4" fill="#e9f1f5" stroke="#384f69"/>',quilt:'<rect x="13" y="18" width="94" height="84" rx="7" fill="#f6c7d3" stroke="#9e6480" stroke-width="3"/><path d="M44 18v84m32-84v84M13 46h94M13 74h94" stroke="white" stroke-width="4"/><path d="m22 33 7-8 7 8-7 8Zm32 28 7-8 7 8-7 8Zm32 28 7-8 7 8-7 8Z" fill="#d75b83"/>',jug:'<path d="M72 35h14a19 19 0 0 1 0 39H73" fill="none" stroke="#58a4c6" stroke-width="10"/><path d="M25 23h49v63q0 18-24 18T25 86V38l-10-9Z" fill="#acdfea" stroke="#39728e" stroke-width="3"/><path d="M28 58h42v27q0 14-20 14T28 85Z" fill="#51accd"/>',yak:'<path d="M30 48Q8 26 23 16m59 32q25-22 10-32" fill="none" stroke="#c4a981" stroke-width="7"/><ellipse cx="61" cy="68" rx="43" ry="29" fill="#704532"/><path d="M25 88v18m24-14v14m29-14v14m17-20v20" stroke="#483126" stroke-width="9"/><path d="m20 77 6 17 8-10 10 11 9-9 10 8 11-7 10 5 12-11" fill="#563728"/><circle cx="29" cy="61" r="18" fill="#86573e"/><circle cx="23" cy="58" r="3" fill="#211b19"/><ellipse cx="20" cy="73" rx="13" ry="8" fill="#c19874"/>',jam:'<path d="M30 28h60v65q0 13-15 13H45q-15 0-15-13Z" fill="#df606f" stroke="#823746" stroke-width="3"/><rect x="26" y="17" width="68" height="17" rx="5" fill="#689bc3"/><rect x="36" y="48" width="48" height="36" rx="8" fill="#fff2d4"/><path d="M46 60q4-10 14-4 10-6 14 4-4 22-14 20-10 2-14-20Z" fill="#d94654"/><path d="m54 50 6 7 6-7" fill="none" stroke="#448354" stroke-width="4"/>'};
export function stagePicture(word,small=false){
 const pictureWord=word==='sit'?'sat':word;
 if(familyWords[pictureWord])return '<div class="family-picture picture-'+pictureWord+' stage-picture '+(small?'mini':'')+'" role="img" aria-label="'+esc(familyWords[pictureWord].description)+'"></div>';
 if(icons[word])return '<svg class="stage-picture '+(small?'mini':'')+'" viewBox="0 0 120 120" role="img" aria-label="'+esc(word)+'">'+icons[word]+'</svg>';
 return '<div class="stage-picture symbol-picture '+(small?'mini':'')+'" role="img" aria-label="'+esc(word)+'">'+(pictureSymbols[word]||'📖')+'</div>';
}
const sounds=word=>'<div class="stage-blend" aria-label="Blend '+esc(word)+'">'+[...word].map((c,i)=>'<button class="sound-chip" data-action="stages-audio" data-key="sound:'+c+'" data-part="'+i+'">'+c+'</button>').join('<span aria-hidden="true">–</span>')+'<span aria-hidden="true">→</span><b>'+word+'</b></div>';

export function createStageLessons({getProgress,getLegacy,save,isSaved,render,onLegacy,onFamily,onStatus,getSpeed}){
 let stage='letters',page='home',letterIndex=0,wordId=null,storyId=null,exampleIndex=0,phase='Ready',activeStoryLine=-1;
 const state=()=>getProgress();
 const status=message=>onStatus(message);
 const storyFlow=createStoryFlow({getProgress,save,isSaved,render,status,play:audioParts,stop,picture:stagePicture});
 const spellingFlow=createSpellingFlow({getProgress:()=>state().spelling,save,isSaved,render,status,picture:stagePicture,getSpeed});
 const saveLabel=()=>'<span id="save-status">'+(isSaved()?'Saved automatically':'Progress not saved')+'</span>';
 function stop(){stopStageAudio();spellingFlow.clear();status('');activeStoryLine=-1;}
 function audioParts(parts,onEnd=()=>{}){
  playStageSequence(parts,{speed:getSpeed(),onPart:part=>{
   if(part.example!==undefined){exampleIndex=part.example;phase=part.phase;}
   if(part.line!==undefined)activeStoryLine=part.line;
   const label=document.querySelector('#letter-phase');if(label)label.textContent=part.phase||'Listening';
  },onActive:(part,active)=>{
   document.querySelectorAll('.letter-example').forEach((el,i)=>el.classList.toggle('playing',active&&i===part.example));
  },onState:()=>syncAudioControls(),onEnd:()=>{
   document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));phase='Ready to replay';
   const label=document.querySelector('#letter-phase');if(label)label.textContent=phase;
   status('Ready to listen again.');onEnd();syncAudioControls();
  },onError:message=>{document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));status(message);syncAudioControls();}});
 }
 function syncAudioControls(){
  const s=stageAudioState();
  document.querySelectorAll('[data-action="stages-pause"]').forEach(pause=>{pause.disabled=!s.playing;pause.textContent=s.paused?'Resume':'Pause';pause.setAttribute('aria-pressed',String(s.paused));});
 }
 function playLetter(){
  const a=alphabet[letterIndex];
  state().letter=letterIndex;save();
  audioParts([
   {key:'alphabet-case:'+a.letter,caseLetter:a.letter,phase:'Big and small: '+a.letter.toUpperCase()+a.letter},
   ...a.examples.flatMap((word,i)=>[
    {key:'alphabet-example:'+a.letter+':'+word,letterName:a.letter,exampleWord:word,example:i,phase:'Listen: '+word},
    ...[1,2,3].map(repeat=>({key:'sound:'+a.sound,letterSound:a.letter,example:i,phase:'Letter sound · '+repeat+' of 3'})),
    {key:'word:'+word,example:i,phase:'Picture word: '+word,pauseAfter:600}
   ])
  ],()=>{if(!state().lettersDone.includes(a.letter)){state().lettersDone.push(a.letter);save();}});
 }
 function openLetter(index,autoplay=true){
  if(!Number.isInteger(index)||index<0||index>=alphabet.length)return;
  stop();stage='letters';page='home';letterIndex=index;state().letter=index;exampleIndex=0;phase='Ready';save();render();if(autoplay)playLetter();
 }
 function legacyCards(which,indices){
  const p=getLegacy(),lessons=profiles[which].lessons;
  return '<div class="lessons">'+indices.map(i=>{const l=lessons[i],saved=p.inProgress[which][l.id];return '<button class="lesson-card" data-action="stages-legacy" data-profile="'+which+'" data-index="'+i+'"><span class="number">'+(p.completed[which].includes(l.id)?'★ ':'')+'PRACTICE '+(i+1)+'</span><span class="lesson-glyph">'+(which==='little'?l.items.join(' '):l.items[0])+'</span><small>'+esc(l.title)+(saved?' · Continue activity '+(saved.step+1):'')+'</small></button>';}).join('')+'</div>';
 }
 function lettersHome(){
  const a=alphabet[letterIndex];
  return '<section class="stage-letter activity"><div class="eyebrow">Letters · Suggested age 4+</div><h1>Say hello to '+a.letter.toUpperCase()+a.letter+'.</h1><p class="muted">Hear the name, the sound, and two picture words.</p><div class="big-letter letter-display"><span data-case="upper">'+a.letter.toUpperCase()+'</span><span data-case="lower">'+a.letter+'</span></div><div class="letter-examples">'+a.examples.map((word,i)=>'<div class="letter-example" data-example="'+i+'">'+stagePicture(word)+'<b>'+word+'</b></div>').join('')+'</div><p class="letter-note">'+esc(a.note).replace('with u:', 'with <span data-letter="u">u</span>:')+'</p><div class="activity-actions">'+button('Start','letter-start','','primary')+button('Replay','letter-start')+button('Pause','pause','disabled aria-pressed="false"')+'</div><p id="letter-phase" class="letter-phase" role="status">'+esc(phase)+'</p><p id="audio-status" class="status"></p><div class="letter-paging">'+button('← Previous','letter-next','data-index="'+(letterIndex-1)+'" '+(letterIndex===0?'disabled':''))+ '<span>'+ (letterIndex+1)+' / 26</span>'+button('Next →','letter-next','data-index="'+(letterIndex+1)+'" '+(letterIndex===25?'disabled':''))+'</div><p class="small muted">Stay here and practise. Only Next changes to the next letter.</p></section>'+
   (state().letter!==letterIndex?'<div class="resume-strip"><span>Your saved letter is '+alphabet[state().letter].letter.toUpperCase()+alphabet[state().letter].letter+'.</span>'+button('Continue that letter →','letter-next','data-index="'+state().letter+'"')+'</div>':'')+
   '<details class="stage-practice"><summary>Choose a letter · '+state().lettersDone.length+' explored</summary><div class="letter-grid">'+alphabet.map((a,i)=>'<button data-action="stages-letter-next" data-index="'+i+'" aria-label="Open '+a.letter.toUpperCase()+a.letter+'">'+a.letter.toUpperCase()+a.letter+(state().lettersDone.includes(a.letter)?'<small>✓</small>':'')+'</button>').join('')+'</div></details><details class="stage-practice"><summary>More letter practice: matching, writing and talking</summary>'+legacyCards('little',profiles.little.lessons.map((_,i)=>i))+'</details>';
 }
 function helperCards(keys){
  return '<div class="helper-grid">'+keys.map(key=>{const h=supportingWords[key.toLowerCase()]||supportingWords[key];return '<div class="helper-card"><b>'+esc(key)+'</b>'+(h?'<p lang="bn">'+esc(h.meaning)+'</p><p>'+esc(h.help)+'</p>':'<p>Meet this word with a grown-up before reading.</p>')+button('Hear '+esc(key),'audio','data-key="word:'+esc(key)+'"')+'</div>';}).join('')+'</div>';
 }
 function wordsHome(){
  return '<section class="intro"><div><div class="eyebrow">Words · Suggested age 5+</div><h1>Words, one little step at a time.</h1><p class="muted">Choose what you want to practise.</p></div></section><div class="words-menu">'+[
   ['Spell picture words','Letter names, then the whole word.','spelling-open','apple'],
   ['Build & read words','Blend sounds and explore picture families.','build-open','cat'],
   ['Read little sentences','Short phrases, sentences and the -at story.','sentences-open','mat']
  ].map(([title,detail,action,word])=>'<button class="words-menu-card" data-action="stages-'+action+'">'+stagePicture(word,true)+'<span><b>'+title+'</b><small>'+detail+'</small></span><span aria-hidden="true">→</span></button>').join('')+'</div>';
 }
 function wordLibrary(sentences=false){
  return '<div class="lesson-head">'+button('← Words','back')+'</div><section class="intro"><div><div class="eyebrow">Words · Suggested age 5+</div><h1>'+(sentences?'Read little sentences.':'Build & read words.')+'</h1><p class="muted">'+(sentences?'Meet helping words, read a phrase, then a picture sentence.':'Start with familiar sounds. Blend them, build words, and practise writing.')+'</p></div></section>'+
   '<section class="stage-existing"><h2>'+(sentences?'The -at family: sentences & a story':'Picture word families')+'</h2><p>'+(sentences?'Follow the existing cat, mat, hat and rat reading path.':'Your picture rounds, Bangla help and saved writing are here.')+'</p>'+button(sentences?'Read sentences & a story →':'Explore picture families →',sentences?'family-reading':'families','','primary')+'</section><h2>'+(sentences?'Little sentence lessons':'Blend short words')+'</h2><div class="word-path">'+wordLessons.map(l=>'<button class="word-path-card" data-action="stages-word-open" data-id="'+l.id+'">'+stagePicture(l.word,true)+'<b>'+esc(sentences?l.phrase:l.word)+'</b><small>'+(state().words[l.id]?.done?'Practised ✓':sentences?esc(l.sentence):'Hear & blend')+'</small></button>').join('')+'</div>'+
   '<details class="stage-practice"><summary>More word practice: build, listen, read and talk</summary>'+legacyCards('big',profiles.big.lessons.map((_,i)=>i).filter(i=>i<15))+'</details>';
 }
 function wordView(){
  const l=wordLessons.find(x=>x.id===wordId),p=state().words[wordId],correct=p.answer===l.word;
  let body='';
  if(p.step===0){body='<div class="eyebrow">1 · Hear & blend</div><h1>Meet '+l.word+'.</h1>'+stagePicture(l.word)+sounds(l.word)+'<p class="lead">'+esc(l.tip)+'</p>'+button('Hear the blend','blend','data-word="'+l.word+'"','primary')+'<div class="activity-actions">'+button('Learn the helping words →','word-next','','primary')+'</div>';}
  else if(p.step===1){body='<div class="eyebrow">2 · Helping words</div><h1>A few words to help you read.</h1><p class="muted">Meet these before reading the sentence. Listen and say them together.</p>'+helperCards(l.helpers)+'<div class="activity-actions">'+button('Read a short phrase →','word-next','','primary')+'</div>';}
  else if(p.step===2){body='<div class="eyebrow">3 · A short phrase</div><h1>Put words together.</h1>'+stagePicture(l.word)+'<p class="sentence">'+esc(l.phrase)+'</p>'+button('Hear the phrase','audio','data-key="text:'+esc(l.phrase)+'"')+'<div class="activity-actions">'+button('Try the sentence →','word-next','','primary')+'</div>';}
  else{body='<div class="eyebrow">4 · Complete & read</div><h1>Finish the picture sentence.</h1>'+stagePicture(l.word)+'<p class="sentence completed-sentence" role="status">'+esc(correct?l.sentence:l.blank)+'</p><div class="choices sentence-choices">'+l.choices.map(w=>'<button class="choice word-choice '+(p.answer===w?(correct?'correct':'retry'):'')+'" data-action="stages-word-answer" data-word="'+w+'" '+(correct?'disabled':'')+'>'+w+'</button>').join('')+'</div><p class="feedback" role="status">'+(correct?'You did it! Now read the whole sentence aloud.':p.answer?'Good try. Look at the picture and try again.':'Choose one word.')+'</p>'+(correct?button('Hear the whole sentence','audio','data-key="text:'+esc(l.sentence)+'"')+'<div class="activity-actions">'+button('I read the sentence ✓','word-finish','','primary')+'</div>':'');}
  return '<div class="lesson-head">'+button('← Words','back')+'<span class="lesson-meta">'+(state().words[wordId]?.done?'Practised · ':'')+saveLabel()+'</span></div><section class="activity stage-word">'+body+button('Pause','pause','disabled aria-pressed="false"')+'<p id="audio-status" class="status"></p></section>';
 }
 function storiesHome(){
  const levels=['First connected sentences','Add sh and ch','Next: the ai vowel team','Then: the ea vowel team'];
  return '<section class="intro"><div><div class="eyebrow">Stories · Suggested age 6+</div><h1>Little stories to read.</h1><p class="muted">Start with familiar words. Add new patterns, then read longer paragraphs. Audio is always optional.</p></div></section>'+(state().storyCurrent?'<div class="resume-strip"><span>Pick up '+esc(stories.find(s=>s.id===state().storyCurrent).title)+'.</span>'+button('Continue story →','story-open','data-id="'+state().storyCurrent+'"','primary')+'</div>':'')+
   levels.map((label,level)=>'<section class="story-band"><h2>'+label+'</h2>'+(level>0?'<div class="pattern-links">'+patternLessons.filter(p=>level===1?['sh','ch'].includes(p.id):p.id===(level===2?'ai':'ea')).map(p=>button('Meet '+p.id+(state().patterns.includes(p.id)?' ✓':''),'pattern','data-id="'+p.id+'"')).join('')+'</div>':'')+'<div class="story-grid">'+stories.filter(s=>s.level===level).map(s=>'<button class="story-card" data-action="stages-story-open" data-id="'+s.id+'"><div class="story-thumb">'+(s.id==='pig-pen'?storyScene(s,0):s.pictures.slice(0,2).map(w=>stagePicture(w,true)).join(''))+'</div><b>'+esc(s.title)+'</b><small>'+s.sentences.length+' connected sentences'+(state().stories[s.id]?.done?' · Practised ✓':'')+'</small></button>').join('')+'</div></section>').join('')+'<details class="stage-practice"><summary>More pattern practice: sh, ch and ck</summary>'+legacyCards('big',[15,16,17])+'</details>';
 }
 function patternView(){
  const p=patternLessons.find(x=>x.id===storyId);
  return '<div class="lesson-head">'+button('← Stories','back')+'</div><section class="activity"><div class="eyebrow">Meet a new pattern</div><h1>'+esc(p.title)+'</h1><p class="lead">'+esc(p.note)+'</p><div class="pattern-word-grid">'+p.words.map((word,i)=>'<div>'+stagePicture(word,true)+'<b>'+word+'</b><p>'+p.parts[i].map((part,j)=>'<span data-pattern="'+i+'" data-part="'+j+'">'+part+'</span>').join(' – ')+'</p>'+button('Hear '+word,'pattern-blend','data-id="'+p.id+'" data-index="'+i+'"')+'</div>').join('')+'</div><div class="activity-actions">'+button('We tried this pattern ✓','pattern-finish','data-id="'+p.id+'"','primary')+'</div><p id="audio-status" class="status"></p></section>';
 }
 function storyView(){return storyFlow.html();}

 return {
  stage:()=>stage,
  snapshot(){return page==='spelling'?{kind:'stage',page:'spelling'}:page==='word'?{kind:'stage',page:'word',id:wordId}:page==='story'?{kind:'stage',page:'story',id:state().storyCurrent}:page==='pattern'?{kind:'stage',page:'pattern',id:storyId}:stage==='letters'?{kind:'stage',page:'letter',index:letterIndex}:null;},
  openResume(route){
   stop();
   if(route.page==='letter'){openLetter(route.index,false);return;}
   stage=['story','pattern'].includes(route.page)?'stories':'words';page=route.page;
   if(page==='spelling'){spellingFlow.open(false);return;}
   if(page==='story'){storyFlow.open(route.id,true);return;}
   if(page==='word'){wordId=route.id;state().wordCurrent=wordId;state().words[wordId]??={step:0,answer:null,done:false};}
   if(page==='pattern')storyId=route.id;
   save();render();
  },
  narrateLegacyLetter(letter,word){
   const a=alphabet.find(a=>a.letter===letter);if(!a)return;
   audioParts([{key:'alphabet-case:'+letter,caseLetter:letter,caseTarget:'.big-letter'},
    {key:'alphabet-example:'+letter+':'+word,letterName:letter,exampleWord:word,legacyExample:true},
    ...[1,2,3].map(()=>({key:'sound:'+a.sound,target:'.big-letter [data-case="lower"]'})),
    {key:'word:'+word,target:'.flash-word,.activity h2'}]);
  },
  setStage(value){if(!stageInfo[value])return;stop();stage=value;page='home';if(stage==='letters'){letterIndex=state().letter;phase='Ready';}},
  reset(){openLetter(0,false);},
  stop,
  html(){return page==='spelling'?spellingFlow.html():page==='blending'?wordLibrary():page==='sentences'?wordLibrary(true):page==='word'?wordView():page==='story'?storyView():page==='pattern'?patternView():stage==='letters'?lettersHome():stage==='words'?wordsHome():storiesHome();},
  handle(data){
   const action=data.action.replace('stages-','');
   if(action==='letter-start')playLetter();
   else if(action==='letter-next')openLetter(Number(data.index));
   else if(action==='pause')toggleStagePause();
   else if(action==='spelling-open'){stop();page='spelling';spellingFlow.open();}
   else if(action==='build-open'||action==='spelling-blend'){stop();page='blending';render();}
   else if(action==='sentences-open'){stop();page='sentences';render();}
   else if(action==='family-reading'){stop();onFamily(true);}
   else if(action.startsWith('spelling-'))spellingFlow.handle(data);
   else if(action==='audio')audioParts([{key:data.key,part:data.part===undefined?undefined:Number(data.part)}]);
   else if(action==='blend')audioParts([...data.word].map((c,i)=>({key:'sound:'+c,part:i})).concat({key:'word:'+data.word}));
   else if(action==='back'||action==='story-back'){stop();page='home';render();}
   else if(action==='families'){stop();onFamily();}
   else if(action==='legacy'){stop();onLegacy(data.profile,Number(data.index));}
   else if(action==='word-open'){
    if(!wordLessons.some(l=>l.id===data.id))return;stop();wordId=data.id;page='word';state().wordCurrent=wordId;
    state().words[wordId]??={step:0,answer:null,done:false};save();render();
   }else if(action==='word-next'){const p=state().words[wordId];if(p&&p.step<3){stop();p.step++;save();render();}}
   else if(action==='word-answer'){
    const l=wordLessons.find(l=>l.id===wordId),p=state().words[wordId];if(!l||p.step!==3||p.answer===l.word||!l.choices.includes(data.word))return;
    p.answer=data.word;save();render(false);
   }else if(action==='word-finish'){
    const l=wordLessons.find(l=>l.id===wordId),p=state().words[wordId];if(!l||p.answer!==l.word)return;
    p.done=true;save();status(isSaved()?'Sentence practice saved. Read it again, or return to Words.':'Read the sentence again. Progress could not be saved yet.');
   }else if(action==='pattern'){if(!patternLessons.some(p=>p.id===data.id))return;stop();storyId=data.id;page='pattern';render();}
   else if(action==='pattern-blend'){
    const p=patternLessons.find(p=>p.id===data.id),i=Number(data.index);if(!p?.parts[i])return;
    audioParts(p.parts[i].map((part,j)=>({key:'sound:'+part,target:'.pattern-word-grid [data-pattern="'+i+'"][data-part="'+j+'"]'})).concat({key:'word:'+p.words[i]}));
   }else if(action==='pattern-finish'){if(!state().patterns.includes(data.id))state().patterns.push(data.id);save();stop();page='home';render();}
   else if(action==='story-open'){if(!stories.some(s=>s.id===data.id))return;page='story';storyFlow.open(data.id);}
   else if(action.startsWith('story-'))storyFlow.handle(data);
  }
 };
}
