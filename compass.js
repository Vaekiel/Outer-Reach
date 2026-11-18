// Boussole de cap : repères autour du vaisseau vers la cible, le coéquipier (ou la porte menant à lui) et les hostiles.
// Logique pure (aucun DOM) : types et couleurs alignés sur la palette du radar.
import {worldSystems,worldLinks} from './galaxy.js';
import {points,point,station} from './universe.js';

export const COMPASS={hostileRange:3000,maxHostiles:3,separation:12*Math.PI/180};
export const MARKER_STYLES={
 port:{color:'#63dc91',shape:'flat',priority:2},
 ore:{color:'#f0a04b',shape:'chevron',priority:2},
 gate:{color:'#f4f5f2',shape:'double',priority:2},
 site:{color:'#b388ff',shape:'dot',priority:2},
 traffic:{color:'#77b7ee',shape:'hollow',priority:2},
 hostile:{color:'#f06464',shape:'triangle',priority:0},
 mate:{color:'#e6c88f',shape:'diamond',priority:1},
 'mate-gate':{color:'#e6c88f',outline:'#f4f5f2',shape:'diamond-gate',priority:1}
};

export function formatDistance(m){
 const d=Math.max(0,Number(m)||0);
 if(d<1000)return Math.round(d)+' m';
 if(d<10000)return (Math.round(d/100)/10).toFixed(1).replace('.',',')+' km';
 return Math.round(d/1000)+' km';
}

// Plus court chemin entre deux systèmes (liaisons de la carte) : système suivant, ou null.
export function routeNextSystem(from,to){
 if(!from||!to||from===to||!worldSystems[from]||!worldSystems[to])return null;
 const previous=new Map([[from,null]]),queue=[from];
 while(queue.length){
  const here=queue.shift();
  for(const [a,b] of worldLinks){const next=a===here?b:b===here?a:null;if(!next||previous.has(next))continue;previous.set(next,here);if(next===to){let step=to;while(previous.get(step)!==from)step=previous.get(step);return step;}queue.push(next);}
 }
 return null;
}
export const gateToward=(w,nextSystem)=>points(w).find(p=>p.kind==='gate'&&p.destination===nextSystem)||null;

// Destination du cap assisté vers le coéquipier : lui-même s'il est ici, sinon la porte vers son système.
export function mateGoal(w,mate,elsewhere){
 if(mate)return {x:mate.x,y:mate.y,gate:null};
 if(!elsewhere?.systemId)return null;
 const gate=gateToward(w,routeNextSystem(w.systemId,elsewhere.systemId));
 return gate?{x:gate.x,y:gate.y,gate}:null;
}

function targetOf(w){
 if(w.target===null||w.target===undefined)return null;
 if(w.target==='station')return {pos:station,kind:'port'};
 const a=w.asteroids?.find(x=>x.id===w.target);if(a)return {pos:a,kind:'ore'};
 const p=point(w,w.target);
 if(p)return {pos:p,kind:p.kind==='port'?'port':p.kind==='gate'?'gate':'site'};
 const n=w.traffic?.find(x=>x.id===w.target);if(n)return {pos:n,kind:n.hostile?'hostile':'traffic',id:n.id};
 return null;
}

// Repères triés (hostiles, coéquipier, cible) ; `hideWithin` : distance monde sous laquelle l'anneau n'apporte rien.
export function compassMarkers(w,{mate=null,elsewhere=null,hideWithin=0}={}){
 const s=w.ship;if(!s||s.docked)return [];
 const out=[];
 const add=(kind,pos,label)=>{const dx=pos.x-s.x,dy=pos.y-s.y,distance=Math.hypot(dx,dy);if(distance<=hideWithin)return;const style=MARKER_STYLES[kind];out.push({kind,...style,angle:Math.atan2(dy,dx),distance,label:label(distance),level:0});};
 const target=targetOf(w);
 if(target)add(target.kind,target.pos,d=>(target.kind==='hostile'?'Hostile · ':'')+formatDistance(d));
 const hostiles=(w.traffic||[]).filter(n=>n.hostile&&n.id!==target?.id).map(n=>({n,d:Math.hypot(n.x-s.x,n.y-s.y)})).filter(h=>h.d<COMPASS.hostileRange).sort((a,b)=>a.d-b.d).slice(0,COMPASS.maxHostiles);
 for(const {n} of hostiles)add('hostile',n,d=>'Hostile · '+formatDistance(d));
 const name=mate?.pseudo||elsewhere?.pseudo||'Coéquipier';
 if(mate)add('mate',mate,d=>name+' · '+formatDistance(d));
 else if(elsewhere){
  const goal=mateGoal(w,null,elsewhere),where=name+' · '+(worldSystems[elsewhere.systemId]?.name||elsewhere.systemId);
  // Cible déjà sur cette porte : un seul repère qui dit les deux.
  const same=goal&&w.target===goal.gate.id&&out.find(m=>m.kind==='gate');
  if(same)Object.assign(same,MARKER_STYLES['mate-gate'],{kind:'mate-gate',label:formatDistance(same.distance)+' · '+where});
  else if(goal)add('mate-gate',goal,()=>where);
 }
 out.sort((a,b)=>a.priority-b.priority||a.distance-b.distance);
 // Repères trop proches en angle : décalés vers l'extérieur pour rester lisibles.
 out.forEach((m,i)=>{m.level=out.slice(0,i).filter(o=>Math.abs(((o.angle-m.angle)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI)<COMPASS.separation).length;});
 return out;
}
