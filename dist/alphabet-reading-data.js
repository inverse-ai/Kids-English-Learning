export const readingAlphabet=[...'abcdefghijklmnopqrstuvwxyz'];
export function normalizeAlphabetReading(raw){return{started:raw?.started===true,index:Number.isInteger(raw?.index)&&raw.index>=0&&raw.index<26?raw.index:0,mode:raw?.mode==='single'?'single':'all',heard:[...new Set((Array.isArray(raw?.heard)?raw.heard:[]).filter(c=>readingAlphabet.includes(c)))],finished:raw?.finished===true};}
