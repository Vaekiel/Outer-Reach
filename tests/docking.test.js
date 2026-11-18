import test from 'node:test';
import assert from 'node:assert/strict';
import {DOCK_PORTS,DOCK,stationPorts,nearestPort,berthPose,noseOf,exitPose,dockFrame,dockDuration,berthNear,armSections,hullLength,approachPoint,moorGuest,unmoorGuest,mooringArm,canMoor} from '../docking.js';
import {createWorld,command,step,station} from '../simulation.js';
import {initUniverse,point,universeCommand} from '../universe.js';
import {capacity} from '../simulation.js';
import {hulls} from '../ships.js';

const near=(a,b,eps=1e-6)=>Math.abs(a-b)<eps;

test('amarrage : chaque station a des sas au bord du sprite, orientés vers l’extérieur',()=>{
 for(const [category,variants] of Object.entries(DOCK_PORTS)){
  assert.equal(variants.length,4,category);
  variants.forEach((ports,v)=>{
   assert.ok(ports.length>=2,category+v);
   for(const [x,y,d] of ports){
    assert.ok(Math.abs(x)<=.5&&Math.abs(y)<=.5,category+v+' dans le sprite');
    assert.ok(Math.hypot(x,y)>.2,category+v+' au bord, pas au centre');
    const a=d*Math.PI/8;assert.ok(Math.cos(a)*x+Math.sin(a)*y>0,category+v+' vers l’extérieur');
   }
  });
 }
});

test('amarrage : nez au bout du bras, coque dans l’axe, jamais sur la station',()=>{
 for(const category of ['hub','refinery','station'])for(let variant=0;variant<4;variant++){
  const p={id:'x',category,variant,x:500,y:-300};
  for(const port of stationPorts(p))for(const h of hulls){
   const pose=berthPose(port,h.id),nose=noseOf(pose,h.id);
   assert.ok(near(Math.hypot(nose.x-port.x,nose.y-port.y),DOCK.arm,1e-6),'bras de '+DOCK.arm+' m');
   const out=Math.hypot(port.x-p.x,port.y-p.y);
   assert.ok(Math.hypot(pose.x-p.x,pose.y-p.y)>out+hullLength(h.id)*.5,category+variant+' '+h.id+' hors de la station');
   assert.ok(near(Math.cos(pose.angle),-Math.cos(port.dir),1e-9)&&near(Math.sin(pose.angle),-Math.sin(port.dir),1e-9),'nez tourné vers le sas');
   const exit=exitPose(port,h.id);assert.ok(Math.hypot(exit.x-p.x,exit.y-p.y)>Math.hypot(pose.x-p.x,pose.y-p.y),'sortie au-delà du quai');
  }
 }
});

test('amarrage : le sas choisi est celui du côté d’approche',()=>{
 const p={id:'hub',category:'hub',variant:0,x:0,y:0};
 assert.ok(near(nearestPort(p,{x:-400,y:10}).dir,Math.PI));
 assert.ok(near(nearestPort(p,{x:0,y:400}).dir,Math.PI/2));
 assert.equal(nearestPort(p,null).index,0);
});

test('amarrage : animation alignement puis bras, désamarrage bras puis sortie',()=>{
 const anim={kind:'dock',from:{x:0,y:0,angle:0},to:{x:100,y:0,angle:Math.PI},start:10};
 let f=dockFrame(anim,10);assert.deepEqual([f.pose.x,f.arm,f.locked,f.done],[0,0,false,false]);
 f=dockFrame(anim,10+DOCK.alignSeconds);assert.ok(near(f.pose.x,100));assert.equal(f.arm,0);
 f=dockFrame(anim,10+dockDuration('dock'));assert.deepEqual([f.arm,f.locked,f.done],[1,true,true]);
 const out={kind:'undock',from:{x:100,y:0,angle:Math.PI},to:{x:200,y:0,angle:0},start:0};
 f=dockFrame(out,DOCK.retractSeconds/2);assert.ok(f.arm>0&&f.arm<1);assert.equal(f.pose.x,100,'reste au quai tant que le bras rentre');
 f=dockFrame(out,dockDuration('undock'));assert.deepEqual([f.pose.x,f.arm,f.done],[200,0,true]);
 assert.equal(dockFrame(null,0),null);
});

test('amarrage : départ et retour au Relais-9 en bout de sas, commandes ignorées pendant l’animation',()=>{
 const w=createWorld(),s=w.ship;
 assert.equal(s.docked,true);assert.ok(Math.hypot(s.x-station.x,s.y-station.y)>150,'plus au centre de la station');assert.ok(s.berth);
 command(w,'dock');assert.equal(s.docked,false);assert.equal(w.dockAnim.kind,'undock');assert.equal(s.berth,null);
 const exit={x:s.x,y:s.y};command(w,'dock');assert.equal(s.docked,false,'ignoré pendant la sortie');
 w.time+=dockDuration('undock')+.1;
 Object.assign(s,{x:-190,y:20,vx:0,vy:0});command(w,'dock');
 assert.equal(s.docked,true);assert.equal(w.dockAnim.kind,'dock');assert.deepEqual(w.dockAnim.from,{x:-190,y:20,angle:w.dockAnim.from.angle});
 assert.ok(near(stationPorts(station)[s.berth.port].dir,Math.PI),'sas ouest');
 assert.ok(exit.x!==s.x||exit.y!==s.y);
});

