// Couche Firestore de l'Équipage : profils publics, amitiés, groupe duo, invitations et position du coéquipier.
import {doc,getDoc,getDocs,setDoc,updateDoc,deleteDoc,collection,query,where,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import {CHAT_LIMITS,safeAvatarUrl} from './chat-channels.js';
import {SOCIAL_LIMITS,pairId,pseudoKey,inviteId,friendView,joinedMembers,leftMembers,nextLeader,makeSquadKey} from './social-model.js';

const newSquadKey=()=>makeSquadKey(n=>crypto.getRandomValues(new Uint8Array(n)));

const toMs=t=>t?.toMillis?t.toMillis():Number(t)||0;
const profileOf=snap=>snap.exists()?{uid:snap.id,pseudo:snap.data().pseudo,avatar:safeAvatarUrl(snap.data().avatar)}:null;

export function createSocial({db}){
 const profileCache=new Map();

 // --- Profils publics ---
 function upsertProfile({uid,pseudo,avatar}){const photo=safeAvatarUrl(avatar);const data={pseudo,pseudoKey:pseudoKey(pseudo),...(photo?{avatar:photo}:{}),updatedAt:serverTimestamp()};profileCache.set(uid,{uid,pseudo,avatar:photo});return setDoc(doc(db,'profiles',uid),data);}
 async function getProfile(uid){if(profileCache.has(uid))return profileCache.get(uid);const p=profileOf(await getDoc(doc(db,'profiles',uid)));if(p)profileCache.set(uid,p);return p;}
 async function searchProfiles(pseudo,selfUid){const key=pseudoKey(pseudo);if(!key)return [];const snap=await getDocs(query(collection(db,'profiles'),where('pseudoKey','==',key),limit(SOCIAL_LIMITS.searchResults)));return snap.docs.map(profileOf).filter(p=>p&&p.uid!==selfUid);}

 // --- Présence ---
 async function getPresence(uid){const snap=await getDoc(doc(db,'presence',uid));if(!snap.exists())return null;const d=snap.data();return {uid,pseudo:d.pseudo,avatar:safeAvatarUrl(d.avatar),systemId:d.systemId,groupId:d.groupId??null,portId:d.portId??null,lastSeen:toMs(d.lastSeen)};}
 const isOnline=p=>!!p&&Date.now()-p.lastSeen<CHAT_LIMITS.presenceStaleMs;
 async function onlineInSystem(systemId,selfUid){const cutoff=Timestamp.fromMillis(Date.now()-CHAT_LIMITS.presenceStaleMs);const snap=await getDocs(query(collection(db,'presence'),where('systemId','==',systemId),where('lastSeen','>',cutoff),limit(20)));return snap.docs.filter(d=>d.id!==selfUid).map(d=>({uid:d.id,pseudo:d.data().pseudo,avatar:safeAvatarUrl(d.data().avatar),systemId:d.data().systemId,groupId:d.data().groupId??null,online:true}));}

 // --- Amitiés ---
 function listenFriendships(uid,onChange){return onSnapshot(query(collection(db,'friendships'),where('uids','array-contains',uid),limit(SOCIAL_LIMITS.friends*2)),snap=>onChange(snap.docs.map(d=>friendView({id:d.id,...d.data()},uid)).filter(Boolean),null),err=>onChange(null,err));}
 function requestFriend(selfUid,otherUid){const uids=[selfUid,otherUid].sort();return setDoc(doc(db,'friendships',pairId(selfUid,otherUid)),{uids,requestedBy:selfUid,status:'pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});}
 const acceptFriend=id=>updateDoc(doc(db,'friendships',id),{status:'accepted',updatedAt:serverTimestamp()});
 const removeFriend=id=>deleteDoc(doc(db,'friendships',id));

 // --- Groupe duo ---
 async function findMyGroup(uid){const snap=await getDocs(query(collection(db,'groups'),where('members','array-contains',uid),limit(1)));return snap.empty?null:{id:snap.docs[0].id,...snap.docs[0].data()};}
 function listenGroup(groupId,onChange){return onSnapshot(doc(db,'groups',groupId),snap=>onChange(snap.exists()?{id:snap.id,members:snap.data().members||[],leader:snap.data().leader,squadKey:snap.data().squadKey||null}:null,null),err=>onChange(null,err));}
 async function createGroup(uid){const ref=doc(collection(db,'groups')),squadKey=newSquadKey();await setDoc(ref,{members:[uid],leader:uid,createdAt:serverTimestamp(),squadKey});return {id:ref.id,squadKey};}
 async function invite({groupId,from,fromPseudo,fromAvatar,to}){
  const ref=doc(db,'invites',inviteId(groupId,to));
  // Une ancienne invitation (refusée ou expirée) au même pilote empêcherait la création : on la retire d'abord.
  await deleteDoc(ref).catch(()=>{});
  const photo=safeAvatarUrl(fromAvatar);
  return setDoc(ref,{kind:'group',groupId,from,fromPseudo,...(photo?{fromAvatar:photo}:{}),to,status:'pending',createdAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+SOCIAL_LIMITS.inviteTtlMs)});
 }
 const inviteData=d=>({id:d.id,...d.data(),fromAvatar:safeAvatarUrl(d.data().fromAvatar),expiresAt:toMs(d.data().expiresAt)});
 function listenIncomingInvites(uid,onChange){return onSnapshot(query(collection(db,'invites'),where('to','==',uid),limit(10)),snap=>onChange(snap.docs.map(inviteData),null),err=>onChange(null,err));}
 function listenOutgoingInvites(uid,onChange){return onSnapshot(query(collection(db,'invites'),where('from','==',uid),limit(10)),snap=>onChange(snap.docs.map(inviteData),null),err=>onChange(null,err));}
 async function joinGroup(inv,uid){
  const groupRef=doc(db,'groups',inv.groupId),inviteRef=doc(db,'invites',inv.id);
  await runTransaction(db,async tx=>{
   const [g,i]=[await tx.get(groupRef),await tx.get(inviteRef)];
   if(!g.exists())throw new Error('Ce groupe n’existe plus.');
   if(!i.exists()||i.data().status!=='pending'||toMs(i.data().expiresAt)<=Date.now())throw new Error('Invitation expirée.');
   const members=g.data().members||[];
   if(!members.includes(uid)&&members.length>=SOCIAL_LIMITS.groupSize)throw new Error('Ce groupe est complet.');
   tx.update(groupRef,{members:joinedMembers(members,uid),squadKey:newSquadKey()});
   tx.update(inviteRef,{status:'accepted'});
  });
  return inv.groupId;
 }
 const deleteInvite=id=>deleteDoc(doc(db,'invites',id));
 async function leaveGroup(groupId,uid){
  const ref=doc(db,'groups',groupId);
  await runTransaction(db,async tx=>{
   const g=await tx.get(ref);if(!g.exists())return;
   const members=g.data().members||[];if(!members.includes(uid))return;
   if(members.length<=1)tx.delete(ref);else tx.update(ref,{members:leftMembers(members,uid),leader:nextLeader(members,g.data().leader,uid)});
  });
 }

 // --- Clé de l'escadrille temps réel (positions dans Realtime Database, voir squad-live.js) ---
 // Posée pour un groupe créé sans clé, ou renouvelée par le pilote resté seul après un départ.
 const setSquadKey=groupId=>updateDoc(doc(db,'groups',groupId),{squadKey:newSquadKey()});

 return {upsertProfile,getProfile,searchProfiles,getPresence,isOnline,onlineInSystem,listenFriendships,requestFriend,acceptFriend,removeFriend,findMyGroup,listenGroup,createGroup,invite,listenIncomingInvites,listenOutgoingInvites,joinGroup,deleteInvite,leaveGroup,setSquadKey};
}
