import {atSteps,atHelpingWords,atReviewWords,atStory,atHatMeaning,isAtQuestion} from './at-reading-data.js';
import {atScene} from './at-reading-scene.js';
import {familyWords} from './family-data.js';
import {playStageSequence,stageAudioState,stopStageAudio,toggleStagePause,stageClip} from './stage-audio.js';
import {stopLessonAudio} from './lesson-audio.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,extra='',kind='')=>'<button class="btn '+kind+'" data-action="family-reading-'+action+'" '+extra+'>'+label+'</button>';
const stepName=step=>step.type==='help'?'Meet '+step.word:step.type==='phrase'?step.text:step.type==='sentence'?'Sentence '+(step.line+1):step.type==='paragraph'?'Read the whole story':step.type==='finish'?'Practice complete':step.id.startsWith('paragraph-')?'Story gap: '+step.answer:step.id.startsWith('play-')?'Let’s play: '+step.type:'Sentence gap: '+step.answer;
// These spans retain exact character offsets, including repeated words. Blank
// and correct-answer styling survives because the global renderer leaves them intact.
function readingText(text,filledWord=null,blank=false,line){
 let html='',cursor=0;
 for(const match of text.matchAll(/\S+/gu)){
  html+=esc(text.slice(cursor,match.index));const word=match[0],plain=word.replace(/[.,!?]/g,'');
  html+='<span class="spoken-word '+(plain===filledWord?'at-filled':blank&&plain==='___'?'at-slot current':'')+'" data-from="'+match.index+'" data-to="'+(match.index+word.length)+'">'+esc(word)+'</span>';cursor=match.index+word.length;
 }
 return '<span class="at-reading-text" '+(line===undefined?'':'data-line="'+line+'" ')+'data-spoken-text="'+esc(text)+'">'+html+esc(text.slice(cursor))+'</span>';
}
export function createAtReading({getProgress,save,render,status,onBack,getSpeed,picture,isSaved}){
 const p=()=>getProgress(),step=()=>atSteps[p().step];
 function stop(){stopStageAudio();stopLessonAudio();status('');}
 function sync(){const audio=stageAudioState();document.querySelectorAll('[data-action="family-reading-pause"]').forEach(control=>{control.disabled=!audio.playing;control.textContent=audio.paused?'Resume':'Pause';control.setAttribute('aria-pressed',String(audio.paused));});}
 function say(parts){stop();status('Listening…');playStageSequence(parts,{speed:getSpeed(),onState:sync,onEnd:()=>{status('Ready to listen again.');sync();},onError:message=>{status(message);sync();}});}
 const line=(text,index)=>({key:'text:'+text,line:index});
 function answerState(s=step()){
  return p().answers[s.id]??={firstChoice:null,firstAttemptCorrect:null,attempts:0,incorrect:0,assistedAttempts:0,choice:null,correct:false,assisted:false,demonstrated:false,helpOpen:false,easier:false};
 }
 function phonics(word){return [...word].map((letter,index)=>({key:'sound:'+letter,target:'.at-demo-word [data-part="'+index+'"]'})).concat({key:'at-review-word:'+word,target:'.at-demo-word'});}
 function instruction(s=step()){return s.type==='picture'?'picture':s.type==='letter'?'letter':s.type==='paragraph-blank'?'paragraph':'sentence';}
 function read(){
  const s=step(),review=p().review;
  if(review!==null){say([{key:'at-review-word:'+atReviewWords[review],target:'.at-demo-word'}]);return;}
  if(isAtQuestion(s)){
   const a=answerState();
   if(a.helpOpen){say([{key:'at-say:help'},...phonics(s.word)]);return;}
   if(a.correct&&['blank','play-blank'].includes(s.type)){say([line(s.text.replace('___',s.answer))]);return;}
   const parts=[{key:'at-say:'+instruction()}];if(s.type==='picture')parts.push({key:'at-review-word:'+s.answer});say(parts);return;
  }
  if(s.type==='help'){
   const name=['a','the'].includes(s.word)?[]:[{key:'word:'+s.word,target:'.at-help-word'}];say([...name,line(s.example)]);
  }else if(['phrase','sentence'].includes(s.type))say([line(s.text)]);
  else if(s.type==='paragraph')say(atStory.map(line));
 }
 function meaning(){
  if(p().review!==null){const word=atReviewWords[p().review];return {text:familyWords[word].meaning,key:'at-review-meaning:'+word};}
  const s=step();
  if(s.type==='help')return {text:s.meaning,key:'at-meaning:'+s.word.toLowerCase()};
  if(s.type==='phrase'){const word=s.text.slice(2);return {text:familyWords[word].meaning,key:'at-review-meaning:'+word};}
  if(s.type==='sentence'){
   if(s.line===3)return {text:atHatMeaning,key:'at-meaning:hat-on-cat'};
   const h=atHelpingWords.find(h=>h.word===['I','is','has',null,'too'][s.line]);return {text:h.meaning,key:'at-meaning:'+h.word.toLowerCase()};
  }
  return null;
 }
 function tools(){const info=meaning();return '<div class="at-audio-controls">'+button('Replay','audio')+button('Pause','pause','disabled aria-pressed="false"')+(info?button('মানে','meaning','lang="bn" aria-haspopup="dialog"'):'')+'</div>';}
 function demoWord(word){return '<p class="at-demo-word" aria-label="'+word+'">'+[...word].map((letter,index)=>'<span data-part="'+index+'">'+letter+'</span>').join('')+'</p>';}
 function navigation(){
  const s=step(),a=isAtQuestion(s)?answerState():null;
  return '<div class="at-reading-paging">'+button('← Previous','previous',p().step===0?'disabled':'')+'<span>'+(p().step+1)+' / '+atSteps.length+'</span>'+(a?.helpOpen?button('Try with help →','help-retry','','primary'):button(s.type==='paragraph'?'Let’s play →':'Next →','next',a&&!a.correct?'disabled':'','primary'))+'</div>';
 }
 function paragraph(blanks=false){
  const mat=p().answers['paragraph-mat'],hat=p().answers['paragraph-hat'],s=step();
  const sentences=blanks?[atStory[0],'The cat is on a '+(mat?.choice||'___')+'.',atStory[2],'The '+(hat?.choice||'___')+' is on the cat.',atStory[4]]:atStory;
  return '<div class="at-paragraph" aria-label="The five-sentence story">'+sentences.map((text,index)=>{
   const answer=index===1?mat:index===3?hat:null,current=blanks&&index===(s.id==='paragraph-mat'?1:3);
   return '<span class="at-paragraph-line '+(current?'active-gap-line':'')+'">'+readingText(text,blanks&&answer?.correct?(index===1?'mat':'hat'):null,current,index)+'</span>';
  }).join(' ')+'</div>';
 }
 function hint(s){return s.type==='picture'?'Listen again. Which picture matches?':s.type==='letter'?'Listen for the first sound in hat.':s.word==='mat'?'Look under the cat.':s.word==='hat'?'Look at the cat’s head.':'Look at the animal in the picture.';}
 function questionHtml(s){
  const a=answerState();
  if(a.helpOpen)return '<h1>Let’s try together.</h1>'+atScene(s.word)+demoWord(s.word)+'<p class="at-question-hint">Hear each sound, then the word.</p>'+tools()+'<p class="at-feedback helped" role="status">Try matching this word next.</p>';
  const sentence=['blank','play-blank'].includes(s.type),text=sentence?s.text.replace('___',a.choice||'___'):s.text;
  const heading=s.type==='paragraph-blank'?'Complete the story.':s.type==='picture'?'Which picture do you hear?':s.type==='letter'?'Find the first sound.':'Complete the sentence.';
  const content=s.type==='paragraph-blank'?paragraph(true):s.type==='picture'?'':s.type==='letter'?'<p class="at-sentence at-letter-gap">'+(a.choice||'_')+'at</p>':'<p class="at-sentence">'+readingText(text,a.correct?s.answer:null,true)+'</p>';
  const scene=s.scene?atScene(s.scene):'';
  const choices='<div class="at-reading-choices" role="group" aria-label="Choose one answer">'+s.choices.map(choice=>'<button class="at-choice '+(a.choice===choice?(a.correct?'correct':'retry'):'')+'" data-action="family-reading-answer" data-choice="'+choice+'" '+(a.correct?'disabled':'')+' aria-label="'+(s.type==='picture'?'Choose the '+choice+' picture':choice)+'">'+(s.type==='picture'?atScene(choice,true):esc(choice))+'</button>').join('')+'</div>';
  const feedback=a.correct?'✓ '+(s.type==='picture'?'Say the word together.':s.type==='letter'?'h–a–t → hat.':'Read the whole sentence.'):(a.choice?hint(s):s.type==='paragraph-blank'?'Choose a word for the yellow gap.':s.type==='letter'?'Choose h, c, or m.':'Choose one answer.');
  return '<h1>'+heading+'</h1>'+scene+content+(a.easier&&!a.correct?'<p class="at-easier">Use this word: <b>'+s.answer+'</b></p>':'')+choices+'<p class="at-feedback '+(!a.correct&&a.choice?'retry':'')+'" role="status">'+esc(feedback)+'</p>'+tools();
 }
 function revisit(){return p().completed.length?'<details class="at-revisit"><summary>Revisit completed activities</summary><div>'+atSteps.filter(s=>p().completed.includes(s.id)).map(s=>button(esc(stepName(s)),'visit','data-step="'+atSteps.indexOf(s)+'"')).join('')+'</div></details>':'';}
 function meaningDialog(){
  const info=meaning();return info?'<dialog class="at-meaning-dialog" aria-labelledby="at-meaning-title"><h2 id="at-meaning-title">মানে</h2><p class="at-meaning-text" lang="bn">'+esc(info.text)+'</p><div>'+ (stageClip(info.key)?button('মানে শুনি','meaning-audio','lang="bn"')+button('Pause','pause','disabled aria-pressed="false"'):'')+button('Back to reading','meaning-close','autofocus')+'</div></dialog>':'';
 }
 function html(){
  const s=step(),progress=p();let body='',label='';
  if(progress.review!==null){const word=atReviewWords[progress.review];label='Optional picture-word review';body='<h1>'+word+'</h1>'+picture(word)+demoWord(word)+'<div class="at-audio-controls">'+button('Replay','audio')+button('Sounds','review-sounds')+button('Pause','pause','disabled aria-pressed="false"')+button('মানে','meaning','lang="bn"')+'</div><div class="at-reading-paging">'+button('← Previous','review-previous',progress.review===0?'disabled':'')+'<span>'+(progress.review+1)+' / 4</span>'+button(progress.review===3?'Read next →':'Next →','review-next','','primary')+'</div>'+button('Skip review →','review-skip','','quiet');}
  else if(s.type==='finish'){
   label='The -at family · Practice complete';body='<span class="at-earned-star" role="img" aria-label="One star for completing practice">★</span><h1>You practised your story!</h1><p>You earned a star for practice.</p><p class="at-completion-note">'+(Object.values(progress.answers).some(a=>a.assisted)?'We practised with help.':'Keep reading it together.')+'</p>'+button('Back to the -at family →','back','','primary')+(progress.wordsNeedingPractice.length?'<p class="small muted">Words to practise: '+progress.wordsNeedingPractice.join(', ')+'.</p>':'');
  }else{
   label=s.type==='help'?'Helping word '+(progress.step+1)+' of 8':s.type==='phrase'?'Read a short phrase':s.type==='sentence'?'Sentence '+(s.line+1)+' of 5':s.type==='paragraph'?'Your complete story':s.id.startsWith('play-')?'Let’s play · '+(progress.step-atSteps.findIndex(s=>s.id==='play-picture')+1)+' of 3':'Picture-supported practice';
   if(isAtQuestion(s))body=questionHtml(s);
   else if(s.type==='help')body='<h1 class="at-help-word">'+s.word+'</h1>'+atScene(s.scene)+'<p class="at-sentence">'+readingText(s.example)+'</p>'+tools();
   else if(['phrase','sentence'].includes(s.type))body='<h1>'+(s.type==='phrase'?'A little phrase':'Read this sentence.')+'</h1>'+atScene(s.scene)+'<p class="at-sentence">'+readingText(s.text)+'</p>'+tools();
   else if(s.type==='paragraph')body='<h1>Read the whole story.</h1>'+atScene('complete')+paragraph()+'<p class="at-reading-invite">Read it aloud, with help if you like.</p>'+tools();
   body+=navigation();
  }
  return '<div class="at-reading-head">'+button('← -at family','back','','quiet')+'<label class="at-speed">Audio <select id="family-speed" aria-label="Listening speed"><option value="1" '+(getSpeed()===1?'selected':'')+'>Normal</option><option value="0.85" '+(getSpeed()===.85?'selected':'')+'>Slower</option></select></label></div><section class="activity at-reading-player" data-reading-step="'+s.id+'" data-reading-index="'+progress.step+'" data-review="'+(progress.review===null?'':progress.review)+'"><div class="eyebrow">'+label+'</div>'+body+'<p id="audio-status" class="status" role="status"></p><p id="save-status" class="at-reading-save">'+(isSaved()?'Saved automatically':'Progress not saved')+'</p></section>'+revisit()+meaningDialog();
 }
 function open(review=false){stop();p().started=true;if(review)p().review=0;save();render();if(p().review===null&&isAtQuestion(step())&&!answerState().correct)read();}
 function change(index){if(!Number.isInteger(index)||index<0||index>=atSteps.length)return;stop();p().step=index;p().review=null;p().meaningOpen=false;save();render();if(isAtQuestion(step())&&!answerState().correct)read();}
 function choose(choice){
  const s=step();if(!isAtQuestion(s)||!s.choices.includes(choice))return;const a=answerState();if(a.correct||a.helpOpen)return;
  stop();a.attempts++;if(a.assisted||a.easier)a.assistedAttempts++;a.choice=choice;if(a.firstChoice===null){a.firstChoice=choice;a.firstAttemptCorrect=choice===s.answer;}
  a.correct=choice===s.answer;
  if(a.correct){if(!p().completed.includes(s.id))p().completed.push(s.id);save();render(false);document.querySelector('[data-action="family-reading-next"]')?.focus({preventScroll:true});say([{key:'at-say:praise'},{key:'at-tone:success',pauseAfter:0}]);}
  else{
   a.incorrect++;a.assisted=true;if(!p().wordsNeedingPractice.includes(s.word))p().wordsNeedingPractice.push(s.word);
   if(a.incorrect>=2&&!a.demonstrated){a.demonstrated=true;a.helpOpen=true;save();render();say([{key:'at-say:help'},...phonics(s.word)]);}
   else{save();render(false);document.querySelector('.at-choice.retry')?.focus({preventScroll:true});say([{key:'at-say:retry'}]);}
  }
 }
 return {html,stop,open,sync,
  entry(){const progress=p();return '<section class="at-reading-entry"><div><h2>Read sentences &amp; a story</h2><p>A cat, a mat, a hat, and a rat. Read one little step at a time.</p><div class="at-entry-buttons">'+button('Read sentences &amp; a story','open','','primary')+(progress.started?button('Continue from step '+(progress.step+1)+' →','continue'):'')+button('Review cat, mat, hat &amp; rat','review')+'</div><p class="small muted">'+(progress.star?'★ Reading practice complete.':progress.completed.length+' reading activities practised.')+' Review is optional; your word rounds stay saved.</p></div></section>';},
  resume(){return p().started?'<div class="family-resume"><div><b>Your -at reading is saved.</b><p>Continue from step '+(p().step+1)+'.</p></div>'+button('Continue reading →','continue','','primary')+'</div>':'';},
  mount(){document.querySelector('#family-speed')?.addEventListener('change',()=>{stop();sync();});const dialog=document.querySelector('.at-meaning-dialog');if(p().meaningOpen&&dialog&&!dialog.open){dialog.addEventListener('cancel',event=>{event.preventDefault();this.handle({action:'family-reading-meaning-close'});});dialog.showModal();}},
  handle(data){
   const action=data.action.replace('family-reading-','');
   if(action==='back'){stop();p().meaningOpen=false;save();onBack();}
   else if(action==='audio')read();
   else if(action==='pause')toggleStagePause();
   else if(action==='meaning'){stop();p().meaningOpen=true;save();render(false);}
   else if(action==='meaning-close'){stop();p().meaningOpen=false;save();render(false);document.querySelector('[data-action="family-reading-meaning"]')?.focus({preventScroll:true});}
   else if(action==='meaning-audio'){const info=meaning();if(info&&stageClip(info.key))say([{key:info.key,target:'.at-meaning-text'}]);}
   else if(action==='answer')choose(data.choice);
   else if(action==='help-retry'){const a=answerState();if(!a.helpOpen)return;stop();a.helpOpen=false;a.easier=true;a.assisted=true;save();render();}
   else if(action==='next'){
    const s=step();if(s.type==='finish'||isAtQuestion(s)&&!answerState().correct)return;
    if(!p().completed.includes(s.id))p().completed.push(s.id);
    if(s.id==='play-sentence')p().star=true;
    change(p().step+1);
   }else if(action==='previous')change(p().step-1);
   else if(action==='visit'){const index=Number(data.step);if(p().completed.includes(atSteps[index]?.id))change(index);}
   else if(action==='review-sounds')say(phonics(atReviewWords[p().review]));
   else if(action==='review-next'||action==='review-previous'){stop();p().review+=action==='review-next'?1:-1;if(p().review<0)p().review=0;if(p().review>3)p().review=null;save();render();}
   else if(action==='review-skip'){stop();p().review=null;save();render();}
  }
 };
}