test('amarrage : le cap assisté vise le sas, amarrage accepté depuis l’extérieur de la station',()=>{
 const w=createWorld(),s=w.ship;command(w,'dock');w.time+=5;w.dockAnim=null;
 const port=stationPorts(station)[1],pose=berthPose(port,s.hullId);
 Object.assign(s,{x:pose.x+Math.cos(port.dir)*150,y:pose.y+Math.sin(port.dir)*150,vx:0,vy:0});
 assert.ok(Math.hypot(s.x-station.x,s.y-station.y)>220,'hors de l’ancienne portée');
 const goal=approachPoint(station,s);assert.ok(near(goal.x,pose.x)&&near(goal.y,pose.y));
 command(w,'dock');assert.equal(s.docked,true);assert.equal(s.berth.port,1);
});

test('amarrage : changer de coque à quai recule le vaisseau selon sa longueur',()=>{
 const w=createWorld(),s=w.ship;const before=Math.hypot(s.x,s.y);
 Object.assign(s,{ownedHulls:['sillon','filon'],miningXp:9999,cargo:0,cargoItems:{}});
 command(w,'board','filon');assert.equal(s.hullId,'filon');
 assert.ok(Math.hypot(s.x,s.y)>before+50);
});

test('amarrage : ancienne sauvegarde à quai au centre replacée au sas, amarrage de station secondaire',()=>{
 const w=createWorld();Object.assign(w.ship,{docked:true,x:0,y:0,berth:undefined});
 initUniverse(w,{systemId:'oree',portId:'hub',sectors:w.sectors,depots:w.depots});
 assert.ok(Math.hypot(w.ship.x,w.ship.y)>150);assert.equal(w.dockAnim,null);
 const p=point(w,'station-a');Object.assign(w.ship,{docked:false,x:p.x+120,y:p.y,vx:0,vy:0});
 universeCommand(w,'port','station-a',capacity);
 assert.equal(w.ship.docked,true);assert.equal(w.ship.berth.portId,'station-a');
 assert.ok(Math.hypot(w.ship.x-p.x,w.ship.y-p.y)>60);assert.ok(w.ship.x>p.x,'côté d’approche');
 step(w,{thrust:true},.05);assert.deepEqual([w.ship.vx,w.ship.vy],[0,0],'immobile à quai');
});

test('amarrage en vol : le visiteur accoste le flanc de l’hôte, côté visiteur, sans chevauchement',()=>{
 for(const hostHull of ['sillon','filon'])for(const guestHull of ['sillon','strate'])for(const angle of [0,1.2,-2.5]){
  const host={x:500,y:-200,angle,hullId:hostHull};
  for(const side of [1,-1]){
   const n=host.angle+side*Math.PI/2,w=createWorld();
   Object.assign(w.ship,{docked:false,hullId:guestHull,x:host.x+Math.cos(n)*120,y:host.y+Math.sin(n)*120,vx:3,vy:0,angle:0});w.time=4;
   const pose=moorGuest(w,host);
   assert.equal(w.mooring.side,side,'flanc du côté du visiteur');
   const port=w.mooring.port,nose=noseOf(pose,guestHull);
   assert.ok(near(Math.hypot(nose.x-port.x,nose.y-port.y),DOCK.arm,1e-6),'nez au bout du bras');
   assert.ok(Math.hypot(pose.x-host.x,pose.y-host.y)>hullLength(hostHull)*.22+hullLength(guestHull)*.45,'coques séparées');
   assert.deepEqual([w.ship.vx,w.ship.vy,w.ship.docked],[0,0,false]);assert.equal(w.dockAnim.kind,'dock');
   assert.equal(mooringArm(host,{...pose,hullId:guestHull}).extension,1,'l’hôte voit le bras une fois le visiteur arrivé');
   assert.equal(mooringArm(host,{...pose,hullId:guestHull,x:pose.x+80}).extension,0,'pas de bras pendant l’approche');
   const exit=unmoorGuest(w);assert.equal(w.mooring,null);assert.equal(w.dockAnim.kind,'undock');
   assert.ok(Math.hypot(exit.x-host.x,exit.y-host.y)>Math.hypot(pose.x-host.x,pose.y-host.y),'s’écarte de l’hôte');
  }
 }
 const mate={x:0,y:0,vx:0,vy:0,docked:false};
 assert.equal(canMoor({x:100,y:0,vx:5,vy:0,docked:false},mate),true);
 assert.equal(canMoor({x:200,y:0,vx:0,vy:0,docked:false},mate),false,'trop loin');
 assert.equal(canMoor({x:100,y:0,vx:30,vy:0,docked:false},mate),false,'trop rapide');
 assert.equal(canMoor({x:100,y:0,vx:0,vy:0,docked:false},{...mate,vx:25}),false,'coéquipier trop rapide');
 assert.equal(canMoor({x:100,y:0,vx:0,vy:0,docked:true},mate),false,'à quai');
 assert.equal(canMoor({x:100,y:0,vx:42,vy:0,docked:false},{...mate,vx:40}),true,'coéquipier à la dérive rattrapé : vitesse relative');
});

test('amarrage : bras du coéquipier retrouvé depuis sa pose, sections télescopiques',()=>{
 const p={id:'hub',kind:'port',category:'hub',variant:0,x:0,y:0},port=stationPorts(p)[2],pose=berthPose(port,'veine');
 assert.equal(berthNear([p],{...pose,x:pose.x+5},'veine').index,2);
 assert.equal(berthNear([p],{x:5000,y:0,angle:0},'veine'),null);
 const g=armSections({x:0,y:0},{x:30,y:40},.5);
 assert.equal(g.length,25);assert.ok(g.sections.every(s=>s.start+s.length<=g.length+1e-9));
 assert.ok(g.sections[0].width>g.sections[2].width,'sections de plus en plus fines');
});
