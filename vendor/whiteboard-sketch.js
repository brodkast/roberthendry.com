/* @ds-bundle: {"format":4,"namespace":"WBS","components":[{"name":"Shapes"},{"name":"Connectors"},{"name":"Callouts"},{"name":"Icons"},{"name":"MicroWireframe"},{"name":"Redraw"},{"name":"DrawOn"}]} */
/*
 * Whiteboard Sketch — the roberthendry.com marker-on-whiteboard style as a drawing kit.
 * No dependencies. Everything is built as SVG paths so every stroke can draw itself on.
 *
 *   WBS.svg(spec)            -> SVG markup string (works in a browser or any JS runtime)
 *   WBS.mount(el, spec, opt) -> renders into el, returns the <svg>; opt = {mode:'end'|'draw'|'static', loop:true|false, hold:4}
 *   WBS.play(svg, opt)       -> (re)starts the draw-on on an <svg class="wbs">
 *   WBS.parts                -> the list of item types a spec may use
 *   WBS.icons                -> the icon names
 *   WBS.tokens               -> the colours, fonts and line widths
 *
 * A spec: {w, h, title, desc, items:[{t:'<part>', x, y, ...}], edges:[{from:[x,y], to:[x,y], kind, bend}], wobble:true}
 * Items draw in the order given unless they carry `o` (draw order). Edges draw after the items they join.
 */
