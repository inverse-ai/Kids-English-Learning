// Install a real recitation for the Arabic opening.
// Usage (project root):  node tools/install-opening-recitation.mjs "C:\path\recitation.mp3" "Reciter name"
// The MP3 is copied into dist/audio under its content hash (the only file names the
// server and offline cache accept) and dist/opening-audio-data.js is pointed at it.
// Nothing else changes: the opening text, setting and play-once behaviour stay the same.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const [file,reciter='']=process.argv.slice(2);
if(!file||!existsSync(file)){console.error('Give the path to the recitation MP3.');process.exit(1);}
const data=readFileSync(file);
const mp3=data.slice(0,3).toString()==='ID3'||(data[0]===0xff&&(data[1]&0xe0)===0xe0);
if(!mp3||data.length<10000){console.error('This does not look like an MP3 recording.');process.exit(1);}
const root=fileURLToPath(new URL('..',import.meta.url)),name=createHash('sha256').update(data).digest('hex').slice(0,24)+'.mp3';
writeFileSync(root+'dist/audio/'+name,data);
const path=root+'dist/opening-audio-data.js',{openingAudioSource:old}=await import('file://'+path.replace(/\\/g,'/'));
const next={text:old.text,clip:'/audio/'+name,recitation:true,reciter,previousSyntheticClip:old.recitation?old.previousSyntheticClip:old.clip,humanListeningVerified:false,textReferences:old.textReferences};
writeFileSync(path,'export const openingAudioSource='+JSON.stringify(next)+';\r\n');
console.log('Installed /audio/'+name+'. Bump APP_VERSION in dist/sw.js, then listen to it in the app.');
