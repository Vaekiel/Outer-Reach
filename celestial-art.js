const tiles=new Map();
let atlas;
export function celestialSprite(index){
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/oree-celestials.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 if(tiles.has(index))return tiles.get(index);
 const width=atlas.naturalWidth/2,height=atlas.naturalHeight/2;
 const tile=document.createElement('canvas');tile.width=width;tile.height=height;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(atlas,index%2*width,Math.floor(index/2)*height,width,height,0,0,width,height);
 const pixels=c.getImageData(0,0,width,height),data=pixels.data;
 // Fond noir transparent ; la couronne solaire reste compacte et sans carré sombre.
 for(let i=0;i<data.length;i+=4){
  const light=Math.max(data[i],data[i+1],data[i+2]);
  if(light<=8)data[i+3]=0;
 }
 c.putImageData(pixels,0,0);tiles.set(index,tile);return tile;
}
