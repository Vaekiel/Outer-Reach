export const resources={ruthenium:{name:'Minerai ruthénifère',price:95,color:'#d2a0db',output:'alloy'},alloy:{name:'Alliage de capteur',price:0},telemetry:{name:'Matrices de télémétrie',price:120},relic:{name:'Pièces patrimoniales',price:160},ferrite:{name:'Ferrite',price:18,color:'#d6bd91'},copper:{name:'Minerai cuivré',price:27,color:'#e59970',output:'wire'},silica:{name:'Silice',price:22,color:'#bdd9e4',output:'silicon'},titanium:{name:'Minerai titanifère',price:45,color:'#b7a3dc',output:'plate'},wire:{name:'Conducteurs',price:0},silicon:{name:'Circuits bruts',price:0},plate:{name:'Plaques de titane',price:0}};
export const resourceName=id=>resources[id||'ferrite']?.name||'Ferrite';
export const total=bag=>Object.values(bag||{}).reduce((a,b)=>a+b,0);
export function normalizeResources(s){if(!s.cargoItems)s.cargoItems={ferrite:s.cargo||0};if(!s.stock)s.stock={ferrite:s.materials||0};s.cargo=total(s.cargoItems);s.materials=total(s.stock);}
export const recipePairs=(recipe,fee)=>[...Object.entries(recipe||{}).map(([id,n])=>[resourceName(id),n+' t']),...(fee?[['Frais de chantier',fee+' Cr']]:[])];
export const shortage=(s,recipe)=>Object.entries(recipe||{}).filter(([id,n])=>(s.stock?.[id]||0)+1e-8<n).map(([id,n])=>resourceName(id)+' : '+Math.ceil(n-(s.stock?.[id]||0))+' t').join(' · ');
export function consume(s,recipe){for(const [id,n] of Object.entries(recipe))s.stock[id]=Math.max(0,(s.stock[id]||0)-n);s.materials=total(s.stock);}
export const unitPrice=(s,id)=>Math.floor((resources[id]?.price||0)*(s.marketFactor??1)*(s.specialty===id?1.25:1));
export const saleValue=s=>Object.entries(s.cargoItems||{}).reduce((sum,[id,n])=>sum+Math.floor(n+1e-8)*unitPrice(s,id),0);
export const bagText=bag=>Object.entries(bag||{}).filter(([,n])=>n>.001).map(([id,n])=>resourceName(id)+' : '+n.toFixed(1)+' t').join(' · ')||'Vide';
export const bagPairs=bag=>Object.entries(bag||{}).filter(([,n])=>n>.001).map(([id,n])=>[resourceName(id),n.toFixed(1)+' t']);
export const moduleRecipes={laser:{ferrite:18,wire:4},cargo:{ferrite:25},engine:{ferrite:20,wire:5,silicon:3},decryptor:{ferrite:16,wire:6,silicon:5},drill_m:{ferrite:40,wire:12,plate:10},hold_m:{ferrite:55,plate:12}};
