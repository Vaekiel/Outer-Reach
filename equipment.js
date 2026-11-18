import {getHull} from './ships.js';
export const hull={name:'Sillon',power:60,slots:{utility:1,propulsion:1}};
export const slotNames={utility:'Utilitaire',propulsion:'Propulsion'};
export const modules=[
 {id:'laser',name:'Foreuse à impulsion',price:240,slot:'utility',power:35,size:1,description:'Extraction ×1,7 · chauffe +60 %'},
 {id:'cargo',name:'Soute renforcée',price:320,slot:'utility',power:4,size:1,description:'Soute +25 t · accélération −18 %'},
 {id:'engine',name:'Tuyère haute poussée',price:420,slot:'propulsion',power:28,size:1,description:'Poussée +40 % · consommation +45 %'},
 {id:'decryptor',name:'Décodeur d’accès',price:520,slot:'utility',power:22,size:1,description:'Autorise le piratage des sites à sonder'},
 {id:'drill_m',name:'Foreuse moyenne',price:680,slot:'utility',size:2,only:['veine'],power:65,description:'Extraction ×2 · chauffe ×2'},
 {id:'hold_m',name:'Soute moyenne',price:560,slot:'utility',size:2,only:['strate'],power:15,description:'Soute +60 t · poussée −25 %'}
];
export const powerUsed=s=>s.modules.reduce((sum,id)=>sum+(modules.find(m=>m.id===id)?.power||0),0);
export function fittingError(s,id){const m=modules.find(m=>m.id===id);if(!m)return 'Module inconnu.';const hull=getHull(s);if(!s.docked)return 'Installation uniquement à quai.';if(m.size>hull.size)return 'Module trop grand pour cette coque.';if(m.only&&!m.only.includes(hull.id))return 'Réservé au '+(m.only[0]==='veine'?'Veine':'Strate')+'.';if(!s.ownedModules?.includes(id))return 'Achetez ce module avant de l’installer.';if(s.modules.includes(id))return 'Déjà installé.';if(s.modules.filter(x=>modules.find(m=>m.id===x)?.slot===m.slot).length>=hull.slots[m.slot])return 'Emplacement '+slotNames[m.slot].toLowerCase()+' occupé : retirez son module.';if(powerUsed(s)+m.power>hull.power)return 'Puissance insuffisante : '+(powerUsed(s)+m.power)+' / '+hull.power+' unités.';return '';}
export function removalError(s,id){if(!s.docked)return 'Retrait uniquement à quai.';if(!s.modules.includes(id))return 'Module non installé.';const remaining=getHull(s).cargo+(id!=='cargo'&&s.modules.includes('cargo')?25:0)+(id!=='hold_m'&&s.modules.includes('hold_m')?60:0);if(s.cargo>remaining)return 'Réduisez la cargaison à '+remaining+' t avant ce retrait.';return '';}
// Existing purchases are retained. Only a valid subset remains fitted after migration.
export function normalizeEquipment(s){const valid=id=>modules.some(m=>m.id===id),previous=[...new Set((s.modules||[]).filter(valid))];s.ownedModules=[...new Set([...(s.ownedModules||[]).filter(valid),...previous])];s.modules=[];const order=s.cargo>30?[...previous].sort((a,b)=>(b==='cargo')-(a==='cargo')):previous;for(const id of order)if(!fittingError({...s,docked:true},id))s.modules.push(id);return previous.some(id=>!s.modules.includes(id));}
