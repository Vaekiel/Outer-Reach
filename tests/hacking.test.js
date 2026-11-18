import test from 'node:test';
import assert from 'node:assert/strict';
import {createHacking} from '../hacking.js';

function setup(t){
 const grid={children:[],append(button){this.children.push(button);}};
 const status={},moves={},closeButton={};
 const dialog={open:false,querySelector(selector){return {'.hack-grid':grid,'.hack-status strong':status,'.hack-status span':moves,'.dialoghead button':closeButton}[selector];},showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
 const previous=globalThis.document;
 globalThis.document={body:{append(){}},createElement(tag){return tag==='dialog'?dialog:{dataset:{},setAttribute(){}};}};
 t.after(()=>{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;});
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:1000});
 const successes=[],failures=[];
 const hacking=createHacking({beforeOpen(){},onSuccess:id=>successes.push(id),onFailure:id=>failures.push(id)});
 return {hacking,grid,status,dialog,closeButton,successes,failures};
}

test('abandonner après la résolution annule la réussite différée',t=>{
 const h=setup(t);h.hacking.open('archive');
 // Les segments 4 et 6 sont les deux segments verticaux du chemin central.
 h.grid.children[4].onclick();h.grid.children[6].onclick();
 assert.equal(h.status.textContent,'ACCÈS OUVERT');
 h.closeButton.onclick();h.closeButton.onclick();
 t.mock.timers.tick(1000);
 assert.deepEqual(h.successes,[]);
 assert.deepEqual(h.failures,['archive']);
 assert.equal(h.dialog.open,false);
});

test('une ancienne réussite ne ferme pas le piratage suivant',t=>{
 const h=setup(t);h.hacking.open('archive');
 h.grid.children[4].onclick();h.grid.children[6].onclick();
 h.closeButton.onclick();h.hacking.open('wreck');
 t.mock.timers.tick(400);
 assert.equal(h.dialog.open,true);
 assert.deepEqual(h.successes,[]);
});

test('la réussite valide une seule fois le site résolu',t=>{
 const h=setup(t);h.hacking.open('archive');
 h.grid.children[4].onclick();h.grid.children[6].onclick();
 t.mock.timers.tick(400);h.closeButton.onclick();
 assert.deepEqual(h.successes,['archive']);
 assert.deepEqual(h.failures,[]);
});

test('un clic après expiration ne peut pas résoudre le circuit',t=>{
 const h=setup(t);h.hacking.open('archive');
 h.grid.children[4].onclick();
 // L'horloge dépasse la limite avant le prochain passage du minuteur.
 t.mock.timers.setTime(46000);
 h.grid.children[6].onclick();
 t.mock.timers.tick(1000);
 assert.deepEqual(h.successes,[]);
 assert.deepEqual(h.failures,['archive']);
});

test('la limite de mouvements ne déclenche pas deux abandons',t=>{
 const h=setup(t);h.hacking.open('archive');
 t.mock.timers.tick(44500);
 for(let i=0;i<18;i++)h.grid.children[0].onclick();
 assert.equal(h.status.textContent,'VERROUILLÉ');
 t.mock.timers.tick(1000);
 assert.deepEqual(h.failures,['archive']);
 assert.deepEqual(h.successes,[]);
});
