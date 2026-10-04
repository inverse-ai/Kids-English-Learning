import {alphabet} from './stage-data.js';
import {spellingParts,spellingIntroText} from './spelling-data.js';
import {playStageSequence,stopStageAudio,toggleStagePause,stageAudioState} from './stage-audio.js';

const button=(label,action,attributes='',classes='')=>'<button class="btn '+classes+'" data-action="stages-spelling-'+action+'" '+attributes+'>'+label+'</button>';
export function createSpellingFlow({getProgress,save,isSaved,render,status,picture,getSpeed}){
 const state=()=>getProgress();
 const label=()=>alphabet[state().letter].letter.toUpperCase()+alphabet[state().letter].letter;
 function clearHighlights(){document.querySelectorAll('.spelling-player .playing,.spelling-player .whole-word').forEach(el=>el.classList.remove('playing','whole-word'));document.querySelectorAll('.spelling-letter[aria-current]').forEach(el=>el.removeAttribute('aria-current'));}
 function sync(){const audio=stageAudioState(),control=document.querySelector('[data-action="stages-spelling-pause"]');if(control){control.disabled=!audio.playing;control.textContent=audio.paused?'Resume':'Pause';control.setAttribute('aria-pressed',String(audio.paused));}}
 function clear(){clearHighlights();sync();}
 function play(replay=false){
  stopStageAudio();clear();const progress=state(),letter=alphabet[progress.letter].letter;
  if(replay)progress.position=0;
  const start=progress.position,speed=getSpeed();save();
  // Keep saved positions in the original spelling sequence. Introductory clips
  // do not add checkpoint positions; each repeated letter is still its own clip.
  const parts=spellingParts(progress.letter).slice(start).flatMap((part,index)=>{
   const position=start+index,word=alphabet[progress.letter].examples[part.example];
   const spoken={...part,checkpoint:position,...(speed===1?{key:'spelling-brisk-'+part.key,...(!part.wholeWord?{pauseAfter:55}:{})}:{})};
   return part.letterIndex===0?[{key:'spelling-intro:'+letter+':'+word,spellingIntro:true,introLetter:letter,introWord:word,example:part.example,phase:spellingIntroText(letter,word),checkpoint:position,pauseAfter:180},spoken]:[spoken];
  });
  playStageSequence(parts,{speed,onPart:(part)=>{
   progress.position=part.checkpoint;save();clearHighlights();
   const phase=document.querySelector('#spelling-phase');if(phase)phase.textContent=part.phase;
  },onActive:(part,active)=>{
   clearHighlights();if(!active)return;
   const example=document.querySelector('.spelling-example[data-example="'+part.example+'"]');example?.classList.add('playing');
   if(part.wholeWord)example?.querySelector('.spelling-word').classList.add('whole-word');
   else{const letter=example?.querySelector('[data-letter-index="'+part.letterIndex+'"]');letter?.classList.add('playing');letter?.setAttribute('aria-current','true');}
  },onState:sync,onEnd:()=>{
   clear();progress.position=0;if(!progress.done.includes(letter))progress.done.push(letter);save();
   const phase=document.querySelector('#spelling-phase');if(phase)phase.textContent='Ready to replay';
   status(isSaved()?'Spelling practice saved.':'Spelling finished. Progress could not be saved yet.');
  },onError:message=>{clear();status(message);}});
 }
 function intro(){
  const a=alphabet[state().letter];
  return '<section class="spelling-intro"><div><div class="eyebrow">Start here · Spelling practice</div><h2>Spell picture words.</h2><p>Say each letter name, then the word. Use letter sounds to practise reading afterward.</p><div class="spelling-preview">'+a.examples.map(word=>'<div>'+picture(word,true)+'<b>'+word+'</b></div>').join('')+'</div></div>'+button(state().position>0?'Continue spelling →':'Start spelling →','open','','primary')+'<small>'+label()+' picture words · '+state().done.length+' / 26 practised</small></section>';
 }
 function html(){
  const progress=state(),a=alphabet[progress.letter];
  return '<section class="activity spelling-player"><div class="eyebrow">Words · Suggested age 5+</div><h1>Spelling practice</h1><p class="spelling-guide">Say the letter names.</p><div class="spelling-letter-heading" aria-label="'+label()+'"><span data-case="upper">'+a.letter.toUpperCase()+'</span><span data-case="lower">'+a.letter+'</span></div><div class="spelling-examples">'+a.examples.map((word,example)=>'<div class="spelling-example" data-example="'+example+'">'+picture(word)+'<p class="spelling-word" aria-label="'+word+'">'+[...word].map((letter,i)=>'<span class="spelling-letter" data-letter-index="'+i+'" aria-hidden="true">'+letter+'</span>').join('')+'</p></div>').join('')+'</div><div class="spelling-controls">'+button('Replay','replay','','primary')+button('Pause','pause','disabled aria-pressed="false"')+'</div><p id="spelling-phase" class="spelling-phase" role="status">Ready to spell</p><p id="audio-status" class="status"></p><div class="spelling-paging">'+button('← Previous','next','data-index="'+(progress.letter-1)+'" '+(progress.letter===0?'disabled':''))+'<span>'+(progress.letter+1)+' / 26</span>'+button('Next →','next','data-index="'+(progress.letter+1)+'" '+(progress.letter===25?'disabled':''))+'</div><div class="spelling-reading">'+button('Sound blending lessons →','blend')+'</div><p class="spelling-saved"><span id="save-status">'+(isSaved()?'Saved automatically':'Progress not saved')+'</span></p></section>';
 }
 return {intro,html,clear,open(autoplay=true){render();if(autoplay)play();},handle(data){
  const action=data.action.replace('stages-spelling-','');
  if(action==='replay')play(true);
  else if(action==='pause')toggleStagePause();
  else if(action==='next'){
   const index=Number(data.index);if(!Number.isInteger(index)||index<0||index>=alphabet.length)return;
   stopStageAudio();clear();state().letter=index;state().position=0;save();render();play();
  }
 }};
}
