import {stageSpeech} from './stage-speech.js';
import {recordedSpeech} from './recorded-speech.js';
import {familySpeech} from './family-speech.js';
import {stopLessonAudio} from './lesson-audio.js';
import {watchAudioHighlights,clearSpeechHighlights} from './speech-highlights.js';
let stopHighlights=()=>{};
let ticket=0,current=null,queue=[],position=0,paused=false,playing=false,callbacks={},timer=null,waitUntil=0,remainingWait=0;
export function stageClip(key){return stageSpeech[key]||familySpeech[key]||(key.startsWith('legacy:')?recordedSpeech[key.slice(7)]:undefined);}
export function stopStageAudio(){
 stopHighlights();stopHighlights=()=>{};clearSpeechHighlights();
 ticket++;clearTimeout(timer);timer=null;waitUntil=0;remainingWait=0;paused=false;playing=false;queue=[];
 if(current){current.pause();current.removeAttribute('src');current.load();current=null;}
 callbacks={};
}
export function stageAudioState(){return {playing,paused,position};}
export function playStageSequence(parts,{speed=1,onPart=()=>{},onActive=()=>{},onState=()=>{},onEnd=()=>{},onError=()=>{}}={}){
 stopStageAudio();stopLessonAudio();queue=parts;position=0;playing=true;
 callbacks={speed,onPart,onActive,onState,onEnd,onError};const version=ticket;
 function fail(){if(version!==ticket)return;stopHighlights();playing=false;paused=false;current?.pause();callbacks.onState(stageAudioState());callbacks.onError('Audio could not play. Replay, or read the picture words together.');}
 function next(){
  if(version!==ticket||paused||!playing)return;
  timer=null;waitUntil=0;remainingWait=0;
  stopHighlights();stopHighlights=()=>{};
  if(position>=queue.length){playing=false;current=null;callbacks.onState(stageAudioState());callbacks.onEnd();return;}
  const part=queue[position],clip=stageClip(part.key);if(!clip){fail();return;}
  const audio=new Audio(clip);current=audio;audio.playbackRate=speed;audio.preservesPitch=true;
  stopHighlights=watchAudioHighlights(audio,clip,part,active=>{if(version===ticket)callbacks.onActive(part,active);});
  audio.addEventListener('error',fail,{once:true});
  audio.addEventListener('ended',()=>{if(version!==ticket||!playing)return;current=null;position++;remainingWait=part.pauseAfter??180;waitUntil=performance.now()+remainingWait;timer=setTimeout(next,remainingWait);},{once:true});
  callbacks.onPart(part,position);callbacks.onState(stageAudioState());
  try{audio.play().catch(error=>{if(version===ticket&&!paused&&current===audio)fail(error);});}catch{fail();}
 }
 callbacks.next=next;next();
}
export function toggleStagePause(){
 if(!playing)return;
 paused=!paused;
 if(paused){if(timer!==null)remainingWait=Math.max(0,waitUntil-performance.now());clearTimeout(timer);timer=null;current?.pause();}
 else if(current){const version=ticket,audio=current;current.play().catch(()=>{if(version!==ticket||current!==audio)return;stopHighlights();playing=false;paused=false;callbacks.onState?.(stageAudioState());callbacks.onError?.('Audio could not resume. Please use Replay.');});}
 else if(remainingWait>0){waitUntil=performance.now()+remainingWait;timer=setTimeout(callbacks.next,remainingWait);}
 else callbacks.next?.();
 callbacks.onState?.(stageAudioState());
}
