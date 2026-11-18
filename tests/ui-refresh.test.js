import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pairsHtml} from '../ui-lists.js';
import {recipePairs,bagPairs} from '../resources.js';
import {formatChatTimeShort,avatarSvg,avatarSeed,safeAvatarUrl} from '../chat-channels.js';

const source=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('listes : une ligne par élément, échappement HTML et note seule',()=>{
 const html=pairsHtml([['Ferrite','18 Cr'],['<b>x</b>','"1" & 2']]);
 assert.match(html,/^<dl class="kv-list"><div><dt>Ferrite<\/dt><dd>18 Cr<\/dd><\/div>/);
 assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;')&&html.includes('&quot;1&quot; &amp; 2'));
 assert.equal(pairsHtml([],'Stock vide'),'<p class="kv-note">Stock vide</p>');
 assert.equal(pairsHtml([]),'');
});

test('listes : recettes et stocks deviennent des paires libellé / valeur',()=>{
 assert.deepEqual(recipePairs({ferrite:120,wire:10},360),[['Ferrite','120 t'],['Conducteurs','10 t'],['Frais de chantier','360 Cr']]);
 assert.deepEqual(recipePairs({ferrite:18}),[['Ferrite','18 t']]);
 assert.deepEqual(bagPairs({ferrite:12.345,copper:0,silica:.0001}),[['Ferrite','12.3 t']]);
});

test('tchat : heure courte adaptée à une card d’une ligne',()=>{
 const now=new Date(2026,8,15,14,30,0).getTime();
 assert.equal(formatChatTimeShort(now-5000,now),'1 min');
 assert.equal(formatChatTimeShort(now-42*60000,now),'42 min');
 assert.equal(formatChatTimeShort(new Date(2026,8,15,9,5).getTime(),now),'09:05');
 assert.equal(formatChatTimeShort(new Date(2026,8,12,23,59).getTime(),now),'12/09');
 assert.equal(formatChatTimeShort(now+60000,now),'1 min');
});

test('tchat : portrait pixel stable par joueur, différent entre joueurs, sans contenu externe',()=>{
 assert.equal(avatarSvg('uid-A'),avatarSvg('uid-A'));
 const seeds=new Set(['a','b','c','d','e','f','g','h'].map(avatarSeed));assert.ok(seeds.size>=7);
 const svg=avatarSvg('Q0mRSOtZxSNNLPh7QKxd2zyHMq83');
 assert.match(svg,/^<svg viewBox="0 0 8 8" shape-rendering="crispEdges"/);
 assert.doesNotMatch(svg,/https?:|<image|href=/);
 assert.equal(avatarSvg(undefined),avatarSvg(''));
});

test('tchat : seules les photos de profil en https sont retenues',()=>{
 const google='https://lh3.googleusercontent.com/a/ACg8ocKxyz=s96-c';
 assert.equal(safeAvatarUrl(google),google);
 for(const bad of ['http://lh3.googleusercontent.com/a/x','javascript:alert(1)','data:image/png;base64,AAAA','https://exemple.fr/a b.png','https://'+'x'.repeat(1100),'',null,undefined,42])assert.equal(safeAvatarUrl(bad),null,String(bad).slice(0,40));
 const chat=source('chat.js');
 assert.match(chat,/\.\.\.\(photo\?\{avatar:photo\}:\{\}\)/,'photo écrite seulement si présente');
});

test('UI : aucune police sous 10 px dans la feuille de refonte',()=>{
 const css=source('ui-refresh.css');
 const small=[...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m=>Number(m[1])).filter(n=>n<10);
 assert.deepEqual(small,[]);
 assert.match(source('index.html'),/chat\.css"><link rel="stylesheet" href="ui-refresh\.css">/);
});

test('UI : les boutons ne se coupent plus au milieu des mots',()=>{
 assert.match(source('ui-refresh.css'),/html body button\{overflow-wrap:break-word!important;word-break:normal!important/);
});

test('tchat : les messages n’utilisent pas <header> (hérite du gros cadre des panneaux)',()=>{
 const ui=source('chat-ui.js');
 assert.doesNotMatch(ui,/el\('header'/);
 assert.match(ui,/chat-msg__avatar/);
 assert.match(ui,/meta\.append\(author\);[\s\S]*?meta\.append\(time\);body\.append\(meta,text\)/,'ligne 1 pseudo (+ étiquette) + heure, ligne 2 texte');
});
