// Three short sentences already taught in existing stories; no new reading text.
export const sentenceWritingRefs=[
 {id:'hen-sun-0',story:'hen-sun',line:0},
 {id:'pig-pen-0',story:'pig-pen',line:0},
 {id:'cat-rat-1',story:'cat-rat',line:1}
];
export function sentenceWritingEntries(stories){return sentenceWritingRefs.map(r=>{const text=stories.find(s=>s.id===r.story).sentences[r.line];return {...r,text,words:text.match(/[A-Za-z]+/g)};});}
export function normalizeSentenceWriting(raw,stories){
 const entries=sentenceWritingEntries(stories),out={current:null,lessons:{}};
 for(const e of entries){const p=raw?.lessons?.[e.id];if(!p||typeof p!=='object')continue;const words={};
  for(let i=0;i<e.words.length;i++){const w=p.words?.[i];if(!w||typeof w!=='object')continue;let count=0;
   const drawing=(Array.isArray(w.drawing)?w.drawing:[]).slice(0,300).map(s=>(Array.isArray(s)?s:[]).filter(pt=>Array.isArray(pt)&&pt.length===2&&pt.every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&count++<20000)).filter(s=>s.length);
   words[i]={drawing,showGuide:w.showGuide!==false,done:w.done===true};
  }
  out.lessons[e.id]={word:Number.isInteger(p.word)&&p.word>=0&&p.word<e.words.length?p.word:0,words,done:p.done===true};
 }
 if(out.lessons[raw?.current])out.current=raw.current;
 return out;
}
