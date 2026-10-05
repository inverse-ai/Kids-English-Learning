import {valueObjectArt} from './value-object-art.js';
import {childArt} from './character-art.js';
export {childArt} from './character-art.js';
import {sceneSymbol} from './story-scenes.js';
import {finishIllustration} from './illustration-style.js';
const ink='#344b63',line='stroke="'+ink+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const group=(art,x=0,y=0,n=1)=>'<g transform="translate('+x+' '+y+') scale('+n+')">'+art+'</g>';
const path=(d,fill,stroke=ink,width=2.4)=>'<path d="'+d+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linecap="round" stroke-linejoin="round"/>';
const circle=(x,y,r,fill)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"/>';
const eyes=(x,y,gap=16)=>circle(x,y,2.8,ink)+circle(x+gap,y,2.8,ink)+circle(x-.6,y-.8,.8,'#ffffff')+circle(x+gap-.6,y-.8,.8,'#ffffff');
const smile=(x,y,w=13)=>path('M'+x+' '+y+'q'+w/2+' 8 '+w+' 0','none',ink,1.8);
const leaf=path('M45 21Q54 0 78 11 72 27 45 21Z','#67b97f')+path('M49 21 68 13','none','#39815c',1.5);
const fruit=(color,shape='M49 27Q25 12 15 37 2 64 30 85q19 13 23 5 25 10 37-17 17-37-6-47-18-9-35 1Z')=>path(shape,color)+path('M49 27q-7-14 3-23','none','#8d6248',4)+leaf+path('M23 38q-8 13-2 26','none','#fff6de',5);
const ball=path('M50 5a45 45 0 1 1-.1 0Z','#69c1e7')+path('M5 50h90M50 5q-32 45 0 90M50 5q32 45 0 90','none','#fff5d6',4)+path('M13 26q13-11 23-11','none','#ffffff',4);
const butterfly=path('M47 42Q12 5 10 31q-8 35 31 32-19 26 3 26l8-23q33 26 35 0 4-21-28-23Q90 12 73 8 53 4 47 42Z','#f5ad66')+path('M50 35v46m-1-45-9-15m11 15 10-15','none',ink,3);

