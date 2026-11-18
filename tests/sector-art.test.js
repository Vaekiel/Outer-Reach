import test from 'node:test';
import assert from 'node:assert/strict';

const drawCalls=[];
const ctx=new Proxy({
 drawImage(...args){drawCalls.push(args);},
 fillRect(){}
},{get(target,key){return key in target?target[key]:()=>{};}});
globalThis.document={createElement:()=>({width:128,height:128,getContext:()=>ctx})};
globalThis.Image=class{complete=false;naturalWidth=0;naturalHeight=0;};

const {drawContact}=await import('../sector-art.js');

test('les deux avant-postes industriels utilisent de vrais sprites 32x32 à échelle entière',()=>{
 drawCalls.length=0;
 drawContact(ctx,{id:'outpost',kind:'port',name:'Fonderie des Roches'},0,0,1);
 assert.equal(drawCalls.length,1);
 const foundry=drawCalls[0][0];
 assert.equal(foundry.width,32);
 assert.equal(foundry.height,32);
 assert.equal(drawCalls[0][3]%32,0);
 assert.equal(drawCalls[0][4]%32,0);

 drawCalls.length=0;
 drawContact(ctx,{id:'outpost',kind:'port',name:'Raffinerie du Seuil'},0,0,1);
 assert.equal(drawCalls.length,1);
 const refinery=drawCalls[0][0];
 assert.equal(refinery.width,32);
 assert.equal(refinery.height,32);
 assert.equal(drawCalls[0][3]%32,0);
 assert.equal(drawCalls[0][4]%32,0);
 assert.notEqual(refinery,foundry);
});

const {stationStyle,stationSprite,drawStation}=await import('../station-art.js');
test('douze architectures de ports distinctes, avec une taille par catégorie',()=>{
 const tiles=new Set();
 for(const category of ['hub','refinery','station'])for(let variant=0;variant<4;variant++){
  const p={category,variant};tiles.add(stationSprite(p));drawCalls.length=0;
  drawStation(ctx,p,10,20,1,0);
  assert.equal(drawCalls[0][3],stationStyle(p).size);
  assert.equal(stationSprite(p),stationSprite(p));
 }
 assert.equal(tiles.size,12);
 assert.ok(stationStyle({category:'hub'}).size>stationStyle({category:'refinery'}).size);
 assert.ok(stationStyle({category:'refinery'}).size>stationStyle({category:'station'}).size);
});

const {systems,points}=await import('../universe.js');
test('les quinze systèmes conservent une raffinerie et deux petites stations',()=>{
 const variants={refinery:new Set(),station:new Set()};let count=0;
 for(const systemId of Object.keys(systems)){
  const ports=points({systemId}).filter(p=>p.category==='refinery'||p.category==='station');
  assert.equal(ports.filter(p=>p.category==='refinery').length,1);
  assert.equal(ports.filter(p=>p.category==='station').length,2);
  for(const p of ports){const style=stationStyle(p);variants[p.category].add(style.variant);assert.equal(style.size,p.category==='refinery'?288:160);count++;}
 }
 assert.equal(count,45);assert.equal(variants.refinery.size,4);assert.equal(variants.station.size,4);
});
