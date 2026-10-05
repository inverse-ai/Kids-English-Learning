// Colour pop and stickers for lesson cards, and the sticker book on Home.
// Cards keep their own markup; after each render decorateLessons() gives every
// lesson card its own colour, a tilted sticker of its picture, a gold star when
// the lesson is done and a "New" tag when it has not been opened yet.
import {stories,alphabet,wordLessons} from './stage-data.js';
import {valuesStories} from './values-stories.js';
import {mathLessons} from './math-data.js';
import {scienceLessons} from './science-data.js';
import {allMoveLessons} from './move-data.js';
import {wordIllustration} from './word-art.js';

const colours=['rose','leaf','sky','sun','grape','peach','mint'];
const CARDS='.story-card,.word-path-card,.math-lesson-card,.letter-grid>button,.family-card,.move-library>.words-menu-card';
const safePicture=word=>{try{return wordIllustration(word,{className:'sticker-picture'});}catch{return '';}};

// What the lesson behind a card is, and how far the child has got with it.
function lessonOf(card,learning){
 const id=card.dataset.id,a=card.dataset.action||'';
 if(a==='stages-story-open'){const s=stories.find(s=>s.id===id),p=learning.stories?.[id];return {word:s?.pictures?.[0],done:!!p?.done,started:!!p};}
 if(a==='stages-value-story-open'){const s=valuesStories.find(s=>s.id===id),p=learning.valueStories?.[id];return {word:s?.vocabulary?.find(v=>v.kind==='object')?.object,done:!!p?.done,started:!!p};}
 if(a==='stages-word-open'){const l=wordLessons.find(l=>l.id===id),p=learning.words?.[id];return {word:l?.word,done:!!p?.done,started:!!p};}
 if(a==='stages-math-open'){const p=learning.math?.lessons?.[id];return {done:!!p?.done||card.classList.contains('is-done'),started:!!p,clone:true};}
 if(a==='stages-science-open'){const p=learning.science?.lessons?.[id];return {done:!!p?.done||card.classList.contains('is-done'),started:!!p,clone:true};}
 if(a==='stages-letter-next'){const l=alphabet[Number(card.dataset.index)];return {done:!!l&&learning.lettersDone?.includes(l.letter),started:true,letter:true};}
 if(a==='stages-move-open'){const p=learning.move?.[id];return {done:!!p?.done,started:!!p,clone:true};}
 return {done:/✓|★/.test(card.textContent),started:true,clone:true};
}

export function decorateLessons(root,learning){
 const groups=new Map();
 root.querySelectorAll(CARDS).forEach(card=>{if(card.dataset.pop)return;const list=groups.get(card.parentElement)||[];list.push(card);groups.set(card.parentElement,list);});
 for(const list of groups.values())list.forEach((card,i)=>{
  const info=lessonOf(card,learning||{});card.dataset.pop='1';card.classList.add('pop-card','pop-'+colours[i%colours.length]);
  let art='';
  if(info.done)art='<span class="sticker-star">★</span>';
  else if(info.word)art=safePicture(info.word);
  if(!art&&!info.done&&!info.letter){const pic=card.querySelector('svg,img');if(pic){const copy=pic.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));copy.setAttribute('aria-hidden','true');if(copy.tagName.toLowerCase()==='svg')copy.setAttribute('preserveAspectRatio','xMidYMid slice');copy.classList.add('sticker-picture');art=copy.outerHTML;}}
  if(art&&!(info.letter&&!info.done))card.insertAdjacentHTML('afterbegin','<span class="lesson-sticker'+(info.done?' is-gold':'')+(info.letter?' is-mini':'')+'" aria-hidden="true">'+art+'</span>');
  if(info.done&&!info.letter){card.classList.add('pop-done');card.insertAdjacentHTML('beforeend','<span class="pop-tag">Done</span>');}
  else if(!info.started){card.insertAdjacentHTML('beforeend','<span class="pop-tag pop-new">New</span>');}
 });
}

// Every finished lesson adds its sticker to the book.
export function stickerBook(learning){
 const l=learning||{},got=[];
 for(const s of stories)if(l.stories?.[s.id]?.done)got.push({word:s.pictures?.[0],label:s.title});
 for(const s of valuesStories)if(l.valueStories?.[s.id]?.done)got.push({word:s.vocabulary?.find(v=>v.kind==='object')?.object,label:s.title});
 for(const w of wordLessons)if(l.words?.[w.id]?.done)got.push({word:w.word,label:w.word});
 for(const a of alphabet)if(l.lettersDone?.includes(a.letter))got.push({word:a.examples[0],label:a.letter.toUpperCase()+a.letter});
 for(const m of mathLessons)if(l.math?.lessons?.[m.id]?.done)got.push({star:true,label:m.title});
 for(const s of scienceLessons)if(l.science?.lessons?.[s.id]?.done)got.push({star:true,label:s.title});
 for(const m of allMoveLessons)if(l.move?.[m.id]?.done)got.push({star:true,label:m.title});
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 const empty=5-got.length%5;
 return '<section class="sticker-book"><h2><span aria-hidden="true">🏆</span> My sticker book</h2><div class="sticker-row">'+
  got.map((g,i)=>{const pic=g.star?'':safePicture(g.word);return '<span class="book-sticker tilt-'+(i%4)+'" title="'+esc(g.label)+'">'+(pic||'<b class="sticker-star">★</b>')+'</span>';}).join('')+
  Array.from({length:empty},()=>'<span class="book-sticker is-empty" aria-hidden="true"></span>').join('')+
  '</div><p>'+(got.length?got.length+' sticker'+(got.length>1?'s':'')+' collected · finish a lesson to add one':'Finish a lesson to get your first sticker!')+'</p></section>';
}
