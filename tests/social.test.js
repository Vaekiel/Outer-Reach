import test from 'node:test';
import assert from 'node:assert/strict';
import {SOCIAL_LIMITS,pairId,pseudoKey,inviteId,friendView,inviteActive,joinedMembers,leftMembers,nextLeader,sortPilots,relationFor,RELATION_LABELS} from '../social-model.js';
import {readFileSync} from 'node:fs';
import {LIVE_LIMITS,makeSquadKey,isSquadKey,shouldPublishLive,predictPosition,smoothToward,liveSampleFresh} from '../social-model.js';

test('escadrille : clé secrète de 32 caractères URL-safe, différente à chaque tirage',()=>{
 let seed=7;const rnd=n=>Uint8Array.from({length:n},()=>(seed=(seed*1103515245+12345)>>>0)&255);
 const a=makeSquadKey(rnd),b=makeSquadKey(rnd);
 assert.equal(a.length,32);assert.ok(isSquadKey(a));assert.notEqual(a,b);
 assert.equal(makeSquadKey(n=>new Uint8Array(n).fill(255)),'_'.repeat(32));
 for(const bad of ['court','x'.repeat(31),'a'.repeat(65),'a/b'.repeat(11),null,42])assert.equal(isSquadKey(bad),false,String(bad));
});

test('escadrille : envoi 5 Hz au plus, seulement si utile',()=>{
 const base={s:'oree',d:false,x:0,y:0,a:0,vx:0,vy:0,at:0};
 assert.equal(shouldPublishLive(null,base,0),true);
 assert.equal(shouldPublishLive(base,{...base,x:50},100),false,'moins de 200 ms');
 assert.equal(shouldPublishLive(base,{...base,x:50},250),true,'déplacement');
 assert.equal(shouldPublishLive(base,{...base,x:1},250),false,'bruit');
 assert.equal(shouldPublishLive(base,{...base,vx:10},250),true,'accélération');
 assert.equal(shouldPublishLive(base,{...base,a:.2},250),true,'rotation');
 assert.equal(shouldPublishLive(base,{...base,s:'lisiere'},10),true,'saut de système immédiat');
 assert.equal(shouldPublishLive(base,{...base},LIVE_LIMITS.keepaliveMs),true,'battement à l’arrêt');
});

test('escadrille : trajectoire prolongée avec la vitesse, plafonnée, immobile à quai',()=>{
 const s={s:'oree',x:100,y:0,vx:50,vy:-20,a:0,d:false,t:1000};
 assert.deepEqual([predictPosition(s,1500).x,predictPosition(s,1500).y],[125,-10]);
 assert.equal(predictPosition(s,1000+10_000).x,100+50*LIVE_LIMITS.maxExtrapolationMs/1000,'plafond');
 assert.equal(predictPosition(s,500).x,100,'horloge en retard : pas de recul');
 assert.equal(predictPosition({...s,d:true},2000).x,100,'amarré');
 assert.equal(predictPosition(null,0),null);
});

test('escadrille : lissage sans saut, téléport si trop loin ou autre système',()=>{
 const target={s:'oree',x:100,y:0,a:0};
 const step=smoothToward({s:'oree',x:0,y:0,a:0},target,1/60);
 assert.ok(step.x>0&&step.x<100,'rapproche progressivement');
 let d={s:'oree',x:0,y:0,a:0};for(let i=0;i<120;i++)d=smoothToward(d,target,1/60);
 assert.ok(Math.abs(d.x-100)<.5,'rejoint la cible en 2 s');
 assert.deepEqual(smoothToward({s:'oree',x:0,y:0,a:0},{...target,x:5000},1/60),{...target,x:5000});
 assert.deepEqual(smoothToward({s:'lisiere',x:99,y:0,a:0},target,1/60),target);
 const turn=smoothToward({s:'oree',x:100,y:0,a:3.1},{...target,a:-3.1},1);
 assert.ok(Math.abs(Math.abs(turn.a)-3.14)<.1,'tourne par le plus court chemin');
 assert.equal(smoothToward(d,null,1),null);
});

test('escadrille : échantillon récent et du même système',()=>{
 const s={s:'oree',x:1,y:2,t:10_000};
 assert.equal(liveSampleFresh(s,'oree',12_000),true);
 assert.equal(liveSampleFresh(s,'lisiere',12_000),false);
 assert.equal(liveSampleFresh(s,'oree',10_000+LIVE_LIMITS.staleMs),false);
 assert.equal(liveSampleFresh(null,'oree',0),false);
});

test('escadrille : règles Realtime Database verrouillées par défaut, écriture de sa seule position',()=>{
 const rules=JSON.parse(readFileSync(new URL('../database.rules.json',import.meta.url),'utf8')).rules;
 assert.equal(rules['.read'],false);assert.equal(rules['.write'],false);
 const squad=rules.squads.$key;
 assert.match(squad['.read'],/auth != null/);assert.match(squad['.read'],/\{32,64\}/);
 assert.match(squad.$uid['.write'],/auth\.uid === \$uid/);
 assert.equal(squad.$uid.t['.validate'],'newData.val() === now');
 assert.equal(squad.$uid.$other['.validate'],false);
});

