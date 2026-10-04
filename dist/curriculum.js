import {normalizeFamilyProgress} from './family-data.js';
import {normalizeLearning} from './stage-data.js';
export const letters = {
 a:{word:'ant',picture:'🐜',sound:'Open your mouth for the short a in ant. Keep it short.'},
 b:{word:'ball',picture:'⚽',sound:'Close your lips, then release a short b, as in ball. Avoid adding “uh”.'},
 c:{word:'cat',picture:'🐈',sound:'Use the hard c in cat. It has the same sound as k in this word.'},
 d:{word:'dog',picture:'🐕',sound:'Make a quick d, as in dog. Avoid adding “uh”.'},
 e:{word:'egg',picture:'🥚',sound:'Use the short e at the start of egg, not the letter name.'},
 f:{word:'fish',picture:'🐟',sound:'Rest your top teeth on your lower lip and blow gently: fff.'},
 g:{word:'goat',picture:'🐐',sound:'Use the hard g in goat. Keep it short, without adding “uh”.'},
 h:{word:'hat',picture:'🎩',sound:'Breathe out gently: h, as in hat.'},
 i:{word:'insect',picture:'🐞',sound:'Use the short i at the start of insect, not the letter name.'},
 j:{word:'jam',picture:'🍓',sound:'Make the first sound in jam. The picture shows fruit used to make jam.'},
 k:{word:'key',picture:'🔑',sound:'Make a quick k, as in key. It is the same sound as c in cat.'},
 l:{word:'leaf',picture:'🍃',sound:'Touch your tongue just behind your top teeth: lll, as in leaf.'},
 m:{word:'moon',picture:'🌙',sound:'Close your lips and hum: mmm. Keep the sound going.'},
 n:{word:'nose',picture:'👃',sound:'Touch your tongue behind your top teeth and hum: nnn.'},
 o:{word:'octopus',picture:'🐙',sound:'Use the short o at the start of octopus. Compare it with the vowel in hot in your accent.'},
 p:{word:'pig',picture:'🐖',sound:'Close your lips, then let out a tiny puff: p. Avoid adding “uh”.'},
 q:{word:'queen',picture:'👑',sound:'In queen, q works with u to make /kw/. Teach qu together; the picture is a crown.'},
 r:{word:'rabbit',picture:'🐇',sound:'Use the first sound in rabbit. Listen to your own accent and say it together.'},
 s:{word:'sun',picture:'☀️',sound:'Make a long, quiet hiss: sss, as in sun. Do not say the letter name “ess”.'},
 t:{word:'turtle',picture:'🐢',sound:'Make a quick t with your tongue behind your top teeth. Avoid adding “uh”.'},
 u:{word:'umbrella',picture:'☂️',sound:'Use the short u at the start of umbrella, not the letter name.'},
 v:{word:'van',picture:'🚐',sound:'Put your top teeth on your lower lip and buzz: vvv.'},
 w:{word:'web',picture:'🕸️',sound:'Round your lips, then open them: w, as in web.'},
 x:{word:'box',picture:'📦',sound:'Listen at the END of box. The x represents two sounds together: /k/ /s/.'},
 y:{word:'yo-yo',picture:'🪀',sound:'Use the first sound in yes or yo-yo, not the letter name “why”.'},
 z:{word:'zebra',picture:'🦓',sound:'Make a buzzing zzz, as in zebra.'}
};
export const words = {
 cat:'🐈',mat:'🟫',sat:'🪑',pan:'🍳',fan:'🪭',man:'👨',cap:'🧢',map:'🗺️',tap:'🚰',pin:'🧷',tin:'🥫',fin:'🦈',sit:'🪑',hit:'🥎',fit:'🧩',dog:'🐕',log:'🪵',fog:'🌫️',hen:'🐔',pen:'🖊️',ten:'🔟',bug:'🐞',mug:'☕',rug:'🟫',cup:'🥤',sun:'☀️',bus:'🚌'
};
const youngGroups=['sat','pin','mdg','ock','erh','bfl','ujv','wyz','qx'];
const conversations=[
 ['Hello!','Wave and say “Hello!” Take turns saying hello to a toy.'],
 ['My name is …','Say your name, then invite your child to say his.'],
 ['I see a …','Find a familiar thing together. Help him say “I see a ball.”'],
 ['It is red.','Find something red. Point and say “It is red.”'],
 ['This is my hand.','Point to a hand, nose and head. Say each name together.'],
 ['I like …','Choose a food he likes. Help him say “I like apples.”'],
 ['One, two, three!','Count three toys together. Touch one toy for each number.'],
 ['Please. Thank you!','Pass a toy to each other and practise both phrases.'],
 ['Goodbye!','Wave goodbye to three toys. Let him choose who goes first.']
];
export const explorer=youngGroups.map((group,i)=>({id:`letters-${group}`,title:group.split('').join(', '),items:[...group],label:i===8?'Two special letters':'Three new letters',talk:conversations[i]}));
export const adventurer=[
 {items:['cat','mat','sat'],title:'The -at family',sentence:'A cat sat.',question:'Who sat?',answer:'cat',choices:['cat','dog','hen'],cue:'Teach “A” as a little helping word. Blend c-a-t and s-a-t, then read the whole line.',talk:'Act out “The cat sat.” Then ask your child to sit.'},
 {items:['pan','fan','man'],title:'The -an family',sentence:'A man has a pan.',question:'What does the man have?',answer:'pan',choices:['pan','map','cup'],cue:'Read “A”, “has” and “a” together first. In has, s sounds like /z/. Blend man and pan.',talk:'Look for a pan in the kitchen. Say “This is a pan.”'},
 {items:['cap','map','tap'],title:'The -ap family',sentence:'A cap is on a map.',question:'What is on the map?',answer:'cap',choices:['cap','cat','pen'],cue:'Teach the helping words “A”, “is”, “on” and “a” first. In is, s sounds like /z/.',talk:'Put a cap on something. Say “The cap is on the …”'},
 {items:['pin','tin','fin'],title:'The -in family',sentence:'A pin is in a tin.',question:'What is in the tin?',answer:'pin',choices:['pin','fin','dog'],cue:'Say the short i in pin. Read the helping words “A”, “is”, “in” and “a” together.',talk:'Use a toy and a box to act out “in” and “out”.'},
 {items:['sit','hit','fit'],title:'The -it family',sentence:'I can sit.',question:'What can I do?',answer:'sit',choices:['sit','hit','fit'],cue:'Teach “I” as a helping word. Blend can and sit. Talk about what hit and fit mean.',talk:'Play “Stand up. Sit down.” Take turns giving instructions.'},
 {items:['dog','log','fog'],title:'The -og family',sentence:'A dog is on a log.',question:'Where is the dog?',answer:'log',choices:['log','rug','mat'],cue:'Model the short o in dog using your accent. Read “A”, “is”, “on” and “a” together.',talk:'Point to a toy dog or a picture. Say “I see a dog.”'},
 {items:['hen','pen','ten'],title:'The -en family',sentence:'I can see ten hens.',question:'How many hens?',answer:'ten',choices:['ten','one','two'],cue:'Teach “I” and “see” first. Add s to hen to mean more than one; here it sounds like /z/.',talk:'Count ten fingers together. Then say “I have ten fingers.”'},
 {items:['bug','mug','rug'],title:'The -ug family',sentence:'A bug is on a rug.',question:'What is on the rug?',answer:'bug',choices:['bug','mug','cat'],cue:'Use the short u in bug. Read the helping words “A”, “is”, “on” and “a” together.',talk:'Look at a rug or mat. Describe its colour together.'},
 {items:['cup','sun','bus'],title:'More short-u words',sentence:'A cup is on a bus.',question:'What is on the bus?',answer:'cup',choices:['cup','sun','hen'],cue:'Listen for short u in all three words. Read “A”, “is”, “on” and “a” together.',talk:'Say “I would like a cup of water, please.” Help with as many words as needed.'}
].map((lesson,i)=>({...lesson,id:`words-${i+1}`,label:'Build three little words'}));

