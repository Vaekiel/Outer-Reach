import test from 'node:test';
import assert from 'node:assert/strict';
import {trafficAt,radioLine} from '../traffic.js';
import {ambiences} from '../ambience.js';

test('Orée conserve six civils : quatre modèles validés et deux mineurs',()=>{
 const fleet=trafficAt(0,[],'oree');
 assert.equal(fleet.length,6);assert.equal(new Set(fleet.map(n=>n.id)).size,6);
 assert.deepEqual(fleet.slice(0,4).map(n=>n.model),['alouette','estafette','grappin','chaland']);
 assert.deepEqual(fleet.slice(4).map(n=>n.hullId),['sillon','veine']);
});
test('vitesses et activités reflètent les rôles civils',()=>{
 const fleet=trafficAt(0),speeds={};
 for(const n of fleet.slice(0,4)){
  const t=((.275-n.phase+1)%1)*n.period;
  const a=trafficAt(t).find(x=>x.id===n.id),b=trafficAt(t+.01).find(x=>x.id===n.id);
  speeds[n.model]=Math.hypot(b.x-a.x,b.y-a.y)/.01;
  const stop=((.5-n.phase+1)%1)*n.period,parked=trafficAt(stop).find(x=>x.id===n.id);
  assert.equal(parked.state,n.arrival);assert.equal(parked.moving,false);
  const line=radioLine({time:stop,ship:{x:parked.x,y:parked.y},traffic:[parked]});
  assert.ok(line.startsWith(n.name+' / '));
 }
 assert.ok(speeds.grappin<speeds.chaland&&speeds.chaland<speeds.alouette&&speeds.alouette<speeds.estafette);
});
test('trafic neutre sans consommation de minerai et limité à Orée',()=>{
 const ores=[{id:0,x:700,y:-650,ore:100}],before=structuredClone(ores);
 for(let time=0;time<400;time+=5)for(const n of trafficAt(time,ores)){
  assert.equal(n.hostile,false);assert.ok(Number.isFinite(n.x)&&Number.isFinite(n.y)&&Number.isFinite(n.angle));
 }
 assert.deepEqual(ores,before);
 for(const system of Object.keys(ambiences).filter(id=>id!=='oree'))assert.ok(trafficAt(80,ores,system).every(n=>!n.model&&!n.hullId));
});
