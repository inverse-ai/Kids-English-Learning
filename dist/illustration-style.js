// Shared storybook finish. Geometry, teaching labels, counts and hit areas stay
// in the lesson modules; this only gives their vector art a consistent finish.
let sequence=0;
const palette={'#e5f0f4':'#e8f6ff','#f7efdf':'#fff4df','#e5d6c1':'#efddbb','#d6e0c4':'#cee7b1','#eda548':'#f5a33b','#f6b35c':'#ffc269','#d87684':'#eb7795','#b381ae':'#ba8fd0','#568bad':'#579cc8','#e6a7a9':'#f399ac','#edb6b4':'#ffc0c5','#72a6be':'#61afd0','#c76a75':'#e67583','#8eb695':'#79bc8c','#81ae80':'#71b77a','#f0766f':'#ef6b68','#ef9c89':'#f17672','#a58bea':'#a18ae7','#55c287':'#55be85'};
const tint=(hex,amount)=>'#'+hex.slice(1).match(/../g).map(c=>Math.round(parseInt(c,16)*(1-amount)+255*amount).toString(16).padStart(2,'0')).join('');
export function finishIllustration(svg){
 const id='le-art-'+(++sequence),colors=new Map();
 const body=svg.replace(/fill="(#[\da-f]{6})"/gi,(all,raw)=>{
  const color=palette[raw.toLowerCase()]||raw.toLowerCase();
  if(!colors.has(color))colors.set(color,id+'-'+colors.size);
  return 'fill="url(#'+colors.get(color)+')"';
 });
 const defs='<defs>'+[...colors].map(([color,key])=>'<linearGradient id="'+key+'" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="'+tint(color,.2)+'"/><stop offset=".65" stop-color="'+color+'"/><stop offset="1" stop-color="'+tint(color,.03)+'"/></linearGradient>').join('')+'</defs>';
 return body.replace(/<svg\b([^>]*)>/,(_,attrs)=>'<svg'+attrs+' data-art-version="2" stroke-linejoin="round" stroke-linecap="round">'+defs);
}
export function groundShadow(x,y,width){return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+width*.32+'" ry="'+Math.max(3,width*.035)+'" fill="#344c64" opacity=".1"/>';}
