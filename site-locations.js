export const siteIds=['archive','wreck'];
const legacy={archive:{x:-650,y:-600},wreck:{x:850,y:1000}};
export function restoreSiteLocations(saved){
 return Object.fromEntries(siteIds.map((id,i)=>{
  const p=saved?.[id],valid=p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=2800&&Math.abs(p.y)<=2800;
  return [id,{...(valid?{x:p.x,y:p.y}:legacy[id]),variant:Math.abs(Math.trunc(p?.variant??i))%4,palette:Math.abs(Math.trunc(p?.palette??0))%4,history:Array.isArray(p?.history)?p.history.filter(q=>typeof q==='string'):[]}];
 }));
}
export function relocateSite(locations,id,obstacles,random=Math.random){
 const old=locations[id],used=new Set(old.history);used.add(old.x+':'+old.y);
 const clear=p=>!used.has(p.x+':'+p.y)&&Math.hypot(p.x-old.x,p.y-old.y)>=650&&obstacles.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=350+(q.radius||0));
 let next;
 for(let i=0;i<80&&!next;i++){
  // `||0` : Math.round d'un tirage négatif minuscule donne -0, que JSON sérialise en 0 (comparaison stricte instable au rechargement).
  const p={x:Math.round((random()-.5)*5200)||0,y:Math.round((random()-.5)*5200)||0};if(clear(p))next=p;
 }
 // Un générateur aléatoire dégénéré ne doit jamais bloquer la simulation.
 if(!next)for(let x=-2700;x<=2700&&!next;x+=75)for(let y=-2700;y<=2700&&!next;y+=75){const p={x,y};if(clear(p))next=p;}
 if(!next)return false;
 locations[id]={...next,variant:(old.variant+1+Math.floor(random()*3))%4,palette:(old.palette+1+Math.floor(random()*3))%4,history:[...used]};return true;
}
