// Couche Firestore de l'échange direct : document trades/{uidA_uidB}, un échange à la fois par paire de pilotes.
import {doc,setDoc,updateDoc,deleteDoc,collection,query,where,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import {pairId} from './social-model.js';
import {TRADE_LIMITS,emptyOffer,sanitizeOffer} from './trade-model.js';

const toMs=t=>t?.toMillis?t.toMillis():Number(t)||0;
const flags=(uids,value=false)=>({[uids[0]]:value,[uids[1]]:value});

export function createTrades({db}){
 const ref=id=>doc(db,'trades',id);
 function listen(uid,onChange){
  return onSnapshot(query(collection(db,'trades'),where('uids','array-contains',uid),limit(10)),
   snap=>onChange(snap.docs.map(d=>({id:d.id,...d.data(),expiresAt:toMs(d.data().expiresAt)})),null),err=>onChange(null,err));
 }
 // Nouvelle demande : un ancien échange annulé, expiré ou réglé des deux côtés est d'abord retiré.
 async function request({from,to,mode,systemId,portId}){
  const uids=[from,to].sort(),id=pairId(from,to);
  await deleteDoc(ref(id)).catch(()=>{});
  await setDoc(ref(id),{uids,from,to,mode,systemId,portId:portId??null,status:'pending',rev:0,
   offers:{[uids[0]]:emptyOffer(),[uids[1]]:emptyOffer()},locked:flags(uids),confirmed:flags(uids),applied:flags(uids),
   createdAt:serverTimestamp(),updatedAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+TRADE_LIMITS.requestTtlMs)});
  return id;
 }
 const accept=id=>updateDoc(ref(id),{status:'open',updatedAt:serverTimestamp()});
 const cancel=id=>updateDoc(ref(id),{status:'cancelled',updatedAt:serverTimestamp()});
 const remove=id=>deleteDoc(ref(id));
 // Modifier son offre déverrouille les deux pilotes et incrémente la révision.
 async function setOffer(id,uid,offer){
  return runTransaction(db,async tx=>{
   const snap=await tx.get(ref(id));if(!snap.exists())throw new Error('Échange introuvable.');
   const d=snap.data();if(d.status!=='open')throw new Error('Échange fermé.');
   const rev=(Number(d.rev)||0)+1;
   tx.update(ref(id),{['offers.'+uid]:sanitizeOffer(offer),locked:flags(d.uids),confirmed:flags(d.uids),rev,updatedAt:serverTimestamp()});
   return rev;
  });
 }
 // Verrouiller exige que l'offre n'ait pas changé depuis la mise en séquestre (même révision).
 async function setLocked(id,uid,value,expectedRev){
  return runTransaction(db,async tx=>{
   const snap=await tx.get(ref(id));if(!snap.exists())throw new Error('Échange introuvable.');
   const d=snap.data();if(d.status!=='open')throw new Error('Échange fermé.');
   if(value&&(Number(d.rev)||0)!==expectedRev)throw new Error('Les offres ont changé : vérifiez avant de verrouiller.');
   tx.update(ref(id),{['locked.'+uid]:value,...(value?{}:{confirmed:flags(d.uids)}),updatedAt:serverTimestamp()});
  });
 }
 // Confirmer ; si l'autre pilote avait déjà confirmé, l'échange est conclu dans la même transaction.
 async function confirm(id,uid,expectedRev){
  return runTransaction(db,async tx=>{
   const snap=await tx.get(ref(id));if(!snap.exists())throw new Error('Échange introuvable.');
   const d=snap.data(),other=d.uids.find(u=>u!==uid);
   if(d.status!=='open')throw new Error('Échange fermé.');
   if((Number(d.rev)||0)!==expectedRev||!d.locked?.[uid]||!d.locked?.[other])throw new Error('Les offres ont changé : vérifiez avant de confirmer.');
   const done=!!d.confirmed?.[other];
   tx.update(ref(id),{['confirmed.'+uid]:true,...(done?{status:'done'}:{}),updatedAt:serverTimestamp()});
   return done;
  });
 }
 const markApplied=(id,uid)=>updateDoc(ref(id),{['applied.'+uid]:true,updatedAt:serverTimestamp()});
 return {listen,request,accept,cancel,remove,setOffer,setLocked,confirm,markApplied};
}
