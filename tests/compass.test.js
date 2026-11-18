import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPASS,MARKER_STYLES,formatDistance,routeNextSystem,gateToward,mateGoal,compassMarkers} from '../compass.js';
import {createWorld,command,step,speed} from '../simulation.js';
import {point,neighbors} from '../universe.js';
import {guidance} from '../navigation.js';
import {worldLinks} from '../galaxy.js';

const flying=(x=0,y=900)=>{const w=createWorld();command(w,'dock');w.time+=5;w.dockAnim=null;Object.assign(w.ship,{x,y,vx:0,vy:0});return w;};

test('boussole : distances lisibles',()=>{
 assert.equal(formatDistance(0),'0 m');assert.equal(formatDistance(849.6),'850 m');
 assert.equal(formatDistance(1234),'1,2 km');assert.equal(formatDistance(9960),'10,0 km');assert.equal(formatDistance(12400),'12 km');
});

test('boussole : plus court chemin entre systèmes et porte correspondante',()=>{
 for(const [a,b] of worldLinks){assert.equal(routeNextSystem(a,b),b);assert.equal(routeNextSystem(b,a),a);}
 const hop=routeNextSystem('oree','aube');assert.ok(['lisiere','concorde'].includes(hop),hop);
 // Suivre les étapes mène bien à destination, en 3 sauts depuis ORÉE.
 let here='oree',jumps=0;while(here!=='aube'&&jumps<10){here=routeNextSystem(here,'aube');jumps++;}
 assert.equal(here,'aube');assert.equal(jumps,3);
 assert.equal(routeNextSystem('oree','oree'),null);assert.equal(routeNextSystem('oree','inconnu'),null);
 const w=flying();for(const n of neighbors('oree'))assert.equal(gateToward(w,n).destination,n);
 assert.equal(gateToward(w,'aube'),null,'pas de porte directe');
});

test('boussole : repère de la cible codé par type (station, gisement, porte, site, trafic, hostile)',()=>{
 const w=flying();
 const kindFor=target=>{w.target=target;return compassMarkers(w)[0];};
 const st=kindFor('station');assert.equal(st.kind,'port');assert.equal(st.color,MARKER_STYLES.port.color);assert.match(st.label,/ m$/);
 const ore=kindFor(w.asteroids[0].id);assert.equal(ore.kind,'ore');assert.equal(ore.color,'#f0a04b');
 assert.equal(kindFor('gate').kind,'gate');assert.equal(kindFor('gate').shape,'double');
 assert.equal(kindFor('archive').kind,'site');
 w.traffic=[{id:'civil-0',x:400,y:900},{id:'pirate-1',x:-300,y:900,hostile:true}];
 w.target='civil-0';assert.equal(compassMarkers(w).find(m=>Math.round(m.distance)===400).kind,'traffic','cible civile codée en bleu malgré l’hostile proche');
 const h=kindFor('pirate-1');assert.equal(h.kind,'hostile');assert.match(h.label,/^Hostile · /);
 assert.equal(compassMarkers(w).filter(m=>m.kind==='hostile').length,1,'la cible hostile n’est pas comptée deux fois');
 w.traffic=[];w.target=null;assert.deepEqual(compassMarkers(w),[]);
 const angle=kindFor('gate').angle,g=point(w,'gate');assert.ok(Math.abs(angle-Math.atan2(g.y-900,g.x))<1e-9,'orienté vers la destination');
});

test('boussole : hostiles proches (3 au plus, moins de 3 km), en tête de liste',()=>{
 const w=flying(0,0);w.target='station';
 w.traffic=[1,2,3,4].map(i=>({id:'h'+i,x:i*500,y:0,hostile:true})).concat([{id:'loin',x:COMPASS.hostileRange+10,y:0,hostile:true},{id:'neutre',x:100,y:0}]);
 Object.assign(w.ship,{x:0,y:0});
 const m=compassMarkers(w,{hideWithin:0});
 const hostiles=m.filter(x=>x.kind==='hostile');
 assert.equal(hostiles.length,COMPASS.maxHostiles);assert.deepEqual(hostiles.map(x=>Math.round(x.distance)),[500,1000,1500]);
 assert.equal(m[0].kind,'hostile','priorité aux menaces');
});

