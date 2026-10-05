// Automatic lesson narration: when a lesson step opens, every narrated line is
// read in reading order, English first and then its Bangla translation. It plays
// once per step entry. Re-renders, drags and answers never restart it; Replay
// deliberately restarts the whole sequence.
//
// Flows mark up a step with  data-narration-step="<unique step key>"  and each
// line with narrationLine(...) below. render() in app.js calls syncNarration().
//
// Building blocks:
//  narrationLine(english,{bn,key,parts,bnKey,...})  one line; Bangla shown under it
//  narrationParagraph(lines,...)  a story paragraph: all English lines, then the
//                                 whole Bangla paragraph
//  narrationCue(parts)            clips that belong to the step but have no line
//                                 of text (a quiz word, a letter name)
//  narrationExtra(stepKey,fn)     a flow's own sequence (alphabet A–Z, spelling)
//                                 played after the lines, with its own callbacks
import {playStageSequence,toggleStagePause,stopStageAudio,stageClip,stageAudioState,onStageStop} from './stage-audio.js';
import {banglaLines} from './bangla-lines.js';

const STORE='little-english-narration-v1';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
let enabled=true,getSpeed=()=>1,lastStep=null,state='idle',message='',missing=[],ticket=0,starting=false;
const extras=new Map();
// Another sound or a Stop button ended our narration: show Replay again.
onStageStop(()=>{if(!starting&&(state==='playing'||state==='paused')){state='done';message=missingNote()||'Tap Replay to hear it again.';bar();}});
try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved?.version===1&&typeof saved.enabled==='boolean')enabled=saved.enabled;}catch{}

// Bangla for an English line: the lesson's own translation first, then the
// shared translation table. Returns '' when no translation exists.
export function banglaFor(english,given=''){return given||banglaLines[english]||'';}

// One narrated line.
//  key    English clip (default text:<english>)
//  parts  [{key,target?}] English clips to play instead of key ([] = no English audio)
//  bnKey  an existing Bangla clip to use instead of bn:<bangla>
//  html   inner markup when the line needs its own spans (otherwise the text)
//  bnRef  the Bangla is shown elsewhere with narrationBangla(text,{ref}) instead of under the line
export function narrationLine(english,{bn='',key='',parts=null,bnKey='',bnRef='',tag='p',cls='sentence',showBangla=true,extra='',html=''}={}){
 const bangla=banglaFor(english,bn);if(bnRef){showBangla=false;extra=(extra?extra+' ':'')+'data-bn-group="'+esc(bnRef)+'" data-bn-index="0"';}
 return '<'+tag+' class="'+cls+' narration-line" lang="en" data-narrate="en" data-en="'+esc(english)+'"'+(key?' data-key="'+esc(key)+'"':'')+(parts?' data-parts="'+esc(JSON.stringify(parts))+'"':'')+(bangla?' data-bn="'+esc(bangla)+'"':'')+(bnKey?' data-bn-key="'+esc(bnKey)+'"':'')+(extra?' '+extra:'')+'>'+(html||esc(english))+'</'+tag+'>'+
  (bangla&&showBangla?'<p class="narration-bangla" lang="bn" data-narrate="bn">'+esc(bangla)+'</p>':'');
}
// The Bangla of a line marked with bnRef, placed wherever the layout needs it.
export const narrationBangla=(text,{ref,cls='narration-bangla',tag='p'})=>text?'<'+tag+' class="'+cls+'" lang="bn" data-narrate="bn" data-bn-group="'+esc(ref)+'" data-bn-index="0">'+esc(text)+'</'+tag+'>':'';
// A paragraph of story lines. The English stays one paragraph; the complete
// Bangla paragraph follows it and is read after all the English lines.
// lines: [{en, bn?, key?, parts?, html?, attrs?}]
export function narrationParagraph(lines,{group='p',cls='story-paragraph',lineCls='story-line',label='Story paragraph'}={}){
 const bn=lines.map(l=>banglaFor(l.en,l.bn));
 return '<div class="'+cls+'" aria-label="'+esc(label)+'">'+lines.map((l,i)=>narrationLine(l.en,{bn:bn[i],key:l.key||'',parts:l.parts||null,tag:'span',cls:lineCls,showBangla:false,html:l.html||'',extra:'data-line="'+i+'" data-bn-group="'+group+'" data-bn-index="'+i+'"'+(l.attrs?' '+l.attrs:'')})).join(' ')+'</div>'+
  (bn.some(Boolean)?'<p class="narration-bangla narration-bangla-paragraph" lang="bn">'+bn.map((b,i)=>b?'<span data-narrate="bn" data-bn-group="'+group+'" data-bn-index="'+i+'">'+esc(b)+'</span>':'').filter(Boolean).join(' ')+'</p>':'');
}
// Clips that are part of the step but are not a line of text, e.g. the word
// a listening question asks for. parts: [{key,target?}]
export const narrationCue=parts=>'<span hidden data-narrate="cue" data-parts="'+esc(JSON.stringify(parts))+'"></span>';
// A flow's own audio sequence, played after the narrated lines of that step.
// fn({replay}) returns {parts,onPart?,onActive?,onEnd?} or null.
export function narrationExtra(stepKey,fn){extras.set(stepKey,fn);}
// Placeholder for the Replay / Pause bar. Flows put it where their old Listen button was.
export const narrationControls=()=>'<div class="narration-bar" data-narration-controls></div>';

export function initNarration(options){getSpeed=options.getSpeed||getSpeed;}
export const narrationEnabled=()=>enabled;
export function setNarrationEnabled(value){enabled=!!value;try{localStorage.setItem(STORE,JSON.stringify({version:1,enabled}));}catch{}}

