import {stageSpeech} from './stage-speech.js';
import {familySpeech} from './family-speech.js';
import {stopLessonAudio} from './lesson-audio.js';
let ticket=0,current=null,queue=[],position=0,paused=false,playing=false,callbacks={},timer=null;
export function stageClip(key){return stageSpeech[key]||familySpeech[key];}
export function stopStageAudio(){
 ticket++;clearTimeout(timer);timer=null;paused=false;playing=false;queue=[];
 if(current){current.pause();current.removeAttribute('src');current.load();current=null;}
 callbacks={};
}
export function stageAudioState(){return {playing,paused,position};}
export function playStageSequence(parts,{speed=1,onPart=()=>{},onState=()=>{},onEnd=()=>{},onError=()=>{}}={}){
 stopStageAudio();stopLessonAudio();queue=parts;position=0;playing=true;
 callbacks={speed,onPart,onState,onEnd,onError};const version=ticket;
 function fail(){if(version!==ticket)return;playing=false;paused=false;current?.pause();callbacks.onState(stageAudioState());callbacks.onError('Audio could not play. Replay, or read the picture words together.');}
 function next(){
  if(version!==ticket||paused||!playing)return;
  if(position>=queue.length){playing=false;current=null;callbacks.onState(stageAudioState());callbacks.onEnd();return;}
  const part=queue[position],clip=stageClip(part.key);if(!clip){fail();return;}
  const audio=new Audio(clip);current=audio;audio.playbackRate=speed;audio.preservesPitch=true;
  audio.addEventListener('error',fail,{once:true});
  audio.addEventListener('ended',()=>{if(version!==ticket||!playing)return;current=null;position++;timer=setTimeout(next,180);},{once:true});
  callbacks.onPart(part,position);callbacks.onState(stageAudioState());
  try{audio.play().catch(error=>{if(version===ticket&&!paused&&current===audio)fail(error);});}catch{fail();}
 }
 callbacks.next=next;next();
}
export function toggleStagePause(){
 if(!playing)return;
 paused=!paused;
 if(paused){clearTimeout(timer);timer=null;current?.pause();}
 else if(current){const version=ticket,audio=current;current.play().catch(()=>{if(version!==ticket||current!==audio)return;playing=false;paused=false;callbacks.onState?.(stageAudioState());callbacks.onError?.('Audio could not resume. Please use Replay.');});}
 else callbacks.next?.();
 callbacks.onState?.(stageAudioState());
}
