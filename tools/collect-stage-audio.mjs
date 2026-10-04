import {alphabet,alphabetCaseText,alphabetExampleText,wordLessons,stories,patternLessons,supportingWords} from '../dist/stage-data.js';
import {storyWords} from '../dist/story-words.js';
import {spellingNames} from '../dist/spelling-data.js';
const entries=new Map();
const add=(key,text,voice='en-GB-SoniaNeural',rate='-12%')=>entries.set(key,{key,text,voice,rate});
for(const a of alphabet){
 add('name:'+a.letter,'The letter '+a.letter.toUpperCase()+'.');
 add('alphabet-case:'+a.letter,alphabetCaseText(a.letter));
 for(const word of a.examples){add('alphabet-example:'+a.letter+':'+word,alphabetExampleText(a.letter,word));add('word:'+word,word);}
}
for(const l of wordLessons){add('word:'+l.word,l.word);add('text:'+l.phrase,l.phrase);add('text:'+l.sentence,l.sentence);}
for(const [word,entry]of Object.entries(supportingWords)){add('word:'+word,word);add('help:'+word,entry.help);}
for(const p of patternLessons)for(const word of p.words)add('word:'+word,word);
for(const story of stories){for(const sentence of story.sentences)add('text:'+sentence,sentence);for(const word of story.newWords)add('word:'+word,word);}
for(const [key,entry]of storyWords){if(!entry.meaning)throw Error('Missing Bengali meaning for '+key);add('story-meaning:'+key,entry.meaning.replaceAll('/','বা')+'।','bn-BD-NabanitaNeural','-8%');}
for(const [letter,name]of Object.entries(spellingNames))add('spelling-name:'+(letter==='-'?'hyphen':letter),name);
add('meaning:sit','সিট মানে বসা।','bn-BD-NabanitaNeural','-8%');
add('approx:sit','সিট। আবার বলো, সিট।','bn-BD-NabanitaNeural','-12%');
process.stdout.write(JSON.stringify([...entries.values()]));
