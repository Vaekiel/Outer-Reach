// Point d'entrée : boucle de jeu, entrées, interface.
import * as S from './sim.js';
import { drawSpace, drawRadar } from './render.js';
import * as audio from './audio.js';

const SAVE_KEY = 'outer-reach-save-v1';
const $ = (id) => document.getElementById(id);

let w;
try {
  const raw = localStorage.getItem(SAVE_KEY);
  w = raw ? S.deserialize(raw) : S.createWorld();
} catch {
  w = S.createWorld();
}
if (!w.ship.docked && w.ship.x === 0 && w.ship.y === 0) w.ship.docked = true;

let zoom = 0.8;
const keys = {};
const touch = {};
const pad = { turn: 0, thrust: false, reverse: false, brake: false, cool: false, active: false };

function save() {
  try {
    localStorage.setItem(SAVE_KEY, S.serialize(w));
  } catch {
    /* stockage indisponible : la partie reste jouable */
  }
}
function say(msg) {
  if (msg) w.notice = msg;
  $('notice').textContent = w.notice;
}

// --- Entrées -------------------------------------------------------------
const KEYMAP = {
  thrust: ['KeyW', 'KeyZ', 'ArrowUp'],
  reverse: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'KeyQ', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  brake: ['Space'],
};
const down = (n) => KEYMAP[n].some((c) => keys[c]) || touch[n] || pad[n];

addEventListener('keydown', (e) => {
  if (e.target.closest?.('dialog') && e.code !== 'Escape') return;
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'KeyE') action('mine');
  if (e.code === 'KeyF') action('dock');
  if (e.code === 'Escape') document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  if (e.code === 'Space') e.preventDefault();
});
addEventListener('keyup', (e) => (keys[e.code] = false));
addEventListener('blur', () => Object.keys(keys).forEach((k) => (keys[k] = false)));

document.querySelectorAll('.touch [data-key]').forEach((b) => {
  const k = b.dataset.key;
  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    touch[k] = true;
  });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => (touch[k] = false));
});

$('space').addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    zoom = Math.max(0.25, Math.min(1.4, zoom + (e.deltaY < 0 ? 0.08 : -0.08)));
  },
  { passive: false },
);
$('zoomin').onclick = () => (zoom = Math.min(1.4, zoom + 0.08));
$('zoomout').onclick = () => (zoom = Math.max(0.25, zoom - 0.08));
$('sound').onclick = () => ($('sound').textContent = audio.toggle() ? 'SON ON' : 'SON OFF');

// Sélection d'un contact en touchant la vue
$('space').addEventListener('pointerdown', (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  const wx = w.ship.x + (e.clientX - r.left - r.width / 2) / zoom;
  const wy = w.ship.y + (e.clientY - r.top - r.height / 2) / zoom;
  let best = null;
  let bd = 70 / zoom;
  const consider = (target, x, y, rad) => {
    const d = Math.hypot(x - wx, y - wy) - rad;
    if (d < bd) {
      bd = d;
      best = target;
    }
  };
  consider({ kind: 'station' }, 0, 0, S.CFG.stationRadius);
  w.asteroids.forEach((a) => consider({ kind: 'asteroid', id: a.id }, a.x, a.y, a.radius));
  if (best) select(best);
});

function pollGamepad() {
  const gp = navigator.getGamepads?.().find(Boolean);
  pad.active = !!gp;
  if (!gp) return Object.assign(pad, { turn: 0, thrust: false, reverse: false, brake: false, cool: false });
  const dz = (v) => (Math.abs(v) < 0.2 ? 0 : v);
  pad.turn = dz(gp.axes[0] || 0);
  pad.thrust = (gp.buttons[7]?.value || 0) > 0.2;
  pad.reverse = (gp.buttons[6]?.value || 0) > 0.2;
  pad.brake = !!gp.buttons[1]?.pressed;
  pad.cool = !!gp.buttons[4]?.pressed;
  const edge = (i, f) => {
    const p = !!gp.buttons[i]?.pressed;
    if (p && !pad['_' + i]) f();
    pad['_' + i] = p;
  };
  edge(5, () => action('mine'));
  edge(3, () => action('dock'));
  edge(2, nearest);
}

// --- Actions -------------------------------------------------------------
function select(t) {
  S.setTarget(w, t);
  say();
  audio.beep(660, 0.05);
}
function nearest() {
  const s = w.ship;
  let best = { kind: 'station' };
  let bd = Math.hypot(s.x, s.y);
  for (const a of w.asteroids) {
    const d = Math.hypot(a.x - s.x, a.y - s.y);
    if (a.ore > 0 && d < bd) {
      bd = d;
      best = { kind: 'asteroid', id: a.id };
    }
  }
  select(best);
}
function action(name) {
  if (w.ship.docked) return;
  if (name === 'mine') say(S.toggleMining(w));
  if (name === 'dock') {
    const m = S.dock(w);
    say(m);
    if (w.ship.docked) {
      openStation();
      save();
    }
  }
  audio.beep(520, 0.06);
}

$('stationtarget').onclick = () => select({ kind: 'station' });
$('navigate').onclick = () => {
  if (!w.target || w.ship.docked) return say('Choisissez une destination en vol.');
  w.nav = !w.nav;
  say(w.nav ? 'Cap assisté engagé.' : 'Cap assisté coupé.');
};
$('mine').onclick = () => action('mine');
$('dock').onclick = () => {
  if (w.ship.docked) openStation();
  else action('dock');
};
$('help').onclick = () => $('helppanel').showModal();
$('closehelp').onclick = () => $('helppanel').close();
$('closestation').onclick = () => $('stationpanel').close();
$('rescue').onclick = () => {
  say(S.rescue(w));
  $('helppanel').close();
  openStation();
  save();
};
$('sell').onclick = () => {
  say(S.sell(w));
  audio.beep(880, 0.1, 'triangle');
  renderStation();
  save();
};
$('refuel').onclick = () => {
  say(S.refuel(w));
  renderStation();
  save();
};
$('launch').onclick = () => {
  say(S.launch(w));
  $('stationpanel').close();
  save();
};