test('équipage : relation affichée (coéquipier prioritaire, ami confirmé seulement)',()=>{
 const friends=[{other:'ami',status:'friend'},{other:'attente',status:'outgoing'},{other:'recu',status:'incoming'},{other:'mate',status:'friend'}];
 const group={members:['moi','mate']};
 assert.equal(relationFor('mate',{me:'moi',friends,group}),'mate');
 assert.equal(relationFor('ami',{me:'moi',friends,group}),'friend');
 assert.equal(relationFor('attente',{me:'moi',friends,group}),null);
 assert.equal(relationFor('recu',{me:'moi',friends,group}),null);
 assert.equal(relationFor('inconnu',{me:'moi',friends,group}),null);
 assert.equal(relationFor('moi',{me:'moi',friends,group}),null);
 assert.equal(relationFor('mate',{me:'autre',friends:[],group}),null,'groupe dont je ne fais pas partie');
 assert.deepEqual(RELATION_LABELS,{mate:'Groupe',friend:'Ami'});
});

test('équipage : le tchat et les listes marquent amis et coéquipier',()=>{
 const chat=readFileSync(new URL('../chat-ui.js',import.meta.url),'utf8'),ui=readFileSync(new URL('../social-ui.js',import.meta.url),'utf8'),css=readFileSync(new URL('../social.css',import.meta.url),'utf8');
 assert.match(chat,/relationOf\?\.\(m\.uid\)/);
 assert.match(chat,/chat-msg--'\+rel/);
 assert.match(ui,/relationOf\(uid\)/);
 for(const cls of ['chat-msg--friend','chat-msg--mate','pilot-tag--friend','pilot-tag--mate'])assert.ok(css.includes(cls),cls);
});

test('équipage : identifiant d’amitié identique dans les deux sens et trié',()=>{
 assert.equal(pairId('zeta','alpha'),'alpha_zeta');
 assert.equal(pairId('alpha','zeta'),pairId('zeta','alpha'));
 assert.equal(inviteId('grp123','uidB'),'grp123_uidB');
});

test('équipage : clé de recherche du pseudo (casse et espaces)',()=>{
 assert.equal(pseudoKey('  Resmo Syssla '),'resmo syssla');
 assert.equal(pseudoKey('VEKAMEL'),pseudoKey('vekamel'));
 assert.equal(pseudoKey(null),'');
});

test('équipage : vue d’une amitié selon le pilote',()=>{
 const doc={id:'a_b',uids:['a','b'],requestedBy:'a',status:'pending'};
 assert.deepEqual(friendView(doc,'a'),{id:'a_b',other:'b',status:'outgoing'});
 assert.deepEqual(friendView(doc,'b'),{id:'a_b',other:'a',status:'incoming'});
 assert.deepEqual(friendView({...doc,status:'accepted'},'b'),{id:'a_b',other:'a',status:'friend'});
 assert.equal(friendView(doc,'c'),null);
 assert.equal(friendView(null,'a'),null);
});

test('équipage : invitation active tant qu’elle est en attente et non expirée',()=>{
 const now=1_000_000;
 assert.equal(inviteActive({status:'pending',expiresAt:now+1},now),true);
 assert.equal(inviteActive({status:'pending',expiresAt:now},now),false);
 assert.equal(inviteActive({status:'accepted',expiresAt:now+SOCIAL_LIMITS.inviteTtlMs},now),false);
 assert.equal(inviteActive(null,now),false);
});

test('équipage : rejoindre, quitter et passation du chef',()=>{
 assert.deepEqual(joinedMembers(['a'],'b'),['a','b']);
 assert.deepEqual(joinedMembers(['a','b'],'b'),['a','b']);
 assert.deepEqual(leftMembers(['a','b'],'a'),['b']);
 assert.equal(nextLeader(['a','b'],'a','a'),'b');
 assert.equal(nextLeader(['a','b'],'a','b'),'a');
 assert.equal(nextLeader(['a'],'a','a'),null);
});

test('escadrille : plus aucune écriture de position dans Firestore',()=>{
 const src=readFileSync(new URL('../social.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/'positions'/);
 assert.match(src,/squadKey:newSquadKey\(\)/,'clé renouvelée à l’arrivée d’un membre');
});

test('équipage : pilotes en ligne d’abord puis par pseudo',()=>{
 const list=sortPilots([{pseudo:'Zoé',online:false},{pseudo:'bob',online:true},{pseudo:'Alix',online:true},{pseudo:'Élie',online:false}]);
 assert.deepEqual(list.map(p=>p.pseudo),['Alix','bob','Élie','Zoé']);
});
