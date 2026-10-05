import {normalizeAtReading} from './at-reading-data.js';
export const pictureFamilies = [
 {id:'at',words:['cat','hat','mat','rat','bat','pat','sat','fat'],poster:'/pictures/family-at.jpeg',sheet:'/pictures/family-at.png',columns:3,rows:3,colour:'pink'},
 {id:'an',words:['can','man','pan','fan','van','ran'],poster:'/pictures/family-an.jpeg',sheet:'/pictures/family-an.png',columns:3,rows:2,colour:'green'},
 {id:'ig',words:['pig','big','dig','wig'],poster:'/pictures/family-ig.jpeg',sheet:'/pictures/family-ig.png',columns:2,rows:2,colour:'purple'},
 {id:'op',words:['hop','mop','top','pop'],poster:'/pictures/family-op.jpeg',sheet:'/pictures/family-op.png',columns:2,rows:2,colour:'blue'},
 {id:'un',words:['sun','run','bun','fun','gun'],poster:'/pictures/family-un.jpeg',sheet:'/pictures/family-un.png',columns:3,rows:2,colour:'gold'},
 {id:'en',words:['hen','pen','ten','den'],sheet:'/pictures/family-en.png',colour:'green'},
 {id:'in',words:['pin','tin','fin','bin'],sheet:'/pictures/family-in.png',colour:'purple'},
 {id:'ap',words:['cap','map','tap','nap'],sheet:'/pictures/family-ap.png',colour:'pink'},
 {id:'og',words:['dog','log','fog','jog'],sheet:'/pictures/family-og.png',colour:'blue'},
 {id:'ug',words:['bug','mug','rug','hug'],sheet:'/pictures/family-ug.png',colour:'gold'}
];
const definitions = {
 cat:['ক্যাট','বিড়াল','a cat'],hat:['হ্যাট','টুপি','a hat'],mat:['ম্যাট','মাদুর','a mat'],rat:['র‍্যাট','ইঁদুর','a rat'],bat:['ব্যাট','খেলার ব্যাট','a cricket bat'],pat:['প্যাট','আলতো করে আদর করা','a hand gently patting a cat'],sat:['স্যাট','বসেছিল','a child who sat down'],fat:['ফ্যাট','মোটা','a round cat'],
 can:['ক্যান','টিনের কৌটা','a tin can'],man:['ম্যান','একজন পুরুষ মানুষ','a man'],pan:['প্যান','রান্নার প্যান','a frying pan'],fan:['ফ্যান','পাখা','an electric fan'],van:['ভ্যান','ছোট মালবাহী গাড়ি','a van'],ran:['র‍্যান','দৌড়েছিল','a child who ran'],
 pig:['পিগ','শূকর','a pig'],big:['বিগ','বড়','a big ball beside a small ball'],dig:['ডিগ','মাটি খোঁড়া','a child digging'],wig:['উইগ','পরচুলা','a wig'],
 hop:['হপ','এক পায়ে লাফ দেওয়া','a child hopping on one foot'],mop:['মপ','মেঝে মোছার ঝাঁটা','a mop'],top:['টপ','লাটিম','a spinning top'],pop:['পপ','ফেটে যাওয়া','a bubble popping'],
 sun:['সান','সূর্য','the sun'],run:['রান','দৌড়ানো','a child running'],bun:['বান','ছোট গোল রুটি','a bread bun'],fun:['ফান','মজা','children having fun'],gun:['গান','বন্দুক; ছবিতে খেলনা পানির পিস্তল','a toy water gun'],
 hen:['হেন','মুরগি','a hen'],pen:['পেন','কলম','a pen'],ten:['টেন','দশ','ten stars'],den:['ডেন','বন্য প্রাণীর গুহা বা বাসা','a fox in its den'],
 pin:['পিন','পিন','a safety pin'],tin:['টিন','টিনের কৌটা','a tin can'],fin:['ফিন','মাছের পাখনা','a fish with a fin'],bin:['বিন','ময়লা ফেলার পাত্র','a rubbish bin'],
 cap:['ক্যাপ','ক্যাপ বা টুপি','a cap'],map:['ম্যাপ','মানচিত্র','a map'],tap:['ট্যাপ','পানির কল','a water tap'],nap:['ন্যাপ','অল্প সময়ের ঘুম','a child taking a nap'],
 dog:['ডগ','কুকুর','a dog'],log:['লগ','গাছের কাটা গুঁড়ি','a wooden log'],fog:['ফগ','কুয়াশা','fog around a tree'],jog:['জগ','ধীরে দৌড়ানো','a child jogging'],
 bug:['বাগ','ছোট পোকা','a ladybug'],mug:['মাগ','হাতলওয়ালা কাপ','a mug'],rug:['রাগ','ছোট কার্পেট','a rug'],hug:['হাগ','জড়িয়ে ধরা','two children hugging']
};
// Separate picture sheets keep chart labels out of word-building clues.
export const familyWords = Object.fromEntries(Object.entries(definitions).map(([word,[approx,meaning,description]]) => {
 const family = pictureFamilies.find(f=>f.words.includes(word));
 return [word,{word,approx,meaning,description,family:family.id,picture:family.sheet,columns:family.columns||2,rows:family.rows||2,quadrant:family.words.indexOf(word),
  meaningText:approx+' মানে '+meaning+'।',approxText:approx+'। আবার বলো, '+approx+'।'}];
}));
export const familyRounds = pictureFamilies.flatMap(family=>{
 const result=[];
 for(let i=0;i<family.words.length;i+=3)result.push({id:'picture-'+family.id+'-'+(i/3+1),family:family.id,items:family.words.slice(i,i+3),number:i/3+1});
 return result;
});
export function familyStages(round){return round.items.flatMap(item=>[{type:'learn',item},{type:'build',item},{type:'match',item}]);}
export function normalizeWordDrawing(raw){
 const drawing=[];let count=0;
 if(!Array.isArray(raw))return drawing;
 for(const stroke of raw.slice(0,1000)){
  if(!Array.isArray(stroke))continue;
  const points=stroke.filter(point=>Array.isArray(point)&&point.length===2&&point.every(n=>Number.isFinite(n)&&n>=0&&n<=1)).slice(0,20000-count).map(point=>[...point]);
  if(points.length)drawing.push(points);
  count+=points.length;if(count>=20000)break;
 }
 return drawing;
}
export function normalizeWordWriting(raw){
 const result={completed:[],drafts:{},current:null};
 const valid=Object.keys(familyWords);
 result.completed=[...new Set((Array.isArray(raw?.completed)?raw.completed:[]).filter(word=>valid.includes(word)))];
 for(const word of valid){
  const draft=raw?.drafts?.[word];if(!draft||typeof draft!=='object')continue;
  result.drafts[word]={drawing:normalizeWordDrawing(draft.drawing),showGuide:draft.showGuide!==false};
 }
 if(valid.includes(raw?.current)&&result.drafts[raw.current])result.current=raw.current;
 return result;
}
export function normalizeFamilyProgress(raw){
 const result={completed:[],inProgress:{},current:null,lastFamily:null,selected:{},writing:normalizeWordWriting(raw?.writing),reading:{at:normalizeAtReading(raw?.reading?.at)}};
 const valid=new Set(familyRounds.map(r=>r.id));
 result.completed=[...new Set((Array.isArray(raw?.completed)?raw.completed:[]).filter(id=>valid.has(id)))];
 for(const round of familyRounds){
  const saved=raw?.inProgress?.[round.id],stage=familyStages(round)[saved?.step];
  if(!saved||!Number.isInteger(saved.step)||!stage)continue;
  const checkpoint={step:saved.step,tiles:[],placed:[],choices:[],answer:null};
  if(stage.type==='build'&&Array.isArray(saved.tiles)&&saved.tiles.length===3&&[...saved.tiles].sort().join('')===[...stage.item].sort().join('')&&saved.tiles.every(c=>typeof c==='string'&&c.length===1)){
   checkpoint.tiles=[...saved.tiles];
   if(Array.isArray(saved.placed)&&saved.placed.length<=3&&new Set(saved.placed).size===saved.placed.length&&saved.placed.every(i=>Number.isInteger(i)&&i>=0&&i<3))checkpoint.placed=[...saved.placed];
  }
  const family=pictureFamilies.find(f=>f.id===round.family);
  if(stage.type==='match'&&Array.isArray(saved.choices)&&saved.choices.length===3&&new Set(saved.choices).size===3&&saved.choices.includes(stage.item)&&saved.choices.every(w=>family.words.includes(w))){
   checkpoint.choices=[...saved.choices];
   if(checkpoint.choices.includes(saved.answer))checkpoint.answer=saved.answer;
  }
  result.inProgress[round.id]=checkpoint;
 }
 if(valid.has(raw?.current)&&result.inProgress[raw.current])result.current=raw.current;
 if(pictureFamilies.some(f=>f.id===raw?.lastFamily))result.lastFamily=raw.lastFamily;
 for(const family of pictureFamilies)if(family.words.includes(raw?.selected?.[family.id]))result.selected[family.id]=raw.selected[family.id];
 return result;
}
