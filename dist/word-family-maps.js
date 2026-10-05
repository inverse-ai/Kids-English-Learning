// Listen-and-look word families: a picture map, "b + all = ball" cards and a
// poster. They have no build/write rounds, because an ending such as -all is one
// sound, not three single letter sounds (a + l + l would teach the wrong sound).
// A word whose picture is null shows a "picture coming soon" card.
export const mapFamilies = [
 // poster: the supplied chart, shown exactly as it is; spots are its tap areas (% of width/height).
 {id:'all',colour:'gold',words:['ball','call','hall','mall','small'],poster:'/pictures/posters/all.png',
  spots:{centre:[36.6,52.1,26.9,17.3],ball:[34.2,12.7,31.3,25.4],call:[2.4,31.9,30.3,27.3],hall:[67.4,31.9,30.3,27.3],mall:[2.4,70.6,43.9,26.7],small:[53.7,70.6,43.9,26.7]},info:{
  ball:{meaning:'বল',description:'a colourful beach ball',picture:null},
  call:{meaning:'ফোন করা, ডাকা',description:'a boy calling on a telephone',picture:null},
  hall:{meaning:'হলঘর, বারান্দা',description:'a long school hallway',picture:null},
  mall:{meaning:'শপিং মল',description:'a shopping mall building',picture:null},
  small:{meaning:'ছোট',description:'a small apple beside a big apple',picture:null}
 }}
];
export const mapFamilyOf = id => mapFamilies.find(f => f.id === id);
