import {bagPairs,resources} from './resources.js';
import {renderPairs} from './ui-lists.js';
const resourceIcons={ferrite:'fer',copper:'cuivre',silica:'silice',titanium:'titane',ruthenium:'ruthenium',wire:'conducteurs',alloy:'alliage-capteur',telemetry:'matrices-telemetrie',relic:'pieces-patrimoniales',silicon:'circuits-bruts',plate:'plaques-titane'};
function renderStackable(stock,bag){
 const entries=Object.entries(bag||{}).filter(([,n])=>n>.001);stock.replaceChildren();
 if(!entries.length){const empty=document.createElement('p');empty.className='inventory-empty';empty.textContent='Stock vide';stock.append(empty);return;}
 for(const [id,n] of entries){const item=document.createElement('article');item.className='inventory-stack';const icon=resourceIcons[id];const img=document.createElement('span');img.className='inventory-stack-icon';
  if(icon){const folder='ressources';if(id==='plate'){const asset=document.createElement('img');asset.className='inventory-stack-image';asset.src='./assets/icons/ressources/plaques-titane.png';asset.alt='';asset.draggable=false;img.append(asset);}else{img.style.backgroundImage='url("./assets/icons/'+folder+'/'+icon+'.png")';}}
  else{img.classList.add('inventory-stack-fallback');img.textContent=(resources[id]?.name||id).slice(0,1).toUpperCase();}
  const qty=document.createElement('b');qty.className='inventory-stack-qty';qty.textContent=n.toFixed(1)+' t';img.append(qty);
  const name=document.createElement('span');name.className='inventory-stack-name';name.textContent=resources[id]?.name||id;item.append(img,name);stock.append(item);
 }
}
import {modules} from './equipment.js';
import {hulls} from './ships.js';
export function createCockpitWindows({beforeOpen,act,shipyard}){
 const rail=document.createElement('nav');rail.id='left-menu';rail.setAttribute('aria-label','Gestion du vaisseau');document.body.append(rail);rail.append(document.getElementById('open-ship-tree'));
 const windows=new Map();
 function add(id,title,label,icon){const b=document.createElement('button');b.dataset.icon=icon;b.innerHTML='<span>'+label+'</span>';b.setAttribute('aria-label',title);b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls',id);rail.append(b);const d=document.createElement('dialog');d.id=id;d.className='management-window';d.setAttribute('aria-labelledby',id+'-title');d.innerHTML=`<div class="dialoghead"><h2 id="${id}-title">${title}</h2><button data-icon="close" aria-label="Fermer"></button></div><p class="window-state"></p>`;document.body.append(d);d.querySelector('button').onclick=()=>d.close();d.addEventListener('close',()=>b.focus());const open=()=>{beforeOpen();for(const x of document.querySelectorAll('dialog[open]'))x.close();d.showModal();};b.onclick=open;windows.set(id,{d,open});return d;}
 const cargo=add('cargo-window','Soute','Soute','cargo');const cargoStack=document.createElement('div');cargoStack.className='window-stock cargo-stack';cargo.append(cargoStack);const deposit=document.createElement('button');deposit.textContent='Déposer à la station';deposit.onclick=()=>act('deposit');cargo.append(deposit);
 const inventory=add('inventory-window','Inventaire station','Stock','dock');const stock=document.createElement('div');stock.className='window-stock';inventory.append(stock,shipyard.querySelector('.stock-transfers'));inventory.querySelector('details').open=true;const gear=document.createElement('details');gear.innerHTML='<summary>Coques et modules possédés</summary><p></p>';inventory.append(gear);
 const craft=add('craft-window','Fabrication','Craft','equipment');craft.append(shipyard);shipyard.open=true;shipyard.querySelector('summary').hidden=true;
 const feedback=document.createElement('p');feedback.setAttribute('role','status');craft.append(feedback);const transferFeedback=document.createElement('p');transferFeedback.setAttribute('role','status');inventory.append(transferFeedback);const cargoFeedback=document.createElement('p');cargoFeedback.setAttribute('role','status');cargo.append(cargoFeedback);
 const header=document.querySelector('body>header');const position=()=>{rail.style.top=Math.ceil(header.getBoundingClientRect().bottom+12)+'px';};new ResizeObserver(position).observe(header);window.addEventListener('resize',position);position();
 return {openCraft:id=>{windows.get('craft-window').open();shipyard.querySelector('[data-hull="'+id+'"]').scrollIntoView({block:'nearest'});},update:s=>{deposit.disabled=!s.docked||s.cargo<=0;renderStackable(cargoStack,s.cargoItems);renderStackable(stock,s.stock);gear.querySelector('p').textContent=[...s.ownedHulls.map(id=>hulls.find(h=>h.id===id)?.name),...s.ownedModules.map(id=>modules.find(m=>m.id===id)?.name)].filter(Boolean).join(' · ');inventory.querySelector('.window-state').textContent=s.docked?'Stock du Relais-9':'Consultation · transferts à quai';craft.querySelector('.window-state').textContent=s.docked?'Relais-9 · '+Math.floor(s.credits)+' Cr':'Consultation · fabrication à quai';},feedback:text=>{feedback.textContent=text;transferFeedback.textContent=text;cargoFeedback.textContent=text;}};
}
