export async function showParagraph(page){
 for(let step=0;step<40;step++){
  const phase=await page.locator('.story-player').getAttribute('data-phase');
  if(phase==='paragraph')return;
  if(phase==='helper')await page.locator('[data-action="stages-story-skip"]').click();
  else if(phase==='sentence')await page.locator('[data-action="stages-story-next"]').click();
  else if(phase==='blanks')await page.locator('[data-action="stages-story-previous"]').click();
  else throw Error('Unknown Story phase: '+phase);
 }
 throw Error('Story did not reach its paragraph');
}
