import {createSentenceWriting} from './sentence-writing.js';
import {isLearningSection} from './section-registry.js';
import {createLetterMatching} from './letter-match.js';
import {wordIllustration} from './word-art.js';
import {createScienceFlow} from './science-flow.js';
import {createMathFlow} from './math-flow.js';
import {createAlphabetReading} from './alphabet-reading.js';
import {createMoveFlow} from './move-flow.js';
import {valuesStories,valuesOrder} from './values-stories.js';
import {createValueStoryFlow} from './values-flow.js';
import {valueScene} from './values-scenes.js';
import {storyScene} from './story-scenes.js';
import {alphabet,wordLessons,supportingWords,stories,patternLessons,pictureSymbols} from './stage-data.js';
import {createStoryFlow} from './story-flow.js';
import {createSpellingFlow} from './spelling-flow.js';
import {familyWords} from './family-data.js';
import {profiles} from './curriculum.js';
import {playStageSequence,toggleStagePause,stopStageAudio,stageAudioState} from './stage-audio.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,data='',classes='')=>'<button class="btn '+classes+'" data-action="stages-'+action+'" '+data+'>'+label+'</button>';
export function stagePicture(word,small=false){
 return wordIllustration(word,{className:'stage-picture '+(familyWords[word]?'family-picture picture-'+word+' ':'')+(small?'mini':''),description:familyWords[word]?.description||word});
}
const sounds=word=>'<div class="stage-blend" aria-label="Blend '+esc(word)+'">'+[...word].map((c,i)=>'<button class="sound-chip" data-action="stages-audio" data-key="sound:'+c+'" data-part="'+i+'">'+c+'</button>').join('<span aria-hidden="true">–</span>')+'<span aria-hidden="true">→</span><b>'+word+'</b></div>';

