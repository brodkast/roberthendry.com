// Original isometric figures for roberthendry.com, one per case study.
// Drawn on the hairline kernel (vendor/hairline-kernel.js, MIT, Lucas Marques): rounded solids, one stroke, one highlight.
(() => {
if (!window.HL) return;
const { Cam, fit, proj, facing, rings, circ, prism, mk, solid, put, open, spring, stepS, register, pointer, disposer, inject, clamp, lerp } = HL;

/* parts: every build() returns the same parts in the same order, back to front */
const box = (x0, y0, x1, y1, z0, z1, o = {}) => ({ k: 'b', x0, y0, x1, y1, z0, z1: Math.max(z1, z0 + 0.6), r: o.r ?? 2.5, hi: !!o.hi });
const cyl = (cx, cy, R, z0, z1, o = {}) => ({ k: 'c', cx, cy, R, z0, z1: Math.max(z1, z0 + 0.6), hi: !!o.hi });
const line = (pts, cls = 'lo') => ({ k: 'l', pts, cls });
const shift = (ring, cx, cy) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));
const ease = (v) => { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };

const FIG = {
  radial: { label: 'A tray of interface parts beside three screens of different sizes; the same button sits on all of them.',
    cap: 'One kit of parts. Every product is built from the same pieces.',
    build(t) { const r = t * 9; return [
      box(0, 0, 52, 74, 0, 4, { r: 7 }),
      box(8, 8, 19, 46, 4, 7 + r, { r: 5, hi: 1 }), box(27, 8, 44, 24, 4, 7, { r: 3 }), cyl(35.5, 37, 8, 4, 7),
      box(8, 52, 44, 60, 4, 7, { r: 2 }), box(8, 64, 30, 69, 4, 6, { r: 2 }),
      box(66, -8, 140, 46, 0, 3, { r: 5 }), line([[73, -4, 3.1], [73, 42, 3.1]]),
      box(80, -2, 91, 34, 3, 5.5 + r, { r: 5, hi: 1 }), line([[98, -2, 3.1], [98, 40, 3.1]]), line([[105, -2, 3.1], [105, 28, 3.1]]), box(113, -2, 132, 18, 3, 5, { r: 3 }),
      box(66, 56, 112, 100, 0, 3, { r: 5 }), box(74, 62, 85, 94, 3, 5.5 + r, { r: 5, hi: 1 }), line([[93, 62, 3.1], [93, 94, 3.1]]), line([[101, 62, 3.1], [101, 84, 3.1]]),
      box(122, 58, 144, 100, 0, 3, { r: 5 }), box(127, 63, 135, 95, 3, 5.5 + r, { r: 4, hi: 1 }), line([[139.5, 64, 3.1], [139.5, 90, 3.1]]),
    ]; } },
  bitgo: { label: 'A stack of coins on a plinth, guarded by three key posts linked in a triangle.',
    cap: 'Custody, made visible: the asset in the middle, three keys around it.',
    build(t) { const h = 9 + 18 * t, A = [21, 21], B = [78, 36], Cc = [36, 78]; return [
      box(0, 0, 90, 90, -8, 0, { r: 14 }),
      line([[...A, 0.2], [...B, 0.2], [...Cc, 0.2], [...A, 0.2]], 'dash'),
      cyl(A[0], A[1], 5, 0, h), cyl(45, 45, 27, 0, 3),
      cyl(45, 45, 16, 3, 7), cyl(45, 45, 16, 8.5, 12.5), cyl(45, 45, 16, 14, 18, { hi: 1 }),
      cyl(B[0], B[1], 5, 0, h), cyl(Cc[0], Cc[1], 5, 0, h),
    ]; } },
  unify: { label: 'A single doorway standing in front of a platform that carries nine product tiles.',
    cap: 'One front door, then every product behind it.',
    build(t) { const rest = [2, 5, 3, 6, 2, 4, 3, 5, 2], p = [box(0, 0, 86, 86, -6, 0, { r: 11 })];
      for (let s = 0; s <= 4; s++) for (let i = 0; i < 3; i++) { const j = s - i; if (j < 0 || j > 2) continue;
        const x = 6 + i * 27, y = 6 + j * 27; p.push(box(x, y, x + 20, y + 20, 0, 3 + rest[i * 3 + j] + t * (5 + 3 * Math.sin(i * 2 + j)), { r: 4 })); }
      p.push(line([[86, 43, 0.2], [118, 43, 0.2]], 'dash'), box(104, 25, 109, 30, 0, 30, { r: 1.5 }), box(104, 56, 109, 61, 0, 30, { r: 1.5 }), box(103, 24, 110, 62, 30, 35, { r: 2, hi: 1 }));
      return p; } },
  'unify-nav': { label: 'An app window with a navigation rail, and three people in front of it; the rail changes with the person chosen.',
    cap: 'Same product, different navigation, depending on who walks up to it.',
    rest: 0.5,
    build(t, u) { const pat = [[20, 14, 18, 10, 16], [12, 20, 8, 18, 14], [16, 8, 20, 12, 10]], v = clamp(u * 2, 0, 2), a = Math.min(1, Math.floor(v)), f = ease(v - a), pick = Math.round(v);
      const p = [box(0, 0, 72, 102, 0, 3, { r: 6 }), line([[5, 73, 3.1], [67, 73, 3.1]]), box(10, 8, 34, 66, 3, 5, { r: 3 }), box(40, 8, 62, 34, 3, 5, { r: 3 }), box(40, 40, 62, 66, 3, 5, { r: 3 })];
      for (let k = 0; k < 5; k++) p.push(box(9 + k * 11.5, 77, 15 + k * 11.5, 77 + lerp(pat[a][k], pat[a + 1][k], f), 3, 5, { r: 2 }));
      [20, 50, 80].forEach((y, i) => { const on = pick === 2 - i; p.push(cyl(90, y, 6.5, 0, 12 + (on ? 3 * t : 0), { hi: on }), cyl(90, y, 4.2, 13.5 + (on ? 3 * t : 0), 19.5 + (on ? 3 * t : 0))); });
      return p; } },
  apollo: { label: 'Three small profile cards float above one large profile card and come down onto it.',
    cap: 'Three profiles that never agreed, folded into one.',
    build(t) { const e = ease(t), S = [[-14, 18, 36], [58, -26, 46], [112, 74, 30]], p = [], pos = S.map(([x, y, z], i) => [lerp(x, 52, e), lerp(y, 55, e), lerp(z, 6 + i * 4, e)]);
      pos.forEach(([x, y, z]) => p.push(line([[x, y, z], [x, y, 0]], 'dash')));
      p.push(box(20, 10, 84, 100, 0, 3, { r: 7, hi: 1 }), cyl(36, 80, 9, 3, 6), line([[54, 20, 3.1], [54, 90, 3.1]]), line([[63, 20, 3.1], [63, 90, 3.1]]), line([[72, 20, 3.1], [72, 64, 3.1]]));
      pos.forEach(([x, y, z]) => p.push(box(x - 15, y - 22, x + 15, y + 22, z, z + 2.4, { r: 4 }), cyl(x - 6, y + 11, 4.5, z + 2.4, z + 4.4), line([[x + 5, y - 16, z + 2.5], [x + 5, y + 16, z + 2.5]])));
      return p; } },
  'apollo-platform': { label: 'A control console with four sliders; each slider is wired to one of four school buildings behind it.',
    cap: 'One console. Each school is a few settings, not a development project.',
    build(t) { const b0 = [0.2, 0.7, 0.4, 0.9], b1 = [0.9, 0.3, 0.8, 0.5], e = ease(t), val = b0.map((b, i) => lerp(b, b1[i], e)), p = [];
      val.forEach((v, i) => { const x = 4 + i * 24, h = 12 + 18 * v; p.push(box(x, -40, x + 18, -22, 0, h, { r: 3 }), box(x + 4, -36, x + 14, -26, h, h + 4, { r: 2 }), line([[x + 9, -22, 0.1], [x + 9, 0, 0.1]], 'dash')); });
      p.push(box(0, 0, 100, 52, 0, 5, { r: 9 }));
      val.forEach((v, i) => { const x = 13 + i * 24, y = 42 - v * 30; p.push(line([[x, 9, 5.1], [x, 44, 5.1]]), box(x - 5.5, y - 3.5, x + 5.5, y + 3.5, 5, 9, { r: 2, hi: i === 0 })); });
      return p; } },
  salesforce: { label: 'A web page made of separate blocks lifting off its sheet, beside a stack of spare blocks.',
    cap: 'Pages assembled from a catalog, not commissioned one at a time.',
    build(t) { const L = [5, 17, 10, 11, 12, 4].map((v) => v * ease(t)), b = (x0, y0, x1, y1, i, o) => box(x0, y0, x1, y1, 3 + L[i], 6 + L[i], o); return [
      box(18, -38, 42, -14, 0, 3, { r: 3 }), box(18, -38, 42, -14, 4.5, 7.5, { r: 3 }), box(18, -38, 42, -14, 9, 12, { r: 3 }),
      box(0, 0, 76, 104, 0, 3, { r: 7 }),
      b(6, 8, 13, 96, 0, { r: 2 }), b(17, 8, 40, 96, 1, { r: 3, hi: 1 }), b(44, 8, 58, 34, 2, { r: 3 }), b(44, 39, 58, 65, 3, { r: 3 }), b(44, 70, 58, 96, 4, { r: 3 }), b(62, 8, 70, 96, 5, { r: 2 }),
    ]; } },
  'ai-practice': { label: 'A staircase of six steps from a stack of documents up to a finished screen, with a marker climbing it.',
    cap: 'Six gated steps, from a pile of source material to a prototype.',
    build(t) { const H = (k) => 6 + k * 6, s = clamp(t, 0, 1) * 5, k = Math.min(4, Math.floor(s)), f = s - k, p = [];
      for (let i = 0; i < 6; i++) { p.push(box(i * 18, 0, i * 18 + 18, 30, 0, H(5 - i), { r: 2 })); if (i === 0) p.push(box(6, 5, 9.5, 25, H(5), H(5) + 20, { r: 1.5 }), line([[9.6, 8, H(5) + 3], [9.6, 22, H(5) + 3], [9.6, 22, H(5) + 17], [9.6, 8, H(5) + 17], [9.6, 8, H(5) + 3]])); }
      p.push(box(114, 2, 138, 28, 0, 1.6, { r: 2 }), box(116, 4, 140, 30, 2.2, 3.8, { r: 2 }), box(113, 1, 137, 27, 4.4, 6, { r: 2 }));
      const x = 99 - s * 18, z = lerp(H(k), H(k + 1), ease(f)) + 6 * Math.sin(Math.PI * f);
      p.push(cyl(x, 15, 4.5, z, z + 6, { hi: 1 }));
      return p; } },
  aiva: { label: 'A phone standing upright with a row of sound bars in front of it and a person beside them.',
    cap: 'A sales rep, a phone, and a voice in between.',
    build(t) { const base = [10, 22, 36, 25, 14, 8], g = 0.5 + 0.7 * t, p = [box(0, 0, 92, 72, -5, 0, { r: 11 }), box(18, 16, 23.5, 50, 0, 62, { r: 2.5 }),
        line([[23.6, 19, 5], [23.6, 47, 5], [23.6, 47, 57], [23.6, 19, 57], [23.6, 19, 5]])];
      base.forEach((h, i) => p.push(box(40, 7 + i * 10, 46, 13 + i * 10, 0, h * g, { r: 2, hi: i === 2 })));
      p.push(cyl(74, 38, 7.5, 0, 16), cyl(74, 38, 5, 17.5, 25));
      return p; } },
  myinstall: { label: 'A path of twelve stages on a board; a pin moves along it and the finished stages stand taller.',
    cap: 'Twelve stages, one honest picture of where a dealer is.',
    build(t) { const s = 1 + ease(t) * 10, at = (n) => { const r = Math.floor(n / 4), c = r % 2 ? 3 - (n % 4) : n % 4; return [4 + c * 23, 4 + r * 22, c + r]; }, cen = (n) => { const [x, y] = at(n); return [x + 8.5, y + 8.5]; };
      const p = [box(-6, -6, 100, 74, -5, 0, { r: 11 })], path = []; for (let n = 0; n < 12; n++) path.push([...cen(n), 0.2]); p.push(line(path));
      [...Array(12).keys()].sort((a, b) => at(a)[2] - at(b)[2] || a - b).forEach((n) => { const [x, y] = at(n); p.push(box(x, y, x + 17, y + 17, 0, 2 + 4 * clamp(s - n, 0, 1), { r: 4 })); });
      const k = Math.min(10, Math.floor(s)), f = ease(s - k), a = cen(k), b = cen(k + 1), x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), z = 6.5 + 5 * Math.sin(Math.PI * f);
      p.push(cyl(x, y, 1.6, z, z + 11), cyl(x, y, 4.5, z + 11, z + 16, { hi: 1 }));
      return p; } },
  misdoc: { label: 'Four old terminals at the back, each wired into one report with a bar chart in front.',
    cap: 'Four green screens in, one report out.',
    build(t) { const hs = [8, 14, 10, 20, 12, 24], g = 0.35 + 0.65 * ease(t), p = [];
      for (let i = 0; i < 4; i++) { const x = 4 + i * 27; p.push(box(x, -46, x + 19, -28, 0, 16, { r: 3 }), line([[x + 3, -27.9, 4], [x + 16, -27.9, 4], [x + 16, -27.9, 13], [x + 3, -27.9, 13], [x + 3, -27.9, 4]]), line([[x + 9.5, -28, 0.1], [28 + i * 18, 0, 0.1]], 'dash')); }
      p.push(box(0, 0, 110, 62, 0, 3, { r: 7 }), line([[10, 12, 3.1], [100, 12, 3.1]]), line([[10, 20, 3.1], [70, 20, 3.1]]));
      hs.forEach((h, i) => p.push(box(10 + i * 16, 32, 20 + i * 16, 52, 3, 3 + h * g, { r: 2, hi: i === 5 })));
      return p; } },
  'accessibility-patent': { label: 'A reader bar passing over a document, and beside it a copy of the document with raised tags.',
    cap: 'Read the document the way a screen reader would, then hand back a tagged copy.',
    build(t) { const xs = lerp(7, 43, ease(t)), rows = [[10, 62], [18, 64], [26, 50], [34, 64], [42, 40]], p = [box(0, 0, 50, 72, 0, 3, { r: 6 })];
      rows.forEach(([x, y]) => p.push(line([[x, 8, 3.1], [x, y, 3.1]])));
      p.push(line([[xs, -3, 0.1], [xs, -3, 7]], 'dash'), line([[xs, 75, 0.1], [xs, 75, 7]], 'dash'), box(xs - 1.8, -4, xs + 1.8, 76, 7, 10, { r: 1.5, hi: 1 }));
      p.push(line([[25, 72, 0.1], [25, 86, 0.1], [91, 86, 0.1], [91, 72, 0.1]], 'dash'), box(66, 0, 116, 72, 0, 3, { r: 6 }));
      rows.forEach(([x, y]) => p.push(line([[66 + x, 8, 3.1], [66 + x, y, 3.1]])));
      [[73, 8, 79, 22], [89, 30, 95, 48], [105, 10, 111, 26]].forEach(([a, b, c, d], i) => p.push(box(a, b, c, d, 3, 4 + 6 * ease((t - i * 0.22) / 0.4), { r: 2 })));
      return p; } },
};

