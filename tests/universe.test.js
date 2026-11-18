import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,command,step,capacity,station} from '../simulation.js';
import {refreshOres,initUniverse,saveUniverse,point,universeCommand,universeStep,systems,RESPAWN_MS} from '../universe.js';
import {worldLinks,worldSystems} from '../sector-ui.js';
import {hullError} from '../ships.js';
import {unitPrice,normalizeResources,saleValue} from '../resources.js';
import {hackingTest} from '../hacking.js';
const at=(w,id)=>{const p=point(w,id);Object.assign(w.ship,{x:p.x,y:p.y,vx:0,vy:0,docked:false});};
test('carte du monde : quinze systèmes espacés et liaisons valides',()=>{assert.equal(Object.keys(worldSystems).length,15);assert.equal(systems.oree.security,'secure');assert.equal(systems.lisiere.security,'hostile');for(const [a,b] of worldLinks){assert.ok(worldSystems[a]);assert.ok(worldSystems[b]);assert.ok(Math.hypot(worldSystems[a].x-worldSystems[b].x,worldSystems[a].y-worldSystems[b].y)>=150,a+' et '+b+' sont trop proches');}});
test('respawn indépendant à échéance, sans remplir un gisement partiel',()=>{const w=createWorld(),a=w.asteroids[0],b=w.asteroids[1];a.ore=0;b.ore=12;refreshOres(w.asteroids,1000);assert.equal(a.respawnAt,1000+RESPAWN_MS);refreshOres(w.asteroids,300999);assert.equal(a.ore,0);refreshOres(w.asteroids,301000);assert.equal(a.ore,a.maxOre);assert.equal(b.ore,12);assert.equal(a.respawnAt,0);});
test('minage démarre le délai à épuisement et progresse à quai',()=>{const w=createWorld(),a=w.asteroids[0];Object.assign(w.ship,{docked:false,x:a.x,y:a.y});a.ore=.01;w.target=0;w.mining=true;step(w,{},.05);assert.equal(a.ore,0);assert.ok(a.respawnAt>Date.now());a.respawnAt=Date.now()-1;w.ship.docked=true;step(w,{},.05);assert.equal(a.ore,a.maxOre);});
test('transit : proximité, vitesse, carburant, aller-retour sans recréer le minerai',()=>{const w=createWorld();w.asteroids[0].ore=7;w.ship.docked=false;command(w,'jump','gate');assert.equal(w.systemId,'oree');at(w,'gate');w.ship.fuel=7;command(w,'jump','gate');assert.equal(w.systemId,'oree');w.ship.fuel=100;w.ship.vx=21;command(w,'jump','gate');assert.equal(w.systemId,'oree');w.ship.vx=0;command(w,'jump','gate');assert.equal(w.systemId,'lisiere');assert.equal(w.ship.fuel,92);assert.ok(w.asteroids.some(a=>a.resource==='ruthenium'));at(w,'gate');universeCommand(w,'jump','gate',capacity,Date.now()+9000);assert.equal(w.systemId,'oree');assert.equal(w.asteroids[0].ore,7);});
test('stocks locaux et tarifs différents ; vente cohérente avec affichage',()=>{const w=createWorld();w.ship.cargoItems={copper:4};command(w,'deposit');assert.equal(w.ship.stock.copper,4);const low=unitPrice(w.ship,'copper');command(w,'dock');at(w,'outpost');command(w,'port','outpost');assert.equal(w.ship.stock.copper,undefined);assert.ok(unitPrice(w.ship,'copper')>low);w.ship.cargoItems={copper:2};normalizeResources(w.ship);const expected=saleValue(w.ship),before=w.ship.credits;command(w,'sell');assert.equal(w.ship.credits-before,expected);command(w,'dock');assert.equal(w.ship.x,station.x);at(w,'hub');command(w,'port','hub');assert.equal(w.ship.stock.copper,4);});
test('sites verrouillés sans décodeur et mini-jeu connecté seulement une fois résolu',()=>{const w=createWorld();at(w,'archive');universeCommand(w,'scan','archive',capacity,1000);assert.equal(w.hackRequest,null);assert.match(w.notice,/Décodeur/);w.ship.modules.push('decryptor');universeCommand(w,'scan','archive',capacity,1000);assert.equal(w.hackRequest,'archive');assert.equal(w.scan,null);assert.equal(hackingTest.connected(hackingTest.solved),true);const broken=[...hackingTest.solved];broken[5]=hackingTest.rotate(broken[5]);assert.equal(hackingTest.connected(broken),false);});
test('sondage : piratage, récompense unique, délai et interruption',()=>{const w=createWorld();w.ship.modules.push('decryptor');at(w,'archive');universeCommand(w,'scan','archive',capacity,1000);universeCommand(w,'hack','archive',capacity,1000);for(let i=0;i<322;i++)universeStep(w,.05,capacity,1000);assert.equal(w.ship.cargoItems.telemetry,2);assert.equal(w.ship.explorationXp,15);universeCommand(w,'scan','archive',capacity,1001);assert.equal(w.scan,null);at(w,'wreck');universeCommand(w,'scan','wreck',capacity,1001);universeCommand(w,'hack','wreck',capacity,1001);w.ship.x+=181;universeStep(w,.05,capacity,1001);assert.equal(w.scan,null);assert.equal(w.ship.explorationXp,15);});
test('soute pleine : aucun butin ou XP gratuit',()=>{const w=createWorld();at(w,'wreck');w.ship.cargoItems={ferrite:30};normalizeResources(w.ship);command(w,'scan','wreck');assert.equal(w.scan,null);assert.equal(w.ship.explorationXp,0);});
test('brevet exploration distinct de possession ; fabrication consomme les matériaux',()=>{const w=createWorld();w.ship.miningXp=10000;assert.match(hullError(w.ship,'aiguille'),/exploration/);w.ship.explorationXp=45;assert.match(hullError(w.ship,'aiguille',true),/Fabriquez/);Object.assign(w.ship.stock,{ferrite:60,wire:8,silicon:8,alloy:2});w.ship.credits=300;command(w,'craft','aiguille');assert.ok(w.ship.ownedHulls.includes('aiguille'));assert.equal(w.ship.stock.alloy,0);assert.equal(w.ship.credits,20);command(w,'board','aiguille');assert.equal(w.ship.hullId,'aiguille');});
test('sauvegarde : deux secteurs, délais, port et stocks conservés',()=>{const w=createWorld();w.asteroids[0].ore=0;w.asteroids[0].respawnAt=Date.now()+123000;w.ship.stock.ferrite=11;at(w,'gate');command(w,'jump','gate');at(w,'outpost');command(w,'port','outpost');w.ship.stock.ruthenium=5;const data=JSON.parse(JSON.stringify({ship:w.ship,universe:saveUniverse(w)}));const loaded=createWorld();loaded.ship=data.ship;initUniverse(loaded,data.universe);assert.equal(loaded.systemId,'lisiere');assert.equal(loaded.portId,'outpost');assert.equal(loaded.ship.stock.ruthenium,5);assert.equal(loaded.depots['oree:hub'].ferrite,11);assert.equal(loaded.sectors.oree.asteroids[0].respawnAt,w.sectors.oree.asteroids[0].respawnAt);});
test('ancienne sauvegarde : minerais épuisés reçoivent un délai',()=>{const w=createWorld();w.asteroids[0].ore=0;w.ship.stock={ferrite:13};initUniverse(w);assert.equal(w.asteroids[0].ore,0);assert.ok(w.asteroids[0].respawnAt>Date.now());assert.equal(w.ship.stock.ferrite,13);});
test('rechargement après saut en vol ne duplique pas le stock du port quitté',()=>{const w=createWorld();w.ship.stock.ferrite=40;at(w,'gate');command(w,'jump','gate');const saved=JSON.parse(JSON.stringify({ship:w.ship,universe:saveUniverse(w)}));const restored=createWorld();restored.ship=saved.ship;initUniverse(restored,saved.universe);at(restored,'hub');command(restored,'port','hub');assert.equal(restored.ship.stock.ferrite,undefined);assert.equal(restored.depots['oree:hub'].ferrite,40);});
test('refroidissement actif (manette L1) dissipe la chaleur plus vite que le passif',()=>{const w=createWorld();w.ship.docked=false;w.ship.heat=50;step(w,{},1);const passive=w.ship.heat;w.ship.heat=50;step(w,{cool:true},1);assert.ok(w.ship.heat<passive,'le refroidissement actif doit descendre plus bas que le passif en 1s');});

