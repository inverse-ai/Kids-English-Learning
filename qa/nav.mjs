import {chromium} from 'playwright';
export async function launch(w=390,h=844,opts={}){const b=await chromium.launch({args:opts.autoplay===false?[]:['--autoplay-policy=no-user-gesture-required']});const p=await b.newPage({viewport:{width:w,height:h}});p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});p.on('pageerror',e=>console.log('PAGEERROR',e.message));
await p.addInitScript(()=>{window.__played=[];const o=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__played.push(this.src.replace(location.origin,''));return o.call(this);};});
await p.goto('http://127.0.0.1:4174/');await p.waitForTimeout(500);await p.click('[data-action=opening-stop]').catch(()=>{});return {b,p};}
export const buttons=p=>p.evaluate(()=>[...document.querySelectorAll('#app button')].map(b=>b.dataset.action+'|'+(b.dataset.family||b.dataset.id||b.dataset.round||'')+'|'+b.textContent.trim().slice(0,40)).join('\n'));
