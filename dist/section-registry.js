// Every implemented chapter is available to both profiles at every level.
// Home cards, stage navigation and route validation share this registry.
export const learningSections=Object.freeze([
 {id:'letters',title:'Letters',age:'4+',caption:'Meet letters & sounds'},
 {id:'words',title:'Words',age:'5+',caption:'Spell, build & read'},
 {id:'stories',title:'Stories',age:'6+',caption:'Read little stories'},
 {id:'move',title:'Listen & Move',age:'',caption:'Listen and move objects'},
 {id:'math',title:'English for Math',age:'',caption:'Count, share & explore'},
 {id:'science',title:'English for Science',age:'',caption:'Look, test & discover'}
].map(section=>Object.freeze(section)));
export const isLearningSection=id=>learningSections.some(section=>section.id===id);