test('boussole : coéquipier ici, ou porte vers son système ; rien à quai ni trop près',()=>{
 const w=flying(0,900);
 let m=compassMarkers(w,{mate:{x:3000,y:900,pseudo:'Vekamel'}});
 assert.equal(m[0].kind,'mate');assert.equal(m[0].label,'Vekamel · 3,0 km');assert.equal(m[0].shape,'diamond');
 m=compassMarkers(w,{elsewhere:{pseudo:'Vekamel',systemId:'helios'}});
 const gate=gateToward(w,routeNextSystem('oree','helios'));
 assert.equal(m[0].kind,'mate-gate');assert.equal(m[0].label,'Vekamel · HÉLIOS');
 assert.ok(Math.abs(m[0].angle-Math.atan2(gate.y-900,gate.x))<1e-9,'pointe la porte');
 assert.deepEqual(mateGoal(w,null,{systemId:'helios'}),{x:gate.x,y:gate.y,gate});
 w.target=gate.id;m=compassMarkers(w,{elsewhere:{pseudo:'Vekamel',systemId:'helios'}});
 assert.equal(m.length,1,'porte ciblée et porte du coéquipier fusionnées');assert.equal(m[0].kind,'mate-gate');assert.match(m[0].label,/ · Vekamel · HÉLIOS$/);
 w.target=null;
 assert.equal(compassMarkers(w,{mate:{x:30,y:900}},).length,1);
 assert.equal(compassMarkers(w,{mate:{x:30,y:900},hideWithin:80}).length,0,'masqué dans l’anneau');
 w.ship.docked=true;assert.deepEqual(compassMarkers(w,{mate:{x:3000,y:900}}),[]);
});

test('boussole : repères proches en angle décalés vers l’extérieur',()=>{
 const w=flying(0,0);Object.assign(w.ship,{x:0,y:0});w.target=null;
 w.traffic=[{id:'a',x:1000,y:0,hostile:true},{id:'b',x:1000,y:60,hostile:true},{id:'c',x:0,y:1000,hostile:true}];
 const m=compassMarkers(w);
 assert.deepEqual(m.map(x=>x.level).sort(),[0,0,1]);
 const shifted=m.find(x=>x.level===1);assert.ok(Math.abs(shifted.angle-Math.atan2(60,1000))<1e-9,'le plus éloigné des deux repères voisins est décalé');
});

test('boussole : « Rejoindre » traverse une porte puis atteint le coéquipier',()=>{
 const w=flying(-200,300);w.ship.fuel=60;
 const mateHere={x:900,y:-400,pseudo:'Vekamel'};let jumped=false,arrived=false;
 for(let i=0;i<60*120&&!arrived;i++){
  const inLisiere=w.systemId==='lisiere';
  const goal=mateGoal(w,inLisiere?mateHere:null,inLisiere?null:{systemId:'lisiere'});
  const nav=guidance(w.ship,goal);
  if(nav.arrived){if(goal.gate){assert.ok(w.jumpReadyAt<=Date.now());command(w,'jump',goal.gate.id);jumped=w.systemId==='lisiere';assert.ok(jumped,w.notice);}else arrived=true;}
  step(w,nav.input,1/60);
 }
 assert.ok(jumped,'saut effectué');assert.ok(arrived,'coéquipier atteint');
 assert.ok(Math.hypot(w.ship.x-mateHere.x,w.ship.y-mateHere.y)<150);assert.ok(speed(w.ship)<5);
 // Sans carburant pour la porte, le saut est refusé avec un message clair.
 const dry=flying();const gate=gateToward(dry,'lisiere');Object.assign(dry.ship,{x:gate.x-100,y:gate.y,fuel:5});
 command(dry,'jump',gate.id);assert.equal(dry.systemId,'oree');assert.match(dry.notice,/8 %/);
});
