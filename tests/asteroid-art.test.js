import test from 'node:test';
import assert from 'node:assert/strict';
import {resources} from '../resources.js';
import {asteroidTile} from '../asteroid-art.js';

test('les cinq minerais minables ont chacun deux silhouettes distinctes',()=>{
 const ores=Object.keys(resources).filter(id=>resources[id].color),tiles=new Set();
 assert.equal(ores.length,5);
 for(const resource of ores){
  const a={id:0,resource,ore:60},b={id:1,resource,ore:60};
  assert.notEqual(asteroidTile(a),asteroidTile(b));
  tiles.add(asteroidTile(a));tiles.add(asteroidTile(b));
  assert.equal(asteroidTile(a),asteroidTile({...a,ore:0,respawnAt:1234}));
 }
 assert.equal(tiles.size,10);
});
test('les anciennes sauvegardes sans minerai gardent la ferrite',()=>{
 assert.equal(asteroidTile({id:7}),asteroidTile({id:7,resource:'ferrite'}));
});