const nextWordLessons = [
 {id:'words-10',items:['bat','hat','rat'],title:'More short-a words',focus:'Listen for short a in the middle.',sentence:'A rat is in a hat.',question:'Where is the rat?',answer:'hat',choices:['hat','pan','mug'],cue:'Blend each word using short a. Read the helping words “A”, “is”, “in” and “a” together. In is, s sounds like /z/. A bat can be an animal or something used in a game.',talk:'Find a hat or pretend to put one on. Say “This is my hat.”'},
 {id:'words-11',items:['bed','red','leg'],title:'More short-e words',focus:'Listen for short e in the middle.',sentence:'The bed is red.',question:'What is red?',answer:'bed',choices:['bed','pen','hat'],cue:'Model short e in bed, red and leg. Read “The” together as a helping word; its th sound will need your help. In is, s sounds like /z/.',talk:'Find something red together. Help your child say “The … is red.”'},
 {id:'words-12',items:['pig','dig','wig'],title:'More short-i words',focus:'Keep the i sound short.',sentence:'A pig can dig.',question:'Who can dig?',answer:'pig',choices:['pig','hen','cat'],cue:'Blend p-i-g, d-i-g and w-i-g. Explain that a wig is hair someone can put on. Read “A” together, then blend can and dig.',talk:'Pretend to dig with a small shovel. Say “I can dig.” Ask what else he can do.'},
 {id:'words-13',items:['pot','dot','cot'],title:'More short-o words',focus:'Listen for short o in the middle.',sentence:'A dot is on a pot.',question:'What is on the pot?',answer:'dot',choices:['dot','cat','cap'],cue:'Use the short o in hot in your accent. A cot is a small bed; point to a bed as an example. Read “A”, “is”, “on” and “a” together.',talk:'Draw a pot with a dot on paper. Ask him to point and say “A dot is on a pot.”'},
 {id:'words-14',items:['ant','tent','lamp'],title:'Hear the ending sounds',focus:'Keep both sounds at the end: n-t or m-p.',sentence:'An ant is in a tent.',question:'Where is the ant?',answer:'tent',choices:['tent','pot','bed'],cue:'Say both n and t at the end of ant and tent, and both m and p at the end of lamp. They are separate sounds. Blend “An” and “in”; help with is.',talk:'Use a blanket to make a pretend tent. Say “I am in the tent.”'},
 {id:'words-15',items:['stop','step','stem'],title:'Start with s and t',focus:'Say s, then t. Keep both sounds.',sentence:'Stop at the step.',question:'Where must we stop?',answer:'step',choices:['step','bed','lamp'],cue:'Slide s into t, then finish each word. The letters s and t keep their own sounds. Explain stem using a leaf or plant. Read the helping word “the” together.',talk:'Take one small step together. Take turns saying “Step” and “Stop.”'},
 {id:'words-16',items:['ship','shop','fish'],title:'Two letters: sh',focus:'The letters sh work together to make one sound.',sentence:'A fish is in a shop.',question:'Where is the fish?',answer:'shop',choices:['shop','tent','bed'],cue:'Teach sh as one sound, like asking for quiet. Blend sh-i-p, sh-o-p and f-i-sh. Do not split sh into the separate sounds for s and h. Help with “A”, “is”, “in” and “a”.',talk:'Pretend to run a little shop. Ask for a toy: “A …, please.” Then say “Thank you.”'},
 {id:'words-17',items:['chin','chip','chat'],title:'Two letters: ch',focus:'The letters ch work together to make one sound.',sentence:'I can chat.',question:'What can I do?',answer:'chat',choices:['chat','dig','sit'],cue:'Teach the ch at the start of chin as one sound. Blend ch-i-n, ch-i-p and ch-a-t. A chip can be a small piece or a potato snack. Read the helping word “I” together.',talk:'Have a short chat about a favourite toy. Try “I like my …” and let him ask you too.'},
 {id:'words-18',items:['duck','sock','neck'],title:'Two letters: ck',focus:'At the end of these words, ck makes one /k/ sound.',sentence:'A duck has a sock.',question:'What does the duck have?',answer:'sock',choices:['sock','hat','cup'],cue:'Blend d-u-ck, s-o-ck and n-e-ck. The letters ck make one short /k/ sound after the short vowel; do not say it twice. Help with “A”, “has” and “a”. In has, s sounds like /z/.',talk:'Act out the silly sentence with toys or a drawing. Then say what else the duck could have.'}
];
// Existing lesson IDs and activity order are also keys in saved family progress.
adventurer.push(...nextWordLessons.map(lesson=>({...lesson,label:'Listen, build and read'})));
Object.assign(words,{bat:'🦇',hat:'🎩',rat:'🐀',bed:'🛏️',red:'🔴',leg:'🦵',pig:'🐖',dig:'⛏️',wig:'💇',pot:'🍲',dot:'🔵',cot:'🛏️',ant:'🐜',tent:'⛺',lamp:'💡',stop:'🛑',step:'👣',stem:'🌱',ship:'🚢',shop:'🏪',fish:'🐟',chin:'🙂',chip:'🍟',chat:'💬',duck:'🦆',sock:'🧦',neck:'🧣'});
export const pairedSounds={
 sh:'Keep sh together. Make the quiet “sh” sound, as in ship. The two letters make one sound.',
 ch:'Keep ch together. Make the first sound in chin. The two letters make one sound.',
 ck:'Keep ck together. Make one short /k/ sound, as at the end of duck. Do not say two k sounds.'
};
export function wordParts(word){return word.match(/sh|ch|ck|./g)||[];}
export function partSound(part){return pairedSounds[part]||letters[part]?.sound||'';}

