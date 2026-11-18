// Amarrage en bout de sas : positions des sas de chaque station, pose finale du vaisseau et animation (bras télescopique).
// Logique pure (aucun DOM) : utilisée par la simulation, le rendu et les tests.
import {stationStyle,stationSizes} from './station-art.js';
import {miningLengths} from './mining-art.js';

// Sas mesurés sur les planches (extrémités des modules) : [x, y, direction] en fractions de la taille du sprite,
// direction en seizièmes de tour (0 = droite, 4 = bas, 8 = gauche, 12 = haut), vers l'extérieur de la station.
export const DOCK_PORTS={
 hub:[
  [[.473,0,0],[0,.429,4],[-.459,0,8],[0,-.426,12]],
  [[0,.45,4],[0,-.45,12],[.408,.169,0],[.404,-.167,0],[-.428,.177,8],[-.428,-.177,8]],
  [[.442,0,0],[0,.257,4],[-.421,0,8],[0,-.384,12]],
  [[.359,0,0],[0,.341,4],[-.387,0,8],[0,-.462,12]]
 ],
 refinery:[
  [[.363,0,0],[0,.409,4],[-.352,0,8],[0,-.255,12]],
  [[.422,.175,0],[0,.34,4],[-.363,0,8],[0,-.205,12]],
  [[.363,.15,1],[0,.409,4],[-.323,.134,7],[0,-.291,12]],
  [[.403,0,0],[-.462,0,8]]
 ],
 station:[
  [[.372,0,0],[0,.311,4],[-.342,0,8],[0,-.428,12]],
  [[0,.349,4],[-.344,-.344,10],[.346,-.346,14]],
  [[.372,0,0],[-.285,.285,4],[-.284,-.284,12]],
  [[.291,0,0],[0,.234,4],[-.258,0,8],[0,-.351,12]]
 ]
};
export const DOCK={arm:26,alignSeconds:1.2,armSeconds:.8,retractSeconds:.6,exitSeconds:.9,exitGap:40,matchDistance:30};

export const hullLength=hullId=>miningLengths[hullId]||100;
// Distance centre → pointe du nez, en fraction de la longueur (marges transparentes des sprites comprises).
const NOSE=.48;
const TAU=Math.PI*2;
const shortAngle=(from,to)=>((to-from)%TAU+TAU*1.5)%TAU-TAU/2;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const clamp01=t=>Math.max(0,Math.min(1,t));

// Sas d'une station en coordonnées monde : {index, x, y, dir}.
export function stationPorts(p){
 const {category,variant,size}=stationStyle(p),list=DOCK_PORTS[category]?.[variant]||DOCK_PORTS.station[0],n=stationSizes[category]||size;
 return list.map(([fx,fy,d],index)=>({index,x:p.x+fx*n,y:p.y+fy*n,dir:d*Math.PI/8}));
}
export function nearestPort(p,from){
 const ports=stationPorts(p);
 if(!from||!Number.isFinite(from.x))return ports[0];
 return ports.reduce((best,q)=>Math.hypot(q.x-from.x,q.y-from.y)<Math.hypot(best.x-from.x,best.y-from.y)?q:best);
}
// Pose finale : le nez du vaisseau au bout du bras, la coque dans l'axe du sas.
export function berthPose(port,hullId){
 const reach=DOCK.arm+hullLength(hullId)*NOSE;
 return {x:port.x+Math.cos(port.dir)*reach,y:port.y+Math.sin(port.dir)*reach,angle:port.dir+Math.PI};
}
export const noseOf=(pose,hullId)=>({x:pose.x+Math.cos(pose.angle)*hullLength(hullId)*NOSE,y:pose.y+Math.sin(pose.angle)*hullLength(hullId)*NOSE});
export function exitPose(port,hullId){
 const reach=DOCK.arm+hullLength(hullId)*NOSE+DOCK.exitGap+hullLength(hullId)*.3;
 return {x:port.x+Math.cos(port.dir)*reach,y:port.y+Math.sin(port.dir)*reach,angle:port.dir};
}

// Amarre le vaisseau au sas le plus proche de la station `p` (animation depuis sa pose actuelle, sauf `instant`).
export function berthShip(w,p,{instant=false}={}){
 const s=w.ship,port=nearestPort(p,instant?null:s),pose=berthPose(port,s.hullId);
 const from={x:s.x,y:s.y,angle:s.angle};
 s.berth={portId:p.id,port:port.index};Object.assign(s,pose);s.vx=s.vy=0;s.docked=true;
 w.dockAnim=instant?null:{kind:'dock',from,to:pose,port,start:w.time||0};
 return pose;
}
// Point d'approche du cap assisté : la pose à quai du sas le plus proche (le vaisseau ne traverse plus la station).
export const approachPoint=(p,ship)=>berthPose(nearestPort(p,ship),ship.hullId);
export function berthPort(p,berth){const ports=stationPorts(p);return ports[berth?.port]||ports[0];}
// Recalcule la pose à quai (changement de coque, chargement d'une sauvegarde) ; sans sas connu, choisit le premier.
export function refreshBerth(w,p){
 const s=w.ship;if(!s.docked||!p)return null;
 if(s.berth?.portId!==p.id||!stationPorts(p)[s.berth?.port])s.berth={portId:p.id,port:0};
 const pose=berthPose(berthPort(p,s.berth),s.hullId);Object.assign(s,pose);s.vx=s.vy=0;return pose;
}
// Désamarrage : le bras se rétracte puis le vaisseau s'écarte du sas en pivotant vers l'extérieur.
export function unberthShip(w,p){
 const s=w.ship,port=berthPort(p,s.berth),from=berthPose(port,s.hullId),to=exitPose(port,s.hullId);
 Object.assign(s,to);s.vx=s.vy=0;s.docked=false;s.berth=null;
 w.dockAnim={kind:'undock',from,to,port,start:w.time||0};
 return to;
}

