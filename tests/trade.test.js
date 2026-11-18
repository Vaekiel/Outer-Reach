import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRADE_LIMITS,emptyOffer,sanitizeOffer,offerTonnage,offerIsEmpty,offerError,receiveError,escrow,refund,settle,alreadySettled,tradeView,offerPairs} from '../trade-model.js';
import {total} from '../resources.js';

const ship=(extra={})=>({credits:500,fuel:60,cargoItems:{ferrite:12.5,copper:4},cargo:16.5,stock:{},materials:0,ownedModules:['laser','cargo'],modules:['laser'],...extra});
// Somme de tout ce qui existe chez les deux pilotes (hors séquestre) : ne doit jamais varier.
const wealth=(...ships)=>ships.reduce((w,s)=>({tons:+(w.tons+total(s.cargoItems)+total(s.stock)+total(s.tradeEscrow?.offer?.items)).toFixed(4),credits:w.credits+s.credits+(s.tradeEscrow?.offer?.credits||0),fuel:w.fuel+s.fuel+(s.tradeEscrow?.offer?.fuel||0),modules:w.modules+s.ownedModules.length+(s.tradeEscrow?.offer?.modules?.length||0)}),{tons:0,credits:0,fuel:0,modules:0});

test('échange : offre nettoyée (ressources connues, dixièmes, crédits et carburant entiers, modules uniques)',()=>{
 const o=sanitizeOffer({items:{ferrite:3.14159,inconnu:5,copper:-2,silica:0},credits:12.9,fuel:150,modules:['laser','laser','fusee']});
 assert.deepEqual(o,{items:{ferrite:3.1},credits:12,fuel:100,modules:['laser']});
 assert.deepEqual(sanitizeOffer(null),emptyOffer());
 assert.equal(offerIsEmpty(emptyOffer()),true);assert.equal(offerIsEmpty({...emptyOffer(),fuel:1}),false);
 assert.equal(offerTonnage({items:{ferrite:1.25,copper:2}}),3.3);
});

test('échange : on ne donne que ce qu’on a (soute, crédits, carburant, modules non installés)',()=>{
 const s=ship();
 assert.equal(offerError(s,{items:{ferrite:12.5},credits:500,fuel:60,modules:['cargo']}),'');
 assert.match(offerError(s,{items:{ferrite:13}}),/Ferrite insuffisant/);
 assert.match(offerError(s,{credits:501}),/Crédits/);
 assert.match(offerError(s,{fuel:61}),/Carburant/);
 assert.match(offerError(s,{modules:['laser']}),/Retirez le module/);
 assert.match(offerError(s,{modules:['engine']}),/absent/);
});

test('échange : on ne reçoit que ce qui tient (soute libérée par sa propre offre, réservoir, module déjà possédé)',()=>{
 const s=ship();
 assert.equal(receiveError(s,emptyOffer(),{items:{silica:13.5}},30),'');
 assert.match(receiveError(s,emptyOffer(),{items:{silica:14}},30),/13\.5 t libres/);
 assert.equal(receiveError(s,{items:{ferrite:10}},{items:{silica:23}},30),'','sa propre offre libère la soute');
 assert.match(receiveError(s,emptyOffer(),{fuel:41},30),/Réservoir : place pour 40 %/);
 assert.equal(receiveError(s,{fuel:10},{fuel:50},30),'');
 assert.match(receiveError(s,emptyOffer(),{modules:['cargo']},30),/possédez déjà/);
 assert.equal(receiveError(s,{modules:['cargo']},{modules:['cargo']},30),'','donner puis recevoir le même module');
});

test('échange : séquestre au verrouillage, restitution intégrale au déverrouillage',()=>{
 const s=ship(),before=structuredClone(s);
 const offer={items:{ferrite:12.5,copper:1},credits:200,fuel:15,modules:['cargo']};
 assert.equal(escrow(s,{id:'a_b',rev:3},offer),'');
 assert.deepEqual(s.cargoItems,{copper:3});assert.equal(s.cargo,3);assert.equal(s.credits,300);assert.equal(s.fuel,45);assert.deepEqual(s.ownedModules,['laser']);
 assert.deepEqual(s.tradeEscrow,{id:'a_b',rev:3,offer:sanitizeOffer(offer)});
 assert.match(escrow(ship(),{id:'x',rev:0},{credits:9999}),/Crédits/,'rien ne bouge si l’offre est impossible');
 assert.equal(refund(s),true);assert.equal(s.tradeEscrow,null);
 assert.deepEqual({...s,ownedModules:[...s.ownedModules].sort()},{...before,ownedModules:[...before.ownedModules].sort(),tradeEscrow:null});
 assert.equal(refund(s),false,'rien à restituer deux fois');
});

