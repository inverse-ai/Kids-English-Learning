import {sceneSymbol} from './story-scenes.js';
const esc=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={cat:'Only a sitting cat.',mat:'Only a mat.',hat:'Only a hat.',rat:'Only a rat.','cat-mat':'A cat sitting on a mat. No hat or rat.','cat-hat':'A hat on the cat’s head. No mat or rat.','cat-mat-hat':'A cat sitting on a mat and wearing a hat. No rat.',complete:'A cat sitting on a mat and wearing a hat, with a rat on the same mat.'};
export function atScene(kind,small=false){
 if(!labels[kind])throw Error('Unknown -at scene: '+kind);
 const objects=[];
 const add=(name,x,y,w,h=w,on='')=>objects.push('<g data-object="'+name+'" '+(on?'data-on="'+on+'" ':'')+'transform="translate('+(x-w/2)+' '+(y-h)+') scale('+w/100+' '+h/100+')">'+sceneSymbol(name)+'</g>');
 const hasMat=['cat-mat','cat-mat-hat','complete'].includes(kind),hasHat=['cat-hat','cat-mat-hat','complete'].includes(kind);
 if(hasMat)add('mat',300,290,440,69);
 if(['cat','cat-mat','cat-hat','cat-mat-hat','complete'].includes(kind)){
  const x=kind==='complete'?250:300,w=kind==='complete'?155:170,y=272;add('cat',x,y,w,w,hasMat?'mat':'');
  if(hasHat)add('hat',x-.06*w,y-w+.36*w,.7*w,.5*w,'cat');
 }
 if(kind==='complete')add('rat',432,275,113,113,'mat');
 if(['hat','mat','rat'].includes(kind))add(kind,300,272,kind==='mat'?350:170,kind==='mat'?90:170);
 return '<svg class="at-scene '+(small?'small':'')+'" viewBox="'+(small?'170 70 260 230':'40 65 520 225')+'" role="img" aria-label="'+esc(labels[kind])+'"><title>'+esc(labels[kind])+'</title><rect width="600" height="300" rx="20" fill="#f7efdf"/><path d="M0 236h600v64H0Z" fill="#e5d6c1"/>'+objects.join('')+'</svg>';
}
