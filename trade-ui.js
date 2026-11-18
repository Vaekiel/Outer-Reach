// Fenêtre « Échange » : demande, composition de l'offre, double validation, séquestre et règlement automatiques.
import {pairsHtml} from './ui-lists.js';
import {resourceName} from './resources.js';
import {TRADE_LIMITS,emptyOffer,sanitizeOffer,sameOffer,offerIsEmpty,offerError,receiveError,escrow,refund,settle,alreadySettled,tradeView,offerPairs,moduleName,STAGE_TEXT} from './trade-model.js';

function el(tag,className,attrs={}){const n=document.createElement(tag);if(className)n.className=className;for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
const errorText=e=>e?.code==='permission-denied'?'Action refusée par les règles Firestore (même station, ami ou coéquipier requis).':e?.message||String(e);
const ACTIVE=['pending','open'];

export function createTradeUI({trades,getShip,getCapacity,getPlace,profileOf,loadProfiles,avatarNode,placeName,onShipChanged,beforeOpen}){
 let me=null,views=new Map(),loaded=false,unsub=null,currentId=null,draft=null,draftFor=null,writeTimer=null,writing=null,dismissed=new Set(),lastPlace=null,busy=false,pendingLock=null;
 const settling=new Set();

 // --- DOM ---
 const dialog=el('dialog','management-window trade-window',{id:'trade-window','aria-labelledby':'trade-title'});
 dialog.innerHTML='<div class="dialoghead"><div><small id="trade-kicker">ÉCHANGE</small><h2 id="trade-title">Échange</h2></div><button data-icon="close" aria-label="Fermer l’échange"></button></div>';
 const status=el('p','crew-status trade-status',{role:'status'}),partner=el('div','trade-partner'),mineBox=el('section','crew-section trade-offer trade-offer--mine'),theirsBox=el('section','crew-section trade-offer trade-offer--theirs'),actions=el('div','trade-actions');
 dialog.append(partner,status,mineBox,theirsBox,actions);document.body.append(dialog);
 dialog.querySelector('.dialoghead button').onclick=()=>dialog.close();
 // Fermeture : l'offre en cours de saisie part quand même ; un échange terminé et réglé des deux côtés est effacé.
 dialog.addEventListener('close',()=>{const v=view();if(!v)return;if(v.status==='open')flush().catch(()=>{});
  if(v.status==='done'&&v.appliedMe&&v.appliedThem)trades.remove(v.id).catch(()=>{});
  if(!ACTIVE.includes(v.status)||v.expired){currentId=null;draft=null;}render();});
 const toast=el('section','crew-toast trade-toast',{role:'alertdialog','aria-live':'assertive','aria-label':'Demande d’échange'});toast.hidden=true;document.body.append(toast);

 const view=()=>currentId?views.get(currentId)||null:null;
 const pseudo=uid=>profileOf(uid)?.pseudo||'Pilote';
 const opts=()=>({capacity:getCapacity(),docked:!!getShip().docked});
 function say(text,{error=false}={}){status.textContent=text;status.hidden=!text;status.classList.toggle('crew-status--error',error);}
 async function run(label,action){if(busy)return;busy=true;try{await action();}catch(e){console.error('Échange : '+label,e);say(label+' impossible : '+errorText(e),{error:true});}finally{busy=false;render();}}
 const placeOk=v=>{const p=getPlace();return v.mode==='space'?p.systemId===v.systemId&&!p.portId:p.systemId===v.systemId&&p.portId===v.portId&&!!p.portId;};

 // --- Réconciliation : séquestre restitué, règlement appliqué une fois, nettoyage ---
 function reconcile(){
  const ship=getShip();let changed=false,notice='';
  for(const v of views.values()){
   const e=ship.tradeEscrow;
   // Pendant l'écriture du verrou, l'instantané peut encore montrer « non verrouillé » : ne pas restituer à tort.
   if(e?.id===v.ref&&pendingLock!==e.id+':'+e.rev&&(v.status==='cancelled'||(v.status==='open'&&(!v.lockedMe||e.rev!==v.rev)))){refund(ship,opts());changed=true;notice=v.status==='cancelled'?'Échange annulé : votre offre est revenue à bord.':'Offre déverrouillée : elle est revenue à bord.';}
   if(v.status==='done'&&!v.appliedMe){
    const key=v.ref+':'+v.rev;
    if(!settling.has(key)){
     settling.add(key);
     if(!alreadySettled(ship,v.ref,v.rev)){const r=settle(ship,{id:v.ref,rev:v.rev,mine:v.mine,theirs:v.theirs},opts());changed=true;notice='Échange conclu avec '+pseudo(v.other)+'.'+(r?.overflow?' '+r.overflow+' t déposées au stock de la station.':'')+(r?.refunded?' Module déjà possédé remboursé '+r.refunded+' Cr.':'');}
     // Sauvegarde locale avant de signaler le règlement : un plantage entre les deux ne double rien (registre).
     onShipChanged(notice);changed=false;
     trades.markApplied(v.id,me.uid).catch(err=>{settling.delete(key);console.warn('Échange : règlement non signalé',err?.code||err);});
    }
   }
   if(v.status==='done'&&v.appliedMe&&v.appliedThem&&v.id!==currentId)trades.remove(v.id).catch(()=>{});
  }
  const e=ship.tradeEscrow;
  if(e&&loaded&&![...views.values()].some(v=>v.ref===e.id)){refund(ship,opts());changed=true;notice='Échange introuvable : votre offre est revenue à bord.';}
  if(changed)onShipChanged(notice);
 }

 // --- Actions ---
 async function request(uid,{mode='station'}={}){
  if(!me)throw new Error('Connectez-vous pour échanger.');
  const place=getPlace(),existing=[...views.values()].find(v=>v.other===uid&&ACTIVE.includes(v.status)&&!v.expired);
  if(existing){open(existing.id);return;}
  if(mode==='station'&&!place.portId)throw new Error('Amarrez-vous à une station pour échanger.');
  if(mode==='space'&&place.portId)throw new Error('Quittez la station pour vous amarrer à votre coéquipier.');
  const busyTrade=[...views.values()].find(v=>v.status==='open');
  if(busyTrade)throw new Error('Terminez d’abord l’échange avec '+pseudo(busyTrade.other)+'.');
  await loadProfiles?.([uid]);
  try{currentId=await trades.request({from:me.uid,to:uid,mode,systemId:place.systemId,portId:mode==='station'?place.portId:null});}
  catch(e){const stuck=[...views.values()].find(v=>v.other===uid&&v.status==='done');if(stuck)throw new Error('Un échange précédent avec '+pseudo(uid)+' attend encore son règlement de son côté.');throw e;}
  draft=null;openDialog();say('Demande envoyée à '+pseudo(uid)+' (valable 2 min).');
 }
 async function accept(v){
  if(!placeOk(v))throw new Error(v.mode==='space'?'Restez dans le même système que '+pseudo(v.other)+'.':'Amarrez-vous à '+placeName(v.systemId,v.portId)+' pour accepter.');
  if([...views.values()].some(x=>x.status==='open'&&x.id!==v.id))throw new Error('Terminez d’abord votre échange en cours.');
  await trades.accept(v.id);currentId=v.id;dismissed.add(v.ref);openDialog();
 }
 async function decline(v){dismissed.add(v.ref);await trades.cancel(v.id);}
 async function cancel(v){const ship=getShip();if(ship.tradeEscrow?.id===v.ref){refund(ship,opts());onShipChanged('Échange annulé : votre offre est revenue à bord.');}await trades.cancel(v.id);}
 // Écriture groupée de l'offre : la saisie locale fait foi, Firestore reçoit la dernière version.
 function scheduleWrite(){clearTimeout(writeTimer);writeTimer=setTimeout(()=>{flush().catch(e=>say('Offre non envoyée : '+errorText(e),{error:true}));},TRADE_LIMITS.offerDebounceMs);}
 async function flush(){
  clearTimeout(writeTimer);const v=view();if(!v||v.status!=='open'||!draft)return v?.rev;
  if(sameOffer(draft,v.mine))return v.rev;
  writing=trades.setOffer(v.id,me.uid,draft);try{return await writing;}finally{writing=null;}
 }
 // À quai, ce qui ne tient pas en soute rejoint le stock et un module déjà possédé est remboursé : seuls le réservoir
 // (et la soute en vol) bloquent.
 function blockingReceive(ship,mine,theirs){const err=receiveError(ship,mine,theirs,getCapacity());if(!err)return '';if(/possédez déjà/.test(err))return '';if(ship.docked&&/^Soute/.test(err))return '';return err;}
 async function lock(){
  const v=view(),ship=getShip();if(!v)return;
  const offer=sanitizeOffer(draft||v.mine),error=offerError(ship,offer)||blockingReceive(ship,offer,v.theirs);
  if(error)throw new Error(error);
  const rev=await flush();
  const e=escrow(ship,{id:v.ref,rev},offer);if(e)throw new Error(e);
  pendingLock=v.ref+':'+rev;
  onShipChanged('Offre verrouillée : elle est mise de côté jusqu’à la fin de l’échange.');
  try{await trades.setLocked(v.id,me.uid,true,rev);}catch(err){refund(ship,opts());onShipChanged('');throw err;}finally{pendingLock=null;}
 }
 async function unlock(){const v=view();if(!v)return;const ship=getShip();if(ship.tradeEscrow?.id===v.ref){refund(ship,opts());onShipChanged('Offre déverrouillée : elle est revenue à bord.');}draft=structuredClone(v.mine);draftFor=v.ref;await trades.setLocked(v.id,me.uid,false,v.rev);}
 async function confirm(){
  const v=view(),ship=getShip();if(!v)return;
  // Le séquestre a déjà libéré la soute : on vérifie la place réelle pour ce qui arrive.
  const error=blockingReceive(ship,emptyOffer(),v.theirs);if(error)throw new Error(error);
  await trades.confirm(v.id,me.uid,v.rev);
 }

 // --- Rendu ---
 function stepper(label,value,unit,{onMinus,onPlus,onAll,minusDisabled,plusDisabled,hint}){
  const row=el('div','trade-row'),name=el('div','trade-row__name'),strong=el('strong');strong.textContent=label;name.append(strong);
  if(hint){const s=el('small');s.textContent=hint;name.append(s);}
  const ctl=el('div','trade-stepper'),minus=el('button','',{type:'button','aria-label':'Moins de '+label}),val=el('output','trade-stepper__value'),plus=el('button','',{type:'button','aria-label':'Plus de '+label});
  minus.textContent='−';plus.textContent='+';val.textContent=value+unit;minus.disabled=!!minusDisabled;plus.disabled=!!plusDisabled;minus.onclick=onMinus;plus.onclick=onPlus;ctl.append(minus,val,plus);
  if(onAll){const all=el('button','trade-all',{type:'button'});all.textContent='Tout';all.onclick=onAll;ctl.append(all);}
  row.append(name,ctl);return row;
 }
 const title=text=>{const h=el('h3','crew-section__title');h.textContent=text;return h;};
 function renderEditor(v){
  const ship=getShip();if(draftFor!==v.ref||!draft){draft=structuredClone(v.mine);draftFor=v.ref;}
  const change=fn=>()=>{fn();draft=sanitizeOffer(draft);scheduleWrite();renderEditor(v);renderActions(v);};
  const nodes=[title('Votre offre')];
  const ids=[...new Set([...Object.keys(ship.cargoItems||{}).filter(id=>(ship.cargoItems[id]||0)>=.1),...Object.keys(draft.items)])];
  for(const id of ids){
   const have=Math.floor((ship.cargoItems?.[id]||0)*10)/10,n=draft.items[id]||0,step=have>=1?1:.1;
   nodes.push(stepper(resourceName(id),n.toFixed(1),' t',{hint:have.toFixed(1)+' t en soute',minusDisabled:n<=0,plusDisabled:n>=have,
    onMinus:change(()=>{draft.items[id]=Math.max(0,Math.round((n-step)*10)/10);}),onPlus:change(()=>{draft.items[id]=Math.min(have,Math.round((n+step)*10)/10);}),onAll:change(()=>{draft.items[id]=have;})}));
  }
  if(!ids.length){const p=el('p','crew-empty');p.textContent='Soute vide : retirez des ressources du stock pour les proposer.';nodes.push(p);}
  const credits=el('label','trade-row trade-credits'),cName=el('div','trade-row__name'),cs=el('strong'),ch=el('small'),input=el('input','',{type:'number',inputmode:'numeric',min:'0',max:String(Math.floor(ship.credits||0)),step:'1','aria-label':'Crédits offerts'});
  cs.textContent='Crédits';ch.textContent=Math.floor(ship.credits||0)+' Cr à bord';cName.append(cs,ch);input.value=String(draft.credits||0);
  input.oninput=()=>{draft.credits=Math.max(0,Math.min(Math.floor(ship.credits||0),Math.floor(Number(input.value)||0)));scheduleWrite();renderActions(v);};
  input.onchange=()=>{input.value=String(draft.credits);};credits.append(cName,input);nodes.push(credits);
  const fuel=draft.fuel||0,maxFuel=Math.floor(ship.fuel||0);
  nodes.push(stepper('Carburant',fuel,' %',{hint:maxFuel+' % à bord',minusDisabled:fuel<=0,plusDisabled:fuel>=maxFuel,onMinus:change(()=>{draft.fuel=Math.max(0,fuel-5);}),onPlus:change(()=>{draft.fuel=Math.min(maxFuel,fuel+5);})}));
  const reserve=(ship.ownedModules||[]).filter(id=>!(ship.modules||[]).includes(id));
  if(reserve.length){
   const chips=el('div','trade-modules');
   for(const id of reserve){const on=draft.modules.includes(id),b=el('button','trade-chip',{type:'button','aria-pressed':String(on)});b.textContent=moduleName(id);b.onclick=change(()=>{draft.modules=on?draft.modules.filter(m=>m!==id):[...draft.modules,id];});chips.append(b);}
   const row=el('div','trade-row trade-row--modules'),name=el('div','trade-row__name'),s=el('strong'),h=el('small');s.textContent='Modules en réserve';h.textContent='Modules installés exclus';name.append(s,h);row.append(name,chips);nodes.push(row);
  }
  const focused=mineBox.contains(document.activeElement)&&document.activeElement.tagName==='INPUT';
  if(focused)return;
  mineBox.replaceChildren(...nodes);
 }
 function renderSummary(box,heading,offer,empty){const d=el('div','trade-summary');d.innerHTML=offerIsEmpty(offer)?'<p class="crew-empty">'+empty+'</p>':pairsHtml(offerPairs(offer));box.replaceChildren(title(heading),d);}
 function button(label,handler,{primary=false,disabled=false}={}){const b=el('button',primary?'primary':'',{type:'button'});b.textContent=label;b.disabled=disabled||busy;b.onclick=()=>run(label,handler);return b;}
 function renderActions(v){
  const list=[];
  if(v.stage==='request-in'){list.push(button('Accepter',()=>accept(v),{primary:true}),button('Refuser',()=>decline(v)));}
  else if(v.stage==='request-out'){list.push(button('Annuler la demande',()=>cancel(v)));}
  else if(v.stage==='compose'){const ship=getShip(),offer=sanitizeOffer(draft||v.mine),err=offerError(ship,offer)||blockingReceive(ship,offer,v.theirs);list.push(button('Verrouiller mon offre',lock,{primary:true,disabled:!!err}),button('Annuler l’échange',()=>cancel(v)));say(err||STAGE_TEXT.compose,{error:!!err});}
  else if(v.stage==='locked'){list.push(button('Modifier mon offre',unlock),button('Annuler l’échange',()=>cancel(v)));}
  else if(v.stage==='ready'){list.push(button('Confirmer l’échange',confirm,{primary:true}),button('Modifier mon offre',unlock),button('Annuler',()=>cancel(v)));}
  else if(v.stage==='confirmed'){list.push(button('Annuler l’échange',()=>cancel(v)));}
  else{list.push(button('Fermer',()=>dialog.close()));}
  actions.replaceChildren(...list);
 }

 function render(){
  renderToast();
  if(!dialog.open)return;
  const v=view();
  if(!v){mineBox.replaceChildren();theirsBox.replaceChildren();partner.replaceChildren();say('Échange terminé.');actions.replaceChildren(button('Fermer',()=>dialog.close()));return;}
  const other=profileOf(v.other)||{pseudo:'Pilote'};
  dialog.querySelector('#trade-kicker').textContent=v.mode==='space'?'ÉCHANGE EN VOL':'ÉCHANGE À QUAI · '+placeName(v.systemId,v.portId);
  dialog.querySelector('#trade-title').textContent='Avec '+other.pseudo;
  const who=el('div','trade-who'),state=el('small');state.textContent=v.lockedThem?(v.confirmedThem?'A confirmé':'Offre verrouillée'):v.status==='open'?'Compose son offre':v.stage==='request-out'?'Demande en attente':'';
  const name=el('strong');name.textContent=other.pseudo;who.append(name,state);partner.replaceChildren(avatarNode(v.other,other.avatar),who);
  if(v.stage!=='compose')say(v.stage==='request-in'?pseudo(v.other)+' propose un échange.':STAGE_TEXT[v.stage]);
  if(v.stage==='compose')renderEditor(v);
  else if(['request-in','request-out','expired'].includes(v.stage))mineBox.replaceChildren();
  else renderSummary(mineBox,v.stage==='done'?'Vous avez donné':'Votre offre',v.mine,'Rien');
  if(['request-in','request-out','expired'].includes(v.stage))theirsBox.replaceChildren();
  else renderSummary(theirsBox,v.stage==='done'?'Vous avez reçu':'Offre de '+other.pseudo,v.theirs,v.lockedThem?'Rien':'Rien pour l’instant.');
  renderActions(v);
 }
 function renderToast(){
  const v=[...views.values()].find(x=>x.stage==='request-in'&&!dismissed.has(x.ref)&&x.id!==currentId);
  toast.hidden=!v||!me||dialog.open;if(toast.hidden){toast.dataset.id='';return;}
  if(toast.dataset.id===v.ref)return;toast.dataset.id=v.ref;
  const other=profileOf(v.other)||{pseudo:'Pilote'},text=el('p','crew-toast__text');text.textContent=other.pseudo+' propose un échange'+(v.mode==='space'?' en vol':' à quai');
  const see=el('button','primary',{type:'button'});see.textContent='Voir';see.onclick=()=>{dismissed.add(v.ref);open(v.id);};
  const no=el('button','',{type:'button'});no.textContent='Refuser';no.onclick=()=>run('Refuser',()=>decline(v));
  const acts=el('div','crew-card__actions');acts.append(see,no);toast.replaceChildren(avatarNode(v.other,other.avatar),text,acts);
 }

 // --- API ---
 function openDialog(){beforeOpen?.();for(const d of document.querySelectorAll('dialog[open]'))if(d!==dialog)d.close();if(!dialog.open)dialog.showModal();render();}
 function open(id){currentId=id;draft=null;openDialog();}
 function setUser(u){
  unsub?.();unsub=null;views=new Map();loaded=false;currentId=null;draft=null;dismissed.clear();settling.clear();
  me=u?{uid:u.uid}:null;if(dialog.open)dialog.close();
  if(!me){render();return;}
  unsub=trades.listen(me.uid,(docs,err)=>{
   if(err){console.error('Échanges',err);return;}
   views=new Map(docs.map(d=>[d.id,tradeView(d,me.uid)]).filter(([,v])=>v));loaded=true;
   loadProfiles?.([...views.values()].map(v=>v.other)).then(render);
   reconcile();render();
  });
 }
 // Changement de lieu (désamarrage, saut) : les échanges à quai en cours sont annulés.
 function setPlace(place){
  const key=place.systemId+':'+(place.portId||'');if(key===lastPlace)return;lastPlace=key;
  for(const v of views.values())if(ACTIVE.includes(v.status)&&!v.expired&&!placeOk(v)&&(v.status==='open'||!v.incoming))run('Annulation',()=>cancel(v));
  render();
 }
 // Amarrage en vol en cours : rôle de ce pilote (hôte = destinataire immobile, visiteur = demandeur qui accoste).
 function spaceLink(){const v=[...views.values()].find(x=>x.mode==='space'&&x.status==='open');return v?{id:v.id,ref:v.ref,role:v.incoming?'host':'guest',other:v.other}:null;}
 function cancelSpace(reason){const v=[...views.values()].find(x=>x.mode==='space'&&x.status==='open');if(v)run('Annulation',async()=>{await cancel(v);onShipChanged(reason);});}
 const activeWith=uid=>[...views.values()].find(v=>v.other===uid&&ACTIVE.includes(v.status)&&!v.expired)||null;
 return {setUser,setPlace,spaceLink,cancelSpace,request:(uid,o)=>run('Demande d’échange',()=>request(uid,o)),open,activeWith,refresh:render};
}