test('échange : restitution à quai avec soute remplie entre-temps → surplus au stock de la station',()=>{
 const s=ship();escrow(s,{id:'a_b',rev:1},{items:{ferrite:12.5}});
 s.cargoItems.silica=26;s.cargo=30;
 refund(s,{capacity:30,docked:true});
 assert.equal(s.cargo,30);assert.equal(s.stock.ferrite,12.5);
});

test('échange : règlement des deux côtés sans perte ni duplication, et une seule fois',()=>{
 const a=ship(),b=ship({credits:40,fuel:20,cargoItems:{titanium:6},cargo:6,ownedModules:['engine'],modules:[]});
 const start=wealth(a,b);
 const offerA={items:{ferrite:10},credits:300,fuel:0,modules:['cargo']},offerB={items:{titanium:6},credits:0,fuel:20,modules:['engine']};
 assert.equal(receiveError(a,offerA,offerB,30),'');assert.equal(receiveError(b,offerB,offerA,30),'');
 escrow(a,{id:'a_b',rev:4},offerA);escrow(b,{id:'a_b',rev:4},offerB);
 assert.deepEqual(wealth(a,b),start,'séquestres comptés');
 const ra=settle(a,{id:'a_b',rev:4,mine:offerA,theirs:offerB},{capacity:30,docked:true});
 const rb=settle(b,{id:'a_b',rev:4,mine:offerB,theirs:offerA},{capacity:30,docked:true});
 assert.deepEqual(ra,{overflow:0,refunded:0});assert.deepEqual(rb,{overflow:0,refunded:0});
 assert.deepEqual(wealth(a,b),start,'rien créé, rien perdu');
 assert.equal(a.cargoItems.titanium,6);assert.equal(a.fuel,80);assert.ok(a.ownedModules.includes('engine'));assert.equal(a.tradeEscrow,null);
 assert.equal(b.credits,340);assert.equal(b.cargoItems.ferrite,10);assert.deepEqual(b.ownedModules,['cargo']);assert.equal(b.fuel,0);
 assert.equal(settle(a,{id:'a_b',rev:4,mine:offerA,theirs:offerB}),null,'déjà réglé');assert.equal(a.credits,200);
 assert.equal(alreadySettled(a,'a_b',4),true);assert.equal(alreadySettled(a,'a_b',5),false);
});

test('échange : séquestre perdu (autre appareil) → prélèvement de ce qui reste, registre borné',()=>{
 const s=ship({tradeLedger:Array.from({length:TRADE_LIMITS.ledgerSize},(_,i)=>'old:'+i)});
 settle(s,{id:'a_b',rev:2,mine:{items:{ferrite:20},credits:100},theirs:{fuel:10}},{capacity:30});
 assert.equal(s.cargoItems.ferrite,undefined,'ferrite disponible prélevée (12,5 t sur 20)');assert.equal(s.credits,400);assert.equal(s.fuel,70);
 assert.equal(s.tradeLedger.length,TRADE_LIMITS.ledgerSize);assert.equal(s.tradeLedger.at(-1),'a_b:2');
 const t=ship({tradeEscrow:{id:'autre',rev:1,offer:{items:{},credits:50,fuel:0,modules:[]}},credits:450});
 settle(t,{id:'a_b',rev:2,mine:emptyOffer(),theirs:emptyOffer()});
 assert.equal(t.credits,500,'séquestre d’un autre échange restitué');
});

