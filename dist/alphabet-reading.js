import {readingAlphabet,normalizeAlphabetReading} from './alphabet-reading-data.js';
import {playStageSequence,stageAudioState,toggleStagePause,letterNameKey} from './stage-audio.js';
import {narrationLine,narrationControls,narrationExtra} from './narration.js';
const btn=(label,action,cls='')=>'<button class="btn '+cls+'" data-action="stages-alphabet-'+action+'">'+label+'</button>';
export function createAlphabetReading({getProgress,getSpeed,save,status}){
 let pending=false,observer=null;
 const p=()=>getProgress().alphabetReading;
 function prepare(autoplay=true){getProgress().alphabetReading??=normalizeAlphabetReading(null);pending=autoplay;}
 function sync(){const state=stageAudioState(),pause=document.querySelector('[data-action=stages-alphabet-pause]');if(pause){pause.disabled=!state.playing;pause.textContent=state.paused?'Resume':'Pause';pause.setAttribute('aria-pressed',String(state.paused));}}
 // The letter names with their progress callbacks. The lesson narration plays
 // A–Z after the instruction; a tapped pair plays on its own.
 function sequence(indices,mode='single'){
  const all=mode==='all';let last=null;p().mode=mode;if(all)p().finished=false;
  const heard=()=>{if(last!==null&&!p().heard.includes(readingAlphabet[last]))p().heard.push(readingAlphabet[last]);};
  return {parts:indices.map(index=>({key:letterNameKey(readingAlphabet[index]),index,target:'.alphabet-pair[data-letter="'+readingAlphabet[index]+'"]'})),onPart:part=>{heard();last=part.index;p().index=part.index;save();status('Listen: '+readingAlphabet[part.index].toUpperCase());},onActive:(part,active)=>{const pair=document.querySelector('.alphabet-pair[data-letter="'+readingAlphabet[part.index]+'"]');pair?.setAttribute('aria-current',String(active));if(active)pair?.scrollIntoView({block:'nearest',behavior:'instant'});},onEnd:()=>{heard();if(all)p().finished=true;save();status('Ready to listen again. Choose a letter pair or Replay.');}};
 }
 function read(indices,automatic=false,mode='single'){
  const s=sequence(indices,mode);
  playStageSequence(s.parts,{speed:getSpeed(),onPart:s.onPart,onActive:s.onActive,onState:sync,onEnd:()=>{s.onEnd();sync();},onError:()=>{status(automatic?'Tap Listen to all to start the audio.':'Audio could not play. Please try Replay.');sync();}});
 }
 function listenAll(from=0,automatic=false){read(readingAlphabet.map((_,i)=>i).slice(from),automatic,'all');}
 function html(){narrationExtra('alphabet',({replay})=>sequence(readingAlphabet.map((_,i)=>i).slice(!replay&&p().mode==='all'&&!p().finished?p().index:0),'all'));return '<div class="lesson-head"><button class="btn" data-action="stages-back">← Letters</button></div><section class="activity alphabet-reading" data-narration-step="alphabet"><div class="eyebrow">Letters · Suggested age 4+</div><h1>Read the alphabet</h1>'+narrationLine('Tap a pair to hear its English letter name.',{cls:'alphabet-reading-help'})+'<div class="alphabet-reading-controls">'+narrationControls()+'</div><p id="audio-status" class="status alphabet-reading-status" role="status"></p><div class="alphabet-reading-grid" aria-label="Alphabet A to Z">'+readingAlphabet.map((c,i)=>'<button class="alphabet-pair alphabet-color-'+i%4+'" data-action="stages-alphabet-letter" data-letter="'+c+'" aria-label="'+c.toUpperCase()+' and '+c+', hear the letter name" aria-current="false"><span>'+c.toUpperCase()+'</span><span>'+c+'</span></button>').join('')+'</div><div class="activity-actions">'+btn('Next · Letter activities →','next')+'</div></section>';}
 function bind(){const root=document.querySelector('.alphabet-reading');if(!root)return;const nav=document.querySelector('.stage-nav'),controls=root.querySelector('.alphabet-reading-controls');const measure=()=>{const top=(nav?.getBoundingClientRect().height||0)+12;root.style.setProperty('--alphabet-sticky-top',top+'px');root.style.setProperty('--alphabet-scroll-top',(top+controls.getBoundingClientRect().height+24)+'px');};observer?.disconnect();observer=new ResizeObserver(measure);observer.observe(controls);if(nav)observer.observe(nav);measure();if(!p().started){p().started=true;save();}sync();pending=false;}// the narration reads the instruction, then A–Z
 function handle(d){const action=d.action.replace('stages-alphabet-','');if(action==='all')listenAll();else if(action==='letter'){const i=readingAlphabet.indexOf(d.letter);if(i!==-1)read([i]);}else if(action==='pause')toggleStagePause();else if(action==='replay')p().mode==='single'?read([p().index]):listenAll();}
 return{prepare,html,bind,handle,cancel:()=>{pending=false;observer?.disconnect();observer=null;}};
}
