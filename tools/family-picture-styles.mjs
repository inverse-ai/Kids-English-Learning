import {familyWords} from '../dist/family-data.js';
import {readFileSync,writeFileSync} from 'node:fs';
let css='\n';
for(const [word,p] of Object.entries(familyWords)){
 const column=p.quadrant%p.columns,row=Math.floor(p.quadrant/p.columns);
 const size=(p.columns*100)+'% '+(p.rows*100)+'%';
 const position=(column/(p.columns-1)*100).toFixed(4)+'% '+(row/(p.rows-1)*100).toFixed(4)+'%';
 css+='.picture-'+word+'{background-image:url("'+p.picture+'");background-size:'+size+';background-position:'+position+'}\n';
}
const path='dist/style.css';
const base=readFileSync(path,'utf8').replace(/^\.picture-[a-z]+\{[^\n]*\}\r?\n/gm,'');
writeFileSync(path,base.trimEnd()+'\n'+css);
