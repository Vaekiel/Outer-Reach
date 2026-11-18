// Atlas commun aux raffineries et petites stations de tous les systèmes.
const tiles=new Map();
let atlas;
export function industrialSprite(category,variant){
 if(category!=='refinery'&&category!=='station')return null;
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/industrial-stations.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 const v=((variant%4)+4)%4,key=category+v;
 if(tiles.has(key))return tiles.get(key);
 // Marges mesurées : la raffinerie allongée commence avant le quart théorique.
 const columns=[0,443,887,1313,1774].map(x=>Math.round(x*atlas.naturalWidth/1774));
 const middle=Math.round(443*atlas.naturalHeight/887),sy=category==='refinery'?0:middle;
 const width=columns[v+1]-columns[v],height=category==='refinery'?middle:atlas.naturalHeight-middle;
 const size=Math.max(width,height),tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(atlas,columns[v],sy,width,height,Math.floor((size-width)/2),Math.floor((size-height)/2),width,height);
 const pixels=c.getImageData(0,0,size,size);
 for(let i=0;i<pixels.data.length;i+=4){
  if(Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2])<=8)pixels.data[i+3]=0;
 }
 c.putImageData(pixels,0,0);tiles.set(key,tile);return tile;
}
