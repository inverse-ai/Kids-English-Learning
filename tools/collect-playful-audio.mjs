import {playfulReviewItems} from '../dist/playful-review.js';
import {playfulIds,playfulLesson} from '../dist/playful-data.js';
import {alphabet} from '../dist/stage-data.js';
const specs=new Map();
const add=text=>{if(text&&!/A[‘']udhu|billahi min|shaytan/i.test(text))specs.set('text:'+text,{key:'text:'+text,text,voice:'en-GB-SoniaNeural',rate:'-12%'});};
for(const id of playfulIds())for(const s of playfulLesson(id).steps){add(s.text);add(s.feedback);add(s.hint);add(s.example);if(s.type==='choose'||s.type==='change')add('The answer is '+s.choices.find(c=>c.id===s.answer).label+'. '+s.hint);}
for(const a of alphabet){add('You matched '+a.letter.toUpperCase()+' with '+a.letter+'.');add('You found '+a.letter+'.');}
[
 'You shared the right amount with each place.','Each child gets two equal pieces.','You counted each object once.','You matched shapes to objects.','The circle is round.','The square has four equal sides.','The triangle has three sides.',
 'Both ribbons start at the same line. The blue ribbon is longer.','One bird flew away. Two birds are left.','The cup is full.','Watch what happens over several days.','After several days, the covered grass is pale and weak.',
 'The brain helps us think and move.','The heart pumps blood.','The lungs help us breathe.','The stomach helps break down food.','I can push.','I can pull.','Some things float. Some things sink.','A magnet can pull some metal things.',
 'Move the start of the blue ribbon to the dashed line. Both ribbons must start together.','Push away from the child.','Pull toward the child.','Tap an item, then its place. Or drag it.','Start at the coloured dots. Follow the trail.',
 'Good job!','You followed the letter trail.','You followed the water cycle.','The bird has three stickers. The flower has two stickers.'
].forEach(add);
for(const q of playfulReviewItems){for(const [key,text]of [['text:'+q.prompt,q.prompt],['science-hint:'+q.id,q.hint],['science-feedback:'+q.id,q.feedback]])specs.set(key,{key,text,voice:'en-GB-SoniaNeural',rate:'-12%'});add(q.feedback);}
process.stdout.write(JSON.stringify([...specs.values()]));
