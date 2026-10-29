// Sons synthétisés à la volée : aucun fichier audio, désactivé par défaut.
let ctx = null;
let on = false;

export const isOn = () => on;

export function toggle() {
  on = !on;
  if (on && !ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return on;
}

export function beep(freq = 440, dur = 0.08, type = 'square', vol = 0.04) {
  if (!on || !ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + dur);
}
