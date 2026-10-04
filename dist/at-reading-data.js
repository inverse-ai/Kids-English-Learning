export const atReviewWords=['cat','mat','hat','rat'];
export const atStory=[
 'I see a cat.',
 'The cat is on a mat.',
 'The cat has a hat.',
 'The hat is on the cat.',
 'A rat is on the mat too.'
];
export const atHelpingWords=[
 {word:'a',example:'a cat',scene:'cat',meaning:'এখানে একটি বিড়ালের কথা বলা হচ্ছে।'},
 {word:'I',example:atStory[0],scene:'cat',meaning:'আমি একটি বিড়াল দেখি।'},
 {word:'see',example:atStory[0],scene:'cat',meaning:'আমি বিড়ালটিকে দেখতে পাচ্ছি।'},
 {word:'the',example:atStory[1],scene:'cat-mat',meaning:'এই ছবির বিড়ালটির কথা বলা হচ্ছে।'},
 {word:'is',example:atStory[1],scene:'cat-mat',meaning:'বিড়ালটি মাদুরের ওপর আছে।'},
 {word:'on',example:atStory[1],scene:'cat-mat',meaning:'বিড়ালটি মাদুরের ওপর বসে আছে।'},
 {word:'has',example:atStory[2],scene:'cat-hat',meaning:'বিড়ালটির একটি টুপি আছে।'},
 {word:'too',example:atStory[4],scene:'complete',meaning:'একটি ইঁদুরও মাদুরটির ওপর আছে।'}
];
export const atInstructions={picture:'Listen. Choose the matching picture.',letter:'Look at the hat. Choose its first letter.',sentence:'Look at the picture. Choose the missing word.',paragraph:'Choose a word for the yellow gap.',praise:'Well done. You did it.',retry:'Look at the picture. Try again.',help:'Let us try the sounds together.'};
export const atHatMeaning='টুপি বিড়ালের মাথায় আছে।';
const question=(id,type,text,scene,choices,answer,word=answer)=>({id,type,text,scene,choices,answer,word});
export const atSteps=[
 ...atHelpingWords.map(h=>({id:'help-'+h.word.toLowerCase(),type:'help',...h})),
 ...atReviewWords.slice(0,3).map(word=>({id:'phrase-'+word,type:'phrase',text:'a '+word,scene:word})),
 ...atStory.map((text,line)=>({id:'sentence-'+line,type:'sentence',text,scene:['cat','cat-mat','cat-mat-hat','cat-hat','complete'][line],line})),
 question('blank-cat','blank','I see a ___.','cat',['cat','mat','hat'],'cat'),
 question('blank-mat','blank','The cat is on a ___.','cat-mat',['mat','hat','rat'],'mat'),
 question('blank-hat','blank','The ___ is on the cat.','cat-hat',['hat','mat','rat'],'hat'),
 question('paragraph-mat','paragraph-blank','The cat is on a ___.','complete',['mat','hat','rat'],'mat'),
 question('paragraph-hat','paragraph-blank','The ___ is on the cat.','complete',['hat','mat','rat'],'hat'),
 {id:'paragraph-read',type:'paragraph',scene:'complete'},
 question('play-picture','picture','Which picture do you hear?',null,['cat','mat','hat'],'cat'),
 question('play-letter','letter','_at','hat',['h','c','m'],'h','hat'),
 question('play-sentence','play-blank','The cat has a ___.','cat-hat',['hat','cat','mat'],'hat'),
 {id:'finish',type:'finish'}
];
export const isAtQuestion=step=>Array.isArray(step?.choices);
export const atAudioSpecs=[
 ...[...new Set([...atHelpingWords.map(h=>h.example),...atSteps.filter(s=>s.type==='phrase').map(s=>s.text),...atStory])].map(text=>({key:'text:'+text,text,voice:'en-GB-SoniaNeural',rate:'-12%'})),
 ...Object.entries(atInstructions).map(([key,text])=>({key:'at-say:'+key,text,voice:'en-GB-SoniaNeural',rate:'-12%'})),
 ...atHelpingWords.map(h=>({key:'at-meaning:'+h.word.toLowerCase(),text:h.meaning,voice:'bn-BD-NabanitaNeural',rate:'-8%'})),
 {key:'at-meaning:hat-on-cat',text:atHatMeaning,voice:'bn-BD-NabanitaNeural',rate:'-8%'}
];
export function normalizeAtReading(raw){
 const result={started:false,step:0,completed:[],answers:{},wordsNeedingPractice:[],star:false,review:null,meaningOpen:false};
 const ids=atSteps.map(s=>s.id),bounded=value=>Number.isInteger(value)?Math.max(0,Math.min(100,value)):0;
 result.step=Number.isInteger(raw?.step)&&raw.step>=0&&raw.step<atSteps.length?raw.step:0;
 result.completed=[...new Set((Array.isArray(raw?.completed)?raw.completed:[]).filter(id=>ids.includes(id)&&id!=='finish'))];
 for(const step of atSteps.filter(isAtQuestion)){
  const value=raw?.answers?.[step.id];if(!value||typeof value!=='object')continue;
  const firstChoice=step.choices.includes(value.firstChoice)?value.firstChoice:null,choice=step.choices.includes(value.choice)?value.choice:null;
  const attempts=bounded(value.attempts),incorrect=Math.min(attempts,bounded(value.incorrect)),correct=choice===step.answer,assisted=value.assisted===true||incorrect>0;
  const assistedAttempts=Math.min(attempts,Number.isInteger(value.assistedAttempts)?bounded(value.assistedAttempts):assisted?Math.max(0,attempts-1):0);
  result.answers[step.id]={firstChoice,firstAttemptCorrect:firstChoice===null?null:firstChoice===step.answer,attempts,incorrect,assistedAttempts,choice,correct,assisted,demonstrated:assisted&&value.demonstrated===true,helpOpen:!correct&&incorrect>=2&&value.helpOpen===true,easier:assisted&&value.easier===true};
  if(!correct)result.completed=result.completed.filter(id=>id!==step.id);
 }
 result.wordsNeedingPractice=[...new Set((Array.isArray(raw?.wordsNeedingPractice)?raw.wordsNeedingPractice:[]).filter(word=>atReviewWords.includes(word)))];
 result.started=raw?.started===true||result.step>0||result.completed.length>0;
 result.star=raw?.star===true&&['play-picture','play-letter','play-sentence'].every(id=>result.answers[id]?.correct)&&result.completed.includes('paragraph-read');
 result.review=Number.isInteger(raw?.review)&&raw.review>=0&&raw.review<atReviewWords.length?raw.review:null;
 result.meaningOpen=raw?.meaningOpen===true;
 return result;
}
