import test from 'node:test';
import assert from 'node:assert/strict';
import {hulls,normalizeCareer} from '../ships.js';
import {createWorld,command,step} from '../simulation.js';
import {miningLengths} from '../mining-art.js';

test('quatre classes minières et des silhouettes de taille croissante',()=>{
 const miners=hulls.filter(h=>h.family==='mining');
 assert.deepEqual(miners.map(h=>h.id),['sillon','veine','strate','filon']);
 assert.deepEqual(miners.map(h=>h.size),[1,2,3,4]);
 for(let i=1;i<miners.length;i++)assert.ok(miningLengths[miners[i].id]>miningLengths[miners[i-1].id]);
});
test('Filon se fabrique, se pilote, extrait du minerai et reste possédé après migration',()=>{
 const w=createWorld(),s=w.ship,h=hulls.find(h=>h.id==='filon');
 s.miningXp=h.xp;s.credits=h.fee;s.stock={...h.recipe};s.materials=s.stock.ferrite;
 command(w,'craft','filon');assert.ok(s.ownedHulls.includes('filon'));assert.equal(s.credits,0);
 command(w,'board','filon');assert.equal(s.hullId,'filon');
 const a=w.asteroids[0],initialOre=a.ore;
 Object.assign(s,{docked:false,x:a.x+40,y:a.y,vx:0,vy:0});w.target=a.id;w.mining=true;
 step(w,{},.05);assert.ok(s.cargo>0);assert.ok(a.ore<initialOre);assert.equal(w.extracting,true);
 normalizeCareer(s);assert.equal(s.hullId,'filon');assert.ok(s.ownedHulls.includes('sillon'));
});
