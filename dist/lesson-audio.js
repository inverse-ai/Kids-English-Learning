import {recordedSpeech} from './recorded-speech.js';
import {familySpeech} from './family-speech.js';
import {stageSpeech} from './stage-speech.js';
import {watchAudioHighlights,watchSystemHighlights,clearSpeechHighlights} from './speech-highlights.js';
let sequence = 0;
let currentAudio = null;
let currentUtterance = null;
let stopHighlights=()=>{},lessonPlaying=false,lessonPaused=false,familyTimer=null,resumePart=null;
export function syncLessonAudioControls(){document.querySelectorAll('[data-action="audio-pause"]').forEach(control=>{control.disabled=!lessonPlaying;control.textContent=lessonPaused?'Resume':'Pause';control.setAttribute('aria-pressed',String(lessonPaused));});}
export function toggleLessonPause(){
 if(!lessonPlaying)return;lessonPaused=!lessonPaused;
 if(lessonPaused){clearTimeout(familyTimer);currentAudio?.pause();if(currentUtterance)speechSynthesis.pause();}
 else if(currentAudio){currentAudio.play().catch(()=>{stopLessonAudio();});}
 else if(currentUtterance)speechSynthesis.resume();
 else resumePart?.();
 syncLessonAudioControls();
}

export function stopLessonAudio() {
 stopHighlights();stopHighlights=()=>{};clearSpeechHighlights();clearTimeout(familyTimer);resumePart=null;lessonPlaying=false;lessonPaused=false;syncLessonAudioControls();
 sequence++;
 currentUtterance = null;
 if ('speechSynthesis' in window) speechSynthesis.cancel();
 const audio = currentAudio;
 currentAudio = null;
 if (audio) {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
 }
}

export function playLessonAudio(text, {voice, speed = 1, preferRecordings = true}, onStatus) {
 stopLessonAudio();
 const ticket = sequence;
 const report = (message, failed = false) => { if (ticket === sequence){if(failed||message==='Ready to listen again.')lessonPlaying=false;syncLessonAudioControls();onStatus(message, failed);} };
 const playSystem = (fallback = false) => {
  if (ticket !== sequence) return;
  if (!voice || !('speechSynthesis' in window)) {
   report('Audio is unavailable. Open the parent prompt and read it aloud together.', true);
   return;
  }
  const spoken = new SpeechSynthesisUtterance(text);
  currentUtterance = spoken;
  spoken.voice = voice;
  spoken.lang = voice.lang;
  spoken.rate = .92 * speed;
  spoken.pitch = 1;
  const highlights=watchSystemHighlights(spoken,text);stopHighlights=()=>highlights.stop();
  spoken.onstart = () => {if(ticket!==sequence)return;lessonPlaying=true;highlights.start();report(fallback ? 'Using this computer’s voice for this clip.' : 'Listen, then have a go together.');};
  spoken.onboundary = event=>{if(ticket===sequence&&!lessonPaused)highlights.boundary(event);};
  spoken.onend = () => {
   if (currentUtterance !== spoken) return;
   currentUtterance = null;
   stopHighlights();
   report('Ready to listen again.');
  };
  spoken.onerror = event => {
   if (currentUtterance !== spoken || ['canceled','interrupted'].includes(event.error)) return;
   currentUtterance = null;
   stopHighlights();
   report('Audio could not play. A parent can read the prompt aloud.', true);
  };
  try { speechSynthesis.speak(spoken); }
  catch { report('Audio could not play. A parent can read the prompt aloud.', true); }
 };
 const recording = recordedSpeech[text];
 if (!recording || (!preferRecordings && voice)) { playSystem(); return; }
 const audio = new Audio(recording);
 currentAudio = audio;
 audio.playbackRate = speed;
 audio.preservesPitch = true;
 lessonPlaying=true;
 const legacyLetter=text.match(/(?:The letter|Find the little letter) ([A-Z])/u)?.[1].toLowerCase();
 const slots=document.querySelector('.slots'),target=slots?.textContent===text?'.slots .slot.filled':undefined;
 stopHighlights=watchAudioHighlights(audio,recording,{text,legacyLetter,allowPrefix:true,target});
 let fallbackStarted = false;
 const fallback = () => {
  if (ticket !== sequence || currentAudio !== audio || fallbackStarted) return;
  fallbackStarted = true;
  stopHighlights();
  currentAudio = null;
  audio.pause();
  playSystem(true);
 };
 audio.addEventListener('error', fallback, {once:true});
 audio.addEventListener('ended', () => {
  if (ticket !== sequence || currentAudio !== audio) return;
  currentAudio = null;
  report('Ready to listen again.');
 }, {once:true});
 report('Loading the voice…');
 try {
  audio.play().then(() => {
   if (currentAudio === audio) report('Listen, then have a go together.');
  }).catch(fallback);
 } catch { fallback(); }
}

export function playFamilyAudio(keys,{speed=1,onPart=()=>{},targets=[]},onStatus){
 stopLessonAudio();
 const ticket=sequence;
 const clips=keys.map(key=>familySpeech[key]||stageSpeech[key]);
 const report=(message,failed=false)=>{if(ticket===sequence){if(failed||message==='Ready to listen again.')lessonPlaying=false;syncLessonAudioControls();onStatus(message,failed);}};
 if(!clips.length||clips.some(clip=>!clip)){
  onPart(-1);report('This clip is unavailable. A parent can read the word or helper aloud.',true);return;
 }
 let failed=false;
 lessonPlaying=true;
 function playPart(index){
  if(ticket!==sequence||failed||lessonPaused)return;resumePart=null;stopHighlights();
  const audio=new Audio(clips[index]);
  currentAudio=audio;
  audio.playbackRate=speed;audio.preservesPitch=true;
  stopHighlights=watchAudioHighlights(audio,clips[index],{key:keys[index],target:targets[index]},active=>{if(ticket===sequence)onPart(active?index:-1);});
  const fail=()=>{
   if(ticket!==sequence||currentAudio!==audio||failed)return;
   failed=true;stopHighlights();audio.pause();currentAudio=null;onPart(-1);
   report('Audio could not play. Please try again or read the parent prompt.',true);
  };
  audio.addEventListener('error',fail,{once:true});
  audio.addEventListener('ended',()=>{
   if(ticket!==sequence||currentAudio!==audio)return;
   currentAudio=null;
   if(index+1<clips.length){resumePart=()=>playPart(index+1);familyTimer=setTimeout(()=>{if(!lessonPaused)resumePart?.();},140);}
   else{onPart(-1);report('Ready to listen again.');}
  },{once:true});
  report('Loading the voice…');
  try{
   audio.play().then(()=>{
    if(ticket!==sequence||currentAudio!==audio)return;
    report('Listen, then have a go together.');
   }).catch(fail);
  }catch{fail();}
 }
 playPart(0);
}
