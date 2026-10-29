// Simulation d'Outer Reach : aucune dépendance au navigateur, testable sous Node.

export const CFG = {
  stationRadius: 60,
  mineRange: 185,
  mineMaxSpeed: 55,
  dockRange: 220,
  dockMaxSpeed: 45,
  maxSpeed: 140,
  accel: 32,
  reverseAccel: 18,
  brakeDecel: 40,
  turnRate: 2.6,
  baseCargo: 30,
  baseMineRate: 1,
  fuelPerSecond: 0.5,
  refuelPrice: 0.5,
  orePrice: 20,
  portTax: 0.1,
  heatPerSecond: 7,
  coolPerSecond: 4,
  overheatResume: 40,
  respawnSeconds: 300,
  rescueFee: 50,
  asteroidCount: 14,
  slots: 2,
};

export const MODULES = {
  foreuse: { name: 'Foreuse renforcée', price: 120, info: '+0,6 t/s d’extraction' },
  soute: { name: 'Soute étendue', price: 100, info: '+10 t de capacité' },
  reservoir: { name: 'Injecteurs économes', price: 90, info: '−30 % de carburant consommé' },
  dissipateur: { name: 'Dissipateur thermique', price: 110, info: 'Refroidissement ×2' },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(seed = 7) {
  const r = rng(seed);
  const asteroids = [];
  for (let i = 0; i < CFG.asteroidCount; i++) {
    const ang = r() * Math.PI * 2;
    const dist = 500 + r() * 1100;
    const max = 20 + Math.round(r() * 40);
    asteroids.push({
      id: i,
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist,
      radius: 16 + max * 0.3,
      max,
      ore: max,
      respawnAt: 0,
      shape: Array.from({ length: 9 }, () => 0.78 + r() * 0.3),
    });
  }
  return {
    seed,
    time: 0,
    credits: 80,
    asteroids,
    ship: { x: 0, y: 0, vx: 0, vy: 0, a: 0, fuel: 100, heat: 0, cargo: 0, docked: true, overheated: false },
    target: null,
    mining: false,
    nav: false,
    owned: [],
    installed: [],
    notice: 'À quai. Faites le plein, puis quittez la station.',
  };
}

export const has = (w, m) => w.installed.includes(m);
export const cargoCap = (w) => CFG.baseCargo + (has(w, 'soute') ? 10 : 0);
export const mineRate = (w) => CFG.baseMineRate + (has(w, 'foreuse') ? 0.6 : 0);
export const speed = (s) => Math.hypot(s.vx, s.vy);
export const sellPrice = () => Math.floor(CFG.orePrice * (1 - CFG.portTax));

export function targetPos(w) {
  if (!w.target) return null;
  if (w.target.kind === 'station') return { x: 0, y: 0, radius: CFG.stationRadius, name: 'Relais-9' };
  const a = w.asteroids[w.target.id];
  return a ? { x: a.x, y: a.y, radius: a.radius, name: `Ferrite ${a.id + 1}`, ast: a } : null;
}

export function distanceTo(w, t) {
  return Math.hypot(t.x - w.ship.x, t.y - w.ship.y);
}

export function canMine(w) {
  const t = targetPos(w);
  if (!t || !t.ast || w.ship.docked) return false;
  const s = w.ship;
  return (
    t.ast.ore > 0 &&
    s.cargo < cargoCap(w) &&
    !s.overheated &&
    distanceTo(w, t) - t.radius < CFG.mineRange &&
    speed(s) < CFG.mineMaxSpeed
  );
}

export function canDock(w) {
  const s = w.ship;
  return !s.docked && Math.hypot(s.x, s.y) < CFG.dockRange && speed(s) < CFG.dockMaxSpeed;
}

export function setTarget(w, target) {
  w.target = target;
  w.mining = false;
  w.nav = false;
}

export function toggleMining(w) {
  if (w.mining) {
    w.mining = false;
    return 'Extraction arrêtée.';
  }
  if (!canMine(w)) return 'Extraction impossible : rapprochez-vous d’un gisement, ralentissez, ou videz la soute.';
  w.mining = true;
  return 'Extraction en cours.';
}

export function dock(w) {
  if (!canDock(w)) return 'Amarrage impossible : approchez-vous de la station et ralentissez.';
  const s = w.ship;
  Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0, docked: true });
  w.mining = false;
  w.nav = false;
  return 'Amarré à Relais-9.';
}

