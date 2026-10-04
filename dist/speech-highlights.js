import {audioTimings} from './audio-timings.js';

// Inline spans keep the original text, whitespace and wrapping unchanged.
export function prepareSpokenText(root){
 root.querySelectorAll('.big-letter:not(.letter-display)').forEach(element=>{
  const letters=element.textContent;if(!/^[A-Za-z]{1,2}$/.test(letters))return;
  element.replaceChildren(...[...letters].map(letter=>{const span=document.createElement('span');span.dataset.case=letter===letter.toUpperCase()?'upper':'lower';span.textContent=letter;return span;}));
 });
 root.querySelectorAll('.sentence,.story-sentence,.story-line').forEach(element=>{
  if(element.querySelector('.paragraph-blank'))return;
  const text=element.textContent;element.dataset.spokenText=text;
  element.replaceChildren();let cursor=0;
  for(const match of text.matchAll(/\S+/gu)){
   element.append(document.createTextNode(text.slice(cursor,match.index)));
   const word=document.createElement('span');word.className='spoken-word';word.dataset.from=match.index;word.dataset.to=match.index+match[0].length;word.textContent=match[0];element.append(word);cursor=match.index+match[0].length;
  }
  element.append(document.createTextNode(text.slice(cursor)));
 });
}
export function clearSpeechHighlights(){
 document.querySelectorAll('[data-speech-active]').forEach(element=>{element.classList.remove('speech-highlight');element.removeAttribute('data-speech-active');element.removeAttribute('aria-current');});
}
function mark(elements){
 const selected=new Set(elements.filter(Boolean));
 document.querySelectorAll('[data-speech-active]').forEach(element=>{if(!selected.has(element)){element.classList.remove('speech-highlight');element.removeAttribute('data-speech-active');element.removeAttribute('aria-current');}});
 selected.forEach(element=>{element.classList.add('speech-highlight');element.dataset.speechActive='true';if(element.classList.contains('spoken-word'))element.setAttribute('aria-current','true');});
}
function select(part,metadata,index){
 if(part.spellingIntro){
  if(!metadata||index<0)return [];
  const token=metadata.text.slice(metadata.words[index].from,metadata.words[index].to).replace(/[.,!?]/g,'').toLowerCase(),example=document.querySelector('.spelling-example[data-example="'+part.example+'"]');
  if(token===part.introLetter)return [document.querySelector('.spelling-letter-heading [data-case="upper"]'),...(part.introLetter==='x'?[example?.querySelector('[data-letter-index="'+part.introWord.lastIndexOf('x')+'"]')]:[])];
  if(part.introLetter==='q'&&token==='u')return [example?.querySelector('[data-letter-index="'+part.introWord.indexOf('u')+'"]')];
  return token===part.introWord?[example?.querySelector('.spelling-word')]:[];
 }
 if(part.legacyLetter&&metadata&&index>=0){const token=metadata.text.slice(metadata.words[index].from,metadata.words[index].to).toLowerCase();if(token===part.legacyLetter)return [document.querySelector('.big-letter [data-case="upper"]')];return [...document.querySelectorAll('.flash-word')].filter(element=>element.textContent.toLowerCase()===token);}
 if(part.caseLetter){return index<0?[]:[document.querySelector((part.caseTarget||'.letter-display')+' [data-case="'+(index<2?'upper':'lower')+'"]')];}
 if(part.letterName){
  const token=index>=0?metadata.text.slice(metadata.words[index].from,metadata.words[index].to).toLowerCase():'';
  if(token===part.letterName)return [document.querySelector((part.legacyExample?'.big-letter':'.letter-display')+' [data-case="upper"]')];
  if(part.letterName==='q'&&token==='u')return [document.querySelector('.letter-note [data-letter="u"]')];
  return token===part.exampleWord?[document.querySelector(part.legacyExample?'.flash-word,.activity h2':'.letter-example[data-example="'+part.example+'"] b')]:[];
 }
 if(part.letterSound)return [document.querySelector('.letter-display [data-case="lower"]'),...(part.letterSound==='q'?[document.querySelector('.letter-note [data-letter="u"]')]:[])];
 if(part.target)return [...document.querySelectorAll(part.target)];
 const key=part.key||'',text=key.startsWith('text:')?key.slice(5):part.text;
 if(text){
  const sentences=[...document.querySelectorAll('[data-spoken-text]')].filter(element=>(element.dataset.spokenText===text||part.allowPrefix&&element.dataset.spokenText.startsWith(text))&&(part.line===undefined||Number(element.dataset.line)===part.line));
  if(!metadata||index<0)return metadata?[]:sentences;
  const original=metadata.words[index],offset=part.textOffset||0,cue={from:original.from+offset,to:original.to+offset};return sentences.flatMap(element=>[...element.querySelectorAll('.spoken-word')].filter(word=>Number(word.dataset.from)<cue.to&&Number(word.dataset.to)>cue.from));
 }
 if(key.startsWith('story-meaning:'))return [document.querySelector('.story-helper-meaning')];
 if(key.startsWith('word:')){
  const word=key.slice(5).toLowerCase();
  // Deliberately exclude quiz choices and hidden build answers.
  return [...document.querySelectorAll('.stage-blend > b,.letter-example b,.story-helper-word,.helper-card > b,.pattern-word-grid b')].filter(element=>element.textContent.toLowerCase()===word);
 }
 if(key.startsWith('sound:'))return [...document.querySelectorAll('.sound-chip')].filter(element=>part.part!==undefined?Number(element.dataset.part)===part.part:element.textContent===key.slice(6));
 return [];
}