export function createStageLessons({onAttempt=()=>{},onStoryFinish=()=>{},getProgress,getLegacy,save,isSaved,render,onLegacy,onFamily,onStatus,getSpeed}){
 let stage='letters',page='home',letterIndex=0,wordId=null,storyId=null,exampleIndex=0,phase='Ready',activeStoryLine=-1;
 const state=()=>getProgress();
 const letterMatching=createLetterMatching({getProgress,getPractice:()=>getLegacy().practice,onAttempt,save,render,play:audioParts,stop});
 const status=message=>onStatus(message);
 const alphabetReading=createAlphabetReading({getProgress,getSpeed,save,status});
 const storyFlow=createStoryFlow({onAttempt,onStoryFinish,getProgress,save,isSaved,render,status,play:audioParts,stop,picture:stagePicture});
 const scienceFlow=createScienceFlow({getProgress,save,isSaved,render,play:audioParts,stop,onAttempt});
 const mathFlow=createMathFlow({getProgress,save,isSaved,render,play:audioParts,stop,onAttempt});
 const moveFlow=createMoveFlow({getProgress,save,isSaved,render,play:audioParts,stop,onAttempt});
 const valueFlow=createValueStoryFlow({onAttempt,onStoryFinish,getProgress,save,isSaved,render,status,play:audioParts,stop});
 const newStories=valuesStories.filter(s=>!stories.some(old=>old.sentences.join(' ')===s.sentences.join(' '))).sort((a,b)=>valuesOrder.indexOf(a.id)-valuesOrder.indexOf(b.id));
 const sentenceWriting=createSentenceWriting({getProgress,save,isSaved,render,play:audioParts,stop});
 const spellingFlow=createSpellingFlow({getProgress:()=>state().spelling,save,isSaved,render,status,picture:stagePicture,getSpeed});
 const saveLabel=()=>'<span id="save-status">'+(isSaved()?'Saved automatically':'Progress not saved')+'</span>';
 function stop(){sentenceWriting.cancel();scienceFlow.cancel();mathFlow.cancel();alphabetReading.cancel();letterMatching.cancel();moveFlow.cancel();stopStageAudio();spellingFlow.clear();status('');activeStoryLine=-1;}
 function audioParts(parts,onEnd=()=>{}){
  playStageSequence(parts,{speed:getSpeed(),onPart:part=>{
   if(part.example!==undefined){exampleIndex=part.example;phase=part.phase;}
   if(part.line!==undefined)activeStoryLine=part.line;
   const label=document.querySelector('#letter-phase');if(label)label.textContent=part.phase||'Listening';
  },onActive:(part,active)=>{
   document.querySelectorAll('.letter-example').forEach((el,i)=>el.classList.toggle('playing',active&&i===part.example));
  },onState:()=>syncAudioControls(),onEnd:()=>{
   document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));phase='Ready to replay';
   const label=document.querySelector('#letter-phase');if(label)label.textContent=phase;
   status('Ready to listen again.');onEnd();syncAudioControls();
  },onError:message=>{document.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));status(message);syncAudioControls();}});
 }
 function syncAudioControls(){
  const s=stageAudioState();
  document.querySelectorAll('[data-action="stages-pause"]').forEach(pause=>{pause.disabled=!s.playing;pause.textContent=s.paused?'Resume':'Pause';pause.setAttribute('aria-pressed',String(s.paused));});
 }
 function playLetter(){
  const a=alphabet[letterIndex];
  state().letter=letterIndex;save();
  audioParts([
   {key:'alphabet-case:'+a.letter,caseLetter:a.letter,phase:'Big and small: '+a.letter.toUpperCase()+a.letter},
   ...a.examples.flatMap((word,i)=>[
    {key:'alphabet-example:'+a.letter+':'+word,letterName:a.letter,exampleWord:word,example:i,phase:'Listen: '+word},
    ...[1,2,3].map(repeat=>({key:'sound:'+a.sound,letterSound:a.letter,example:i,phase:'Letter sound · '+repeat+' of 3'})),
    {key:'word:'+word,example:i,phase:'Picture word: '+word,pauseAfter:600}
   ])
  ],()=>{if(!state().lettersDone.includes(a.letter)){state().lettersDone.push(a.letter);save();}});
 }
 function openLetter(index,autoplay=true){
  if(!Number.isInteger(index)||index<0||index>=alphabet.length)return;
  stop();stage='letters';page='letter';letterIndex=index;state().letter=index;exampleIndex=0;phase='Ready';save();render();if(autoplay)playLetter();
 }
 function legacyCards(which,indices){
  const p=getLegacy(),lessons=profiles[which].lessons;
  return '<div class="lessons">'+indices.map(i=>{const l=lessons[i],saved=p.inProgress[which][l.id];return '<button class="lesson-card" data-action="stages-legacy" data-profile="'+which+'" data-index="'+i+'"><span class="number">'+(p.completed[which].includes(l.id)?'★ ':'')+'PRACTICE '+(i+1)+'</span><span class="lesson-glyph">'+(which==='little'?l.items.join(' '):l.items[0])+'</span><small>'+esc(l.title)+(saved?' · Continue activity '+(saved.step+1):'')+'</small></button>';}).join('')+'</div>';
 }
 function letterView(){
  const a=alphabet[letterIndex];
  const gameEntry='<button class="letter-match-entry" data-action="stages-match-open"><span aria-hidden="true">A ↔ a</span><span><b>Big and small letters</b><small>'+(state().letterMatching?.started?'Continue matching pairs':'Draw a line or tap to match')+'</small></span><span aria-hidden="true">→</span></button>'+(letterMatching.dueCount()?'<div class="practice-entry">'+button('Review missed pairs · '+letterMatching.dueCount(),'match-review')+'</div>':'');
  return gameEntry+'<section class="stage-letter activity"><div class="eyebrow">Letters · Suggested age 4+</div><h1>Say hello to '+a.letter.toUpperCase()+a.letter+'.</h1><div class="activity-actions">'+button('← Letters','back')+'<button class="btn" data-action="playful-trace-open" data-letter="'+a.letter+'">Trace '+a.letter.toUpperCase()+' & '+a.letter+'</button></div><p class="muted">Hear the name, the sound, and two picture words.</p><div class="big-letter letter-display"><span data-case="upper">'+a.letter.toUpperCase()+'</span><span data-case="lower">'+a.letter+'</span></div><div class="letter-examples">'+a.examples.map((word,i)=>'<div class="letter-example" data-example="'+i+'">'+stagePicture(word)+'<b>'+word+'</b></div>').join('')+'</div><p class="letter-note">'+esc(a.note).replace('with u:', 'with <span data-letter="u">u</span>:')+'</p><div class="activity-actions">'+button('Start','letter-start','','primary')+button('Replay','letter-start')+button('Pause','pause','disabled aria-pressed="false"')+'</div><p id="letter-phase" class="letter-phase" role="status">'+esc(phase)+'</p><p id="audio-status" class="status"></p><div class="letter-paging">'+button('← Previous','letter-next','data-index="'+(letterIndex-1)+'" '+(letterIndex===0?'disabled':''))+ '<span>'+ (letterIndex+1)+' / 26</span>'+button('Next →','letter-next','data-index="'+(letterIndex+1)+'" '+(letterIndex===25?'disabled':''))+'</div><p class="small muted">Stay here and practise. Only Next changes to the next letter.</p></section>'+
   (state().letter!==letterIndex?'<div class="resume-strip"><span>Your saved letter is '+alphabet[state().letter].letter.toUpperCase()+alphabet[state().letter].letter+'.</span>'+button('Continue that letter →','letter-next','data-index="'+state().letter+'"')+'</div>':'')+
   '<details class="stage-practice"><summary>Choose a letter · '+state().lettersDone.length+' explored</summary><div class="letter-grid">'+alphabet.map((a,i)=>'<button data-action="stages-letter-next" data-index="'+i+'" aria-label="Open '+a.letter.toUpperCase()+a.letter+'">'+a.letter.toUpperCase()+a.letter+(state().lettersDone.includes(a.letter)?'<small>✓</small>':'')+'</button>').join('')+'</div></details><details class="stage-practice"><summary>More letter practice: matching, writing and talking</summary>'+legacyCards('little',profiles.little.lessons.map((_,i)=>i))+'</details>';
 }
 function helperCards(keys){
  return '<div class="helper-grid">'+keys.map(key=>{const h=supportingWords[key.toLowerCase()]||supportingWords[key];return '<div class="helper-card"><b>'+esc(key)+'</b>'+(h?'<p lang="bn">'+esc(h.meaning)+'</p><p>'+esc(h.help)+'</p>':'<p>Meet this word with a grown-up before reading.</p>')+button('Hear '+esc(key),'audio','data-key="word:'+esc(key)+'"')+'</div>';}).join('')+'</div>';
 }
 function stageMenu(cards){return '<div class="words-menu organised-menu">'+cards.map(([title,detail,action,art,theme],n)=>'<button class="words-menu-card theme-'+theme+'" data-action="stages-'+action+'"><em class="words-menu-number">'+(n+1)+'</em><span class="words-menu-art">'+art+'</span><span><b>'+title+'</b><small>'+detail+'</small></span><span aria-hidden="true">→</span></button>').join('')+'</div>';}
 const symbol=text=>'<span class="stage-menu-symbol" aria-hidden="true">'+text+'</span>';
 function lettersHome(){return '<section class="intro"><div><div class="eyebrow">Letters · Suggested age 4+</div><h1>Letters, one little step at a time.</h1><p>Choose reading, sounds, matching or writing. All activities are open.</p></div></section>'+stageMenu([
  ['Read A–Z','Read and hear the alphabet in order.','alphabet-open',symbol('A a'),'sky'],
  ['Learn a letter','Names, sounds and two picture words.','letter-open',stagePicture('apple',true),'leaf'],
  ['Match big & small','Draw a line or tap matching pairs.','match-open',symbol('A ↔ a'),'rose'],
  ['Trace big & small','Choose a letter. Write its big and small forms.','letter-traces',symbol('A a ✎'),'sun']
 ])+'<details class="stage-practice"><summary>Saved letter practice: matching, writing and talking</summary>'+legacyCards('little',profiles.little.lessons.map((_,i)=>i))+'</details>';}
 function letterTraces(){return '<div class="lesson-head">'+button('← Letters','back')+'</div><section class="intro"><div><div class="eyebrow">Letters · Suggested age 4+</div><h1>Trace big & small.</h1><p>Choose a pair. Start at the coloured dots, then follow the arrows.</p></div></section><div class="letter-grid tracing-letter-grid">'+alphabet.map(a=>'<button data-action="playful-trace-open" data-letter="'+a.letter+'" aria-label="Trace big '+a.letter.toUpperCase()+' and small '+a.letter+'">'+a.letter.toUpperCase()+' '+a.letter+(state().playful?.lessons['letter:'+a.letter]?.work?.[4]?.done?'<small>Practised ✓</small>':'')+'</button>').join('')+'</div>';}
 function wordsHome(){return '<section class="intro"><div><div class="eyebrow">Words · Suggested age 5+</div><h1>Words, one little step at a time.</h1><p>Choose spelling, word families, reading or writing.</p></div></section>'+stageMenu([
  ['Spell picture words','Letter names, then the whole word.','spelling-open',stagePicture('apple',true),'sky'],
  ['Word families','Explore pictures, blend sounds and build words.','families',stagePicture('cat',true),'rose'],
  ['Read little sentences','Helping words, phrases, sentences and the -at story.','sentences-open',stagePicture('mat',true),'leaf'],
  ['Write words · Tracing','Trace a familiar word, then try without the guide.','writing-open',symbol('cat ✎'),'sun']
 ]);}
 function wordWritingLibrary(){const p=getLegacy().pictureFamilies.writing;return '<div class="lesson-head">'+button('← Words','back')+'</div><section class="intro"><div><div class="eyebrow">Words · Suggested age 5+</div><h1>Write words · Tracing</h1><p>Choose a word you have learned. Your saved marks and writing practice stay here.</p></div></section>'+(p.current?'<div class="resume-strip"><span>Continue writing '+p.current+'.</span><button class="btn" data-action="family-write-resume">Continue writing →</button></div>':'')+'<div class="word-path">'+Object.keys(familyWords).map(word=>'<button class="word-path-card" data-action="family-write" data-word="'+word+'">'+stagePicture(word,true)+'<b>'+word+'</b><small>'+(p.drafts[word]?'Continue your marks':p.completed.includes(word)?'Practised ✓':'Trace, then copy')+'</small></button>').join('')+'</div>';}
 // Short-vowel groups for the blend lessons, each with its own colour.
 const vowelGroups=[['a','Short a','as in cat','rose'],['e','Short e','as in hen','leaf'],['i','Short i','as in pig','grape'],['o','Short o','as in hop','sky'],['u','Short u','as in sun','sun']];
 function wordLibrary(sentences=false){
  const card=l=>'<button class="word-path-card" data-action="stages-word-open" data-id="'+l.id+'">'+stagePicture(l.word,true)+'<b>'+esc(sentences?l.phrase:l.word)+'</b><small>'+(state().words[l.id]?.done?'Practised ✓':sentences?esc(l.sentence):'Hear & blend')+'</small></button>';
  const head='<div class="lesson-head">'+button('← Words','back')+'</div>';
  if(sentences)return head+'<section class="intro"><div><div class="eyebrow">Words · Suggested age 5+</div><h1>Read little sentences.</h1><p class="muted">Meet helping words, read a phrase, then a picture sentence.</p></div></section>'+
   '<section class="stage-existing"><h2>The -at family: sentences & a story</h2><p>Follow the existing cat, mat, hat and rat reading path.</p>'+button('Read sentences & a story →','family-reading','','primary')+'</section><h2>Little sentence lessons</h2><div class="word-path">'+wordLessons.map(card).join('')+'</div>'+
   '<details class="stage-practice"><summary>More word practice: build, listen, read and talk</summary>'+legacyCards('big',profiles.big.lessons.map((_,i)=>i).filter(i=>i<15))+'</details>';
  const done=wordLessons.filter(l=>state().words[l.id]?.done).length;
  return head+'<section class="intro build-intro"><div><div class="eyebrow">Words · Suggested age 5+</div><h1>Build & read words.</h1><p class="muted">Pick a colour. Hear the sounds, blend them, then build the word.</p></div><p class="build-progress"><b>'+done+' / '+wordLessons.length+'</b> words practised</p></section>'+
   '<ol class="build-steps"><li><b>1</b> Hear</li><li><b>2</b> Blend</li><li><b>3</b> Build</li><li><b>4</b> Read</li></ol>'+
   vowelGroups.map(([v,label,example,theme])=>{const list=wordLessons.filter(l=>(l.word.match(/[aeiou]/)||[])[0]===v);return list.length?'<section class="vowel-band theme-'+theme+'"><h2><span class="vowel-badge">'+v+'</span>'+label+' <small>'+example+'</small></h2><div class="vowel-words">'+list.map(card).join('')+'</div></section>':'';}).join('')+
   '<div class="build-family-link">'+button('🏠 Word Family Houses →','families')+'</div>'+
   '<details class="stage-practice"><summary>More word practice: build, listen, read and talk</summary>'+legacyCards('big',profiles.big.lessons.map((_,i)=>i).filter(i=>i<15))+'</details>';
 }
 function wordView(){
  const l=wordLessons.find(x=>x.id===wordId),p=state().words[wordId],correct=p.answer===l.word;
  let body='';
  if(p.step===0){body='<div class="eyebrow">1 · Hear & blend</div><h1>Meet '+l.word+'.</h1><button class="picture-tap" data-action="stages-blend" data-word="'+l.word+'" aria-label="Tap the picture: hear the sounds, then '+l.word+'">'+stagePicture(l.word)+'<small>Tap the picture</small></button>'+sounds(l.word)+'<p class="lead">'+esc(l.tip)+'</p>'+button('Hear the blend','blend','data-word="'+l.word+'"','primary')+'<div class="activity-actions">'+button('Learn the helping words →','word-next','','primary')+'</div>';}
  else if(p.step===1){body='<div class="eyebrow">2 · Helping words</div><h1>A few words to help you read.</h1><p class="muted">Meet these before reading the sentence. Listen and say them together.</p>'+helperCards(l.helpers)+'<div class="activity-actions">'+button('Read a short phrase →','word-next','','primary')+'</div>';}
  else if(p.step===2){body='<div class="eyebrow">3 · A short phrase</div><h1>Put words together.</h1>'+stagePicture(l.word)+'<p class="sentence">'+esc(l.phrase)+'</p>'+button('Hear the phrase','audio','data-key="text:'+esc(l.phrase)+'"')+'<div class="activity-actions">'+button('Try the sentence →','word-next','','primary')+'</div>';}
  else{body='<div class="eyebrow">4 · Complete & read</div><h1>Finish the picture sentence.</h1>'+stagePicture(l.word)+'<p class="sentence completed-sentence" role="status">'+esc(correct?l.sentence:l.blank)+'</p><div class="choices sentence-choices">'+l.choices.map(w=>'<button class="choice word-choice '+(p.answer&&w===l.word?'correct':p.answer===w?'retry':'')+'" data-action="stages-word-answer" data-word="'+w+'" '+(correct?'disabled':'')+'>'+w+'</button>').join('')+'</div><p class="feedback" role="status">'+(correct?'You did it! Now read the whole sentence aloud.':p.answer?'Thank you for trying. The answer is '+l.word+'. '+l.tip:'Choose one word.')+'</p>'+(correct?button('Hear the whole sentence','audio','data-key="text:'+esc(l.sentence)+'"')+'<div class="activity-actions">'+button('I read the sentence ✓','word-finish','','primary')+'</div>':'');}
  return '<div class="lesson-head">'+button('← Words','back')+'<span class="lesson-meta">'+(state().words[wordId]?.done?'Practised · ':'')+saveLabel()+'</span></div><section class="activity stage-word">'+body+button('Pause','pause','disabled aria-pressed="false"')+'<p id="audio-status" class="status"></p></section>';
 }
 function storiesLibrary(){
  const levels=['First connected sentences','Add sh and ch','Next: the ai vowel team','Then: the ea vowel team','New patterns · read with an adult','Longer sentences · read with an adult','More vocabulary & dialogue · read with an adult'];
  return '<section class="intro"><div><div class="eyebrow">Stories · Suggested age 6+</div><h1>Little stories to read.</h1><p class="muted">Start with familiar words. Add new patterns, then read longer paragraphs. Audio is always optional.</p></div></section>'+(state().valueCurrent?'<div class="resume-strip"><span>Pick up '+esc(valuesStories.find(s=>s.id===state().valueCurrent).title)+'.</span>'+button('Continue story →','value-story-open','data-id="'+state().valueCurrent+'"','primary')+'</div>':state().storyCurrent?'<div class="resume-strip"><span>Pick up '+esc(stories.find(s=>s.id===state().storyCurrent).title)+'.</span>'+button('Continue story →','story-open','data-id="'+state().storyCurrent+'"','primary')+'</div>':'')+
   levels.map((label,level)=>'<section class="story-band"><h2>'+label+'</h2>'+(level>0&&level<4?'<div class="pattern-links">'+patternLessons.filter(p=>level===1?['sh','ch'].includes(p.id):p.id===(level===2?'ai':'ea')).map(p=>button('Meet '+p.id+(state().patterns.includes(p.id)?' ✓':''),'pattern','data-id="'+p.id+'"')).join('')+'</div>':'')+'<div class="story-grid">'+[...stories.filter(s=>s.level===level),...newStories.filter(s=>s.level===level)].map(s=>'<button class="story-card" data-action="'+(s.kind==='values'?'stages-value-story-open':'stages-story-open')+'" data-id="'+s.id+'"><div class="story-thumb">'+(s.kind==='values'?valueScene(s,0):storyScene(s,0))+'</div><b>'+esc(s.title)+'</b><small>'+s.sentences.length+' connected sentences'+(s.kind==='values'?' · Assisted reading':'')+((s.kind==='values'?state().valueStories[s.id]?.done:state().stories[s.id]?.done)?' · Practised ✓':'')+'</small></button>').join('')+'</div></section>').join('')+'<details class="stage-practice"><summary>More pattern practice: sh, ch and ck</summary>'+legacyCards('big',[15,16,17])+'</details>';
 }
 function storiesHome(){return '<section class="intro"><div><div class="eyebrow">Stories · Suggested age 6+</div><h1>Read, understand and write.</h1><p>Choose a path. All your stories and saved practice are here.</p></div></section>'+stageMenu([
  ['Reading sounds & patterns','Meet sh, ch, ai and ea before reading.','patterns-open',symbol('sh · ai'),'sky'],
  ['Read stories','Every existing story, from easier to harder.','stories-open',stagePicture('cat',true),'leaf'],
  ['Story practice','Picture questions, story order and paragraph blanks.','story-practice',stagePicture('hen',true),'rose'],
  ['Write little sentences','Trace and copy three familiar story sentences.','sentence-writing-library',symbol('I see ✎'),'sun']
 ]);}
 function patternsLibrary(){return '<div class="lesson-head">'+button('← Stories','back')+'</div><section class="intro"><div><div class="eyebrow">Stories · Suggested age 6+</div><h1>Reading sounds & patterns</h1><p>Hear a pattern, blend a word, then find it in stories.</p></div></section><div class="word-path">'+patternLessons.map(p=>'<button class="word-path-card" data-action="stages-pattern" data-id="'+p.id+'">'+stagePicture(p.words[0],true)+'<b>'+esc(p.title)+'</b><small>'+(state().patterns.includes(p.id)?'Practised ✓':p.words.join(' · '))+'</small></button>').join('')+'</div><details class="stage-practice"><summary>Saved sh, ch and ck practice</summary>'+legacyCards('big',[15,16,17])+'</details>';}
 function storyPracticeLibrary(){return '<div class="lesson-head">'+button('← Stories','back')+'</div><section class="intro"><div><div class="eyebrow">Stories · Suggested age 6+</div><h1>Story practice</h1><p>Choose a story you know. Revisit its existing questions, picture order or blanks.</p></div></section><div class="story-grid">'+[...stories,...newStories].sort((a,b)=>a.level-b.level).map(s=>'<section class="story-card story-practice-card"><div class="story-thumb">'+(s.kind==='values'?valueScene(s,0):storyScene(s,0))+'</div><h2>'+esc(s.title)+'</h2><button class="btn" data-action="playful-practice-open" data-id="story:'+s.id+'">Questions & picture order</button>'+button('Paragraph blanks','story-practice-open','data-id="'+s.id+'"')+'</section>').join('')+'</div>';}
 function patternView(){
  const p=patternLessons.find(x=>x.id===storyId);
  return '<div class="lesson-head">'+button('← Stories','back')+'</div><section class="activity"><div class="eyebrow">Meet a new pattern</div><h1>'+esc(p.title)+'</h1><p class="lead">'+esc(p.note)+'</p><div class="pattern-word-grid">'+p.words.map((word,i)=>'<div>'+stagePicture(word,true)+'<b>'+word+'</b><p>'+p.parts[i].map((part,j)=>'<span data-pattern="'+i+'" data-part="'+j+'">'+part+'</span>').join(' – ')+'</p>'+button('Hear '+word,'pattern-blend','data-id="'+p.id+'" data-index="'+i+'"')+'</div>').join('')+'</div><div class="activity-actions">'+button('We tried this pattern ✓','pattern-finish','data-id="'+p.id+'"','primary')+'</div><p id="audio-status" class="status"></p></section>';
 }
 function storyView(){return storyFlow.html();}

 return {
  stage:()=>stage,
  bind(){if(page==='sentence-writing')sentenceWriting.bind();if(page==='science-lesson')scienceFlow.bind();if(page==='math-lesson')mathFlow.bind();if(page==='move-lesson')moveFlow.bind();if(page==='letter-match')letterMatching.bind();if(page==='alphabet')alphabetReading.bind();},
  snapshot(){return page==='sentence-writing'?{kind:'stage',page:'sentence-writing',id:sentenceWriting.current()}:page==='science-lesson'?{kind:'stage',page:'science-lesson',id:state().science.current}:page==='math-lesson'?{kind:'stage',page:'math-lesson',id:state().math.current}:page==='alphabet'?{kind:'stage',page:'alphabet'}:page==='letter-match'?{kind:'stage',page:'letter-match'}:page==='move-lesson'?{kind:'stage',page:'move-lesson',id:state().moveCurrent}:page==='spelling'?{kind:'stage',page:'spelling'}:page==='word'?{kind:'stage',page:'word',id:wordId}:page==='value-story'?{kind:'stage',page:'value-story',id:state().valueCurrent}:page==='story'?{kind:'stage',page:'story',id:state().storyCurrent}:page==='pattern'?{kind:'stage',page:'pattern',id:storyId}:page==='letter'?{kind:'stage',page:'letter',index:letterIndex}:null;},
  openResume(route){
   stop();
   if(route.page==='science-lesson'){stage='science';page='science-lesson';scienceFlow.open(route.id);return;}
   if(route.page==='math-lesson'){stage='math';page='math-lesson';mathFlow.open(route.id);return;}
   if(route.page==='sentence-writing'){stage='stories';page=route.page;sentenceWriting.open(route.id);return;}
   if(route.page==='letter'){openLetter(route.index,false);return;}
   if(route.page==='alphabet'){stage='letters';page='alphabet';alphabetReading.prepare();save();render();return;}
   if(route.page==='letter-match'){stage='letters';page='letter-match';letterMatching.open();return;}
   stage=route.page==='move-lesson'?'move':['story','pattern','value-story'].includes(route.page)?'stories':'words';page=route.page;
   if(page==='move-lesson'){moveFlow.open(route.id);return;}
   if(page==='spelling'){spellingFlow.open(false);return;}
   if(page==='story'){storyFlow.open(route.id,true);return;}
   if(page==='value-story'){valueFlow.open(route.id);return;}
   if(page==='word'){wordId=route.id;state().wordCurrent=wordId;state().words[wordId]??={step:0,answer:null,done:false};}
   if(page==='pattern')storyId=route.id;
   save();render();
  },
  narrateLegacyLetter(letter,word){
   const a=alphabet.find(a=>a.letter===letter);if(!a)return;
   audioParts([{key:'alphabet-case:'+letter,caseLetter:letter,caseTarget:'.big-letter'},
    {key:'alphabet-example:'+letter+':'+word,letterName:letter,exampleWord:word,legacyExample:true},
    ...[1,2,3].map(()=>({key:'sound:'+a.sound,target:'.big-letter [data-case="lower"]'})),
    {key:'word:'+word,target:'.flash-word,.activity h2'}]);
  },
  setStage(value){if(!isLearningSection(value))return;stop();stage=value;page='home';if(stage==='letters'){letterIndex=state().letter;phase='Ready';}},
  reset(){openLetter(0,false);},
  stop,
  parentScienceReport:()=>scienceFlow.parentReport(),
  parentMathReport:()=>mathFlow.parentReport(),
  html(){return page==='letter'?letterView():page==='letter-tracing'?letterTraces():page==='writing'?wordWritingLibrary():page==='stories'?storiesLibrary():page==='patterns'?patternsLibrary():page==='story-practice'?storyPracticeLibrary():page==='sentence-writing-library'?'<div class="lesson-head">'+button('← Stories','back')+'</div>'+sentenceWriting.home():page==='sentence-writing'?sentenceWriting.html():page==='science-lesson'?scienceFlow.html():stage==='science'?scienceFlow.home():page==='math-lesson'?mathFlow.html():stage==='math'?mathFlow.home():page==='alphabet'?alphabetReading.html():page==='letter-match'?letterMatching.html():page==='move-lesson'?moveFlow.html():stage==='move'?moveFlow.home():page==='spelling'?spellingFlow.html():page==='blending'?wordLibrary():page==='sentences'?wordLibrary(true):page==='word'?wordView():page==='story'?storyView():page==='value-story'?valueFlow.html():page==='pattern'?patternView():stage==='letters'?lettersHome():stage==='words'?wordsHome():storiesHome();},
  handle(data){
   const action=data.action.replace('stages-','');
   if(action==='alphabet-open'){stop();page='alphabet';alphabetReading.prepare();save();render();return;}
   if(action==='letter-open'){openLetter(state().letter,false);return;}
   if(action==='letter-traces'){stop();page='letter-tracing';render();return;}
   if(['stories-open','patterns-open','story-practice','writing-open','sentence-writing-library'].includes(action)){stop();page=({'stories-open':'stories','patterns-open':'patterns','writing-open':'writing'})[action]||action;render();return;}
   if(action.startsWith('sentence-writing-')){if(action==='sentence-writing-back'){stop();page='sentence-writing-library';render();}else{page='sentence-writing';sentenceWriting.handle(data);}return;}
   if(action==='story-practice-open'){stop();if(stories.some(s=>s.id===data.id)){page='story';state().valueCurrent=null;storyFlow.open(data.id,true,'blanks');}else if(newStories.some(s=>s.id===data.id)){page='value-story';valueFlow.open(data.id,'paragraph-gaps');}return;}
   if(action==='science-open'){stop();stage='science';page='science-lesson';scienceFlow.open(data.id);return;}
   if(action.startsWith('science-')){if(action==='science-back'){stop();stage='science';page='home';save();render();}else scienceFlow.handle(data);return;}
   if(action==='math-open'){stop();stage='math';page='math-lesson';mathFlow.open(data.id);return;}
   if(action.startsWith('math-')){if(action==='math-back'){stop();stage='math';page='home';save();render();}else mathFlow.handle(data);return;}
   if(action==='alphabet-next'){openLetter(state().letter,false);return;}
   if(action.startsWith('alphabet-')){alphabetReading.handle(data);return;}
   if(action==='match-open'||action==='match-review'){stop();stage='letters';page='letter-match';letterMatching.open();if(action==='match-review')letterMatching.handle({action:'stages-match-review'});}
   else if(action.startsWith('match-')){if(action==='match-back'){stop();page='home';render();}else letterMatching.handle(data);}
   else if(action==='move-open'){stop();stage='move';page='move-lesson';moveFlow.open(data.id);}
   else if(action.startsWith('move-')){if(action==='move-back'){stop();page='home';render();}else moveFlow.handle(data);}
   else if(action==='value-story-open'){if(!newStories.some(s=>s.id===data.id))return;stop();page='value-story';valueFlow.open(data.id);}
   else if(action.startsWith('value-story-')){if(action==='value-story-home'){stop();page='home';render();}else valueFlow.handle(data);}
   else if(action==='letter-start')playLetter();
   else if(action==='letter-next')openLetter(Number(data.index));
   else if(action==='pause')toggleStagePause();
   else if(action==='spelling-open'){stop();page='spelling';spellingFlow.open();}
   else if(action==='build-open'||action==='spelling-blend'){stop();page='blending';render();}
   else if(action==='sentences-open'){stop();page='sentences';render();}
   else if(action==='family-reading'){stop();onFamily(true);}
   else if(action.startsWith('spelling-'))spellingFlow.handle(data);
   else if(action==='audio')audioParts([{key:data.key,part:data.part===undefined?undefined:Number(data.part)}]);
   else if(action==='blend')audioParts([...data.word].map((c,i)=>({key:'sound:'+c,part:i})).concat({key:'word:'+data.word}));
   else if(action==='back'||action==='story-back'){stop();page='home';render();}
   else if(action==='families'){stop();onFamily();}
   else if(action==='legacy'){stop();onLegacy(data.profile,Number(data.index));}
   else if(action==='word-open'){
    if(!wordLessons.some(l=>l.id===data.id))return;stop();wordId=data.id;page='word';state().wordCurrent=wordId;
    state().words[wordId]??={step:0,answer:null,done:false};save();render();
   }else if(action==='word-next'){const p=state().words[wordId];if(p&&p.step<3){stop();p.step++;save();render();}}
   else if(action==='word-answer'){
    const l=wordLessons.find(l=>l.id===wordId),p=state().words[wordId];if(!l||p.step!==3||p.answer===l.word||!l.choices.includes(data.word))return;
    onAttempt('word:'+l.word,data.word===l.word,p.answer!==null);p.answer=data.word;save();render(false);if(data.word!==l.word)audioParts([...l.word].map(c=>({key:'sound:'+c})).concat({key:'word:'+l.word}));
   }else if(action==='word-finish'){
    const l=wordLessons.find(l=>l.id===wordId),p=state().words[wordId];if(!l||p.answer!==l.word)return;
    p.done=true;save();status(isSaved()?'Sentence practice saved. Read it again, or return to Words.':'Read the sentence again. Progress could not be saved yet.');
   }else if(action==='pattern'){if(!patternLessons.some(p=>p.id===data.id))return;stop();storyId=data.id;page='pattern';render();}
   else if(action==='pattern-blend'){
    const p=patternLessons.find(p=>p.id===data.id),i=Number(data.index);if(!p?.parts[i])return;
    audioParts(p.parts[i].map((part,j)=>({key:'sound:'+part,target:'.pattern-word-grid [data-pattern="'+i+'"][data-part="'+j+'"]'})).concat({key:'word:'+p.words[i]}));
   }else if(action==='pattern-finish'){if(!state().patterns.includes(data.id))state().patterns.push(data.id);save();stop();page='home';render();}
   else if(action==='story-open'){if(!stories.some(s=>s.id===data.id))return;page='story';state().valueCurrent=null;storyFlow.open(data.id);}
   else if(action.startsWith('story-'))storyFlow.handle(data);
  }
 };
}
