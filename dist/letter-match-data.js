// Small early sets keep easily confused forms apart; the final rounds add them.
export const letterMatchRounds=['as','mt','fen','hor','cukv','wxzy','blij','dpqg'].map((letters,i)=>({id:'letter-pairs-'+(i+1),letters:[...letters]}));
const count=n=>Number.isInteger(n)&&n>=0&&n<=10000?n:0;
export function normalizeMatchBoard(raw,letters){
 const order=Array.isArray(raw?.order)&&raw.order.length===letters.length&&new Set(raw.order).size===letters.length&&raw.order.every(c=>letters.includes(c))?[...raw.order]:[...letters].reverse();
 const matches=[...new Set((Array.isArray(raw?.matches)?raw.matches:[]).filter(c=>letters.includes(c)))],results={};
 for(const c of letters){const r=raw?.results?.[c];if(r)results[c]={attempts:count(r.attempts),misses:count(r.misses),assisted:r.assisted===true,firstCorrect:typeof r.firstCorrect==='boolean'?r.firstCorrect:null};}
 return{order,matches,results};
}
export function normalizeLetterMatching(raw){
 const round=Number.isInteger(raw?.round)&&raw.round>=0&&raw.round<letterMatchRounds.length?raw.round:0,rounds={};
 for(const r of letterMatchRounds)if(raw?.rounds?.[r.id])rounds[r.id]=normalizeMatchBoard(raw.rounds[r.id],r.letters);
 const reviewLetters=[...new Set((Array.isArray(raw?.review?.letters)?raw.review.letters:[]).filter(c=>/^[a-z]$/.test(c)))].slice(0,4);
 const review=reviewLetters.length?{letters:reviewLetters,...normalizeMatchBoard(raw.review,reviewLetters)}:null;
 const phase=['intro','round','finished','review'].includes(raw?.phase)&&!(raw.phase==='review'&&!review)?raw.phase:'intro';
 const letters=phase==='review'?review.letters:letterMatchRounds[round].letters;
 return{started:raw?.started===true,language:raw?.language==='en'?'en':'bn',phase,round,rounds,review,selected:letters.includes(raw?.selected)?raw.selected:null};
}