test('échange : deux échanges successifs entre les mêmes pilotes (même document, même révision) sont réglés tous les deux',()=>{
 const doc=(expiresAt)=>({id:'a_b',uids:['a','b'],from:'a',to:'b',status:'done',rev:1,expiresAt,offers:{a:emptyOffer(),b:{credits:10}},locked:{a:true,b:true},confirmed:{a:true,b:true},applied:{a:false,b:false}});
 const first=tradeView(doc(1000),'a'),second=tradeView(doc(9000),'a'),s=ship();
 assert.notEqual(first.ref,second.ref,'identifiant propre à chaque échange');
 settle(s,{id:first.ref,rev:first.rev,mine:first.mine,theirs:first.theirs});
 assert.equal(alreadySettled(s,second.ref,second.rev),false);
 settle(s,{id:second.ref,rev:second.rev,mine:second.mine,theirs:second.theirs});
 assert.equal(s.credits,520);
 const src=readFileSync(new URL('../trade-ui.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/alreadySettled\(ship,v\.id/,'le registre ne doit pas utiliser l’identifiant du document');
 assert.doesNotMatch(src,/escrow\(ship,\{id:v\.id/);
});

test('échange : branché sur la présence, l’Équipage, le tchat et la sauvegarde',()=>{
 const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
 assert.match(read('presence.js'),/portId:state\.portId\?\?null/);
 const social=read('social-ui.js');
 assert.match(social,/label:'Échanger'/);assert.match(social,/Proposer un échange/);assert.match(social,/À quai ici/);
 const app=read('app.js');
 assert.match(app,/createTradeUI\(/);assert.match(app,/tradeUI\?\.setUser\(user\)/);assert.match(app,/tradeUI\?\.setPlace\(place\)/);
 assert.match(read('index.html'),/trade\.css/);
 // Amarrage vaisseau à vaisseau : entrée depuis l'Équipage / la vue, accostage et désamarrage pilotés par la boucle de jeu.
 assert.match(social,/Amarrer et échanger/);assert.match(social,/openMateMenu/);
 assert.match(app,/tradeUI\?\.spaceLink\(\)/);assert.match(app,/moorGuest\(w,w\.teammate\)/);assert.match(app,/unmoorGuest\(w\)/);
 assert.match(read('render.js'),/mooringArm\(/);
 // Cap assisté vers le coéquipier (onglet Groupe « Rejoindre », menu du coéquipier).
 assert.match(social,/label:'Rejoindre'/);assert.match(app,/followMate\?joinGoal/);assert.match(app,/mateGoal\(w,w\.teammate,w\.mateElsewhere\)/);assert.match(read('render.js'),/drawCompass\(/);assert.match(app,/onJoinMate:/);
 const readme=read('README.md');assert.match(readme,/match \/trades\/\{pairKey\}/);assert.match(readme,/'groupId','portId','lastSeen','avatar'/);
});

test('échange : module reçu déjà possédé remboursé à son prix',()=>{
 const s=ship();const r=settle(s,{id:'x',rev:1,mine:emptyOffer(),theirs:{modules:['cargo']}});
 assert.equal(r.refunded,320);assert.equal(s.credits,820);assert.equal(s.ownedModules.filter(m=>m==='cargo').length,1);
});

test('échange : vue du document et étapes',()=>{
 const base={id:'a_b',uids:['a','b'],from:'a',to:'b',mode:'station',systemId:'oree',portId:'hub',status:'pending',rev:0,offers:{a:emptyOffer(),b:{credits:5}},locked:{a:false,b:false},confirmed:{a:false,b:false},applied:{a:false,b:false},expiresAt:2000};
 assert.equal(tradeView(base,'a',1000).stage,'request-out');
 assert.equal(tradeView(base,'b',1000).stage,'request-in');
 assert.equal(tradeView(base,'b',3000).stage,'expired');
 assert.equal(tradeView(base,'c'),null);
 const open={...base,status:'open'};
 assert.equal(tradeView(open,'a').stage,'compose');assert.equal(tradeView(open,'a').theirs.credits,5);
 assert.equal(tradeView({...open,locked:{a:true,b:false}},'a').stage,'locked');
 assert.equal(tradeView({...open,locked:{a:true,b:true}},'b').stage,'ready');
 assert.equal(tradeView({...open,locked:{a:true,b:true},confirmed:{a:true,b:false}},'a').stage,'confirmed');
 assert.equal(tradeView({...open,status:'done'},'a').stage,'done');
 assert.deepEqual(offerPairs({items:{ferrite:2},credits:10,fuel:5,modules:['laser']}),[['Ferrite','2.0 t'],['Crédits','10 Cr'],['Carburant','5 %'],['Module','Foreuse à impulsion']]);
});
