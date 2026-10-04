import {letters,profiles} from '../dist/curriculum.js';
const texts = new Set(['Hello! Let’s learn English together.']);
for (const [letter,entry] of Object.entries(letters)) {
 texts.add(`The letter ${letter.toUpperCase()}. ${entry.word}.`);
 texts.add(`Find the little letter ${letter.toUpperCase()}.`);
}
for (const lesson of profiles.big.lessons) {
 for (const word of lesson.items) texts.add(word);
 texts.add(lesson.sentence);
}
for (const lesson of profiles.little.lessons) texts.add(lesson.talk[0].replace(' …',''));
process.stdout.write(JSON.stringify([...texts].sort()));
