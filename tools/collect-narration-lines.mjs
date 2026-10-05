// Lists every line the automatic narration can read: Math, Science, Stories
// (both modes) and the Letters/Words game steps, and writes tools/narration-lines.json:
//   english  – English lines that have no recording yet
//   bangla   – every Bangla line (recorded by generate-pending-audio.py bangla)
//   untranslated – English lines with no Bangla text at all (should be empty)
// Run from the project root:  node tools/collect-narration-lines.mjs
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url)),D='file://'+root.replace(/\\/g,'/')+'dist/';
const {mathLessons,mathSteps}=await import(D+'math-data.js');
const {scienceLessons,scienceSteps}=await import(D+'science-data.js');
const {playfulLesson}=await import(D+'playful-data.js');
const {banglaLines}=await import(D+'bangla-lines.js');
const {stageSpeech}=await import(D+'stage-speech.js');
const {familySpeech}=await import(D+'family-speech.js');
const {banglaSpeech}=await import(D+'bangla-speech.js');

const lines=new Map();// english -> {key, banglas:Set} (one English line can have more than one Bangla, e.g. a word's meaning in two lessons)
const add=(en,bn,key='text:'+en)=>{if(!en)return;const cur=lines.get(en)||{key,banglas:new Set()};const b=bn||banglaLines[en]||'';if(b)cur.banglas.add(b);lines.set(en,cur);};

// Without games: word, sentence and question steps.
for(const l of mathLessons)for(const extra of [false,true]){for(const st of mathSteps(l,extra)){
 if(st.type==='word'){add(st.word,st.meaning,'math-word:'+st.word);add(st.text,banglaLines[st.text]);}
 else if(st.type==='sentence')add(st.text,st.meaning);
 else if(st.type==='question')add(st.prompt,st.meaning);}}
for(const l of scienceLessons)for(const st of scienceSteps(l)){
 if(st.type==='word'){add(st.word,st.meaning,'science-word:'+st.word);add(st.text,banglaLines[st.text]);}
 else if(st.type==='sentence'||st.type==='recap'){add(st.text,st.meaning);for(const o of st.action?.options||[])add(o.text,o.meaning);}
 else if(st.type==='question')add(st.prompt,st.meaning);}
// With games: every step's instruction text, plus the activity hints.
for(const l of [...mathLessons.map(l=>'math:'+l.id),...scienceLessons.map(l=>'science:'+l.id)]){
 for(const st of playfulLesson(l).steps){if(st.type==='finish')continue;add(st.text,st.vocabulary?'':st.meaning);}}
const hints=['Tap an item, then its place. Or drag it. Tap a placed item to move it again.','Drag an object to its group, or tap the object, then its group. Remember the results you observed.','Drag the red group toward the yellow group, or use the button.','The dashed line is our common starting point. Drag the blue ribbon back to it.','Drag the short hand toward 3, or choose three o’clock.','What do you predict? We will test and find out.',
 ...['the round ball','the square quilt','the triangle tent'].map(o=>'Match '+o+' to its shape.'),
 ...['bird','frog','cow','deer','these animals'].map(a=>'Choose the place shown for '+a+'. Some animals can live in more than one kind of place.')];
for(const h of hints)add(h,banglaLines[h]);
// Stories (both modes), values stories, and the Letters/Words game steps.
const {stories}=await import(D+'stage-data.js');
const {valuesStories}=await import(D+'values-stories.js');
const {storyIntroductions}=await import(D+'story-words.js');
const {playfulIds}=await import(D+'playful-data.js');
const refuge=/A[‘']udhu/i;
for(const s of [...stories,...valuesStories])for(const t of s.sentences){if(refuge.test(t)){const b=banglaLines[t];if(b)lines.set(t,{key:'value-refuge-prefix',banglas:new Set([b])});}else add(t,banglaLines[t]);}
for(const t of ['Look, then fill the gap.','Which word was in the story?','Listen, then choose the matching picture.','Look at the picture. Choose the missing word.','Tap a pair to hear its English letter name.','Tap each name and sound. The big and little forms have the same name.','Drag a line from a big letter, or tap big then little.','Move a finger from the first sound to the last. Tapping each sound works too.'])add(t,banglaLines[t]);
// Word meanings: values vocabulary (value-word: English), story helper words (story-meaning: if recorded).
const extraBangla=new Set();
for(const s of valuesStories)for(const v of s.vocabulary||[]){if(v.meaning)extraBangla.add(v.meaning);}
for(const s of stories)for(let line=0;line<s.sentences.length;line++)for(const e of storyIntroductions(s,line,{storyWordsMet:[],playful:{wordsMet:[]},valueWordsMet:[],words:{}})||[])if(e?.meaning&&!stageSpeech['story-meaning:'+e.word.toLowerCase()])extraBangla.add(e.meaning);
for(const id of playfulIds()){const l=playfulLesson(id);if(['math','science'].includes(l.section))continue;for(const st of l.steps){if(['finish','paragraph'].includes(st.type))continue;const t=st.vocabulary&&st.example?st.example:st.text;if(refuge.test(t))continue;add(t,l.section==='letters'&&st.meaning?st.meaning:banglaLines[t]);}}

const has=k=>!!(stageSpeech[k]||familySpeech[k]||k==='value-refuge-prefix');
// Short spoken hints in the games (English only, no narration).
const gameHints=['Tap a big letter first, then its little letter.','Tap a sound tile first, then a word space.','Pick an item first, then tap where it goes.','Tap an object first, then its group.','First pick the cat.','First pick the rat.'];
const english=[...[...lines].filter(([en,v])=>!has(v.key)).map(([en])=>en),...gameHints.filter(t=>!has('text:'+t))];
const bangla=[...new Set([...[...lines.values()].flatMap(v=>[...v.banglas]),...extraBangla])];
const untranslated=[...lines].filter(([,v])=>!v.banglas.size).map(([en])=>en);
const banglaMissing=bangla.filter(b=>!banglaSpeech[b]);
writeFileSync(root+'tools/narration-lines.json',JSON.stringify({english,bangla,untranslated},null,1)+'\n');
console.log(lines.size+' narrated lines. English without a recording: '+english.length+'. Bangla lines: '+bangla.length+' ('+banglaMissing.length+' not recorded yet). Untranslated: '+untranslated.length+'.');
if(untranslated.length)console.log('Add Bangla for these in dist/bangla-lines.js:\n - '+untranslated.join('\n - '));
