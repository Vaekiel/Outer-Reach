// Panneau de tchat non modal : onglets Global / Zone / Groupe, saisie, menu ⋯ (modifier, déplacer, supprimer), badges de non-lus.
// Ne met jamais le pilotage en pause : seules les touches tapées dans la zone de saisie sont retenues (garde clavier dans app.js).
import {RELATION_LABELS} from './social-model.js';
import {CHAT_LIMITS,zoneChannel,groupChannel,availableChannels,sanitizeText,validateText,canSend,countUnread,formatChatTime,formatChatTimeShort,avatarSvg,safeAvatarUrl,normalizePrefs,parseChannel} from './chat-channels.js';

const PREFS_KEY='oree-chat';
const BUBBLE='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="9" fill="#E6C88F"/><rect x="3" y="3" width="10" height="7" fill="#0C1721"/><rect x="4" y="11" width="4" height="1" fill="#E6C88F"/><rect x="4" y="12" width="2" height="1" fill="#E6C88F"/><rect x="5" y="5" width="6" height="1" fill="#E6C88F"/><rect x="5" y="7" width="4" height="1" fill="#A88156"/></svg>';
const TABS=['global','zone','group'];
const coarse=()=>matchMedia('(pointer:coarse)').matches;
function readPrefs(){try{return localStorage.getItem(PREFS_KEY);}catch{return null;}}
function el(tag,className,attrs={}){const n=document.createElement(tag);if(className)n.className=className;for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
function errorText(err){if(!err)return '';if(err.code==='failed-precondition')return 'Tchat pas encore prêt : index Firestore manquant (lien de création dans la console).';if(err.code==='permission-denied')return 'Accès refusé par les règles Firestore (voir README).';return err.message||String(err);}

export function createChatUI({chat,presence,createMenu,systemName,onRequestSignIn,onAuthor,relationOf}){
 let user=null,pseudo='',avatar=null,systemId='',groupId=null,tab='global',ready=false,lastSentAt=0,editingId=null,cooldownTimer=null,countsTimer=null,timeTimer=null,statusTimer=null;
 const lists={},subs={},errors={};
 let prefs=normalizePrefs(readPrefs());tab=prefs.tab;
 function savePrefs(){try{localStorage.setItem(PREFS_KEY,JSON.stringify(prefs));}catch{}}

 // --- DOM ---
 const panel=el('section','chat-panel',{id:'chat-panel',role:'region','aria-label':'Tchat','data-state':'collapsed'});
 const head=el('div','chat-head'),tabs=el('div','chat-tabs',{role:'tablist','aria-label':'Canaux du tchat'});
 const tabEls={},badgeEls={};
 for(const kind of TABS){const b=el('button','chat-tab',{id:'chat-tab-'+kind,type:'button',role:'tab','aria-selected':'false','aria-controls':'chat-log'});b.tabIndex=-1;const label=el('span','chat-tab__label'),badge=el('span','chat-tab__badge');badge.hidden=true;b.append(label,badge);tabEls[kind]=b;badgeEls[kind]=badge;tabs.append(b);}
 const presenceEl=el('small','chat-presence'),collapseBtn=el('button','chat-collapse',{type:'button','data-icon':'close','aria-label':'Replier le tchat'});
 head.append(tabs,collapseBtn);
 const status=el('p','chat-status',{role:'status'});status.hidden=true;const statusText=el('span'),statusBtn=el('button','',{type:'button'});statusBtn.hidden=true;status.append(statusText,statusBtn);
 const log=el('div','chat-log',{id:'chat-log',role:'log','aria-live':'polite','aria-relevant':'additions'});log.tabIndex=0;
 const list=el('div','chat-log__list'),empty=el('p','chat-empty'),jump=el('button','chat-log__jump',{type:'button'});jump.textContent='↓ Nouveaux messages';jump.hidden=true;empty.hidden=true;log.append(list,empty,jump);
 const compose=el('form','chat-compose'),mode=el('label','chat-compose__mode',{for:'chat-input'});mode.hidden=true;
 const input=el('textarea','chat-compose__input',{id:'chat-input',rows:'1',maxlength:String(CHAT_LIMITS.text),'aria-label':'Votre message',placeholder:'Votre message…',autocomplete:'off',enterkeyhint:'send'});
 const send=el('button','chat-compose__send primary',{type:'submit'});send.textContent='Envoyer';const count=el('span','chat-compose__count',{'aria-live':'off'});
 // Présence et compteur partagent la dernière ligne : les onglets gardent toute la largeur de l'en-tête.
 const meta=el('div','chat-compose__meta');meta.append(presenceEl,count);
 compose.append(mode,input,send,meta);
 panel.append(head,status,log,compose);
 const toggle=el('button','chat-toggle',{id:'chat-toggle',type:'button','aria-expanded':'false','aria-controls':'chat-panel','aria-label':'Ouvrir le tchat'});
 toggle.innerHTML=BUBBLE+'<span class="chat-toggle__label">Tchat</span>';const toggleCount=el('span','chat-toggle__count');toggleCount.hidden=true;toggle.append(toggleCount);
 document.body.append(panel,toggle);

 // --- Canaux ---
 const channelFor=kind=>kind==='global'?'global':kind==='zone'?(systemId?zoneChannel(systemId):null):(groupId?groupChannel(groupId):null);
 const currentChannel=()=>channelFor(tab);
 const channelLabel=ch=>{const p=parseChannel(ch);return !p?ch:p.kind==='global'?'Global':p.kind==='zone'?'Zone · '+systemName(p.ref):'Groupe';};
 const expanded=()=>panel.dataset.state==='expanded';

 function syncSubscriptions(){
  const wanted=user?availableChannels({systemId,groupId}):[];
  for(const ch of Object.keys(subs))if(!wanted.includes(ch)){subs[ch]();delete subs[ch];delete lists[ch];delete errors[ch];}
  for(const ch of wanted)if(!subs[ch])subs[ch]=chat.subscribe(ch,(l,err)=>{if(err){errors[ch]=err;lists[ch]=[];console.error('Tchat ['+ch+']',err);}else{errors[ch]=null;lists[ch]=l;}onListChange(ch);});
 }
 function onListChange(ch){if(ch===currentChannel()){render();if(expanded()&&document.visibilityState==='visible')markRead(ch);}updateBadges();}
 function markRead(ch){if(!ch)return;const l=lists[ch]||[];const latest=l.length?Math.max(...l.map(m=>m.createdAt)):Date.now();prefs.lastRead[ch]=Math.max(prefs.lastRead[ch]||0,latest);savePrefs();updateBadges();}
 function updateBadges(){let total=0;for(const kind of TABS){const ch=channelFor(kind),n=ch?countUnread(lists[ch]||[],prefs.lastRead[ch],user?.uid):0;total+=n;const b=badgeEls[kind];b.hidden=!n;b.textContent=n>99?'99+':String(n);b.setAttribute('aria-label',n+' non lus');}
  toggleCount.hidden=!total;toggleCount.textContent=total>99?'99+':String(total);toggle.classList.toggle('chat-toggle--unread',total>0);toggle.setAttribute('aria-label',total?'Ouvrir le tchat ('+total+' non lus)':'Ouvrir le tchat');}

 // --- Rendu ---
 // Card : [portrait] ligne 1 « Pseudo · heure ⋯ », ligne 2 le texte sur toute la largeur — un appui le déplie en entier.
 const openIds=new Set();
 function messageNode(m){
  const own=m.uid===user?.uid,rel=own?null:relationOf?.(m.uid);
  const a=el('article','chat-msg'+(own?' chat-msg--own':'')+(rel?' chat-msg--'+rel:'')+(m.pending?' chat-msg--pending':'')+(openIds.has(m.id)?' chat-msg--open':''),{'data-id':m.id});
  const avatar=el('span','chat-msg__avatar'),body=el('div','chat-msg__body'),meta=el('div','chat-msg__meta'),author=el('strong','chat-msg__author'),text=el('span','chat-msg__text'),time=el('time','chat-msg__time',{datetime:new Date(m.createdAt).toISOString()});
  // Photo Google de l'auteur quand elle existe ; portrait pixel généré en secours (anciens messages, photo indisponible).
  if(m.avatar){const img=el('img','',{src:m.avatar,alt:'',loading:'lazy',decoding:'async',referrerpolicy:'no-referrer'});img.onerror=()=>{avatar.innerHTML=avatarSvg(m.uid);};avatar.append(img);}else avatar.innerHTML=avatarSvg(m.uid);
  author.textContent=m.pseudo;text.textContent=m.text;
  time.dataset.ms=String(m.createdAt);time.dataset.edited=m.editedAt?'1':'';time.textContent=formatChatTimeShort(m.createdAt)+(m.editedAt?'*':'');time.title=formatChatTime(m.createdAt)+(m.editedAt?' · modifié':'');
  meta.append(author);if(rel){const tag=el('span','pilot-tag pilot-tag--'+rel);tag.textContent=RELATION_LABELS[rel];meta.append(tag);}
  meta.append(time);body.append(meta,text);a.append(avatar,body);
  if(own&&!m.pending){const more=el('button','chat-msg__more',{type:'button','aria-label':'Actions sur le message','aria-haspopup':'menu'});more.textContent='⋯';more.onclick=e=>{e.stopPropagation();const r=more.getBoundingClientRect();menu.open(m.id,e.clientX||r.left,e.clientY||r.bottom,more);};meta.append(more);}
  // Portrait ou pseudo d'un autre pilote : menu Équipage (ami, groupe) ; ailleurs sur la card : dépliage du texte.
  if(!own&&onAuthor){avatar.classList.add('chat-msg__who');author.classList.add('chat-msg__who');}
  a.onclick=e=>{if(e.target.closest('button'))return;const who=e.target.closest('.chat-msg__who');if(who){onAuthor(m,who);return;}if(!openIds.delete(m.id))openIds.add(m.id);a.classList.toggle('chat-msg--open',openIds.has(m.id));};
  return a;
 }
 let renderedCount=0,renderedChannel=null;
 function render(){
  const ch=currentChannel(),l=ch?lists[ch]||[]:[],err=ch?errors[ch]:null;
  const atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<24,switched=renderedChannel!==ch;
  list.replaceChildren(...l.map(messageNode));
  empty.textContent=tab==='group'&&!groupId?'Aucun groupe. Les invitations arrivent bientôt.':tab==='zone'&&!systemId?'Zone inconnue.':!user?'':tab==='zone'?'Personne n’a encore parlé dans '+systemName(systemId)+'.':tab==='group'?'Aucun message de groupe.':'Aucun message pour l’instant. Dites bonjour !';empty.hidden=!!l.length||!!err||!empty.textContent;
  if(err)setStatus(errorText(err));else if(status.dataset.kind==='listener')clearStatus();
  const lastOwn=l.length&&l[l.length-1].uid===user?.uid;
  if(switched||atBottom||lastOwn){log.scrollTop=log.scrollHeight;jump.hidden=true;}
  else if(l.length>renderedCount)jump.hidden=false;
  renderedCount=l.length;renderedChannel=ch;updateComposeState();
 }
 function refreshTimes(){for(const t of list.querySelectorAll('time[data-ms]'))t.textContent=formatChatTimeShort(Number(t.dataset.ms))+(t.dataset.edited?'*':'');}
 function updateTabs(){for(const kind of TABS){const b=tabEls[kind],active=kind===tab;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;}
  tabEls.global.firstChild.textContent='Global';tabEls.zone.firstChild.textContent=systemId?systemName(systemId):'Zone';tabEls.zone.setAttribute('aria-label','Zone : '+(systemId?systemName(systemId):'inconnue'));tabEls.zone.disabled=!systemId;tabEls.group.firstChild.textContent='Groupe';}
 function setTab(kind){if(!TABS.includes(kind)||tabEls[kind].disabled)return;if(editingId)cancelEdit();tab=kind;prefs.tab=kind;savePrefs();updateTabs();render();if(expanded()&&document.visibilityState==='visible')markRead(currentChannel());}

 // --- Statut ---
 function setStatus(text,{kind='listener',action=null,transient=false}={}){clearTimeout(statusTimer);statusText.textContent=text;status.dataset.kind=kind;status.hidden=!text;statusBtn.hidden=!action;if(action){statusBtn.textContent=action.label;statusBtn.onclick=action.run;}if(transient)statusTimer=setTimeout(()=>{if(status.dataset.kind===kind)clearStatus();},4000);}
 function clearStatus(){status.hidden=true;statusText.textContent='';statusBtn.hidden=true;delete status.dataset.kind;}
 function showSignedOut(){setStatus('Connectez-vous pour discuter avec les autres pilotes.',{kind:'auth',action:onRequestSignIn?{label:'Se connecter',run:()=>onRequestSignIn()}:null});}

 // --- Saisie ---
 function updateCount(){const n=input.value.length;count.textContent=n+' / '+CHAT_LIMITS.text;count.classList.toggle('chat-compose__count--near',n>=CHAT_LIMITS.text-20);input.style.height='auto';input.style.height=Math.min(96,input.scrollHeight)+'px';}
 function updateComposeState(){const ch=currentChannel(),can=!!user&&ready&&!!ch&&!(tab==='group'&&!groupId)&&!errors[ch];input.disabled=!can;send.disabled=!can||!canSend(lastSentAt);input.placeholder=!user?'Connectez-vous pour écrire':tab==='group'&&!groupId?'Aucun groupe pour l’instant':editingId?'Modifiez votre message…':'Votre message…';}
 function armCooldown(){clearTimeout(cooldownTimer);updateComposeState();cooldownTimer=setTimeout(updateComposeState,CHAT_LIMITS.cooldownMs+20);}
 function startEdit(id){const m=(lists[currentChannel()]||[]).find(x=>x.id===id);if(!m)return;editingId=id;compose.classList.add('chat-compose--editing');mode.hidden=false;mode.textContent='Modification · Échap pour annuler';input.value=m.text;updateCount();updateComposeState();input.focus();input.setSelectionRange(input.value.length,input.value.length);}
 function cancelEdit(){editingId=null;compose.classList.remove('chat-compose--editing');mode.hidden=true;input.value='';updateCount();updateComposeState();}
 async function submit(){
  const ch=currentChannel();if(!user||!ch||input.disabled)return;
  const text=sanitizeText(input.value),err=validateText(text);if(err){setStatus(err,{kind:'compose',transient:true});return;}
  if(!canSend(lastSentAt)){setStatus('Patientez un instant avant d’envoyer un autre message.',{kind:'compose',transient:true});return;}
  try{if(editingId){const id=editingId;cancelEdit();await chat.edit(id,text);}else{lastSentAt=Date.now();armCooldown();input.value='';updateCount();await chat.send({channel:ch,uid:user.uid,pseudo,avatar,text});}}
  catch(e){console.error('Tchat : envoi refusé',e);setStatus('Envoi impossible : '+errorText(e),{kind:'compose'});}
  input.focus();
 }
 compose.addEventListener('submit',e=>{e.preventDefault();submit();});
 input.addEventListener('input',updateCount);
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(editingId)cancelEdit();else{input.blur();document.getElementById('space')?.focus();}}});
 input.addEventListener('focus',()=>{if(coarse())panel.classList.add('chat-panel--typing');});
 input.addEventListener('blur',()=>panel.classList.remove('chat-panel--typing'));

 // --- Menu ⋯ ---
 const menu=createMenu(id=>{const m=(lists[currentChannel()]||[]).find(x=>x.id===id);if(!m)return null;const items=[{id:'edit',label:'Modifier'}];for(const ch of availableChannels({systemId,groupId}))if(ch!==m.channel)items.push({id:'move:'+ch,label:'Déplacer vers '+channelLabel(ch)});items.push({id:'delete',label:'Supprimer'});return {title:m.pseudo,info:formatChatTime(m.createdAt)+(m.editedAt?' · modifié':''),items};},
  (action,id)=>{if(action==='edit')startEdit(id);else if(action==='delete')chat.remove(id).catch(e=>setStatus('Suppression impossible : '+errorText(e),{kind:'compose'}));else if(action.startsWith('move:'))chat.move(id,action.slice(5)).catch(e=>setStatus('Déplacement impossible : '+errorText(e),{kind:'compose'}));});

 // --- Onglets, repli, présence ---
 for(const kind of TABS){tabEls[kind].onclick=()=>setTab(kind);tabEls[kind].onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const order=TABS.filter(k=>!tabEls[k].disabled),i=order.indexOf(kind);const next=e.key==='Home'?order[0]:e.key==='End'?order[order.length-1]:order[(i+(e.key==='ArrowRight'?1:-1)+order.length)%order.length];setTab(next);tabEls[next].focus();};}
 function refreshCounts(){if(!user||!expanded())return;presence.counts(systemId).then(({online,zone})=>{presenceEl.textContent=(systemId?systemName(systemId)+' · '+zone+' ici · ':'')+online+' en ligne';}).catch(()=>{presenceEl.textContent=systemId?systemName(systemId):'';});}
 function setExpanded(open){panel.dataset.state=open?'expanded':'collapsed';toggle.hidden=open;toggle.setAttribute('aria-expanded',String(open));prefs.collapsed=!open;savePrefs();clearInterval(countsTimer);clearInterval(timeTimer);countsTimer=timeTimer=null;
  if(open){render();refreshTimes();if(document.visibilityState==='visible')markRead(currentChannel());refreshCounts();countsTimer=setInterval(refreshCounts,CHAT_LIMITS.heartbeatMs);timeTimer=setInterval(refreshTimes,30000);}}
 toggle.onclick=()=>{setExpanded(true);};
 collapseBtn.onclick=()=>{if(editingId)cancelEdit();setExpanded(false);toggle.focus();};
 jump.onclick=()=>{log.scrollTop=log.scrollHeight;jump.hidden=true;};
 log.addEventListener('scroll',()=>{if(log.scrollHeight-log.scrollTop-log.clientHeight<24)jump.hidden=true;});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&expanded()){refreshTimes();markRead(currentChannel());}});

 // --- API ---
 let portId=null;
 function setUser(u,{pseudo:p='',systemId:s='',portId:port=null}={}){portId=port;
  user=u;ready=false;
  // La photo vient du jeton Google (claim « picture ») : c'est exactement ce que les règles Firestore acceptent.
  if(u){pseudo=p;systemId=s;clearStatus();updateTabs();syncSubscriptions();render();u.getIdTokenResult().then(r=>r.claims.picture,()=>null).then(picture=>{avatar=safeAvatarUrl(picture);return presence.start(u.uid,{pseudo,systemId,groupId,avatar,portId});}).then(()=>{ready=true;updateComposeState();}).catch(e=>{console.error('Présence',e);setStatus('Présence indisponible : '+errorText(e),{kind:'presence'});});if(expanded())refreshCounts();}
  else{presence.stop({remove:true});for(const ch of Object.keys(subs)){subs[ch]();delete subs[ch];}for(const k of Object.keys(lists))delete lists[k];for(const k of Object.keys(errors))delete errors[k];if(editingId)cancelEdit();presenceEl.textContent='';updateTabs();render();updateBadges();showSignedOut();}
  updateComposeState();
 }
 function setPseudo(p){pseudo=p;if(user)presence.update({pseudo:p}).catch(()=>{});}
 function setSystem(id){if(id===systemId)return;systemId=id;if(user)presence.update({systemId:id}).catch(()=>{});syncSubscriptions();updateTabs();render();updateBadges();if(expanded())refreshCounts();}
 // Station où l'on est amarré (null en vol) : sert à proposer l'échange entre pilotes à quai.
 function setPort(id){if((id||null)===portId)return;portId=id||null;if(user)presence.update({portId}).catch(()=>{});}
 function setGroup(id){groupId=id||null;if(user)presence.update({groupId}).catch(()=>{});syncSubscriptions();updateTabs();render();updateBadges();}
 const isTyping=()=>document.activeElement===input;

 updateTabs();updateCount();showSignedOut();updateComposeState();setExpanded(!prefs.collapsed);
 // Amis ou groupe modifiés : redessiner les cards pour mettre à jour les marques Ami / Groupe.
 const refreshRelations=()=>{if(user)render();};
 return {setUser,setPseudo,setSystem,setPort,setGroup,isTyping,refreshRelations,panel,toggle};
}
