// Support manette (API Gamepad standard, ex. Xbox/PlayStation en USB ou Bluetooth).
// Stick gauche : cap (comme le joystick tactile). Stick droit : strafe RCS
// (X = latéral, Y = avant/arrière). Gâchettes : poussée/marche arrière.
// R1/RB : extraction [E]. L1/LB : refroidissement actif (maintenir).
// A : valider la sélection (croix directionnelle).
// B : frein. X : cibler le contact le plus proche. Y : amarrage/services [F].
const DEADZONE=.18,TRIGGER=.15;
export function createGamepad(){
 let index=null,prevSelect=false,prevMine=false,prevDock=false,prevTarget=false,prevUp=false,prevDown=false,prevLeft=false,prevRight=false,prevBrake=false;
 window.addEventListener('gamepadconnected',e=>{index=e.gamepad.index;});
 window.addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index===index)index=null;});
 function read(){
  if(index===null||!navigator.getGamepads)return null;
  const pad=navigator.getGamepads()[index];
  if(!pad)return null;
  const x=pad.axes[0]||0,y=pad.axes[1]||0,stickActive=Math.hypot(x,y)>DEADZONE;
  const rx=pad.axes[2]||0,ry=pad.axes[3]||0;
  const strafeX=Math.abs(rx)>DEADZONE?Math.max(-1,Math.min(1,rx)):0;
  const strafeY=Math.abs(ry)>DEADZONE?Math.max(-1,Math.min(1,-ry)):0;
  const thrust=(pad.buttons[7]?.value||0)>TRIGGER,reverse=(pad.buttons[6]?.value||0)>TRIGGER,brake=!!pad.buttons[1]?.pressed,brakeEdge=brake&&!prevBrake;prevBrake=brake;
  const select=!!pad.buttons[0]?.pressed,selectEdge=select&&!prevSelect;prevSelect=select;
  const mine=!!pad.buttons[5]?.pressed,mineEdge=mine&&!prevMine;prevMine=mine;
  const cool=!!pad.buttons[4]?.pressed;
  const dock=!!pad.buttons[3]?.pressed,dockEdge=dock&&!prevDock;prevDock=dock;
  const targetNearest=!!pad.buttons[2]?.pressed,targetEdge=targetNearest&&!prevTarget;prevTarget=targetNearest;
  const up=!!pad.buttons[12]?.pressed,upEdge=up&&!prevUp;prevUp=up;
  const down=!!pad.buttons[13]?.pressed,downEdge=down&&!prevDown;prevDown=down;
  const left=!!pad.buttons[14]?.pressed,leftEdge=left&&!prevLeft;prevLeft=left;
  const right=!!pad.buttons[15]?.pressed,rightEdge=right&&!prevRight;prevRight=right;
  const propulsionActive=thrust||reverse||strafeX!==0||strafeY!==0;
  return {id:pad.id,x,y,stickActive,strafeX,strafeY,thrust,reverse,brake,brakeEdge,selectEdge,mineEdge,cool,dockEdge,targetEdge,upEdge,downEdge,leftEdge,rightEdge,propulsionActive,active:stickActive||strafeX!==0||strafeY!==0||thrust||reverse||brake||select||mine||cool||dock||targetNearest||up||down||left||right};
 }
 return {read};
}
