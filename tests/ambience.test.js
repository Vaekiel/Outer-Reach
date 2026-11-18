import test from 'node:test';
import assert from 'node:assert/strict';
import {ambiences,celestialBodies,musicProfile} from '../ambience.js';
import {systems} from '../universe.js';
import {trafficAt} from '../traffic.js';

test('chaque système possède une palette, des astres et une musique distincts',()=>{
 assert.deepEqual(Object.keys(ambiences).sort(),Object.keys(systems).sort());
 const positions=new Set(),music=new Set(),palettes=new Set();
 for(const id of Object.keys(systems)){
  const bodies=celestialBodies(id);positions.add(JSON.stringify(bodies));
  assert.deepEqual(bodies.slice(0,3).map(b=>b.kind),['planet','moon','sun']);
  assert.equal(new Set(bodies.map(b=>b.x+':'+b.y)).size,bodies.length);
  assert.deepEqual(bodies,celestialBodies(id));
  const p=musicProfile(id);music.add([p.transpose,p.tempo,p.motifShift].join());palettes.add(p.space+p.aurora);
 }
 assert.equal(positions.size,15);assert.equal(music.size,15);assert.equal(palettes.size,15);
 assert.equal(musicProfile('oree').transpose,0);assert.equal(musicProfile('oree').tempo,1);
});
test('Orée seule reçoit les petits astres détaillés, avec exactement une lune et un soleil',()=>{
 for(const id of Object.keys(systems)){
  const bodies=celestialBodies(id);
  assert.equal(bodies.filter(b=>b.kind==='sun').length,1);
  assert.equal(bodies.filter(b=>b.kind==='moon').length,1);
  if(id!=='oree'){
   assert.equal(bodies.length,3);
   assert.ok(bodies.every(b=>b.celestialTile===undefined));
  }else{
   assert.equal(bodies.filter(b=>b.kind==='distant-planet').length,2);
   assert.ok(bodies.slice(1).every(b=>b.radius<bodies[0].radius/2));
   assert.equal(new Set(bodies.slice(1).map(b=>b.celestialTile)).size,4);
  }
 }
});
test('les civils restent neutres et les trajectoires varient selon le système',()=>{
 assert.equal(trafficAt(0,[],'oree').length,6);
 for(const id of Object.keys(systems))assert.ok(trafficAt(80,[],id).every(n=>n.hostile===false&&Number.isFinite(n.x)&&Number.isFinite(n.y)));
 assert.notDeepEqual(trafficAt(80,[],'oree'),trafficAt(80,[],'lisiere'));
});
