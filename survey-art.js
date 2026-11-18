const tiles=new Map();
let atlas;
export function surveySprite(p){
 if(p.kind!=='archive'&&p.kind!=='wreck')return null;
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/survey-sites.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 const variant=Math.abs(Math.trunc(p.variant||0))%4,palette=Math.abs(Math.trunc(p.palette||0))%4,key=p.kind+variant+':'+palette;
 if(tiles.has(key))return tiles.get(key);
 const col=variant,row=p.kind==='archive'?0:1;
 const columns=[0,444,850,1330,1774].map(x=>Math.round(x*atlas.naturalWidth/1774));
 const sx=columns[col],sy=Math.round(row*atlas.naturalHeight/2);
 const width=columns[col+1]-sx,height=Math.round((row+1)*atlas.naturalHeight/2)-sy;
 const size=Math.max(width,height),tile=document.createElement('canvas');tile.width=tile.height=size;
 const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(atlas,sx,sy,width,height,Math.floor((size-width)/2),Math.floor((size-height)/2),width,height);
 const pixels=c.getImageData(0,0,size,size),d=pixels.data;
 const accents=[[139,224,213],[199,163,238],[233,195,127],[138,188,227]];
 for(let i=0;i<d.length;i+=4){
  const r=d[i],g=d[i+1],b=d[i+2];
  if(Math.max(r,g,b)<=8){d[i+3]=0;continue;}
  // Teinter les capteurs cyan seulement ; préserver cuivre et métal usé.
  if(palette&&g>r*1.25&&b>r*1.25&&Math.min(g,b)>65){
   const luminosity=Math.max(g,b)/224;
   for(let channel=0;channel<3;channel++)d[i+channel]=Math.min(255,Math.round(accents[palette][channel]*luminosity));
  }
 }
 c.putImageData(pixels,0,0);tiles.set(key,tile);return tile;
}
