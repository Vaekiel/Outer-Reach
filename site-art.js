import {surveySprite} from './survey-art.js';
const cache=new Map();
export function siteSprite(p){
 const detailed=surveySprite(p);if(detailed)return detailed;
 const v=p.variant||0,palette=p.palette||0,key=p.kind+v+':'+palette;
 if(cache.has(key))return cache.get(key);
 const tile=document.createElement('canvas');tile.width=tile.height=48;
 const c=tile.getContext('2d'),light=['#8be0d5','#c7a3ee','#e9c37f','#8abce3'][palette%4];
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const panel=(x,y,w,h)=>{rect(x,y,w,h,'#1b2c3b');rect(x+1,y+1,w-2,h-2,'#516b7b');rect(x+1,y+1,w-2,1,'#b0bdb5');for(let j=x+3;j<x+w-2;j+=4)rect(j,y+3,1,h-5,'#293f54');};
 if(p.kind==='archive'){
  panel(19,13,10,24);rect(22,17,4,15,light);
  if(v===0){panel(3,19,14,14);panel(31,19,14,14);rect(9,24,30,2,'#879da3');}
  if(v===1){panel(8,9,8,30);panel(32,9,8,30);rect(12,21,25,3,'#879da3');}
  if(v===2){panel(7,6,34,8);panel(7,34,34,8);rect(23,5,2,39,'#879da3');}
  if(v===3){panel(4,13,13,10);panel(31,27,13,10);panel(8,30,9,9);panel(32,8,9,9);}
  rect(23,3,2,10,'#bac6bd');rect(14,4,20,2,light);rect(21,19,6,2,'#e5efe1');
 }else{
  if(v===0){panel(8,17,21,18);panel(30,22,12,8);rect(14,14,9,4,'#b79974');}
  if(v===1){panel(13,8,14,20);panel(19,30,13,12);rect(11,12,3,16,'#b79974');}
  if(v===2){panel(6,19,15,13);panel(27,13,15,19);rect(19,24,10,3,'#b79974');}
  if(v===3){panel(10,9,22,10);panel(8,28,27,12);rect(13,17,5,15,'#b79974');}
  for(let i=0;i<9;i++){const x=3+(i*13+v*7)%41,y=5+(i*19+v*3)%38;rect(x,y,2+i%3,2,'#98836e');}
  rect(22,22,5,3,light);rect(24,25,2,2,'#f0d9ad');
 }
 cache.set(key,tile);return tile;
}
export function drawSite(c,p,x,y,scale){
 const size=Math.max(1,Math.round(144*scale));c.save();c.imageSmoothingEnabled=false;
 c.drawImage(siteSprite(p),Math.round(x-size/2),Math.round(y-size/2),size,size);c.restore();
}
