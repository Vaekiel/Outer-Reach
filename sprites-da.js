// Planche validée le 14/09/2026 : découpage conservant les proportions.
// Le magenta technique est retiré une seule fois au chargement, jamais en vol.
const atlas = new Image();
const cache = new Map();
let source;
export const spriteRects = {
 scout:[40,140,110,150], interceptor:[195,120,150,170], miner:[385,80,215,230],
 cargo:[628,50,194,277], frigate:[876,27,274,297], cruiser:[1198,3,250,331],
 hub:[16,325,311,316], research:[342,368,195,240], foundry:[546,345,277,280],
 port:[835,325,154,307], outpost:[1015,357,212,272], gate:[1234,347,284,285],
 rock0:[44,643,180,179], rock1:[274,653,216,156], rock2:[545,643,164,180],
 rock3:[773,653,193,155], rock4:[1013,654,185,174], rock5:[1242,633,247,211],
 containers:[67,855,220,135], beacon:[367,810,88,198], wreck:[508,825,270,177],
 module:[793,835,225,165], drone:[1043,866,175,132], satellite:[1252,847,242,143]
};
export const hullSprites={sillon:'miner',veine:'miner',strate:'cargo',aiguille:'scout',balise:'scout',axiome:'frigate',vigie:'interceptor',pointe:'frigate',rempart:'cruiser',courrier:'cargo',convoyeur:'cargo',bastion:'cruiser'};
export const spritesReady = new Promise(resolve=>{
 atlas.onload=()=>{
  source=document.createElement('canvas');source.width=atlas.naturalWidth;source.height=atlas.naturalHeight;
  const c=source.getContext('2d');c.drawImage(atlas,0,0);
  const pixels=c.getImageData(0,0,source.width,source.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4){if(d[i]>d[i+1]*1.5+35&&d[i+2]>d[i+1]*1.5+35)d[i+3]=0;}
  c.putImageData(pixels,0,0);resolve(true);
 };
 atlas.onerror=()=>resolve(false);
});
atlas.src=new URL('./assets/outer-reach-sprites-20260914.png',import.meta.url).href;
export function daSprite(name,headingRight=false){
 if(!source||!spriteRects[name])return null;
 const key=name+headingRight;if(cache.has(key))return cache.get(key);
 const [x,y,w,h]=spriteRects[name],tile=document.createElement('canvas');tile.width=tile.height=Math.max(w,h)+4;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.translate(tile.width/2,tile.height/2);
 if(headingRight)c.rotate(Math.PI/2);
 c.drawImage(source,x,y,w,h,-w/2,-h/2,w,h);cache.set(key,tile);return tile;
}
export function daPortName(p){return p.id==='hub'?'hub':p.kind==='gate'?'gate':p.id==='outpost'||p.category==='refinery'?'foundry':['research','port','outpost'][Math.abs(p.variant||0)%3];}
