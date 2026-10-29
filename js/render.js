// Rendu canvas : vue spatiale et radar.
import { CFG, targetPos, canMine } from './sim.js';

const stars = Array.from({ length: 140 }, (_, i) => {
  const r = (n) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: r(1), y: r(2), z: 0.15 + r(3) * 0.6, c: r(4) };
});

export function resize(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  return { w, h, dpr };
}

function polygon(ctx, a, zoom, sx, sy) {
  ctx.beginPath();
  a.shape.forEach((k, i) => {
    const ang = (i / a.shape.length) * Math.PI * 2;
    const px = sx + Math.cos(ang) * a.radius * k * zoom;
    const py = sy + Math.sin(ang) * a.radius * k * zoom;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  });
  ctx.closePath();
}

export function drawSpace(canvas, w, zoom, t) {
  const { w: W, h: H, dpr } = resize(canvas);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#070d11';
  ctx.fillRect(0, 0, W, H);
  const s = w.ship;
  const cx = W / 2;
  const cy = H / 2;

  for (const st of stars) {
    const x = (((st.x * 1600 - s.x * st.z * zoom) % 1600) + 1600) % 1600;
    const y = (((st.y * 1200 - s.y * st.z * zoom) % 1200) + 1200) % 1200;
    ctx.fillStyle = st.c > 0.8 ? '#9fe3ff' : st.c > 0.6 ? '#ffd9a0' : '#c8d6dc';
    ctx.globalAlpha = 0.35 + st.z;
    ctx.fillRect(Math.floor(x * (W / 1600)), Math.floor(y * (H / 1200)), st.z > 0.5 ? 2 : 1, st.z > 0.5 ? 2 : 1);
  }
  ctx.globalAlpha = 1;

  const tp = targetPos(w);
  const toScreen = (x, y) => [cx + (x - s.x) * zoom, cy + (y - s.y) * zoom];

  // Station
  {
    const [sx, sy] = toScreen(0, 0);
    const r = CFG.stationRadius * zoom;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(t * 0.05);
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = Math.max(2, r * 0.18);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#2c6b73';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(-r * 0.22, -r * 0.22, r * 0.44, r * 0.44);
    ctx.restore();
    ctx.fillStyle = Math.floor(t * 1.5) % 2 ? '#7cf5a0' : '#1d5b35';
    ctx.fillRect(sx + r + 4, sy - 2, 4, 4);
    label(ctx, 'Relais-9', sx, sy - r - 10, '#7cf5a0');
  }

  // Astéroïdes
  for (const a of w.asteroids) {
    const [sx, sy] = toScreen(a.x, a.y);
    if (sx < -80 || sy < -80 || sx > W + 80 || sy > H + 80) continue;
    const empty = a.ore <= 0;
    polygon(ctx, a, zoom, sx, sy);
    ctx.fillStyle = empty ? '#262b2e' : '#7a6a58';
    ctx.fill();
    ctx.strokeStyle = empty ? '#3a4246' : '#b89c7a';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!empty) {
      ctx.fillStyle = '#d9a441';
      ctx.fillRect(sx - a.radius * zoom * 0.25, sy - a.radius * zoom * 0.1, 4, 4);
      ctx.fillRect(sx + a.radius * zoom * 0.2, sy + a.radius * zoom * 0.25, 3, 3);
    }
  }

  // Cible
  if (tp) {
    const [sx, sy] = toScreen(tp.x, tp.y);
    const r = tp.radius * zoom + 8;
    if (sx > 0 && sy > 0 && sx < W && sy < H) {
      ctx.strokeStyle = '#ffd36e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(sx - r, sy - r, r * 2, r * 2);
      ctx.setLineDash([]);
    } else {
      const ang = Math.atan2(sy - cy, sx - cx);
      const ex = cx + Math.cos(ang) * (Math.min(W, H) / 2 - 24);
      const ey = cy + Math.sin(ang) * (Math.min(W, H) / 2 - 24);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);
      ctx.fillStyle = '#ffd36e';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-8, -7);
      ctx.lineTo(-8, 7);
      ctx.fill();
      ctx.restore();
    }
    // portée d'extraction
    if (tp.ast) {
      ctx.strokeStyle = canMine(w) ? 'rgba(124,245,160,.5)' : 'rgba(255,255,255,.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, (tp.radius + CFG.mineRange) * zoom, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Faisceau d'extraction
  if (w.mining && tp) {
    const [sx, sy] = toScreen(tp.x, tp.y);
    ctx.strokeStyle = Math.floor(t * 20) % 2 ? '#ff8f5a' : '#ffd36e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();
  }

  // Vaisseau
  if (!s.docked) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(s.a);
    const flame = Math.hypot(s.vx, s.vy) > 1 ? 6 + Math.random() * 6 : 0;
    ctx.fillStyle = '#ff8f5a';
    if (flame) ctx.fillRect(-14 - flame, -2, flame, 4);
    ctx.fillStyle = '#d7e3e8';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, -9);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4fd1c5';
    ctx.fillRect(2, -2, 5, 4);
    ctx.restore();
    label(ctx, 'Sillon 01', cx, cy + 26, '#9fb7bf');
  }
}

function label(ctx, text, x, y, color) {
  ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function drawRadar(canvas, w) {
  const { w: W, h: H, dpr } = resize(canvas);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#081317';
  ctx.fillRect(0, 0, W, H);
  const range = 2000;
  const sc = Math.min(W, H) / 2 / range;
  const cx = W / 2;
  const cy = H / 2;
  ctx.strokeStyle = '#1c3a40';
  ctx.lineWidth = 1;
  for (const r of [500, 1000, 2000]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * sc, 0, Math.PI * 2);
    ctx.stroke();
  }
  const s = w.ship;
  const dot = (x, y, color, size, diamond) => {
    const px = cx + (x - s.x) * sc;
    const py = cy + (y - s.y) * sc;
    if (Math.hypot(px - cx, py - cy) > Math.min(W, H) / 2) return;
    ctx.fillStyle = color;
    if (diamond) {
      ctx.beginPath();
      ctx.moveTo(px, py - size);
      ctx.lineTo(px + size, py);
      ctx.lineTo(px, py + size);
      ctx.lineTo(px - size, py);
      ctx.fill();
    } else ctx.fillRect(px - size / 2, py - size / 2, size, size);
  };
  dot(0, 0, '#7cf5a0', 5, true);
  for (const a of w.asteroids) dot(a.x, a.y, a.ore > 0 ? '#ff9f43' : '#4a5559', 4, false);
  const tp = targetPos(w);
  if (tp) {
    const px = cx + (tp.x - s.x) * sc;
    const py = cy + (tp.y - s.y) * sc;
    ctx.strokeStyle = '#ffd36e';
    ctx.strokeRect(px - 5, py - 5, 10, 10);
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(s.a);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(-4, -4);
  ctx.lineTo(-4, 4);
  ctx.fill();
  ctx.restore();
}
