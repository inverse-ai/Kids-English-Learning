import {alphabet} from './stage-data.js';
import {letterNameKey} from './stage-audio.js';
import {letterMatchRounds,normalizeLetterMatching,normalizeMatchBoard} from './letter-match-data.js';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(label,action,extra='',cls='')=>'<button class="btn '+cls+'" data-action="stages-match-'+action+'" '+extra+'>'+label+'</button>';
export function createLetterMatching({getProgress,getPractice,onAttempt,save,render,play,stop}){
 let feedback='',feedbackKind='',cleanup=()=>{};
 const p=()=>getProgress().letterMatching;
 const help=(en,bn)=>p().language==='bn'?bn:en;
 const due=()=>Object.entries(getPractice().items).filter(([id,r])=>/^letter:[a-z]$/.test(id)&&r.misses>0&&r.due<=Date.now()).sort((a,b)=>a[1].due-b[1].due).map(([id])=>id.slice(7));
 const letters=()=>p().phase==='review'?p().review.letters:letterMatchRounds[p().round].letters;
 function board(){if(p().phase==='review')return p().review;const r=letterMatchRounds[p().round];return p().rounds[r.id]??=normalizeMatchBoard(null,r.letters);}
 function open(){stop();getProgress().letterMatching??=normalizeLetterMatching(null);p().started=true;feedback='';feedbackKind='';save();render();}
 function listen(letter=p().selected||letters().find(c=>!board().matches.includes(c))||letters()[0],kind='both',praise=false){
  const a=alphabet.find(a=>a.letter===letter);if(!a)return;
  const target='.lm-letter[data-letter="'+letter+'"],.lm-example [data-case]';
  const parts=praise?[{key:'move:Well done!'}]:[];
  if(kind==='case')parts.push({key:'alphabet-case:'+letter,caseLetter:letter,caseTarget:'.lm-pair-'+letter});
  else{if(kind!=='sound')parts.push({key:letterNameKey(letter),target});if(kind!=='name')parts.push({key:'sound:'+a.sound,target});}
  play(parts);
 }
 function choose(side,c,method='tap'){
  if(!p()||!['round','review'].includes(p().phase)||!letters().includes(c))return;
  const b=board();if(b.matches.includes(c)){feedback=help('You already matched this pair. Choose another big letter.','এই জোড়াটি মেলানো হয়েছে। আরেকটি বড় অক্ষর বেছে নাও।');render(false);return;}
  if(side==='upper'){p().selected=p().selected===c?null:c;feedback=p().selected?help('Now choose the little '+c+'.','এবার ছোট '+c+' বেছে নাও।'):'';feedbackKind='';save();render(false);return;}
  const letter=p().selected;if(!letter){feedback=help('Choose a big letter first.','আগে একটি বড় অক্ষর বেছে নাও।');feedbackKind='hint';render(false);return;}
  const r=b.results[letter]??={attempts:0,misses:0,assisted:false,firstCorrect:null},correct=letter===c;
  r.attempts=Math.min(10000,r.attempts+1);r.firstCorrect??=correct;
  onAttempt('letter:'+letter,correct,r.assisted||r.misses>0);
  if(correct){b.matches.push(letter);r.assisted||=r.misses>0;p().selected=null;feedback='✓ '+help('Well done! '+letter.toUpperCase()+' matches '+letter+'.',letter.toUpperCase()+' আর '+letter+' মিলে গেছে। খুব ভালো!');feedbackKind='correct';}
  else{r.misses=Math.min(10000,r.misses+1);r.assisted=true;feedback=help('Good try. '+letter.toUpperCase()+' matches '+letter+', not '+c+'. '+(r.misses>=2?'Look at the glowing pair, then try with help.':'Try again.'),'চেষ্টা করেছ, ভালো! '+letter.toUpperCase()+' মেলে '+letter+'-এর সঙ্গে, '+c+'-এর সঙ্গে নয়। '+(r.misses>=2?'উজ্জ্বল জোড়াটি দেখো, তারপর সাহায্য নিয়ে চেষ্টা করো।':'আবার চেষ্টা করো।'));feedbackKind='hint';}
  save();render(false);listen(letter,'case',correct);
  if(!correct&&r.misses>=2)document.querySelectorAll('.lm-letter[data-letter="'+letter+'"]').forEach(e=>e.classList.add('lm-demonstrated'));
 }
 function html(){
  const data=p(),r=letterMatchRounds[data.round],lang=data.language;
  const language='<label class="lm-language" for="lm-language">Help / সহায়তা <select id="lm-language"><option value="bn" '+(lang==='bn'?'selected':'')+'>বাংলা</option><option value="en" '+(lang==='en'?'selected':'')+'>English</option></select></label>';
  const intro=data.phase==='intro',finished=data.phase==='finished';
  let body='';
  if(intro)body='<div class="lm-example lm-pair-a"><span class="lm-example-letter" data-case="upper">A</span><svg viewBox="0 0 100 24" aria-hidden="true"><path d="M5 12h90"/></svg><span class="lm-example-letter" data-case="lower">a</span></div><h2>A matches a.</h2><p class="lm-help" lang="'+lang+'">'+help('They look different, but they are the same letter.','দেখতে আলাদা, কিন্তু বড় A আর ছোট a একই অক্ষর।')+'</p><div class="activity-actions">'+btn('Hear A and a','intro-audio')+btn('Hear the sound','sound','data-letter="a"')+'<button class="btn" data-action="stages-pause" disabled>Pause</button>'+btn('Let’s match →','start','','primary')+'</div>';
  else if(finished)body='<div class="lm-finish" aria-hidden="true">★</div><h2>You matched A–Z!</h2><p lang="'+lang+'">'+help('You practised every big and small letter. Keep playing on another day.','সব বড় আর ছোট অক্ষর মেলানো হয়েছে। আরেক দিন আবার খেলো।')+'</p><div class="activity-actions">'+btn('Play again','again')+(due().length?btn('Review missed pairs · '+due().length,'review','','primary'):'')+btn('Back to Letters','back')+'</div>';
  else{
   const b=board(),complete=b.matches.length===letters().length,active=data.selected||letters().find(c=>!b.matches.includes(c))||letters()[0];
   const letterButton=(c,side)=>'<div class="lm-pair-'+c+'"><button class="lm-letter '+(b.matches.includes(c)?'lm-matched':'')+' '+(data.selected===c&&side==='upper'?'lm-selected':'')+'" data-action="stages-match-pick" data-side="'+side+'" data-letter="'+c+'" data-case="'+side+'" aria-label="'+(side==='upper'?'Big '+c.toUpperCase():'Small '+c)+(b.matches.includes(c)?', matched':'')+'" aria-pressed="'+(data.selected===c&&side==='upper')+'" '+(b.matches.includes(c)?'disabled':'')+'><span>'+(side==='upper'?c.toUpperCase():c)+'</span>'+(b.matches.includes(c)?'<span class="lm-check" aria-hidden="true">✓</span>':'')+'</button></div>';
   body='<p class="lm-instruction" lang="'+lang+'">'+help('Draw from a big letter to its little match. Or tap big, then little.','বড় অক্ষর থেকে তার ছোট অক্ষর পর্যন্ত দাগ টানো। অথবা আগে বড়, তারপর ছোট অক্ষরে ট্যাপ করো।')+'</p><div class="lm-board" aria-label="Connect matching big and small letters"><svg class="lm-lines" aria-hidden="true"><g class="lm-connections"></g><path class="lm-draft"/></svg><div class="lm-column"><span class="lm-column-title">Big</span>'+letters().map(c=>letterButton(c,'upper')).join('')+'</div><div class="lm-column"><span class="lm-column-title">Small</span>'+b.order.map(c=>letterButton(c,'lower')).join('')+'</div></div><p class="lm-feedback '+feedbackKind+'" role="status" lang="'+lang+'">'+esc(feedback||help('Choose any big letter to begin.','শুরু করতে যেকোনো বড় অক্ষর বেছে নাও।'))+'</p><div class="lm-audio-controls">'+btn('Hear '+active.toUpperCase()+' · Name','name','data-letter="'+active+'"')+btn('Hear '+active+' · Sound','sound','data-letter="'+active+'"')+'<button class="btn" data-action="stages-pause" disabled>Pause</button></div>'+(active==='q'||active==='x'?'<p class="lm-help" lang="'+lang+'">'+help(active==='q'?'Q works with u: hear /kw/, as in queen.':'Hear x at the end of box: /k/ and /s/ together.',active==='q'?'Q-এর সঙ্গে u থাকে। queen শব্দের শুরুতে /kw/ শোনো।':'box শব্দের শেষে x-এর /k/ আর /s/ একসঙ্গে শোনো।')+'</p>':'')+'<div class="lm-navigation">'+(data.phase==='round'?btn('← Previous round','previous',data.round===0?'disabled':''):btn('Back to rounds','back-rounds'))+btn(complete?(data.phase==='review'?'Finish review →':'Next round →'):'Match all pairs to continue','next',complete?'':'disabled','primary')+'</div>';
  }
  return '<div class="lesson-head">'+btn('← Letters','back')+language+'</div><section class="activity letter-matching"><div class="eyebrow">Letters · Suggested age 4+</div><h1>Big and small letters</h1>'+(!intro&&!finished?'<p class="lm-round">'+(data.phase==='review'?'Review missed pairs':'Round '+(data.round+1)+' of '+letterMatchRounds.length)+' · '+board().matches.length+'/'+letters().length+' matched</p>':'')+body+'<p id="audio-status" class="status" role="status"></p></section>'+(!intro?'<details class="lm-parent"><summary>For parents</summary><p lang="'+lang+'">'+help('Draw or tap to connect the same English letter. Hearing a name or sound does not change the letter. Missed pairs return for spaced review; a tick records practice, not independent mastery.','দাগ টেনে বা ট্যাপ করে একই ইংরেজি অক্ষর মেলান। নাম ও ধ্বনির অডিও ইংরেজিতেই থাকে। ভুল হওয়া জোড়া পরে আবার অনুশীলনে আসবে। টিক চিহ্ন অনুশীলন বোঝায়, স্বাধীনভাবে শেখা নিশ্চিত করে না।')+'</p></details>':'');
 }
 function handle(d){const a=d.action.replace('stages-match-','');
  if(a==='intro-audio')listen('a','case');else if(a==='name'||a==='sound')listen(d.letter,a);
  else if(a==='pick')choose(d.side,d.letter);
  else if(a==='start'){stop();p().phase='round';board();p().selected=null;feedback='';save();render();}
  else if(a==='next'){if(board().matches.length!==letters().length)return;stop();if(p().phase==='review'){p().review=null;p().phase=p().round===letterMatchRounds.length-1&&p().rounds[letterMatchRounds.at(-1).id]?.matches.length===4?'finished':'round';}else if(p().round<letterMatchRounds.length-1){p().round++;board();}else p().phase='finished';p().selected=null;feedback='';save();render();}
  else if(a==='previous'||a==='again'){stop();if(a==='again'){p().round=0;p().phase='round';p().rounds={};}else if(p().round>0)p().round--;board();p().selected=null;feedback='';save();render();}
  else if(a==='review'){const list=due().slice(0,4);if(!list.length)return;stop();p().review={letters:list,...normalizeMatchBoard(null,list)};p().phase='review';p().selected=null;feedback='';save();render();}
  else if(a==='back-rounds'){stop();p().phase='round';p().selected=null;feedback='';save();render();}
 }
 function bind(){
  cleanup();cleanup=()=>{};const root=document.querySelector('.letter-matching'),area=root?.querySelector('.lm-board');
  document.querySelector('#lm-language')?.addEventListener('change',e=>{stop();p().language=e.target.value==='en'?'en':'bn';feedback='';save();render(false);});
  if(!area)return;
  const svg=area.querySelector('.lm-lines'),connections=area.querySelector('.lm-connections'),draft=area.querySelector('.lm-draft');let drag=null;
  const point=(x,y)=>{const b=area.getBoundingClientRect();return[x-b.left,y-b.top];};
  function drawLines(){const bounds=area.getBoundingClientRect();svg.setAttribute('viewBox','0 0 '+bounds.width+' '+bounds.height);connections.replaceChildren();for(const c of board().matches){const a=area.querySelector('[data-side=upper][data-letter="'+c+'"]')?.getBoundingClientRect(),b=area.querySelector('[data-side=lower][data-letter="'+c+'"]')?.getBoundingClientRect();if(!a||!b)continue;const start=point(a.right,a.top+a.height/2),end=point(b.left,b.top+b.height/2),line=document.createElementNS('http://www.w3.org/2000/svg','path');line.dataset.match=c;line.setAttribute('d','M'+start.join(',')+' L'+end.join(','));connections.append(line);}}
  const observer=new ResizeObserver(drawLines);observer.observe(area);drawLines();
  area.querySelectorAll('.lm-letter:not(:disabled)').forEach(button=>{
   let consumed=false;
   button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(consumed){consumed=false;return;}choose(button.dataset.side,button.dataset.letter);});
   if(button.dataset.side!=='upper')return;
   button.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;button.setPointerCapture(e.pointerId);drag={id:e.pointerId,letter:button.dataset.letter,start:[e.clientX,e.clientY],points:[point(e.clientX,e.clientY)],moved:false};});
   button.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(Math.hypot(e.clientX-drag.start[0],e.clientY-drag.start[1])>8)drag.moved=true;if(!drag.moved)return;drag.points.push(point(e.clientX,e.clientY));drag.points=drag.points.slice(-600);draft.setAttribute('d',drag.points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '));});
   button.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const current=drag;drag=null;draft.removeAttribute('d');if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);if(!current.moved)return;consumed=true;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.lm-letter[data-side=lower]');p().selected=current.letter;if(target&&!target.disabled)choose('lower',target.dataset.letter,'drag');else{feedback=help('Finish your line on a little letter. Or tap big, then little.','ছোট অক্ষরের ওপর দাগটি শেষ করো। অথবা আগে বড়, তারপর ছোট অক্ষরে ট্যাপ করো।');feedbackKind='hint';save();render(false);}});
   button.addEventListener('pointercancel',()=>{drag=null;draft.removeAttribute('d');});
  });
  cleanup=()=>{observer.disconnect();drag=null;draft.removeAttribute('d');};
 }
 return{open,html,handle,bind,cancel:()=>{cleanup();cleanup=()=>{};},dueCount:()=>due().length};
}