const jar=(color='#ee8197')=>path('M25 24h50v59q0 12-12 12H37q-12 0-12-12Z',color)+path('M22 14h56v14H22Z','#79bace')+path('M29 18h45','none','#d5f3f5',3)+path('M34 42h33v31H34Z','#fff3d8')+path('M31 78v7','none','#fff4e2',4);
const can=path('M18 22q30-14 64 0v58q-32 17-64 0Z','#a9c6d4')+path('M18 23q30 13 64 0M21 42q30 10 58 0m-58 19q30 10 58 0','none','#6c8a9c',2)+path('M29 32v46','none','#eefaff',5)+path('M18 22q30-14 64 0','none',ink,2.4);
const bed=path('M8 34h84v51H8Z','#b97b64')+path('M8 21v72m84-51v51','none','#8f5a47',6)+path('M14 34h28v19H14Z','#fff8e5')+path('M14 55h77v23H14Z','#93bfdc')+path('M47 37h43v20H47Z','#93bfdc');
const umbrella=path('M5 47Q50-22 95 47q-13-12-23 0-12-12-22 0-12-12-23 0-12-12-22 0Z','#f487a3')+path('M50 47v37q0 14-13 7','none','#586b91',5)+path('M50 11q-17 8-23 36m23-36q17 8 23 36','none','#c25481',2.4);
const drawings={
 apple:fruit('#f06b6b'),orange:fruit('#ffa847','M49 24Q6 14 6 58q0 39 43 39 44 0 44-39 0-41-44-34Z'),
 ant:path('M24 48 7 24m19 30L6 62m27 4L15 88m29-39 9-22m-2 34 16 18m6-19 15 15','none','#624750',3)+circle(28,58,12,'#b46d49')+circle(49,53,12,'#b46d49')+circle(72,43,17,'#b46d49')+path('M69 29 68 14m12 15 11-12','none','#624750',2.5)+eyes(72,41,9),
 ball,bat:path('M42 8h16v34H42Z','#d7b282')+path('M42 36h16l11 51q0 8-8 9H39q-8-1-8-9Z','#f6cb83')+path('M43 13h14m-14 8h14m-14 8h14','none','#8e6347',3)+path('M40 51 37 83','none','#ffedd0',4),
 duck:path('M10 60q-5 22 29 28 34 3 43-24L64 48 22 54Z','#ffd365')+circle(66,34,20,'#ffde77')+path('m82 33 16 5-16 7','#f49b43')+circle(70,30,3,ink)+path('M27 63q15-14 32 1-9 17-30 12Z','#efb94e')+path('M15 90q19 8 37 0t38 0','none','#77c4da',3),
 egg:path('M50 5C21 5 7 44 14 70q6 25 36 26 30-1 36-26C93 44 79 5 50 5Z','#fff3d7')+path('M30 24q-12 16-12 34','none','#ffffff',5),
 elephant:path('M17 82V48q0-24 29-23h22q23 4 20 27v30H72V68H48v14H32V67H17Z','#9fa5d4')+path('M11 50q-11-12-5-23','none','#747faa',5)+path('M72 23q29-9 22 36L83 84q-7 10-17 1','none','#9fa5d4',15)+path('M59 29q-27-2-25 25 0 23 24 15 17-17 1-40Z','#c7c0e8')+circle(76,37,3,ink)+path('M78 56q3 10 9 8','#fff8dd',ink,1.5),
 turtle:path('M18 76 9 88m26-7-2 14m33-14 3 13m13-19 12 7','none','#65a588',7)+path('M15 72q-5-42 35-43 39 1 40 43Z','#83be84')+path('M36 43h24l13 20-13 9H36L26 63Z','#a9d496')+path('M38 43 26 30m34 13 13-12M26 63 16 67m57-4 17 6','none','#568963',2)+circle(83,73,13,'#aed09b')+circle(88,69,2.6,'#344b63'),
 fan:path('M45 60h10v27H45Z','#86bbd0')+path('M24 92q24-15 53 0v5H24Z','#649db9')+circle(50,34,30,'#ecf9fc')+path('M50 32q-26-28-29-5 1 20 29 9m1-1q35-14 20-31-17-10-22 30m1 2q-9 36 13 30 18-7-10-30','#79c4c1')+circle(50,34,6,'#ffd065')+path('M20 34h60M50 5v59','none','#7195a9',1.5),
 goat:path('M20 64q18-20 51-4l15 12-12 16H22Z','#eee2c5')+path('M27 82v14m31-14v14m16-14v13','none','#877669',5)+path('M65 24q-11-19-18-17m28 19q13-18 15-12','none','#caa577',5)+path('M56 25q30-10 30 17 0 31-28 19Z','#fff0d6')+path('M60 55 66 73 73 58','#eee2c5')+path('m60 28-18 8 16 7','#fff0d6')+circle(76,37,3,ink)+path('m86 47 7 3','none',ink,2),
 girl:childArt('stand','#af98e0')+path('M29 16q-18-1-12 23l12-5m45-18q18-1 12 23l-12-5','#574338'),
 insect:path('M42 25q-8-14-12-13m24 12q8-14 14-14M23 49 9 40m15 26-14 6m17 12-7 12m58-47 13-9m-14 26 15 6m-18 12 7 12','none',ink,3)+path('M49 28q-37 0-33 35 2 30 34 32 32-2 34-32 4-35-35-35Z','#f07673')+path('M50 29v65','none',ink,3)+circle(50,28,14,'#455b6f')+[26,69].map(x=>circle(x,54,5,ink)+circle(x+4,75,5,ink)).join('')+eyes(44,25,12),
 igloo:path('M4 83Q8 15 50 15t46 68Z','#dcf3fd')+path('M6 84h88','none','#7db9d1',3)+path('M36 84V67q14-22 28 0v17','#6592b0')+path('M12 56h77M25 34h50M50 16v18M31 35v21m39-21v21M17 56v26m65-26v26','none','#8bbccd',2),
 jam:jar()+path('M40 51q5-11 11-5 8-5 11 5-3 17-12 17-8-1-10-17Z','#dc546b')+path('M45 45 51 49 57 45','none','#4c9462',3),
 jug:path('M71 25h11q21 4 10 28-4 12-20 8','none','#5d9bbc',8)+path('M20 14h50v65q0 17-25 17T20 79V31L8 20Z','#a2ddeb')+path('M25 48h39v29q0 13-19 13T25 77Z','#60b9d5')+path('M30 23v17','none','#f4ffff',4),
 key:circle(28,34,22,'#f8ca69')+path('M42 47 86 90m-4-6 8-8m-21-5 8-8','none','#c18d43',11)+circle(28,34,10,'#fff7e7')+path('M14 26q5-9 13-9','none','#fff2c7',4),
 kite:path('M49 5 89 40 53 78 13 42Z','#f5a15e')+path('M49 5 53 78M13 42 89 40','none','#fcf0cf',3)+path('M53 78q19 11 4 18','none',ink,2)+path('M68 82 59 86 68 93 76 85Z','#e8799a'),
 moon:path('M71 6Q36 26 48 54q11 27 40 23Q67 103 33 84 7 65 14 36 22 10 71 6Z','#fbd168')+circle(29,38,5,'#ebba54')+circle(31,66,7,'#ebba54'),
 nose:path('M35 7q-2 35-17 53-7 17 16 21 14-9 19 0 25-4 16-21Q52 37 56 7','#eebd96')+path('M21 69q6-8 14-1m18 0q8-7 14 1','none','#a66e5a',2.5)+path('M43 21v30','none','#ffe2bd',5),
 net:path('M11 18h78v66H11Z','#d5f1f7')+path('M11 18h78v66H11Z','none','#558cb0',5)+[25,40,55,70].map(x=>path('M'+x+' 19v64','none','#98c5cd',1.6)).join('')+[33,48,63].map(y=>path('M12 '+y+'h76','none','#98c5cd',1.6)).join('')+path('M12 83 5 96m83-13 7 13','none','#558cb0',5),
 octopus:path('M23 53Q12 7 51 7t26 46q18 32 11 39-10 9-16-20 2 24-7 26-9 0-11-28 2 30-9 27-9-2-8-27-4 27-15 24-12-5 1-32-26 29-24 12 2-13 24-21Z','#af8bd8')+eyes(38,37,25)+smile(43,50,16)+circle(30,45,4,'#e5a4bf')+circle(70,45,4,'#e5a4bf'),
 queen:childArt('stand','#ad8ed7',true)+path('M28 13 25-4 40 4 50-10 61 4 76-4 72 13Z','#f5c55c')+circle(50,4,3,'#d9759a'),
 quilt:path('M9 8h82v85H9Z','#f4b6ca')+[0,1,2].flatMap(i=>[0,1,2].map(j=>'<rect x="'+(11+j*26)+'" y="'+(10+i*27)+'" width="25" height="26" rx="2" fill="'+['#a6d7df','#f7c768','#c2ade5'][(i+j)%3]+'"/>')).join('')+path('M10 93h80M9 9v84m82-85v85','none','#8c6995',2)+path('M12 95v4m10-4v4m10-4v4m10-4v4m10-4v4m10-4v4m10-4v4m10-4v4','none','#c685a2',2),
 rabbit:path('M33 45Q14 4 30 2q12 0 16 37M50 39Q55-5 69 4q11 12-8 43','#f7ede5')+path('M30 12 41 36m24-21-9 24','none','#e6adc0',4)+path('M30 57q-12 32 21 38 31-3 22-35Z','#f7ede5')+circle(78,75,12,'#fff8f2')+path('M22 49q27-29 49-2 16 28-20 31-34-1-29-29Z','#fff4e6')+eyes(35,53,25)+path('m46 62 6 4 5-4m-5 4v5','none','#a06d74',2.5),
 sock:path('M40 4h42v56Q72 83 32 94 3 99 7 79 9 66 40 48Z','#e787ac')+path('M42 17h37m-36 9h36','none','#ffe9cc',6)+path('M11 76q11-4 18 15m34-26 12 5','none','#b55483',8),
 tent:path('M50 9 98 86H3Z','#f6c86c')+path('M50 10 45 86H3Z','#ef9d59')+path('M50 39 71 86H27Z','#49687c')+path('M50 39 49 87','none','#f5d69b',2)+path('M2 88h97','none','#71a477',4),
 umbrella,up:path('M35 92V44H12L50 6 89 44H65v48Z','#79bace'),
 van:path('M9 30q0-9 12-9h49l22 24v39H9Z','#7ba7dc')+path('M18 29h39v26H18m47-26 20 23H65Z','#d8f3fb')+path('M13 62h77','none','#5281b7',3)+circle(28,84,11,ink)+circle(75,84,11,ink)+circle(28,84,5,'#b6d0db')+circle(75,84,5,'#b6d0db'),
 vest:path('M24 6 43 14h14l19-8 19 24-19 15v49H24V45L6 30Z','#f6cb6b')+path('M43 14 50 28 57 14M50 28v66','none','#a57d43',3)+path('M25 49h51m-51 26h51','none','#f5fae9',8),
 web:[0,45,90,135].map(a=>'<path d="M50 1v98" transform="rotate('+a+' 50 50)" stroke="#7d8eb7" stroke-width="2"/>').join('')+[14,28,43].map(r=>'<path d="M'+(50-r)+' '+(50-r)+'Q50 '+(50-r+8)+' '+(50+r)+' '+(50-r)+'Q'+(50+r-8)+' 50 '+(50+r)+' '+(50+r)+'Q50 '+(50+r-8)+' '+(50-r)+' '+(50+r)+'Q'+(50-r+8)+' 50 '+(50-r)+' '+(50-r)+'Z" fill="none" stroke="#7d8eb7" stroke-width="2"/>').join(''),
 watch:path('M33 3h34v94H33Z','#a18bda')+path('M33 10h34m-34 79h34','none','#8065b5',3)+circle(50,50,30,'#f8d47f')+circle(50,50,23,'#fffaf0')+path('M50 33v17l12 7','none',ink,3)+circle(50,50,3,ink),
 box:path('M5 32 49 13 94 32 49 52Z','#f5c681')+path('M13 32 49 17 85 32 49 47Z','#9f734e')+path('M5 32v49l44 18 45-18V32L49 52Z','#eeb066')+path('M49 52v47','none','#af794f',2.5)+path('M15 48v27','none','#ffda9c',4),
 fox:path('M66 89Q109 61 80 46L66 72Z','#e69a5e')+path('M75 47q29 12 9 32l-8-13Z','#fff4dd')+path('M30 53q-22 35 17 43 33-1 25-40Z','#efa05e')+path('M14 34 19 5 38 25h29L86 6l5 34-31 35H43Z','#f9b266')+path('M18 35 44 62 57 67 83 35 70 65 51 77 32 62Z','#fff4dd')+eyes(35,37,30)+circle(52,61,5,ink),
 'yo-yo':circle(50,56,35,'#ea83a3')+circle(50,56,24,'#fac779')+circle(50,56,12,'#aa8add')+path('M50 55V9q8-11 16-2','none','#667792',3),
 yak:path('M17 41q28-19 63 0l10 28-8 17-10-5-10 8-10-7-12 7-11-8-10 4Z','#996b50')+path('M22 77v18m24-12v12m27-12v12m13-18v18','none','#64483e',7)+path('M20 34Q8 18 18 9m55 25Q88 18 80 8','none','#ddc6a0',6)+path('M15 33q22-18 36 5l-4 34H19Z','#b38b62')+eyes(24,41,16)+path('M15 57h30v14H15Z','#d6b597'),
 zebra:path('M21 49q27-21 55 0l7 28H19Z','#fdf5e8')+path('M26 77v19m20-18v18m25-18v18m12-19v19','none','#657586',6)+path('M62 47 66 11l13 5 15 22-5 12-12-1-3 9','#fdf5e8')+path('M70 15 71 46M31 42l2 36m11-39 1 39m11-36 2 36m11-30 2 28M20 48 8 65','none','#455b6d',5)+circle(79,30,2.5,ink),
 zip:path('M15 7h70v89H15Z','#a6dce2')+path('M48 8v87','none','#526886',12)+[19,29,39,49,59,69,79,89].map(y=>path('M43 '+y+'h10','none','#f6d173',3)).join('')+path('M36 34h27v18H36Z','#d5ddea')+path('M44 49h11v25H44Z','#faf4df')+path('M46 61h7','none','#657b93',2)
};
const waves=path('M2 36q12-15 24 0t24 0t24 0t24 0M2 61q12-15 24 0t24 0t24 0t24 0M2 86q12-15 24 0t24 0t24 0t24 0','none','#5caecc',7);
const mug=path('M72 25h12q23 0 10 29-4 10-19 8','none','#6daac6',8)+path('M12 18h64v53q0 20-32 20T12 71Z','#9bd7df')+path('M13 18q32-10 63 0-29 14-63 0Z','#547b91')+path('M22 34v27','none','#eafcff',5);
const rug=path('M14 15h72v72H14Z','#7bc1cc')+path('M23 25h54v52H23Z','#e2b4d9')+path('M50 31 71 51 50 70 29 51Z','#f7d078')+path('M14 15v-8m9 8V7m9 8V7m9 8V7m9 8V7m9 8V7m9 8V7m9 8V7m9 8V7M14 87v8m9-8v8m9-8v8m9-8v8m9-8v8m9-8v8m9-8v8m9-8v8m9-8v8','none','#6094ac',2);
const seat=path('M23 10h51v47H23Z','#ad99e1')+path('M20 55h61v13H20Z','#9980ce')+path('M25 68v26m49-26v26','none','#685b98',5);
const sitting=group(seat,0,10,.8)+group(childArt('sit'),17,0,.85);
const runner=group(childArt('run','#65bca1'),6,0,.93)+path('M9 39H1m15 13H2m12 12H5','none','#99c5d4',3);
const star=(x,y,n=.2)=>group(path('M50 1 64 32 98 35 73 59 79 95 50 77 21 95 27 59 2 35 36 32Z','#f9cf65'),x,y,n);
Object.assign(drawings,{
 sat:sitting,sit:sitting,seat,run:runner,ran:runner,jog:runner,
 man:childArt('stand','#75aecd',true),mug,rug,bed,cot:bed,
 red:circle(50,50,40,'#ec6570')+path('M27 25q9-8 20-8','none','#ffb4b1',5),
 seed:path('M19 65q1-39 30-40 26 1 31 26 16 15-12 29-32 23-49-15Z','#b7865e')+path('M37 69q8-21 32-29','none','#e0b991',3),
 chin:path('M19 25q-2-22 30-22 31 0 32 23v26Q77 88 50 91 23 88 19 52Z','#ebbc91')+path('M20 27Q15-3 51 3 86-2 80 28L61 17 43 25Z','#735645')+eyes(33,37,32)+smile(38,63,24)+path('M30 77q20 23 40 0','none','#dc7f9b',4),
 neck:path('M31 13h38v39H31Z','#e8b18b')+path('M36 47v27h28V47','#e8b18b')+path('M5 95V84q0-18 30-20 14 16 30 0 30 2 30 20v11Z','#86c2d5')+path('M32 54q18-8 36 0m-36 6q18 10 36 0','none','#de7e9c',3),
 rain:group(sceneSymbol('cloud'),0,0,1)+[20,42,65,87].map((x,i)=>path('M'+x+' '+(71+(i%2)*5)+'l-7 15','none','#58adce',4)).join(''),
 sea:waves,pond:path('M3 61Q5 23 52 27t44 34q-1 26-48 29T3 61Z','#80c9df')+path('M13 55q9-8 18 0t18 0t18 0m-34 17q9-8 18 0t18 0','none','#ddf7fb',3)+path('M86 37V8m-6 29V19','none','#75ab76',3),
 beach:path('M0 53h100v47H0Z','#f8d58e')+group(waves,0,-24,1)+group(umbrella,51,37,.57),
 tail:sceneSymbol('cat')+path('M76 78q31-23 16-56','none','#a27bca',5),
 meal:group(sceneSymbol('plate'),3,10,.96)+group(drawings.apple,40,15,.32)+group(sceneSymbol('bun'),15,22,.39)+path('M8 8v32m-5-32v15m10-15v15M94 8v32','none','#7199aa',3),
 pat:group(sceneSymbol('cat'),2,28,.74)+path('M83 6 66 16H47q-6-6-11-1l-13 9q-4 5 1 7h22q6 7 15 0l24-7Z','#e8b28b')+path('M31 22h15m-17 6h15','none','#b18166',1.5)+path('M24 41h13m-7-6v12','none','#eeac5f',2),
 mat:path('M5 47 73 31 96 65 26 84Z','#73b6cb')+path('M10 56 80 40m-63 28 70-16m-62 27 71-18','none','#f3ca6b',5)+path('M15 60 83 44m-65 28 71-18','none','#d088a7',3)+path('M8 45 2 45m11 4-7 1m13 5-7 1m13 5-7 1m13 5-7 1m10 5-6 2M76 33l5-2m-1 7 5-2m0 9 5-2m0 8 5-2m0 8 5-2','none','#668fa5',2),
 fat:group(sceneSymbol('cat'),-4,0,1.06)+path('M27 61q-12 30 27 32 26-4 27-32','#f5b358')+path('M38 89h16m6 0h14','none','#c88742',5),
 can,tin:can,pan:path('M13 65q25 20 60 0V50H13Z','#6e9fad')+path('M72 54 98 43','none','#537083',10)+path('M13 49q25-18 60 0-24 22-60 0Z','#9fc9d1')+path('M30 45q16-8 29 1','none','#d8edf0',3),
 big:group(ball,1,5,.75)+group(ball,76,60,.24),
 dig:group(childArt('reach','#88bb90'),0,2,.83)+path('M79 15 61 89','none','#a27955',5)+path('M55 74h18l-5 20H59Z','#87aaba')+path('M66 96q7-15 25-8','none','#b69573',5)+circle(78,88,3,'#b69573')+circle(89,83,2,'#b69573'),
 wig:path('M9 83Q3 20 31 11q34-28 56 14 16 20 5 62H69V33Q43 39 24 29v54Z','#ad7755')+path('M18 78V33m11-8q28-14 42-7m7 14 5 46','none','#d0a476',4),
 hop:group(childArt('hop','#a48bd1'),12,-3,.88)+path('M58 97h25m-24-11h25','none','#bfcfd9',2),
 mop:path('M62 5 42 77','none','#78acb9',7)+path('M26 70h31L71 97H14Z','#bccfdf')+path('M30 79 25 96m11-17-2 17m10-17v17m8-17 7 17','none','#6b92ab',2.5),
 top:path('M48 11h8v21h-8Z','#997248')+path('M13 53 52 26 91 53 52 91Z','#ef9b68')+path('M14 53h77M30 66h45','none','#f8e197',5)+path('M15 87q-20-15-6-26m79-29q15 9 8 24','none','#9dc6d3',2),
 pop:circle(41,47,29,'#c0edf2')+path('M70 17 80 8m-7 23 16-3m-13 15 12 10M11 19l9 8','none','#79a6cf',3)+path('M57 15 52 28 68 34 57 48 72 59','none','#fffdf0',4),
 fun:group(childArt('clap','#ee9b6f'),0,20,.65)+group(childArt('hop','#af95d8'),41,8,.65)+group(ball,32,66,.26),
 gun:path('M5 27h70v12h17v17H46l-7 34H18l6-34H5Z','#7ac4d4')+path('M11 16h37v22H11Z','#b79bde')+path('M25 64h13m-15 9h12','none','#527ca1',3)+path('M57 19h18v9H57Z','#ffd164'),
 ten:Array.from({length:10},(_,i)=>star(5+(i%5)*18,21+Math.floor(i/5)*34,.18)).join(''),
 den:path('M3 90Q-1 22 47 15q51-7 51 75Z','#aeaf94')+path('M18 90q0-51 32-51t32 51Z','#687a78')+group(drawings.fox,31,46,.43)+path('M5 88H97','none','#85ac77',4),
 pin:path('M20 27q-7-26 15-24 18 3 4 19L72 67q20 28-4 29-22 0-12-25L21 28','none','#8295ae',5)+path('M19 23 9 41 19 52 27 30Z','#bad1db'),
 fin:group(sceneSymbol('fish'),0,10,1)+path('M28 46 49 18 63 40Z','#f1c66d',ink,3)+path('M50 11V3m-5 6 5 4 5-4','none','#c38a36',2),
 cap:path('M13 64Q7 20 50 16 84 17 84 64Z','#79b8da')+path('M13 64h70l14 18q-25 9-54-4Z','#609fce')+path('M43 20v39','none','#c6e9f5',3)+circle(51,18,4,'#609fce'),
 nap:group(bed,0,14,1)+circle(29,54,12,'#e4b08b')+path('M17 51q-1-19 18-8l3 6-17 4Z','#735645')+path('M22 56q3 3 6 0','none',ink,1.5)+path('M43 47h47v30H43Z','#a698d9')+path('M45 53h42','none','#c6bce9',3),
 fog:group(sceneSymbol('tree'),14,2,.75)+[35,51,68,83].map(y=>path('M3 '+y+'h92','none','#bed4df',9)).join(''),
 hug:group(childArt('hug','#ee8aa1'),3,12,.78)+group(childArt('hug','#7ab9d3'),34,12,.78)+path('M15 51 69 64m13-14L40 65','none','#dfa779',6),
 hit:group(drawings.bat,4,0,.75)+group(ball,60,48,.35)+path('M77 43v-9m10 12 7-6','none','#e5b753',2),
 fit:path('M8 16h32q-8 22 10 22t10-22h31v71H8Z','#88c8cf')+path('M38 6q-8 21 11 21t11-21Z','#f6c870')+path('M50 46v10m-6-7 6 7 6-7','none','#5c9c82',3),
 leg:path('M32 5h34l-2 61 25 16-5 12H18q-8-16 7-26Z','#e4b08b')+path('M25 70h40l24 12-5 12H18q-8-16 7-24Z','#779acb')+path('M20 88h65','none','#d5e7f0',3),
 pot:path('M21 26H7v29h15m55-29h15v29H78','none','#62859e',6)+path('M21 28h56v43q0 22-28 22T21 71Z','#99becd')+path('M17 29h66','none','#5f839d',4)+path('M29 28q20-25 39 0Z','#aacdd7')+path('M45 10h10v9H45Z','#5f839d')+path('M32 48v26','none','#dfedf0',4),
 dot:circle(50,50,29,'#a18bd3')+circle(39,38,6,'#c5b8e8'),
 lamp:path('M46 37h8v52H46Z','#91aebf')+path('M23 91h54v5H23Z','#6b96af')+path('M30 5h40l19 48H12Z','#ffd477')+path('M43 10 31 45','none','#ffedba',4),
 stop:path('M25 5h49L96 27v47L73 96H26L4 74V27Z','#ed8397')+path('M26 59V34q2-8 7-1V21q5-10 9 0V17q5-9 9 0v5q7-9 8 2v22l10-9q9-3 7 6L64 67q-12 17-31 3Z','#fff1dd'),
 step:path('M3 89h32V64h32V37h30','none','#9caec3',10)+path('M32 6h22v43l15 4-3 9H27l-2-9 7-8Z','#e6b18c')+path('M29 47h23l17 6-3 9H27l-2-9Z','#799dd0'),
 stem:path('M52 91V18','none','#519971',8)+path('M48 45Q6 16 12 50q13 22 38 6Z','#8bc28a')+path('M56 67q42-37 33-4-11 20-33 17Z','#8bc28a')+path('M55 16h8','none','#47815c',2),
 chat:group(childArt('stand','#ed8a9c'),4,31,.63)+group(childArt('stand','#83bcd2'),45,31,.63)+path('M5 3h34v20H24l-8 8v-8H5Z','#e6f3fa')+path('M60 3h34v20H84v8l-9-8H60Z','#fff0cd')+circle(16,13,2,'#9db7cf')+circle(27,13,2,'#9db7cf')+circle(71,13,2,'#c6ad75')+circle(83,13,2,'#c6ad75')
});
drawings.bug=drawings.insect;
// No picture labels inside the art: word-building continues to hide answers.
export function wordDrawing(word){if(drawings[word])return drawings[word];if(valueObjectArt[word])return valueObjectArt[word];return sceneSymbol(word);}
export function wordIllustration(word,{className='',description=word}={}){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return finishIllustration('<svg class="word-illustration '+className+'" viewBox="0 0 128 128" role="img" aria-label="'+esc(description)+'"><title>'+esc(description)+'</title><path d="M12 70Q6 19 52 10q54-9 67 41 8 60-39 66-66 11-68-47Z" fill="#f3f8f9"/><ellipse cx="64" cy="113" rx="39" ry="5" fill="#dce9e7"/>'+group(wordDrawing(word),14,12,1)+'</svg>');
}
