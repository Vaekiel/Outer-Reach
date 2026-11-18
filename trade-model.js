// Échange direct entre deux pilotes : offres, contrôles, séquestre et règlement. Logique pure (aucun DOM ni Firebase).
// Garanties entre deux clients honnêtes : ce qui est verrouillé sort du vaisseau (séquestre sauvegardé), revient si
// l'échange est déverrouillé ou annulé, et le règlement n'est appliqué qu'une fois (registre des échanges réglés).
import {resources,resourceName,total} from './resources.js';
import {modules} from './equipment.js';

export const TRADE_LIMITS={requestTtlMs:120000,ledgerSize:20,fuelMax:100,maxItems:12,maxModules:10,maxCredits:1e9,maxTons:100000,offerDebounceMs:400};
const round1=n=>Math.round(n*10)/10;
const EPS=1e-6;

export const emptyOffer=()=>({items:{},credits:0,fuel:0,modules:[]});
export function sanitizeOffer(o){
 const items={};
 for(const [id,n] of Object.entries(o?.items||{})){const t=round1(Number(n));if(resources[id]&&t>0&&Object.keys(items).length<TRADE_LIMITS.maxItems)items[id]=Math.min(t,TRADE_LIMITS.maxTons);}
 const credits=Math.max(0,Math.min(TRADE_LIMITS.maxCredits,Math.floor(Number(o?.credits)||0)));
 const fuel=Math.max(0,Math.min(TRADE_LIMITS.fuelMax,Math.floor(Number(o?.fuel)||0)));
 const mods=[...new Set((Array.isArray(o?.modules)?o.modules:[]).filter(id=>modules.some(m=>m.id===id)))].slice(0,TRADE_LIMITS.maxModules);
 return {items,credits,fuel,modules:mods};
}
export const offerTonnage=o=>round1(total(o?.items));
export const offerIsEmpty=o=>!Object.keys(o?.items||{}).length&&!o?.credits&&!o?.fuel&&!(o?.modules||[]).length;
export const sameOffer=(a,b)=>JSON.stringify(sanitizeOffer(a))===JSON.stringify(sanitizeOffer(b));

// Ce que le pilote peut réellement donner (soute, solde, carburant, modules en réserve non installés).
export function offerError(ship,offer){
 const o=sanitizeOffer(offer);
 for(const [id,n] of Object.entries(o.items))if((ship.cargoItems?.[id]||0)+EPS<n)return 'Soute : '+resourceName(id)+' insuffisant ('+(ship.cargoItems?.[id]||0).toFixed(1)+' t).';
 if(o.credits>(ship.credits||0))return 'Crédits insuffisants.';
 if(o.fuel>Math.floor(ship.fuel||0))return 'Carburant insuffisant.';
 for(const id of o.modules){if(!ship.ownedModules?.includes(id))return 'Module absent de la réserve.';if(ship.modules?.includes(id))return 'Retirez le module '+moduleName(id)+' avant de l’échanger.';}
 return '';
}
// Ce que le pilote peut recevoir, une fois sa propre offre partie : place en soute, réservoir, modules pas déjà possédés.
export function receiveError(ship,myOffer,theirOffer,capacity){
 const mine=sanitizeOffer(myOffer),theirs=sanitizeOffer(theirOffer);
 const free=capacity-((ship.cargo||0)-offerTonnage(mine));
 if(offerTonnage(theirs)>free+EPS)return 'Soute : '+Math.max(0,free).toFixed(1)+' t libres pour '+offerTonnage(theirs).toFixed(1)+' t reçues.';
 if((ship.fuel||0)-mine.fuel+theirs.fuel>TRADE_LIMITS.fuelMax+EPS)return 'Réservoir : place pour '+Math.max(0,Math.floor(TRADE_LIMITS.fuelMax-(ship.fuel||0)+mine.fuel))+' % de carburant.';
 for(const id of theirs.modules)if(ship.ownedModules?.includes(id)&&!mine.modules.includes(id))return 'Vous possédez déjà : '+moduleName(id)+'.';
 return '';
}
export const moduleName=id=>modules.find(m=>m.id===id)?.name||id;

function take(ship,o){
 for(const [id,n] of Object.entries(o.items)){const left=(ship.cargoItems[id]||0)-n;if(left>EPS)ship.cargoItems[id]=left;else delete ship.cargoItems[id];}
 ship.cargo=total(ship.cargoItems);ship.credits=(ship.credits||0)-o.credits;ship.fuel=Math.max(0,(ship.fuel||0)-o.fuel);
 ship.ownedModules=(ship.ownedModules||[]).filter(id=>!o.modules.includes(id));
}
function give(ship,o,{capacity=Infinity,docked=false}={}){
 ship.cargoItems||={};let room=Math.max(0,capacity-total(ship.cargoItems)),overflow=0;
 for(const [id,n] of Object.entries(o.items)){
  const inHold=docked?Math.min(n,room):n;room-=inHold;
  if(inHold>0)ship.cargoItems[id]=(ship.cargoItems[id]||0)+inHold;
  // À quai, ce qui ne tient pas en soute rejoint le stock de la station.
  if(n-inHold>EPS&&ship.stock){ship.stock[id]=(ship.stock[id]||0)+(n-inHold);overflow+=n-inHold;}
 }
 ship.cargo=total(ship.cargoItems);if(ship.stock)ship.materials=total(ship.stock);
 ship.credits=(ship.credits||0)+o.credits;ship.fuel=Math.min(TRADE_LIMITS.fuelMax,(ship.fuel||0)+o.fuel);
 let refunded=0;ship.ownedModules||=[];
 for(const id of o.modules){if(ship.ownedModules.includes(id)){refunded+=modules.find(m=>m.id===id)?.price||0;}else ship.ownedModules.push(id);}
 ship.credits+=refunded;
 return {overflow:round1(overflow),refunded};
}