export const dockDuration=kind=>kind==='dock'?DOCK.alignSeconds+DOCK.armSeconds:DOCK.retractSeconds+DOCK.exitSeconds;
// État de l'animation à l'instant `time` : pose affichée, extension du bras (0 → 1), verrouillage.
export function dockFrame(anim,time){
 if(!anim)return null;
 const t=Math.max(0,time-anim.start),lerp=(k)=>({x:anim.from.x+(anim.to.x-anim.from.x)*k,y:anim.from.y+(anim.to.y-anim.from.y)*k,angle:anim.from.angle+shortAngle(anim.from.angle,anim.to.angle)*k});
 if(anim.kind==='dock'){
  const k=ease(clamp01(t/DOCK.alignSeconds)),arm=clamp01((t-DOCK.alignSeconds)/DOCK.armSeconds);
  return {pose:lerp(k),arm:ease(arm),locked:arm>=1,done:t>=dockDuration('dock')};
 }
 const arm=1-clamp01(t/DOCK.retractSeconds),k=ease(clamp01((t-DOCK.retractSeconds)/DOCK.exitSeconds));
 return {pose:lerp(k),arm:ease(arm),locked:false,done:t>=dockDuration('undock')};
}

// Bras d'un vaisseau à quai vu de l'extérieur (coéquipier) : sas dont la pose attendue correspond à la sienne.
export function berthNear(ports,pose,hullId){
 let best=null,bestD=DOCK.matchDistance;
 for(const p of ports){for(const port of stationPorts(p)){const b=berthPose(port,hullId),d=Math.hypot(b.x-pose.x,b.y-pose.y);if(d<bestD){bestD=d;best=port;}}}
 return best;
}
// --- Amarrage vaisseau à vaisseau (coéquipier, dans l'espace) ---
// L'hôte reste immobile ; le visiteur vient placer son nez au bout d'un bras sorti du flanc de l'hôte, côté visiteur.
export const MOORING={maxDistance:150,maxSpeed:20,halfWidth:.22,armMatch:25};
export function flankPort(host,towards){
 const side=Math.cos(host.angle)*(towards.y-host.y)-Math.sin(host.angle)*(towards.x-host.x)>=0?1:-1;
 const dir=host.angle+side*Math.PI/2,offset=hullLength(host.hullId)*MOORING.halfWidth;
 return {x:host.x+Math.cos(dir)*offset,y:host.y+Math.sin(dir)*offset,dir,side};
}
export const canMoor=(ship,mate)=>!!ship&&!!mate&&!ship.docked&&!mate.docked
 &&Math.hypot(ship.x-mate.x,ship.y-mate.y)<MOORING.maxDistance
 // Vitesse relative : un coéquipier en panne sèche qui dérive peut être rattrapé puis amarré (les deux s'immobilisent).
 &&Math.hypot((ship.vx||0)-(mate.vx||0),(ship.vy||0)-(mate.vy||0))<MOORING.maxSpeed;
// Visiteur : animation d'accostage vers le flanc de l'hôte (le vaisseau reste « en vol », docked = false).
export function moorGuest(w,host){
 const s=w.ship,port=flankPort(host,s),pose=berthPose(port,s.hullId),from={x:s.x,y:s.y,angle:s.angle};
 Object.assign(s,pose);s.vx=s.vy=0;w.mining=false;
 w.mooring={role:'guest',port,side:port.side};w.dockAnim={kind:'dock',from,to:pose,port,start:w.time||0};
 return pose;
}
export function unmoorGuest(w){
 const s=w.ship,port=w.mooring?.port;w.mooring=null;if(!port)return null;
 const from={x:s.x,y:s.y,angle:s.angle},to=exitPose(port,s.hullId);Object.assign(s,to);s.vx=s.vy=0;
 w.dockAnim={kind:'undock',from,to,port,start:w.time||0};return to;
}
// Hôte : bras vers le visiteur une fois celui-ci arrivé à sa pose d'accostage.
export function mooringArm(host,guest){
 const port=flankPort(host,guest),expected=berthPose(port,guest.hullId);
 const near=Math.hypot(expected.x-guest.x,expected.y-guest.y)<MOORING.armMatch;
 return {port,nose:noseOf(guest,guest.hullId),extension:near?1:0};
}
// Géométrie du bras : du sas vers le nez, trois sections télescopiques qui sortent l'une de l'autre.
export function armSections(from,to,extension){
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)*clamp01(extension),angle=Math.atan2(dy,dx);
 const widths=[10,7.5,5.5],share=[.4,.33,.27];let start=0;
 const sections=widths.map((width,i)=>{const len=length*share[i]+(i<2?length*.06:0);const s={start,length:Math.max(0,Math.min(len,length-start)),width};start+=length*share[i];return s;});
 return {x:from.x,y:from.y,angle,length,sections};
}
