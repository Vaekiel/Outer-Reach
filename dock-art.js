// Bras d'amarrage pixel-art : embase, trois sections télescopiques, articulations cuivre, collier et voyants.
import {armSections} from './docking.js';

const colors={outline:'#0d1720',body:'#5f7079',light:'#a9b4ae',shade:'#3a4952',copper:'#c47a3e',copperLight:'#e0a35f',lamp:'#8fe3dc',lampOff:'#2f5a5c'};

// `from` et `to` en coordonnées monde ; `X`/`Y` convertissent vers l'écran, `z` = pixels par mètre.
export function drawArm(c,X,Y,z,from,to,extension,time=0,locked=false){
 if(!(extension>0))return;
 const g=armSections(from,to,extension),px=n=>Math.max(1,Math.round(n*z));
 c.save();c.translate(Math.round(X(g.x)),Math.round(Y(g.y)));c.rotate(g.angle);
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 // Embase fixée au sas.
 const baseH=Math.max(4,px(14)),baseW=Math.max(3,px(6));
 rect(-baseW/2-1,-baseH/2-1,baseW+2,baseH+2,colors.outline);rect(-baseW/2,-baseH/2,baseW,baseH,colors.shade);rect(-baseW/2,-baseH/2,baseW,1,colors.copper);
 for(const s of g.sections){
  const len=s.length*z;if(len<1)continue;
  const h=Math.max(2,px(s.width)),x=s.start*z;
  rect(x,-h/2-1,len,h+2,colors.outline);rect(x,-h/2,len,h,colors.body);
  if(h>=3)rect(x,-h/2,len,1,colors.light);
  if(h>=4)rect(x,h/2-1,len,1,colors.shade);
  // Articulation cuivre au bout de chaque section.
  const j=Math.max(1,px(2.5));rect(x+len-j,-h/2-1,j,h+2,colors.copper);if(h>=4)rect(x+len-j,-h/2,1,1,colors.copperLight);
 }
 // Collier autour du nez une fois le bras entièrement sorti.
 if(extension>=.98){
  const cw=Math.max(2,px(4)),ch=Math.max(5,px(16)),x=g.length*z-cw;
  rect(x-1,-ch/2-1,cw+2,ch+2,colors.outline);rect(x,-ch/2,cw,ch,colors.copper);rect(x,-ch/2,cw,1,colors.copperLight);
  const on=locked&&Math.floor(time*2)%2===0;
  rect(x,-ch/2+1,1,1,on?colors.lamp:colors.lampOff);rect(x,ch/2-2,1,1,on?colors.lamp:colors.lampOff);
 }
 c.restore();
}
