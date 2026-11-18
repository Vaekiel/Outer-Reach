// Escadrille temps réel : positions du duo via Firebase Realtime Database, sous /squads/{clé secrète}/{uid}.
// La connexion n'est ouverte que pendant qu'on a un coéquipier (quota gratuit : 100 connexions simultanées).
import {getApp} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {getDatabase,ref,set,onValue,onDisconnect,remove,serverTimestamp,goOnline,goOffline} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js';
import {isSquadKey,shouldPublishLive} from './social-model.js';

const round=(n,step)=>Math.round(n/step)*step;

export function createSquadLive(){
 let db=null,key=null,uid=null,offset=0,last=null,sending=false,stopOffset=null,stopWatch=null;
 const database=()=>db||(db=getDatabase(getApp()));
 const myRef=()=>ref(database(),'squads/'+key+'/'+uid);

 async function join(squadKey,me){
  if(!isSquadKey(squadKey)||!me)return;
  if(key===squadKey&&uid===me)return;
  await leave();
  goOnline(database());key=squadKey;uid=me;last=null;
  // Décalage horloge locale / serveur : l'extrapolation compare des instants serveur.
  stopOffset=onValue(ref(database(),'.info/serverTimeOffset'),snap=>{offset=Number(snap.val())||0;});
  // Onglet fermé ou réseau perdu : la position disparaît côté serveur, le coéquipier cesse de nous voir.
  await onDisconnect(myRef()).remove();
 }

 function publish(ship,systemId,hullId){
  if(!key||sending)return;
  const angle=Math.atan2(Math.sin(ship.angle),Math.cos(ship.angle));
  const next={s:systemId,d:!!ship.docked,x:round(ship.x,.1),y:round(ship.y,.1),a:round(angle,.01),vx:ship.docked?0:round(ship.vx,.1),vy:ship.docked?0:round(ship.vy,.1),at:Date.now()};
  if(!shouldPublishLive(last,next,next.at))return;
  sending=true;last=next;
  set(myRef(),{s:next.s,x:next.x,y:next.y,a:next.a,vx:next.vx,vy:next.vy,h:String(hullId||'').slice(0,24),d:next.d,t:serverTimestamp()})
   .catch(e=>{last=null;console.warn('Escadrille : position refusée',e?.code||e);})
   .finally(()=>{sending=false;});
 }

 function watch(partnerUid,onChange){
  stopWatch?.();stopWatch=null;
  if(!key||!partnerUid){onChange(null);return;}
  stopWatch=onValue(ref(database(),'squads/'+key+'/'+partnerUid),snap=>{const v=snap.val();onChange(v?{...v,uid:partnerUid}:null);},()=>onChange(null));
 }

 async function leave(){
  stopWatch?.();stopWatch=null;stopOffset?.();stopOffset=null;
  if(db&&key&&uid){const r=myRef();await onDisconnect(r).cancel().catch(()=>{});await remove(r).catch(()=>{});}
  if(db)goOffline(db);
  key=null;uid=null;last=null;
 }

 return {join,publish,watch,leave,serverNow:()=>Date.now()+offset,get key(){return key;}};
}
