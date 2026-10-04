// Original question indices and choices preserve existing saved answers.
const hints={
 'hen-sun':['Look—a hen is in the picture.'], 'pig-pen':['Look—the pig is running.'],
 'red-bag':['Look—a writing pen is sticking out of the bag.'], 'dog-log':['Look—the dog is sitting on a log.'],
 'bun-cup':['Look—Mum has a bun.'], 'cat-rat':['Look—the cat is sitting on a mat.','Look—the cat and rat are running.'],
 'map-tap':['Look—the map is on a mat.'], 'bus-stop':['The story told us the colour: red.'],
 'fish-shop':['The story says fish shop.','Look—a fish is in the tank.'], 'little-ship':['Look—a fish is beside the ship.'],
 'shell-gift':['Look—a shell is in the hand.'], 'shed-cat':['Look—the cat is running towards a shed.'],
 'chip-lunch':['Look—the chip is on a dish.'], 'chin-chat':['The story says Dad has a spot on his chin.'],
 'chick-run':['Look—the little chick is running.'], 'bench-rest':['Look—the children are on a bench.'],
 'rain-snail':['Look—a snail is on the path.','Look—rain is falling outside.'], 'train-trip':['Look—a train is at the station.'],
 'cat-tail':['The story says the cat has a long tail.'], 'rain-paint':['Look—the painted lines show rain.'],
 'sea-seat':['The story says they find a seat by the sea.','Look—a shell is on the beach.'],
 'leaf-tree':['Look—a leaf is falling from the tree.'], 'peach-meal':['Look—they are eating pieces of a peach.'],
 'beach-clean':['The story says they walk on the beach.']
};
const recall=new Set(['bus-stop:0','fish-shop:0','chin-chat:0','cat-tail:0','sea-seat:0','beach-clean:0']);
export function storyGap(s,index){if(!hints[s.id]?.[index])throw Error('Unaudited story gap '+s.id+':'+index);return {...s.blanks[index],hint:hints[s.id][index],task:recall.has(s.id+':'+index)?'recall':'scene'};}
export const gapHintSpecs=Object.values(hints).flat().map(hint=>({key:'story-hint:'+hint,text:hint,voice:'en-GB-SoniaNeural',rate:'-12%'}));

export {emptyStoryAttempt as emptyAttempt,normalizeStoryAttempt as normalizeAttempt} from './stage-data.js';