export function launch(w) {
  const s = w.ship;
  s.docked = false;
  s.x = CFG.stationRadius + 100;
  s.y = 0;
  s.vx = 0;
  s.vy = 0;
  s.a = 0;
  return 'Départ de la station.';
}

export function sell(w) {
  const s = w.ship;
  if (s.cargo <= 0) return 'La soute est vide.';
  const gain = Math.floor(s.cargo) * sellPrice();
  const t = Math.floor(s.cargo);
  w.credits += gain;
  s.cargo = 0;
  return `${t} t vendues pour ${gain} Cr.`;
}

export function refuelCost(w) {
  return Math.ceil((100 - w.ship.fuel) * CFG.refuelPrice);
}

export function refuel(w) {
  const cost = Math.min(refuelCost(w), w.credits);
  if (cost <= 0) return w.ship.fuel >= 100 ? 'Réservoir déjà plein.' : 'Crédits insuffisants.';
  w.credits -= cost;
  w.ship.fuel = Math.min(100, w.ship.fuel + cost / CFG.refuelPrice);
  return `Plein effectué pour ${cost} Cr.`;
}

export function buyModule(w, id) {
  const m = MODULES[id];
  if (!m || w.owned.includes(id)) return 'Module déjà possédé.';
  if (w.credits < m.price) return 'Crédits insuffisants.';
  w.credits -= m.price;
  w.owned.push(id);
  return `${m.name} acheté.`;
}

export function toggleInstall(w, id) {
  if (!w.owned.includes(id)) return '';
  if (w.installed.includes(id)) {
    w.installed = w.installed.filter((x) => x !== id);
    return `${MODULES[id].name} retiré.`;
  }
  if (w.installed.length >= CFG.slots) return `Emplacements pleins (${CFG.slots}).`;
  w.installed.push(id);
  return `${MODULES[id].name} installé.`;
}

export function rescue(w) {
  const fee = Math.min(CFG.rescueFee, w.credits);
  w.credits -= fee;
  const s = w.ship;
  Object.assign(s, { x: 0, y: 0, vx: 0, vy: 0, docked: true, cargo: 0, heat: 0, overheated: false });
  s.fuel = Math.max(s.fuel, 20);
  w.mining = false;
  w.nav = false;
  return `Remorquage effectué (${fee} Cr). Cargaison perdue.`;
}

// Cap assisté : produit des commandes virtuelles vers la cible.
function autopilot(w, dt) {
  const t = targetPos(w);
  const s = w.ship;
  if (!t) return { turn: 0, thrust: false, brake: false };
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const d = Math.hypot(dx, dy);
  const stop = t.ast ? t.radius + 120 : 140;
  if (d < stop && speed(s) < 12) {
    w.nav = false;
    return { turn: 0, thrust: false, brake: true };
  }
  const want = Math.min(90, Math.sqrt(Math.max(0, 2 * 0.5 * CFG.brakeDecel * (d - stop))));
  const wantA = Math.atan2(dy, dx);
  let diff = wantA - s.a;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const sp = speed(s);
  const turn = Math.max(-1, Math.min(1, diff * 3));
  const aligned = Math.abs(diff) < 0.35;
  const radial = (s.vx * dx + s.vy * dy) / (d || 1);
  return {
    turn,
    thrust: aligned && radial < want && s.fuel > 0,
    brake: sp > want + 4 || (sp > 8 && radial < 0),
  };
}

