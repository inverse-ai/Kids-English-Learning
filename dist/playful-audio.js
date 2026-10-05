import {stageClip,playStageSequence,stopStageAudio,toggleStagePause} from './stage-audio.js';
import {playLessonAudio,stopLessonAudio,toggleLessonPause} from './lesson-audio.js';
// Recorded phonemes always keep their existing source. New prose may use the
// parent's selected local voice; boundaries come from that voice, never timers.
export function createPlayfulAudio({getSpeed,getVoice,status}){
 let token=0,mode=null,playing=false,paused=false;
 const controls=()=>document.querySelectorAll('[data-action=playful-pause]').forEach(b=>{b.disabled=!playing;b.textContent=paused?'Resume':'Pause';b.setAttribute('aria-pressed',String(paused));});
 function stop(){token++;stopStageAudio();stopLessonAudio();mode=null;playing=false;paused=false;controls();}
 function play(parts){stop();const ticket=token;let index=0;
  function next(){if(ticket!==token)return;const part=parts[index++];if(!part){playing=false;paused=false;controls();return;}
   const text=part.text||part.key?.replace(/^(text:|word:)/,'');const key=stageClip(part.key)?part.key:stageClip('text:'+text)?'text:'+text:stageClip('legacy:'+text)?'legacy:'+text:null;
   if(key){mode='stage';playStageSequence([{...part,key,pauseAfter:80}],{speed:getSpeed(),onState:s=>{playing=s.playing;paused=s.paused;controls();},onEnd:next,onError:message=>{playing=false;controls();status(message);}});}
   else if(text&&!/A[‘']udhu|billahi min|shaytan/i.test(text)&&!part.key?.startsWith('sound:')){mode='lesson';playing=true;controls();playLessonAudio(text,{voice:getVoice(),speed:getSpeed()},(message,failed)=>{status(message);if(failed){playing=false;controls();}else if(message==='Ready to listen again.')next();});}
   else{playing=false;controls();status('This audio is unavailable. A parent can read this prompt. Existing sound and Arabic recordings are never replaced with an English voice.');}
  }next();
 }
 function pause(){if(!playing)return;paused=!paused;if(mode==='stage')toggleStagePause();else toggleLessonPause();controls();}
 return{play,stop,pause};
}