// All timed cues come from the same stream as this MP3. currentTime already
// accounts for playbackRate, seeking, buffering and pause; no timing guesses.
export function watchAudioHighlights(audio,clip,part={},onActive=()=>{}){
 const metadata=audioTimings[clip];let frame=null,disposed=false,active=false,last=null;
 const update=()=>{
  if(disposed||!active)return;
  const time=audio.currentTime,index=metadata?metadata.words.findIndex(word=>time>=word.start&&time<word.end):-1;
  if(last!==index||last===null){mark(select(part,metadata,index));last=index;}
 };
 const tick=()=>{update();if(!disposed&&!audio.paused&&!audio.ended)frame=requestAnimationFrame(tick);};
 const playing=()=>{if(disposed)return;if(!active){active=true;onActive(true);}cancelAnimationFrame(frame);update();frame=requestAnimationFrame(tick);};
 const pause=()=>{cancelAnimationFrame(frame);frame=null;};
 const finish=()=>{pause();if(active){active=false;onActive(false);}clearSpeechHighlights();last=null;};
 audio.addEventListener('playing',playing);audio.addEventListener('pause',pause);audio.addEventListener('timeupdate',update);audio.addEventListener('seeked',update);audio.addEventListener('ended',finish);audio.addEventListener('error',finish);
 return ()=>{disposed=true;finish();for(const [event,handler]of [['playing',playing],['pause',pause],['timeupdate',update],['seeked',update],['ended',finish],['error',finish]])audio.removeEventListener(event,handler);};
}

export function watchSystemHighlights(utterance,text){
 const part={text,allowPrefix:true,legacyLetter:text.match(/(?:The letter|Find the little letter) ([A-Z])/u)?.[1].toLowerCase()};let active=false;
 return {
  start(){active=true;mark(select(part,null,-1));},
  boundary(event){if(!active||event.name!=='word'||!Number.isInteger(event.charIndex))return;const end=event.charLength>0?event.charIndex+event.charLength:(text.slice(event.charIndex).match(/^\S+/u)?.[0].length||1)+event.charIndex;mark(select(part,{text,words:[{from:event.charIndex,to:end}]},0));},
  stop(){active=false;clearSpeechHighlights();}
 };
}
