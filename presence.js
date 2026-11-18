// Présence légère des pilotes connectés : un document presence/{uid} rafraîchi toutes les 60 s.
// Un pilote est « en ligne » si lastSeen date de moins de 2 min (aucun champ booléen à maintenir).
import {doc,setDoc,deleteDoc,serverTimestamp,collection,query,where,Timestamp,getCountFromServer} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import {CHAT_LIMITS,safeAvatarUrl} from './chat-channels.js';

export function createPresence({db}){
 let uid=null,state={pseudo:'',systemId:'',groupId:null,avatar:null,portId:null},timer=null,ready=false;
 function write(){if(!uid||!state.pseudo||!state.systemId)return Promise.resolve();const photo=safeAvatarUrl(state.avatar);return setDoc(doc(db,'presence',uid),{pseudo:state.pseudo,systemId:state.systemId,groupId:state.groupId??null,portId:state.portId??null,...(photo?{avatar:photo}:{}),lastSeen:serverTimestamp()});}
 function startTimer(){stopTimer();timer=setInterval(()=>{if(document.visibilityState==='visible')write().catch(()=>{});},CHAT_LIMITS.heartbeatMs);}
 function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
 function onVisibility(){if(!uid)return;if(document.visibilityState==='visible'){write().catch(()=>{});startTimer();}else stopTimer();}
 function onPageHide(){if(uid)deleteDoc(doc(db,'presence',uid)).catch(()=>{});}
 document.addEventListener('visibilitychange',onVisibility);
 window.addEventListener('pagehide',onPageHide);
 async function start(id,{pseudo,systemId,groupId=null,avatar=null,portId=null}){uid=id;state={pseudo,systemId,groupId,avatar,portId};ready=false;await write();ready=true;startTimer();}
 function update(patch){Object.assign(state,patch);if(!uid)return Promise.resolve();return write();}
 async function stop({remove=false}={}){stopTimer();const id=uid;uid=null;ready=false;if(remove&&id)await deleteDoc(doc(db,'presence',id)).catch(()=>{});}
 async function counts(systemId){const cutoff=Timestamp.fromMillis(Date.now()-CHAT_LIMITS.presenceStaleMs),base=collection(db,'presence');const [online,zone]=await Promise.all([getCountFromServer(query(base,where('lastSeen','>',cutoff))),systemId?getCountFromServer(query(base,where('systemId','==',systemId),where('lastSeen','>',cutoff))):null]);return {online:online.data().count,zone:zone?zone.data().count:0};}
 return {start,update,stop,counts,get ready(){return ready;},get uid(){return uid;}};
}
