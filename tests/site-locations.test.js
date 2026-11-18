import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../simulation.js';
import {point,points,refreshSites,saveUniverse,initUniverse} from '../universe.js';
import {relocateSite} from '../site-locations.js';

test('relocateSite normalise -0 en 0 (stabilité JSON au rechargement)',()=>{
 const seq=[0.49995,0.75,0,0];let i=0;
 const locations={archive:{x:-650,y:-600,variant:0,palette:0,history:[]}};
 assert.equal(relocateSite(locations,'archive',[],()=>seq[i++%seq.length]),true);
 assert.equal(locations.archive.y,1300);
 assert.ok(Object.is(locations.archive.x,0),'x doit être +0, pas -0');
 assert.deepEqual(JSON.parse(JSON.stringify(locations.archive)),locations.archive);
});

test('un site attend son échéance puis change de lieu sans réutiliser ses positions',()=>{
 const w=createWorld(),seen=new Set();
 for(let i=0;i<25;i++){
  const p=point(w,'archive');seen.add(p.x+':'+p.y);
  w.sectors.oree.sites.archive=2000+i;
  refreshSites(w,'oree',1999+i,()=>.5);assert.equal(point(w,'archive').x,p.x);
  refreshSites(w,'oree',2000+i,()=>.5);
  const next=point(w,'archive');assert.ok(!seen.has(next.x+':'+next.y));
  assert.ok(Math.hypot(next.x-p.x,next.y-p.y)>=650);
  for(const q of [...points(w).filter(q=>q.id!=='archive'),...w.asteroids])assert.ok(Math.hypot(next.x-q.x,next.y-q.y)>=350+(q.radius||0));
 }
});

test('sauvegarde des positions, variantes et délais sans déplacement au rechargement',()=>{
 const w=createWorld();w.sectors.oree.sites.archive=Date.now()+600000;
 const data=JSON.parse(JSON.stringify(saveUniverse(w))),restored=createWorld();initUniverse(restored,data);
 assert.deepEqual(restored.sectors.oree.siteLocations,w.sectors.oree.siteLocations);
 assert.equal(point(restored,'archive').available,false);
 assert.equal(restored.sectors.oree.sites.archive,data.sectors.oree.sites.archive);
});

test('un délai expiré hors ligne provoque un seul nouvel emplacement',()=>{
 const w=createWorld(),old=point(w,'wreck');w.sectors.oree.sites.wreck=Date.now()-1;
 const data=JSON.parse(JSON.stringify(saveUniverse(w))),restored=createWorld();initUniverse(restored,data);
 const next=point(restored,'wreck');assert.ok(Math.hypot(next.x-old.x,next.y-old.y)>=650);
 assert.equal(restored.sectors.oree.sites.wreck,0);
 const second=createWorld();initUniverse(second,JSON.parse(JSON.stringify(saveUniverse(restored))));
 assert.deepEqual(second.sectors.oree.siteLocations,restored.sectors.oree.siteLocations);
});
