// Détection Xbox/PlayStation et curseur de navigation manette (croix directionnelle + A).
export function controllerType(id){
 if(!id)return 'xbox';
 const s=id.toLowerCase();
 if(s.includes('054c')||s.includes('sony')||s.includes('dualshock')||s.includes('dualsense')||s.includes('playstation'))return 'playstation';
 return 'xbox';
}
export const GLYPHS={
 xbox:{a:{label:'A',color:'#8bd35a'},b:{label:'B',color:'#e2554f'},x:{label:'X',color:'#5aa7e0'},y:{label:'Y',color:'#e0c04a'},r1:{label:'RB',color:'#d8dde2'},l1:{label:'LB',color:'#d8dde2'}},
 playstation:{a:{label:'✕',color:'#6fa8dc'},b:{label:'○',color:'#e06a6a'},x:{label:'□',color:'#e07fc9'},y:{label:'△',color:'#7fd9a6'},r1:{label:'R1',color:'#d8dde2'},l1:{label:'L1',color:'#d8dde2'}}
};
function visible(el){return !!(el.offsetWidth||el.offsetHeight||el.getClientRects().length)&&getComputedStyle(el).visibility!=='hidden';}
function scopeRoot(){return document.querySelector('dialog[open]')||document.querySelector('.context-menu:not([hidden])')||document.body;}
function candidates(root){return [...root.querySelectorAll('button,input,textarea,[tabindex]')].filter(el=>!el.disabled&&visible(el));}
function scrollableAncestor(el){let node=el;while(node&&node!==document.body){const style=getComputedStyle(node);if((style.overflowY==='auto'||style.overflowY==='scroll')&&node.scrollHeight>node.clientHeight)return node;node=node.parentElement;}return null;}
// Badge flottant montrant le bouton (A/✕...) qui valide l'élément actuellement ciblé par le curseur.
let activateGlyph=GLYPHS.xbox.a,badge=null;
export function setActivateGlyph(glyph){activateGlyph=glyph;if(badge&&!badge.hidden)renderBadge();}
function ensureBadge(){if(!badge){badge=document.createElement('div');badge.className='gamepad-badge';badge.hidden=true;document.body.append(badge);}return badge;}
function renderBadge(){const b=ensureBadge();b.textContent=activateGlyph.label;b.style.color=activateGlyph.color;}
function positionBadge(el){const b=ensureBadge();renderBadge();const r=el.getBoundingClientRect();b.style.left=Math.round(r.right-4)+'px';b.style.top=Math.round(r.top-4)+'px';b.hidden=false;}
function hideBadge(){if(badge)badge.hidden=true;}
export function createGamepadNav(){
 let current=null;
 function clearCursor(){if(current)current.classList.remove('gamepad-cursor');current=null;hideBadge();}
 function setCursor(el){if(current)current.classList.remove('gamepad-cursor');current=el;el.classList.add('gamepad-cursor');el.scrollIntoView?.({block:'nearest',inline:'nearest'});positionBadge(el);setTimeout(()=>{if(current===el)positionBadge(el);},260);}
 function move(dx,dy){
  const root=scopeRoot(),items=candidates(root);
  if(!items.length){clearCursor();if(dy)(scrollableAncestor(root)||root).scrollBy?.({top:dy*70,behavior:'smooth'});return;}
  if(!current||!items.includes(current)){setCursor(items[0]);return;}
  const cr=current.getBoundingClientRect(),cx=cr.left+cr.width/2,cy=cr.top+cr.height/2;
  let best=null,bestScore=Infinity;
  for(const el of items){
   if(el===current)continue;
   const r=el.getBoundingClientRect(),ex=r.left+r.width/2,ey=r.top+r.height/2,ddx=ex-cx,ddy=ey-cy;
   const primary=dx*ddx+dy*ddy;if(primary<=0)continue;
   const lateral=Math.abs(dx*ddy-dy*ddx),score=primary+lateral*2;
   if(score<bestScore){bestScore=score;best=el;}
  }
  // Rien de ciblable dans cette direction : on tente de faire défiler le conteneur à la place.
  if(best)setCursor(best);
  else if(dy){const s=scrollableAncestor(current)||scrollableAncestor(root);s?.scrollBy?.({top:dy*70,behavior:'smooth'});}
 }
 function activate(){if(!current||current.disabled)return;if(current.matches('input,textarea'))current.focus();else current.click();}
 function reset(){clearCursor();}
 return {move,activate,reset,get current(){return current;}};
}
