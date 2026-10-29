import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/sim.js';

const idle = {};
function flying(w) {
  S.launch(w);
  return w;
}

test('le monde est déterministe pour une même graine', () => {
  const a = S.createWorld(3);
  const b = S.createWorld(3);
  assert.deepEqual(a.asteroids, b.asteroids);
});

test('on démarre à quai avec 80 Cr', () => {
  const w = S.createWorld();
  assert.equal(w.ship.docked, true);
  assert.equal(w.credits, 80);
});

test('la poussée accélère et consomme du carburant', () => {
  const w = flying(S.createWorld());
  for (let i = 0; i < 60; i++) S.step(w, { thrust: true }, 1 / 60);
  assert.ok(S.speed(w.ship) > 25);
  assert.ok(w.ship.fuel < 100);
});

test('sans carburant, plus de poussée', () => {
  const w = flying(S.createWorld());
  w.ship.fuel = 0;
  S.step(w, { thrust: true }, 1);
  assert.equal(S.speed(w.ship), 0);
});

test('extraction : refusée trop loin, transfère du minerai à portée', () => {
  const w = flying(S.createWorld());
  const a = w.asteroids[0];
  S.setTarget(w, { kind: 'asteroid', id: a.id });
  assert.match(S.toggleMining(w), /impossible/);
  Object.assign(w.ship, { x: a.x - a.radius - 50, y: a.y, vx: 0, vy: 0 });
  assert.match(S.toggleMining(w), /en cours/);
  const before = a.ore;
  for (let i = 0; i < 120; i++) S.step(w, idle, 1 / 60);
  assert.ok(w.ship.cargo > 1.9 && w.ship.cargo < 2.1);
  assert.ok(a.ore < before);
});

test('la soute pleine arrête l’extraction', () => {
  const w = flying(S.createWorld());
  const a = w.asteroids[0];
  a.ore = 999;
  S.setTarget(w, { kind: 'asteroid', id: a.id });
  Object.assign(w.ship, { x: a.x - a.radius - 50, y: a.y, cargo: S.cargoCap(w) - 0.5, heat: 0 });
  S.toggleMining(w);
  S.step(w, idle, 1);
  assert.equal(w.mining, false);
  assert.equal(w.ship.cargo, S.cargoCap(w));
});

test('la surchauffe coupe l’extraction puis se résorbe', () => {
  const w = flying(S.createWorld());
  const a = w.asteroids[0];
  a.ore = 999;
  S.setTarget(w, { kind: 'asteroid', id: a.id });
  Object.assign(w.ship, { x: a.x - a.radius - 50, y: a.y, heat: 99 });
  S.toggleMining(w);
  S.step(w, idle, 1);
  assert.equal(w.ship.overheated, true);
  assert.equal(w.mining, false);
  for (let i = 0; i < 30; i++) S.step(w, idle, 1);
  assert.equal(w.ship.overheated, false);
});

test('un gisement épuisé réapparaît après le délai', () => {
  const w = S.createWorld();
  const a = w.asteroids[0];
  a.ore = 0;
  a.respawnAt = 10;
  S.step(w, idle, 5);
  assert.equal(a.ore, 0);
  S.step(w, idle, 6);
  assert.equal(a.ore, a.max);
});

test('amarrage soumis à la distance et à la vitesse', () => {
  const w = flying(S.createWorld());
  Object.assign(w.ship, { x: 1000, y: 0 });
  assert.equal(S.canDock(w), false);
  Object.assign(w.ship, { x: 150, y: 0, vx: 60 });
  assert.equal(S.canDock(w), false);
  w.ship.vx = 10;
  assert.equal(S.canDock(w), true);
  S.dock(w);
  assert.equal(w.ship.docked, true);
});

test('vente : prix net après taxe, soute vidée', () => {
  const w = S.createWorld();
  w.ship.cargo = 10.7;
  assert.equal(S.sellPrice(), 18);
  S.sell(w);
  assert.equal(w.credits, 80 + 10 * 18);
  assert.equal(w.ship.cargo, 0);
});

test('plein : coût proportionnel et plafonné par les crédits', () => {
  const w = S.createWorld();
  w.ship.fuel = 50;
  assert.equal(S.refuelCost(w), 25);
  S.refuel(w);
  assert.equal(w.ship.fuel, 100);
  assert.equal(w.credits, 55);
});

test('modules : achat, limite d’emplacements, effets', () => {
  const w = S.createWorld();
  w.credits = 1000;
  for (const id of ['foreuse', 'soute', 'dissipateur']) S.buyModule(w, id);
  S.toggleInstall(w, 'foreuse');
  S.toggleInstall(w, 'soute');
  assert.match(S.toggleInstall(w, 'dissipateur'), /pleins/);
  assert.equal(S.cargoCap(w), 40);
  assert.equal(S.mineRate(w), 1.6);
  assert.equal(S.buyModule(w, 'foreuse'), 'Module déjà possédé.');
});

test('remorquage : frais plafonnés, cargaison perdue', () => {
  const w = flying(S.createWorld());
  w.ship.cargo = 12;
  w.ship.fuel = 0;
  S.rescue(w);
  assert.equal(w.credits, 30);
  assert.equal(w.ship.cargo, 0);
  assert.equal(w.ship.docked, true);
  assert.ok(w.ship.fuel >= 20);
});

test('le cap assisté rejoint un gisement et s’arrête', () => {
  const w = flying(S.createWorld());
  const a = w.asteroids[0];
  S.setTarget(w, { kind: 'asteroid', id: a.id });
  w.nav = true;
  for (let i = 0; i < 60 * 240 && w.nav; i++) S.step(w, idle, 1 / 60);
  assert.equal(w.nav, false);
  assert.ok(Math.hypot(a.x - w.ship.x, a.y - w.ship.y) - a.radius < S.CFG.mineRange);
  assert.ok(S.speed(w.ship) < S.CFG.mineMaxSpeed);
});

test('sauvegarde : aller-retour fidèle et refus des versions inconnues', () => {
  const w = flying(S.createWorld(5));
  w.credits = 321;
  w.asteroids[2].ore = 3;
  S.buyModule(w, 'soute');
  const r = S.deserialize(S.serialize(w));
  assert.equal(r.credits, 221);
  assert.equal(r.asteroids[2].ore, 3);
  assert.deepEqual(r.owned, w.owned);
  assert.throws(() => S.deserialize('{"v":99}'));
});
