import {normalizeProgress} from './curriculum.js';
import {validResume,priorResume} from './home-page.js';
import {normalizePractice} from './practice-data.js';
const clone=x=>structuredClone(x);
const clean=raw=>{const p=normalizeProgress(raw);return {learning:p.learning,pictureFamilies:p.pictureFamilies,lastActivity:validResume(raw?.lastActivity),practice:normalizePractice(raw?.practice)};};
export function hydrateProfiles(raw){
 const p=normalizeProgress(raw);p.profileVersion=2;p.profileData={};
 for(const key of ['little','big'])p.profileData[key]=clean(raw?.profileVersion===2?raw.profileData?.[key]:key===p.profile?raw:null);
 p.migrationNotice=raw?.migrationNotice|| (raw&&raw.profileVersion!==2?'Earlier shared stage progress was kept with '+p.profile+'. The other profile starts its own stage history. Existing separate letter/word paths were preserved.':'');
 Object.assign(p,p.profileData[p.profile]);p.lastActivity??=priorResume(p);return p;
}
export function syncProfile(p,key){p.profile=key;p.profileData[key]=clone({learning:p.learning,pictureFamilies:p.pictureFamilies,lastActivity:p.lastActivity,practice:p.practice});}
export function selectProfile(p,key){if(!['little','big'].includes(key))return;Object.assign(p,clone(p.profileData[key]));p.profile=key;p.lastActivity??=priorResume(p);}
export function exportProfile(p,key,now=new Date()){
 syncProfile(p,p.profile);const data=clean(p.profileData[key]);
 return {format:'little-english-profile',version:1,exportedAt:now.toISOString(),profile:key,data:{...data,completed:p.completed[key],inProgress:p.inProgress[key],currentLesson:p.currentLesson[key],last:p.last[key]}};
}
function safeTree(x,depth=0){if(depth>40)throw Error('The file is too deeply nested.');if(x&&typeof x==='object'){for(const k of Object.keys(x)){if(['__proto__','constructor','prototype'].includes(k))throw Error('Unsafe file fields.');safeTree(x[k],depth+1);}}else if(typeof x==='number'&&!Number.isFinite(x))throw Error('Invalid number.');}
const canonical=x=>JSON.stringify(x&&typeof x==='object'?Array.isArray(x)?x.map(v=>JSON.parse(canonical(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(canonical(x[k]))])):x??null);
export function validateExport(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>64*1024*1024)throw Error('Choose a progress JSON file smaller than 64 MB.');
 const f=JSON.parse(text);safeTree(f);
 if(f.format!=='little-english-profile'||f.version!==1||!['little','big'].includes(f.profile)||!Number.isFinite(Date.parse(f.exportedAt)))throw Error('This is not a supported version 1 profile export.');
 if(!f.data||typeof f.data!=='object'||Array.isArray(f.data))throw Error('Missing profile data.');
 if(f.data.last!==null&&!Number.isFinite(Date.parse(f.data.last)))throw Error('Invalid practice date.');
 const d=f.data,n=normalizeProgress({profile:f.profile,completed:{[f.profile]:d.completed},inProgress:{[f.profile]:d.inProgress},currentLesson:{[f.profile]:d.currentLesson},last:{[f.profile]:d.last},learning:d.learning,pictureFamilies:d.pictureFamilies});
 const normalized={...clean(d),completed:n.completed[f.profile],inProgress:n.inProgress[f.profile],currentLesson:n.currentLesson[f.profile],last:n.last[f.profile]};
 if(canonical(d)!==canonical(normalized))throw Error('The file contains invalid lesson IDs, answers, dates, or progress fields. No progress was changed.');
 return {...f,data:normalized};
}
// Additive restore: existing conflicting steps, answers and drawings win. Nothing is replaced.
function merge(existing,incoming){if(existing==null)return clone(incoming);if(Array.isArray(existing)&&Array.isArray(incoming)){if(existing.some(x=>typeof x==='object')||incoming.some(x=>typeof x==='object'))return clone(existing.length?existing:incoming);return [...new Set([...existing,...incoming])];}if(existing&&incoming&&typeof existing==='object'&&typeof incoming==='object'){const out=clone(existing);for(const k of Object.keys(incoming))out[k]=k in out?merge(out[k],incoming[k]):clone(incoming[k]);return out;}return existing===false&&typeof incoming==='boolean'?incoming:existing===0&&typeof incoming==='number'?incoming:existing;}
export function restoreProfile(p,f){
 syncProfile(p,p.profile);const key=f.profile,d=f.data,old=p.profileData[key];
 const history=[...d.practice.history,...old.practice.history],rounds=[...d.practice.fluency,...old.practice.fluency];
 const joined=merge(old,d);joined.practice.history=[...new Map(history.map(x=>[x.id,x])).values()].sort((a,b)=>a.at-b.at).slice(-2000);joined.practice.fluency=[...new Map(rounds.map(x=>[x.id,x])).values()].sort((a,b)=>a.at-b.at).slice(-100);
 // Whole existing activity records win; never mix a remote step with local answers/drawing.
 for(const name of ['stories','valueStories','words','move'])joined.learning[name]={...d.learning[name],...old.learning[name]};
 if(old.learning.science){joined.learning.science=clone(old.learning.science);joined.learning.science.lessons={...d.learning.science?.lessons,...old.learning.science.lessons};joined.learning.science.wordsMet=[...new Set([...(d.learning.science?.wordsMet||[]),...old.learning.science.wordsMet])];}
 if(old.learning.math){joined.learning.math=clone(old.learning.math);joined.learning.math.lessons={...d.learning.math?.lessons,...old.learning.math.lessons};joined.learning.math.wordsMet=[...new Set([...(d.learning.math?.wordsMet||[]),...old.learning.math.wordsMet])];}
 if(old.learning.letterMatching?.started){joined.learning.letterMatching=clone(old.learning.letterMatching);joined.learning.letterMatching.rounds={...d.learning.letterMatching?.rounds,...old.learning.letterMatching.rounds};}
 if(old.learning.alphabetReading?.started){joined.learning.alphabetReading=clone(old.learning.alphabetReading);joined.learning.alphabetReading.heard=[...new Set([...old.learning.alphabetReading.heard,...(d.learning.alphabetReading?.heard||[])])];}
 if(old.lastActivity){joined.lastActivity=clone(old.lastActivity);if(old.lastActivity.page==='letter')joined.learning.letter=old.learning.letter;if(old.lastActivity.page==='spelling')joined.learning.spelling=clone(old.learning.spelling);}
 joined.pictureFamilies.inProgress={...d.pictureFamilies.inProgress,...old.pictureFamilies.inProgress};joined.pictureFamilies.writing.drafts={...d.pictureFamilies.writing.drafts,...old.pictureFamilies.writing.drafts};
 if(old.pictureFamilies.reading.at.started)joined.pictureFamilies.reading.at=clone(old.pictureFamilies.reading.at);
 joined.practice.items={...d.practice.items,...old.practice.items};if(old.practice.round)joined.practice.round=clone(old.practice.round);
 p.profileData[key]=clean(joined);p.completed[key]=[...new Set([...p.completed[key],...d.completed])];p.inProgress[key]={...d.inProgress,...p.inProgress[key]};p.currentLesson[key]??=d.currentLesson;p.last[key]??=d.last;
 if(key===p.profile)selectProfile(p,key);
 return 'Restored missing work to '+key+'. Existing answers, positions and drawings were kept when they differed. Neither profile was replaced.';
}
