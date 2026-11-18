const ores=['ferrite','copper','silica','titanium','ruthenium'];
const tiles=new Map();
let atlas;
export function asteroidTile(a){
 const column=Math.max(0,ores.indexOf(a.resource||'ferrite'));
 return column+5*(Math.abs(Math.trunc(Number(a.id)||0))%2);
}
export function asteroidSprite(a){
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/asteroid-ores.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 const index=asteroidTile(a);if(tiles.has(index))return tiles.get(index);
 // Marges mesurées : la large dalle de titane déborde légèrement la grille idéale.
 const columns=[0,397,793,1170,1586,1983].map(x=>Math.round(x*atlas.naturalWidth/1983));
 const x0=columns[index%5],x1=columns[index%5+1];
 const y0=Math.round(Math.floor(index/5)*atlas.naturalHeight/2),y1=Math.round((Math.floor(index/5)+1)*atlas.naturalHeight/2);
 const width=x1-x0,height=y1-y0,size=Math.max(width,height);
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(atlas,x0,y0,width,height,Math.floor((size-width)/2),Math.floor((size-height)/2),width,height);
 const pixels=c.getImageData(0,0,size,size),data=pixels.data;
 for(let i=0;i<data.length;i+=4)if(Math.max(data[i],data[i+1],data[i+2])<=8)data[i+3]=0;
 c.putImageData(pixels,0,0);tiles.set(index,tile);return tile;
}
