import {recordedSpeech} from './recorded-speech.js';
import {familySpeech} from './family-speech.js';
let sequence = 0;
let currentAudio = null;
let currentUtterance = null;

export function stopLessonAudio() {
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
 const report = (message, failed = false) => { if (ticket === sequence) onStatus(message, failed); };
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
  spoken.onstart = () => report(fallback ? 'Using this computer’s voice for this clip.' : 'Listen, then have a go together.');
  spoken.onend = () => {
   if (currentUtterance !== spoken) return;
   currentUtterance = null;
   report('Ready to listen again.');
  };
  spoken.onerror = event => {
   if (currentUtterance !== spoken || ['canceled','interrupted'].includes(event.error)) return;
   currentUtterance = null;
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
 let fallbackStarted = false;
 const fallback = () => {
  if (ticket !== sequence || currentAudio !== audio || fallbackStarted) return;
  fallbackStarted = true;
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

export function playFamilyAudio(keys,{speed=1,onPart=()=>{}},onStatus){
 stopLessonAudio();
 const ticket=sequence;
 const clips=keys.map(key=>familySpeech[key]);
 const report=(message,failed=false)=>{if(ticket===sequence)onStatus(message,failed);};
 if(!clips.length||clips.some(clip=>!clip)){
  onPart(-1);report('This clip is unavailable. A parent can read the word or helper aloud.',true);return;
 }
 let failed=false;
 function playPart(index){
  if(ticket!==sequence||failed)return;
  const audio=new Audio(clips[index]);
  currentAudio=audio;
  audio.playbackRate=speed;audio.preservesPitch=true;
  const fail=()=>{
   if(ticket!==sequence||currentAudio!==audio||failed)return;
   failed=true;audio.pause();currentAudio=null;onPart(-1);
   report('Audio could not play. Please try again or read the parent prompt.',true);
  };
  audio.addEventListener('error',fail,{once:true});
  audio.addEventListener('ended',()=>{
   if(ticket!==sequence||currentAudio!==audio)return;
   currentAudio=null;
   if(index+1<clips.length)setTimeout(()=>playPart(index+1),140);
   else{onPart(-1);report('Ready to listen again.');}
  },{once:true});
  report('Loading the voice…');
  try{
   audio.play().then(()=>{
    if(ticket!==sequence||currentAudio!==audio)return;
    onPart(index);report('Listen, then have a go together.');
   }).catch(fail);
  }catch{fail();}
 }
 playPart(0);
}