export const profiles={little:{name:'Little Explorer',age:5,subtitle:'Letters & first words',icon:'🌱',lessons:explorer},big:{name:'Word Adventurer',age:6,subtitle:'Build words & read',icon:'🚀',lessons:adventurer}};
export function makeStages(profile,lesson){
 if(profile==='little')return [...lesson.items.map(item=>({type:'letter',item})),...lesson.items.map(item=>({type:'match',item})),...lesson.items.map(item=>({type:'trace',item})),{type:'talk'}];
 return [...lesson.items.map(item=>({type:'word',item})),...lesson.items.map(item=>({type:'build',item})),...lesson.items.map(item=>({type:'listen',item})),{type:'read'},{type:'talk'}];
}

export function normalizeCheckpoint(profile, raw) {
 const lesson = profiles[profile]?.lessons.find(item => item.id === raw?.lessonId);
 if (!lesson || !Number.isInteger(raw.step)) return null;
 const stage = makeStages(profile, lesson)[raw.step];
 if (!stage) return null;
 const result = {lessonId: lesson.id, step: raw.step, tiles: [], placed: [], choices: [], answer: null, drawing: []};
 if (stage.type === 'build') {
  if (Array.isArray(raw.tiles) && raw.tiles.length === stage.item.length && raw.tiles.every(c => typeof c === 'string' && c.length === 1) && [...raw.tiles].sort().join('') === [...stage.item].sort().join('')) {
   result.tiles = [...raw.tiles];
   if (Array.isArray(raw.placed) && raw.placed.length <= result.tiles.length && new Set(raw.placed).size === raw.placed.length && raw.placed.every(i => Number.isInteger(i) && i >= 0 && i < result.tiles.length)) result.placed = [...raw.placed];
  }
 }
 if (['match','listen','read'].includes(stage.type)) {
  const pool = stage.type === 'match' ? Object.keys(letters) : stage.type === 'listen' ? lesson.items : lesson.choices;
  const expected = stage.type === 'read' ? lesson.answer : stage.item;
  if (Array.isArray(raw.choices) && raw.choices.length === 3 && new Set(raw.choices).size === 3 && raw.choices.includes(expected) && raw.choices.every(choice => pool.includes(choice))) result.choices = [...raw.choices];
  if (result.choices.includes(raw.answer)) result.answer = raw.answer;
 }
 if (stage.type === 'trace' && Array.isArray(raw.drawing)) {
  let count = 0;
  for (const stroke of raw.drawing.slice(0,1000)) {
   if (!Array.isArray(stroke)) continue;
   const points = stroke.filter(point => Array.isArray(point) && point.length === 2 && point.every(n => Number.isFinite(n) && n >= 0 && n <= 1)).slice(0,20000-count).map(point => [...point]);
   if (points.length) result.drawing.push(points);
   count += points.length;
   if (count >= 20000) break;
  }
 }
 return result;
}
export function normalizeProgress(raw) {
 const result = {profile: raw?.profile === 'big' ? 'big' : 'little', completed: {little:[],big:[]}, voice: typeof raw?.voice === 'string' ? raw.voice : '', audioMode: raw?.audioMode === 'system' ? 'system' : 'recorded', audioSpeed: raw?.audioSpeed === .85 ? .85 : 1, last: {little:null,big:null}, inProgress: {little:{},big:{}}, currentLesson: {little:null,big:null}, pictureFamilies:normalizeFamilyProgress(raw?.pictureFamilies)};
 for (const key of ['little','big']) {
  const valid = new Set(profiles[key].lessons.map(x => x.id));
  result.completed[key] = [...new Set((Array.isArray(raw?.completed?.[key]) ? raw.completed[key] : []).filter(x => valid.has(x)))];
  result.last[key] = typeof raw?.last?.[key] === 'string' ? raw.last[key] : null;
  for (const id of valid) {
   const checkpoint = normalizeCheckpoint(key, raw?.inProgress?.[key]?.[id]);
   if (checkpoint?.lessonId === id) result.inProgress[key][id] = checkpoint;
  }
  if (valid.has(raw?.currentLesson?.[key]) && result.inProgress[key][raw.currentLesson[key]]) result.currentLesson[key] = raw.currentLesson[key];
 }
 result.learning=normalizeLearning(raw?.learning);
 return result;
}