(function () {
  var T = {
    ink: '#2b2e33', paper: '#fbfbfb', white: '#ffffff', blue: '#33619b', mag: '#b53f8e', red: '#c4453c',
    green: '#7fb069', pink: '#f6e3ee', sky1: '#e6ecf4', sky2: '#cfdaea', sky3: '#a9bdd9', mute: '#6b6f76',
    noteBlue: '#dde6f2', notePink: '#f3d9e9', notePeach: '#f6d8cd', noteGrey: '#e4e5e8'
  };
  var FONT = {
    marker: "'Permanent Marker','Comic Sans MS',cursive",
    hand: "'Caveat','Patrick Hand',cursive",
    util: "'Atkinson Hyperlegible','Helvetica Neue',Arial,sans-serif"
  };
  var LINE = { hair: 1.3, comm: 2.6, icon: 2.4, flow: 3, marker: 4 };
  var EASE = 'cubic-bezier(.45,.05,.25,1)';

  // ------------------------------------------------------------ helpers
  function r1(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fillOf(name, dflt) { if (!name) return dflt; return T[name] || name; }
  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    return 'M' + r1(x + r) + ' ' + r1(y) + 'H' + r1(x + w - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + r1(x + w) + ' ' + r1(y + r) +
      'V' + r1(y + h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + r1(x + w - r) + ' ' + r1(y + h) + 'H' + r1(x + r) +
      'A' + r + ' ' + r + ' 0 0 1 ' + r1(x) + ' ' + r1(y + h - r) + 'V' + r1(y + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + r1(x + r) + ' ' + r1(y) + 'Z';
  }
  function circ(cx, cy, r) { return 'M' + r1(cx - r) + ' ' + r1(cy) + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0Z'; }
  function seg(x1, y1, x2, y2) { return 'M' + r1(x1) + ' ' + r1(y1) + 'L' + r1(x2) + ' ' + r1(y2); }

  // every drawn stroke is a <path class="d"> so it can draw on; fills and text fade in (class "f")
  function P(d, o) {
    o = o || {};
    var a = '<path class="d' + (o.cls ? ' ' + o.cls : '') + '"' + (o.dash ? '' : ' pathLength="1"') + ' d="' + d + '" fill="' + (o.fill || 'none') + '" stroke="' + (o.stroke || T.ink) +
      '" stroke-width="' + (o.w || LINE.icon) + '" stroke-linecap="round" stroke-linejoin="round"';
    if (o.dash) a += ' stroke-dasharray="' + o.dash + '"';
    a += '/>';
    // the arrowhead rides on its own invisible copy of the path, so it can appear when the stroke arrives
    if (o.marker) a += '<path class="mk" d="' + d + '" fill="none" stroke="none" stroke-width="' + (o.w || LINE.icon) + '" marker-end="url(#' + o.marker + ')"/>';
    return a;
  }
  function Fill(d, fill, o) { o = o || {}; return '<path class="f' + (o.cls ? ' ' + o.cls : '') + '" d="' + d + '" fill="' + fill + '" stroke="none"/>'; }
  // shape = fill underneath (fades in) + outline on top (draws on)
  function S(d, fill, stroke, w, o) { o = o || {}; return (fill && fill !== 'none' ? Fill(d, fill) : '') + P(d, { stroke: stroke, w: w, dash: o.dash, cls: o.cls }); }
  function Text(x, y, s, o) {
    o = o || {};
    var font = o.font || 'hand', size = o.size || (font === 'util' ? 12 : font === 'marker' ? 30 : 22);
    var rows = String(s).split('\n'), out = '';
    var lh = o.lh || size * (font === 'util' ? 1.35 : 1.02);
    for (var k = 0; k < rows.length; k++) out += '<tspan x="' + r1(x) + '" dy="' + (k ? r1(lh) : 0) + '">' + esc(rows[k]) + '</tspan>';
    var cls = 'f wbs-' + font + (o.caps ? ' wbs-caps' : '');
    return '<text class="' + cls + '" x="' + r1(x) + '" y="' + r1(y) + '" font-size="' + size + '" text-anchor="' + (o.anchor || 'middle') +
      '" fill="' + fillOf(o.color, T.ink) + '"' + (o.weight ? ' font-weight="' + o.weight + '"' : '') + '>' + out + '</text>';
  }
  // greeked text: rounded strokes standing in for a line of copy
  function greek(x, y, w, n, o) {
    o = o || {};
    var out = '', gap = o.gap || 9, col = fillOf(o.color, T.sky3), sw = o.w || 3.2;
    for (var k = 0; k < n; k++) {
      var lw = w * (k === n - 1 && n > 1 ? 0.62 : (k % 3 === 1 ? 0.88 : 1));
      out += P(seg(x, y + k * gap, x + lw, y + k * gap), { stroke: col, w: sw });
    }
    return out;
  }

  // ------------------------------------------------------------ icons (centred on 0,0, about 60 units across)
  var I = {};
  function ip(d, fill, o) { return S(d, fill, T.ink, LINE.icon, o); }
  I.person = function (o) {
    o = o || {}; var f = fillOf(o.fill, T.sky1);
    return ip('M-19 30C-19 12 -10 6 0 6C10 6 19 12 19 30Z', f) + ip(circ(0, -8, 11), T.paper);
  };
  I.people = function () {
    return '<g transform="translate(-14 4) scale(.8)">' + I.person({ fill: 'sky2' }) + '</g><g transform="translate(14 4) scale(.8)">' + I.person({ fill: 'sky2' }) + '</g>' + I.person();
  };
  I.doc = function (o) {
    o = o || {};
    return ip('M-17 -22H7L17 -12V22H-17Z', T.paper) + P('M7 -22V-12H17', { w: LINE.icon }) + greek(-10, -4, 18, 3, { gap: 7, w: 2.4 });
  };
  I.search = function () {
    return ip(circ(-4, -4, 13), T.sky1) + P('M5.5 5.5L18 18', { w: 4.5 });
  };
  I.docSearch = function () { return I.doc() + '<g transform="translate(8 6) scale(.7)">' + I.search() + '</g>'; };
  I.envelope = function (o) {
    o = o || {}; var out = ip(rr(-26, -18, 52, 36, 4), T.paper) + P('M-24 -15L0 3L24 -15');
    if (o.at !== false) out += Fill(circ(0, -19, 9.5), T.blue) + Text(0, -14.6, '@', { font: 'util', size: 13, color: 'paper', weight: 700 });
    return out;
  };
  I.phone = function () {
    return ip('M-22 -8C-22 -16 -15 -19 -10 -17L-6 -7C-5 -3 -8 -1 -11 0C-8 7 -2 13 5 16C6 13 9 11 13 12L21 17C23 23 19 29 11 28C-7 25 -22 10 -22 -8Z', T.pink) +
      P('M6 -20q8 2 10 10M8 -30q16 4 19 20', { stroke: T.mag });
  };
  I.check = function (o) { o = o || {}; return P('M-14 0L-4 10L16 -12', { stroke: fillOf(o.color, T.green), w: 6 }); };
  I.stop = function () {
    var pts = []; for (var k = 0; k < 8; k++) { var a = (22.5 + 45 * k) * Math.PI / 180; pts.push(r1(15 * Math.cos(a)) + ' ' + r1(15 * Math.sin(a))); }
    return ip('M' + pts.join('L') + 'Z', T.mag) + P('M-7 0H7', { stroke: T.paper, w: 3.6 });
  };
  I.heart = function () { return ip('M0 12C-18 0 -18 -12 -9 -14C-4 -15 0 -11 0 -8C0 -11 4 -15 9 -14C18 -12 18 0 0 12Z', T.mag); };
  I.books = function () {
    var out = '', c = [T.blue, T.sky3, T.mag];
    for (var k = 0; k < 3; k++) { var y = 8 - k * 12, x = -26 + [0, 3, -2][k]; out += ip(rr(x, y, 52, 11, 2.5), c[k]) + P(seg(x + 6, y + 3.5, x + 40, y + 3.5), { stroke: T.paper, w: 1.8 }); }
    return out;
  };
  I.gear = function () {
    var pts = []; for (var k = 0; k < 10; k++) { var a0 = (k * 36 - 7) * Math.PI / 180, a1 = (k * 36 + 7) * Math.PI / 180;
      pts.push(r1(24 * Math.cos(a0)) + ' ' + r1(24 * Math.sin(a0)), r1(31 * Math.cos(a0 + .05)) + ' ' + r1(31 * Math.sin(a0 + .05)), r1(31 * Math.cos(a1 - .05)) + ' ' + r1(31 * Math.sin(a1 - .05)), r1(24 * Math.cos(a1)) + ' ' + r1(24 * Math.sin(a1))); }
    return '<g class="wbs-spin">' + ip('M' + pts.join('L') + 'Z', T.sky2) + ip(circ(0, 0, 10), T.paper) + '</g>';
  };
  I.warning = function () { return ip('M0 -24L25 20H-25Z', T.pink, { cls: '' }) + P('M0 -8V6', { stroke: T.mag, w: 4 }) + Fill(circ(0, 13, 2.6), T.mag); };
  I.cloud = function () { return ip('M-30 14C-42 14 -42 -4 -28 -4C-28 -20 -6 -24 2 -12C8 -22 28 -18 26 -2C40 -2 40 14 28 14Z', T.sky1); };
  I.database = function () { return ip('M-20 -16V16C-20 26 20 26 20 16V-16', T.sky1) + ip(circ(0, -16, 0.01) + 'M-20 -16C-20 -26 20 -26 20 -16C20 -6 -20 -6 -20 -16Z', T.sky2) + P('M-20 0C-20 10 20 10 20 0'); };
  I.monitor = function () { return ip(rr(-28, -22, 56, 36, 4), T.sky1) + P('M-8 22H8M0 14V22') + greek(-18, -12, 36, 3, { gap: 8 }); };
  I.laptop = function () { return ip(rr(-22, -20, 44, 28, 3), T.sky1) + ip('M-30 8H30L26 16H-26Z', T.sky2); };
  I.mobile = function () { return ip(rr(-15, -26, 30, 52, 6), T.paper) + P('M-4 -20H4') + greek(-9, -10, 18, 3, { gap: 7, w: 2.4 }); };
  I.money = function () { return ip(circ(0, 0, 18), T.blue) + Text(0, 8, '$', { font: 'util', size: 22, color: 'paper', weight: 700 }); };
  I.calendar = function () { return ip(rr(-22, -18, 44, 40, 4), T.paper) + Fill(rr(-22, -18, 44, 12, 4), T.mag) + P(rr(-22, -18, 44, 40, 4)) + P('M-12 -24V-12M12 -24V-12') + P('M-12 4H-8M-2 4H2M8 4H12M-12 13H-8M-2 13H2', { w: 3 }); };
  I.chat = function () { return ip('M-26 -18H26V10H-6L-16 20V10H-26Z', T.sky1) + greek(-16, -8, 32, 2, { gap: 9, w: 2.6 }); };
  I.lock = function () { return P('M-12 -4V-12C-12 -26 12 -26 12 -12V-4', { w: 3 }) + ip(rr(-18, -4, 36, 28, 4), T.mag) + Fill(circ(0, 10, 3.5), T.paper); };
  I.cart = function () { return P('M-28 -18H-18L-10 12H18L24 -10H-15', { w: 3 }) + ip(circ(-6, 20, 4), T.paper) + ip(circ(14, 20, 4), T.paper); };
  I.clipboard = function () { return ip(rr(-18, -22, 36, 46, 4), T.paper) + ip(rr(-9, -27, 18, 9, 3), T.sky2) + I.check({ color: 'green' }).replace('stroke-width="6"', 'stroke-width="4"').replace('M-14 0L-4 10L16 -12', 'M-9 4L-3 10L9 -4'); };
  I.star = function () { var p = []; for (var k = 0; k < 10; k++) { var a = (-90 + k * 36) * Math.PI / 180, rad = k % 2 ? 9 : 22; p.push(r1(rad * Math.cos(a)) + ' ' + r1(rad * Math.sin(a))); } return ip('M' + p.join('L') + 'Z', T.pink); };
  I.play = function () { return ip(circ(0, 0, 20), T.mag) + Fill('M-6 -10L10 0L-6 10Z', T.paper); };
  I.pin = function () { return ip('M0 24C-14 6 -16 -2 -16 -8C-16 -18 -8 -24 0 -24C8 -24 16 -18 16 -8C16 -2 14 6 0 24Z', T.mag) + Fill(circ(0, -8, 5), T.paper); };
  I.bell = function () { return ip('M-16 10V-4C-16 -14 -9 -20 0 -20C9 -20 16 -14 16 -4V10L20 14H-20Z', T.sky1) + P('M-5 18C-4 22 4 22 5 18'); };
  I.spark = function () { return Fill('M0 -18L4 -4L18 0L4 4L0 18L-4 4L-18 0L-4 -4Z', T.mag); };

  // ------------------------------------------------------------ parts a spec can use
  var Parts = {};
  function g(it, body) {
    var tr = '';
    if (it.s && it.s !== 1) tr = ' transform="translate(' + it.x + ' ' + it.y + ') scale(' + it.s + ') translate(' + -it.x + ' ' + -it.y + ')"';
    return '<g class="it" style="--i:' + (it.o != null ? it.o : 0) + '"' + tr + '>' + body + '</g>';
  }

  // diagram shapes ---------------------------------------------------
  Parts.box = function (it) { // {x,y = centre, w,h, label, fill, strong}
    var w = it.w || Math.max(96, String(it.label || '').length * 8.4 + 36), h = it.h || 40, x = it.x - w / 2, y = it.y - h / 2;
    return S(rr(x, y, w, h, it.r != null ? it.r : 9), fillOf(it.fill, T.white), it.stroke ? fillOf(it.stroke) : T.ink, it.strong ? LINE.flow : 2) +
      (it.label ? Text(it.x, it.y + 6, it.label, { size: it.size || 17 }) : '');
  };
  Parts.pill = function (it) { it.r = 999; return Parts.box(it); };
  Parts.decision = function (it) { // pink diamond with a marker "?"
    var s = it.size || 22, body = '<g transform="translate(' + it.x + ' ' + it.y + ') rotate(45)">' + S(rr(-s, -s, 2 * s, 2 * s, 7), T.pink, T.mag, 2.6) + '</g>' +
      Text(it.x, it.y + s * .5, '?', { font: 'marker', size: s * 1.35, color: 'mag' });
    if (it.label) body += Text(it.lx != null ? it.lx : it.x, it.ly != null ? it.ly : it.y - s * 2.2, it.label, { size: 20 });
    if (it.yes) body += Text(it.yes[0], it.yes[1], 'YES', { font: 'util', size: 11, color: 'mag', weight: 700, caps: 1 });
    if (it.no) body += Text(it.no[0], it.no[1], 'NO', { font: 'util', size: 11, color: 'mag', weight: 700, caps: 1 });
    return body;
  };
  Parts.phase = function (it) { // a big faint double-diamond half: {x,y,w,h, label}
    var w = it.w || 300, h = it.h || 300;
    var d = 'M' + it.x + ' ' + (it.y) + 'L' + (it.x + w / 2) + ' ' + (it.y - h / 2) + 'L' + (it.x + w) + ' ' + it.y + 'L' + (it.x + w / 2) + ' ' + (it.y + h / 2) + 'Z';
    return S(d, 'rgba(51,97,155,.05)', 'rgba(43,46,51,.28)', 1.6) + (it.label ? Text(it.x + w / 2, it.y - h / 2 - 14, it.label, { font: 'util', size: 12, color: 'mute', weight: 700, caps: 1 }) : '');
  };
  Parts.note = function (it) { // sticky note: {x,y top-left, w,h, title, text, tone: blue|pink|peach|grey, rot}
    var w = it.w || 200, h = it.h || 180, tone = { blue: [T.noteBlue, '#c3d2e8'], pink: [T.notePink, '#e7bdd6'], peach: [T.notePeach, '#eebfae'], grey: [T.noteGrey, '#cdcfd4'] }[it.tone || 'blue'];
    var x = it.x, y = it.y, c = 22;
    var d = 'M' + (x + 2) + ' ' + y + 'L' + (x + w - 3) + ' ' + (y + 2) + 'L' + (x + w) + ' ' + (y + h - c) + 'Q' + (x + w - 4) + ' ' + (y + h - 3) + ' ' + (x + w - c) + ' ' + (y + h) + 'L' + (x + 1) + ' ' + (y + h - 2) + 'Z';
    var body = Fill('M' + (x + 8) + ' ' + (y + 10) + 'L' + (x + w + 6) + ' ' + (y + 12) + 'L' + (x + w + 4) + ' ' + (y + h + 6) + 'L' + (x + 10) + ' ' + (y + h + 4) + 'Z', 'rgba(43,46,51,.08)') +
      S(d, tone[0], T.ink, 1.8) + S('M' + (x + w) + ' ' + (y + h - c) + 'Q' + (x + w - c + 4) + ' ' + (y + h - c + 2) + ' ' + (x + w - c) + ' ' + (y + h) + 'Q' + (x + w - 4) + ' ' + (y + h - 3) + ' ' + (x + w) + ' ' + (y + h - c) + 'Z', tone[1], T.ink, 1.6);
    if (it.title) body += Text(x + 16, y + 36, it.title, { font: 'util', size: 16, weight: 700, anchor: 'start', lh: 19 });
    if (it.text) body += Text(x + 16, y + 36 + 22 * (String(it.title || '').split('\n').length) + 8, it.text, { font: 'util', size: 13, anchor: 'start', lh: 17 });
    return it.rot ? '<g transform="rotate(' + it.rot + ' ' + (x + w / 2) + ' ' + (y + h / 2) + ')">' + body + '</g>' : body;
  };
  Parts.icon = function (it) { // {name, x, y, s, label}
    var fn = I[it.name] || I.doc, body = '<g transform="translate(' + it.x + ' ' + it.y + ')' + (it.s ? ' scale(' + it.s + ')' : '') + '">' + fn(it) + '</g>';
    if (it.label) body += Text(it.x, it.y + 38 * (it.s || 1) + 22, it.label, { size: it.size || 20 });
    return body;
  };
  Parts.label = function (it) { return Text(it.x, it.y, it.text, { font: it.font || 'hand', size: it.size, color: it.color, anchor: it.anchor, weight: it.weight, caps: it.caps }); };
  Parts.title = function (it) { // marker headline with a hand underline: {x,y,text,size,color,line}
    var size = it.size || 44, w = String(it.text).length * size * .62;
    var x0 = it.anchor === 'middle' ? it.x - w / 2 : it.x;
    return Text(it.x, it.y, it.text, { font: 'marker', size: size, color: it.color || 'ink', anchor: it.anchor || 'start' }) +
      (it.line === false ? '' : P('M' + r1(x0) + ' ' + r1(it.y + size * .32) + 'Q' + r1(x0 + w / 2) + ' ' + r1(it.y + size * .22) + ' ' + r1(x0 + w * .96) + ' ' + r1(it.y + size * .3), { stroke: fillOf(it.lineColor, T.mag), w: LINE.marker }));
  };
  Parts.callout = function (it) { // magenta AI pill: {x,y centre,text, to:[x,y] optional lead}
    var tw = String(it.text).length * 7 + 66, h = 30, x = it.x - tw / 2;
    var body = '';
    if (it.to) body += P('M' + it.x + ' ' + (it.to[1] > it.y ? it.y + h / 2 : it.y - h / 2) + 'C' + it.x + ' ' + r1((it.y + it.to[1]) / 2) + ' ' + it.to[0] + ' ' + r1((it.y + it.to[1]) / 2) + ' ' + it.to[0] + ' ' + it.to[1], { stroke: T.mag, w: 1.3, dash: '6 7', cls: 'dash' });
    body += S(rr(x, it.y - h / 2, tw, h, 15), 'rgba(181,63,142,.07)', T.mag, 1.8);
    body += Text(x + 14, it.y + 5, '✦ ' + (it.tag || 'AI'), { font: 'util', size: 12, color: 'mag', weight: 700, anchor: 'start' });
    body += Text(x + 54, it.y + 5, it.text, { size: 16, color: 'mag', anchor: 'start' });
    return body;
  };
  Parts.lane = function (it) { // a swim-lane rule with a marker label: {y, x1, x2, label, color}
    return P(seg(it.x1 || 20, it.y, it.x2 || 1180, it.y), { stroke: T.ink, w: 2, cls: 'faint' }) +
      (it.label ? Text(it.lx || 200, it.y - 14, it.label, { font: 'marker', size: it.size || 34, color: it.color || 'blue' }) : '');
  };
  Parts.frame = function (it) { // the dashed blue frame the site puts round images: {x,y,w,h}
    return P(rr(it.x, it.y, it.w, it.h, 10), { stroke: T.blue, w: 2, dash: '7 6', cls: 'dash' });
  };

  // micro wireframe ---------------------------------------------------
  // all take a box {x,y,w,h} (top-left), drawn in ink on white with sky fills and greeked text
  Parts.browser = function (it) {
    var x = it.x, y = it.y, w = it.w, h = it.h, out = S(rr(x, y, w, h, 10), T.white, T.ink, 2.4) + P(seg(x, y + 26, x + w, y + 26), { w: 2 });
    out += Fill(circ(x + 14, y + 13, 4), T.red) + Fill(circ(x + 27, y + 13, 4), T.sky3) + Fill(circ(x + 40, y + 13, 4), T.green);
    out += S(rr(x + 56, y + 6, Math.min(w - 80, 360), 14, 7), T.sky1, T.ink, 1.3);
    if (it.url) out += Text(x + 66, y + 17.5, it.url, { font: 'util', size: 10, anchor: 'start', color: 'mute' });
    return out;
  };
  Parts.window = function (it) { // app window, optional dark theme {dark:true}
    var x = it.x, y = it.y, w = it.w, h = it.h;
    return S(rr(x, y, w, h, 8), it.dark ? T.ink : T.white, T.ink, 2.4) + (it.title ? Text(x + 14, y + 22, it.title, { font: 'util', size: 11, weight: 700, anchor: 'start', color: it.dark ? 'paper' : 'ink', caps: 1 }) : '');
  };
  Parts.phoneframe = function (it) {
    var x = it.x, y = it.y, w = it.w || 180, h = it.h || 360;
    return S(rr(x, y, w, h, 26), T.white, T.ink, 2.6) + P(rr(x + w / 2 - 22, y + 10, 44, 8, 4), { w: 1.6 }) + P(seg(x + w / 2 - 26, y + h - 14, x + w / 2 + 26, y + h - 14), { w: 3 });
  };
  Parts.header = function (it) { // top bar with logo block, links and an avatar
    var x = it.x, y = it.y, w = it.w, h = it.h || 34, dark = it.dark, out = Fill(rr(x, y, w, h, 4), dark ? T.ink : T.sky1);
    out += S(rr(x + 10, y + 8, 46, h - 16, 3), dark ? T.paper : T.ink, dark ? T.paper : T.ink, 1.4);
    var n = it.links || 4;
    for (var k = 0; k < n; k++) out += P(seg(x + w - 70 - k * 54, y + h / 2, x + w - 30 - k * 54, y + h / 2), { stroke: dark ? T.sky3 : T.ink, w: 3 });
    out += S(circ(x + w - 16, y + h / 2, 8), dark ? T.sky3 : T.sky2, dark ? T.paper : T.ink, 1.6);
    return out;
  };
  Parts.sidebar = function (it) {
    var x = it.x, y = it.y, w = it.w || 120, h = it.h, n = it.items || 6, out = S(rr(x, y, w, h, 4), it.dark ? '#3a3e44' : T.sky1, T.ink, 1.6);
    for (var k = 0; k < n; k++) { var yy = y + 22 + k * 24; out += S(rr(x + 12, yy - 6, 12, 12, 3), k === (it.active || 0) ? T.mag : T.sky3, T.ink, 1.2) + P(seg(x + 32, yy, x + w - 18 - (k % 3) * 12, yy), { stroke: it.dark ? T.sky3 : T.ink, w: k === (it.active || 0) ? 3.4 : 2.4 }); }
    return out;
  };
  Parts.nav = function (it) { // a row of tabs or nav links: {x,y,w,items:['My Unify','Apps'], active}
    var items = it.items || ['One', 'Two', 'Three'], x = it.x, out = '', gap = 8;
    for (var k = 0; k < items.length; k++) {
      var tw = String(items[k]).length * 7.2 + 26, on = k === (it.active || 0);
      out += S(rr(x, it.y, tw, 24, 12), on ? (it.dark ? T.paper : T.ink) : 'none', it.dark ? T.paper : T.ink, 1.6) +
        Text(x + tw / 2, it.y + 16.5, items[k], { font: 'util', size: 11, color: on ? (it.dark ? 'ink' : 'paper') : (it.dark ? 'paper' : 'ink'), weight: 700 });
      x += tw + gap;
    }
    return out;
  };
  Parts.heading = function (it) { return Text(it.x, it.y, it.text, { font: it.font || 'util', size: it.size || 18, weight: 700, anchor: 'start', color: it.color || 'ink' }); };
  Parts.text = function (it) { return greek(it.x, it.y, it.w || 160, it.lines || 3, { color: it.color, w: it.weight || 3.2, gap: it.gap }); };
  Parts.button = function (it) {
    var w = it.w || Math.max(80, String(it.label || '').length * 8 + 32), h = it.h || 30, primary = it.primary !== false;
    return S(rr(it.x, it.y, w, h, h / 2), primary ? T.ink : T.white, T.ink, 2) + Text(it.x + w / 2, it.y + h / 2 + 4.5, it.label || 'Button', { font: 'util', size: 11, weight: 700, color: primary ? 'paper' : 'ink', caps: 1 });
  };
  Parts.input = function (it) {
    var w = it.w || 200, out = '';
    if (it.label) out += Text(it.x, it.y - 8, it.label, { font: 'util', size: 11, weight: 700, anchor: 'start', color: 'mute', caps: 1 });
    out += S(rr(it.x, it.y, w, it.h || 30, 6), T.white, T.ink, 1.8);
    if (it.placeholder) out += Text(it.x + 12, it.y + 20, it.placeholder, { size: 17, anchor: 'start', color: 'mute' });
    else out += greek(it.x + 12, it.y + 15, w * .45, 1, { w: 2.6 });
    return out;
  };
  Parts.search = function (it) {
    var w = it.w || 240, h = 30;
    return S(rr(it.x, it.y, w, h, 15), T.white, T.ink, 1.8) + '<g transform="translate(' + (it.x + 18) + ' ' + (it.y + 15) + ') scale(.42)">' + I.search() + '</g>' +
      (it.placeholder ? Text(it.x + 36, it.y + 20, it.placeholder, { size: 17, anchor: 'start', color: 'mute' }) : greek(it.x + 36, it.y + 15, w * .4, 1, { w: 2.6 }));
  };
  Parts.image = function (it) { // placeholder: frame, sun and hills
    var x = it.x, y = it.y, w = it.w, h = it.h;
    return S(rr(x, y, w, h, 6), T.sky1, T.ink, 1.8) + S(circ(x + w * .74, y + h * .3, Math.min(w, h) * .09), T.pink, T.mag, 1.6) +
      S('M' + (x + 6) + ' ' + (y + h - 6) + 'L' + (x + w * .34) + ' ' + (y + h * .5) + 'L' + (x + w * .52) + ' ' + (y + h * .72) + 'L' + (x + w * .66) + ' ' + (y + h * .58) + 'L' + (x + w - 6) + ' ' + (y + h - 6) + 'Z', T.sky2, T.ink, 1.6);
  };
  Parts.video = function (it) { return Parts.image(it) + '<g transform="translate(' + (it.x + it.w / 2) + ' ' + (it.y + it.h / 2) + ') scale(.8)">' + I.play() + '</g>'; };
  Parts.avatar = function (it) { var r = it.r || 16; return S(circ(it.x, it.y, r), T.sky2, T.ink, 1.8) + '<g transform="translate(' + it.x + ' ' + (it.y - r * .1) + ') scale(' + r / 34 + ')">' + I.person({ fill: 'sky1' }) + '</g>'; };
  Parts.card = function (it) { // {x,y,w,h,title,lines,media:true|false,icon,dark,accent}
    var x = it.x, y = it.y, w = it.w || 180, h = it.h || 150, dark = it.dark, out = S(rr(x, y, w, h, 8), dark ? '#3a3e44' : T.white, T.ink, 2);
    var cy = y + 14;
    if (it.accent) out += Fill(rr(x + 2, y + 2, w - 4, 5, 2), fillOf(it.accent));
    if (it.media) { out += Parts.image({ x: x + 10, y: cy, w: w - 20, h: h * .42 }); cy += h * .42 + 12; }
    if (it.icon) { out += S(rr(x + 12, cy, 22, 22, 4), fillOf(it.iconFill, T.blue), T.ink, 1.4); out += Text(x + 42, cy + 16, it.title || '', { font: 'util', size: 11, weight: 700, anchor: 'start', color: dark ? 'paper' : 'ink' }); cy += 34; }
    else if (it.title) { out += Text(x + 12, cy + 12, it.title, { font: 'util', size: 12, weight: 700, anchor: 'start', color: dark ? 'paper' : 'ink' }); cy += 24; }
    out += greek(x + 12, cy + 4, w - 24, it.lines != null ? it.lines : 2, { color: dark ? '#7d8796' : T.sky3, w: 2.6, gap: 8 });
    if (it.fav) out += P('M' + (x + 18) + ' ' + (y + h - 14) + 'm-5 -2c0 -4 5 -5 5 -1c0 -4 5 -3 5 1c0 3 -5 6 -5 6c0 0 -5 -3 -5 -6z', { stroke: dark ? T.paper : T.ink, w: 1.4 });
    return out;
  };
  Parts.grid = function (it) { // a grid of cards: {x,y,w,h,cols,rows,card:{...}}
    var cols = it.cols || 3, rows = it.rows || 2, gap = it.gap || 12, cw = (it.w - gap * (cols - 1)) / cols, ch = (it.h - gap * (rows - 1)) / rows, out = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var spec = {}; for (var k in (it.card || {})) spec[k] = it.card[k];
      spec.x = it.x + c * (cw + gap); spec.y = it.y + r * (ch + gap); spec.w = cw; spec.h = ch;
      if (it.titles) spec.title = it.titles[r * cols + c] || '';
      if (it.iconFills) spec.iconFill = it.iconFills[(r * cols + c) % it.iconFills.length];
      out += Parts.card(spec);
    }
    return out;
  };
  Parts.table = function (it) { // {x,y,w,rows,cols,head:true}
    var rows = it.rows || 5, cols = it.cols || 4, rh = it.rh || 24, w = it.w || 360, cw = w / cols, out = S(rr(it.x, it.y, w, rows * rh, 6), T.white, T.ink, 1.8);
    out += Fill(rr(it.x + 1, it.y + 1, w - 2, rh - 1, 5), T.sky1);
    for (var r = 1; r < rows; r++) out += P(seg(it.x, it.y + r * rh, it.x + w, it.y + r * rh), { w: 1, stroke: T.sky3 });
    for (var r2 = 0; r2 < rows; r2++) for (var c = 0; c < cols; c++) out += P(seg(it.x + c * cw + 10, it.y + r2 * rh + rh / 2, it.x + c * cw + cw * (r2 ? (.45 + ((r2 + c) % 3) * .12) : .5), it.y + r2 * rh + rh / 2), { stroke: r2 ? T.sky3 : T.ink, w: r2 ? 2.4 : 3 });
    return out;
  };
  Parts.list = function (it) { // rows with an avatar or icon and two greeked lines
    var n = it.items || 4, rh = it.rh || 40, w = it.w || 260, out = '';
    for (var k = 0; k < n; k++) { var y = it.y + k * rh; out += Parts.avatar({ x: it.x + 14, y: y + rh / 2, r: 12 }) + greek(it.x + 36, y + rh / 2 - 4, w - 50, 2, { gap: 9, w: 2.6, color: k ? T.sky3 : T.ink }); if (k < n - 1) out += P(seg(it.x, y + rh, it.x + w, y + rh), { w: 1, stroke: T.sky3 }); }
    return out;
  };
  Parts.chart = function (it) { // {x,y,w,h,kind:'bar'|'line'|'donut', values:[...]}
    var x = it.x, y = it.y, w = it.w || 220, h = it.h || 140, v = it.values || [3, 5, 4, 7, 6, 9], max = Math.max.apply(null, v), out = '';
    if (it.kind === 'donut') {
      var r = Math.min(w, h) / 2 - 8, cx = x + w / 2, cy = y + h / 2, sum = 0, acc = 0, cols = [T.blue, T.mag, T.sky3, T.ink];
      for (var k = 0; k < v.length; k++) sum += v[k];
      for (var j = 0; j < v.length; j++) { var a0 = acc / sum * 2 * Math.PI - Math.PI / 2; acc += v[j]; var a1 = acc / sum * 2 * Math.PI - Math.PI / 2;
        out += P('M' + r1(cx + r * Math.cos(a0)) + ' ' + r1(cy + r * Math.sin(a0)) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + r1(cx + r * Math.cos(a1)) + ' ' + r1(cy + r * Math.sin(a1)), { stroke: cols[j % 4], w: 14 }); }
      return out;
    }
    out += P('M' + x + ' ' + y + 'V' + (y + h) + 'H' + (x + w), { w: 2 });
    if (it.kind === 'line') {
      var pts = v.map(function (n, i) { return r1(x + 10 + i * (w - 20) / (v.length - 1)) + ' ' + r1(y + h - 8 - n / max * (h - 20)); });
      out += P('M' + pts.join('L'), { stroke: T.mag, w: 3 });
      pts.forEach(function (p) { var q = p.split(' '); out += S(circ(+q[0], +q[1], 4), T.paper, T.mag, 2); });
      return out;
    }
    var bw = (w - 16) / v.length;
    v.forEach(function (n, i) { var bh = n / max * (h - 16); out += S(rr(x + 8 + i * bw + 3, y + h - bh, bw - 8, bh, 3), i === v.length - 1 ? T.mag : (i % 2 ? T.sky2 : T.blue), T.ink, 1.4); });
    return out;
  };
  Parts.kpi = function (it) { // {x,y,value,label}
    return Text(it.x, it.y, it.value, { font: 'marker', size: it.size || 34, anchor: 'start', color: it.color || 'ink' }) + Text(it.x, it.y + 20, it.label || '', { font: 'util', size: 11, anchor: 'start', color: 'mute' });
  };
  Parts.toggle = function (it) { var on = it.on !== false; return S(rr(it.x, it.y, 40, 22, 11), on ? T.blue : T.sky1, T.ink, 1.6) + S(circ(it.x + (on ? 29 : 11), it.y + 11, 7), T.white, T.ink, 1.4) + (it.label ? Text(it.x + 50, it.y + 16, it.label, { size: 18, anchor: 'start' }) : ''); };
  Parts.checkbox = function (it) { var on = it.on !== false; return S(rr(it.x, it.y, 18, 18, 4), T.white, T.ink, 1.6) + (on ? P('M' + (it.x + 4) + ' ' + (it.y + 9) + 'l4 4l7 -8', { stroke: T.green, w: 2.6 }) : '') + (it.label ? Text(it.x + 28, it.y + 15, it.label, { size: 18, anchor: 'start' }) : greek(it.x + 28, it.y + 9, it.w || 90, 1, { w: 2.6 })); };
  Parts.badge = function (it) { var tw = String(it.text || '').length * 7 + 18; return S(rr(it.x, it.y, tw, 20, 10), fillOf(it.fill, T.pink), fillOf(it.stroke, T.mag), 1.4) + Text(it.x + tw / 2, it.y + 14, it.text || '', { font: 'util', size: 10, weight: 700, color: it.color || 'mag', caps: 1 }); };
  Parts.banner = function (it) { // promo strip with a line of copy and a button
    var x = it.x, y = it.y, w = it.w, h = it.h || 44, dark = it.dark;
    return S(rr(x, y, w, h, 6), dark ? '#3a3e44' : T.sky1, T.ink, 1.6) + (it.icon ? S(circ(x + 24, y + h / 2, 12), T.white, T.ink, 1.4) : '') + greek(x + 46, y + h / 2 - 5, w * .55, 2, { gap: 10, w: 2.6, color: dark ? '#7d8796' : T.sky3 }) +
      Parts.button({ x: x + w - 14 - (String(it.cta || 'Learn more').length * 8 + 30), y: y + h / 2 - 12, w: String(it.cta || 'Learn more').length * 8 + 30, h: 24, label: it.cta || 'Learn more', primary: !dark });
  };
  Parts.dots = function (it) { var out = ''; for (var k = 0; k < (it.n || 4); k++) out += k === (it.active || 0) ? Fill(circ(it.x + k * 12, it.y, 3.5), it.dark ? T.paper : T.ink) : P(circ(it.x + k * 12, it.y, 3), { stroke: it.dark ? T.paper : T.ink, w: 1.2 }); return out; };
  Parts.modal = function (it) {
    var x = it.x, y = it.y, w = it.w || 300, h = it.h || 180;
    return Fill(rr(x + 8, y + 10, w, h, 12), 'rgba(43,46,51,.12)') + S(rr(x, y, w, h, 12), T.white, T.ink, 2.4) + (it.title ? Text(x + 18, y + 30, it.title, { font: 'util', size: 14, weight: 700, anchor: 'start' }) : '') +
      P('M' + (x + w - 26) + ' ' + (y + 16) + 'l10 10m0 -10l-10 10', { w: 2 }) + greek(x + 18, y + 54, w - 36, 3, { gap: 10 }) + Parts.button({ x: x + w - 110, y: y + h - 44, w: 92, label: it.cta || 'OK' });
  };
  Parts.map = function (it) {
    var x = it.x, y = it.y, w = it.w, h = it.h;
    return S(rr(x, y, w, h, 6), T.sky1, T.ink, 1.8) + P('M' + (x + 4) + ' ' + (y + h * .6) + 'C' + (x + w * .3) + ' ' + (y + h * .4) + ' ' + (x + w * .5) + ' ' + (y + h * .8) + ' ' + (x + w - 4) + ' ' + (y + h * .5), { stroke: T.white, w: 6 }) +
      P('M' + (x + w * .3) + ' ' + (y + 4) + 'L' + (x + w * .42) + ' ' + (y + h - 4), { stroke: T.white, w: 4 }) + '<g transform="translate(' + (x + w * .62) + ' ' + (y + h * .42) + ') scale(.7)">' + I.pin() + '</g>';
  };
  Parts.breadcrumb = function (it) { var out = '', x = it.x; for (var k = 0; k < (it.n || 3); k++) { out += P(seg(x, it.y, x + 44, it.y), { stroke: k === (it.n || 3) - 1 ? T.ink : T.sky3, w: 2.6 }); if (k < (it.n || 3) - 1) out += P('M' + (x + 52) + ' ' + (it.y - 4) + 'l4 4l-4 4', { w: 1.6 }); x += 66; } return out; };
  Parts.annotate = function (it) { // a hand note with an arrow pointing at something: {x,y,text,to:[x,y]}
    var out = Text(it.x, it.y, it.text, { size: it.size || 20, color: it.color || 'mag', anchor: it.anchor || 'start' });
    if (it.to) out += P('M' + (it.x + (it.anchor === 'end' ? -10 : 10)) + ' ' + (it.y + 8) + 'Q' + it.to[0] + ' ' + (it.y + 8) + ' ' + it.to[0] + ' ' + it.to[1], { stroke: fillOf(it.color, T.mag), w: 1.8, marker: 'wbsAhM' });
    return out;
  };

  // ------------------------------------------------------------ connectors
  var KIND = {
    flow: { stroke: T.ink, w: LINE.flow, marker: 'wbsAh' },
    comm: { stroke: T.blue, w: LINE.comm, dash: '7 7', marker: 'wbsAhB' },
    drop: { stroke: T.sky3, w: 2.4, dash: '3 8', marker: 'wbsAhS' },
    ai: { stroke: T.mag, w: 1.4, dash: '6 7', marker: 'wbsAhM' },
    loop: { stroke: T.red, w: 1.8, dash: '6 6', marker: 'wbsAhR' }
  };
  function edgeD(e) {
    var a = e.from, b = e.to;
    if (e.d) return e.d;
    if (e.bend === 'hv') return 'M' + a[0] + ' ' + a[1] + 'H' + b[0] + 'V' + b[1];
    if (e.bend === 'vh') return 'M' + a[0] + ' ' + a[1] + 'V' + b[1] + 'H' + b[0];
    if (e.bend === 'curve') { var mx = (a[0] + b[0]) / 2; return 'M' + a[0] + ' ' + a[1] + 'C' + mx + ' ' + a[1] + ' ' + mx + ' ' + b[1] + ' ' + b[0] + ' ' + b[1]; }
    return 'M' + a[0] + ' ' + a[1] + 'L' + b[0] + ' ' + b[1];
  }
  function edge(e) {
    var k = KIND[e.kind || 'flow'];
    return '<g class="ed' + (k.dash ? ' dashed' : '') + '" style="--i:' + (e.o || 0) + '">' + P(edgeD(e), { stroke: k.stroke, w: e.w || k.w, dash: k.dash, marker: e.head === false ? null : k.marker, cls: k.dash ? 'dash' : '' }) +
      (e.label ? Text(e.lx != null ? e.lx : (e.from[0] + e.to[0]) / 2, e.ly != null ? e.ly : (e.from[1] + e.to[1]) / 2 - 8, e.label, { font: 'util', size: 11, weight: 700, color: 'mag', caps: 1 }) : '') + '</g>';
  }

  function defs(id) {
    function mk(name, col) { return '<marker id="' + name + '" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="5.2" markerHeight="5.2" orient="auto-start-reverse"><path d="M1 1 L10 6 L1 11" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></marker>'; }
    return '<defs><filter id="wbsWob' + id + '" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/></filter>' +
      mk('wbsAh', T.ink) + mk('wbsAhB', T.blue) + mk('wbsAhS', T.sky3) + mk('wbsAhM', T.mag) + mk('wbsAhR', T.red) + '</defs>';
  }

  var uid = 0;
  function svg(spec) {
    spec = spec || {}; var w = spec.w || 1200, h = spec.h || 700, id = ++uid;
    var items = (spec.items || []).slice(), auto = 0;
    // default draw order: left to right, then top to bottom, like a marker on a whiteboard
    items.forEach(function (it, i) { it._k = i; });
    var ord = items.filter(function (it) { return it.o == null; }).sort(function (a, b) { return (a.x - b.x) || (a.y - b.y); });
    ord.forEach(function (it) { it.o = auto++; });
    var body = '';
    items.forEach(function (it) { var fn = Parts[it.t]; if (fn) body += g(it, fn(it)); });
    var eds = (spec.edges || []).map(function (e) {
      if (e.o == null) { var near = 0; items.forEach(function (it) { if (Math.abs(it.x - e.to[0]) + Math.abs(it.y - e.to[1]) < 140) near = Math.max(near, it.o); }); e.o = Math.max(0, near - .5); }
      return edge(e);
    }).join('');
    var wob = spec.wobble === false ? '' : ' filter="url(#wbsWob' + id + ')"';
    var title = spec.title ? '<title>' + esc(spec.title) + '</title>' : '', desc = spec.desc ? '<desc>' + esc(spec.desc) + '</desc>' : '';
    return '<svg class="wbs anim" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img"' + (spec.title ? '' : ' aria-hidden="true"') +
      ' style="--stag:' + (spec.stagger || 70) + 'ms;--dur:' + (spec.dur || 700) + 'ms">' + title + desc + defs(id) +
      '<g class="wbs-edges"' + wob + '>' + eds + '</g>' + body + '</svg>';
  }

  // ------------------------------------------------------------ the draw-on
  var RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function longest(el) { var m = 0; el.querySelectorAll('.it,.ed').forEach(function (n) { m = Math.max(m, +(n.style.getPropertyValue('--i') || 0)); }); return m; }
  function play(el, opt) {
    opt = opt || {};
    var mode = opt.mode || 'end', loop = opt.loop !== false && mode !== 'static', hold = (opt.hold || 4) * 1000;
    var stag = parseFloat(getComputedStyle(el).getPropertyValue('--stag')) || 70, dur = parseFloat(getComputedStyle(el).getPropertyValue('--dur')) || 700;
    var total = longest(el) * stag + dur + 900;
    clearTimeout(el._wbsT);
    function now(on) { el.classList.add('now'); el.classList.toggle('in', on); void el.getBoundingClientRect(); el.classList.remove('now'); }
    function draw() { now(false); requestAnimationFrame(function () { el.classList.add('in'); }); }
    function cycle() {
      if (el._wbsHidden) { el._wbsT = setTimeout(cycle, 1500); return; }
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' }).finished.then(draw);
      if (loop) el._wbsT = setTimeout(cycle, total + hold + 400);
    }
    if (RM || mode === 'static') { now(true); return el; }
    if (mode === 'end') { now(true); el._wbsT = setTimeout(cycle, opt.delay != null ? opt.delay * 1000 : 2500); }
    else { draw(); if (loop) el._wbsT = setTimeout(cycle, total + hold); }
    if (!el._wbsIO && typeof IntersectionObserver === 'function') { el._wbsIO = new IntersectionObserver(function (es) { el._wbsHidden = !es[0].isIntersecting; }, { threshold: .15 }); el._wbsIO.observe(el); }
    return el;
  }
  function mount(target, spec, opt) {
    target.innerHTML = svg(spec);
    var el = target.querySelector('svg.wbs');
    play(el, opt || spec.anim || {});
    return el;
  }

  window.WBS = {
    tokens: { color: T, font: FONT, line: LINE, ease: EASE },
    svg: svg, mount: mount, play: play,
    parts: Object.keys(Parts), icons: Object.keys(I),
    icon: function (name, o) { return (I[name] || I.doc)(o || {}); },
    _Parts: Parts, _I: I
  };
})();
