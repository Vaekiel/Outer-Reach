// Couche données du tchat : une collection messages filtrée par canal, écoutée en temps réel.
// Les timestamps en attente sont estimés localement pour que le message de l'auteur s'affiche tout de suite.
import {collection,query,where,orderBy,limit,onSnapshot,addDoc,updateDoc,deleteDoc,doc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import {CHAT_LIMITS,applyChanges,isValidChannel,safeAvatarUrl} from './chat-channels.js';

const toMs=t=>t?.toMillis?t.toMillis():typeof t==='number'?t:Date.now();

export function createChat({db}){
 const messages=collection(db,'messages');
 function subscribe(channel,onChange){
  if(!isValidChannel(channel))throw new Error('Canal invalide : '+channel);
  let list=[];
  const q=query(messages,where('channel','==',channel),orderBy('createdAt','desc'),limit(CHAT_LIMITS.pageSize));
  return onSnapshot(q,{includeMetadataChanges:true},snap=>{
   const changes=snap.docChanges().map(c=>{const d=c.doc.data({serverTimestamps:'estimate'});return {type:c.type,id:c.doc.id,pending:c.doc.metadata.hasPendingWrites,data:{uid:d.uid,pseudo:d.pseudo,avatar:safeAvatarUrl(d.avatar),channel:d.channel,text:d.text,createdAt:toMs(d.createdAt),editedAt:d.editedAt?toMs(d.editedAt):null}};});
   if(changes.length)list=applyChanges(list,changes);
   onChange(list,null);
  },error=>{onChange(null,error);});
 }
 // La photo n'est écrite que si elle existe : les règles exigent qu'elle soit celle du jeton Google de l'auteur.
 function send({channel,uid,pseudo,avatar,text}){const photo=safeAvatarUrl(avatar);return addDoc(messages,{uid,pseudo,...(photo?{avatar:photo}:{}),channel,text,createdAt:serverTimestamp(),editedAt:null});}
 function edit(id,text){return updateDoc(doc(messages,id),{text,editedAt:serverTimestamp()});}
 function remove(id){return deleteDoc(doc(messages,id));}
 function move(id,channel){if(!isValidChannel(channel))return Promise.reject(new Error('Canal invalide : '+channel));return updateDoc(doc(messages,id),{channel,editedAt:serverTimestamp()});}
 return {subscribe,send,edit,remove,move};
}
