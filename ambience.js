// Les profils restent stables entre sessions et partagés par le son et l'image.
const profiles=[
 ['oree','#080f19','#327f73','#4c649b','#8bd6bb',0,'triangle'],
 ['lisiere','#100f20','#665085','#314b6c','#bd98d1',-3,'triangle'],
 ['ganymede','#08151e','#307181','#527d91','#b8d3dc',2,'triangle'],
 ['concorde','#10171a','#667e64','#435e87','#dbc998',5,'triangle'],
 ['sillage','#101322','#46668c','#73516b','#b1bfde',-5,'sine'],
 ['helios','#1a1115','#935238','#875d76','#f3c174',7,'triangle'],
 ['nereide','#07191f','#267c81','#426aa4','#87d5e0',-2,'sine'],
 ['aube','#1a1320','#9b607e','#696393','#ecc1bd',4,'triangle'],
 ['meridian','#131a1b','#537f70','#8b704b','#c4cf9a',-7,'triangle'],
 ['ceres','#1b1115','#815d3c','#68475e','#d69b73',-9,'sine'],
 ['janus','#141323','#586397','#775782','#b8a9e1',1,'sine'],
 ['pallas','#0c181b','#377d74','#78703f','#bdd085',-4,'triangle'],
 ['styx','#09121f','#354877','#3d666b','#82a9d0',-12,'sine'],
 ['temeraire','#1c1017','#8b4153','#74513e','#de8c84',3,'triangle'],
 ['erebe','#100c1b','#473562','#354d66','#a08abd',-10,'sine']
];
export const ambiences=Object.fromEntries(profiles.map(([id,space,aurora,veil,body,transpose,wave],seed)=>[id,{id,space,aurora,veil,body,transpose,wave,seed,tempo:seed===0?1:.88+(seed%7)*.045}]));
export const ambienceFor=id=>ambiences[id]||ambiences.oree;
// Continental, glaciaire, désertique, océanique, volcanique, gazeux.
const planets=[[0,82],[4,55],[1,72],[0,64],[5,110],[2,88],[3,98],[0,58],[5,104],[2,45],[5,92],[0,70],[1,60],[4,78],[4,50]];
export function celestialBodies(id){
 const {seed,body}=ambienceFor(id);
 const [planetTile,planetRadius]=planets[seed];
 const phase=(seed*.381966)%1;
 if(id==='oree'){
  // Tirage déterministe : décor stable à chaque retour, sans modifier la sauvegarde.
  const jitter=n=>(Math.sin((n+71)*127.1)*43758.5453%1)*.025;
  return [
   {kind:'planet',x:.16,y:.23,radius:planetRadius,tile:planetTile,color:body,seed},
   {kind:'moon',x:.72+jitter(0),y:.68+jitter(1),radius:28,celestialTile:0,seed:19},
   {kind:'sun',x:.78+jitter(2),y:.31+jitter(3),radius:34,celestialTile:1,seed:31},
   {kind:'distant-planet',x:.36+jitter(4),y:.34+jitter(5),radius:18,celestialTile:2,seed:47},
   {kind:'distant-planet',x:.28+jitter(6),y:.79+jitter(7),radius:23,celestialTile:3,seed:59}
  ];
 }
 return [
  {kind:'planet',x:.16+phase*.7,y:.23+((seed*.27)%1)*.4,radius:planetRadius,tile:planetTile,color:body,seed},
  {kind:'moon',x:.13+((phase+.47)%1)*.73,y:.7-((seed*.17)%1)*.3,radius:12+seed%3*3,color:['#afc1c4','#c8b8a0','#a4b6a3'][seed%3],seed:seed+19},
  {kind:'sun',x:.12+((phase+.73)%1)*.75,y:.14+((seed*.13)%1)*.63,radius:6+seed%4,color:['#ffe0a0','#a3d8ec','#efb18d'][seed%3],seed:seed+31}
 ];
}
export function musicProfile(id){const p=ambienceFor(id);return {...p,motifShift:p.seed%8};}
