import {letters,words,profiles,makeStages,normalizeProgress,normalizeCheckpoint,wordParts,partSound} from './curriculum.js';
import {recordingVoice} from './recorded-speech.js';
import {createFamilyLessons,familyEntry} from './family-lessons.js';
import {playLessonAudio,stopLessonAudio,toggleLessonPause,syncLessonAudioControls} from './lesson-audio.js';
import {createStageLessons} from './stage-lessons.js';
import {prepareSpokenText} from './speech-highlights.js';
import {stageInfo} from './stage-data.js';
const app=document.querySelector('#app');
const STORE='little-english-v1';
let storageNotice='';
let raw;
try { raw=JSON.parse(localStorage.getItem(STORE)||'null'); } catch { storageNotice='Saved progress could not be read. You can still learn; progress may not be saved in this browser.'; }
let progress=normalizeProgress(raw);
let profile=progress.profile;
let view='stages';
let session=null;
let libraryLetter=null;
let voices=[];

let audioMessage='';
const families=createFamilyLessons({getProgress:()=>progress.pictureFamilies,save,render,onHome:()=>{view='stages';cancelAudio();render();},getSpeed:()=>progress.audioSpeed,isSaved:()=>!storageNotice,onStatus:(message,failed)=>{audioMessage=message;updateAudioStatus();if(failed)announce(message);}});
const stages=createStageLessons({getProgress:()=>progress.learning,getLegacy:()=>progress,save,isSaved:()=>!storageNotice,render,getSpeed:()=>progress.audioSpeed,onStatus:message=>{audioMessage=message;updateAudioStatus();},onFamily:()=>{stages.setStage('words');view='families';families.showLibrary();render();},onLegacy:(which,index)=>{profile=which;stages.setStage(which==='little'?'letters':index>=15?'stories':'words');if(progress.inProgress[which][profiles[which].lessons[index].id])resumeLesson(index);else startLesson(index,which);}});
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=items=>{const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;};
function save(){
 progress.profile=profile;
 try{localStorage.setItem(STORE,JSON.stringify(progress));storageNotice='';}
 catch{storageNotice='Progress could not be saved. Please keep this page open until saving is available.';}
 const notice=document.querySelector('#save-notice');
 if(notice){notice.textContent=storageNotice;notice.hidden=!storageNotice;}
 const status=document.querySelector('#save-status');
 if(status)status.textContent=storageNotice?'Progress not saved':'Saved automatically';
}
function checkpoint(){
 if(view!=='lesson'||!session)return;
 const saved=normalizeCheckpoint(profile,{lessonId:session.lesson.id,step:session.step,tiles:session.tiles,placed:session.placed,choices:session.choices,answer:session.answer,drawing:session.drawing});
 progress.inProgress[profile][session.lesson.id]=saved;
 progress.currentLesson[profile]=session.lesson.id;
 save();
}
function currentCheckpoint(){return progress.inProgress[profile][progress.currentLesson[profile]]||Object.values(progress.inProgress[profile])[0]||null;}
function cancelAudio(){stages.stop();stopLessonAudio();audioMessage='';}
function loadVoices(){voices='speechSynthesis' in window?speechSynthesis.getVoices().filter(v=>v.localService&&/^en([-_]|$)/i.test(v.lang)):[];updateAudioStatus();if(view==='parents')fillVoices();}
function voice(){return voices.find(v=>v.voiceURI===progress.voice)||voices.find(v=>/Natural|Neural/i.test(v.name))||voices.find(v=>/Zira/i.test(v.name))||voices.find(v=>/^en-US/i.test(v.lang))||voices.find(v=>/^en-GB/i.test(v.lang))||voices[0];}
function updateAudioStatus(){const el=document.querySelector('#audio-status');if(el)el.textContent=audioMessage||(view==='stages'?'Listen when you are ready.':view==='families'?'English sounds and Bangla helpers are ready. Tap a listening button.':progress.audioMode==='recorded'||!voice()?'Jenny’s lesson recordings play from this computer.':'Listen uses your selected English voice.');}
function speak(text){playLessonAudio(text,{voice:voice(),speed:progress.audioSpeed,preferRecordings:progress.audioMode==='recorded'},(message,failed)=>{audioMessage=message;updateAudioStatus();if(failed)announce(message);});}
function announce(message){document.querySelector('#announcement').textContent=message;}
function button(label,action,classes='',data=''){return `<button class="btn ${classes}" data-action="${action}" ${data}>${label}</button>`;}
function shell(content){return `<div class="shell"><header class="topbar"><a href="/" class="brand" data-action="home" aria-label="Little English home"><span class="logo" aria-hidden="true">a</span>Little English</a><div class="top-actions">${button('For parents','parents')}</div></header><nav class="stage-nav" aria-label="Learning stages">${Object.entries(stageInfo).map(([id,s])=>`<button data-action="stage" data-stage="${id}" aria-current="${stages.stage()===id?'page':'false'}"><b>${s.title}</b><small>Suggested age ${s.age}</small></button>`).join('')}</nav><p class="stage-guidance">Choose the stage that fits you. Ages are a guide.</p><div id="save-notice" class="notice" role="status" ${storageNotice?'':'hidden'}>${escape(storageNotice)}</div><main id="main">${content}</main><footer class="footer"><span>Made for learning side by side.</span><span>Progress saves in this browser</span></footer></div>`;}
function home(){return stages.html();}
function parentCue(content,open=false){return `<details class="parent-cue" ${open?'open':''}><summary>Parent prompt</summary>${content}</details>`;}
function feedback(){return `<p id="feedback" class="feedback ${session.feedbackKind==='retry'?'retry-text':''}" role="status">${session.feedback||''}</p>`;}
function nextButton(label='Next →'){return button(label,'next','primary');}
function audioButton(text,label='◖)) Listen'){return button(label,'speak','',`data-text="${escape(text)}"`);}
function soundGuide(char){return `<div class="sound-guide"><strong>Say the sound together.</strong> ${letters[char].sound}</div>`;}
function stageContent(){const stage=session.stages[session.step],item=stage.item,l=session.lesson;
 if(stage.type==='letter'){const entry=letters[item];return `<div class="eyebrow">Meet a letter · ${l.items.indexOf(item)+1} of ${l.items.length}</div><h1>Say hello to ${item.toUpperCase()} and ${item}.</h1><p class="lead">A big letter and a little letter. They have the same name.</p><div class="flash"><div class="big-letter">${item.toUpperCase()}${item}</div><div><div class="word-picture" aria-hidden="true">${entry.picture}</div><div class="flash-word">${entry.word}</div></div></div>${audioButton(`The letter ${item.toUpperCase()}. ${entry.word}.`,'◖)) Hear the name & word')}${soundGuide(item)}${parentCue('The listen button says the letter’s name and a whole word. Model the sound yourself using the guide above. Ask your child to repeat it; stop and help whenever needed.') }<div class="activity-actions">${nextButton()}</div>`;}
 if(stage.type==='match'){return `<div class="eyebrow">Find a match</div><h1>Find the little ${item.toUpperCase()}.</h1><p class="lead">Which little letter matches this big letter?</p><div class="big-letter">${item.toUpperCase()}</div><div class="choices">${session.choices.map(x=>`<button class="choice ${session.solved&&x===item?'correct':''} ${session.wrong===x?'retry':''}" data-action="answer" data-value="${x}" ${session.solved?'disabled':''} aria-label="Lowercase ${x}">${x}</button>`).join('')}</div>${feedback()}${audioButton(`Find the little letter ${item.toUpperCase()}.`,'◖)) Hear the question')}${parentCue(`Point out the curved or straight parts. If needed, show the pair: ${item.toUpperCase()} ${item}. There is no timer.`)}<div class="activity-actions">${session.solved?nextButton():''}</div>`;}
 if(stage.type==='trace'){return `<div class="eyebrow">Have a go at writing</div><h1>Let’s write ${item}.</h1><p class="lead">Draw over the letter with your finger or mouse, or use paper.</p><div class="canvas-wrap"><span class="canvas-guide" aria-hidden="true">${item}</span><canvas id="writing" aria-label="Free drawing area for the letter ${item}. Paper is an alternative."></canvas></div>${button('Clear drawing','clear')}${parentCue('Show the letter slowly on paper first, using the letter shape taught at school. This is a free practice area; it does not check handwriting. Say the sound while writing.',true)}<div class="activity-actions">${nextButton('We practised →')}</div>`;}
 if(stage.type==='word'){const parts=wordParts(item);return `<div class="eyebrow">Listen & blend · ${l.items.indexOf(item)+1} of ${l.items.length}</div><h1>Meet the word ${item}.</h1><div class="word-picture" aria-hidden="true">${words[item]}</div><div class="slots" aria-label="${parts.join(', ')}">${parts.map(c=>`<span class="slot filled ${c.length>1?'sound-pair':''}">${c}</span>`).join('')}</div><p class="lead">Say each sound. Slide the sounds together. Say the word.</p>${l.focus?`<p class="lesson-focus">${l.focus}</p>`:''}${audioButton(item,'◖)) Hear the whole word')}<div class="sound-guide"><strong>Parent: model the sounds.</strong> Use the sounds in ${item}, not the letter names. ${parts.map(c=>`<p><b>${c}</b> · ${partSound(c)}</p>`).join('')}</div>${parentCue('Explain what the word means before building it. Pictures are memory hints; some actions and objects need a real-life example. The voice reads whole words, not isolated phonemes.')}<div class="activity-actions">${nextButton('Let’s try →')}</div>`;}
 if(stage.type==='build'){const placed=session.placed.map(i=>session.tiles[i]).join('');return `<div class="eyebrow">Build a word</div><h1>Can you build the word?</h1><p class="lead">Listen, then tap the letters in order. Say their sounds as you go.</p>${audioButton(item,'◖)) Hear the word')}<div class="slots" aria-label="Your word: ${placed||'empty'}">${[...item].map((_,i)=>`<span class="slot ${placed[i]?'filled':''}">${placed[i]||''}</span>`).join('')}</div><div class="choices letter-choices">${session.tiles.map((c,i)=>`<button class="tile" data-action="tile" data-index="${i}" aria-label="Letter ${c}" ${session.placed.includes(i)||session.solved?'disabled':''}>${c}</button>`).join('')}</div>${feedback()}${!session.solved?button('Try the letters again','undo'):''}${parentCue(`If audio is unavailable, say “${item}” aloud. Help your child listen for each sound and choose its letter. Revisit the sounds before moving on.`)}<div class="activity-actions">${session.solved?nextButton():''}</div>`;}
 if(stage.type==='listen'){return `<div class="eyebrow">Listen & find</div><h1>Which word do you hear?</h1><p class="lead">Listen, then tap the matching word.</p>${audioButton(item,'◖)) Play the word')}<div class="choices">${session.choices.map(x=>`<button class="choice word-choice ${session.solved&&x===item?'correct':''} ${session.wrong===x?'retry':''}" data-action="answer" data-value="${x}" ${session.solved?'disabled':''}>${x}</button>`).join('')}</div>${feedback()}${parentCue(`Say “${item}” aloud if audio is unavailable. Let your child sound out all three choices before choosing.`)}<div class="activity-actions">${session.solved?nextButton():''}</div>`;}
 if(stage.type==='read'){return `<div class="eyebrow">A tiny bit of reading</div><h1>Read it together.</h1>${parentCue(escape(l.cue),true)}<p class="sentence">${l.sentence}</p>${audioButton(l.sentence,'◖)) Hear the sentence')}<h2 class="read-question">${l.question}</h2><div class="choices">${session.choices.map(x=>`<button class="choice word-choice ${session.solved&&x===l.answer?'correct':''} ${session.wrong===x?'retry':''}" data-action="answer" data-value="${x}" ${session.solved?'disabled':''}>${x}</button>`).join('')}</div>${feedback()}<div class="activity-actions">${session.solved?nextButton():''}</div>`;}
 const phrase=profile==='little'?l.talk[0]:l.sentence,guide=profile==='little'?l.talk[1]:l.talk;
 return `<div class="eyebrow">Use your English</div><h1>Now it’s your turn to talk.</h1><p class="sentence">${phrase}</p>${audioButton(phrase.replace(' …',''),'◖)) Listen & repeat')}<div class="sound-guide"><strong>Try it together.</strong> ${guide}</div><p class="lead">A word, a gesture, or a little help is a good start.</p>${parentCue('Invite your child to have a go. Praise the effort. You decide when the practice is finished; the site does not record or assess speech.')}<div class="activity-actions">${nextButton('We tried it! Finish ★')}</div>`;
}
function lessonView(){return `<div class="lesson-head">${button('← Learning path','home','quiet')}<div class="lesson-meta">${profiles[profile].name}<br>Lesson ${session.index+1} · Activity ${session.step+1} of ${session.stages.length}<br><span id="save-status">${storageNotice?'Progress not saved':'Saved automatically'}</span></div></div><div class="steps" aria-label="Activity ${session.step+1} of ${session.stages.length}">${session.stages.map((_,i)=>`<span class="step ${i<=session.step?'done':''}"></span>`).join('')}</div><section class="activity">${stageContent()}<p class="status" id="audio-status"></p></section>`;}
function completedView(){const done=progress.completed[profile].length;return `<div class="lesson-head">${button('← Learning path','home','quiet')}</div><section class="activity"><div class="complete-star" aria-hidden="true">🌟</div><div class="eyebrow">Lesson ${session.index+1} complete</div><h1>You did it, ${profiles[profile].name}!</h1><p class="lead">${session.alreadyCompleted?'Another lovely bit of practice. Your lesson star is already saved.':'A new lesson star for trying, listening, and learning together.'}</p><div class="complete-summary"><div><b>${session.lesson.items.join(' · ')}</b><span>What we practised</span></div><div><b>${done} ${done===1?'star':'stars'}</b><span>On your learning path</span></div></div><div class="sound-guide"><strong>Now try it away from the screen.</strong> ${profile==='little'?session.lesson.talk[1]:session.lesson.talk}</div><p class="muted">A good time for a break. You can come back whenever you like.</p><div class="activity-actions">${button('Back to my path','home','primary')}${button('Practise this lesson again','start','',`data-index="${session.index}"`)}</div></section>`;}
function parentsView(){return `<div class="guide">${button('← Back to learning','home','quiet')}<h1>Learning at your child’s pace.</h1><section class="side-card"><h2>Letters → Words → Stories</h2><p><b>Letters · suggested age 4+:</b> two examples per letter, accurate recorded letter sounds, automatic example playback after Start, and matching and writing practice. Next and Previous change letters; the player never changes letters by itself.</p><p><b>Words · suggested age 5+:</b> start with picture-word spelling using individual letter names, then blend familiar sounds into short words, meet helping words explicitly, then read phrases and complete picture sentences. The completed sentence stays on screen to read aloud. Picture families, Bangla meaning and pronunciation audio, word building, and saved word writing remain here.</p><p><b>Stories · suggested age 6+:</b> connected sentences, sh and ch, then ai and ea. Read complete paragraphs independently or try paragraph blanks. Meet supporting words first. Audio is optional.</p><p>These ages guide you; all stages are open to every child. Stop whenever your child is tired.</p></section><section class="side-card"><h2>Names, sounds and helping words</h2><p>Letter names and phonics sounds are separate recordings. The isolated sounds use Oxford Owl’s phonics clips; whole words and new sentences use Sonia’s English recordings. Q is taught with u as /kw/. X is heard at the end of box and fox as /ks/. Early words use short vowels; seat comes later with the ea vowel team.</p><p>Some useful words, including I, see, a and the, need explicit help before reading. Bangla spellings are pronunciation helpers; listen to the English word too.</p><p><a href="https://home.oxfordowl.co.uk/reading/what-is-letters-and-sounds/" target="_blank" rel="noopener noreferrer">Oxford Owl: sounds and blending</a></p></section><section class="side-card"><h2>Progress and practice</h2><p>Existing letter and word lesson stars, unfinished answers, picture rounds and writing drawings are preserved. New word lessons, story answers and completed practice save alongside them. Returning to the same browser restores that work. The first screen is Aa; a saved later letter has a Continue button.</p><p>Progress is private to this browser and device. Clearing browser data removes it. Stars and ticks record practice; they are not reading or handwriting assessments.</p></section><section class="side-card"><h2>Listening settings</h2><label for="voice-select">Voice for earlier exercises</label><div class="voice-controls"><select id="voice-select" aria-label="English listening voice"></select>${audioButton('Hello! Let’s learn English together.','Test voice')}</div><div class="voice-controls"><label for="speech-speed">Listening speed</label><select id="speech-speed"><option value="1" ${progress.audioSpeed===1?'selected':''}>Normal</option><option value="0.85" ${progress.audioSpeed===.85?'selected':''}>Slower</option></select></div><p>Highlights follow the recorded audio. Earlier sentences without word timings highlight the whole sentence. Computer voices use word highlights when they provide word boundaries.</p><p>All new stage recordings, pictures and existing bilingual clips play from the site. The local app also plays these files without internet.</p><p id="audio-status" class="status"></p></section></div>`;}
function alphabetView(){return `<div class="guide">${button('← Learning path','home','quiet')}<div class="intro"><div><div class="eyebrow">The alphabet corner</div><h1>Pick a letter. Say hello.</h1><p class="muted">Tap any letter to explore together.</p></div></div><div class="letter-grid">${Object.keys(letters).map(c=>`<button data-action="letter" data-letter="${c}" aria-label="Explore ${c.toUpperCase()} ${c}">${c.toUpperCase()}${c}</button>`).join('')}</div>${libraryLetter?`<section class="activity"><div class="big-letter">${libraryLetter.toUpperCase()}${libraryLetter}</div><div class="word-picture" aria-hidden="true">${letters[libraryLetter].picture}</div><h2>${letters[libraryLetter].word}</h2><div class="activity-actions">${audioButton(`The letter ${libraryLetter.toUpperCase()}. ${letters[libraryLetter].word}.`,'◖)) Hear the name & word')}</div>${soundGuide(libraryLetter)}<p id="audio-status" class="status"></p></section>`:''}</div>`;}
function fillVoices(){
 const select=document.querySelector('#voice-select');if(!select)return;
 const recordedSelected=progress.audioMode==='recorded'||!voice();
 select.innerHTML=`<option value="recorded" ${recordedSelected?'selected':''}>${escape(recordingVoice)} — lesson recordings</option>`+voices.map(v=>`<option value="${escape(v.voiceURI)}" ${!recordedSelected&&v===voice()?'selected':''}>${escape(v.name)} (${escape(v.lang)})</option>`).join('');
}
function render(focus=true){app.innerHTML=shell(view==='stages'?stages.html():view==='families'?families.html():view==='lesson'?lessonView():view==='complete'?completedView():view==='parents'?parentsView():view==='alphabet'?alphabetView():home());families.mount();prepareSpokenText(app);if(view!=='stages'&&app.querySelector('[data-action="speak"],[data-action="family-audio"]')){const control=document.createElement('button');control.className='btn';control.dataset.action='audio-pause';control.textContent='Pause';control.disabled=true;control.setAttribute('aria-pressed','false');app.querySelector('#audio-status')?.before(control);syncLessonAudioControls();}updateAudioStatus();if(view==='parents')fillVoices();if(view==='lesson'&&session.stages[session.step].type==='trace')setupCanvas();if(focus){const heading=app.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});}}
function startLesson(index,which=profile){
 if(!Object.hasOwn(profiles,which)||!Number.isInteger(index)||!profiles[which].lessons[index])throw new Error('Choose an existing learner and lesson.');
 stages.setStage(which==='little'?'letters':index>=15?'stories':'words');cancelAudio();profile=which;
 const lesson=profiles[profile].lessons[index];
 session={index,lesson,stages:makeStages(profile,lesson),step:0,alreadyCompleted:progress.completed[profile].includes(lesson.id)};
 view='lesson';prepareStage();checkpoint();render();
}
function resumeLesson(index){
 const lesson=profiles[profile].lessons[index];
 const saved=lesson&&progress.inProgress[profile][lesson.id];
 if(!saved)return startLesson(index);
 cancelAudio();
 session={index,lesson,stages:makeStages(profile,lesson),step:saved.step,alreadyCompleted:progress.completed[profile].includes(lesson.id)};
 view='lesson';prepareStage();
 if(saved.tiles.length){session.tiles=[...saved.tiles];session.placed=[...saved.placed];}
 if(saved.choices.length)session.choices=[...saved.choices];
 session.answer=saved.answer;
 session.drawing=saved.drawing.map(stroke=>stroke.map(point=>[...point]));
 updateFeedback();checkpoint();render();
}
function prepareStage(){
 const stage=session.stages[session.step];
 session.solved=false;session.wrong=null;session.feedback='';session.feedbackKind='';session.answer=null;session.drawing=[];session.placed=[];session.choices=[];
 session.tiles=stage.type==='build'?shuffle([...stage.item]):[];
 if(stage.type==='match'){const alternatives=shuffle(Object.keys(letters).filter(x=>x!==stage.item)).slice(0,2);session.choices=shuffle([stage.item,...alternatives]);}
 else if(stage.type==='listen')session.choices=shuffle(session.lesson.items);
 else if(stage.type==='read')session.choices=shuffle(session.lesson.choices);
}
function updateFeedback(){
 const stage=session.stages[session.step];
 session.solved=false;session.wrong=null;session.feedback='';session.feedbackKind='';
 if(stage.type==='build'&&session.placed.length===session.tiles.length){
  session.solved=session.placed.map(i=>session.tiles[i]).join('')===stage.item;
  session.feedback=session.solved?'You built it! Read your word aloud.':'Let’s try that again. Say each sound and choose its letter.';
 }else if(['match','listen','read'].includes(stage.type)&&session.answer!==null){
  const expected=stage.type==='read'?session.lesson.answer:stage.item;
  session.solved=session.answer===expected;
  session.feedback=session.solved?'Yes! You found it.':'Good try. Look or listen again — you can do it.';
  session.wrong=session.solved?null:session.answer;
 }
 if(session.feedback)session.feedbackKind=session.solved?'correct':'retry';
}
function answer(value){
 if(session.solved||!session.choices.includes(value))return;
 session.answer=value;updateFeedback();checkpoint();render(false);announce(session.feedback);
 app.querySelector(session.solved?'[data-action="next"]':'.choice.retry')?.focus({preventScroll:true});
}
function advance(){
 const stage=session.stages[session.step];
 if(['match','build','listen','read'].includes(stage.type)&&!session.solved)return;
 cancelAudio();
 if(session.step===session.stages.length-1){
  if(!progress.completed[profile].includes(session.lesson.id))progress.completed[profile].push(session.lesson.id);
  progress.last[profile]=new Date().toISOString();
  delete progress.inProgress[profile][session.lesson.id];
  if(progress.currentLesson[profile]===session.lesson.id)progress.currentLesson[profile]=null;
  view='complete';save();
 }else{session.step++;prepareStage();checkpoint();}
 render();
}
function placeTile(index){
 if(session.solved||session.placed.includes(index)||session.placed.length>=session.tiles.length||!session.tiles[index])return;
 session.placed.push(index);updateFeedback();checkpoint();render(false);
 const focusTarget=session.solved?'[data-action="next"]':session.placed.length===session.tiles.length?'[data-action="undo"]':'.tile:not(:disabled)';
 app.querySelector(focusTarget)?.focus({preventScroll:true});announce(session.feedback);
}
function setupCanvas(){
 const canvas=document.querySelector('#writing');
 const rect=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;
 canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
 const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#2e52df';
 function drawStroke(stroke){
  if(!stroke.length)return;
  ctx.beginPath();ctx.moveTo(stroke[0][0]*rect.width,stroke[0][1]*rect.height);
  if(stroke.length===1)ctx.lineTo(stroke[0][0]*rect.width+.01,stroke[0][1]*rect.height+.01);
  for(const [x,y]of stroke.slice(1))ctx.lineTo(x*rect.width,y*rect.height);
  ctx.stroke();
 }
 session.drawing.forEach(drawStroke);
 let stroke=null;
 const point=event=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))];};
 canvas.addEventListener('pointerdown',event=>{
  if(stroke)return;
  event.preventDefault();canvas.setPointerCapture(event.pointerId);
  stroke=[point(event)];session.drawing.push(stroke);drawStroke(stroke);
 });
 canvas.addEventListener('pointermove',event=>{if(!stroke)return;stroke.push(point(event));drawStroke(stroke.slice(-2));});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{if(stroke){stroke=null;checkpoint();}});
}
app.addEventListener('click',event=>{
 const target=event.target.closest('[data-action]');if(!target||target.disabled)return;
 const action=target.dataset.action;
 if(action==='stage'){
  checkpoint();families.checkpoint();cancelAudio();stages.setStage(target.dataset.stage);view='stages';render();return;
 }
 if(action.startsWith('stages-')){stages.handle(target.dataset);return;}
 if(view==='families'&&!action.startsWith('family-'))families.checkpoint();
 if(action.startsWith('family-')){if(view!=='families'){cancelAudio();stages.setStage('words');view='families';}families.handle(target.dataset);return;}
 if(action==='home'){event.preventDefault();checkpoint();cancelAudio();view='stages';render();}
 else if(action==='profile'){cancelAudio();profile=target.dataset.profile;save();render(false);}
 else if(action==='parents'){checkpoint();cancelAudio();view='parents';render();}
 else if(action==='alphabet'){cancelAudio();stages.setStage('letters');view='stages';render();}
 else if(action==='letter'){cancelAudio();libraryLetter=target.dataset.letter;render(false);}
 else if(action==='start')startLesson(Number(target.dataset.index));
 else if(action==='resume')resumeLesson(Number(target.dataset.index));
 else if(action==='audio-pause')toggleLessonPause();
 else if(action==='speak')speak(target.dataset.text);
 else if(action==='next')advance();else if(action==='answer')answer(target.dataset.value);
 else if(action==='tile')placeTile(Number(target.dataset.index));
 else if(action==='undo'){session.placed=[];updateFeedback();checkpoint();render(false);}
 else if(action==='clear'){const canvas=document.querySelector('#writing'),ctx=canvas.getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore();session.drawing=[];checkpoint();}
});
app.addEventListener('change',event=>{
 if(event.target.id==='voice-select'){
  cancelAudio();progress.audioMode=event.target.value==='recorded'?'recorded':'system';
  if(progress.audioMode==='system')progress.voice=event.target.value;
  save();updateAudioStatus();
 }else if(['speech-speed','family-speed'].includes(event.target.id)){
  cancelAudio();progress.audioSpeed=event.target.value==='0.85'?0.85:1;save();updateAudioStatus();
 }
});
if('speechSynthesis' in window)speechSynthesis.addEventListener('voiceschanged',loadVoices);
window.addEventListener('pagehide',()=>{checkpoint();families.checkpoint();cancelAudio();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){checkpoint();families.checkpoint();}});
loadVoices();render(false);
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 const definitions=[
  {name:'read_learning_progress',title:'Read learning progress',description:'Read each learner’s completed lesson count without changing progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:input=>{if(input&&Object.keys(input).length)throw new Error('No arguments are accepted.');return Object.fromEntries(Object.keys(profiles).map(key=>[key,{name:profiles[key].name,completed:progress.completed[key].length,total:profiles[key].lessons.length}]));}},
  {name:'start_english_lesson',title:'Start an English lesson',description:'Select a learner and open a lesson at its first activity. This does not mark it complete.',inputSchema:{type:'object',properties:{learner:{type:'string',enum:['little','big']},lessonNumber:{type:'integer',minimum:1,maximum:Math.max(...Object.values(profiles).map(p=>p.lessons.length))}},required:['learner','lessonNumber'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['learner','lessonNumber'].includes(k))||!Object.hasOwn(profiles,input.learner)||!Number.isInteger(input.lessonNumber)||input.lessonNumber<1||input.lessonNumber>profiles[input.learner].lessons.length)throw new Error('Choose an existing lesson from the selected learner’s path.');startLesson(input.lessonNumber-1,input.learner);return{learner:profile,lessonNumber:session.index+1,activity:1,completed:false};}}
 ];
 for(const definition of definitions){try{Promise.resolve(document.modelContext.registerTool(definition,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser API: the visible lessons remain available. */}}
}
