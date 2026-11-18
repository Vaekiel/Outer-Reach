// Logique pure du tchat (canaux, validation, tri, non-lus) : aucun DOM, aucun Firebase, testable en Node.
export const CHAT_LIMITS={text:280,pseudo:24,pageSize:50,cooldownMs:2000,presenceStaleMs:120000,heartbeatMs:60000};
export const CHANNEL_RE=/^(global|zone:[a-z]{2,24}|group:[A-Za-z0-9_-]{4,40})$/;
export const zoneChannel=systemId=>'zone:'+systemId;
export const groupChannel=groupId=>'group:'+groupId;
export function parseChannel(id){if(!isValidChannel(id))return null;if(id==='global')return {kind:'global',ref:null};const [kind,ref]=id.split(':');return {kind,ref};}
export function isValidChannel(id){return typeof id==='string'&&CHANNEL_RE.test(id);}
export function availableChannels({systemId,groupId}={}){const list=['global'];if(typeof systemId==='string'&&isValidChannel(zoneChannel(systemId)))list.push(zoneChannel(systemId));if(groupId&&isValidChannel(groupChannel(groupId)))list.push(groupChannel(groupId));return list;}
export function sanitizeText(raw){return String(raw??'').replace(/\r\n?/g,'\n').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim().slice(0,CHAT_LIMITS.text);}
export function validateText(text){if(typeof text!=='string'||!text.trim())return 'Message vide.';if(text.length>CHAT_LIMITS.text)return 'Message trop long ('+CHAT_LIMITS.text+' caractères max).';return null;}
export function displayName(pseudo,fallbackName,uid){const p=String(pseudo??'').trim();if(p)return p.slice(0,CHAT_LIMITS.pseudo);const first=String(fallbackName??'').trim().split(/\s+/)[0];if(first)return first.slice(0,CHAT_LIMITS.pseudo);return 'Pilote-'+String(uid??'').slice(0,4);}
export function canSend(lastSentAt,now=Date.now()){return !lastSentAt||now-lastSentAt>=CHAT_LIMITS.cooldownMs;}
const byTime=(a,b)=>a.createdAt-b.createdAt||(a.id<b.id?-1:a.id>b.id?1:0);
// changes : [{type:'added'|'modified'|'removed',id,data:{uid,pseudo,text,channel,createdAt(ms),editedAt(ms|null)},pending}]
export function applyChanges(list,changes){const map=new Map(list.map(m=>[m.id,m]));for(const c of changes||[]){if(c.type==='removed'){map.delete(c.id);continue;}map.set(c.id,{id:c.id,...c.data,pending:!!c.pending});}return [...map.values()].sort(byTime);}
export function countUnread(list,lastReadAt,selfUid){const since=Number(lastReadAt)||0;return list.filter(m=>m.uid!==selfUid&&m.createdAt>since).length;}
export function formatChatTime(ms,now=Date.now()){const diff=now-ms;if(diff<60000)return 'à l’instant';if(diff<3600000)return 'il y a '+Math.floor(diff/60000)+' min';const d=new Date(ms),hh=String(d.getHours()).padStart(2,'0'),mm=String(d.getMinutes()).padStart(2,'0');const n=new Date(now);if(d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate())return hh+':'+mm;return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' '+hh+':'+mm;}
// Heure courte pour une card d'une ligne : « 3 min », « 14:05 » ou « 12/09 ».
export function formatChatTimeShort(ms,now=Date.now()){const diff=Math.max(0,now-ms);if(diff<3600000)return Math.max(1,Math.floor(diff/60000))+' min';const d=new Date(ms),n=new Date(now);if(d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate())return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');}
// Portrait pilote 8×8 en pixel art, stable pour un même uid : palette du HUD, sans exposer la photo Google des joueurs.
const AVATAR_SUITS=['#7692a0','#a88156','#63dc91','#77b7ee','#b388ff','#f0a04b','#e06a6a','#d6bd91'],AVATAR_VISORS=['#e6c88f','#bdd9e4','#f4f5f2'];
const AVATAR_HELMETS=[['..hhhh..','.hhhhhh.','.hvvvvh.','.hvvvvh.','..hhhh..','.ssssss.','ssssssss','ssssssss'],['...hh...','.hhhhhh.','hhvvvvhh','.hvvvvh.','..hhhh..','..ssss..','.ssssss.','ssssssss'],['.hhhhhh.','hhhhhhhh','hvvvvvvh','hhvvvvhh','.hhhhhh.','.ssssss.','ssssssss','ssssssss']];
// Photo de profil Google : seule une URL https raisonnable est acceptée (même contrôle que les règles Firestore).
export function safeAvatarUrl(url){return typeof url==='string'&&url.length<=1024&&/^https:\/\/\S+$/.test(url)?url:null;}
export function avatarSeed(uid){let h=2166136261;for(const c of String(uid??''))h=Math.imul(h^c.codePointAt(0),16777619)>>>0;return h>>>0;}
export function avatarSvg(uid){const seed=avatarSeed(uid),suit=AVATAR_SUITS[seed%AVATAR_SUITS.length],visor=AVATAR_VISORS[(seed>>>8)%AVATAR_VISORS.length],rows=AVATAR_HELMETS[(seed>>>16)%AVATAR_HELMETS.length],fill={h:'#526b76',v:visor,s:suit};let rects='';rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(fill[c])rects+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+fill[c]+'"/>';}));return '<svg viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect width="8" height="8" fill="#0c1721"/>'+rects+'</svg>';}
export function normalizePrefs(raw){let data=null;try{data=typeof raw==='string'?JSON.parse(raw):raw;}catch{data=null;}if(!data||typeof data!=='object')data={};const lastRead={};for(const [k,v] of Object.entries(data.lastRead||{}))if(isValidChannel(k)&&Number.isFinite(Number(v)))lastRead[k]=Number(v);const tab=['global','zone','group'].includes(data.tab)?data.tab:'global';return {collapsed:!!data.collapsed,tab,lastRead};}
