import {openingAudioSource} from './opening-audio-data.js';
const STORE='little-english-opening-audio-v1';
export function createOpeningAudio(){
 let enabled=true,state='idle',audio=null,resolve=null,waiting=false,version=0,navigation=0,notice='';
 try{const saved=JSON.parse(localStorage.getItem(STORE)||'null');if(saved?.version===1&&typeof saved.enabled==='boolean')enabled=saved.enabled;}catch{}
 const button=(label,action)=>'<button class="btn" data-action="opening-'+action+'">'+label+'</button>';
 function html(){return state==='blocked'?'<p>Opening audio is ready. Your browser needs a tap to begin.</p>'+button('Tap to begin','begin')+button('Skip opening audio','stop'):state==='playing'?'<p>Opening audio · Arabic</p>'+button('Stop','stop'):notice?'<p role="status">'+notice+'</p>':'';}
 function update(){const el=document.querySelector('#opening-audio-notice');if(el){el.innerHTML=html();el.hidden=!el.innerHTML;}const input=document.querySelector('#opening-audio-enabled');if(input)input.checked=enabled;}
 function stop(){version++;if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio=null;}state='done';notice='';resolve?.();resolve=null;update();}
 function start(){if(!enabled||state==='done'||state==='playing')return;const ticket=++version;audio=new Audio(openingAudioSource.clip);audio.playbackRate=1;audio.preservesPitch=true;state='playing';notice='';update();audio.addEventListener('ended',()=>{if(ticket===version)stop();},{once:true});audio.addEventListener('error',()=>{if(ticket!==version)return;stop();notice='Opening audio could not play. Lessons are still available.';update();},{once:true});try{audio.play().catch(()=>{if(ticket!==version)return;audio?.pause();audio=null;state='blocked';update();resolve?.();resolve=null;});}catch{state='blocked';update();resolve?.();resolve=null;}}
 async function beforeInteraction(action){
  if(action==='home'||action==='parents'||action==='opening-stop'){navigation++;stop();return true;}
  if(!enabled||state==='done'||state==='idle')return true;
  if(waiting)return false;waiting=true;const route=navigation;
  if(state==='blocked')start();
  if(state==='playing')await new Promise(r=>resolve=r);
  waiting=false;return state==='done'&&route===navigation;
 }
 function settings(){return '<div class="opening-settings"><label for="opening-audio-enabled"><input type="checkbox" id="opening-audio-enabled" '+(enabled?'checked':'')+'> Opening audio</label><p>Play the Arabic opening once when the app opens. Your choice is saved in this browser. Turning it on takes effect next time you open the app.</p><p lang="ar" dir="rtl">أعوذ بالله من الشيطان الرجيم، بسم الله الرحمن الرحيم، رب زدني علما</p><p>Ordinary Arabic synthetic speech uses an Arabic voice. It cannot use Sonia’s English voice accurately. Pronunciation, warmth and voice matching still need a fluent Arabic speaker’s listening check.</p></div>';}
 return{html,settings,update,stop,beforeInteraction,begin:start,init:()=>{if(enabled)start();else state='done';},setEnabled:value=>{enabled=!!value;try{localStorage.setItem(STORE,JSON.stringify({version:1,enabled}));}catch{notice='This browser could not remember the opening audio setting.';}if(!enabled)stop();update();}};
}
