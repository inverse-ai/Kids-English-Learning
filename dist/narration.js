// Automatic lesson narration: when a lesson step opens, every narrated line is
// read in reading order, English first and then its Bangla translation. It plays
// once per step entry. Re-renders, drags and answers never restart it; Replay
// deliberately restarts the whole sequence.
//
// Flows mark up a step with  data-narration-step="<unique step key>"  and each
// line with narrationLine(...) below. render() in app.js calls syncNarration().
import {playStageSequence,toggleStagePause,stopStageAudio,stageClip,stageAudioState,onStageStop} from './stage-audio.js';
import {banglaLines} from './bangla-lines.js';

const STORE='little-english-narration-v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
let enabled=true,getSpeed=()=>1,lastStep=null,state='idle',message='',missing=[],ticket=0,starting=false;
// Another sound or a Stop button ended our narration: show Replay again.
onStageStop(()=>{if(!starting&&(state==='playing'||state==='paused')){state='done';message=missingNote()||'Tap Replay to hear it again.';bar();}});
try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved?.version===1&&typeof saved.enabled==='boolean')enabled=saved.enabled;}catch{}

// Bangla for an English line: the lesson's own translation first, then the
// shared translation table. Returns '' when no translation exists.
export function banglaFor(english,given=''){return given||banglaLines[english]||'';}

// One narrated line. `key` is the English clip key (default text:<english>).
// The English stays on screen; the Bangla translation is shown under it.
export function narrationLine(english,{bn='',key='',tag='p',cls='sentence',showBangla=true,extra=''}={}){
 const bangla=banglaFor(english,bn);
 return '<'+tag+' class="'+cls+' narration-line" lang="en" data-narrate="en" data-en="'+esc(english)+'"'+(key?' data-key="'+esc(key)+'"':'')+(bangla?' data-bn="'+esc(bangla)+'"':'')+(extra?' '+extra:'')+'>'+esc(english)+'</'+tag+'>'+
  (bangla&&showBangla?'<p class="narration-bangla" lang="bn" data-narrate="bn">'+esc(bangla)+'</p>':'');
}
// Placeholder for the Replay / Pause bar. Flows put it where their old Listen button was.
export const narrationControls=()=>'<div class="narration-bar" data-narration-controls></div>';

export function initNarration(options){getSpeed=options.getSpeed||getSpeed;}
export const narrationEnabled=()=>enabled;
export function setNarrationEnabled(value){enabled=!!value;try{localStorage.setItem(STORE,JSON.stringify({version:1,enabled}));}catch{}}

// Builds the play queue from the lines currently on screen, in document order.
export function narrationQueue(root=document){
 const step=root.querySelector('[data-narration-step]');if(!step)return {parts:[],missing:[]};
 const parts=[],gaps=[];let n=0;
 step.querySelectorAll('[data-narrate="en"]').forEach(line=>{
  const id=String(n++),english=line.dataset.en,key=line.dataset.key||'text:'+english,bangla=line.dataset.bn||'';
  line.dataset.narrateId=id;const bnEl=line.nextElementSibling?.dataset.narrate==='bn'?line.nextElementSibling:null;if(bnEl)bnEl.dataset.narrateId=id;
  // Sentences get word highlights from their own timings; other lines light up whole.
  const sentence=line.matches('.sentence,.story-sentence,.story-line');
  if(stageClip(key))parts.push({key,text:english,...(sentence&&key==='text:'+english?{}:{target:'[data-narrate="en"][data-narrate-id="'+id+'"]'}),pauseAfter:260});
  else gaps.push({lang:'en',text:english,key});
  if(bangla){const bnKey='bn:'+bangla;if(stageClip(bnKey))parts.push({key:bnKey,text:bangla,target:bnEl?'[data-narrate="bn"][data-narrate-id="'+id+'"]':'[data-narrate="en"][data-narrate-id="'+id+'"]',pauseAfter:420});else gaps.push({lang:'bn',text:bangla});}
  else gaps.push({lang:'bn-translation',text:english});
 });
 return {parts,missing:gaps};
}

function bar(){
 const el=document.querySelector('[data-narration-controls]');if(!el)return;
 const playing=state==='playing'||state==='paused';
 el.innerHTML=(state==='blocked'
   ?'<button class="btn primary narration-start" data-action="narration-start">▶ Start lesson</button>'
   :'<button class="btn narration-replay" data-action="narration-replay">↻ Replay</button><button class="btn" data-action="narration-pause" '+(playing?'':'disabled ')+'aria-pressed="'+(state==='paused')+'">'+(state==='paused'?'Resume':'Pause')+'</button>')+
  '<p class="narration-status" role="status">'+esc(message)+'</p>';
}
const missingNote=()=>{const bn=missing.filter(m=>m.lang==='bn').length,en=missing.filter(m=>m.lang==='en').length,tr=missing.filter(m=>m.lang==='bn-translation').length;
 return [en?en+' English line'+(en>1?'s are':' is')+' not recorded yet.':'',bn?'Bangla audio for '+bn+' line'+(bn>1?'s is':' is')+' not recorded yet.':'',tr?tr+' line'+(tr>1?'s have':' has')+' no Bangla translation yet.':''].filter(Boolean).join(' ');};

function play(){
 const {parts,missing:gaps}=narrationQueue();missing=gaps;const mine=++ticket;
 if(!parts.length){state='idle';message=missingNote()||'';bar();return;}
 state='playing';message=missingNote();bar();
 starting=true;try{playStageSequence(parts,{speed:getSpeed(),
  onState:s=>{if(mine!==ticket)return;state=s.playing?(s.paused?'paused':'playing'):state;bar();},
  onEnd:()=>{if(mine!==ticket)return;state='done';message=missingNote()||'Tap Replay to hear it again.';bar();},
  onError:(text,error)=>{if(mine!==ticket)return;
   // Browsers block sound until the page has been tapped: offer one clear start button.
   if(error?.name==='NotAllowedError'){state='blocked';message='Tap Start lesson to hear the lesson.';}
   else{state='failed';message='The lesson audio could not play. Check the connection, then tap Replay.';}
   bar();}});}finally{starting=false;}
}

// Called after every render. Starts narration once when a new step appears.
export function syncNarration(root=document){
 const step=root.querySelector('[data-narration-step]');
 if(!step){if(lastStep!==null){lastStep=null;ticket++;state='idle';message='';}return;}
 const key=step.dataset.narrationStep;
 if(key!==lastStep){lastStep=key;ticket++;state='idle';message='';missing=[];if(enabled)play();else{message='Automatic reading is off. Tap Replay to listen.';}}
 else narrationQueue(root);// re-tag the fresh DOM so highlights keep working
 bar();
}
export function handleNarration(action){
 if(action==='narration-replay'||action==='narration-start')play();
 else if(action==='narration-pause'&&(state==='playing'||state==='paused')){toggleStagePause();state=stageAudioState().paused?'paused':'playing';bar();}
}
export function stopNarration(){ticket++;if(state==='playing'||state==='paused')stopStageAudio();state='idle';bar();}
