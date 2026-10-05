import {familyWords} from './family-data.js';
import {valuesStories} from './values-stories.js';
import {mathLessons} from './math-data.js';
import {scienceLessons} from './science-data.js';
const count=n=>Number.isInteger(n)&&n>=0?Math.min(10000,n):0;
const safe=s=>typeof s==='string'&&s.length<=150&&!['__proto__','constructor','prototype'].includes(s);
export function normalizePlayful(raw,existingStories=[]){
 const validLesson=id=>typeof id==='string'&&(/^letter:[a-z]$/.test(id)||id.startsWith('word:')&&(familyWords[id.slice(5)]||id==='word:sit')||id.startsWith('story:')&&[...existingStories,...valuesStories].some(s=>s.id===id.slice(6))||id.startsWith('math:')&&mathLessons.some(l=>l.id===id.slice(5))||id.startsWith('science:')&&scienceLessons.some(l=>l.id===id.slice(8)));
 const out={current:validLesson(raw?.current)?raw.current:null,wordsMet:[...new Set((Array.isArray(raw?.wordsMet)?raw.wordsMet:[]).filter(s=>safe(s)))].slice(-500),lessons:{}};
 for(const [id,p] of Object.entries(raw?.lessons||{})){
  if(!validLesson(id)||!p||typeof p!=='object')continue;const valid=i=>/^\d+$/.test(String(i))&&Number(i)<200;
  const work={},attempts={};for(const [i,w] of Object.entries(p.work||{})){if(!valid(i)||!w||typeof w!=='object')continue;
   work[i]={seen:[...new Set((Array.isArray(w.seen)?w.seen:[]).filter(s=>safe(s)))].slice(0,100),order:(Array.isArray(w.order)?w.order:[]).filter(s=>safe(s)).slice(0,100),placed:(Array.isArray(w.placed)?w.placed:[]).slice(0,20).map(n=>Number.isInteger(n)&&n>=-1&&n<10?n:-1),value:safe(w.value)?w.value:null,selected:safe(w.selected)?w.selected:null,trace:(Array.isArray(w.trace)?w.trace:[]).slice(0,50).map(s=>(Array.isArray(s)?s:[]).slice(0,1000).filter(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1))),done:w.done===true};
   if(w.traceDrafts&&typeof w.traceDrafts==='object'){work[i].traceDrafts={};for(const c of ['upper','lower'])if(Array.isArray(w.traceDrafts[c]))work[i].traceDrafts[c]=w.traceDrafts[c].slice(0,50).map(s=>(Array.isArray(s)?s:[]).slice(0,1000).filter(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1)));}
  }
  for(const [i,a] of Object.entries(p.attempts||{}))if(valid(i)&&a)attempts[i]={tries:count(a.tries),misses:count(a.misses),assisted:a.assisted===true,firstCorrect:typeof a.firstCorrect==='boolean'?a.firstCorrect:null};
  out.lessons[id]={step:valid(p.step)?Number(p.step):0,completed:[...new Set((Array.isArray(p.completed)?p.completed:[]).filter(valid).map(Number))],work,attempts,done:p.done===true};
 }
 return out;
}
