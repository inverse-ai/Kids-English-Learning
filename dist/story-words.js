import {supportingWords,stories,wordLessons} from './stage-data.js';

// Short, contextual meanings for the spoken Stories introductions.
const meanings={
 rat:'ইঁদুর',red:'লাল',bag:'ব্যাগ',dog:'কুকুর',log:'কাঠের গুঁড়ি',up:'উপরে',nap:'ছোট ঘুম',mum:'মা',bun:'ছোট রুটি',cup:'কাপ',map:'মানচিত্র',tap:'পানির কল',by:'পাশে',dad:'বাবা',hat:'টুপি',bus:'বাস',stop:'থামা',get:'পাওয়া',big:'বড়',tank:'পানিভরা ট্যাংক',man:'পুরুষ মানুষ',dock:'জাহাজের ঘাট',go:'যাওয়া',hand:'হাত',put:'রাখা',ran:'দৌড়েছিল',shed:'ছোট চালাঘর',hot:'গরম',dish:'থালা',spot:'ছোট দাগ',chick:'মুরগির বাচ্চা',bench:'বেঞ্চ',then:'তারপর',path:'পথ',wait:'অপেক্ষা করা',have:'আছে',lap:'কোল',takes:'নিয়ে যায়',us:'আমাদের',park:'পার্ক',long:'লম্বা',its:'এর',waves:'দুলতে থাকে',as:'যখন',walks:'হাঁটে',starts:'শুরু হয়',fall:'পড়া',runs:'দৌড়ায়',stay:'থাকা',dry:'শুকনো',paint:'রং দিয়ে আঁকা',page:'কাগজের পাতা',puts:'রাখে',painting:'আঁকা ছবি',wall:'দেয়াল',find:'খুঁজে পাওয়া',shell:'ঝিনুকের খোল',beach:'সমুদ্রসৈকত',sits:'বসে',listen:'শোনা',rest:'বিশ্রাম',falls:'পড়ে',from:'থেকে',tree:'গাছ',pick:'কুড়িয়ে নেওয়া',green:'সবুজ',show:'দেখানো',read:'পড়া',about:'সম্পর্কে',trees:'গাছগুলো',peach:'পিচ ফল',plate:'থালা',wash:'ধোয়া',hands:'হাতগুলো',each:'প্রত্যেকে',eat:'খাওয়া',piece:'টুকরো',sweet:'মিষ্টি',snack:'হালকা খাবার',after:'পরে',our:'আমাদের',meal:'খাবার',walk:'হাঁটা',near:'কাছে',bin:'ময়লার ঝুড়ি',clean:'পরিষ্কার',everyone:'সবাই'
};
export const storyWords=new Map();
for(const [word,entry]of Object.entries(supportingWords))storyWords.set(word.toLowerCase(),{word,meaning:entry.meaning});
storyWords.set('too',{word:'too',meaning:'এছাড়াও / ও'});
for(const s of stories)for(const word of s.newWords){const key=word.toLowerCase();if(!storyWords.has(key))storyWords.set(key,{word,meaning:meanings[key]});}

export function storyIntroductions(s,line,learning){
 const allowed=new Set([...s.helpers,...s.newWords].map(w=>w.toLowerCase()));
 const introduced=new Set([...(learning.storyWordsMet||[]),...(learning.playful?.wordsMet||[])]);
 for(const lesson of wordLessons)if(learning.words[lesson.id]?.step>=2||learning.words[lesson.id]?.done)for(const word of lesson.helpers)introduced.add(word.toLowerCase());
 return [...new Set(s.sentences[line].match(/[a-z]+/gi).map(w=>w.toLowerCase()))].filter(w=>allowed.has(w)&&!introduced.has(w)).map(w=>storyWords.get(w));
}
