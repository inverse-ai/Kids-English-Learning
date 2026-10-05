import {playfulReviewItems} from './playful-review.js';
import {storyWords} from './story-words.js';
import {alphabet,stories,wordLessons} from './stage-data.js';
import {familyWords,pictureFamilies} from './family-data.js';
import {valuesStories} from './values-stories.js';
import {mathLessons,mathWords,mathQuestionId} from './math-data.js';
import {scienceLessons,scienceQuestionId} from './science-data.js';
import {comprehension} from './practice-data.js';
const read=(text,scene,meaning='',audio='text:'+text)=>({type:'read',text,scene,meaning,audio});
const choose=(text,choices,answer,skill,feedback,scene='',hint='')=>({type:'choose',text,choices,answer,skill,feedback,scene,hint:hint||feedback});
const finish=text=>({type:'finish',text});
const number=n=>['zero','one','two','three','four','five','six','seven','eight'][n];
const wordChoice=w=>({id:w,label:w,word:w});
const countChoice=(n,object)=>({id:String(n),label:String(n),scene:'math:'+(object||'flower')+'-choice-'+n});
export function playfulLesson(id){
 if(id.startsWith('letter:')){
  const a=alphabet.find(a=>a.letter===id.slice(7));if(!a)return null;
  const c=a.letter,other=alphabet.find(l=>l.letter!==c&&!['b','d','p','q'].includes(l.letter)).letter,wrong=alphabet.find(l=>l.letter!==c&&l.letter!==other).letter;
  const choices=[c,other,wrong].map(x=>({id:x,label:x.toUpperCase()})),skill='letter:'+c;
  return{id,section:'letters',title:'A little '+c.toUpperCase()+c+' adventure',steps:[
   choose('Can you find '+c.toUpperCase()+'?',choices,c,skill,c.toUpperCase()+' matches '+c+'. Look at its shape.'),
   {type:'letter-listen',text:'Meet '+c.toUpperCase()+' and '+c+'. Names and sounds are different.',letter:c,skill,meaning:'বড় ও ছোট অক্ষরের নাম একই। নাম ও ধ্বনি আলাদা করে শোনো।'},
   {type:'pairs',text:'Connect the same letters.',letters:[c,other],skill,feedback:'You joined a big letter to its little letter.'},
   {type:'sound-pictures',text:c==='x'?'Find the words with X at the end.':c==='q'?'Find the words starting with qu.':'Find both pictures starting with this sound.',letter:c,choices:[...a.examples,alphabet.find(l=>l.letter!==c).examples[0]].map(wordChoice),answers:a.examples,skill,feedback:'You heard the sound in both picture words.',hint:a.examples.join(' and ')+' use the taught sound. Listen to each picture.'},
   {type:'trace',text:'Follow the letter trail.',letter:c,skill,meaning:'বিন্দু থেকে শুরু করে তীরের দিকে লেখো। কাগজেও অনুশীলন করা যায়।'},
   choose('One last look. Find the little '+c.toUpperCase()+'.',[wrong,c,other].map(x=>({id:x,label:x})),c,skill,'You found '+c+'. It has the same name as '+c.toUpperCase()+'.'),
   finish('You found, heard, matched and practised '+c.toUpperCase()+c+'.')
  ]};
 }
 if(id.startsWith('word:')){
  const word=id.slice(5),entry=familyWords[word],l=wordLessons.find(l=>l.word===word);if(!entry&&!l)return null;
  const family=pictureFamilies.find(f=>f.words.includes(word)),other=family?.words.find(w=>w!==word&&w.slice(1)===word.slice(1)),choices=(family?.words||['cat','mat','sat','sit']).filter(w=>w!==word).slice(0,2),skill=id;
  const steps=[{type:'hidden',text:'Who is hiding? Listen for the sounds.',word,skill,meaning:entry?.meaning||''},{type:'blend',text:'Slide along the sounds. Then say the word.',word,skill,meaning:entry?.meaning||''},{type:'build',text:'Build the word to reveal the picture.',word,skill,feedback:'You blended the sounds and built '+word+'.'}];
  if(other)steps.push({type:'change',text:'Change the first sound. Make the picture word.',word:other,from:word,skill:'word:'+other,choices:[other[0],word[0],...['s','h','m','r'].filter(c=>c!==other[0]&&c!==word[0])].slice(0,3).map(c=>({id:c,label:c})),answer:other[0],feedback:'You changed '+word+' to '+other+'.',hint:'The picture is '+other+'. Listen to its first sound.'});
  steps.push(choose('Find the word for this picture.',[...choices,word].map(wordChoice),word,skill,'You read '+word+'.', 'word:'+word,'Look at '+word+'. Hear each sound and blend.'),read(l?.sentence||word,'word:'+word,entry?.meaning||'',l?'text:'+l.sentence:'word:'+word),finish('You heard sounds, blended and built a word.'));
  return{id,section:'words',title:'Find the hidden picture',steps,reread:l?{kind:'stage',page:'word',id:l.id}:family?{kind:'family',page:'board',family:family.id}:null};
 }
 if(id.startsWith('story:')){
  const s=[...stories,...valuesStories].find(s=>s.id===id.slice(6));if(!s)return null;
  const vocabulary=s.kind==='values'?s.vocabulary:[...new Set([...s.helpers,...s.newWords].map(w=>w.toLowerCase()))].map(word=>({...storyWords.get(word),example:s.sentences.find(t=>new RegExp('\\b'+word+'\\b','i').test(t))||s.sentences[0]}));
  const prefix=s.kind==='values'?'value:':'story:',q=comprehension.find(q=>q.storyId===s.id),steps=[{type:'predict',text:'What do you think will happen? Choose a picture. We will read to find out.',story:s.id,choices:[...new Set([0,Math.floor(s.sentences.length/2),s.sentences.length-1])].map(i=>({id:String(i),label:'A story idea',scene:prefix+s.id+':'+i}))}];
  steps.unshift(...vocabulary.filter(v=>v?.meaning).map(v=>({type:'read',text:v.word,word:v.word,meaning:v.meaning,example:v.example,scene:v.kind==='object'?'valueobject:'+v.object:v.kind==='action'?prefix+s.id+':'+v.line:'',audio:(s.kind==='values'?'value-word:':'word:')+v.word,vocabulary:true})));
  s.sentences.forEach((text,i)=>{steps.push(read(text,prefix+s.id+':'+i));
   const match=text.toLowerCase().match(/\b(cat|hat|rat|ball|book|pen)\b.*\bon\b.*\b(mat|cat|table)\b/);
   if(match&&match[1]!==match[2])steps.push({type:'place',text:'Put the '+match[1]+' on the '+match[2]+'.',object:match[1],target:match[2],relation:'on',scene:prefix+s.id+':'+i,skill:'story:'+s.id,audio:'text:'+text,feedback:'The '+match[1]+' is on the '+match[2]+'.'});
  });
  if(q)steps.push(choose(q.prompt,q.choices.map(w=>({id:w,label:w,word:familyWords[w]||['cat','pig','hen','ball','cup','hat','bun','apple','bird','ant','truck','bike','towel','flower','pencil','box'].includes(w)?w:null})),q.answer,q.id,q.evidence,prefix+s.id+':'+q.line,'Remember: '+q.evidence));
  steps.push({type:'order',text:'Put the story pictures in order: first, next, last.',order:[...new Set([0,Math.floor(s.sentences.length/2),s.sentences.length-1])].map(String),choices:[...new Set([s.sentences.length-1,0,Math.floor(s.sentences.length/2)])].map(i=>({id:String(i),label:s.sentences[i],scene:prefix+s.id+':'+i})),skill:'story:'+s.id,feedback:'You remembered what happened first, next and last.'});
  steps.push({type:'paragraph',text:s.sentences.join(' '),story:s.id,scene:prefix+s.id+':'+(s.sentences.length-1),audioParts:s.sentences.map((text,line)=>({key:'text:'+text,line})),meaning:'এবার পুরো গল্পটি পড়ো। চাইলে শুনতে পারো।'},finish('You read and remembered '+s.title+'. Read again whenever you like.'));
  return{id,section:'stories',title:s.title,steps,reread:{kind:'stage',page:s.kind==='values'?'value-story':'story',id:s.id}};
 }
 if(id.startsWith('math:')){
  const l=mathLessons.find(l=>l.id===id.slice(5));if(!l)return null;const q=l.questions[0],skill=mathQuestionId(l,q),steps=l.words.map(w=>{const v=mathWords[w];return{...read(v.text,'math:'+v.scene,v.meaning,'math-word:'+w),word:w,vocabulary:true};});
  const actions={
   'math-flowers':{type:'count',text:'Count the flowers.',scene:'math:flower-three',object:'flower',count:3},
   'math-birds':{type:'count',text:'How many birds are in the tree?',scene:'math:tree-three',object:'bird',count:3},
   'math-total-flowers':{type:'join',text:'Bring the two groups together.',scene:'math:flowers-join',audio:'text:How many flowers are there altogether?',count:5},
   'math-bird-away':{type:'away',text:'Tap one bird. Watch it fly away.',scene:'math:bird-away',audio:'text:One bird flies away.',count:2},
   'math-cake':{type:'share',text:'Share the cake equally among the three brothers.',scene:'math:cake-cut',quantity:3,targets:3,each:1,object:'piece',audio:'text:Share the cake equally among the three brothers.'},
   'math-baskets':{type:'share',text:'Put two apples in each basket.',quantity:6,targets:3,each:2,object:'apple',audio:'text:Two apples in each basket.'},
   'math-shapes':{type:'shape-match',text:'Find a shape in each object.',pairs:['circle','square','triangle'],scene:'math:shapes'},
   'math-ribbon':{type:'align',text:'Start both ribbons at the same line.',scene:'math:ribbons',audio:'text:The blue ribbon is longer.'},
   'math-cups':{type:'pour',text:'Fill the cup.',scene:'math:cup-empty',audio:'text:The cup is full.'},
   'math-shop':{type:'collect',text:'Choose the mango and banana for our basket.',scene:'math:shop',values:['mango','banana'],audio:'text:How much do they cost altogether?'},
   'math-clock':{type:'clock',text:'Set the playtime clock to three o’clock.',scene:'math:clock-three',answer:'3',audio:'text:It is three o’clock.'},
   'math-chart':{type:'chart',text:'Give the bird three stickers and the flower two.',quantity:5,targets:2,goals:[3,2],object:'sticker',audio:'text:The bird has three stickers.'}
  };
  const actionFeedback={'math-flowers':'You counted three flowers.','math-birds':'You counted three birds in the tree.','math-total-flowers':'There are five flowers altogether.','math-bird-away':'Two birds are left.','math-cake':'Each brother gets one piece.','math-baskets':'There are six apples altogether.','math-shapes':'You matched shapes to objects.','math-ribbon':'The blue ribbon is longer.','math-cups':'The cup is full.','math-shop':'The mango and banana cost eight taka altogether.','math-clock':'It is three o’clock.','math-chart':'The bird has three stickers. The flower has two stickers.'};
  steps.push({...actions[l.id],skill,feedback:actionFeedback[l.id]});l.sentences.forEach(s=>steps.push(read(s.text,'math:'+s.scene,s.meaning)));
  l.questions.forEach(q=>steps.push({...choose(q.prompt,q.choices.map(c=>({...c,scene:'math:'+c.scene})),q.answer,mathQuestionId(l,q),q.feedback,'math:'+q.scene,q.hint),meaning:q.meaning,feedbackAudio:'math-feedback:'+mathQuestionId(l,q),hintAudio:'math-hint:'+mathQuestionId(l,q)}));
  const object=l.id==='math-birds'||l.id==='math-bird-away'?'bird':l.id==='math-baskets'?'apple':'flower';
  if(['math-flowers','math-birds','math-total-flowers','math-bird-away','math-baskets'].includes(l.id))steps.push({...choose('A new picture. Count and choose.',[3,1,2].map(n=>countChoice(n,object)),'2',skill,'Two '+object+'s.','math:'+object+'-choice-2','Count each '+object+' once.'),audio:'text:Count and choose.',feedbackAudio:'math-word:two'});
  else if(l.id==='math-cake')steps.push({type:'share',text:'A new cake for two children. Give each two equal pieces.',quantity:4,targets:2,each:2,object:'piece',skill,feedback:'Each child gets two equal pieces.'});
  else if(l.id==='math-shapes')steps.push(choose('Find the circle.', ['triangle','circle','square'].map(shape=>({id:shape,label:shape,scene:'math:'+shape})),'circle',skill,'The circle is round.','math:circle'));
  else if(l.id==='math-ribbon')steps.push({...choose('Which ribbon is longer?', [{id:'red',label:'Red ribbon',swatch:'red'},{id:'blue',label:'Blue ribbon',swatch:'blue'}],'red',skill,'The red ribbon is longer.','ribbons-reversed','Start at the same line. The red ribbon reaches farther.'),audio:null});
  else if(l.id==='math-cups')steps.push(choose('Which cup has more water?',[{id:'A',label:'Cup A'},{id:'B',label:'Cup B'}],'B',skill,'Cup B has more water.','cups-reversed','The cups are the same size. Cup B has the higher water level.'));
  else if(l.id==='math-clock')steps.push({...choose('A new clock. What time is it?',[1,6,3].map(n=>({id:String(n),label:number(n)+' o’clock',scene:'math:clock-'+number(n)})),'6',skill,'It is six o’clock.','math:clock-six'),audio:null});
  else if(l.id==='math-shop')steps.push({...choose('Choose the price of the mango.',[3,5,8].map(n=>({id:String(n),label:'৳'+n,scene:'math:taka-choice-'+n})),'5',skill,'The mango costs five taka.','math:shop-mango'),audio:'text:The mango costs five taka.',feedbackAudio:'text:The mango costs five taka.'});
  else steps.push(choose('Which row has the most stickers?',[{id:'bird',label:'Bird'},{id:'flower',label:'Flower'}],'flower',skill,'The flower row has three. The bird row has two.','chart-reversed','Count both rows. Three is more than two.'));
  steps.push(finish('You explored '+l.title+'. Say the English sentence and show what it means.'));
  return{id,section:'math',title:l.title,steps};
 }
 if(id.startsWith('science:')){
  const l=scienceLessons.find(l=>l.id===id.slice(8));if(!l)return null;const skill=scienceQuestionId(l,l.questions[0]),steps=l.words.map(w=>({...read(w.text,'science:'+w.scene,w.meaning,'science-word:'+w.word),word:w.word,vocabulary:true}));
  const experiments={
   'science-sunlight':{type:'days',text:'Both patches get the same care. Let several days pass, then uncover the grass.',scene:'science:plants-covered',audio:'text:Watch what happens over several days.'},
   'science-rain':{type:'cycle',text:'Explore how water travels. Follow our model step by step.',scene:'science:rain-river',meaning:'জলীয় বাষ্প অদৃশ্য। তীরচিহ্ন তার চলা বোঝায়।',values:['rain-river','water-warm','vapour-rise','cloud-form','rain-falls'],lines:l.sentences.map(s=>s.text)},
   'science-body':{type:'explore',text:'Tap a body helper to find its job.',scene:'science:body-all',values:['brain','heart','lungs','stomach'],scenes:['body-brain','body-heart','body-lungs','body-stomach'],lines:['The brain helps us think and move.','The heart pumps blood.','The lungs help us breathe.','The stomach helps break down food.'],meaning:'মস্তিষ্ক ভাবতে ও নড়াচড়া করতে সাহায্য করে। অন্য অঙ্গগুলোর কাজও দেখো।'},
   'science-senses':{type:'explore',text:'Explore with our senses.',scene:'science:sense-see',values:['eyes','ears','nose','tongue','skin'],scenes:['sense-see','sense-hear','sense-smell','sense-taste','sense-touch'],lines:l.sentences.map(s=>s.text)},
   'science-homes':{type:'habitats',text:'Match these animals to places shown in this story.',values:['bird','frog','cow','deer'],scenes:['home-bird','home-frog','home-cow','home-deer'],targets:['nest','pond','farm','forest'],scene:'science:habitats',meaning:'প্রাণীরা নানা জায়গায় থাকতে পারে। এখানে দেখানো প্রাণী ও জায়গাগুলো মেলাও।'},
   'science-day-night':{type:'earth',text:'Turn Earth. Watch our marked place move into night.',scene:'science:earth-day',audio:'text:The Sun lights our day.'},
   'science-float':{type:'test',text:'Predict, then put the object in the water.',values:['wood','key','ball'],scenes:['float-wood','float-key','float-ball'],answers:['float','sink','float'],scene:'science:water-tray',meaning:'শুকনো কাঠ ও ফাঁপা বল ভাসে। শক্ত ইস্পাতের চাবিটি ডোবে।'},
   'science-push-pull':{type:'push-pull',text:'Move the toy away. Pull the wagon closer.',scene:'science:push-start',values:['push','pull'],scenes:['push-toy','pull-wagon'],lines:['I can push.','I can pull.']},
   'science-magnet':{type:'test',text:'Predict, then test each object with the magnet.',values:['clip','wood','foil'],scenes:['magnet-clip','magnet-wood','magnet-foil'],answers:['pull','stay','stay'],scene:'science:magnet-ready',meaning:'ইস্পাতের ক্লিপ আকৃষ্ট হয়। কাঠ ও অ্যালুমিনিয়ামের ফয়েল হয় না। সব ধাতু চুম্বকে আকৃষ্ট হয় না।'},
   'science-switch':{type:'switch',text:'Turn the lamp on. Then turn it off.',values:['on','off'],scenes:['lamp-on','lamp-off'],lines:['A switch turns the light on and off.'],scene:'science:lamp-off'}
  };
  // Match the existing IDs rather than introduce duplicate science lessons.
  const alias={'science-habitats':'science-homes','science-day':'science-day-night','science-push':'science-push-pull','science-light':'science-switch'};
  const experiment=experiments[l.id]||experiments[alias[l.id]];
  if(!experiment)throw Error('Missing playful experiment '+l.id);
  steps.push({...experiment,skill});l.sentences.forEach(s=>steps.push(read(s.text,'science:'+s.scene,s.meaning)));
  l.questions.forEach(q=>steps.push({...choose(q.prompt,q.choices.map(c=>({...c,scene:'science:'+c.scene})),q.answer,scienceQuestionId(l,q),q.feedback,'science:'+q.scene,q.hint),meaning:q.meaning,feedbackAudio:'science-feedback:'+scienceQuestionId(l,q),hintAudio:'science-hint:'+scienceQuestionId(l,q)}));
  if(l.id==='science-rain')steps.push({type:'order',text:'Put the water-cycle stages in order.',order:['warm','rise','cloud','rain'],choices:[{id:'rain',label:'Rain falls',scene:'science:rain-falls'},{id:'cloud',label:'Vapour cools into cloud drops',scene:'science:cloud-form'},{id:'warm',label:'The Sun warms water',scene:'science:water-warm'},{id:'rise',label:'Invisible vapour rises',scene:'science:vapour-rise'}],skill,feedback:'Warming, rising vapour, cooling cloud drops, then rain.'});
  if(l.id==='science-body')steps.push(choose('Which helper helps us think and move?',['heart','brain','stomach'].map(w=>({id:w,label:w,scene:'science:organ-'+w})),'brain','science:science-body:think-move','The brain helps us think and move.','science:body-brain'));
  if(l.id==='science-senses')for(const [sense,organ,scene]of [['hear','ears','sense-hear'],['smell','nose','sense-smell'],['taste','tongue','sense-taste'],['touch','skin','sense-touch']])steps.push(choose('Which body part helps us '+sense+'?', [organ,...['eyes','ears','nose'].filter(v=>v!==organ)].slice(0,3).map(v=>({id:v,label:v})),organ,'science:science-senses:play-'+sense,'We '+sense+' with our '+organ+'.','science:'+scene));
  if(l.id==='science-body'){const q=playfulReviewItems.find(q=>q.id==='science:science-body:food');steps.push(choose(q.prompt,q.choices.map(c=>({...c,scene:'science:'+c.scene})),q.answer,q.id,q.feedback,'science:'+q.scene,q.hint));}
  if(['science-float','science-magnet'].includes(l.id)){const magnet=l.id==='science-magnet',objects=playfulReviewItems.filter(q=>q.id.startsWith('science:'+l.id+':sort-')).map(q=>({id:q.id.split('-').at(-1),label:q.label.split(' · ')[1],scene:'science:object-'+q.id.split('-').at(-1),answer:q.answer,skill:q.id,feedback:q.feedback}));steps.push({type:'sort',text:magnet?'Sort the objects from our magnet test.':'Sort the objects from our water test.',objects,bins:magnet?[{id:'pull',label:'Pulled closer'},{id:'stay',label:'Stays still'}]:[{id:'float',label:'Floats'},{id:'sink',label:'Sinks'}],feedback:magnet?'A magnet pulls some metal things, not all metals.':'You sorted the objects by what happened in our water test.'});}
  steps.push(read(l.recap.text,'science:'+l.recap.scene,l.recap.meaning),finish('You explored '+l.title+'. Come back and test what you remember.'));
  return{id,section:'science',title:l.title,steps};
 }
 return null;
}
export function playfulIds(){return [...alphabet.map(a=>'letter:'+a.letter),...[...new Set([...Object.keys(familyWords),...wordLessons.map(l=>l.word)])].map(w=>'word:'+w),...[...stories,...valuesStories].map(s=>'story:'+s.id),...mathLessons.map(l=>'math:'+l.id),...scienceLessons.map(l=>'science:'+l.id)];}