// English clip for a line: its own key, or an older recording of the same text.
function resolve(key,english){if(stageClip(key))return key;if(key==='text:'+english&&stageClip('legacy:'+english))return 'legacy:'+english;return null;}
const parse=json=>{try{const v=JSON.parse(json);return Array.isArray(v)?v.filter(p=>p&&typeof p.key==='string'):[];}catch{return [];}};

// Builds the play queue from the lines currently on screen, in document order.
export function narrationQueue(root=document){
 const step=root.querySelector('[data-narration-step]');if(!step)return {parts:[],missing:[]};
 const parts=[],gaps=[];let n=0,group=null,pending=[];
 const flush=()=>{parts.push(...pending);pending=[];group=null;};
 step.querySelectorAll('[data-narrate="en"],[data-narrate="cue"]').forEach(line=>{
  if(line.dataset.narrate==='cue'){flush();for(const p of parse(line.dataset.parts)){if(stageClip(p.key))parts.push({pauseAfter:260,...p});else gaps.push({lang:'en',text:p.key,key:p.key});}return;}
  const g=line.dataset.bnGroup||null;if(g!==group)flush();group=g;
  const id=String(n++),english=line.dataset.en,bangla=line.dataset.bn||'';
  line.dataset.narrateId=id;const self='[data-narrate="en"][data-narrate-id="'+id+'"]';
  const bnEl=g?step.querySelector('[data-narrate="bn"][data-bn-group="'+g+'"][data-bn-index="'+line.dataset.bnIndex+'"]'):line.nextElementSibling?.dataset.narrate==='bn'?line.nextElementSibling:null;
  if(bnEl)bnEl.dataset.narrateId=id;
  if(line.dataset.parts!==undefined){
   for(const p of parse(line.dataset.parts)){if(stageClip(p.key))parts.push({target:self,pauseAfter:260,...p});else gaps.push({lang:'en',text:english,key:p.key});}
  }else{
   const key=line.dataset.key||'text:'+english,clip=resolve(key,english);
   // Sentences get word highlights from their own timings; other lines light up whole.
   const words=(line.matches('.sentence,.story-sentence,.story-line')||line.querySelector('[data-spoken-text]'))&&clip==='text:'+english;
   if(clip)parts.push({key:clip,text:english,...(words?{}:{target:self}),...(words&&line.dataset.line!==undefined&&g?{line:Number(line.dataset.line)}:{}),pauseAfter:260});
   else gaps.push({lang:'en',text:english,key});
  }
  if(bangla){
   const own=line.dataset.bnKey,bnKey=own&&stageClip(own)?own:'bn:'+bangla,target=bnEl?'[data-narrate="bn"][data-narrate-id="'+id+'"]':self;
   if(stageClip(bnKey))(g?pending:parts).push({key:bnKey,text:bangla,target,pauseAfter:420});
   else gaps.push({lang:'bn',text:bangla});
  }else gaps.push({lang:'bn-translation',text:english});
 });
 flush();
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

function play(replay=false){
 const {parts:lines,missing:gaps}=narrationQueue();missing=gaps;const mine=++ticket;
 let extra=null;try{extra=extras.get(lastStep)?.({replay})||null;}catch{extra=null;}
 const own=(extra?.parts||[]).filter(p=>{if(stageClip(p.key))return true;missing.push({lang:'en',text:p.key,key:p.key});return false;}).map(p=>({...p,narrationExtra:true}));
 const parts=[...lines,...own];
 if(!parts.length){state='idle';message=missingNote()||'';bar();return;}
 state='playing';message=missingNote();bar();
 starting=true;try{playStageSequence(parts,{speed:getSpeed(),
  onPart:(part,i)=>{if(mine===ticket&&part.narrationExtra)extra?.onPart?.(part,i);},
  onActive:(part,active)=>{if(mine===ticket&&part.narrationExtra)extra?.onActive?.(part,active);},
  onState:s=>{if(mine!==ticket)return;state=s.playing?(s.paused?'paused':'playing'):state;bar();},
  onEnd:()=>{if(mine!==ticket)return;state='done';message=missingNote()||'Tap Replay to hear it again.';bar();if(own.length)extra?.onEnd?.();},
  onError:(text,error)=>{if(mine!==ticket)return;
   // Browsers block sound until the page has been tapped: offer one clear start button.
   if(error?.name==='NotAllowedError'){state='blocked';message='Tap Start lesson to hear the lesson.';}
   else{state='failed';message='The lesson audio could not play. Check the connection, then tap Replay.';}
   extra?.onError?.();bar();}});}finally{starting=false;}
}

// Called after every render. Starts narration once when a new step appears.
export function syncNarration(root=document){
 const step=root.querySelector('[data-narration-step]');
 if(!step){if(lastStep!==null){lastStep=null;ticket++;state='idle';message='';}extras.clear();return;}
 const key=step.dataset.narrationStep;
 if(key!==lastStep){lastStep=key;for(const k of [...extras.keys()])if(k!==key)extras.delete(k);ticket++;state='idle';message='';missing=[];if(enabled)play();else{message='Automatic reading is off. Tap Replay to listen.';}}
 else narrationQueue(root);// re-tag the fresh DOM so highlights keep working
 bar();
}
export function handleNarration(action){
 if(action==='narration-replay')play(true);
 else if(action==='narration-start')play();
 else if(action==='narration-pause'&&(state==='playing'||state==='paused')){toggleStagePause();state=stageAudioState().paused?'paused':'playing';bar();}
}
export function stopNarration(){ticket++;if(state==='playing'||state==='paused')stopStageAudio();state='idle';bar();}
// True while the narration sequence of the current step is playing or paused.
export const narrationActive=()=>state==='playing'||state==='paused';