// Verrouillage : l'offre quitte le vaisseau et part en séquestre (sauvegardé avec la partie).
export function escrow(ship,{id,rev},offer){
 const o=sanitizeOffer(offer),error=offerError(ship,o);if(error)return error;
 if(ship.tradeEscrow)refund(ship);
 take(ship,o);ship.tradeEscrow={id,rev,offer:o};return '';
}
// Déverrouillage, modification ou annulation : le séquestre revient intégralement.
// À quai, si la soute a été remplie entre-temps, le surplus rejoint le stock de la station.
export function refund(ship,{capacity=Infinity,docked=false}={}){
 const e=ship.tradeEscrow;if(!e)return false;
 give(ship,sanitizeOffer(e.offer),{capacity,docked});ship.tradeEscrow=null;return true;
}
export const ledgerKey=(id,rev)=>id+':'+rev;
export const alreadySettled=(ship,id,rev)=>(ship.tradeLedger||[]).includes(ledgerKey(id,rev));
// Règlement d'un échange conclu : le séquestre est consommé, l'offre de l'autre pilote est reçue. Idempotent.
export function settle(ship,{id,rev,mine,theirs},{capacity=Infinity,docked=false}={}){
 if(alreadySettled(ship,id,rev))return null;
 const e=ship.tradeEscrow;
 if(!e||e.id!==id||e.rev!==rev){
  // Séquestre absent ou périmé (autre appareil, sauvegarde ancienne) : on prélève ce qui reste disponible.
  if(e)refund(ship);
  const o=sanitizeOffer(mine),clamp={items:Object.fromEntries(Object.entries(o.items).map(([k,n])=>[k,Math.min(n,ship.cargoItems?.[k]||0)])),credits:Math.min(o.credits,ship.credits||0),fuel:Math.min(o.fuel,Math.floor(ship.fuel||0)),modules:o.modules.filter(m=>ship.ownedModules?.includes(m)&&!ship.modules?.includes(m))};
  ship.cargoItems||={};take(ship,clamp);
 }
 ship.tradeEscrow=null;
 const result=give(ship,sanitizeOffer(theirs),{capacity,docked});
 ship.tradeLedger=[...(ship.tradeLedger||[]),ledgerKey(id,rev)].slice(-TRADE_LIMITS.ledgerSize);
 return result;
}

// Vue d'un document d'échange pour un pilote : rôles, offres, verrous, étape à afficher.
export function tradeView(doc,me,now=Date.now()){
 if(!doc||!Array.isArray(doc.uids)||!doc.uids.includes(me))return null;
 const other=doc.uids.find(u=>u!==me),pick=(m,u)=>!!m?.[u];
 // `ref` identifie CET échange : le document « uidA_uidB » est réutilisé d'un échange à l'autre entre deux pilotes,
 // le séquestre, le registre et les bandeaux s'appuient donc sur document + échéance de la demande.
 const view={id:doc.id,ref:doc.id+'@'+(Number(doc.expiresAt)||0),other,mode:doc.mode||'station',systemId:doc.systemId,portId:doc.portId??null,status:doc.status,rev:Number(doc.rev)||0,
  incoming:doc.to===me,mine:sanitizeOffer(doc.offers?.[me]),theirs:sanitizeOffer(doc.offers?.[other]),
  lockedMe:pick(doc.locked,me),lockedThem:pick(doc.locked,other),confirmedMe:pick(doc.confirmed,me),confirmedThem:pick(doc.confirmed,other),
  appliedMe:pick(doc.applied,me),appliedThem:pick(doc.applied,other),expired:doc.status==='pending'&&Number(doc.expiresAt)<=now};
 view.stage=doc.status==='pending'?(view.expired?'expired':view.incoming?'request-in':'request-out')
  :doc.status==='open'?(view.lockedMe&&view.lockedThem?(view.confirmedMe?'confirmed':'ready'):view.lockedMe?'locked':'compose')
  :doc.status==='done'?'done':'cancelled';
 return view;
}
export const STAGE_TEXT={
 'request-out':'Demande envoyée : en attente de réponse.',
 'request-in':'Propose un échange.',
 expired:'Demande expirée.',
 compose:'Composez votre offre puis verrouillez-la.',
 locked:'Offre verrouillée : en attente de l’autre pilote.',
 ready:'Les deux offres sont verrouillées : confirmez l’échange.',
 confirmed:'Vous avez confirmé : en attente de l’autre pilote.',
 done:'Échange conclu.',
 cancelled:'Échange annulé.'
};
// Paires libellé / valeur d'une offre pour l'affichage.
export function offerPairs(o){
 const x=sanitizeOffer(o);
 return [...Object.entries(x.items).map(([id,n])=>[resourceName(id),n.toFixed(1)+' t']),...(x.credits?[['Crédits',x.credits+' Cr']]:[]),...(x.fuel?[['Carburant',x.fuel+' %']]:[]),...x.modules.map(id=>['Module',moduleName(id)])];
}
