import {pictureFamilies,familyWords,familyRounds,familyStages} from './family-data.js';
import {playFamilyAudio,stopLessonAudio} from './lesson-audio.js';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=items=>[...items].map(item=>({item,rank:Math.random()})).sort((a,b)=>a.rank-b.rank).map(x=>x.item);
const btn=(label,action,data='',classes='')=>'<button class="btn '+classes+'" data-action="family-'+action+'" '+data+'>'+label+'</button>';
const picture=word=>'<div class="family-picture picture-'+word+'" role="img" aria-label="'+escape(familyWords[word].description)+'"></div>';
const colouredWord=word=>'<span class="family-word">'+word[0]+'<span class="family-ending">'+word.slice(1)+'</span></span>';
const familyOf=id=>pictureFamilies.find(f=>f.id===id);
const roundsFor=id=>familyRounds.filter(r=>r.family===id);
const unfinishedRound=progress=>familyRounds.find(r=>r.id===progress.current&&progress.inProgress[r.id])||familyRounds.find(r=>progress.inProgress[r.id]);
const roundsDone=(id,progress)=>roundsFor(id).filter(r=>progress.completed.includes(r.id)).length;

export function familyEntry(progress){
 const saved=unfinishedRound(progress);
 return '<section class="family-entry"><div><div class="eyebrow">New · Pictures, sounds & Bangla help</div><h2>Picture word families</h2><p>Start with '+colouredWord('cat')+'. Hear the sounds, build a word, and learn what it means.</p><div class="family-entry-actions">'+btn('Explore picture words →','library','','primary')+(saved?btn('Continue picture lesson →','resume'):'')+'</div></div><div class="family-entry-art" aria-hidden="true">'+picture('cat')+'<span>-at</span></div></section>';
}

