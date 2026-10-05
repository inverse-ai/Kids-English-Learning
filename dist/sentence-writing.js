import {stories} from './stage-data.js';
import {letterTrails} from './letter-trails.js';
import {sentenceWritingEntries,normalizeSentenceWriting} from './sentence-writing-data.js';
import {storyScene} from './story-scenes.js';
import {banglaLines} from './bangla-lines.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const btn=(label,action,extra='')=>'<button class="btn" data-action="stages-sentence-writing-'+action+'" '+extra+'>'+label+'</button>';
export function createSentenceWriting({getProgress,save,render,play,stop,isSaved}){
 let selected=null,observer=null;const entries=sentenceWritingEntries(stories);
 const state=()=>getProgress().sentenceWriting??=normalizeSentenceWriting(null,stories),entry=()=>entries.find(e=>e.id===selected),progress=()=>state().lessons[selected];
 const draft=()=>progress().words[progress().word]??={drawing:[],showGuide:true,done:false};
 function cancel(){observer?.disconnect();observer=null;}
 function open(id){if(!entries.some(e=>e.id===id))return;stop();selected=id;state().current=id;state().lessons[id]??={word:0,words:{},done:false};save();render();}
 function home(){const p=getProgress().sentenceWriting;return '<section class="intro"><div><div class="eyebrow">Stories · Suggested age 6+</div><h1>Write little sentences.</h1><p>Choose a sentence you have read. Trace one word at a time, then try without the guide.</p></div></section>'+(p?.current?'<div class="resume-strip"><span>Your writing is saved.</span>'+btn('Continue writing','open','data-id="'+p.current+'"')+'</div>':'')+'<div class="writing-library">'+entries.map(e=>'<button class="word-path-card" data-action="stages-sentence-writing-open" data-id="'+e.id+'">'+storyScene(stories.find(s=>s.id===e.story),e.line)+'<b>'+esc(e.text)+'</b><small>'+(p?.lessons[e.id]?.done?'Practised ✓':'Trace, then copy')+'</small></button>').join('')+'</div>';}
 function guide(word){return '<svg viewBox="0 0 '+word.length*100+' 112" aria-hidden="true">'+[...word].map((c,i)=>'<g transform="translate('+i*100+' 0)">'+letterTrails(c.toLowerCase(),c===c.toLowerCase()).paths.map(d=>'<path d="'+d+'" fill="none" stroke="#a6b8d6" stroke-width="5" stroke-linecap="round" stroke-dasharray="3 5"/>').join('')+'</g>').join('')+'</svg>';}
 function html(){const e=entry(),p=progress(),w=draft(),word=e.words[p.word];return '<section class="activity sentence-writing-player"><div class="eyebrow">Write little sentences · word '+(p.word+1)+' of '+e.words.length+'</div><h1>Trace, then copy.</h1><p class="sentence">'+esc(e.text)+'</p>'+(banglaLines[e.text]?'<details class="math-meaning"><summary lang="bn">মানে · Bangla help</summary><p lang="bn">'+esc(banglaLines[e.text])+'</p></details>':'')+'<h2>Write '+esc(word)+'</h2><p id="sentence-writing-help">Trace with your finger or mouse. Paper works too.</p><div class="canvas-wrap sentence-writing-pad"><div class="sentence-writing-guide" '+(w.showGuide?'':'hidden')+'>'+guide(word)+'</div><canvas id="sentence-writing" aria-label="Writing pad for '+word+'" aria-describedby="sentence-writing-help"></canvas></div><div class="writing-tools">'+btn(w.showGuide?'Hide guide':'Show guide','guide','aria-pressed="'+w.showGuide+'"')+btn('Clear this word','clear')+'</div><div class="activity-actions">'+btn('Hear sentence · Replay','listen')+'<button class="btn" data-action="stages-pause" disabled>Pause</button>'+btn('We practised this word ✓','practised')+'</div><p class="feedback" role="status">'+(p.done?'✓ You practised the sentence. Read it together.':w.done?'✓ Word practice saved.':'Your marks save automatically. A grown-up can help you compare the shape.')+'</p><div class="letter-paging">'+btn('← Previous word','previous',p.word===0?'disabled':'')+btn('Next word →','next',p.word===e.words.length-1?'disabled':'')+'</div><p class="muted">This records writing practice, not handwriting mastery.</p><p id="save-status">'+(isSaved()?'Saved automatically':'Progress not saved')+'</p><p id="audio-status" role="status"></p>'+btn('← Writing sentences','back')+'</section>';}
 function bind(){cancel();const canvas=document.querySelector('#sentence-writing');if(!canvas)return;const w=draft(),ctx=canvas.getContext('2d');let stroke=null,pointer=null,count=w.drawing.flat().length,last=0;
  document.querySelectorAll('.sentence-writing-player .spoken-word').forEach((el,i)=>el.classList.toggle('writing-current-word',i===progress().word));
  const draw=s=>{ctx.beginPath();s.forEach((pt,i)=>ctx[i?'lineTo':'moveTo'](pt[0]*canvas.clientWidth,pt[1]*canvas.clientHeight));ctx.stroke();};
  const resize=()=>{const ratio=devicePixelRatio||1;canvas.width=Math.round(canvas.clientWidth*ratio);canvas.height=Math.round(canvas.clientHeight*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.strokeStyle='#425894';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';w.drawing.forEach(draw);};
  const point=e=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||stroke||count>=20000||w.drawing.length>=300)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);pointer=e.pointerId;stroke=[point(e)];w.drawing.push(stroke);count++;save();});
  canvas.addEventListener('pointermove',e=>{if(!stroke||pointer!==e.pointerId||count>=20000)return;stroke.push(point(e));count++;draw(stroke.slice(-2));if(Date.now()-last>200){save();last=Date.now();}});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(pointer===e.pointerId){stroke=null;pointer=null;save();}});
  resize();observer=new ResizeObserver(resize);observer.observe(canvas);
 }
 return {home,html,bind,cancel,open,current:()=>selected,handle(data){const a=data.action.replace('stages-sentence-writing-','');if(a==='open'){open(data.id);return;}if(!selected)return;const p=progress(),w=draft();
  if(a==='listen'){play([{key:'text:'+entry().text,text:entry().text}]);return;}
  stop();if(a==='guide')w.showGuide=!w.showGuide;else if(a==='clear')w.drawing=[];
  else if(a==='practised'){w.done=true;p.done=entry().words.every((_,i)=>p.words[i]?.done);if(p.word<entry().words.length-1)p.word++;}
  else if(a==='next'&&p.word<entry().words.length-1)p.word++;else if(a==='previous'&&p.word>0)p.word--;
  save();render();
 }};
}