export function step(w, input, dt) {
  const s = w.ship;
  w.time += dt;
  for (const a of w.asteroids) {
    if (a.ore <= 0 && w.time >= a.respawnAt) a.ore = a.max;
  }
  const coolMul = has(w, 'dissipateur') ? 2 : 1;
  if (s.docked) {
    s.heat = Math.max(0, s.heat - CFG.coolPerSecond * 3 * dt);
    s.overheated = false;
    return;
  }

  let inp = input;
  const manual = input.left || input.right || input.thrust || input.reverse || input.turn;
  if (manual) w.nav = false;
  if (w.nav) inp = { ...autopilot(w, dt), reverse: false };

  const turn = inp.turn || (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  s.a += turn * CFG.turnRate * dt;
  const fuelMul = has(w, 'reservoir') ? 0.7 : 1;
  const burn = (k) => {
    s.fuel = Math.max(0, s.fuel - CFG.fuelPerSecond * fuelMul * k * dt);
  };
  if (inp.thrust && s.fuel > 0) {
    s.vx += Math.cos(s.a) * CFG.accel * dt;
    s.vy += Math.sin(s.a) * CFG.accel * dt;
    burn(1);
  }
  if (inp.reverse && s.fuel > 0) {
    s.vx -= Math.cos(s.a) * CFG.reverseAccel * dt;
    s.vy -= Math.sin(s.a) * CFG.reverseAccel * dt;
    burn(0.6);
  }
  if (inp.brake) {
    const sp = speed(s);
    if (sp > 0) {
      const k = Math.max(0, sp - CFG.brakeDecel * dt) / sp;
      s.vx *= k;
      s.vy *= k;
    }
  }
  const sp = speed(s);
  if (sp > CFG.maxSpeed) {
    s.vx *= CFG.maxSpeed / sp;
    s.vy *= CFG.maxSpeed / sp;
  }
  s.x += s.vx * dt;
  s.y += s.vy * dt;

  // Extraction et chaleur
  if (w.mining && !canMine(w)) {
    w.mining = false;
    w.notice = s.overheated ? 'Surchauffe : extraction coupée.' : 'Extraction interrompue.';
  }
  if (w.mining) {
    const ast = targetPos(w).ast;
    const take = Math.min(mineRate(w) * dt, ast.ore, cargoCap(w) - s.cargo);
    ast.ore -= take;
    s.cargo += take;
    s.heat += CFG.heatPerSecond * dt;
    if (ast.ore <= 0) {
      ast.ore = 0;
      ast.respawnAt = w.time + CFG.respawnSeconds;
      w.mining = false;
      w.notice = 'Gisement épuisé.';
    } else if (s.cargo >= cargoCap(w)) {
      w.mining = false;
      w.notice = 'Soute pleine.';
    }
    if (s.heat >= 100) {
      s.heat = 100;
      s.overheated = true;
      w.mining = false;
      w.notice = 'Surchauffe : extraction coupée.';
    }
  } else {
    s.heat = Math.max(0, s.heat - CFG.coolPerSecond * coolMul * (input.cool ? 3 : 1) * dt);
    if (s.overheated && s.heat <= CFG.overheatResume) s.overheated = false;
  }
}

// Sauvegarde

export function serialize(w) {
  return JSON.stringify({
    v: 1,
    seed: w.seed,
    time: w.time,
    credits: w.credits,
    ship: w.ship,
    owned: w.owned,
    installed: w.installed,
    ore: w.asteroids.map((a) => [a.ore, a.respawnAt]),
  });
}

export function deserialize(text) {
  const d = JSON.parse(text);
  if (!d || d.v !== 1) throw new Error('Sauvegarde incompatible');
  const w = createWorld(d.seed);
  w.time = d.time;
  w.credits = d.credits;
  Object.assign(w.ship, d.ship);
  w.owned = d.owned.filter((m) => MODULES[m]);
  w.installed = d.installed.filter((m) => MODULES[m] && w.owned.includes(m));
  d.ore.forEach(([ore, respawnAt], i) => {
    if (w.asteroids[i]) Object.assign(w.asteroids[i], { ore, respawnAt });
  });
  w.notice = 'Partie reprise.';
  return w;
}
