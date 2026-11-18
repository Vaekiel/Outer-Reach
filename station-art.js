import {hubSprite} from './hub-art.js';
import {industrialSprite} from './industrial-art.js';
// Silhouettes top-down 2D inspirées de la charte Outer Reach : masses industrielles,
// modules lisibles, éclairage cuivre/cyan et détails d'échelle. Aucun lissage.
export const stationSizes={hub:416,refinery:288,station:160};
export function stationStyle(p){
 const category=p.category||(p.id==='hub'?'hub':p.id==='outpost'?'refinery':'station');
 const seed=[...(p.name||p.id||'')].reduce((n,c)=>n+c.codePointAt(0),0);
 return {category,variant:Number.isInteger(p.variant)?((p.variant%4)+4)%4:seed%4,size:stationSizes[category]||160};
}
const cache=new Map();
export function stationSprite(p){
 const {category,variant:v}=stationStyle(p),key=category+v;
 if(category==='hub'){const sprite=hubSprite(v);if(sprite)return sprite;}
 const industrial=industrialSprite(category,v);if(industrial)return industrial;
 if(cache.has(key))return cache.get(key);
 const tile=document.createElement('canvas');tile.width=tile.height=32;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 const trim=['#d6a35e','#7fc9cc','#b19ac9','#9aba8e'][v];
 const hull='#263744',dark='#0d1720',mid='#4d626c',light='#9eaaa7',window='#9ae1dc',rust='#8d5e3d';
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const module=(x,y,w,h,accent=trim)=>{rect(x,y,w,h,dark);if(w>2&&h>2)rect(x+1,y+1,w-2,h-2,hull);if(w>5&&h>4)rect(x+2,y+1,w-4,1,light);if(h>3)rect(x+1,y+h-2,Math.max(1,w-2),1,accent);};
 const lamps=(pts)=>{for(const [x,y] of pts){rect(x,y,1,1,window);}};
 if(category==='hub'){
  rect(5,5,22,22,dark);rect(7,7,18,18,mid);rect(10,10,12,12,dark);rect(12,12,8,8,hull);
  for(const [x,y,w,h] of [[13,0,6,11],[13,21,6,11],[0,13,11,6],[21,13,11,6]])module(x,y,w,h);
  for(const [x,y,w,h] of [[3,10,5,3],[24,10,5,3],[3,20,5,3],[24,20,5,3]])module(x,y,w,h,'#c77e49');
  rect(14,14,4,4,trim);rect(15,15,2,2,'#e8f6da');lamps([[9,7],[12,7],[20,7],[23,7],[7,9],[7,12],[24,20],[24,23],[9,24],[12,24],[20,24],[23,24]]);
 }else if(category==='refinery'){
  module(13,2,6,28,'#d48a43');module(5,12,22,7,'#d48a43');
  for(const x of [2,25]){module(x,7,5,8,'#9e7449');module(x,20,5,8,'#9e7449');rect(x+1,4,3,2,rust);rect(x+1,3,3,1,'#d6a35e');}
  rect(11,13,10,5,'#351c13');rect(13,14,6,3,'#dc6f32');rect(14,15,4,1,'#ffd079');
  for(let x=4;x<29;x+=4)rect(x,10,2,1,mid);lamps([[8,21],[11,21],[20,21],[23,21]]);
 }else{
  if(v%2===0){module(12,3,8,26);module(3,12,26,8);module(1,14,5,5);module(26,14,5,5);}else{module(7,7,18,18);module(13,1,6,9);module(13,22,6,9);module(1,13,9,6);module(22,13,9,6);}
  rect(14,14,4,4,dark);rect(15,15,2,2,trim);lamps([[9,10],[12,10],[20,10],[23,10],[9,21],[12,21],[20,21],[23,21]]);
 }
 cache.set(key,tile);return tile;
}
export function drawStation(c,p,x,y,scale=1,time=0){
 const {category,variant,size}=stationStyle(p),n=Math.max(1,Math.round(size*scale)),unit=n/32;
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x),Math.round(y));
 c.drawImage(stationSprite(p),-Math.floor(n/2),-Math.floor(n/2),n,n);
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x*unit),Math.round(y*unit),Math.max(1,Math.round(w*unit)),Math.max(1,Math.round(h*unit)));};
 if(industrialSprite(category,variant)){
  // Voyant discret sur un module existant, sans masquer les détails du sprite.
  const lights=category==='refinery'?[[0,-.05],[-.29,.02],[0,.07],[-.13,.06]]:[[0,-.26],[0,-.23],[-.27,-.12],[0,-.25]];
  const [lx,ly]=lights[variant];
  c.fillStyle=Math.floor(time*2+variant)%4===0?'#d9ffe4':'#426b69';
  c.fillRect(Math.round(lx*n),Math.round(ly*n),Math.max(1,Math.round(n/160)),Math.max(1,Math.round(n/160)));
  c.restore();return;
 }
 if(category==='hub'&&hubSprite(variant)){
  // Balise fine sur la tour supérieure ; conserver la silhouette détaillée.
  c.fillStyle=Math.floor(time*2+variant)%4===0?'#d9ffe4':'#426b69';
  c.fillRect(0,Math.round(-n*(variant===2?.32:.39)),Math.max(1,Math.round(n/160)),Math.max(1,Math.round(n/160)));
  c.restore();return;
 }
 if(category==='refinery'){
  for(let i=0;i<7;i++){const age=(time*.24+i/7)%1;c.globalAlpha=(1-age)*.26;rect((i%2?8:-9)+Math.sin(age*5+variant),-12-age*10,1+age*2,1+age*2,'#9faeb2');}
 }else{
  const lit=Math.floor(time*2+variant)%4===0;rect(-1,-16,2,2,lit?'#d9ffe4':'#426b69');
  if(category==='hub'){rect(14,-1,2,2,lit?'#ffd27a':'#70583a');rect(-16,-1,2,2,lit?'#ffd27a':'#70583a');}
 }
 c.restore();
}
