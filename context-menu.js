// Accessible contextual actions, shared by mouse, touch and keyboard.
export function createContextMenu(getItems,run){
 const panel=document.createElement('div');panel.className='context-menu';panel.hidden=true;panel.setAttribute('role','menu');panel.setAttribute('aria-label','Actions sur le contact');document.body.append(panel);
 const title=document.createElement('strong'),info=document.createElement('p'),list=document.createElement('div');panel.append(title,info,list);
 let selected=null,previous=null,signature='';
 function close(restore=false){panel.hidden=true;selected=null;if(restore&&previous?.isConnected)previous.focus();}
 function refresh(){if(panel.hidden)return;const data=getItems(selected);if(!data){close();return;}title.textContent=data.title;info.textContent=data.info;
 const sig=data.items.map(i=>i.id).join();if(sig!==signature){list.replaceChildren(...data.items.map(item=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');b.dataset.action=item.id;b.onclick=()=>{const current=getItems(selected)?.items.find(i=>i.id===item.id);if(!current||current.disabled)return;const id=selected;close();run(item.id,id);};return b;}));signature=sig;}
 for(const item of data.items){const b=[...list.children].find(b=>b.dataset.action===item.id);b.textContent=item.label;b.disabled=!!item.disabled;b.title=item.reason||'';}
 }
 function open(id,x,y,origin){selected=id;previous=origin||document.activeElement;panel.hidden=false;signature='';refresh();panel.style.left=Math.max(8,Math.min(x,window.innerWidth-panel.offsetWidth-8))+'px';panel.style.top=Math.max(8,Math.min(y,window.innerHeight-panel.offsetHeight-8))+'px';list.querySelector('button:not(:disabled)')?.focus();}
 panel.addEventListener('keydown',e=>{const bs=[...list.querySelectorAll('button:not(:disabled)')],i=bs.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();bs[e.key==='Home'?0:e.key==='End'?bs.length-1:(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length]?.focus();}else if(e.key==='Tab')close();});
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target))close();});window.addEventListener('resize',()=>close());window.addEventListener('scroll',()=>close(),true);
 return {open,close,refresh,isOpen:()=>!panel.hidden};
}
