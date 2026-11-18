// Présentation du cockpit uniquement : réutilise les commandes et données du jeu.
export function createInterface({beforeOpen}) {
 const $=id=>document.getElementById(id);
 document.body.classList.add('outer-interface');
 const location=document.createElement('section');
 location.className='hud-location';location.setAttribute('aria-label','Position actuelle');
 location.append(document.querySelector('.location'));document.body.append(location);
 const identity=document.createElement('div');identity.className='pilot-identity';
 identity.innerHTML='<strong id="pilot-name"></strong><div class="pilot-progress"><span id="pilot-level"></span><progress id="pilot-xp" max="100" value="0" aria-label="Expérience vers le niveau suivant"></progress></div><span id="pilot-ship"></span>';
 $('hud-account').append(identity);
 const profile=document.createElement('button');profile.className='pilot-profile';profile.setAttribute('aria-label','Ouvrir le profil du pilote');profile.setAttribute('aria-haspopup','dialog');
 document.querySelector('body>header').append(profile);profile.append($('hud-account'));profile.onclick=()=>$('profile').click();
 const objective=document.querySelector('.objective');objective.classList.add('hud-objective');objective.querySelector('small').textContent='OBJECTIF';document.body.append(objective);
 // L'objectif n'occupe le HUD que pendant une mission : le texte actuel correspond
 // au tutoriel ; une future mission/contrat réutilise le même panneau. La phrase de
 // fin de tutoriel est un état libre et masque donc le panneau.
 const syncObjective=()=>{
  const text=$('objective').textContent.trim();
  objective.hidden=!text||text==='Équipement installé. Reprenez la route pour une nouvelle rotation.';
 };
 new MutationObserver(syncObjective).observe($('objective'),{childList:true,characterData:true,subtree:true});syncObjective();
 // Le panneau Objectif garde exactement la largeur du panneau Lieu, y compris
 // quand le viewport mobile change de taille.
 const syncObjectiveWidth=()=>{objective.style.width=getComputedStyle(location).width;};
 new ResizeObserver(syncObjectiveWidth).observe(location);syncObjectiveWidth();
 // Commandes tactiles compactes, alignées sur la DA des autres boutons du HUD.
 const thrust=document.querySelector(".touch [data-key='thrust']"),brake=document.querySelector(".touch [data-key='brake']");
 thrust.textContent='';brake.textContent='';thrust.setAttribute('aria-label','Accélérer');brake.setAttribute('aria-label','Freiner');
 const touchStyle=document.createElement('style');touchStyle.textContent=`
 @media(max-width:1100px){
  body.outer-interface #quickaction{display:none!important}
  body.outer-interface .touch [data-key='thrust'],body.outer-interface .touch [data-key='brake']{position:absolute!important;left:auto!important;top:auto!important;bottom:0!important;width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;font-size:0!important;transform:none!important;border:1px solid var(--or-line)!important;border-radius:3px!important;background:linear-gradient(135deg,#102839,#06131f)!important;box-shadow:inset 0 0 0 2px #03101c,inset 0 0 0 3px #1a3545!important}
  body.outer-interface .touch [data-key='thrust']{right:50px!important}body.outer-interface .touch [data-key='brake']{right:0!important}
  body.outer-interface .touch [data-key='thrust']::before,body.outer-interface .touch [data-key='brake']::before{content:'';display:block;width:23px;height:23px;margin:auto;background-position:center;background-repeat:no-repeat;background-size:23px 23px;image-rendering:pixelated}
  body.outer-interface .touch [data-key='thrust']::before{background-image:url('./assets/icons/fonctions/poussee-hud.png');filter:none}
  body.outer-interface .touch [data-key='brake']::before{background-image:url('./assets/icons/fonctions/frein-hud.png');filter:none;transform:none}
 }
 @media(max-height:500px) and (orientation:landscape){body.outer-interface .touch [data-key='thrust'],body.outer-interface .touch [data-key='brake']{width:42px!important;height:42px!important;min-height:42px!important}body.outer-interface .touch [data-key='thrust']{right:48px!important}}
 `;document.head.append(touchStyle);
 document.querySelector('.cockpit-journal>summary').textContent='Journal de bord';
 const menu=document.createElement('dialog');menu.id='cockpit-menu';menu.className='management-window cockpit-menu';menu.setAttribute('aria-labelledby','cockpit-menu-title');
 menu.innerHTML='<div class="dialoghead"><div><small>OUTER REACHS</small><h2 id="cockpit-menu-title">Menu de bord</h2></div><button data-icon="close" aria-label="Fermer le menu"></button></div>';
 document.body.append(menu);menu.querySelector('button').onclick=()=>menu.close();
 const toolbar=document.querySelector('.mobile-toolbar');
 const quick=$('quickaction');document.body.append(quick);
 const map=$('open-sector'),cargo=document.querySelector('[aria-controls="cargo-window"]');
 cargo.querySelector('span').textContent='Inventaire';cargo.setAttribute('aria-label','Inventaire : cargaison du vaisseau');
 const menuButton=document.createElement('button');menuButton.id='open-cockpit-menu';menuButton.dataset.icon='menu';menuButton.textContent='Menu';menuButton.setAttribute('aria-haspopup','dialog');menuButton.setAttribute('aria-controls',menu.id);
 menuButton.onclick=()=>{beforeOpen();for(const d of document.querySelectorAll('dialog[open]'))d.close();menu.showModal();};
 menu.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))menuButton.focus();});
 // Les anciens déclencheurs vivent désormais dans le menu : rendre le focus
 // à une commande visible après la fermeture de leur fenêtre.
 document.addEventListener('close',e=>{
  if(e.target.tagName==='DIALOG')queueMicrotask(()=>{
   if(!document.querySelector('dialog[open]')&&!document.activeElement?.getClientRects().length)menuButton.focus();
  });
 },true);
 const toolbarItems=[
  [$('opencontacts'),'recherche'],
  [map,'saut'],
  [cargo,'cargaison'],
  [menuButton,'parametres']
 ];
 for(const [button,icon] of toolbarItems){button.classList.add('asset-toolbar-icon');button.style.setProperty('--toolbar-icon',`url("./assets/icons/fonctions/${icon}.png")`);}
 toolbar.replaceChildren(...toolbarItems.map(([button])=>button));
 menu.append($('left-menu'));
 // Options devient une entrée du même niveau que Profil, Craft et Arbre.
 const optionsButton=document.createElement('button');optionsButton.id='open-options';optionsButton.dataset.icon='settings';optionsButton.innerHTML='<span>Options</span>';optionsButton.setAttribute('aria-label','Options');optionsButton.setAttribute('aria-haspopup','dialog');optionsButton.setAttribute('aria-controls','options-window');$('left-menu').append(optionsButton);
 const options=document.createElement('dialog');options.id='options-window';options.className='management-window';options.setAttribute('aria-labelledby','options-title');
 options.innerHTML='<div class="dialoghead"><h2 id="options-title">Options</h2><button data-icon="close" aria-label="Fermer"></button></div><div class="cockpit-options-panel"><small>SON</small><div class="cockpit-options-row sound-options"></div><small>AFFICHAGE</small><div class="cockpit-options-row zoom-options"><span>Zoom</span></div></div>';
 document.body.append(options);options.querySelector('.dialoghead button').onclick=()=>options.close();
 const soundRow=options.querySelector('.sound-options'),zoomRow=options.querySelector('.zoom-options');
 const sound=$('sound'),zoomOut=$('zoomout'),zoomIn=$('zoomin');
 if(sound){soundRow.append(sound);sound.textContent=sound.textContent||'Activer le son';}
 for(const button of [zoomOut,zoomIn].filter(Boolean))zoomRow.append(button);
 optionsButton.onclick=()=>{beforeOpen();menu.close();for(const d of document.querySelectorAll('dialog[open]'))d.close();options.showModal();};
 options.addEventListener('close',()=>optionsButton.focus());
 menu.addEventListener('click',e=>{if(e.target.closest('#left-menu button'))menu.close();},{capture:true});
 // Le profil et les services sociaux restent accessibles sans encombrer le vol.
 const shortcuts=document.createElement('nav');shortcuts.className='hud-shortcuts';shortcuts.setAttribute('aria-label','Pilote et communications');
 for(const source of [$('profile'),$('crew')].filter(Boolean)) {
  const button=document.createElement('button');button.className='hud-shortcut';button.innerHTML=source.innerHTML;button.setAttribute('aria-label',source.getAttribute('aria-label')||source.textContent);button.onclick=()=>source.click();shortcuts.append(button);
 }
 document.body.append(shortcuts);
 const help=document.createElement('button');help.dataset.icon='help';help.textContent='Aide et commandes';help.onclick=()=>{menu.close();$('help').click();};menu.append(help);
 for(const bar of document.querySelectorAll('.mini-bar')){const label=document.createElement('span');label.className='gauge-label';label.textContent=bar.title;bar.prepend(label);}
 return ({name,ship,level,xpPercent})=>{
  $('pilot-name').textContent=name;$('pilot-name').title=name;
  $('pilot-ship').textContent=ship;$('pilot-ship').title=ship;
  $('pilot-level').textContent='Niv. '+level;$('pilot-xp').value=xpPercent;
 };
}
