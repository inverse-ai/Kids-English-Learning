// World coordinates keep acceptance areas consistent across screen sizes.
// Front/back use the near/far floor plane and occlusion, never just left/right.
const outline='stroke="#45527d" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
export function moveObject(name){const art={
 ball:'<circle r="22" fill="#ffca36" '+outline+'/><path d="M-22 0H22M0-22Q-17 0 0 22M0-22Q17 0 0 22" stroke="#fff8da" stroke-width="3" fill="none"/>',
 pen:'<path d="M-5-24H5V16L0 25-5 16Z" fill="#487fea" '+outline+'/><path d="M-5-14H5" stroke="#c3e5ff" stroke-width="4"/>',
 book:'<path d="M-28-15H28V19H-28Z" fill="#53c59c" '+outline+'/><path d="M-24 16H27M-20-15V16" stroke="#e8fff0" stroke-width="3"/>',
 'toy car':'<path d="M-29 0-18-12H12L24 0H31V13H-31V0Z" fill="#f16d8d" '+outline+'/><path d="M-16-8H8L17 0H-21Z" fill="#c2f0ff"/><circle cx="-19" cy="14" r="7" fill="#45527d"/><circle cx="20" cy="14" r="7" fill="#45527d"/>',
 balloon:'<ellipse cy="-8" rx="19" ry="24" fill="#b977e6" '+outline+'/><path d="M-4 17H4L0 12ZM0 18Q10 27 0 36" fill="#b977e6" stroke="#45527d" stroke-width="2"/>',
 star:'<path d="m0-27 8 18 20 2-15 14 5 20L0 16-18 27l5-20-15-14 20-2Z" fill="#ffce35" '+outline+'/>',
 boat:'<path d="M-32 6H32L17 23H-18Z" fill="#ee9560" '+outline+'/><path d="M0 7V-28L25 4H0Z" fill="#ffda53" '+outline+'/>'
 };if(art[name])return art[name];return anchorArt(name,0,0,.45);
}
function anchorArt(name,x=340,y=230,scale=1){
 const a={
 box:'<path d="m-80-50 80-33 80 33-80 35Z" fill="#ffd783" '+outline+'/><path d="m-73-49 73-28 73 28-73 29Z" fill="#b37c46"/><path d="M-80-50V45L0 78 80 45V-50L0-15Z" fill="#f8b55e" '+outline+'/><path d="M0-15V78" '+outline+'/>',
 chair:'<path d="M-50-2V68m92-78v66M-9-99V-25m61-62v77" '+outline+'/><path d="m-10-99 64 12v58l-64-12Z" fill="#a58bea" '+outline+'/><path d="m-64-20 70-22 66 25L1 11Z" fill="#a58bea" '+outline+'/><path d="M-64-20V62M1 11V82M72-17V57" '+outline+'/>',
 table:'<path d="m-100-75 100-26 100 26L0-45Z" fill="#5ec9c8" '+outline+'/><path d="M-100-75V65M100-75V65M0-45V83" stroke="#398e9b" stroke-width="9"/>',
 pocket:'<path d="M-70-90H70V60L0 85-70 60Z" fill="#68acee" '+outline+'/><path d="M-65-80H65" stroke="#4266b4" stroke-width="5"/><path d="M-61-74H61V53L0 75-61 53Z" fill="none" stroke="#e4edf3" stroke-width="3" stroke-dasharray="6 4"/>',
 tree:'<path d="M-12-65H12V77H-12Z" fill="#ac784c" '+outline+'/><path d="M-68-40Q-95-95-37-106Q-5-154 37-112Q96-101 69-45Q22-7-68-40Z" fill="#55c287" '+outline+'/>',
 house:'<path d="M-75-35H75V77H-75Z" fill="#ffdc80" '+outline+'/><path d="m-93-35 93-72 93 72Z" fill="#f27c72" '+outline+'/><path d="M-20 15H20V77H-20Z" fill="#b38251" '+outline+'/><path d="M-59-15H-32V14H-59Z" fill="#92dcff" '+outline+'/>',
 garage:'<path d="M-90-80H90V75H-90Z" fill="#ffdc80" '+outline+'/><path d="m-99-80 99-50 99 50Z" fill="#879ee7" '+outline+'/><path d="M-67-56H67V75H-67Z" fill="#657dc0" '+outline+'/><path d="M-54-45H54V72H-54Z" fill="#e6f3ff"/>',
 cloud:'<path d="M-90 17Q-121-33-59-44Q-50-94 0-58Q47-80 63-35Q112-32 92 17Z" fill="#ffffff" '+outline+'/>',
 'low wall':'<path d="M-65-20H65V45H-65Z" fill="#ed9877" '+outline+'/><path d="M-65 0H65M-65 22H65M0-20V0m-30 0v22m60-22v22M0 22V45" stroke="#fff2df" stroke-width="3"/>',
 hoop:'<ellipse cy="-15" rx="27" ry="74" fill="none" stroke="#ef7096" stroke-width="12"/><path d="M0 63V85m-29 0H29" '+outline+'/>',
 tunnel:'<path d="M-68 55V-10Q-68-93 68-10V55H-68Z" fill="#83b8e8" '+outline+'/><path d="M-48 55V-8Q-48-67 48-8V55Z" fill="#466188"/>',
 bridge:'<path d="M-145-10H145V35H-145Z" fill="#dbab64" '+outline+'/><path d="M-145-27H145M-145 5H145M-130-40V35M130-40V35" stroke="#977048" stroke-width="5"/><path d="M-90-10V35M-45-10V35M0-10V35M45-10V35M90-10V35" stroke="#fff0c9" stroke-width="3"/>',
 pond:'<ellipse rx="135" ry="65" fill="#65c8ef" '+outline+'/><path d="M-100 7h34m30-28h47m25 34h59" stroke="#dcfaff" stroke-width="4"/>',
 book:'<path d="M-65-25H65V30H-65Z" fill="#53c59c" '+outline+'/><path d="M-59 24H64M-51-25V24" stroke="#e8fff0" stroke-width="5"/>'
 };if(!a[name])throw Error('Missing move object: '+name);return '<g data-anchor="'+name+'" transform="translate('+x+' '+y+') scale('+scale+')">'+a[name]+'</g>';
}
export function layoutMove(t,movement=false){
 let anchors=[{name:t.anchor,x:340,y:215}],zones=[{label:'Inside',point:[340,195]},{label:'Outside',point:[130,260]},{label:'Above',point:[340,75]}],valid=[0],start=[120,260];
 const pos=t.position;
 if(['on','under','above','below'].includes(pos)){
  zones=t.anchor==='cloud'?[{label:'Above',point:[340,85]},{label:'Below',point:[340,272]},{label:'Beside',point:[130,205]}]:[{label:pos==='above'?'Above':'On',point:pos==='above'?[340,60]:t.anchor==='chair'?[340,185]:[340,151]},{label:pos==='below'?'Below':'Under',point:[340,270]},{label:'Beside',point:[125,260]}];valid=[['under','below'].includes(pos)?1:0];
 }else if(pos==='beside'){
  anchors=[{name:t.anchor,x:340,y:t.anchor==='book'?225:215}];zones=[{label:'Beside, left',point:[210,t.anchor==='book'?225:260]},{label:'Beside, right',point:[475,t.anchor==='book'?225:260]},{label:'Above',point:[340,80]}];valid=[0,1];
  if(t.carried){anchors=[{name:'table',x:340,y:230},{name:'book',x:340,y:142,scale:.45}];zones=[{label:'Beside the book, left',point:[295,142]},{label:'Beside the book, right',point:[385,142]},{label:'Under the table',point:[340,278]}];}
 }else if(['in front of','behind'].includes(pos)){
  zones=[{label:'In front',point:[320,310]},{label:'Behind',point:[400,150]},{label:'Beside',point:[160,240]}];valid=[pos==='behind'?1:0];
 }else if(pos==='between'){
  const pair=t.anchor==='two boxes'?['box','box']:t.anchor==='two books'?['book','book']:['chair','table'];anchors=pair.map((name,i)=>({name,x:i===0?205:455,y:225,scale:name==='table'?.75:.72}));zones=[{label:'Middle space',point:[330,260]},{label:'Outside, left',point:[90,260]},{label:'Outside, right',point:[560,260]}];valid=[0];
 }else if(['near','far from'].includes(pos)){
  anchors=[{name:t.anchor,x:455,y:215}];zones=[{label:'Close area',point:[408,288]},{label:'Far area',point:[105,280]},{label:'Middle area',point:[255,280]}];valid=[pos==='near'?0:1];start=zones[pos==='near'?1:0].point;
 }else if(pos==='out of'){valid=[1];start=t.anchor==='pocket'?[340,152]:[340,195];}
 if(t.anchor==='pocket'){zones[0].point=[340,152];}
 if(t.extra)anchors.push({name:t.extra,x:505,y:225,scale:.65});
 let paths=[];
 if(movement){
  if(['into','out of'].includes(pos)){
   const inside=t.anchor==='garage'?[340,247]:[340,195],entry=t.anchor==='garage'?[340,290]:[340,145],outside=t.anchor==='garage'?[120,315]:[120,275];
   const route=t.anchor==='garage'?[outside,[260,315],entry,inside]:[outside,[220,140],[340,110],entry,inside];if(pos==='out of')route.reverse();paths=[{label:pos==='into'?'Into the entrance':'Out of entrance',points:route},{label:'Along outside',points:[route[0],[150,100],[480,100],[480,275]]},{label:'Stop at entrance',points:[route[0],entry]}];
  }else if(pos==='over')paths=[{label:'Over the wall',points:[[115,280],[210,155],[310,110],[415,155],[500,280]]},{label:'Along the floor',points:[[115,280],[500,280]]},{label:'Stop at wall',points:[[115,280],[220,240]]}];
  else if(pos==='through')paths=[{label:'Through the opening',points:[[120,235],[260,235],[340,235],[425,235],[510,235]]},{label:'Above the opening',points:[[120,235],[260,80],[425,80],[510,235]]},{label:'Stop before opening',points:[[120,235],[240,235]]}];
  else if(pos==='across'){const y=t.anchor==='bridge'?230:215;paths=[{label:'Across to finish',points:[[115,y],[240,y],[340,y],[440,y],[555,y]]},{label:'Round outside',points:[[115,y],[200,85],[480,85],[555,y]]},{label:'Stop halfway',points:[[115,y],[340,y]]}];anchors[0].y=t.anchor==='bridge'?220:215;}
  else if(pos==='around'){anchors[0].x=340;anchors[0].y=215;paths=[{label:'Around the tree',points:[[340,330],[235,290],[230,230],[285,190],[395,190],[455,230],[445,290],[340,330]]},{label:'Straight past tree',points:[[340,307],[340,135]]},{label:'Partway around',points:[[340,307],[225,265],[205,190]]}];}
  start=paths[0].points[0];
 }
 return {anchors,zones,valid,start,paths,tolerance:movement?43:43};
}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function acceptsPlacement(layout,point){return layout.valid.some(i=>distance(layout.zones[i].point,point)<=layout.tolerance);}
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return distance(p,[a[0]+u*dx,a[1]+u*dy]);}
export function acceptsRoute(layout,points){
 const expected=layout.paths[0]?.points;if(!expected||points.length<2||distance(points[0],expected[0])>35||distance(points.at(-1),expected.at(-1))>35)return false;
 // Densify user segments so a fast pointer still has a continuous checked path.
 const dense=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(distance(a,b)/8));for(let j=0;j<n;j++)dense.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}dense.push(points.at(-1));
 if(dense.some(p=>Math.min(...expected.slice(1).map((b,i)=>segmentDistance(p,expected[i],b)))>layout.tolerance))return false;
 let cursor=0;for(const cue of expected.slice(1,-1)){const index=dense.findIndex((p,i)=>i>=cursor&&distance(p,cue)<=layout.tolerance);if(index<0)return false;cursor=index;}return true;
}
const line=points=>points.map(p=>p.join(',')).join(' ');
export function moveScene(t,layout,point=layout.start,{movement=false,showRoute=false,interactive=false,path=[]}={}){
 const anchor=layout.anchors.map(a=>anchorArt(a.name,a.x,a.y,a.scale||1)).join('');
 const object='<g id="move-object" transform="translate('+point.join(' ')+')" data-object="'+t.object+'">'+moveObject(t.object)+'<circle r="42" fill="transparent" '+(interactive?'class="move-grab"':'')+'/></g>';
 const zones=movement?'':layout.zones.map((z,i)=>'<g data-zone="'+i+'"><circle cx="'+z.point[0]+'" cy="'+z.point[1]+'" r="34" fill="#f4f7fc" fill-opacity=".65" stroke="#7896b0" stroke-width="2" stroke-dasharray="5 4"/><text x="'+z.point[0]+'" y="'+(z.point[1]+6)+'" text-anchor="middle" font-size="18" fill="#34495f">'+(i+1)+'</text></g>').join('');
 const route=movement&&showRoute?'<polyline points="'+line(layout.paths[0].points)+'" fill="none" stroke="#607f9c" stroke-width="4" stroke-dasharray="7 7"/>':'';
 const flags=movement?'<g fill="#2f5c67" font-size="15"><text x="'+layout.start[0]+'" y="'+(layout.start[1]-43)+'" text-anchor="middle">Start</text><text x="'+layout.paths[0].points.at(-1)[0]+'" y="'+(layout.paths[0].points.at(-1)[1]+43)+'" text-anchor="middle">Finish</text></g>':'';
 const occluded=['in','into','behind'].includes(t.position)||(t.position==='out of'&&point[0]>265);
 const occlusion=occluded?(t.position==='behind'?anchor:t.anchor==='box'?'<path d="M260 165V260L340 293 420 260V165L340 200Z" fill="#f8b55e" '+outline+'/>':t.anchor==='pocket'?'<path d="M270 145H410V275L340 300 270 275Z" fill="#68acee" '+outline+'/>':t.position==='behind'?anchor:''):'';
 return '<svg id="move-scene" class="move-scene" viewBox="0 0 600 360" role="'+(interactive?'group':'img')+'" aria-label="'+t.object+' and '+t.anchor+'"><rect width="600" height="360" rx="18" fill="#e8f7ff"/><path d="M0 145 600 145V360H0Z" fill="#fff0d5"/><path d="M0 360 285 145M600 360 315 145M0 270H600M0 195H600" stroke="#e3cfb2" stroke-width="2"/>'+anchor+zones+route+(path.length?'<polyline points="'+line(path)+'" fill="none" stroke="#c38b42" stroke-width="3"/>':'')+flags+object+'<g pointer-events="none">'+occlusion+'</g></svg>';
}
export function routePicture(points){return '<svg viewBox="0 0 600 360" aria-hidden="true"><polyline points="'+line(points)+'" fill="none" stroke="#476d88" stroke-width="12"/><circle cx="'+points[0][0]+'" cy="'+points[0][1]+'" r="17" fill="#76a995"/><circle cx="'+points.at(-1)[0]+'" cy="'+points.at(-1)[1]+'" r="17" fill="#dab967"/></svg>';}
