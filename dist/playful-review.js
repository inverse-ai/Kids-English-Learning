// Additional observed concepts use their own review IDs. A missed brain question
// must not be reported as missed lungs, and predictions are never scored.
const q=(id,label,prompt,scene,answer,choices,feedback)=>({id,kind:'science',label,prompt,scene,answer,choices,hint:feedback,feedback});
const organ=w=>({id:w,label:w,scene:'organ-'+w});
export const playfulReviewItems=[
 q('science:science-body:think-move','Body helpers · brain','Which helper helps us think and move?','body-brain','brain',['heart','brain','stomach'].map(organ),'The brain helps us think and move.'),
 q('science:science-body:food','Body helpers · stomach','Which helper helps break down food?','body-stomach','stomach',['lungs','stomach','heart'].map(organ),'The stomach helps break down food.'),
 ...[['hear','ears','sense-hear'],['smell','nose','sense-smell'],['taste','tongue','sense-taste'],['touch','skin','sense-touch']].map(([sense,part,scene])=>q('science:science-senses:play-'+sense,'Five senses · '+sense,'Which body part helps us '+sense+'?',scene,part,[part,...['eyes','ears','nose'].filter(v=>v!==part)].slice(0,3).map(v=>({id:v,label:v,scene:v==='skin'?'sense-hand':'sense-'+v})),'We '+sense+' with our '+part+'.')),
 ...[['wood','Dry wood','float'],['key','Solid steel key','sink'],['ball','Hollow plastic ball','float']].map(([object,label,result])=>q('science:science-float:sort-'+object,'Float or sink · '+label,'Did this '+label.toLowerCase()+' float or sink in our test?','float-'+object,result,[{id:'float',label:'Floats',scene:'float-wood'},{id:'sink',label:'Sinks',scene:'float-key'}],'The '+label.toLowerCase()+' '+(result==='float'?'floats.':'sinks.'))),
 ...[['clip','Steel clip','pull'],['wood','Wood block','stay'],['foil','Aluminium foil','stay']].map(([object,label,result])=>q('science:science-magnet:sort-'+object,'Magnet test · '+label,'Did our magnet pull this '+label.toLowerCase()+'?','magnet-'+object,result,[{id:'pull',label:'Pulled closer',scene:'magnet-clip'},{id:'stay',label:'Stays still',scene:'magnet-foil'}],result==='pull'?'The magnet pulls the steel clip.':'The magnet does not pull this '+label.toLowerCase()+'.'))
];
