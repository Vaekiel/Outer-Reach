// Logique pure de l'Équipage (amis, groupe duo, positions du coéquipier) : aucun DOM ni Firebase, testable en Node.
export const SOCIAL_LIMITS={friends:50,groupSize:2,inviteTtlMs:600000,searchResults:10};

// Identifiant d'amitié stable quel que soit l'ordre : uids triés, séparés par « _ » (absent des uid Firebase).
export const pairId=(a,b)=>[String(a),String(b)].sort().join('_');
export const pseudoKey=pseudo=>String(pseudo??'').trim().toLowerCase();
export const inviteId=(groupId,toUid)=>groupId+'_'+toUid;

// Vue d'une amitié pour un pilote : ami confirmé, demande reçue ou demande envoyée.
export function friendView(doc,me){
 if(!doc||!Array.isArray(doc.uids)||!doc.uids.includes(me))return null;
 const other=doc.uids.find(u=>u!==me);if(!other)return null;
 const status=doc.status==='accepted'?'friend':doc.requestedBy===me?'outgoing':'incoming';
 return {id:doc.id,other,status};
}

export const inviteActive=(inv,now=Date.now())=>!!inv&&inv.status==='pending'&&Number(inv.expiresAt)>now;

export const joinedMembers=(members,uid)=>members.includes(uid)?[...members]:[...members,uid];
export const leftMembers=(members,uid)=>members.filter(m=>m!==uid);
export function nextLeader(members,leader,uid){const rest=leftMembers(members,uid);return rest.includes(leader)?leader:rest[0]??null;}

const angleGap=(a,b)=>Math.abs(((a-b)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);

// --- Escadrille temps réel (Realtime Database) ---
export const LIVE_LIMITS={minMs:200,keepaliveMs:2000,distance:2,angle:.05,speed:3,staleMs:5000,maxExtrapolationMs:1500,snapDistance:600,smoothing:12};
const KEY_ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
// Clé secrète de 32 caractères URL-safe ; `randomBytes(n)` renvoie n octets (crypto.getRandomValues en jeu).
export function makeSquadKey(randomBytes){const bytes=randomBytes(32);let key='';for(let i=0;i<32;i++)key+=KEY_ALPHABET[bytes[i]&63];return key;}
export const isSquadKey=key=>typeof key==='string'&&/^[A-Za-z0-9_-]{32,64}$/.test(key);

// Envoi ~5 Hz au plus : seulement si le vaisseau a bougé, tourné ou changé de vitesse ; battement lent à l'arrêt.
export function shouldPublishLive(prev,next,now=Date.now()){
 if(!prev)return true;
 if(prev.s!==next.s||prev.d!==next.d)return true;
 const elapsed=now-prev.at;
 if(elapsed<LIVE_LIMITS.minMs)return false;
 if(Math.hypot(next.x-prev.x,next.y-prev.y)>LIVE_LIMITS.distance||angleGap(next.a,prev.a)>LIVE_LIMITS.angle||Math.hypot(next.vx-prev.vx,next.vy-prev.vy)>LIVE_LIMITS.speed)return true;
 return elapsed>=LIVE_LIMITS.keepaliveMs;
}

// Position estimée à l'instant `serverNow` : trajectoire prolongée avec la vitesse, sur 1,5 s au plus.
export function predictPosition(sample,serverNow){
 if(!sample)return null;
 const dt=Math.max(0,Math.min(LIVE_LIMITS.maxExtrapolationMs,serverNow-sample.t))/1000;
 const moving=!sample.d;
 return {...sample,x:sample.x+(moving?sample.vx*dt:0),y:sample.y+(moving?sample.vy*dt:0)};
}

// Rapprochement doux de l'affichage vers la cible (sans « saut ») ; téléport si trop loin ou autre système.
export function smoothToward(display,target,dtSeconds){
 if(!target)return null;
 if(!display||display.s!==target.s||Math.hypot(target.x-display.x,target.y-display.y)>LIVE_LIMITS.snapDistance)return {...target};
 const k=1-Math.exp(-LIVE_LIMITS.smoothing*Math.max(0,dtSeconds));
 const da=((target.a-display.a)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI;
 return {...target,x:display.x+(target.x-display.x)*k,y:display.y+(target.y-display.y)*k,a:display.a+da*k};
}

export const liveSampleFresh=(sample,systemId,serverNow)=>!!sample&&sample.s===systemId&&Number.isFinite(sample.x)&&Number.isFinite(sample.y)&&serverNow-Number(sample.t)<LIVE_LIMITS.staleMs;

// Relation d'un pilote avec moi : coéquipier (prioritaire), ami confirmé, ou aucune (demandes en attente comprises).
export function relationFor(uid,{me,friends=[],group=null}={}){
 if(!uid||uid===me)return null;
 if(group?.members?.includes(uid)&&group.members.includes(me))return 'mate';
 return friends.some(f=>f.other===uid&&f.status==='friend')?'friend':null;
}
export const RELATION_LABELS={mate:'Groupe',friend:'Ami'};

// Amis en ligne d'abord, puis ordre alphabétique du pseudo.
export function sortPilots(list){return [...list].sort((a,b)=>(!!b.online-!!a.online)||String(a.pseudo||'').localeCompare(String(b.pseudo||''),'fr'));}
