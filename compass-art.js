// Anneau de cap pixel-art autour du vaisseau : un repère orienté par destination, coloré et formé selon son type.
export function drawCompass(c,cx,cy,radius,markers,time=0,{width=Infinity,height=Infinity}={}){
 if(!markers?.length)return;
 const placed=[],overlaps=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
 c.save();
 // Anneau discret : pointillés courts.
 c.strokeStyle='rgba(107,149,132,.35)';c.lineWidth=1;c.setLineDash([1,4]);
 c.beginPath();c.arc(Math.round(cx),Math.round(cy),Math.round(radius),0,Math.PI*2);c.stroke();c.setLineDash([]);
 c.font='7px "Oree Pixel", monospace';c.textBaseline='middle';
 // Repères d'abord : leur place est réservée pour que les étiquettes ne les recouvrent pas.
 const spots=markers.map(m=>{const r=radius+m.level*10;return {m,r,x:Math.round(cx+Math.cos(m.angle)*r),y:Math.round(cy+Math.sin(m.angle)*r)};});
 for(const {m,x,y} of spots){placed.push({x:x-6,y:y-6,w:12,h:12});if(m.kind==='hostile'&&Math.floor(time*3)%2===1)continue;c.save();c.translate(x,y);c.rotate(m.angle);drawShape(c,m);c.restore();}
 for(const {m,r} of spots){
  // Étiquette à l'extérieur, alignée selon le côté pour ne pas couvrir le vaisseau.
  const lx=Math.round(cx+Math.cos(m.angle)*(r+9)),ly=Math.round(cy+Math.sin(m.angle)*(r+9)),right=Math.cos(m.angle)>=-.2;
  c.textAlign=Math.abs(Math.cos(m.angle))<.35?'center':right?'left':'right';
  let ty=Math.abs(Math.cos(m.angle))<.35?ly+Math.sign(Math.sin(m.angle)||1)*5:ly;
  const wText=Math.ceil(c.measureText?.(m.label)?.width||m.label.length*5);
  let bx=c.textAlign==='center'?lx-wText/2:c.textAlign==='left'?lx:lx-wText;
  // Toujours dans l'écran, et empilée sous (ou sur) une étiquette voisine plutôt que par-dessus.
  bx=Math.max(3,Math.min(width-wText-3,bx));
  const step=Math.sin(m.angle)>=0?11:-11;
  for(let i=0;i<8&&placed.some(p=>overlaps(p,{x:bx-2,y:ty-5,w:wText+4,h:10}));i++)ty+=step;
  ty=Math.max(7,Math.min(height-7,ty));
  placed.push({x:bx-2,y:ty-5,w:wText+4,h:10});
  c.fillStyle='rgba(8,15,25,.75)';c.fillRect(Math.round(bx)-2,ty-5,wText+4,10);
  c.textAlign='left';c.fillStyle=m.color;c.fillText(m.label,Math.round(bx),ty);
 }
 c.restore();
}

// Formes dessinées pointe vers +x (l'extérieur de l'anneau), 7 px environ.
function drawShape(c,m){
 const fill=(pts,color)=>{c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 const dark='#0c1721';
 switch(m.shape){
  case 'flat':fill([[4,0],[-3,-4],[-3,4]],m.color);c.fillStyle=m.color;c.fillRect(-5,-4,1,8);break;
  case 'chevron':fill([[4,0],[-3,-4],[-1,0],[-3,4]],m.color);break;
  case 'double':fill([[5,0],[0,-4],[1,0],[0,4]],m.color);fill([[0,0],[-5,-4],[-4,0],[-5,4]],m.color);break;
  case 'dot':fill([[4,0],[-3,-4],[-1,0],[-3,4]],m.color);c.fillStyle=m.color;c.fillRect(-6,-1,2,2);break;
  case 'hollow':fill([[4,0],[-3,-4],[-3,4]],m.color);fill([[2,0],[-2,-2],[-2,2]],dark);break;
  case 'triangle':fill([[5,0],[-4,-5],[-4,5]],dark);fill([[4,0],[-3,-4],[-3,4]],m.color);break;
  case 'diamond':fill([[4,0],[0,-4],[-4,0],[0,4]],m.color);c.fillStyle=dark;c.fillRect(-1,-1,2,2);break;
  case 'diamond-gate':fill([[5,0],[0,-5],[-5,0],[0,5]],m.outline||'#f4f5f2');fill([[3,0],[0,-3],[-3,0],[0,3]],m.color);break;
  default:fill([[4,0],[-3,-4],[-3,4]],m.color);
 }
}
