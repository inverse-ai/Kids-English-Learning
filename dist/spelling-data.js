import {alphabet} from './stage-data.js';

// Letter names are separate from the pure phonics clips used for reading.
// Word forms make isolated names unambiguous to the narration voice (A = ay).
export const spellingNames=Object.freeze({a:'ay.',b:'bee.',c:'see.',d:'dee.',e:'ee.',f:'ef.',g:'gee.',h:'aitch.',i:'eye.',j:'jay.',k:'kay.',l:'ell.',m:'em.',n:'en.',o:'oh.',p:'pee.',q:'cue.',r:'are.',s:'ess.',t:'tee.',u:'you.',v:'vee.',w:'double you.',x:'ex.',y:'why.',z:'zed.','-':'hyphen.'});
export function spellingParts(index){
 const lesson=alphabet[index];if(!lesson)return [];
 return lesson.examples.flatMap((word,example)=>[
  ...[...word].map((letter,letterIndex)=>({key:'spelling-name:'+(letter==='-'?'hyphen':letter),target:'.spelling-example[data-example="'+example+'"] [data-letter-index="'+letterIndex+'"]',example,letterIndex,phase:'Spell '+word+': '+(letter==='-'?'hyphen':letter.toUpperCase())})),
  {key:'word:'+word,target:'.spelling-example[data-example="'+example+'"] .spelling-word',example,wholeWord:true,phase:word,pauseAfter:600}
 ]);
}

export const spellingIntroText=(letter,word)=>letter==='x'?'X in '+word+'.':letter==='q'?'Q with U for '+word+'.':letter.toUpperCase()+' is for '+word+'.';
