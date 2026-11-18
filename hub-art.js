const tiles=new Map();
let atlas;
export function hubSprite(variant){
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/hub-stations.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 if(tiles.has(variant))return tiles.get(variant);
 // Séparations mesurées dans les marges noires de l'atlas : aucune antenne coupée.
 const splitX=Math.round(atlas.naturalWidth*638/1254),splitY=Math.round(atlas.naturalHeight*603/1254);
 const sx=variant%2?splitX:0,sy=variant>1?splitY:0;
 const width=variant%2?atlas.naturalWidth-splitX:splitX,height=variant>1?atlas.naturalHeight-splitY:splitY;
 const size=Math.max(width,height),tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(atlas,sx,sy,width,height,Math.floor((size-width)/2),Math.floor((size-height)/2),width,height);
 // Le noir est réservé au vide, y compris aux ouvertures fermées des anneaux.
 const pixels=c.getImageData(0,0,size,size);
 for(let i=0;i<pixels.data.length;i+=4){
  if(Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2])<=8)pixels.data[i+3]=0;
 }
 c.putImageData(pixels,0,0);tiles.set(variant,tile);return tile;
}
