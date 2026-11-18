import {ambienceFor} from './ambience.js';
// Local ambient traffic, independent of player inventory and finite ore reserves.
const routes=[
 {name:'Courrier 12',role:'Navette',from:[-180,40],to:[360,-240],period:44,phase:.12,size:55},
 {name:'Courrier 27',role:'Navette',from:[120,150],to:[-460,300],period:57,phase:.58,size:55},
 {name:'Lest 04',role:'Cargo',from:[-150,180],to:[1600,-1200],period:160,phase:.06,size:95},
 {name:'Lest 19',role:'Cargo',from:[170,120],to:[2100,700],period:185,phase:.52,size:105},
 {name:'Sonde 08',role:'Mineur',from:[-160,-80],to:[700,-650],period:100,phase:.4,size:72},
 {name:'Sonde 31',role:'Mineur',from:[90,-170],to:[-1100,-1400],period:150,phase:.55,size:72}
];
const oreeRoutes=[
 {name:'Alouette 12',role:'Navette',model:'alouette',from:[-180,40],to:[-1440,-150],period:110,phase:.12,size:80,arrival:'Embarquement'},
 {name:'Estafette 27',role:'Courrier',model:'estafette',from:[120,150],to:[1420,400],period:70,phase:.14,size:60,arrival:'Relais postal'},
 {name:'Grappin 04',role:'Remorqueur',model:'grappin',from:[-150,180],to:[160,220],period:120,phase:.3,size:85,arrival:'Maintenance'},
 {name:'Chaland 19',role:'Cargo',model:'chaland',from:[170,120],to:[-770,700],period:180,phase:.15,size:140,arrival:'Déchargement'},
 {...routes[4],name:'Sillon 08',hullId:'sillon',size:100},
 {...routes[5],name:'Veine 31',hullId:'veine',size:145}
];
export function trafficAt(time,asteroids=[],systemId='oree'){const seed=ambienceFor(systemId).seed,angle=seed*.73,cos=Math.cos(angle),sin=Math.sin(angle);return (systemId==='oree'?oreeRoutes:routes).slice(0,seed<4?6:seed<9?4:2).map((r,i)=>{const p=((time/r.period+r.phase+seed*.071)%1+1)%1;let u,du,state;if(p<.1){u=0;du=0;state='À quai';}else if(p<.45){u=(p-.1)/.35;du=1;state='En transit';}else if(p<.6){u=1;du=0;state=r.arrival||(r.role==='Mineur'?'Prospection':'Livraison');}else if(p<.95){u=1-(p-.6)/.35;du=-1;state='Retour au relais';}else{u=0;du=0;state='À quai';}const smooth=u*u*(3-2*u),rawX=r.from[0]+(r.to[0]-r.from[0])*smooth,rawY=r.from[1]+(r.to[1]-r.from[1])*smooth,x=rawX*cos-rawY*sin,y=rawX*sin+rawY*cos;const target=r.role==='Mineur'&&p>=.45&&p<.6?asteroids.filter(a=>a.ore>0&&Math.hypot(a.x-x,a.y-y)<240).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0]:null;return {...r,id:'civil-'+i,hostile:false,x,y,angle:angle+Math.atan2((r.to[1]-r.from[1])*(du<0?-1:1),(r.to[0]-r.from[0])*(du<0?-1:1)),moving:du!==0,state:target?'Analyse du gisement':state,target};});}
export function nearbyTraffic(w,range=800){return (w.traffic||[]).filter(n=>Math.hypot(n.x-w.ship.x,n.y-w.ship.y)<range);}
export function radioLine(w){const index=Math.floor(w.time/28),near=nearbyTraffic(w,1000);if(!near.length)return '';const n=near[index%near.length];return n.name+' / '+(n.state==='À quai'?'Contrôle, équipage prêt au départ.':n.state==='Maintenance'?'Maintenance des docks en cours. Gardez vos distances.':n.state==='Embarquement'?'Embarquement des passagers en cours.':n.state==='Relais postal'?'Transfert du courrier confirmé.':n.state==='Déchargement'?'Livraison de ravitaillement en cours.':n.target?'Prospection en cours. Maintenons la position.':n.state==='Retour au relais'?'Contrôle local, demandons un poste à quai.':'Trajectoire confirmée. Bon vol aux équipages.');}
