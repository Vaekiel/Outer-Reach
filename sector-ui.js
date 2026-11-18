import {points,systems,sector,countdown} from './universe.js';
import {resources} from './resources.js';

const securityLabels={secure:'Sécurisé',hostile:'Hostile',anarchic:'Anarchique'};
const WORLD_WIDTH=1700,WORLD_HEIGHT=700;
export {worldSystems,worldLinks} from './galaxy.js';
import {worldSystems,worldLinks} from './galaxy.js';
export const worldRegions=[{id:'marches-oree',name:'Les Marches d’Orée',width:WORLD_WIDTH,height:WORLD_HEIGHT,systems:worldSystems,links:worldLinks}];

export function createSectorUI({world:w,beforeOpen,approach,act,openStation}){
 if(!document.querySelector('link[data-world-map-style]')){const style=document.createElement('link');style.rel='stylesheet';style.href='./world-map.css';style.dataset.worldMapStyle='';document.head.append(style);}
 const rail=document.getElementById('left-menu');
 const button=document.createElement('button');button.id='open-sector';button.dataset.icon='radar';button.innerHTML='<span>Carte</span>';button.setAttribute('aria-label','Carte du monde');button.setAttribute('aria-haspopup','dialog');rail.append(button);
 const map=document.createElement('dialog');map.className='management-window sector-window world-window';map.setAttribute('aria-labelledby','world-map-title');
 map.innerHTML='<div class="dialoghead"><div><h2 id="world-map-title">Carte du monde</h2></div><button data-icon="close" aria-label="Fermer la carte"></button></div><div class="world-tabs" role="tablist" aria-label="Mondes et régions"></div><div class="world-map-viewport"><div class="world-map"><svg class="world-routes" viewBox="0 0 '+WORLD_WIDTH+' '+WORLD_HEIGHT+'" preserveAspectRatio="none" aria-hidden="true"></svg></div></div><div class="security-key"><span data-security="secure">Sécurisé</span><span data-security="hostile">Hostile</span><span data-security="anarchic">Anarchique</span></div><p class="world-selection" role="status"></p>';
 document.body.append(map);
 const tabs=map.querySelector('.world-tabs'),viewport=map.querySelector('.world-map-viewport'),graph=map.querySelector('.world-map'),routes=map.querySelector('.world-routes');
 let activeRegion=worldRegions[0];
 for(const region of worldRegions){const tab=document.createElement('button');tab.type='button';tab.dataset.world=region.id;tab.setAttribute('role','tab');tab.textContent=region.name;tab.onclick=()=>renderRegion(region.id);tabs.append(tab);}
 function renderRegion(regionId){
  activeRegion=worldRegions.find(region=>region.id===regionId)||worldRegions[0];
  for(const tab of tabs.querySelectorAll('[role="tab"]')){const selected=tab.dataset.world===activeRegion.id;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
  graph.style.setProperty('--world-width',activeRegion.width+'px');
  routes.setAttribute('viewBox','0 0 '+activeRegion.width+' '+activeRegion.height);
  routes.replaceChildren();graph.querySelectorAll('.system-node').forEach(node=>node.remove());
  for(const [a,b] of activeRegion.links){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',activeRegion.systems[a].x);line.setAttribute('y1',activeRegion.systems[a].y);line.setAttribute('x2',activeRegion.systems[b].x);line.setAttribute('y2',activeRegion.systems[b].y);routes.append(line);}
  for(const [id,data] of Object.entries(activeRegion.systems)){const node=document.createElement('button');node.className='system-node';node.dataset.system=id;node.dataset.security=data.security;node.style.left=(data.x/activeRegion.width*100)+'%';node.style.top=(data.y/activeRegion.height*100)+'%';node.innerHTML='<i></i><strong>'+data.name+'</strong><small>'+securityLabels[data.security]+'</small>';node.onclick=()=>selectSystem(id);graph.append(node);}
  const here=activeRegion.systems[w.systemId];if(here)selectSystem(w.systemId);else map.querySelector('.world-selection').textContent='Sélectionnez un système.';
 }
 function selectSystem(id){const data=activeRegion.systems[id];if(!data)return;for(const node of graph.querySelectorAll('.system-node'))node.setAttribute('aria-pressed',String(node.dataset.system===id));const playable=systems[id];map.querySelector('.world-selection').textContent=(id===w.systemId?'Position actuelle · ':'')+data.name+' · '+securityLabels[data.security]+' · '+(playable?playable.hub:'Accès non ouvert');}
 renderRegion(activeRegion.id);
 map.querySelector('.dialoghead button').onclick=()=>map.close();map.addEventListener('close',()=>button.focus());button.onclick=()=>{beforeOpen();renderRegion(worldRegions.find(region=>region.systems[w.systemId])?.id||worldRegions[0].id);map.showModal();const here=activeRegion.systems[w.systemId];requestAnimationFrame(()=>{if(!here)return;const node=graph.querySelector('[data-system="'+w.systemId+'"]');viewport.scrollLeft=Math.max(0,(node?.offsetLeft||0)-viewport.clientWidth/2);});};

 const contacts=document.getElementById('system-contact-list');let contactKey='';
 const contactKind=p=>p.kind==='port'?'station':['archive','wreck'].includes(p.kind)?'site':p.kind==='gate'?'gate':p.kind==='civil'?'neutral':'resource';
 const shortName=p=>p.id==='archive'?'Archive':p.id==='wreck'?'Épave':p.kind==='gate'?'Porte → '+systems[p.destination].name:p.id==='outpost'?(w.systemId==='oree'?'Fonderie':'Raffinerie'):p.name;
 function localContacts(){const places=points(w).filter(p=>p.available!==false).map(p=>({...p,name:shortName(p)}));const rocks=[...w.asteroids].sort((a,b)=>Math.hypot(w.ship.x-a.x,w.ship.y-a.y)-Math.hypot(w.ship.x-b.x,w.ship.y-b.y)).slice(0,8).map(a=>({...a,name:resources[a.resource]?.name+' / '+String(a.id+1).padStart(2,'0'),kind:'resource'}));const traffic=[...(w.traffic||[])].sort((a,b)=>Math.hypot(w.ship.x-a.x,w.ship.y-a.y)-Math.hypot(w.ship.x-b.x,w.ship.y-b.y)).slice(0,4).map(n=>({...n,kind:'civil'}));return [...places,...rocks,...traffic].sort((a,b)=>Math.hypot(w.ship.x-a.x,w.ship.y-a.y)-Math.hypot(w.ship.x-b.x,w.ship.y-b.y));}
 function updateContacts(){if(!contacts)return;const data=localContacts(),signature=w.systemId+'|'+data.map(p=>p.id+':'+p.kind).join();if(contactKey!==signature){contactKey=signature;contacts.replaceChildren(...data.map(p=>{const row=document.createElement('article');row.className='system-contact';row.dataset.contact=p.id;row.dataset.kind=contactKind(p);row.innerHTML='<i aria-hidden="true"></i><strong>'+p.name+'</strong><small></small><button type="button">Rejoindre</button>';row.querySelector('button').onclick=()=>{document.getElementById('opencontacts')?.click();approach(p);};return row;}));}for(const row of contacts.children){const p=data.find(p=>String(p.id)===row.dataset.contact);if(p)row.querySelector('small').textContent=Math.round(Math.hypot(w.ship.x-p.x,w.ship.y-p.y))+' m';}}
 function update(){updateContacts();if(map.open&&activeRegion.systems[w.systemId])selectSystem(w.systemId);}
 return {update,open:()=>button.click(),openLocal:()=>{beforeOpen();document.getElementById('opencontacts')?.click();updateContacts();}};
}
