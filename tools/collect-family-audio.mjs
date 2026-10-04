import {familyWords} from '../dist/family-data.js';
process.stdout.write(JSON.stringify(Object.values(familyWords).flatMap(entry=>[
 {key:'word:'+entry.word,text:entry.word,voice:'en-GB-SoniaNeural',rate:'-12%'},
 {key:'meaning:'+entry.word,text:entry.meaningText,voice:'bn-BD-NabanitaNeural',rate:'-8%'},
 {key:'approx:'+entry.word,text:entry.approxText,voice:'bn-BD-NabanitaNeural',rate:'-12%'}
])));
