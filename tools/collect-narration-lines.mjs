// Lists every line the automatic narration can read in English for Math and
// English for Science (both modes), and writes tools/narration-lines.json:
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

const has=k=>!!(stageSpeech[k]||familySpeech[k]);
const english=[...lines].filter(([en,v])=>!has(v.key)).map(([en])=>en);
const bangla=[...new Set([...lines.values()].flatMap(v=>[...v.banglas]))];
const untranslated=[...lines].filter(([,v])=>!v.banglas.size).map(([en])=>en);
const banglaMissing=bangla.filter(b=>!banglaSpeech[b]);
writeFileSync(root+'tools/narration-lines.json',JSON.stringify({english,bangla,untranslated},null,1)+'\n');
console.log(lines.size+' narrated lines. English without a recording: '+english.length+'. Bangla lines: '+bangla.length+' ('+banglaMissing.length+' not recorded yet). Untranslated: '+untranslated.length+'.');
if(untranslated.length)console.log('Add Bangla for these in dist/bangla-lines.js:\n - '+untranslated.join('\n - '));
