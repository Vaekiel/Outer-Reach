import {ambienceFor,celestialBodies} from './ambience.js';
import {planetSprite} from './planet-art.js';
import {celestialSprite} from './celestial-art.js';
const backgrounds=new Map(),bodies=new Map();
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
function bodySprite(body){
 const key=body.kind+body.seed;if(bodies.has(key))return bodies.get(key);
 const tile=document.createElement('canvas');tile.width=tile.height=96;
 const c=tile.getContext('2d'),base=rgb(body.color),sun=body.kind==='sun',radius=40;
 for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++){
  const rr=(x*x+y*y)/(radius*radius);if(rr>1)continue;
  const z=Math.sqrt(1-rr),noise=Math.sin(x*.43+y*.19+body.seed)*Math.cos(y*.37-x*.13);
  const lit=sun?.82+noise*.12:Math.max(.09,(-x*.45-y*.32)/radius+z*.7);
  const bands=body.kind==='planet'?(Math.sin(y*.32+noise*2+body.seed)>.2?1:.72):1;
  const crater=body.kind==='moon'&&Math.sin(x*.61+body.seed)*Math.cos(y*.57)>.65?.58:1;
  c.fillStyle='rgb('+base.map(v=>Math.round(Math.min(255,v*lit*bands*crater))).join(',')+')';c.fillRect(x+48,y+48,1,1);
 }
 bodies.set(key,tile);return tile;
}
function nebula(id,W,H){
 const key=id+':'+W+':'+H;if(backgrounds.has(key))return backgrounds.get(key);
 const tile=document.createElement('canvas');tile.width=W;tile.height=H;const c=tile.getContext('2d'),p=ambienceFor(id);
 c.fillStyle=p.space;c.fillRect(0,0,W,H);
 // Orée reçoit une signature bleu pétrole / cuivre, dense mais volontairement sombre pour garder les contacts lisibles.
 const isOree=id==='oree';
 for(let band=0;band<(isOree?5:3);band++)for(let x=0;x<W;x+=2){
  const crest=H*(.18+band*.15)+Math.sin(x/W*(4.2+band*.3)+p.seed*.7+band)*H*.12+Math.sin(x*.013+band)*H*.04;
  for(let stripe=0;stripe<(isOree?12:18);stripe++){
   const wave=Math.sin(stripe/(isOree?12:18)*Math.PI);
   c.globalAlpha=wave*(isOree?.07+.025*(band%2):.16+.1*(.5+.5*Math.sin(x*.045+p.seed)));
   c.fillStyle=isOree?(band%3===0?'#173746':band%3===1?'#21304b':'#4a3026'):(band%2?p.veil:p.aurora);
   c.fillRect(x,Math.round(crest+stripe*(isOree?4:3)),2,isOree?2:3);
  }
 }
 if(isOree){
  // Poussière lointaine et micro-étoiles : motifs déterministes, sans texture floue.
  for(let i=0;i<120;i++){
   const x=Math.abs(Math.floor(Math.sin(i*19.71)*99731))%W,y=Math.abs(Math.floor(Math.cos(i*11.37)*73129))%H;
   c.globalAlpha=i%5===0?.32:.14;c.fillStyle=i%7===0?'#d9b071':'#6e93a3';c.fillRect(x,y,i%13===0?2:1,1);
  }
 }
 c.globalAlpha=1;backgrounds.set(key,tile);if(backgrounds.size>4)backgrounds.delete(backgrounds.keys().next().value);return tile;
}
export function drawBackdrop(c,w,W,H){c.drawImage(nebula(w.systemId,W,H),0,0);}
export function drawCelestials(c,w,W,H){
 for(const body of celestialBodies(w.systemId)){
  const size=(body.kind==='planet'||body.celestialTile!==undefined)
   ?Math.round(body.radius*2*Math.min(1,W*.42/220,H*.4/220))
   :Math.round(Math.min(body.radius*2,W*.25,H*.36));
  const x=Math.round(W*body.x-w.ship.x*.009),y=Math.round(H*body.y-w.ship.y*.009);
  if(x+size<0||y+size<0||x-size>W||y-size>H)continue;
  const tile=body.celestialTile!==undefined?celestialSprite(body.celestialTile):body.kind==='planet'?planetSprite(body.tile):bodySprite(body);
  if(tile)c.drawImage(tile,x-Math.floor(size/2),y-Math.floor(size/2),size,size);
 }
}