test('quinze secteurs, soixante ports et cinq minerais répartis selon la sécurité',()=>{
 const w=createWorld(),ores=new Set();
 assert.equal(Object.keys(w.sectors).length,15);
 for(const [id,c] of Object.entries(systems)){
  w.systemId=id;const ports=['hub','outpost','station-a','station-b'].map(key=>point(w,key));
  assert.equal(ports.filter(p=>p.category==='hub').length,1);
  assert.equal(ports.filter(p=>p.category==='refinery').length,1);
  assert.equal(ports.filter(p=>p.category==='station').length,2);
  const rocks=w.sectors[id].asteroids;rocks.forEach(a=>ores.add(a.resource));
  const rare=rocks.filter(a=>a.resource==='ruthenium').length;
  assert.equal(rare,c.security==='secure'?0:c.security==='hostile'?6:24);
 }
 assert.equal(ores.size,5);
});

test('les 21 liaisons se parcourent dans les deux sens et arrivent à la bonne porte',async()=>{
 const {points}=await import('../universe.js');
 for(const link of worldLinks)for(const [origin,destination] of [link,[...link].reverse()]){
  const w=createWorld();w.systemId=origin;w.asteroids=w.sectors[origin].asteroids;
  const gate=points(w).find(p=>p.destination===destination);assert.ok(gate);
  at(w,gate.id);universeCommand(w,'jump',gate.id,capacity,10000);
  assert.equal(w.systemId,destination);assert.equal(w.ship.fuel,92);
  const back=points(w).find(p=>p.destination===origin);
  assert.equal(w.ship.x,back.x-220);assert.equal(w.ship.y,back.y);
 }
});

test('les deux petites stations conservent des stocks séparés après rechargement',()=>{
 const w=createWorld();at(w,'station-a');command(w,'port','station-a');
 w.ship.cargoItems={ferrite:3};command(w,'deposit');
 at(w,'station-b');command(w,'port','station-b');assert.equal(w.ship.stock.ferrite,undefined);
 const data=JSON.parse(JSON.stringify({ship:w.ship,universe:saveUniverse(w)}));
 const loaded=createWorld();loaded.ship=data.ship;initUniverse(loaded,data.universe);
 assert.equal(loaded.portId,'station-b');assert.equal(loaded.depots['oree:station-a'].ferrite,3);
});
