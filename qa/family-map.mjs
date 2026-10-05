// Checks every word-family map: visible without expanding, no overlap, no horizontal scroll, tap audio.
import {launch} from './nav.mjs';
const fams=['at','an','ig','op','un','en','in','ap','og','ug'],widths=(process.env.W||'320,390,1366').split(',').map(Number);let fail=0;
for(const w of widths){const {b,p}=await launch(w,w>1000?900:800);
 await p.click('[data-stage=words]');await p.click('[data-action=stages-build-open]');await p.click('[data-action=stages-families]');
 for(const f of fams){await p.click('[data-action=family-open][data-family='+f+']');await p.waitForTimeout(250);
  const r=await p.evaluate(()=>{const map=document.querySelector('.family-map');if(!map)return {missing:true,overlaps:[]};const box=e=>e.getBoundingClientRect();
   const nodes=[...map.querySelectorAll('.family-map-node')],c=map.querySelector('.family-map-centre'),all=[c,...nodes].map(box);
   let overlaps=[];for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j];const ox=Math.min(a.right,b.right)-Math.max(a.left,b.left),oy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(ox>2&&oy>2)overlaps.push(i+'-'+j+':'+Math.round(ox)+'x'+Math.round(oy));}
   const m=box(map),h1=box(document.querySelector('.family-board h1'));
   const outside=nodes.filter(n=>{const b=box(n);return b.left<m.left-1||b.right>m.right+1||b.top<m.top-1||b.bottom>m.bottom+1}).length;
   return {words:nodes.map(n=>n.dataset.word),overlaps,outside,hidden:!!map.closest('details:not([open])'),small:nodes.filter(n=>{const b=box(n);return b.width<48||b.height<48}).length,cards:document.querySelectorAll('.family-blend-card').length,
    mapTop:Math.round(m.top-h1.bottom),mapW:Math.round(m.width),hscroll:document.documentElement.scrollWidth>innerWidth,poster:!!document.querySelector('.family-poster'),centre:Math.round(box(c).width),node:Math.round(box(nodes[0]).width)+'x'+Math.round(box(nodes[0]).height)};});
  await p.evaluate(()=>window.__played=[]);await p.click('.family-map-centre');await p.waitForTimeout(250);
  await p.locator('.family-map-node').nth(1).click();await p.waitForTimeout(250);
  r.played=await p.evaluate(()=>window.__played);
  const bad=r.missing||r.overlaps.length||r.outside||r.hidden||r.small||r.hscroll||r.poster||(f==='all'?false:r.played.length<2);if(bad)fail++;
  console.log(w,f,bad?'FAIL':'ok',JSON.stringify({words:r.words?.join(','),ov:r.overlaps,out:r.outside,top:r.mapTop,w:r.mapW,node:r.node,c:r.centre,hs:r.hscroll,played:r.played}));
  await p.locator('.family-map').screenshot({path:'qa/out/family-map-'+f+'-'+w+'.png'}).catch(()=>{});
  await p.click('[data-action=family-library]');await p.waitForTimeout(150);}
 await b.close();}
console.log('FAILURES',fail);
