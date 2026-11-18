const files={sillon:'sillon-mining-s.png',veine:'veine-mining-m.png',strate:'strate-mining-l.png',filon:'filon-mining-xl.png'};
const cache=new Map(),images=new Map();
export const miningLengths={sillon:100,veine:145,strate:200,filon:270};
function load(id){
 if(images.has(id))return images.get(id);
 const image=new Image(),entry={image,ready:null};
 entry.ready=new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false);});
 images.set(id,entry);image.src=new URL('./assets/'+files[id],import.meta.url).href;return entry;
}
export function miningSprite(id){
 if(!files[id])return null;if(cache.has(id))return cache.get(id);
 const {image}=load(id);if(!image.complete||!image.naturalWidth)return null;
 const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
 const c=source.getContext('2d');c.drawImage(image,0,0);
 const pixels=c.getImageData(0,0,source.width,source.height),data=pixels.data;
 let left=source.width,top=source.height,right=-1,bottom=-1;
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
  const i=(y*source.width+x)*4;
  if(Math.max(data[i],data[i+1],data[i+2])<=8)data[i+3]=0;
  if(data[i+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 if(right<left)return null;c.putImageData(pixels,0,0);
 const width=right-left+1,height=bottom-top+1,size=Math.max(width,height)+8;
 const tile=document.createElement('canvas');tile.width=tile.height=size;
 const out=tile.getContext('2d');out.imageSmoothingEnabled=false;
 out.drawImage(source,left,top,width,height,Math.floor((size-width)/2),Math.floor((size-height)/2),width,height);
 cache.set(id,tile);return tile;
}
export function paintMiningPortrait(canvas,id){
 const paint=()=>{const c=canvas.getContext('2d'),tile=miningSprite(id);c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;if(tile)c.drawImage(tile,0,0,canvas.width,canvas.height);};
 paint();if(files[id])load(id).ready.then(ok=>{if(ok)paint();});
}
