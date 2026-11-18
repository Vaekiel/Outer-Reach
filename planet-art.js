const tiles=new Map();
let atlas;
export function planetSprite(index){
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/planet-environments.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 if(tiles.has(index))return tiles.get(index);
 const size=atlas.naturalWidth/3,tile=document.createElement('canvas');
 tile.width=tile.height=size;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(atlas,index%3*size,Math.floor(index/3)*size,size,size,0,0,size,size);
 // Retirer seulement le fond noir relié aux bords, jamais les ombres internes.
 const pixels=c.getImageData(0,0,size,size),data=pixels.data;
 const visited=new Uint8Array(size*size),queue=new Uint32Array(size*size);
 let read=0,write=0;
 function visit(p){
  if(visited[p])return;visited[p]=1;
  const i=p*4;if(data[i]>12||data[i+1]>12||data[i+2]>12)return;
  data[i+3]=0;queue[write++]=p;
 }
 for(let n=0;n<size;n++){visit(n);visit((size-1)*size+n);visit(n*size);visit(n*size+size-1);}
 while(read<write){const p=queue[read++],x=p%size;
  if(x>0)visit(p-1);if(x<size-1)visit(p+1);
  if(p>=size)visit(p-size);if(p<size*(size-1))visit(p+size);
 }
 c.putImageData(pixels,0,0);tiles.set(index,tile);return tile;
}