function openStation() {
  renderStation();
  if (!$('stationpanel').open) $('stationpanel').showModal();
}
function renderStation() {
  $('price').textContent = S.sellPrice();
  $('gross').textContent = `${S.CFG.orePrice} Cr brut · taxe portuaire ${S.CFG.portTax * 100} %`;
  $('sell').disabled = w.ship.cargo < 1;
  $('refuel').textContent = `Faire le plein · ${S.refuelCost(w)} Cr`;
  $('refuel').disabled = w.ship.fuel >= 100;
  $('stationcredits').textContent = `${w.credits} Cr`;
  $('slots').textContent = `${w.installed.length} / ${S.CFG.slots} emplacements`;
  const box = $('modules');
  box.replaceChildren();
  for (const [id, m] of Object.entries(S.MODULES)) {
    const owned = w.owned.includes(id);
    const on = w.installed.includes(id);
    const row = document.createElement('div');
    row.className = 'module';
    const info = document.createElement('span');
    info.innerHTML = `<b></b><small></small>`;
    info.firstChild.textContent = m.name;
    info.lastChild.textContent = m.info;
    const btn = document.createElement('button');
    btn.textContent = !owned ? `Acheter · ${m.price} Cr` : on ? 'Retirer' : 'Installer';
    btn.className = owned && !on ? 'primary' : '';
    btn.disabled = !owned && w.credits < m.price;
    btn.onclick = () => {
      say(owned ? S.toggleInstall(w, id) : S.buyModule(w, id));
      renderStation();
      save();
    };
    row.append(info, btn);
    box.append(row);
  }
}

// --- Interface -----------------------------------------------------------
let listKey = '';
function updateUI() {
  const s = w.ship;
  const tp = S.targetPos(w);
  $('speed').textContent = String(Math.round(S.speed(s))).padStart(3, '0');
  $('fuel').textContent = Math.round(s.fuel);
  $('heat').textContent = String(Math.round(s.heat)).padStart(2, '0');
  $('credits').textContent = `${w.credits} Cr`;
  $('cargo').textContent = `${s.cargo.toFixed(1)} / ${S.cargoCap(w)} t`;
  $('cargobar').style.width = `${(s.cargo / S.cargoCap(w)) * 100}%`;
  $('shipstatus').textContent = s.docked
    ? 'À QUAI'
    : s.overheated
      ? 'SURCHAUFFE'
      : w.mining
        ? 'EXTRACTION'
        : w.nav
          ? 'CAP ASSISTÉ'
          : 'EN VOL';
  $('stationdistance').textContent = `${Math.round(Math.hypot(s.x, s.y))} m`;
  $('targetname').textContent = tp ? tp.name : 'Aucun contact';
  $('targetinfo').textContent = tp
    ? `${Math.round(S.distanceTo(w, tp))} m` + (tp.ast ? ` · ${tp.ast.ore.toFixed(0)} t restantes` : ' · services')
    : 'Touchez un contact dans la vue ou sur la liste.';
  $('mine').textContent = w.mining ? 'Arrêter l’extraction [E]' : 'Activer l’extraction [E]';
  $('mine').disabled = !w.mining && !S.canMine(w);
  $('dock').textContent = s.docked ? 'Services de la station [F]' : 'Amarrer [F]';
  $('dock').disabled = !s.docked && !S.canDock(w);
  $('navigate').textContent = w.nav ? 'Couper le cap assisté' : 'Cap assisté vers la cible';
  document.body.classList.toggle('docked', s.docked);
  say();

  // liste des gisements triés par distance (reconstruite 4×/s au plus)
  const near = w.asteroids
    .filter((a) => a.ore > 0)
    .map((a) => ({ a, d: Math.hypot(a.x - s.x, a.y - s.y) }))
    .sort((p, q) => p.d - q.d)
    .slice(0, 4);
  const key = near.map((n) => n.a.id + ':' + Math.round(n.d / 10)).join();
  if (key !== listKey) {
    listKey = key;
    $('asteroidlist').replaceChildren(
      ...near.map(({ a, d }) => {
        const b = document.createElement('button');
        b.className = 'contact';
        b.innerHTML = '<span></span><em></em>';
        b.firstChild.textContent = `◆ Ferrite ${a.id + 1}`;
        b.lastChild.textContent = `${Math.round(d)} m`;
        b.onclick = () => select({ kind: 'asteroid', id: a.id });
        return b;
      }),
    );
  }
}

// --- Boucle --------------------------------------------------------------
let last = performance.now();
let uiTimer = 0;
let saveTimer = 0;
let prevMining = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  pollGamepad();
  const input = {
    left: down('left'),
    right: down('right'),
    thrust: down('thrust'),
    reverse: down('reverse'),
    brake: down('brake'),
    cool: pad.cool,
    turn: pad.turn,
  };
  S.step(w, input, dt);
  if (w.mining && !prevMining) audio.beep(300, 0.15, 'sawtooth');
  prevMining = w.mining;
  drawSpace($('space'), w, zoom, now / 1000);
  drawRadar($('radar'), w);
  uiTimer += dt;
  if (uiTimer > 0.1) {
    uiTimer = 0;
    updateUI();
  }
  saveTimer += dt;
  if (saveTimer > 15) {
    saveTimer = 0;
    save();
  }
  requestAnimationFrame(frame);
}
addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => document.hidden && save());

updateUI();
if (w.ship.docked) openStation();
requestAnimationFrame(frame);
