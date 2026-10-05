// App settings chosen on the Settings page: lesson voice, volume and screen light.
// Saved in this browser. Audio players call trackAudio() on every clip they play,
// so a volume change also reaches the clip that is playing right now.
import {voiceSpeech} from './voice-speech.js';

const STORE='little-english-settings-v1';
// The three English lesson voices. Sonia recorded every lesson; the other two are
// recorded on the PC (generate-pending-audio.py voices). A clip that a voice does
// not have yet plays in Sonia's voice, so lessons never go silent.
export const lessonVoices=Object.freeze([
 {id:'sonia',name:'Sonia',label:'Teacher',detail:'Calm British teacher (default)',edge:'en-GB-SoniaNeural'},
 {id:'maisie',name:'Maisie',label:'Girl',detail:'A cheerful girl’s voice',edge:'en-GB-MaisieNeural'},
 {id:'leo',name:'Leo',label:'Boy',detail:'A playful little boy’s voice',edge:'en-GB-RyanNeural (higher)'}
]);
let settings={version:1,voice:'sonia',volume:100,light:100};
try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved?.version===1){
 if(lessonVoices.some(v=>v.id===saved.voice))settings.voice=saved.voice;
 if(Number.isFinite(saved.volume))settings.volume=clamp(saved.volume,0,100);
 if(Number.isFinite(saved.light))settings.light=clamp(saved.light,40,100);}}catch{}
function clamp(n,lo,hi){return Math.max(lo,Math.min(hi,Math.round(n)));}
function store(){try{localStorage.setItem(STORE,JSON.stringify(settings));}catch{}}

export const currentVoice=()=>settings.voice;
export function setVoice(id){if(lessonVoices.some(v=>v.id===id)){settings.voice=id;store();}}
// How many lesson clips the chosen voice has (0 = still to be recorded).
export const voiceClipCount=id=>id==='sonia'?Infinity:Object.keys(voiceSpeech[id]||{}).length;
// The chosen voice's recording of an English clip, if it has one.
export function voiceClip(key){return settings.voice==='sonia'?undefined:voiceSpeech[settings.voice]?.[key];}

const live=new Set();
export const volume=()=>settings.volume;
export function trackAudio(audio){audio.volume=settings.volume/100;live.add(audio);const done=()=>live.delete(audio);audio.addEventListener('ended',done,{once:true});audio.addEventListener('emptied',done,{once:true});audio.addEventListener('error',done,{once:true});return audio;}
export function setVolume(value){settings.volume=clamp(value,0,100);store();live.forEach(a=>{a.volume=settings.volume/100;});}

// Screen light: a dimming layer over the page (40% to 100% light).
export const light=()=>settings.light;
function applyLight(){let layer=document.querySelector('.screen-dim');if(!layer){layer=document.createElement('div');layer.className='screen-dim';layer.setAttribute('aria-hidden','true');document.body.append(layer);}layer.style.opacity=String((100-settings.light)/100);}
export function setLight(value){settings.light=clamp(value,40,100);store();applyLight();}
export function initSettings(){applyLight();}
