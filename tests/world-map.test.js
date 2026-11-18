import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldLinks,worldRegions,worldSystems} from '../sector-ui.js';

const worldMapCss=readFileSync(new URL('../world-map.css',import.meta.url),'utf8');
const sectorUiSource=readFileSync(new URL('../sector-ui.js',import.meta.url),'utf8');

function distanceToSegment(point,start,end){
 const dx=end.x-start.x,dy=end.y-start.y;
 const length2=dx*dx+dy*dy;
 if(!length2)return Math.hypot(point.x-start.x,point.y-start.y);
 const t=Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.y-start.y)*dy)/length2));
 return Math.hypot(point.x-(start.x+t*dx),point.y-(start.y+t*dy));
}

test('carte du monde : 15 systèmes et région de base extensible',()=>{
 assert.equal(Object.keys(worldSystems).length,15);
 assert.equal(worldSystems.oree.name,'ORÉE');
 assert.equal(worldRegions[0].id,'marches-oree');
 assert.equal(worldRegions[0].name,'Les Marches d’Orée');
 assert.equal(worldRegions[0].systems,worldSystems);
 assert.equal(worldRegions[0].links,worldLinks);
 assert.equal(worldRegions[0].width,1700);
 assert.equal(worldRegions[0].height,700);
});

test('carte du monde : systèmes reliés plus largement espacés',()=>{
 for(const [a,b] of worldLinks){
  const distance=Math.hypot(worldSystems[a].x-worldSystems[b].x,worldSystems[a].y-worldSystems[b].y);
  assert.ok(distance>=200,a+' et '+b+' sont trop proches');
 }
});

test('carte du monde : tous les systèmes restent dans une zone verticale sûre',()=>{
 for(const [id,data] of Object.entries(worldSystems)){
  assert.ok(data.y>=120,id+' est trop près du bord supérieur');
  assert.ok(data.y<=580,id+' est trop près du bord inférieur');
 }
});

test('carte du monde : les systèmes d’une même bande ne se chevauchent pas horizontalement',()=>{
 const systems=Object.entries(worldSystems);
 for(let i=0;i<systems.length;i++)for(let j=i+1;j<systems.length;j++){
  const [a,sa]=systems[i],[b,sb]=systems[j];
  if(sa.y!==sb.y)continue;
  assert.ok(Math.abs(sa.x-sb.x)>=140,a+' et '+b+' sont trop proches sur la même bande');
 }
});

test('carte du monde : STYX ne masque plus la liaison CÉRÈS–NÉRÉIDE',()=>{
 const styx=worldSystems.styx,ceres=worldSystems.ceres,nereide=worldSystems.nereide;
 assert.ok(Math.hypot(styx.x-ceres.x,styx.y-ceres.y)>=200,'STYX et CÉRÈS restent trop proches');
 assert.ok(distanceToSegment(styx,nereide,ceres)>=70,'STYX masque encore la liaison CÉRÈS–NÉRÉIDE');
});

test('carte du monde : noms sur une ligne et défilement uniquement horizontal',()=>{
 assert.match(worldMapCss,/\.system-node strong\{[\s\S]*?white-space:nowrap!important/);
 assert.match(worldMapCss,/\.world-map-viewport\{[\s\S]*?overflow-x:auto!important;[\s\S]*?overflow-y:hidden!important/);
 assert.match(worldMapCss,/touch-action:pan-x/);
 assert.match(worldMapCss,/\.world-window\[open\]\{display:flex\}/);
 assert.doesNotMatch(worldMapCss,/\.world-window\s*\{[^}]*display\s*:\s*flex/s);
});

test('carte du monde : titre avant les onglets et Marches d’Orée sélectionnées par défaut',()=>{
 assert.doesNotMatch(sectorUiSource,/NAVIGATION STELLAIRE/);
 assert.match(sectorUiSource,/world-map-title\">Carte du monde<\/h2>[\s\S]*?world-tabs/);
 assert.match(sectorUiSource,/let activeRegion=worldRegions\[0\]/);
 assert.match(sectorUiSource,/renderRegion\(activeRegion\.id\)/);
});
