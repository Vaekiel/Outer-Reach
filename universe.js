import {siteIds,restoreSiteLocations,relocateSite} from './site-locations.js';
import {worldSystems,worldLinks} from './galaxy.js';
import {getHull} from './ships.js';
import {normalizeResources,total} from './resources.js';
import {berthShip,refreshBerth} from './docking.js';

export const RESPAWN_MS=300000, SITE_RESPAWN_MS=600000;
export const systems=Object.fromEntries(Object.entries(worldSystems).map(([id,s],index)=>[id,{
 ...s,index,depth:s.security==='secure'?0:s.security==='hostile'?1:2,
 hub:id==='oree'?'Relais-9':id==='lisiere'?'Havre des Confins':'Hub '+s.name,
 outpost:id==='oree'?'Fonderie des Roches':id==='lisiere'?'Raffinerie du Seuil':'Raffinerie '+s.name,
 specialty:s.security==='secure'?'copper':'ruthenium',
 next:neighbors(id)[0]
}]));
export function neighbors(id){return worldLinks.filter(link=>link.includes(id)).map(([a,b])=>a===id?b:a);}
export const station={x:0,y:0,name:'Relais-9'};
export const sector=w=>systems[w.systemId]||systems.oree;
export function points(w){const c=sector(w),id=w.systemId||'oree';return [
 {id:'hub',kind:'port',category:'hub',variant:c.index%4,x:0,y:0,name:c.hub},
 {id:'outpost',kind:'port',category:'refinery',variant:c.index%4,x:-900,y:700,name:c.outpost},
 {id:'station-a',kind:'port',category:'station',variant:(c.index+1)%4,x:-1600,y:-150,name:'Station '+c.name+' I'},
 {id:'station-b',kind:'port',category:'station',variant:(c.index+2)%4,x:650,y:1650,name:'Station '+c.name+' II'},
 ...neighbors(id).map((destination,i)=>({id:i===0?'gate':'gate-'+destination,kind:'gate',destination,x:i===0?1500:Math.round(Math.cos(i*2.4)*2300),y:i===0?400:Math.round(Math.sin(i*2.4)*2300),name:'Porte → '+systems[destination].name})),
 ...siteIds.map(siteId=>({id:siteId,kind:siteId,...(w.sectors?.[id]?.siteLocations?.[siteId]||restoreSiteLocations()[siteId]),available:!(w.sectors?.[id]?.sites?.[siteId]>Date.now()),name:siteId==='archive'?'Archive de télémétrie':'Épave patrimoniale'}))
 ];}
