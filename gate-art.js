const tiles=new Map();
let atlas;
// La couleur dépend de la destination, indépendamment des sauvegardes.
export function gateVariant(p){
 if(Number.isInteger(p.variant))return ((p.variant%4)+4)%4;
 return [...(p.destination||p.id||'gate')].reduce((n,c)=>n+c.codePointAt(0),0)%4;
}
export function gateSprite(p){
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/travel-gates-colors.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 const v=gateVariant(p);if(tiles.has(v))return tiles.get(v);
 const width=atlas.naturalWidth/2,height=atlas.naturalHeight/2,size=Math.max(width,height);
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(atlas,(v%2)*width,Math.floor(v/2)*height,width,height,(size-width)/2,(size-height)/2,width,height);
 const pixels=c.getImageData(0,0,size,size);
 for(let i=0;i<pixels.data.length;i+=4){
  if(Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2])<=8)pixels.data[i+3]=0;
 }
 c.putImageData(pixels,0,0);tiles.set(v,tile);return tile;
}
export function drawGate(c,p,x,y,scale=1){
 const sprite=gateSprite(p);if(!sprite)return false;
 const size=Math.max(1,Math.round(150*scale));
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(sprite,Math.round(x-size/2),Math.round(y-size/2),size,size);c.restore();return true;
}
