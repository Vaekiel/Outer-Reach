import {civilianSprite} from './civilian-art.js';
import {miningSprite,miningLengths} from './mining-art.js';
import {playerShipSprite,playerShipLengths} from './player-ship-art.js';
import {asteroidSprite} from './asteroid-art.js';
import {drawBackdrop,drawCelestials} from './backdrop.js';
import {resourceName,resources} from './resources.js';
import {renderSector,scoutSprite} from './sector-art.js';
import {point,points,sector,station} from './universe.js';
import {dockFrame,berthPort,noseOf,berthNear,mooringArm} from './docking.js';
import {drawArm} from './dock-art.js';
import {compassMarkers} from './compass.js';
import {drawCompass} from './compass-art.js';
import {drawStation} from './station-art.js';
import {hulls,getHull} from './ships.js';
// World art uses a low-resolution framebuffer, then integer nearest-neighbor display.
// UI and the navigation model retain CSS-pixel/world coordinates independently.
const atlas = new Image();
atlas.src = new URL('./assets/oree-atlas.png', import.meta.url).href;
// Même vaisseaux que l'arbre des vaisseaux (dessinés nez-en-haut, d'où la pré-rotation de 90°).
const shipAtlas = new Image();
shipAtlas.src = new URL('./assets/ship-tree-atlas.png', import.meta.url).href;
const scene = document.createElement('canvas');
const sprites = new Map();
const shipSprites = new Map();
const palette = { space:'#080f19', near:'#c5d8cf', mid:'#73899b', far:'#354555', copper:'#e7ac6a', mint:'#a2dbc4' };
const shipLength=id=>miningLengths[id]||playerShipLengths[id]||100;
function sprite(index) {
  if (!atlas.complete || !atlas.naturalWidth) return null;
  if (!sprites.has(index)) {
    const tile = document.createElement('canvas'); tile.width=128; tile.height=128;
    const ctx=tile.getContext('2d'); ctx.imageSmoothingEnabled=false;
    const sw=atlas.naturalWidth/2,sh=atlas.naturalHeight/2;
    ctx.drawImage(atlas,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,0,0,128,128);
    sprites.set(index,tile);
  }
  return sprites.get(index);
}
function shipSprite(hullIndex) {
  const id=hulls[hullIndex]?.id;if(miningLengths[id])return miningSprite(id);
  const updated=playerShipSprite(id);if(updated)return updated;
  if (!shipAtlas.complete || !shipAtlas.naturalWidth) return null;
  if(hulls[hullIndex]?.id==='aiguille'){if(!shipSprites.has(hullIndex))shipSprites.set(hullIndex,scoutSprite());return shipSprites.get(hullIndex);}
  if (!shipSprites.has(hullIndex)) {
    const tile = document.createElement('canvas'); tile.width=128; tile.height=128;
    const ctx=tile.getContext('2d'); ctx.imageSmoothingEnabled=false;
    const sw=shipAtlas.naturalWidth/3,sh=shipAtlas.naturalHeight;
    ctx.translate(64,64);ctx.rotate(Math.PI/2);
    ctx.drawImage(shipAtlas,hullIndex*sw,0,sw,sh,-64,-64,128,128);
    shipSprites.set(hullIndex,tile);
  }
  return shipSprites.get(hullIndex);
}
export function render(canvas,radar,w,zoom,input) {
  // Pendant l'amarrage ou le désamarrage, la vue suit la pose animée (la simulation est déjà dans l'état final).
  const anim=dockFrame(w.dockAnim,w.time),animating=!!anim&&!anim.done;
  const out=canvas.getContext('2d'),r=radar.getContext('2d'),s=animating?{...w.ship,...anim.pose}:w.ship;
  const cssW=canvas.clientWidth,cssH=canvas.clientHeight;
  const pixel=2,W=Math.ceil(cssW/pixel),H=Math.ceil(cssH/pixel),z=zoom/pixel;
  if(scene.width!==W||scene.height!==H){scene.width=W;scene.height=H;}
  if(canvas.width!==W*pixel||canvas.height!==H*pixel){canvas.width=W*pixel;canvas.height=H*pixel;}
  const c=scene.getContext('2d'); c.imageSmoothingEnabled=false;
  drawBackdrop(c,w,W,H);
  const X=x=>Math.round((x-s.x)*z+W/2),Y=y=>Math.round((y-s.y)*z+H/2);
  const wrap=(n,m)=>((n%m)+m)%m;
  for(let i=0;i<310;i++) {
    const layer=i%3,factor=[.008,.028,.07][layer];
    const x=Math.floor(wrap(Math.sin(i*45.1)*43758.54-s.x*factor,W));
    const y=Math.floor(wrap(Math.cos(i*19.2)*23578.1-s.y*factor,H));
    c.fillStyle=[palette.far,palette.mid,palette.near][layer];
    c.fillRect(x,y,1,1);
    if(i%71===0){c.fillStyle=palette.far;c.fillRect(x-1,y,3,1);c.fillRect(x,y-1,1,3);c.fillStyle=palette.near;c.fillRect(x,y,1,1);}
  }
  function drawTile(tile,x,y,size,angle=0,alpha=1) {
    if(!tile)return;
    c.save();c.globalAlpha=alpha;c.translate(Math.round(x),Math.round(y));
    c.rotate(Math.round(angle/(Math.PI/32))*(Math.PI/32));
    const n=Math.max(1,Math.round(size));c.drawImage(tile,-Math.floor(n/2),-Math.floor(n/2),n,n);c.restore();
  }
  function draw(index,x,y,size,angle=0,alpha=1) { drawTile(sprite(index),x,y,size,angle,alpha); }
  drawCelestials(c,w,W,H);
  for(let i=0;i<12;i++){
    const x=wrap(i*127.7+63-s.x*.075,W+40)-20,y=wrap(i*89.3+48-s.y*.075,H+40)-20;
    draw(2,x,y,6+i%5*2,i*.7,.22);
  }
  const tileReady=!!sprite(0)&&!!shipSprite(0);
  function label(x,y,text,color=palette.mid){c.fillStyle=color;c.font='7px "Oree Pixel", monospace';c.fillText(text,Math.round(x),Math.round(y));}
  c.strokeStyle='#38505b';c.lineWidth=1;c.setLineDash([2,4]);
  c.beginPath();c.arc(X(0),Y(0),220*z,0,Math.PI*2);c.stroke();c.setLineDash([]);
  drawStation(c,point(w,'hub'),X(0),Y(0),z,w.time);
  label(X(0)-22,Y(0)+185*z,sector(w).hub,palette.copper);
  for(const a of w.asteroids){
    const x=X(a.x),y=Y(a.y),radius=a.radius*z;
    if(x< -60||y< -60||x>W+60||y>H+60)continue;
    const oreSprite=w.systemId==='oree'?asteroidSprite(a):null;
    if(oreSprite)drawTile(oreSprite,x,y,radius*3,a.id*.8,a.ore>0?1:.38);
    else draw(2,x,y,radius*3,a.id*.8,a.ore>0?1:.38);
    if(w.target===a.id){c.strokeStyle=palette.copper;c.strokeRect(Math.round(x-radius-7),Math.round(y-radius-7),Math.round(radius*2+14),Math.round(radius*2+14));label(x+radius+10,y,resourceName(a.resource)+' '+String(a.id+1).padStart(2,'0'),resources[a.resource||'ferrite'].color);}
  }
  for(const n of w.traffic||[]){const x=X(n.x),y=Y(n.y),size=Math.max(14,n.size*z);if(x< -80||y< -80||x>W+80||y>H+80)continue;
    if(n.moving){c.save();c.translate(x,y);c.rotate(n.angle);c.fillStyle='#69a8bf';c.fillRect(-Math.round(size*.5)-4,-1,6,2);c.restore();}
    const civil=w.systemId==='oree'?civilianSprite(n):null;
    if(civil)drawTile(civil,x,y,size,n.angle,.85);else draw(0,x,y,size,n.angle,.85);
    c.fillStyle=Math.floor(w.time*2+n.size)%3===0?'#b5dfee':'#456e91';c.fillRect(x+Math.round(size*.4),y,2,2);
    if(n.target&&Math.floor(w.time*3)%3===0){c.strokeStyle='#547b9b';c.setLineDash([2,3]);c.beginPath();c.moveTo(x,y);c.lineTo(X(n.target.x),Y(n.target.y));c.stroke();c.setLineDash([]);}
  }
  // Stations secondaires, portes et sites sous les vaisseaux (les vaisseaux à quai dépassent des sas).
  renderSector(c,null,w,X,Y,z);
  // Coéquipier du groupe (même système) : sa coque et son pseudo en doré ; à quai, relié à son sas par le bras.
  const mate=w.teammate;
  if(mate){const mx=X(mate.x),my=Y(mate.y);if(mx>-80&&my>-80&&mx<W+80&&my<H+80){const mateIndex=Math.max(0,hulls.findIndex(h=>h.id===mate.hullId));drawTile(shipSprite(mateIndex),mx,my,Math.max(30,shipLength(mate.hullId)*z),mate.angle,.95);if(mate.docked){const port=berthNear(points(w).filter(p=>p.kind==='port'),mate,mate.hullId);if(port)drawArm(c,X,Y,z,port,noseOf(mate,mate.hullId),1,w.time,true);}label(mx+14,my-14,mate.pseudo||'Coéquipier','#e6c88f');}}
  const target=w.target==='station'?station:w.asteroids.find(a=>a.id===w.target)||point(w,w.target);
  if(target){
    const tx=X(target.x),ty=Y(target.y);c.strokeStyle='#755e43';c.setLineDash([2,6]);c.beginPath();c.moveTo(W/2,H/2);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);
    if(w.extracting){
      c.strokeStyle='#4d917f';c.lineWidth=3;c.beginPath();c.moveTo(W/2,H/2);c.lineTo(tx,ty);c.stroke();
      c.strokeStyle=palette.mint;c.lineWidth=1;c.stroke();
      for(let i=0;i<6;i++){const t=w.time*9+i*2;c.fillStyle=i%2?palette.copper:palette.mint;c.fillRect(Math.round(tx+Math.cos(t)*i*2),Math.round(ty+Math.sin(t)*i*2),1,1);}
    }
  }
  const shipSize=Math.max(38*shipLength(s.hullId)/100,shipLength(s.hullId)*z),heading=Math.round(s.angle/(Math.PI/32))*(Math.PI/32);
  const hullIndex=Math.max(0,hulls.findIndex(h=>h.id===s.hullId)),hull=hulls[hullIndex]||hulls[0],thrusterN=hull.size>=2?3:2;
  function puff(x,y,dirX,dirY,len){
    const ex=Math.round(x+dirX*len*.5),ey=Math.round(y+dirY*len*.5);
    c.fillStyle='#315b80';c.fillRect(Math.round(x-1.5),Math.round(y-1.5),3,3);c.fillRect(Math.min(Math.round(x),ex),Math.min(Math.round(y),ey),Math.max(2,Math.abs(ex-Math.round(x))),Math.max(2,Math.abs(ey-Math.round(y))));
    c.fillStyle='#9fd0de';c.fillRect(Math.round(x-1),Math.round(y-1),2,2);
  }
  if(input.thrust&&!s.docked&&s.fuel>0){
    c.save();c.translate(Math.round(W/2),Math.round(H/2));c.rotate(heading);
    const tail=-shipSize*.35,len=9+Math.floor(w.time*12)%4*2;
    c.fillStyle='#315b80';c.fillRect(Math.round(tail-len),-3,len,6);
    c.fillStyle='#77bdd2';c.fillRect(Math.round(tail-len*.7),-2,Math.ceil(len*.7),4);
    c.fillStyle='#d3ebdb';c.fillRect(Math.round(tail-4),-1,5,2);c.restore();
  }
  if((input.reverse||input.strafeY<-.15)&&!s.docked&&s.fuel>0){
    c.save();c.translate(Math.round(W/2),Math.round(H/2));c.rotate(heading);
    const nose=shipSize*.42,len=4+Math.floor(w.time*14)%3*1.5,spread=shipSize*.22;
    for(let i=0;i<thrusterN;i++){const ly=thrusterN>1?(i/(thrusterN-1)-.5)*spread*2:0;puff(nose,ly,1,0,len);}
    c.restore();
  }
  if(input.strafeY>.15&&!s.docked&&s.fuel>0){
    c.save();c.translate(Math.round(W/2),Math.round(H/2));c.rotate(heading);
    const tail=-shipSize*.38,len=4+Math.floor(w.time*14)%3*1.5,spread=shipSize*.22;
    for(let i=0;i<thrusterN;i++){const ly=thrusterN>1?(i/(thrusterN-1)-.5)*spread*2:0;puff(tail,ly,-1,0,len);}
    c.restore();
  }
  if(Math.abs(input.strafeX||0)>.15&&!s.docked&&s.fuel>0){
    c.save();c.translate(Math.round(W/2),Math.round(H/2));c.rotate(heading);
    const dir=input.strafeX>0?1:-1,side=-dir,len=4+Math.floor(w.time*14)%3*1.5,edge=shipSize*.3,span=shipSize*.32;
    for(let i=0;i<thrusterN;i++){const lx=thrusterN>1?(i/(thrusterN-1)-.5)*span:0;puff(lx,side*edge,0,side,len);}
    c.restore();
  }
  drawTile(shipSprite(hullIndex),W/2,H/2,shipSize,s.angle);
  // Bras d'amarrage : sorti pendant l'accostage, verrouillé à quai, rentré au départ.
  const guest=w.mooring?.role==='guest';
  const armPort=animating?w.dockAnim.port:w.ship.docked?berthPort(station,w.ship.berth):guest?w.mooring.port:null;
  if(armPort)drawArm(c,X,Y,z,armPort,noseOf(s,s.hullId),animating?anim.arm:1,w.time,(w.ship.docked||guest)&&(!animating||anim.locked));
  // Hôte d'un amarrage en vol : le bras sort de son flanc dès que le coéquipier est en position.
  if(w.mooring?.role==='host'&&mate){const arm=mooringArm({x:s.x,y:s.y,angle:s.angle,hullId:s.hullId},mate);if(arm.extension)drawArm(c,X,Y,z,arm.port,arm.nose,1,w.time,true);}
  // Boussole : anneau de cap vers la cible, le coéquipier (ou la porte menant à lui) et les hostiles proches.
  if(!w.ship.docked&&!animating){const radius=Math.max(34,Math.round(shipSize*.62));drawCompass(c,W/2,H/2,radius,compassMarkers(w,{mate:w.teammate,elsewhere:w.mateElsewhere,hideWithin:radius/z}),w.time,{width:W,height:H});}
  if(!s.docked&&!animating){c.strokeStyle='#6b9584';c.lineWidth=1;c.beginPath();c.moveTo(W/2,H/2+shipSize*.45);c.lineTo(W/2+s.vx*.09,H/2+shipSize*.45+s.vy*.09);c.stroke();}
  if(!tileReady)label(W/2-62,H/2+35,atlas.complete&&shipAtlas.complete?'SPRITES INDISPONIBLES':'CHARGEMENT DES SPRITES',palette.copper);
  out.imageSmoothingEnabled=false;out.clearRect(0,0,canvas.width,canvas.height);out.drawImage(scene,0,0,W*pixel,H*pixel);
  r.clearRect(0,0,280,160);r.strokeStyle='#344d54';r.lineWidth=1;
  for(const rr of [30,55,75]){r.beginPath();r.arc(140,80,rr,0,Math.PI*2);r.stroke();}
  r.beginPath();r.moveTo(55,80);r.lineTo(225,80);r.moveTo(140,0);r.lineTo(140,160);r.stroke();
  for(const a of w.asteroids){const dx=(a.x-s.x)*.037,dy=(a.y-s.y)*.037;if(Math.hypot(dx,dy)>75)continue;r.fillStyle=a.id==='station'?'#63dc91':'#f0a04b';r.fillRect(138+dx,78+dy,4,4);}
  renderSector(null,r,w,X,Y,z);
  for(const n of w.traffic||[]){const dx=(n.x-s.x)*.037,dy=(n.y-s.y)*.037;if(Math.hypot(dx,dy)>75)continue;r.strokeStyle=n.hostile?'#f06464':'#77b7ee';r.strokeRect(Math.round(137+dx),Math.round(77+dy),6,6);}
  if(mate){const dx=(mate.x-s.x)*.037,dy=(mate.y-s.y)*.037;if(Math.hypot(dx,dy)<=75){r.save();r.translate(Math.round(140+dx),Math.round(80+dy));r.rotate(Math.PI/4);r.fillStyle='#e6c88f';r.fillRect(-4,-4,8,8);r.fillStyle='#0c1721';r.fillRect(-2,-2,4,4);r.restore();}}
  if(!s.docked){r.save();r.translate(140,80);r.rotate(s.angle);r.fillStyle=palette.near;r.beginPath();r.moveTo(7,0);r.lineTo(-4,-4);r.lineTo(-4,4);r.fill();r.restore();}
}
