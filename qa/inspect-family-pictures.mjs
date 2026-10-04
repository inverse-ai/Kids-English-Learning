import {chromium} from '@playwright/test';
import {familyWords} from '../dist/family-data.js';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}});
 await page.goto('http://localhost:4174/');
 await page.evaluate(words=>{
  const main=document.querySelector('#main');main.replaceChildren();
  const grid=document.createElement('div');grid.style.display='grid';grid.style.gridTemplateColumns='repeat(6,1fr)';grid.style.gap='14px';
  for(const word of words){
   const card=document.createElement('div');card.style.background='white';card.style.padding='8px';card.style.textAlign='center';
   const picture=document.createElement('div');picture.className='family-picture picture-'+word;
   const label=document.createElement('p');label.textContent=word;card.append(picture,label);grid.append(card);
  }
  main.append(grid);
 },Object.keys(familyWords));
 await page.screenshot({path:'qa/all-family-pictures.png',fullPage:true});
}finally{await browser.close();}