export function createFamilyLessons({getProgress,save,render,onHome,getSpeed,onStatus,isSaved=()=>true}){
 let page='library',familyId=null,selected=null,session=null;
 const persist=()=>save();
 const stopAudio=()=>{stopLessonAudio();status('');};
 function checkpoint(){
  if(page!=='lesson'||!session)return;
  getProgress().inProgress[session.round.id]={step:session.step,tiles:[...session.tiles],placed:[...session.placed],choices:[...session.choices],answer:session.answer};
  getProgress().current=session.round.id;
  persist();
 }
 function status(message,failed){onStatus(message,failed);}
 function audio(word,kind,index){
  if(!familyWords[word])return;
  const keys=kind==='blend'?[...word].map(c=>'sound:'+c).concat('word:'+word):
   kind==='first'?['sound:'+word[0]]:
   kind==='ending'?[...word.slice(1)].map(c=>'sound:'+c):
   kind==='sound'&&Number.isInteger(index)&&index>=0&&index<word.length?['sound:'+word[index]]:
   [kind+':'+word];
  playFamilyAudio(keys,{speed:getSpeed(),onPart:(part)=>{
   document.querySelectorAll('.blend-sound').forEach((element,i)=>element.classList.toggle('playing',part>=0&&(kind==='blend'&&(part===i||part===3)||kind==='sound'&&index===i||kind==='first'&&i===0||kind==='ending'&&i===part+1)));
  }},(message,failed)=>{
   if(message==='Ready to listen again.'||failed)document.querySelectorAll('.blend-sound').forEach(el=>el.classList.remove('playing'));
   status(message,failed);
  });
 }
 function listening(word,helpers=true){
  return '<div class="family-listening">'+btn('◖)) English word','audio','data-word="'+word+'" data-kind="word"','primary')+btn('◖)) Blend the sounds','audio','data-word="'+word+'" data-kind="blend"')+'</div>'+
   (helpers?'<div class="bangla-helper"><p lang="bn"><b>'+escape(familyWords[word].approx)+'</b> · '+escape(familyWords[word].meaning)+'</p><div>'+btn('◖)) Bangla meaning','audio','data-word="'+word+'" data-kind="meaning"')+btn('◖)) Bangla pronunciation','audio','data-word="'+word+'" data-kind="approx"')+'</div><small>Bangla pronunciation is a helper. Listen to the English word, too.</small></div>':'');
 }
 function sounds(word){
  return '<div class="blend-row" aria-label="Sounds in '+word+'">'+[...word].map((c,i)=>'<button class="blend-sound '+(i?'family-ending':'')+'" data-action="family-audio" data-kind="sound" data-word="'+word+'" data-index="'+i+'" aria-label="Hear the sound for '+c+'">'+c+'</button>').join('<span class="blend-plus" aria-hidden="true">+</span>')+'<span class="blend-plus" aria-hidden="true">=</span>'+colouredWord(word)+'</div><p class="muted family-hint">Tap a letter to hear its sound. Then blend them together.</p>';
 }
 function navigation(board=false){
  return '<div class="lesson-head">'+btn(board?'← All word families':'← Learning path',board?'library':'home','','quiet')+'<div class="family-speed"><label for="family-speed">Listening speed</label><select id="family-speed"><option value="1" '+(getSpeed()===1?'selected':'')+'>Normal</option><option value="0.85" '+(getSpeed()===.85?'selected':'')+'>Slower</option></select></div></div>';
 }
 function library(){
  const p=getProgress(),saved=unfinishedRound(p);
  return navigation()+'<section class="intro"><div><div class="eyebrow">Word Adventurer · Start with sounds</div><h1>Little words. Big discoveries.</h1><p class="muted">Explore a picture family. Listen in English, use Bangla help, then try a short lesson.</p></div></section>'+
   (saved?'<div class="family-resume"><div><b>Your -'+saved.family+' lesson is waiting.</b><p>Round '+saved.number+' · Activity '+(p.inProgress[saved.id].step+1)+' of '+familyStages(saved).length+'</p></div>'+btn('Continue picture lesson →','resume','','primary')+'</div>':'')+
   '<div class="family-library">'+pictureFamilies.map(f=>{
    const count=roundsDone(f.id,p),total=roundsFor(f.id).length;
    return '<button class="family-card theme-'+f.colour+'" data-action="family-open" data-family="'+f.id+'" aria-label="Explore the -'+f.id+' word family">'+picture(f.words[0])+'<span class="family-card-ending">-'+f.id+'</span><span>'+f.words.slice(0,3).join(' · ')+'</span><small>'+f.words.length+' picture words · '+count+'/'+total+' rounds '+(count===total?'★':'')+'</small></button>';
   }).join('')+'</div><div class="family-parent-note"><b>Start together.</b> Knowing how to write letters is a good start. Help him hear their sounds before asking him to read. Up to three new words are enough for one sitting.</div>';
 }
 function board(){
  const family=familyOf(familyId),p=getProgress(),rounds=roundsFor(familyId);
  return navigation(true)+'<section class="family-board theme-'+family.colour+'"><div class="eyebrow">Listen · Say · Build</div><h1>The <span class="family-ending">-'+family.id+'</span> word family</h1><p class="lead">Different beginnings. The same ending. Choose a picture to explore.</p><div class="family-board-layout"><div class="family-board-main"><div class="family-spotlight">'+picture(selected)+colouredWord(selected)+'</div>'+sounds(selected)+listening(selected)+'</div><div class="family-picker" role="group" aria-label="Picture words in the -'+family.id+' family">'+family.words.map(word=>'<button class="family-pick '+(word===selected?'selected':'')+'" data-action="family-word" data-word="'+word+'" aria-pressed="'+(word===selected)+'" aria-label="Explore '+word+'">'+picture(word)+colouredWord(word)+'</button>').join('')+'</div></div></section>'+
   '<section class="family-rounds"><div class="section-heading"><h2>Try a short lesson</h2><span>Up to three words at a time</span></div><div class="family-round-grid">'+rounds.map(round=>{
    const saved=p.inProgress[round.id],done=p.completed.includes(round.id);
    return '<button class="family-round" data-action="family-'+(saved?'resume':'start')+'" data-round="'+round.id+'"><span>ROUND '+round.number+' '+(done?'★':'')+'</span><b>'+round.items.join(' · ')+'</b><small>'+(saved?'Continue · Activity '+(saved.step+1):'Pictures → build → listen & find')+'</small></button>';
   }).join('')+'</div></section>'+
   (family.poster?'<details class="family-poster"><summary>See your original picture chart</summary><img src="'+family.poster+'" alt="The supplied -'+family.id+' picture word-family chart" loading="lazy"></details>':'')+
   '<p id="audio-status" class="status"></p>';
 }
 function prepare(){
  const stage=familyStages(session.round)[session.step],family=familyOf(session.round.family);
  session.tiles=stage.type==='build'?shuffle([...stage.item]):[];
  session.placed=[];session.answer=null;session.choices=stage.type==='match'?shuffle([stage.item,...shuffle(family.words.filter(w=>w!==stage.item)).slice(0,2)]):[];
 }
 function solved(){
  const stage=familyStages(session.round)[session.step];
  return stage.type==='build'?session.placed.length===3&&session.placed.map(i=>session.tiles[i]).join('')===stage.item:stage.type==='match'?session.answer===stage.item:true;
 }
 function start(id,resume=false){
  const round=familyRounds.find(r=>r.id===id);if(!round)return;
  stopAudio();familyId=round.family;
  const saved=resume?getProgress().inProgress[id]:null;
  session={round,step:saved?.step||0};
  page='lesson';prepare();
  if(saved){
   if(saved.tiles.length){session.tiles=[...saved.tiles];session.placed=[...saved.placed];}
   if(saved.choices.length)session.choices=[...saved.choices];
   session.answer=saved.answer;
  }
  checkpoint();render();
 }
 function lesson(){
  const round=session.round,stages=familyStages(round),stage=stages[session.step],word=stage.item;
  const correct=solved(),attempt=stage.type==='build'?session.placed.length===3:stage.type==='match'?session.answer!==null:false;
  let content='';
  if(stage.type==='learn'){
   content='<div class="eyebrow">Meet a picture word · '+(round.items.indexOf(word)+1)+' of '+round.items.length+'</div><h1>Look, listen, and say it.</h1><div class="family-lesson-picture">'+picture(word)+'</div>'+sounds(word)+listening(word)+'<details class="parent-cue"><summary>Parent prompt</summary><p>'+escape(partPrompt(word))+'</p><p>Ask him to point to the picture and say the English word. Use the Bangla meaning if the picture is unfamiliar.</p></details>';
  }else if(stage.type==='build'){
   const placed=session.placed.map(i=>session.tiles[i]).join('');
   content='<div class="eyebrow">Build a word</div><h1>Can you build the word?</h1><p class="lead">Look at the picture, listen, then tap the letters in order.</p><div class="family-lesson-picture small">'+picture(word)+'</div>'+listening(word,false)+
    '<div class="slots" aria-label="Your word: '+(placed||'empty')+'">'+[...word].map((_,i)=>'<span class="slot '+(placed[i]?'filled':'')+'">'+(placed[i]||'')+'</span>').join('')+'</div><div class="choices letter-choices">'+session.tiles.map((c,i)=>'<button class="tile" data-action="family-tile" data-index="'+i+'" aria-label="Letter '+c+'" '+(session.placed.includes(i)||correct?'disabled':'')+'>'+c+'</button>').join('')+'</div>'+
    (correct?'':btn('Try the letters again','undo'))+'<details class="parent-cue"><summary>Parent prompt</summary><p>The word is '+word+'. Say its sounds, then let him try the letters. '+escape(partPrompt(word))+'</p></details>';
  }else{
   content='<div class="eyebrow">Listen & find</div><h1>Which picture word do you hear?</h1><p class="lead">Listen in English, then choose the matching picture and word.</p><div class="family-listening">'+btn('◖)) Hear the word','audio','data-word="'+word+'" data-kind="word"','primary')+'</div><div class="family-match-choices">'+session.choices.map(choice=>'<button class="family-choice '+(attempt&&choice===session.answer?(correct?'correct':'retry'):'')+'" data-action="family-answer" data-word="'+choice+'" '+(correct?'disabled':'')+'>'+picture(choice)+colouredWord(choice)+'</button>').join('')+'</div><details class="parent-cue"><summary>Parent prompt</summary><p>Say '+word+' if audio is unavailable. Give him time to look and sound out the choices.</p></details>';
  }
  const message=attempt?(correct?(stage.type==='build'?'You built it! Say your word.':'Yes! You found it.'):'Good try. Listen again and have another go.'):'';
  return '<div class="lesson-head">'+btn('← Picture family','back','','quiet')+'<div class="lesson-meta">The -'+round.family+' family · Round '+round.number+'<br>Activity '+(session.step+1)+' of '+stages.length+'<br><span id="save-status">'+(isSaved()?'Saved automatically':'Progress not saved')+'</span></div></div>'+
   '<div class="steps" aria-label="Activity '+(session.step+1)+' of '+stages.length+'">'+stages.map((_,i)=>'<span class="step '+(i<=session.step?'done':'')+'"></span>').join('')+'</div><section class="activity family-activity theme-'+familyOf(round.family).colour+'">'+content+'<p class="feedback '+(attempt&&!correct?'retry-text':'')+'" role="status">'+message+'</p><div class="activity-actions">'+(correct?btn(session.step===stages.length-1?'Finish this round ★':'Next →','next','','primary'):'')+'</div><p id="audio-status" class="status"></p></section>';
 }
 function partPrompt(word){
  return 'Use the first sound in '+word+', then blend it with '+word.slice(1)+'. Keep consonants short without adding “uh”. The sound buttons play sounds, not letter names.';
 }
 function complete(){
  const next=roundsFor(session.round.family).find(r=>!getProgress().completed.includes(r.id));
  return navigation(true)+'<section class="activity"><div class="complete-star" aria-hidden="true">🌟</div><div class="eyebrow">Picture round complete</div><h1>You built little words!</h1><p class="lead">We practised '+session.round.items.join(', ')+'. Your round star is saved.</p><div class="family-complete-pictures">'+session.round.items.map(w=>'<div>'+picture(w)+colouredWord(w)+'</div>').join('')+'</div><p class="muted">Try one word with a toy or something at home. This is a good time for a break.</p><div class="activity-actions">'+btn('Back to this family','back','','primary')+(next?btn('Try the next round →','start','data-round="'+next.id+'"'):'')+'</div></section>';
 }
 return {
  showLibrary(){stopAudio();page='library';},
  checkpoint,
  html(){return page==='board'?board():page==='lesson'?lesson():page==='complete'?complete():library();},
  handle(data){
   const action=data.action.replace('family-',''),p=getProgress();
   if(action==='home'){stopAudio();onHome();return;}
   if(action==='library'){stopAudio();page='library';render();return;}
   if(action==='open'){
    const family=familyOf(data.family);if(!family)return;
    stopAudio();familyId=family.id;selected=p.selected[familyId]||family.words[0];p.lastFamily=familyId;page='board';persist();render();
   }else if(action==='word'){
    if(!familyOf(familyId)?.words.includes(data.word))return;
    stopAudio();selected=data.word;p.selected[familyId]=selected;persist();render(false);audio(selected,'word');
   }else if(action==='back'){
    stopAudio();page='board';selected=p.selected[familyId]||familyOf(familyId).words[0];persist();render();
   }else if(action==='start')start(data.round);
   else if(action==='resume')start(data.round||unfinishedRound(p)?.id,true);
   else if(action==='audio')audio(data.word,data.kind,Number(data.index));
   else if(action==='tile'&&page==='lesson'&&familyStages(session.round)[session.step].type==='build'){
    const index=Number(data.index);
    if(!Number.isInteger(index)||index<0||index>=3||solved()||session.placed.includes(index))return;
    session.placed.push(index);checkpoint();render(false);
    document.querySelector(solved()?'[data-action="family-next"]':session.placed.length===3?'[data-action="family-undo"]':'.tile:not(:disabled)')?.focus({preventScroll:true});
   }else if(action==='undo'&&page==='lesson'){session.placed=[];checkpoint();render(false);}
   else if(action==='answer'&&page==='lesson'&&familyStages(session.round)[session.step].type==='match'){
    if(solved()||!session.choices.includes(data.word))return;
    session.answer=data.word;checkpoint();render(false);
    document.querySelector(solved()?'[data-action="family-next"]':'.family-choice.retry')?.focus({preventScroll:true});
   }else if(action==='next'&&page==='lesson'){
    if(!solved())return;
    stopAudio();
    if(session.step===familyStages(session.round).length-1){
     if(!p.completed.includes(session.round.id))p.completed.push(session.round.id);
     delete p.inProgress[session.round.id];
     if(p.current===session.round.id)p.current=null;
     page='complete';persist();
    }else{session.step++;prepare();checkpoint();}
    render();
   }
  }
 };
}
