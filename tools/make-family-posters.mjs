// Renders the printable word-family posters in dist/pictures/posters from the
// word pictures in dist/pictures/words. Needs: npm i -D @fontsource/fredoka playwright
// Run from the project root: node tools/make-family-posters.mjs
import {chromium} from 'playwright';
import fs from 'fs';
const fams=[['at',['cat','hat','mat','rat','bat','pat','sat','fat']],['an',['can','man','pan','fan','van','ran']],['ig',['pig','big','dig','wig']],['op',['hop','mop','top','pop']],['un',['sun','run','bun','fun','gun']],['en',['hen','pen','ten','den']],['in',['pin','tin','fin','bin']],['ap',['cap','map','tap','nap']],['og',['dog','log','fog','jog']],['ug',['bug','mug','rug','hug']]];
const pal=[['#f6c2d6','#fde8f0','#e0447f'],['#cdbdf3','#f1ecfd','#8a5cd6'],['#b9e09f','#eef8e6','#4d9c2f'],['#a9d2f5','#e9f4fd','#2f86cf'],['#f6d877','#fdf6dc','#d7a30f'],['#a6dfcd','#e6f7f1','#2a9c7b'],['#f7c08f','#fdf0e3','#e07a22'],['#b9c8f7','#edf1fd','#4a63d6']];
const font=n=>'data:font/woff2;base64,'+fs.readFileSync('node_modules/@fontsource/'+n).toString('base64');
const img=w=>'data:image/webp;base64,'+fs.readFileSync('dist/pictures/words/'+w+'.webp').toString('base64');
function html(id,words){
 const n=words.length,W=1024,H=1536,cx=512,cy=655;
 const R=n>6?{bx:200,by:210,cx:385,cy:410,card:[205,225],hub:250,bub:116}:n>4?{bx:200,by:205,cx:372,cy:395,card:[230,240],hub:240,bub:108}:{bx:185,by:200,cx:372,cy:380,card:[240,250],hub:220,bub:100};
 let body='';const lines=[];
 words.forEach((w,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,[f,l,s]=pal[i%pal.length];
  const bx=cx+R.bx*Math.cos(a),by=cy+R.by*Math.sin(a),px=cx+R.cx*Math.cos(a),py=cy+R.cy*Math.sin(a),[cw,ch]=R.card;
  lines.push(`<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="${s}" stroke-width="9" stroke-linecap="round"/>`);
  body+=`<div class="bub" style="width:${R.bub}px;height:${R.bub}px;left:${bx-R.bub/2}px;top:${by-R.bub/2}px;background:${l};border-color:${s}">${w[0]}</div>`;
  body+=`<div class="card" style="left:${px-cw/2}px;top:${py-ch/2}px;width:${cw}px;height:${ch}px;background:${l};border-color:${f}"><img src="${img(w)}"><b><span>${w[0]}</span><i>${w.slice(1)}</i></b></div>`;});
 const blends=words.slice(0,3).map((w,i)=>{const [f,l,s]=pal[(i*3)%pal.length];return `<div class="blend" style="background:${l};border-color:${s}"><p><span>${w[0]}</span><em>+</em><i>${id}</i><em>=</em><span>${w[0]}</span><i>${id}</i></p><img src="${img(w)}"></div>`}).join('');
 return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:F;src:url(${font('fredoka/files/fredoka-latin-600-normal.woff2')});font-weight:600}
@font-face{font-family:F;src:url(${font('fredoka/files/fredoka-latin-700-normal.woff2')});font-weight:700}
*{box-sizing:border-box;margin:0}body{width:${W}px;height:${H}px;background:#fffdf8;font-family:F;position:relative;overflow:hidden}
.title{position:absolute;left:112px;top:28px;width:800px;height:118px;border:7px solid #f08a24;border-radius:40px;background:#fdf1b0;display:flex;align-items:center;justify-content:center;font-size:82px;font-weight:700;color:#1d3a8a;gap:22px}
.title i{font-style:normal;color:#e3202c}
svg{position:absolute;inset:0}
.hub{position:absolute;left:${cx-125}px;top:${cy-125}px;width:250px;height:250px;border-radius:50%;background:#fff7d6;border:12px solid #f08a24;display:flex;align-items:center;justify-content:center;font-size:130px;font-weight:700;color:#e3202c;box-shadow:0 8px 0 #0001}
.bub{position:absolute;width:116px;height:116px;border-radius:50%;border:7px solid;display:flex;align-items:center;justify-content:center;font-size:76px;font-weight:700;color:#141414;padding-bottom:8px}
.card{position:absolute;border:7px solid;border-radius:30px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:10px 8px 6px;box-shadow:0 6px 0 #0001}
.card img{width:82%;height:auto;flex:1;object-fit:contain;min-height:0}
.card b{font-size:62px;line-height:1;font-weight:700;color:#141414}.card b i,.blend i{font-style:normal;color:#e3202c}
.blends{position:absolute;left:24px;right:24px;top:1180px;display:flex;gap:22px}
.blend{flex:1 1 0;min-width:0;height:330px;border:7px solid;border-radius:30px;display:flex;flex-direction:column;align-items:center;padding:16px 8px}
.blend p{font-size:50px;font-weight:700;color:#141414;display:flex;gap:4px;align-items:baseline}.blend em{font-style:normal;color:#2f86cf}
.blend img{flex:1;min-height:0;object-fit:contain;margin-top:8px}
</style></head><body><div class="title"><i>-${id}</i><span>word family</span></div>
<svg width="${W}" height="${H}">${lines.join('')}</svg>${body}<div class="hub" style="width:${R.hub}px;height:${R.hub}px;left:${cx-R.hub/2}px;top:${cy-R.hub/2}px">${id}</div><div class="blends">${blends}</div></body></html>`;}
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1024,height:1536}});
for(const [id,words] of fams){await p.setContent(html(id,words));await p.waitForTimeout(300);await p.screenshot({path:'dist/pictures/posters/'+id+'.jpeg',type:'jpeg',quality:88});}
await b.close();
