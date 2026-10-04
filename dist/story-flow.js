import {stories} from './stage-data.js';
import {storyIntroductions} from './story-words.js';
import {storyScene} from './story-scenes.js';
import {storyGap} from './story-gaps.js';
import {emptyAttempt} from './story-gaps.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pause=()=>'<button class="btn story-pause" data-action="stages-pause" disabled aria-pressed="false">Pause</button>';
const button=(label,action,extra='',kind='')=>'<button class="btn '+kind+'" data-action="stages-story-'+action+'" '+extra+'>'+label+'</button>';

export function createStoryFlow({getProgress,save,isSaved,render,status,play,stop,picture}){
 let selected=null;
 const learning=()=>getProgress(),story=()=>stories.find(s=>s.id===selected),progress=()=>learning().stories[selected];
 const intro=()=>storyIntroductions(story(),progress().line,learning())[0];
 function listen(parts){status('Listening…');play(parts);}
 function speakIntro(){const word=intro();if(word)listen([{key:'word:'+word.word},{key:'story-meaning:'+word.word.toLowerCase()}]);}
 function prepareSentence(){
  const p=progress();p.phase=!p.skipIntro&&intro()?'helper':'sentence';p.mode='read';save();render();if(p.phase==='helper')speakIntro();
 }
 function paragraph(blanks=false){
  const s=story(),p=progress();
  const lines=s.sentences.map((sentence,line)=>{
   let text=esc(sentence);
   if(blanks)s.blanks.forEach((blank,i)=>{if(blank.line===line){const filled=p.answers[i]===blank.word;text=text.replace(new RegExp('\\b'+blank.word+'\\b'),'<span class="paragraph-blank '+(filled?'filled':i===p.blank?'current':'')+'">'+(filled?blank.word:'_____')+'</span>');}});
   return '<span class="story-line" data-line="'+line+'">'+text+'</span>';
  });
  return '<div class="story-paragraph" aria-label="Story paragraph" tabindex="0">'+lines.join(' ')+'</div>';
 }
 function html(){
  const s=story(),p=progress();let content='',heading='',hint='';
  if(p.phase==='helper'){
   const entry=intro();
   heading='One word before sentence '+(p.line+1);
   content='<div class="story-helper"><div class="story-helper-main"><p class="story-helper-word '+(entry.word.length>6?'long':'')+'" lang="en">'+esc(entry.word)+'</p>'+(s.newWords.some(w=>w.toLowerCase()===entry.word.toLowerCase())?picture(entry.word,true):'')+'</div><p class="story-helper-meaning" lang="bn">'+esc(entry.meaning)+'</p></div><div class="story-controls">'+button('Replay','helper-replay')+pause()+button('Next →','helper-next','','primary')+'</div>';
  }else if(p.phase==='sentence'){
   heading='Sentence '+(p.line+1)+' of '+s.sentences.length;
   content=storyScene(s,p.line)+'<p class="story-sentence" lang="en">'+esc(s.sentences[p.line])+'</p><div class="story-listen">'+button('Hear sentence','sentence-audio','aria-label="Hear this sentence (optional)"')+pause()+'</div><div class="story-controls">'+button('← Previous','previous',p.line===0?'disabled':'')+button('Next →','next','','primary')+'</div>';
  }else if(p.phase==='paragraph'){
   heading='Your whole story';hint='Read the sentences together.';
   content=paragraph()+'<div class="story-listen">'+button('Hear paragraph','audio','aria-label="Hear the story (optional)"')+pause()+'</div><div class="story-controls">'+button('← Previous','previous')+(p.done?button('Try blanks →','mode','data-mode="blanks"','primary'):button('I read this story','finish','','primary'))+'</div><p class="story-feedback" role="status">'+(p.done?'Story practice complete. Try the blanks if you like.':'Tap when you have finished this practice.')+'</p>';
  }else{
   const b=storyGap(s,p.blank),a=p.gapAttempts[p.blank],correct=p.answers[p.blank]===b.word,complete=s.blanks.every((b,i)=>p.answers[i]===b.word);
   heading=complete?'Your complete story':'Blank '+(p.blank+1)+' of '+s.blanks.length;
   const choices=a.easier?b.choices.filter(w=>w===b.word||w===b.choices.find(w=>w!==b.word)):b.choices;
   content=(complete?'':storyScene(s,b.line)+'<p class="blank-prompt">'+(b.task==='recall'?'Which word was in the story?':'Look, then fill the gap.')+'</p>')+(a.helpOpen&&!correct?'':paragraph(true))+(!correct&&!a.helpOpen?'<div class="story-answer-choices">'+choices.map(w=>'<button class="choice word-choice '+(p.answers[p.blank]===w?'retry':'')+'" data-action="stages-story-answer" data-blank="'+p.blank+'" data-word="'+w+'">'+esc(w)+'</button>').join('')+'</div>':'')+(a.helpOpen&&!correct?'<div class="story-demonstration"><p class="story-sentence">'+esc(s.sentences[b.line])+'</p><div class="story-controls">'+button('Replay demonstration','demonstrate')+pause()+button('Try with help →','retry','','primary')+'</div></div>':'')+'<p class="story-feedback story-gap-hint" role="status">'+(complete?'✓ Your paragraph is complete! Read the whole story aloud.':correct?'✓ You did it! Read the completed sentence.':a.wrong?esc(b.hint):b.task==='recall'?'Remember the sentence you read.':'Look, then choose.')+'</p>'+(!correct&&a.wrong&&!a.helpOpen?'<div class="story-listen">'+button('Hear hint','hint')+pause()+'</div>':'')+'<div class="story-controls">'+button('← Paragraph','previous')+(complete?button('Done ✓','finish','','primary'):correct?button('Next blank →','blank-next','','primary'):'')+'</div>';
  }
  return '<section class="activity story-player" data-phase="'+p.phase+'" data-gap-state="'+(p.phase==='blanks'&&p.answers[p.blank]!==s.blanks[p.blank].word?(p.gapAttempts[p.blank].helpOpen?'demonstration':p.gapAttempts[p.blank].wrong?'hint':'ready'):'ready')+'"><div class="story-player-heading"><p class="eyebrow">'+heading+'</p><h1>'+esc(s.title)+'</h1></div>'+(hint?'<p class="story-hint">'+hint+'</p>':'')+content+'<p class="story-save" id="save-status">'+(isSaved()?'Saved automatically':'Progress not saved')+'</p><p id="audio-status" class="status" role="status"></p>'+(p.phase==='helper'?button('Skip to story','skip','','quiet story-skip'):'')+'</section>';
 }
 return {
  html,
  open(id){
   if(!stories.some(s=>s.id===id))return;stop();selected=id;learning().storyCurrent=id;
   learning().stories[id]??={mode:'read',phase:'sentence',line:0,skipIntro:false,blank:0,answers:story().blanks.map(()=>null),done:false};
   progress().gapAttempts??=story().blanks.map(()=>emptyAttempt());progress().assisted??=false;
   if(['sentence','helper'].includes(progress().phase))prepareSentence();else{save();render();}
  },
  handle(data){
   const s=story(),p=progress();if(!s||!p)return;
   const action=data.action.replace('stages-story-','');
   if(action==='helper-replay'&&p.phase==='helper')speakIntro();
   else if(action==='helper-next'&&p.phase==='helper'){
    const entry=intro();stop();if(entry&&!learning().storyWordsMet.includes(entry.word.toLowerCase()))learning().storyWordsMet.push(entry.word.toLowerCase());prepareSentence();
   }else if(action==='skip'&&p.phase==='helper'){stop();p.skipIntro=true;p.phase='sentence';save();render();}
   else if(action==='next'&&p.phase==='sentence'){
    stop();if(p.line+1<s.sentences.length){p.line++;prepareSentence();}else{p.phase='paragraph';save();render();}
   }else if(action==='previous'){
    stop();if(p.phase==='sentence'&&p.line>0){p.line--;save();render();}
    else if(p.phase==='paragraph'){p.phase='sentence';p.line=s.sentences.length-1;save();render();}
    else if(p.phase==='blanks'){p.phase='paragraph';p.mode='read';save();render();}
   }else if(action==='sentence-audio'&&p.phase==='sentence')listen([{key:'text:'+s.sentences[p.line]}]);
   else if(action==='audio'&&p.phase==='paragraph')listen(s.sentences.map((sentence,line)=>({key:'text:'+sentence,line})));
   else if(action==='mode'&&data.mode==='blanks'&&p.phase==='paragraph'){
    stop();p.phase='blanks';p.mode='blanks';p.blank=Math.max(0,s.blanks.findIndex((b,i)=>p.answers[i]!==b.word));save();render();
   }else if(action==='answer'&&p.phase==='blanks'){
    const index=Number(data.blank),b=s.blanks[index];if(index!==p.blank||!b?.choices.includes(data.word)||p.answers[index]===b.word)return;
    const a=p.gapAttempts[index];if(a.helpOpen)return;stop();a.attempts++;if(a.firstChoice===null){a.firstChoice=data.word;a.firstCorrect=data.word===b.word;}
    p.answers[index]=data.word;
    if(data.word!==b.word){a.wrong++;a.assisted=true;p.assisted=true;if(a.wrong>=2){a.demonstrated=true;a.helpOpen=true;}}
    save();render(false);const current=document.querySelector('.paragraph-blank.current'),para=current?.closest('.story-paragraph');if(para&&para.scrollHeight>para.clientHeight)para.scrollTop+=current.getBoundingClientRect().top-para.getBoundingClientRect().top-para.clientHeight/2;if(data.word===b.word)document.querySelector('.story-controls .primary')?.focus({preventScroll:true});else{const gap=storyGap(s,index);listen([...(a.helpOpen?[{key:'text:'+s.sentences[b.line]}]:[]),{key:'story-hint:'+gap.hint,target:'.story-gap-hint'}]);}
   }else if(action==='hint'&&p.phase==='blanks'){const b=storyGap(s,p.blank);listen([{key:'story-hint:'+b.hint,target:'.story-gap-hint'}]);
   }else if(action==='demonstrate'&&p.phase==='blanks'){const b=storyGap(s,p.blank);listen([{key:'text:'+s.sentences[b.line]},{key:'story-hint:'+b.hint,target:'.story-gap-hint'}]);
   }else if(action==='retry'&&p.phase==='blanks'&&p.gapAttempts[p.blank].helpOpen){stop();const a=p.gapAttempts[p.blank];a.helpOpen=false;a.easier=true;a.assisted=true;p.assisted=true;p.answers[p.blank]=null;save();render();
   }else if(action==='blank-next'&&p.phase==='blanks'&&p.answers[p.blank]===s.blanks[p.blank].word){
    const next=s.blanks.findIndex((b,i)=>p.answers[i]!==b.word);if(next<0)return;stop();p.blank=next;save();render();
   }else if(action==='finish'&&(p.phase==='paragraph'||p.phase==='blanks'&&s.blanks.every((b,i)=>p.answers[i]===b.word))){
    stop();p.done=true;save();render(false);status(isSaved()?'Story practice saved.':'Progress could not be saved yet.');document.querySelector('[data-action="stages-story-mode"]')?.focus({preventScroll:true});
   }
  }
 };
}
