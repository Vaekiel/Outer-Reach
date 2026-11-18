import {miningSprite} from './mining-art.js';
const indices={alouette:0,estafette:1,grappin:2,chaland:3},cache=new Map();
let atlas;
export function civilianSprite(n){
 if(n.hullId)return miningSprite(n.hullId);
 const index=indices[n.model];if(index===undefined)return null;
 if(cache.has(index))return cache.get(index);
 if(!atlas){atlas=new Image();atlas.src=new URL('./assets/civilian-ships-proposal.png',import.meta.url).href;}
 if(!atlas.complete||!atlas.naturalWidth)return null;
 const x=Math.round(index%2*atlas.naturalWidth/2),y=Math.round(Math.floor(index/2)*atlas.naturalHeight/2);
 const width=Math.round((index%2+1)*atlas.naturalWidth/2)-x,height=Math.round((Math.floor(index/2)+1)*atlas.naturalHeight/2)-y;
 const source=document.createElement('canvas');source.width=width;source.height=height;
 const c=source.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(atlas,x,y,width,height,0,0,width,height);
 const pixels=c.getImageData(0,0,width,height),data=pixels.data;
 let left=width,top=height,right=-1,bottom=-1;
 for(let py=0;py<height;py++)for(let px=0;px<width;px++){
  const i=(py*width+px)*4;if(Math.max(data[i],data[i+1],data[i+2])<=8)data[i+3]=0;
  if(data[i+3]){left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);}
 }
 if(right<left)return null;c.putImageData(pixels,0,0);
 const w=right-left+1,h=bottom-top+1,size=Math.max(w,h)+8,tile=document.createElement('canvas');tile.width=tile.height=size;
 const out=tile.getContext('2d');out.imageSmoothingEnabled=false;
 out.drawImage(source,left,top,w,h,Math.floor((size-w)/2),Math.floor((size-h)/2),w,h);
 cache.set(index,tile);return tile;
}
