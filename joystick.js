export function createJoystick(takeControl){
 const root=document.createElement('div');root.id='joystick';root.setAttribute('role','group');root.setAttribute('aria-label','Joystick de direction. Clavier : flèches gauche et droite.');root.innerHTML='<div class="stick-cross"></div><div class="stick-knob"></div><span>CAP</span>';document.querySelector('.touch').prepend(root);
 const knob=root.querySelector('.stick-knob');let pointer=null,x=0,y=0;
 function reset(){pointer=null;x=y=0;knob.style.transform='translate(0px,0px)';root.classList.remove('engaged');}
 function update(e){const b=root.getBoundingClientRect(),radius=b.width*.32,dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,len=Math.max(radius,Math.hypot(dx,dy));x=dx/len;y=dy/len;knob.style.transform=`translate(${Math.round(x*radius)}px,${Math.round(y*radius)}px)`;}
 root.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();takeControl();pointer=e.pointerId;root.setPointerCapture(pointer);root.classList.add('engaged');update(e);});
 root.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();update(e);}});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(ev,e=>{if(e.pointerId===pointer)reset();});
 return {reset,read:()=>({x,y,active:pointer!==null})};
}