function mount(stage, fig, intro, pose) {
  const bag = disposer(); inject(document);
  stage.setAttribute('data-hairline', 'oh-' + stage.dataset.iso); stage.setAttribute('role', 'img'); stage.setAttribute('aria-label', fig.label);
  const svg = mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage), g = mk('g', {}, svg), uRest = fig.rest ?? 0.5;
  /* fit the camera to every pose */
  const pts = [];
  for (const [t, u] of [[0, uRest], [1, 0], [1, 1], [1, uRest], [0.5, uRest]]) for (const q of fig.build(t, u)) {
    if (q.k === 'b') for (const x of [q.x0, q.x1]) for (const y of [q.y0, q.y1]) for (const z of [q.z0, q.z1]) pts.push([x, y, z]);
    else if (q.k === 'c') for (const a of [0, 1, 2, 3]) for (const z of [q.z0, q.z1]) pts.push([q.cx + q.R * Math.cos(a * Math.PI / 2), q.cy + q.R * Math.sin(a * Math.PI / 2), z]);
    else pts.push(...q.pts);
  }
  const P1 = proj(Cam(45, 0.5, 1)), s1 = pts.map((p) => P1(p[0], p[1], p[2]));
  const w = Math.max(...s1.map((p) => p[0])) - Math.min(...s1.map((p) => p[0])), h = Math.max(...s1.map((p) => p[1])) - Math.min(...s1.map((p) => p[1]));
  const C = Cam(45, 0.5, Math.min(340 / w, 262 / h, 2.6)); fit(C, pts, 200, 160);
  const P = proj(C), front = facing(C);
  const els = fig.build(0, uRest).map((q) => (q.k === 'l' ? mk('path', { class: 'nf ' + q.cls }, g) : solid(g)));
  let last = '';
  function draw(t, u) {
    const key = t.toFixed(3) + '|' + u.toFixed(3); if (key === last) return; last = key;
    fig.build(t, u).forEach((q, i) => { const el = els[i];
      if (q.k === 'l') { el.setAttribute('d', open(q.pts.map((p) => P(p[0], p[1], p[2])))); return; }
      let ring, inner;
      if (q.k === 'b') [ring, inner] = rings(q.x0, q.y0, q.x1, q.y1, q.r, Math.min(1.2, (Math.min(q.x1 - q.x0, q.y1 - q.y0)) / 4));
      else { ring = shift(circ(q.R, 28), q.cx, q.cy); inner = shift(circ(Math.max(0.4, q.R - Math.min(1.2, q.R / 3)), 28), q.cx, q.cy); }
      put(el, prism(P, front, ring, inner, q.z0, q.z1)); el.sil.classList.toggle('hi', q.hi);
    });
  }
  if (pose) { draw(pose[0], pose[1] ?? uRest); return bag.dispose; }
  const ts = spring(0), us = spring(uRest); let inside = false, clock = 0, played = !intro;
  const loop = register(stage, (dt) => {
    clock += dt;
    if (!inside) { const on = !played && clock > 0.5 && clock < 2.1; ts.t = on ? 1 : 0; us.t = on ? 0.85 : uRest; if (clock >= 2.1) played = true; }
    const a = stepS(ts, dt), b = stepS(us, dt); draw(clamp(ts.x, 0, 1), clamp(us.x, 0, 1));
    return a || b || !played;
  });
  bag.add(loop.unregister);
  bag.add(pointer(stage, { move([x]) { inside = true; played = true; ts.t = 1; us.t = clamp((x - 60) / 280, 0, 1); loop.wake(); }, leave() { inside = false; loop.wake(); } }));
  draw(0, uRest); loop.wake();
  return bag.dispose;
}

const slots = [...document.querySelectorAll('[data-iso]')];
const go = (el) => { const fig = FIG[el.dataset.iso]; if (!fig || el.dataset.on) return; el.dataset.on = '1';
  try { mount(el, fig, !el.classList.contains('hl-chip')); if (el.classList.contains('hl-chip')) { el.setAttribute('aria-hidden', 'true'); el.removeAttribute('role'); el.removeAttribute('aria-label'); } el.classList.add('hl-in'); } catch (e) { el.hidden = true; console.error(e); } };
if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); go(e.target); } }), { rootMargin: '200px' }); slots.forEach((s) => io.observe(s)); } else slots.forEach(go);
window.OH_ISO = { FIG, mount };
})();
