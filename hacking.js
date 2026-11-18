const N=1,E=2,S=4,W=8;
const rotate=m=>((m<<1)&15)|((m&8)>>3);
const glyph=m=>({1:'╵',2:'╴',3:'└',4:'╷',5:'│',6:'┌',8:'╶',9:'┘',10:'─',12:'┐'}[m]||'·');
// Le chemin résolu relie le bord gauche de la case 4 au bord droit de la case 7.
const solved=[2,5,10,5,10,10,10,10,3,10,9,5,10,10,10,8];
function connected(cells){
 const seen=new Set([4]),stack=[4];
 while(stack.length){
  const i=stack.pop(),m=cells[i],x=i%4;
  for(const [bit,opp,di] of [[N,S,-4],[E,W,1],[S,N,4],[W,E,-1]]){
   const j=i+di;
   if(!(m&bit)||j<0||j>15||(di===1&&x===3)||(di===-1&&x===0)||!(cells[j]&opp)||seen.has(j))continue;
   seen.add(j);stack.push(j);
  }
 }
 return Boolean(seen.has(7)&&(cells[4]&W)&&(cells[7]&E));
}
export function createHacking({beforeOpen,onSuccess,onFailure}){
 const dialog=document.createElement('dialog');dialog.id='hacking-dialog';dialog.className='management-window';
 dialog.innerHTML='<div class="dialoghead"><div><small>INTRUSION</small><h2>Relais de sécurité</h2></div><button data-icon="close" aria-label="Abandonner"></button></div><p>Tournez les segments pour relier <b>ENTRÉE</b> au <b>NOYAU</b>.</p><div class="hack-status"><strong></strong><span></span></div><div class="hack-grid" aria-label="Circuit à reconnecter"></div><small class="hack-note">Touchez une case pour la tourner · 18 mouvements maximum</small>';
 document.body.append(dialog);
 const grid=dialog.querySelector('.hack-grid'),status=dialog.querySelector('.hack-status strong'),movesText=dialog.querySelector('.hack-status span');
 let cells=[],moves=0,deadline=0,timer=0,resultTimer=0,site=null,finished=false,active=false;
 for(let i=0;i<16;i++){const b=document.createElement('button');b.type='button';b.dataset.cell=i;b.setAttribute('aria-label','Tourner le segment '+(i+1));b.onclick=()=>turn(i);grid.append(b);}
 function paint(){for(const b of grid.children){const i=Number(b.dataset.cell);b.textContent=glyph(cells[i]);b.dataset.terminal=i===4?'entry':i===7?'core':'';b.disabled=finished;}movesText.textContent=moves+' / 18';}
 function clearTimers(){clearInterval(timer);clearTimeout(resultTimer);}
 function abandon(){if(!active)return;active=false;finished=true;clearTimers();if(dialog.open)dialog.close();onFailure?.(site);}
 function turn(i){
  if(!active||finished)return;if(Date.now()>=deadline){tick();return;}cells[i]=rotate(cells[i]);moves++;paint();
  if(connected(cells)){finished=true;status.textContent='ACCÈS OUVERT';paint();clearInterval(timer);resultTimer=setTimeout(()=>{active=false;dialog.close();onSuccess(site);},350);}
  else if(moves>=18){finished=true;status.textContent='VERROUILLÉ';paint();clearInterval(timer);resultTimer=setTimeout(abandon,650);}
 }
 function tick(){const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));status.textContent='TEMPS '+left+' s';if(!left){finished=true;paint();abandon();}}
 dialog.querySelector('.dialoghead button').onclick=abandon;dialog.addEventListener('cancel',e=>{e.preventDefault();abandon();});
 function open(id){
  if(active)abandon();clearTimers();beforeOpen();site=id;moves=0;finished=false;active=true;
  cells=solved.map((m,i)=>{let n=m,turns=(i*7+(id==='wreck'?3:1))%4;while(turns--)n=rotate(n);return n;});
  deadline=Date.now()+45000;paint();dialog.showModal();tick();timer=setInterval(tick,250);
 }
 return {open,isOpen:()=>dialog.open};
}

export const hackingTest={rotate,connected,solved};
