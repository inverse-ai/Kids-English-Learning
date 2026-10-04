import {allMoveLessons,moveLessons,moveReview,moveVocabulary,moveTasks,isMovement,moveHint,moveDescription,normalizeMove} from './move-data.js';
import {moveObject,layoutMove,moveScene,routePicture,acceptsPlacement,acceptsRoute} from './move-scenes.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(text,action,data='',kind='')=>'<button class="btn '+kind+'" data-action="stages-move-'+action+'" '+data+'>'+text+'</button>';
export function createMoveFlow({getProgress,save,render,play,stop,isSaved}){
 let selected=null,frame=null,animating=false,drag=null;
 const state=()=>getProgress(),lesson=()=>allMoveLessons.find(l=>l.id===selected),progress=()=>state().move[selected];
 const group=()=>moveTasks(lesson())[progress().task],task=()=>group().steps?.[progress().substep]||group(),key=()=>progress().task+':'+progress().substep;
 const result=()=>progress().results[key()]??={correct:false,attempts:0,wrong:0,assisted:false,firstCorrect:null,method:null};
 const movement=()=>isMovement(task(),lesson()),layout=()=>layoutMove(task(),movement());
 const say=texts=>play(texts.map(text=>({key:'move:'+text,text})));
 function cancel(){cancelAnimationFrame(frame);frame=null;animating=false;drag=null;}
 function readyReview(){return moveLessons.every(l=>state().move[l.id]?.done&&moveTasks(l).every((_,i)=>state().move[l.id]?.results[i+':0']?.correct));}
 function home(){return '<section class="intro"><div><p class="eyebrow">Listen & Move · all ages welcome</p><h1>Listen. Look. Move.</h1><p class="muted">Meet the objects and meanings, watch, then have a go. Drag or use the large choices.</p></div></section><div class="move-library">'+allMoveLessons.map(l=>'<button class="words-menu-card" data-action="stages-move-open" data-id="'+l.id+'" '+(l.id===moveReview.id&&!readyReview()?'disabled':'')+'><span class="move-card-art" aria-hidden="true">'+(l.id===moveReview.id?'① → ②':Number(l.title.split(' · ')[0]))+'</span><span><b>'+esc(l.title)+'</b><small>'+(l.id===moveReview.id&&!readyReview()?'Practise the ten individual lessons first.':state().move[l.id]?.done?'Practised ✓':state().move[l.id]?'Continue your saved lesson':'Words, demonstration & three practice tasks')+'</small></span><span aria-hidden="true">→</span></button>').join('')+'</div>';}
 function animate(points,done){
  cancel();animating=true;const tryButton=document.querySelector('[data-action=stages-move-try]');if(tryButton)tryButton.disabled=true;const p=progress(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lengths=points.slice(1).map((v,i)=>Math.hypot(v[0]-points[i][0],v[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0),start=performance.now();
  function at(distance){let travelled=0;for(let i=0;i<lengths.length;i++){if(distance<=travelled+lengths[i]){const r=(distance-travelled)/(lengths[i]||1);return [points[i][0]+r*(points[i+1][0]-points[i][0]),points[i][1]+r*(points[i+1][1]-points[i][1])];}travelled+=lengths[i];}return points.at(-1);}
  function update(now){const ratio=reduce?1:Math.min(1,(now-start)/1300);p.position=at(total*ratio);document.querySelector('#move-object')?.setAttribute('transform','translate('+p.position.join(' ')+')');if(ratio<1)frame=requestAnimationFrame(update);else{animating=false;frame=null;save();done();}}
  frame=requestAnimationFrame(update);
 }
 function demonstrate(){stop();const p=progress(),geo=layout(),t=task();p.position=geo.start;p.path=[];save();render(false);say(result().wrong>=2?[moveHint(t),t.text]:[t.text]);const route=movement()?geo.paths[0].points:[geo.start,geo.zones[geo.valid[0]].point];animate(route,()=>{if(!p.demonstrated.includes(key()))p.demonstrated.push(key());save();render(false);});}
 function answer(points,method){
  if(animating||progress().phase!=='task'||result().correct)return;stop();const p=progress(),t=task(),geo=layout(),a=result(),correct=movement()?acceptsRoute(geo,points):acceptsPlacement(geo,points.at(-1));a.attempts++;a.method=method;if(a.firstCorrect===null)a.firstCorrect=correct;a.correct=correct;p.position=points.at(-1);p.path=points;
  if(correct){save();render(false);say(['Well done!',moveDescription(t)]);document.querySelector('[data-action=stages-move-next]')?.focus({preventScroll:true});}
  else{a.wrong++;a.assisted=true;p.assisted=true;if(movement()){p.position=geo.start;p.path=[];}if(a.wrong>=2){p.phase='demo';save();render(false);demonstrate();}else{save();render(false);say([moveHint(t)]);}}
 }
 const meaningScene=t=>{const m=isMovement(t,lesson()),geo=layoutMove(t,m);return moveScene(t,geo,m?geo.paths[0].points.at(-1):geo.zones[geo.valid[0]].point,{movement:m,showRoute:true});};
 function html(){
  const l=lesson(),p=progress();if(!l||!p)return home();let content='';
  if(p.phase==='vocabulary'){
   const words=moveVocabulary(l),v=words[p.vocab],example=moveTasks(l).flatMap(t=>t.steps||[t]).find(t=>t.position===v.word);
   content='<p class="eyebrow">Meet the meanings · '+(p.vocab+1)+' of '+words.length+'</p><h1>'+esc(v.word)+'</h1><p lang="bn" class="move-meaning">'+esc(v.meaning)+'</p>'+(v.position?meaningScene(example):'<svg class="move-vocab-art" viewBox="-110 -110 220 220" role="img" aria-label="'+esc(v.word)+'">'+moveObject(v.word)+'</svg>')+'<p class="sentence">'+esc(v.spoken)+'</p><div class="move-controls">'+btn('Listen · Replay','vocab-audio')+btn('← Previous','vocab-prev',p.vocab===0?'disabled':'')+btn(p.vocab+1===words.length?'Watch first →':'Next meaning →','vocab-next','','primary')+'</div>';
  }else if(p.phase==='finish'){
   content='<p class="eyebrow">'+esc(l.title)+'</p><h1>'+ (p.done?'★ You practised!':'Practice complete')+'</h1><p>'+(p.assisted?'You practised with help.':'You finished the practice tasks.')+'</p><p class="muted">Completion records practice, not an assessment.</p><div class="move-controls">'+(p.done?btn('Back to lessons →','back','','primary'):btn('Finish lesson ★','finish','','primary'))+btn('Review this lesson','review')+'</div>';
  }else{
   const t=task(),geo=layout(),a=result(),isPath=movement(),two=!!group().steps,demo=p.phase==='demo',canTry=p.demonstrated.includes(key());
   content='<p class="eyebrow">'+esc(l.title)+' · '+(group().practice?'Practice '+(p.task-l.tasks.length+1)+' of 3':two?'Two steps · '+(p.task+1)+' of 3 · step '+(p.substep+1):'Instruction '+(p.task+1)+' of '+l.tasks.length)+'</p><h1>'+(demo?'Watch, then try.':'Your turn to move.')+'</h1><p class="sentence move-instruction">'+esc(t.text)+'</p><div class="move-controls">'+btn(two?'Replay step':'Listen · Replay','listen')+(two?btn('Both steps','full'):'')+'<button class="btn story-pause" data-action="stages-pause" disabled>Pause</button></div>'+moveScene(t,geo,p.position||geo.start,{movement:isPath,showRoute:true,interactive:!demo&&!a.correct,path:p.path});
   if(demo)content+='<p class="move-feedback" role="status">'+(a.wrong>=2?esc(moveHint(t)):'Watch the object and the placement or route.')+'</p><div class="move-controls">'+btn('Show demonstration · Replay','demo')+btn('Let me try →','try',canTry&&!animating?'':'disabled','primary')+'</div>';
   else{
    content+='<p class="move-feedback" role="status">'+(a.correct?'✓ '+esc(moveDescription(t)):a.wrong?esc(moveHint(t)):isPath?'Drag along the route, or choose a route below.':'Drag the object, tap a numbered area, or use a choice below.')+'</p>';
    if(!a.correct)content+='<div class="move-options" role="group" aria-label="'+(isPath?'Choose a movement route':'Choose a placement area')+'">'+(isPath?geo.paths.map((route,i)=>btn(routePicture(route.points)+'<span>'+esc(route.label)+'</span>','route','data-index="'+i+'"','move-route')).join(''):geo.zones.map((z,i)=>btn((i+1)+' · '+esc(z.label),'place','data-index="'+i+'"')).join(''))+'</div>';
    content+='<div class="move-controls">'+btn('← Previous','previous',p.task===0&&p.substep===0?'disabled':'')+(a.correct?btn(two&&p.substep===0?'Step 2 →':'Next →','next','','primary'):btn('Watch again','help'))+'</div>';
   }
  }
  return '<section class="activity move-player" data-lesson="'+l.id+'" data-phase="'+p.phase+'">'+content+'<div class="move-bottom">'+(p.phase==='finish'&&p.done?'':btn('← Listen & Move','back'))+'<small id="save-status">'+(isSaved()?'Saved automatically':'Progress not saved')+'</small></div>'+(p.phase!=='vocabulary'&&p.phase!=='finish'&&group().steps?'<details class="move-step-replay"><summary>Replay either step</summary><p class="sentence move-full-instruction">'+esc(group().text)+'</p><div class="move-controls">'+group().steps.map((_,i)=>btn('Hear step '+(i+1),'step-audio','data-index="'+i+'"')).join('')+'</div></details>':'')+'<p id="audio-status" class="status" role="status"></p></section>';
 }
 function bind(){const svg=document.querySelector('#move-scene');if(!svg||progress()?.phase!=='task'||result().correct)return;
  const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const world=p.matrixTransform(svg.getScreenCTM().inverse());return [Math.max(0,Math.min(600,world.x)),Math.max(0,Math.min(340,world.y))];};
  svg.addEventListener('pointerdown',e=>{if(animating)return;if(!e.target.closest('#move-object'))return;e.preventDefault();stop();const p=progress(),pos=p.position||layout().start;drag={pointer:e.pointerId,path:movement()&&p.path.length?[...p.path]:[pos]};svg.setPointerCapture(e.pointerId);});
  svg.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();const pos=point(e),p=progress();drag.path.push(pos);p.position=pos;p.path=drag.path.slice(-600);document.querySelector('#move-object')?.setAttribute('transform','translate('+pos.join(' ')+')');save();});
  svg.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.pointer)return;const points=[...drag.path,point(e)];drag=null;answer(points,'drag');});
  svg.addEventListener('pointercancel',()=>{drag=null;save();});
  svg.addEventListener('click',e=>{if(e.target.closest('#move-object'))return;const zone=e.target.closest('[data-zone]');if(zone&&!movement()&&!result().correct)answer([progress().position||layout().start,layout().zones[Number(zone.dataset.zone)].point],'tap');});
 }
 return {html,home,bind,cancel,current:()=>selected,open(id){if(!allMoveLessons.some(l=>l.id===id)||id===moveReview.id&&!readyReview())return;stop();selected=id;state().moveCurrent=id;state().move[id]??=normalizeMove({move:{[id]:{}}}).move[id];save();render();},handle(data){
  if(!lesson()||!progress())return;const p=progress(),action=data.action.replace('stages-move-','');
  if(action==='vocab-audio'){const v=moveVocabulary(lesson())[p.vocab];say([v.word,v.spoken]);}
  else if(action==='vocab-prev'&&p.vocab>0){stop();p.vocab--;save();render();}
  else if(action==='vocab-next'){stop();if(p.vocab+1<moveVocabulary(lesson()).length)p.vocab++;else{p.phase='demo';p.position=null;p.path=[];}save();render();}
  else if(action==='listen')say([task().text]);
  else if(action==='full'){document.querySelector('.move-step-replay').open=true;say([group().text]);}
  else if(action==='step-audio'&&group().steps?.[Number(data.index)]){const text=group().steps[Number(data.index)].text;document.querySelector('.move-step-replay').open=true;play([{key:'move:'+text,text:group().text,textOffset:group().text.indexOf(text)}]);}
  else if(action==='demo')demonstrate();
  else if(action==='try'&&p.demonstrated.includes(key())&&!animating){stop();p.phase='task';p.position=layout().start;p.path=[];save();render();say(['Your turn.']);}
  else if(action==='help'){stop();p.assisted=true;result().assisted=true;p.phase='demo';save();render();demonstrate();}
  else if(action==='place'&&p.phase==='task'&&layout().zones[Number(data.index)])answer([p.position||layout().start,layout().zones[Number(data.index)].point],'tap');
  else if(action==='route'&&p.phase==='task'&&!result().correct){const route=layout().paths[Number(data.index)];if(!route)return;stop();const points=route.points;p.position=points[0];render(false);animate(points,()=>answer(points,'route'));}
  else if(action==='previous'){stop();if(p.substep>0)p.substep--;else if(p.task>0){p.task--;p.substep=group().steps?1:0;}p.phase='task';p.position=null;p.path=[];save();render();}
  else if(action==='next'&&result().correct){stop();if(group().steps&&p.substep===0)p.substep=1;else{p.substep=0;if(p.task+1<moveTasks(lesson()).length)p.task++;else p.phase='finish';}if(p.phase!=='finish')p.phase=p.demonstrated.includes(key())?'task':'demo';p.position=null;p.path=[];save();render();}
  else if(action==='finish'&&p.phase==='finish'){stop();p.done=true;save();render(false);say(['Good job!','You practised this lesson.']);}
  else if(action==='review'){stop();p.phase='vocabulary';p.vocab=0;save();render();}
 }};
}
