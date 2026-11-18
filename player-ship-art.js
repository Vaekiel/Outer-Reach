// Sprites joueurs Exploration / Combat / Transport.
// Atlas 3 x 3, 64 px par cellule, issu directement de la planche validée du 13/10/2026.
const ids=[
 ['aiguille','balise','axiome'],
 ['vigie','pointe','rempart'],
 ['courrier','convoyeur','bastion']
];
const positions=new Map();
for(let row=0;row<ids.length;row++)for(let col=0;col<ids[row].length;col++)positions.set(ids[row][col],[col,row]);

export const playerShipLengths={aiguille:100,balise:125,axiome:165,vigie:100,pointe:135,rempart:170,courrier:105,convoyeur:145,bastion:175};

const atlas=new Image();
const cache=new Map();
export const playerShipsReady=new Promise(resolve=>{
 atlas.onload=()=>resolve(true);
 atlas.onerror=()=>resolve(false);
});
atlas.src=new URL('./assets/player-ships-atlas.png',import.meta.url).href;

function sourceSprite(id){
 const pos=positions.get(id);
 if(!pos||!atlas.complete||!atlas.naturalWidth)return null;
 const key=id+':src';
 if(cache.has(key))return cache.get(key);
 const tile=document.createElement('canvas');
 tile.width=tile.height=64;
 const c=tile.getContext('2d');
 c.imageSmoothingEnabled=false;
 c.drawImage(atlas,pos[0]*64,pos[1]*64,64,64,0,0,64,64);
 cache.set(key,tile);
 return tile;
}
export function playerShipSprite(id,headingRight=true){
 const key=id+':'+(headingRight?1:0);
 if(cache.has(key))return cache.get(key);
 const source=sourceSprite(id);
 if(!source)return null;
 if(!headingRight){cache.set(key,source);return source;}
 const tile=document.createElement('canvas');
 tile.width=tile.height=64;
 const c=tile.getContext('2d');
 c.imageSmoothingEnabled=false;
 c.translate(32,32);
 c.rotate(Math.PI/2);
 c.drawImage(source,-32,-32);
 cache.set(key,tile);
 return tile;
}
export function paintPlayerShipPortrait(canvas,id){
 const paint=()=>{
  const c=canvas.getContext('2d'),tile=playerShipSprite(id,false);
  c.clearRect(0,0,canvas.width,canvas.height);
  c.imageSmoothingEnabled=false;
  if(tile)c.drawImage(tile,0,0,canvas.width,canvas.height);
 };
 paint();
 playerShipsReady.then(ok=>{if(ok)paint();});
}
