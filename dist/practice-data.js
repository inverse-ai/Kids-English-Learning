import {playfulReviewItems} from './playful-review.js';
import {moveReviewItems} from './move-data.js';
import {scienceReviewItems} from './science-data.js';
import {mathReviewItems} from './math-data.js';
import {alphabet,stories,pictureSymbols} from './stage-data.js';
import {valuesStories} from './values-stories.js';
import {letters,words} from './curriculum.js';
import {familyWords} from './family-data.js';
const oldQuestions={
 'cat-rat':['What was the cat on?',1,'mat',['mat','pen','sun']],
 'hen-sun':['Who was in the sun?',0,'hen',['hen','pig','cat']],
 'pig-pen':['Who was in the pen?',0,'pig',['pig','hen','cat']],
 'red-bag':['What was in the bag?',1,'pen',['pen','hen','sun']],
 'dog-log':['What was the dog on?',0,'log',['log','rug','cup']],
 'bun-cup':['What did Mum have?',0,'bun',['bun','sun','pen']],
 'map-tap':['What was the map on?',1,'mat',['mat','cat','pig']],
 'bus-stop':['What colour was the bus?',2,'red',['red','blue','green']],
 'fish-shop':['What could the man get for his tank?',3,'fish',['fish','chip','cat']],
 'little-ship':['What was by the ship?',1,'fish',['fish','chip','hen']],
 'shell-gift':['What was in the child’s hand?',1,'shell',['shell','ship','shop']],
 'shed-cat':['Where did the cat run?',0,'shed',['shed','shop','ship']],
 'chip-lunch':['What was on the dish too?',1,'Fish',['Fish','Cat','Pig']],
 'chin-chat':['Where did Dad have a spot?',0,'chin',['chin','arm','leg']],
 'chick-run':['Who was with the hen?',0,'chick',['chick','cat','pig']],
 'bench-rest':['Where did they sit?',0,'bench',['bench','shed','ship']],
 'rain-snail':['What was on the path?',1,'snail',['snail','train','tail']],
 'train-trip':['What did they wait for?',0,'train',['train','snail','tail']],
 'cat-tail':['What did the cat have?',0,'tail',['tail','train','snail']],
 'rain-paint':['What did the child paint on a page?',0,'rain',['rain','sea','leaf']],
 'sea-seat':['What did the child see on the beach?',1,'shell',['shell','leaf','chip']],
 'leaf-tree':['What fell from the tree?',0,'leaf',['leaf','sea','seat']],
 'peach-meal':['What did they each eat a piece of?',2,'peach',['peach','bun','leaf']],
 'beach-clean':['Where did Dad and the child put the bag?',2,'bin',['bin','sea','bench']]
};
const valueQuestions=[
 ['What was on the plate?',0,'bun',['bun','cat','hat']],['What did the children play with?',4,'ball',['ball','cup','hat']],['Who drank the water?',4,'cat',['cat','hen','pig']],['Who was at the door?',1,'Dad',['Dad','Mum','Grandma']],['How many dates did the child have at first?',0,'two',['two','three','four']],['What did the little brother bring?',2,'towel',['towel','cup','ball']],['What did they use to wipe up the water?',4,'cloth',['cloth','hat','book']],['What did the child put neatly together?',2,'shoes',['shoes','cups','books']],['What did Dad cut?',0,'apple',['apple','bun','peach']],['Who moved the twig aside?',3,'Dad',['Dad','Mum','Grandma']],['Who took a drink?',4,'bird',['bird','cat','pig']],['What did the child show Mum?',4,'drawing',['drawing','cup','hat']],['What did they build again?',4,'tower',['tower','house','bridge']],['What did the children ride?',0,'bike',['bike','bus','train']],['What did they bring their guest?',4,'date',['date','apple','bun']],['What did the child find?',0,'pencil',['pencil','ball','hat']],['What did the child draw?',0,'flower',['flower','tree','cat']],['Who carried a tiny crumb?',2,'ant',['ant','cat','bird']],['Where did the child put the toys?',1,'box',['box','bag','cup']],['What did the child bring Mum?',1,'water',['water','milk','juice']],['What did the brothers build together?',4,'tower',['tower','house','bridge']],['Who helped the children?',3,'Mum',['Mum','Dad','Grandma']],['What toy did the brothers share?',0,'truck',['truck','bike','ball']]
];
export const comprehension=[...stories.map(s=>({s,parts:oldQuestions[s.id]})),...valuesStories.map((s,i)=>({s,parts:valueQuestions[i]}))].map(({s,parts})=>{
 if(!parts)throw Error('Missing comprehension: '+s.id);const [prompt,line,answer,choices]=parts;return {id:'story:'+s.id,kind:'story',storyId:s.id,label:s.title,prompt,line,answer,choices,evidence:new RegExp('\\b'+answer+'\\b','i').test(s.sentences[line])?s.sentences[line]:s.sentences.join(' '),value:s.kind==='values'};
});
export const items=Object.fromEntries([
 ...alphabet.map(a=>({id:'letter:'+a.letter,kind:'letter',label:a.letter.toUpperCase()+a.letter,answer:a.letter,prompt:'Find the little '+a.letter.toUpperCase()+'.',choices:[a.letter,...'abcdefghijklmnopqrstuvwxyz'].filter((c,i,a)=>a.indexOf(c)===i).slice(0,3)})),
 ...[...new Set([...Object.keys(words),...Object.keys(familyWords),...alphabet.flatMap(a=>a.examples),...valuesStories.flatMap(s=>s.vocabulary.map(v=>v.word.toLowerCase()))])].map(w=>({id:'word:'+w,kind:'word',label:w,answer:w,prompt:familyWords[w]||pictureSymbols[w]?'Look at the picture. Find the word.':'Hear the word. Choose it.',choices:[w,...['cat','sun','pen'].filter(x=>x!==w)].slice(0,3),picture:pictureSymbols[w]||words[w]||null})),...comprehension,...playfulReviewItems,...moveReviewItems,...mathReviewItems,...scienceReviewItems
].map(x=>[x.id,x]));
export const DAY=86400000;
const finite=(x,max)=>Number.isFinite(x)&&x>=0&&x<=max;
export function normalizePractice(raw){
 const out={items:{},history:[],fluency:[],round:null};
 for(const [id,r] of Object.entries(raw?.items||{})){if(!items[id]||!r||!finite(r.due,8.64e15))continue;out.items[id]={due:r.due,level:Number.isInteger(r.level)&&r.level>=0&&r.level<=4?r.level:0,correct:Number.isInteger(r.correct)&&r.correct>=0?r.correct:0,misses:Number.isInteger(r.misses)&&r.misses>=0?r.misses:0,last:finite(r.last,8.64e15)?r.last:0};}
 out.history=(Array.isArray(raw?.history)?raw.history:[]).filter(x=>items[x?.item]&&typeof x.id==='string'&&x.id.length<100&&finite(x.at,8.64e15)&&typeof x.correct==='boolean'&&typeof x.assisted==='boolean').slice(-2000).map(x=>({id:x.id,item:x.item,at:x.at,correct:x.correct,assisted:x.assisted}));
 out.fluency=(Array.isArray(raw?.fluency)?raw.fluency:[]).filter(x=>typeof x?.id==='string'&&finite(x.at,8.64e15)&&finite(x.seconds,86400)&&Array.isArray(x.words)&&x.words.length<=5&&x.words.every(w=>items['word:'+w])&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=x.words.length).slice(-100).map(x=>({id:x.id,at:x.at,seconds:x.seconds,words:x.words,correct:x.correct}));
 const r=raw?.round;if(r&&Array.isArray(r.words)&&r.words.length>0&&r.words.length<=5&&r.words.every(w=>items['word:'+w])&&Number.isInteger(r.index)&&r.index>=0&&r.index<=r.words.length&&Number.isInteger(r.correct)&&r.correct>=0&&r.correct<=r.index&&finite(r.elapsed,86400))out.round={words:r.words,index:r.index,correct:r.correct,elapsed:r.elapsed};return out;
}
export function recordAttempt(p,id,correct,assisted=false,now=Date.now()){
 if(!items[id])return;const r=p.items[id]??={due:now,level:0,correct:0,misses:0,last:0};
 if(correct&&!assisted){r.correct++;const days=[1,3,7,14,30][r.level];r.due=now+days*DAY;r.level=Math.min(4,r.level+1);}else{r.misses++;r.level=1;r.due=now+DAY;}r.last=now;
 p.history.push({id:crypto.randomUUID(),item:id,at:now,correct:!!correct,assisted:!!assisted});p.history=p.history.slice(-2000);
}
export const dueItems=(p,now=Date.now())=>Object.keys(p.items).filter(id=>p.items[id].due<=now).sort((a,b)=>p.items[a].due-p.items[b].due);
