// Fenêtre « Équipage » : groupe duo, amis, pilotes de la zone et demandes ; bandeau d'invitation ; menu depuis le tchat.
import {avatarSvg,safeAvatarUrl} from './chat-channels.js';
import {canMoor} from './docking.js';
import {SOCIAL_LIMITS,inviteActive,sortPilots,relationFor,RELATION_LABELS,predictPosition,smoothToward,liveSampleFresh,LIVE_LIMITS} from './social-model.js';

const CREW_ICON='<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="6" height="5" fill="#E6C88F"/><rect x="2" y="12" width="10" height="7" fill="#E6C88F"/><rect x="14" y="5" width="6" height="5" fill="#A88156"/><rect x="12" y="12" width="10" height="7" fill="#A88156"/><rect x="2" y="19" width="20" height="1" fill="#7B5A37"/></svg>';
const TABS=[['group','Groupe'],['friends','Amis'],['pilots','Pilotes'],['requests','Demandes']];
function el(tag,className,attrs={}){const n=document.createElement(tag);if(className)n.className=className;for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
export function avatarNode(uid,url){const box=el('span','crew-avatar');const photo=safeAvatarUrl(url);if(photo){const img=el('img','',{src:photo,alt:'',loading:'lazy',decoding:'async',referrerpolicy:'no-referrer'});img.onerror=()=>{box.innerHTML=avatarSvg(uid);};box.append(img);}else box.innerHTML=avatarSvg(uid);return box;}
const errorText=e=>e?.code==='permission-denied'?'Action refusée par les règles Firestore.':e?.message||String(e);

export function createSocialUI({social,live,createMenu,systemName,beforeOpen,onGroupChange,onRequestSignIn,getShip,onRelationsChange,onTrade,tradeWith,onOpenTrade,onJoinMate}){
 let me=null,systemId='',portId=null,mateView=null,mateAway=null,tab='group',group=null,liveSample=null,display=null,previousCount=0,keyRequestedFor=null,zonePilots=[],searchResults=[],searchedFor='',dismissedInvite=null,confirmRemove=null;
 let friends=[],incoming=[],outgoing=[];
 const profiles=new Map(),presences=new Map(),unsubs={};
 const stop=key=>{if(unsubs[key]){unsubs[key]();delete unsubs[key];}};

 // --- DOM : bouton du rail, fenêtre, bandeau ---
 const railButton=el('button','',{id:'crew','aria-haspopup':'dialog','aria-controls':'crew-window','aria-label':'Équipage : amis et groupe'});
 // « Équipage » (63 px en 12 px) ne tient pas dans le rail (54 px utiles) : libellé court, nom complet en info-bulle et dans la fenêtre.
 railButton.innerHTML='<span class="rail-bust">'+CREW_ICON+'</span><span>Équipe</span>';railButton.title='Équipage';
 const railBadge=el('b','crew-badge');railBadge.hidden=true;railButton.append(railBadge);
 (document.getElementById('profile')||document.getElementById('left-menu').firstChild)?.after?.(railButton);
 if(!railButton.isConnected)document.getElementById('left-menu').prepend(railButton);

 const dialog=el('dialog','management-window crew-window',{id:'crew-window','aria-labelledby':'crew-title'});
 dialog.innerHTML='<div class="dialoghead"><div><small>AMIS ET GROUPE</small><h2 id="crew-title">Équipage</h2></div><button data-icon="close" aria-label="Fermer l’équipage"></button></div>';
 const tabs=el('div','crew-tabs',{role:'tablist','aria-label':'Sections de l’équipage'}),tabEls={};
 for(const [id,label] of TABS){const b=el('button','crew-tab',{type:'button',role:'tab','aria-selected':'false','data-tab':id});b.append(document.createTextNode(label));if(id==='requests'){const badge=el('b','crew-badge');badge.hidden=true;b.append(badge);}b.onclick=()=>{tab=id;render();if(id==='pilots')refreshZone();if(id!=='requests')refreshPresences();};tabEls[id]=b;tabs.append(b);}
 const status=el('p','crew-status',{role:'status'});status.hidden=true;
 const body=el('div','crew-body');
 dialog.append(tabs,status,body);document.body.append(dialog);
 dialog.querySelector('.dialoghead button').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{clearInterval(refreshTimer);refreshTimer=null;railButton.focus();});
 let refreshTimer=null;
 railButton.onclick=()=>open();

 const toast=el('section','crew-toast',{role:'alertdialog','aria-live':'assertive','aria-label':'Invitation en groupe'});toast.hidden=true;document.body.append(toast);

 // --- Messages d'état ---
 let statusTimer=null;
 function say(text,{error=false}={}){clearTimeout(statusTimer);status.textContent=text;status.hidden=!text;status.classList.toggle('crew-status--error',error);if(text)statusTimer=setTimeout(()=>{status.hidden=true;},5000);}
 async function run(label,action){try{await action();}catch(e){console.error('Équipage : '+label,e);say(label+' impossible : '+errorText(e),{error:true});}render();}

 // --- Données dérivées ---
 const pilot=uid=>profiles.get(uid)||{uid,pseudo:'Pilote-'+String(uid).slice(0,4),avatar:null};
 const friendshipWith=uid=>friends.find(f=>f.other===uid);
 const partnerUid=()=>group?.members.find(m=>m!==me?.uid)||null;
 const activeIncoming=()=>incoming.filter(i=>inviteActive(i));
 const pendingOut=()=>outgoing.filter(i=>group&&i.groupId===group.id&&inviteActive(i));
 async function ensureProfiles(uids){await Promise.all([...new Set(uids)].filter(u=>u&&!profiles.has(u)).map(async u=>{const p=await social.getProfile(u).catch(()=>null);if(p)profiles.set(u,p);}));}
 async function refreshPresences(){if(!me)return;const uids=[...friends.filter(f=>f.status==='friend').map(f=>f.other),partnerUid()].filter(Boolean);await Promise.all([...new Set(uids)].map(async u=>{presences.set(u,await social.getPresence(u).catch(()=>null));}));render();}
 async function refreshZone(){if(!me||!systemId)return;try{zonePilots=await social.onlineInSystem(systemId,me.uid);for(const p of zonePilots)profiles.set(p.uid,{uid:p.uid,pseudo:p.pseudo,avatar:p.avatar});}catch(e){say('Pilotes indisponibles : '+errorText(e),{error:true});}render();}
 // Même station que moi (les deux amarrés) : l'échange direct est possible avec un ami ou le coéquipier.
 const sameStation=uid=>{const p=presences.get(uid);return !!portId&&social.isOnline(p)&&p.systemId===systemId&&p.portId===portId;};
 function placeText(uid){const p=presences.get(uid);if(!social.isOnline(p))return 'Hors ligne';if(sameStation(uid))return 'À quai ici · '+systemName(p.systemId);const here=p.systemId===systemId;let text=systemName(p.systemId);if(here&&uid===partnerUid()&&display){const s=getShip?.();if(s)text+=' · '+Math.round(Math.hypot(display.x-s.x,display.y-s.y))+' m';}return (here?'Même système · ':'En ligne · ')+text;}

 // --- Actions ---
 async function addFriend(uid){const f=friendshipWith(uid);if(f?.status==='incoming'){await social.acceptFriend(f.id);say('Ami ajouté.');return;}if(f)return;if(friends.filter(x=>x.status==='friend').length>=SOCIAL_LIMITS.friends)throw new Error('Limite de '+SOCIAL_LIMITS.friends+' amis atteinte.');await social.requestFriend(me.uid,uid);say('Demande d’ami envoyée à '+pilot(uid).pseudo+'.');}
 async function inviteToGroup(uid){
  if(group&&group.members.includes(uid))return;
  if(group&&group.members.length>=SOCIAL_LIMITS.groupSize)throw new Error('Votre groupe est complet (2 pilotes).');
  let groupId=group?.id;
  if(!groupId){const created=await social.createGroup(me.uid);groupId=created.id;setGroup({id:groupId,members:[me.uid],leader:me.uid,squadKey:created.squadKey});}
  await social.invite({groupId,from:me.uid,fromPseudo:me.pseudo,fromAvatar:me.avatar,to:uid});
  say('Invitation envoyée à '+pilot(uid).pseudo+' (valable 10 min).');
 }
 async function joinInvite(inv){if(group&&group.id!==inv.groupId)await leave({silent:true});await social.joinGroup(inv,me.uid);setGroup({id:inv.groupId,members:[inv.from,me.uid],leader:inv.from});dismissedInvite=inv.id;say('Vous avez rejoint le groupe de '+inv.fromPseudo+'.');}
 async function leave({silent=false}={}){if(!group)return;const id=group.id;for(const inv of outgoing.filter(i=>i.groupId===id))await social.deleteInvite(inv.id).catch(()=>{});setGroup(null);await social.leaveGroup(id,me.uid);if(!silent)say('Vous avez quitté le groupe.');}

 // --- Groupe courant : écoute du document et escadrille temps réel ---
 function setGroup(next){
  const prevId=group?.id||null;group=next;
  if((next?.id||null)!==prevId){stop('group');previousCount=next?.members.length||0;keyRequestedFor=null;onGroupChange(next?.id||null);if(next)unsubs.group=social.listenGroup(next.id,g=>{if(!g||!g.members.includes(me?.uid)){if(group?.id===next.id){setGroup(null);say('Le groupe a été dissous.');}return;}group=g;syncLive();ensureProfiles(g.members).then(render);render();});}
  syncLive();render();
 }
 // Connexion Realtime Database seulement avec un coéquipier ; clé posée si absente, renouvelée quand on reste seul.
 function syncLive(){
  const mate=partnerUid(),count=group?.members.length||0;
  if(group&&me&&group.members.includes(me.uid)){
   const rotate=count===1&&previousCount===2,missing=!group.squadKey;
   if((rotate||missing)&&keyRequestedFor!==group.id+':'+count){keyRequestedFor=group.id+':'+count;social.setSquadKey(group.id).catch(e=>console.warn('Escadrille : clé non renouvelée',e?.code||e));}
  }
  previousCount=count;
  if(group&&me&&mate&&group.squadKey){
   const key=group.squadKey;
   if(live.key!==key){liveSample=null;display=null;live.join(key,me.uid).then(()=>{if(group?.squadKey===key)live.watch(partnerUid(),s=>{liveSample=s;});}).catch(e=>console.warn('Escadrille : connexion impossible',e?.code||e));}
   ensureProfiles([mate]).then(()=>refreshPresences());
  }else if(live.key){live.leave();liveSample=null;display=null;}
 }

 // --- Rendu ---
 const relationOf=uid=>relationFor(uid,{me:me?.uid,friends,group});
 function card(uid,{sub='',actions=[]}={}){
  const p=pilot(uid),rel=relationOf(uid),row=el('div','crew-card'+(rel?' crew-card--'+rel:''));
  const text=el('div','crew-card__text'),name=el('strong','crew-card__name'),small=el('small','crew-card__sub');
  name.textContent=p.pseudo;small.textContent=sub;
  if(rel){const tag=el('span','pilot-tag pilot-tag--'+rel);tag.textContent=RELATION_LABELS[rel];name.append(' ',tag);}
  text.append(name,small);
  const acts=el('div','crew-card__actions');
  for(const a of actions.filter(Boolean)){const b=el('button',a.primary?'primary':'',{type:'button'});b.textContent=a.label;b.disabled=!!a.disabled;if(a.title)b.title=a.title;b.onclick=()=>run(a.label,a.run);acts.append(b);}
  row.append(avatarNode(uid,p.avatar),text,acts);return row;
 }
 const section=(title,nodes,empty)=>{const s=el('section','crew-section');const h=el('h3','crew-section__title');h.textContent=title;s.append(h);if(nodes.length)s.append(...nodes);else{const p=el('p','crew-empty');p.textContent=empty;s.append(p);}return s;};
 function inviteAction(uid){
  if(group?.members.includes(uid))return {label:'Coéquipier',disabled:true,run:()=>{}};
  if(outgoing.some(i=>inviteActive(i)&&i.to===uid&&i.groupId===group?.id))return {label:'Invité',disabled:true,run:()=>{}};
  return {label:'Inviter',disabled:!!group&&group.members.length>=SOCIAL_LIMITS.groupSize,run:()=>inviteToGroup(uid)};
 }
 // Coéquipier proche et lent, les deux en vol : amarrage vaisseau à vaisseau.
 const canMoorWith=uid=>uid===partnerUid()&&!portId&&canMoor(getShip?.(),mateView);
 function tradeAction(uid){const active=tradeWith?.(uid);if(active)return {label:'Échange en cours',primary:true,run:()=>onOpenTrade?.(active.id)};if(canMoorWith(uid))return {label:'Amarrer et échanger',primary:true,title:'Amarrage vaisseau à vaisseau',run:()=>onTrade?.(uid,{mode:'space'})};if(relationOf(uid)&&sameStation(uid))return {label:'Échanger',primary:true,title:'Échange direct à quai',run:()=>onTrade?.(uid)};return null;}
 // Coéquipier dans le même système mais trop loin pour s'amarrer : cap assisté vers lui.
 function joinAction(uid){if(uid!==partnerUid()||portId||tradeWith?.(uid)||(mateView?canMoorWith(uid):!mateAway))return null;return {label:'Rejoindre',title:'Cap assisté vers votre coéquipier',run:()=>onJoinMate?.()};}
 function friendAction(uid){const f=friendshipWith(uid);if(!f)return {label:'Ajouter',run:()=>addFriend(uid)};if(f.status==='incoming')return {label:'Accepter',primary:true,run:()=>addFriend(uid)};return {label:f.status==='friend'?'Ami':'Envoyée',disabled:true,run:()=>{}};}

 function renderGroup(){
  if(!group)return [section('Groupe',[],'Aucun groupe. Invitez un ami ou un pilote de la zone : 2 pilotes maximum. Le groupe ouvre le canal Groupe du tchat et affiche votre coéquipier sur le radar.')];
  const mate=partnerUid(),nodes=[];
  if(mate)nodes.push(card(mate,{sub:placeText(mate),actions:[tradeAction(mate),joinAction(mate),friendAction(mate)].filter(a=>a&&(!a.disabled||a.label!=='Ami'))}));
  const waiting=pendingOut().map(i=>card(i.to,{sub:'Invitation envoyée',actions:[{label:'Annuler',run:()=>social.deleteInvite(i.id)}]}));
  const leaveBtn=el('button','crew-leave',{type:'button'});leaveBtn.textContent='Quitter le groupe';leaveBtn.onclick=()=>run('Quitter',()=>leave());
  return [section(mate?'Coéquipier':'En attente d’un coéquipier',[...nodes,...waiting],'Invitez un ami ou un pilote de la zone.'),leaveBtn];
 }
 // Formulaire créé une seule fois : les rafraîchissements de la liste ne font jamais perdre la saisie en cours.
 const searchForm=el('form','crew-search'),searchInput=el('input','',{type:'search',placeholder:'Pseudo exact',maxlength:'24','aria-label':'Rechercher un pilote par pseudo',autocomplete:'off'}),searchGo=el('button','',{type:'submit'});
 searchGo.textContent='Rechercher';searchForm.append(searchInput,searchGo);
 searchForm.onsubmit=e=>{e.preventDefault();const q=searchInput.value.trim();searchedFor=q;run('Recherche',async()=>{searchResults=q?await social.searchProfiles(q,me.uid):[];for(const p of searchResults)profiles.set(p.uid,p);if(q&&!searchResults.length)say('Aucun pilote nommé « '+q+' ».');});};
 function renderFriends(){
  const form=searchForm;
  const results=searchResults.map(p=>card(p.uid,{sub:'Résultat de recherche',actions:[friendAction(p.uid),inviteAction(p.uid)]}));
  const list=sortPilots(friends.filter(f=>f.status==='friend').map(f=>({uid:f.other,id:f.id,pseudo:pilot(f.other).pseudo,online:social.isOnline(presences.get(f.other))})));
  const cards=list.map(f=>card(f.uid,{sub:placeText(f.uid),actions:[tradeAction(f.uid),inviteAction(f.uid),confirmRemove===f.id?{label:'Confirmer',primary:true,run:async()=>{confirmRemove=null;await social.removeFriend(f.id);say('Ami retiré.');}}:{label:'Retirer',run:()=>{confirmRemove=f.id;setTimeout(()=>{if(confirmRemove===f.id){confirmRemove=null;render();}},4000);}}]}));
  const nodes=[form];if(results.length)nodes.push(section('Résultats',results,''));nodes.push(section('Amis ('+list.length+')',cards,'Aucun ami pour l’instant. Recherchez un pseudo ou touchez un pilote dans le tchat.'));return nodes;
 }
 function renderPilots(){
  const refresh=el('button','crew-refresh',{type:'button'});refresh.textContent='Actualiser';refresh.onclick=()=>refreshZone();
  const cards=zonePilots.map(p=>card(p.uid,{sub:p.groupId?'En groupe':'Sans groupe',actions:[friendAction(p.uid),inviteAction(p.uid)]}));
  return [section('En ligne dans '+(systemId?systemName(systemId):'ce système'),cards,'Aucun autre pilote en ligne dans ce système.'),refresh];
 }
 function renderRequests(){
  const invites=activeIncoming().map(i=>{profiles.set(i.from,profiles.get(i.from)||{uid:i.from,pseudo:i.fromPseudo,avatar:i.fromAvatar});return card(i.from,{sub:'Vous invite en groupe',actions:[{label:'Rejoindre',primary:true,run:()=>joinInvite(i)},{label:'Refuser',run:()=>social.deleteInvite(i.id)}]});});
  const received=friends.filter(f=>f.status==='incoming').map(f=>card(f.other,{sub:'Demande d’ami',actions:[{label:'Accepter',primary:true,run:()=>social.acceptFriend(f.id)},{label:'Refuser',run:()=>social.removeFriend(f.id)}]}));
  const sent=friends.filter(f=>f.status==='outgoing').map(f=>card(f.other,{sub:'Demande envoyée',actions:[{label:'Annuler',run:()=>social.removeFriend(f.id)}]}));
  return [section('Invitations de groupe',invites,'Aucune invitation.'),section('Demandes reçues',received,'Aucune demande reçue.'),section('Demandes envoyées',sent,'Aucune demande envoyée.')];
 }
 let relationsSignature='';
 function render(){
  const signature=JSON.stringify([friends.filter(f=>f.status==='friend').map(f=>f.other).sort(),group?.members||[]]);
  if(signature!==relationsSignature){relationsSignature=signature;onRelationsChange?.();}
  const requests=friends.filter(f=>f.status==='incoming').length+activeIncoming().length;
  railBadge.hidden=!requests;railBadge.textContent=String(requests);
  const tabBadge=tabEls.requests.querySelector('.crew-badge');tabBadge.hidden=!requests;tabBadge.textContent=String(requests);
  for(const [id] of TABS){tabEls[id].setAttribute('aria-selected',String(id===tab));}
  renderToast();
  if(!dialog.open)return;
  if(!me){const p=el('p','crew-empty');p.textContent='Connectez-vous avec Google pour ajouter des amis et former un groupe.';const b=el('button','primary',{type:'button'});b.textContent='Se connecter';b.onclick=()=>{dialog.close();onRequestSignIn?.();};body.replaceChildren(p,b);return;}
  const scroll=body.scrollTop;
  body.replaceChildren(...(tab==='group'?renderGroup():tab==='friends'?renderFriends():tab==='pilots'?renderPilots():renderRequests()));
  body.scrollTop=scroll;
 }
 function renderToast(){
  const inv=activeIncoming().find(i=>i.id!==dismissedInvite&&i.groupId!==group?.id);
  toast.hidden=!inv||!me;if(toast.hidden)return;
  if(toast.dataset.id===inv.id)return;toast.dataset.id=inv.id;
  const text=el('p','crew-toast__text');text.textContent=inv.fromPseudo+' vous invite en groupe';
  const yes=el('button','primary',{type:'button'});yes.textContent='Rejoindre';yes.onclick=()=>run('Rejoindre',()=>joinInvite(inv));
  const later=el('button','',{type:'button'});later.textContent='Plus tard';later.onclick=()=>{dismissedInvite=inv.id;toast.dataset.id='';render();};
  const acts=el('div','crew-card__actions');acts.append(yes,later);
  toast.replaceChildren(avatarNode(inv.from,inv.fromAvatar),text,acts);
 }

 // --- Menu d'un pilote touché dans le tchat ---
 const menu=createMenu(uid=>{if(!me||!uid||uid===me.uid)return null;const p=pilot(uid),f=friendAction(uid),i=inviteAction(uid);return {title:p.pseudo,info:relationOf(uid)==='mate'?'Coéquipier':relationOf(uid)==='friend'?'Ami':'Pilote',items:[{id:'friend',label:f.label==='Ajouter'?'Ajouter en ami':f.label==='Accepter'?'Accepter la demande d’ami':f.label==='Ami'?'Déjà ami':'Demande d’ami envoyée',disabled:f.disabled},{id:'invite',label:i.label==='Inviter'?'Inviter en groupe':i.label==='Invité'?'Invitation envoyée':'Déjà dans votre groupe',disabled:i.disabled||i.label!=='Inviter',reason:i.disabled&&i.label==='Inviter'?'Groupe complet':''},{id:'trade',label:tradeWith?.(uid)?'Reprendre l’échange':canMoorWith(uid)?'Amarrer et échanger':'Proposer un échange',disabled:!tradeWith?.(uid)&&!canMoorWith(uid)&&!(relationOf(uid)&&sameStation(uid)),reason:tradeWith?.(uid)||canMoorWith(uid)?'':!relationOf(uid)?'Amis et coéquipier':uid===partnerUid()&&!portId?'Approchez à 150 m, sous 20 m/s':!portId?'Amarrez-vous':'Pas à quai ici'},...(uid===partnerUid()?[{id:'join',label:'Rejoindre (cap assisté)',disabled:!(mateView||mateAway)||!!portId||canMoorWith(uid),reason:portId?'Quittez la station':canMoorWith(uid)?'Déjà à portée':!(mateView||mateAway)?'Position inconnue':''}]:[]),{id:'crew',label:'Ouvrir l’équipage'}]};},
  (action,uid)=>{if(action==='friend')run('Ajout d’ami',()=>addFriend(uid));else if(action==='invite')run('Invitation',()=>inviteToGroup(uid));else if(action==='trade'){const active=tradeWith?.(uid);if(active)onOpenTrade?.(active.id);else onTrade?.(uid,canMoorWith(uid)?{mode:'space'}:undefined);}else if(action==='join')onJoinMate?.();else if(action==='crew')open('friends');});

 // --- API ---
 function open(which){beforeOpen?.();if(which)tab=which;for(const d of document.querySelectorAll('dialog[open]'))d.close();dialog.showModal();render();refreshPresences();if(tab==='pilots')refreshZone();clearInterval(refreshTimer);refreshTimer=setInterval(()=>{if(tab==='pilots')refreshZone();else refreshPresences();},30000);}
 async function setUser(u,{pseudo='',systemId:sys=''}={}){
  for(const k of Object.keys(unsubs))stop(k);friends=[];incoming=[];outgoing=[];group=null;liveSample=null;display=null;zonePilots=[];searchResults=[];presences.clear();live.leave();
  if(!u){me=null;onGroupChange(null);render();return;}
  const picture=await u.getIdTokenResult().then(r=>r.claims.picture,()=>null);
  me={uid:u.uid,pseudo,avatar:safeAvatarUrl(picture)};systemId=sys;profiles.set(me.uid,{...me});
  await social.upsertProfile(me).catch(e=>say('Profil public indisponible : '+errorText(e),{error:true}));
  unsubs.friends=social.listenFriendships(me.uid,(list,err)=>{if(err){console.error('Amis',err);return;}friends=list;ensureProfiles(list.map(f=>f.other)).then(render);render();});
  unsubs.incoming=social.listenIncomingInvites(me.uid,(list,err)=>{if(err){console.error('Invitations',err);return;}incoming=list;render();});
  unsubs.outgoing=social.listenOutgoingInvites(me.uid,(list,err)=>{if(err){console.error('Invitations envoyées',err);return;}outgoing=list;render();});
  const existing=await social.findMyGroup(me.uid).catch(()=>null);
  if(existing)setGroup({id:existing.id,members:existing.members||[],leader:existing.leader,squadKey:existing.squadKey||null});else render();
 }
 function setPseudo(pseudo){if(!me||!pseudo||pseudo===me.pseudo)return;me.pseudo=pseudo;profiles.set(me.uid,{...me});social.upsertProfile(me).catch(()=>{});}
 function setSystem(id){systemId=id;zonePilots=[];if(dialog.open&&tab==='pilots')refreshZone();}
 // Appelés à chaque image : l'envoi est limité à ~5 Hz par squad-live, l'affichage extrapole puis lisse la position reçue.
 function tick(ship,sys,hullId){if(live.key)live.publish(ship,sys,hullId);}
 function teammate(sys,dtSeconds=1/60){
  const uid=partnerUid(),now=live.serverNow();
  if(!uid||!liveSampleFresh(liveSample,sys,now)){display=null;mateView=null;return null;}
  display=smoothToward(display,predictPosition(liveSample,now),dtSeconds);
  mateView={systemId:display.s,x:display.x,y:display.y,angle:display.a,vx:Number(display.vx)||0,vy:Number(display.vy)||0,hullId:display.h,docked:!!display.d,pseudo:pilot(uid).pseudo};
  return mateView;
 }
 // Coéquipier dans un autre système (escadrille récente, sinon présence) : la boussole et « Rejoindre » visent la porte vers lui.
 function mateElsewhere(sys){
  const uid=partnerUid();mateAway=null;if(!uid||!me)return null;
  if(liveSample&&live.serverNow()-Number(liveSample.t)<LIVE_LIMITS.staleMs){if(liveSample.s&&liveSample.s!==sys)mateAway={uid,pseudo:pilot(uid).pseudo,systemId:liveSample.s};return mateAway;}
  const p=presences.get(uid);if(social.isOnline(p)&&p.systemId&&p.systemId!==sys)mateAway={uid,pseudo:pilot(uid).pseudo,systemId:p.systemId};
  return mateAway;
 }
 async function openPilotMenu(message,anchor){if(!me||!message?.uid||message.uid===me.uid)return;profiles.set(message.uid,profiles.get(message.uid)||{uid:message.uid,pseudo:message.pseudo,avatar:message.avatar});
  // Présence lue avant d'ouvrir le menu : « Proposer un échange » dépend de la station du pilote.
  if(relationOf(message.uid)&&portId)presences.set(message.uid,await social.getPresence(message.uid).catch(()=>null));
  const r=anchor.getBoundingClientRect();menu.open(message.uid,r.left,r.bottom,anchor);}

 render();
 // Lieu courant (système + station à quai) : met à jour « À quai ici » et les boutons Échanger.
 function setPlace({systemId:sys,portId:port}){const changed=sys!==systemId||(port||null)!==portId;portId=port||null;if(sys!==systemId)setSystem(sys);if(changed){if(dialog.open)refreshPresences();else render();}}
 const profile=uid=>pilot(uid);
 // Coéquipier touché dans la vue : même menu que depuis le tchat.
 function openMateMenu(x,y,anchor){const uid=partnerUid();if(!me||!uid)return false;menu.open(uid,x,y,anchor);return true;}
 return {setUser,setPseudo,setSystem,setPlace,tick,teammate,openPilotMenu,open,relationOf,profile,loadProfiles:ensureProfiles,refresh:render,openMateMenu,mateElsewhere};
}
