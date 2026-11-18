import {drawSite} from './site-art.js';
import {drawGate} from './gate-art.js';
import {points} from './universe.js';
import {drawStation} from './station-art.js';
const expeditionAtlas=new Image();
expeditionAtlas.src=new URL('./assets/expedition-sites.png',import.meta.url).href;
// Porte et sites utilisent une planche pixel-art dédiée. Les avant-postes industriels
// sont dessinés nativement en 32×32 puis agrandis uniquement par facteurs entiers.
export function drawContact(c,p,x,y,scale=1,time=0){
 if(p.kind==='gate'&&drawGate(c,p,x,y,scale))return;
 if(p.kind==='archive'||p.kind==='wreck'){drawSite(c,p,x,y,scale);return;}
 if(p.kind==='port'){drawStation(c,p,x,y,scale,time);return;}
 if(p.kind!=='port'&&expeditionAtlas.complete&&expeditionAtlas.naturalWidth){
  const index=p.kind==='gate'?0:p.kind==='archive'?1:2,size=Math.max(1,Math.round((p.kind==='gate'?150:112)*scale));
  c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x),Math.round(y));
  c.drawImage(expeditionAtlas,index*128,0,128,128,-Math.floor(size/2),-Math.floor(size/2),size,size);c.restore();return;
 }
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 if(p.kind==='gate'){
  rect(-21,-25,8,50,'#415d70');rect(13,-25,8,50,'#415d70');rect(-15,-29,30,7,'#7f9ea6');rect(-15,22,30,7,'#7f9ea6');
  for(const side of [-1,1]){rect(side<0?-19:15,-19,4,38,'#adbaa8');for(let j=-18;j<20;j+=9)rect(side<0?-13:10,j,3,4,'#80d0e0');}
  rect(-6,-27,12,3,'#dbb578');rect(-6,24,12,3,'#dbb578');
 }else if(p.kind==='port'){
  rect(-25,-5,50,10,'#7b7770');rect(-10,-15,20,30,'#b8b19b');rect(-7,-12,14,24,'#596b74');
  for(const side of [-1,1]){rect(side<0?-29:18,-15,11,30,'#455c70');for(let j=-12;j<14;j+=6)rect(side<0?-27:20,j,7,3,'#93b5bc');}
  rect(-3,-22,6,8,'#a7aba2');rect(-1,-29,2,8,'#d4c7a3');rect(-4,-3,8,6,'#65cfa0');
 }else if(p.kind==='archive'){
  rect(-8,-10,16,22,'#708f9e');rect(-5,-7,10,16,'#c4c5ad');rect(-2,-18,4,8,'#b3bba9');rect(-12,-18,24,3,'#aabbad');
  rect(-20,-6,10,14,'#395b7b');rect(10,-6,10,14,'#395b7b');rect(-3,-4,6,3,'#82e0d5');rect(-3,2,6,3,'#82e0d5');
 }else{
  rect(-20,-4,15,10,'#6a6a65');rect(-9,-10,20,21,'#aa9070');rect(-5,-6,12,13,'#454f58');rect(11,1,10,5,'#8a7c6b');rect(-15,9,7,4,'#aa9070');rect(13,-10,5,5,'#6d7270');rect(-2,-4,4,3,'#dfa865');
 }
 c.restore();
}
export function renderSector(c,r,w,X,Y,z){
 for(const p of points(w).filter(p=>p.available!==false)){
  if(c&&p.id!=='hub')drawContact(c,p,X(p.x),Y(p.y),z,w.time);
  if(c&&w.target===p.id){c.fillStyle='#e6c88f';c.font='7px "Oree Pixel",monospace';c.fillText(p.name,X(p.x)+18,Y(p.y)-20);}
  const dx=(p.x-w.ship.x)*.037,dy=(p.y-w.ship.y)*.037;
  if(r&&Math.hypot(dx,dy)<=75){r.strokeStyle=p.kind==='port'?'#63dc91':p.kind==='gate'?'#f4f5f2':'#b388ff';r.strokeRect(Math.round(137+dx),Math.round(77+dy),6,6);}
 }
}
export function scoutSprite(){
 const tile=document.createElement('canvas');tile.width=tile.height=128;const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 rect(29,50,58,28,'#455769');rect(44,42,38,44,'#9caeaa');rect(54,46,39,36,'#ccd0b7');rect(93,54,16,20,'#94a7a5');rect(109,60,8,8,'#c9ccb2');rect(80,57,15,14,'#417987');rect(83,60,8,4,'#a3e0d1');
 for(const y of [32,82]){rect(29,y,35,14,'#657d86');rect(23,y+2,10,10,'#354655');rect(25,y+4,4,6,'#76c8db');rect(46,y+3,14,8,'#d0b887');rect(62,y+4,25,3,'#889f9f');rect(86,y-3,3,18,'#d2c9a8');}
 for(let x=48;x<77;x+=8)rect(x,51,3,25,'#778e93');rect(55,61,18,6,'#c6b28b');return tile;
}