export const point=(w,id)=>points(w).find(p=>p.id===id);
export function countdown(at,now=Date.now()){const n=Math.max(0,Math.ceil((at-now)/1000));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
export const oreStatus=a=>a.ore>0?Math.ceil(a.ore)+' t disponibles':'Retour '+countdown(a.respawnAt||Date.now()+RESPAWN_MS);
export function refreshOres(asteroids,now=Date.now()){
 for(const a of asteroids){if(a.ore>0){a.respawnAt=0;continue;}if(!Number.isFinite(a.respawnAt)||a.respawnAt<=0)a.respawnAt=now+RESPAWN_MS;if(now>=a.respawnAt){a.ore=a.maxOre;a.respawnAt=0;}}
}
export const oreProfiles={
 secure:['ferrite','copper','silica','titanium'],
 hostile:['copper','silica','titanium','ruthenium'],
 anarchic:['ruthenium','copper','silica','titanium']
};
function populate(base,id){
 const c=systems[id],angle=c.index<2?0:c.index*.73,cos=Math.cos(angle),sin=Math.sin(angle);
 return base.map((a,i)=>({...a,x:Math.round(a.x*cos-a.y*sin),y:Math.round(a.x*sin+a.y*cos),ore:a.maxOre||a.ore,maxOre:a.maxOre||a.ore,respawnAt:0,resource:oreProfiles[c.security][i<24?0:1+Math.floor((i-24)/6)]}));
}
export function bindPort(w,id=w.portId||'hub'){
 const p=point(w,id);w.portId=p?.kind==='port'?id:'hub';Object.assign(station,point(w,w.portId));
 w.ship.marketFactor=w.portId==='hub'?.8:1;w.ship.specialty=w.portId==='outpost'?sector(w).specialty:null;
}
export function initUniverse(w,saved={}){
 const base=w.asteroids.map(a=>({...a,maxOre:a.maxOre||35+(a.id<24?a.id:(a.id-24)%6)%4*15,respawnAt:a.respawnAt||0}));
 w.systemId=systems[saved.systemId]?saved.systemId:'oree';w.sectors={};
 for(const id of Object.keys(systems)){
  const asteroids=populate(base,id),prior=saved.sectors?.[id];
  for(const a of asteroids){const old=prior?.asteroids?.find(x=>x.id===a.id);if(old){a.ore=Math.min(a.maxOre,Math.max(0,Number(old.ore)||0));a.respawnAt=Number(old.respawnAt)||0;}else if(id==='oree'&&!saved.sectors){a.ore=base[a.id].ore;a.respawnAt=base[a.id].respawnAt;}}
  w.sectors[id]={asteroids,siteLocations:restoreSiteLocations(prior?.siteLocations),sites:{archive:Math.max(0,Number(prior?.sites?.archive)||0),wreck:Math.max(0,Number(prior?.sites?.wreck)||0)}};
  refreshOres(asteroids);
 }
 for(const id of Object.keys(systems)){
  if(!saved.sectors?.[id])for(const siteId of siteIds)moveSite(w,id,siteId);
  refreshSites(w,id);
 }
 w.asteroids=w.sectors[w.systemId].asteroids;w.scan=null;w.hackRequest=null;w.jumpReadyAt=Number(saved.jumpReadyAt)||0;
 w.depots=saved.depots&&typeof saved.depots==='object'?saved.depots:{};
 normalizeResources(w.ship);bindPort(w,saved.portId);
 const key=w.systemId+':'+w.portId;
 if(!w.depots[key])w.depots[key]=saved.sectors?{}:w.ship.stock;
 if(w.ship.docked)w.ship.stock=w.depots[key];
 // Vaisseau à quai : en bout de sas (les anciennes sauvegardes le plaçaient au centre de la station).
 w.dockAnim=null;refreshBerth(w,station);
 w.ship.explorationXp=Math.max(0,Number(w.ship.explorationXp)||0);
}
function moveSite(w,systemId,id,random){
 const local=w.sectors[systemId],obstacles=[...points({...w,systemId}).filter(p=>p.id!==id),...local.asteroids];
 return relocateSite(local.siteLocations,id,obstacles,random);
}
export function refreshSites(w,systemId,now=Date.now(),random=Math.random){
 const local=w.sectors[systemId];
 for(const id of siteIds)if(local.sites[id]>0&&now>=local.sites[id]&&moveSite(w,systemId,id,random))local.sites[id]=0;
}
export function saveUniverse(w){return {systemId:w.systemId,portId:w.portId,sectors:w.sectors,depots:w.depots,jumpReadyAt:w.jumpReadyAt};}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),speed=s=>Math.hypot(s.vx,s.vy);
export function universeCommand(w,type,id,capacity,now=Date.now()){
 if(!['jump','scan','hack','port'].includes(type))return false;
 const s=w.ship,p=point(w,id);const fail=text=>{w.notice=text;return true;};
 if(!p)return fail('Contact inconnu.');
 if(s.docked)return fail('Quittez la station avant de rejoindre ce contact.');
 if(distance(s,p)>180)return fail('Approchez à moins de 180 m.');
 const dryDock=type==='port'&&p.kind==='port'&&s.fuel<=0;
 if(speed(s)>20&&!dryDock)return fail('Ralentissez sous 20 m/s.');
 if(type==='port'){
  if(p.kind!=='port')return fail('Ce contact ne permet pas l’amarrage.');
  bindPort(w,p.id);berthShip(w,p);w.mining=false;w.scan=null;w.hackRequest=null;w.target='station';
  const key=w.systemId+':'+p.id;s.stock=w.depots[key]??(w.depots[key]={});s.materials=total(s.stock);
  return fail(s.fuel<=0?'Amarrage d’urgence confirmé : '+p.name+'.':'Amarré : '+p.name+'.');
 }
 if(type==='jump'){
  if(p.kind!=='gate')return fail('Rejoignez une porte de transit.');
  if(now<w.jumpReadyAt)return fail('Porte disponible dans '+countdown(w.jumpReadyAt,now)+'.');
  if(s.fuel<8)return fail('Il faut 8 % de carburant pour le transit.');
  const origin=w.systemId;s.fuel-=8;w.systemId=p.destination;w.asteroids=w.sectors[w.systemId].asteroids;refreshOres(w.asteroids,now);
  const arrival=points(w).find(q=>q.kind==='gate'&&q.destination===origin);s.x=arrival.x-220;s.y=arrival.y;s.vx=s.vy=0;s.angle=Math.PI;w.target=null;w.scan=null;w.hackRequest=null;w.mining=false;w.extracting=false;w.traffic=[];w.jumpReadyAt=now+8000;bindPort(w,'hub');
  return fail('Transit terminé : '+sector(w).name+'.');
 }
 if(!['archive','wreck'].includes(p.kind))return fail('Ce contact ne se sonde pas.');
 if(!s.modules.includes('decryptor'))return fail('Installez un Décodeur d’accès pour ouvrir ce site.');
 if(type==='scan'&&w.scan){w.scan=null;return fail('Sondage interrompu.');}
 const ready=w.sectors[w.systemId].sites[id];
 if(now<ready)return fail('Signal renouvelé dans '+countdown(ready,now)+'.');
 if(capacity(s)-s.cargo<2)return fail('Libérez 2 t dans la soute.');
 if(type==='scan'){w.hackRequest=id;return fail('Sécurité détectée : reliez le circuit d’accès.');}
 if(w.hackRequest!==id)return fail('Relancez d’abord l’ouverture du site.');
 w.hackRequest=null;w.mining=false;w.scan={id,progress:0,duration:getHull(s).scanSeconds||16};return fail('Accès ouvert. Sondage en cours. Restez à proximité.');
}
export function universeStep(w,dt,capacity,now=Date.now()){
 if(!w.sectors)return;
 for(const [id,s] of Object.entries(w.sectors)){refreshOres(s.asteroids,now);refreshSites(w,id,now);}
 if(!w.scan)return;
 const p=point(w,w.scan.id),s=w.ship;
 if(s.docked||distance(s,p)>180||speed(s)>20||w.mining){w.scan=null;w.notice='Sondage interrompu : maintenez position et vitesse.';return;}
 w.scan.progress+=Math.min(dt,.05);
 if(w.scan.progress<w.scan.duration)return;
 if(capacity(s)-s.cargo<2){w.scan=null;w.notice='Sondage arrêté : soute pleine.';return;}
 const resource=p.id==='archive'?'telemetry':'relic';s.cargoItems[resource]=(s.cargoItems[resource]||0)+2;s.cargo=total(s.cargoItems);s.explorationXp=(s.explorationXp||0)+15;
 w.sectors[w.systemId].sites[p.id]=now+SITE_RESPAWN_MS;if(w.target===p.id)w.target=null;w.scan=null;w.notice='Récupération : 2 t · +15 XP d’exploration.';
}
