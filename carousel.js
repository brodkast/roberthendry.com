/* "More from the project" image carousel, shared by every case study.
   - Pages with an .archive section: its figures become the slides (plus any
     <figure data-orig="vis/x.json#key"> placeholders, filled on demand).
   - Pages without one: a section is added before the footer and filled with
     the page's own images, so each study can be flipped through in one place. */
(function () {
  var css = '' +
    '.cz{padding-top:40px;padding-bottom:32px}' +
    '.cz-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 18px}' +
    '.cz-head .eyebrow{margin:0}' +
    '.cz-ctl{display:flex;align-items:center;gap:10px;font:700 11px/1 var(--util,var(--body,system-ui));letter-spacing:.18em;color:var(--mute,#6b6f76)}' +
    '.cz-btn{width:40px;height:40px;border-radius:50%;border:2px solid var(--ink,#2b2e33);background:var(--paper,#fbfbfb);color:var(--ink,#2b2e33);display:grid;place-items:center;cursor:pointer;transition:background .15s,color .15s,opacity .15s}' +
    '.cz-btn:hover{background:var(--ink,#2b2e33);color:var(--paper,#fbfbfb)}' +
    '.cz-btn:disabled{opacity:.3;cursor:default;background:var(--paper,#fbfbfb);color:var(--ink,#2b2e33)}' +
    '.cz-btn svg{width:16px;height:16px}' +
    '.cz-track{--ch:clamp(220px,34vw,430px);display:flex;gap:22px;overflow-x:auto;scroll-snap-type:x proximity;scroll-behavior:smooth;padding:6px 2px 18px;scrollbar-width:thin;-webkit-overflow-scrolling:touch;outline:none;columns:auto}' +
    '.cz-track:focus-visible{box-shadow:0 0 0 2px var(--blue,#33619b) inset;border-radius:12px}' +
    '.cz-track .sitefig{flex:0 0 auto;width:min(86vw,calc(var(--ch) * var(--ar,1.6) + 24px));margin:0;scroll-snap-align:start;opacity:1;transform:none;break-inside:auto}' +
    '.cz-m{height:var(--ch);display:flex;align-items:center;justify-content:center;overflow:hidden}' +
    '.cz-track .sitefig img,.cz-m>svg{display:block;width:100%;height:100%;max-height:none;object-fit:contain;object-position:center}' +
    '.cz-track figcaption{margin:10px 2px 0;font:700 10px/1.4 var(--util,var(--body,system-ui));letter-spacing:.16em;text-transform:uppercase;color:var(--mute,#6b6f76)}' +
    '.cz-ph{width:100%;height:100%;background:repeating-linear-gradient(135deg,#f1f4f8 0 12px,#fbfbfb 12px 24px);border-radius:6px}' +
    '@media(max-width:700px){.cz-track{--ch:clamp(200px,62vw,320px)}.cz-head{flex-wrap:wrap}}';
  var NS = 'http://www.w3.org/2000/svg';
  var bundles = {};
  function grab(ref) {
    var p = ref.split('#'), file = p[0];
    if (!bundles[file]) bundles[file] = fetch(file).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function (e) { delete bundles[file]; throw e; });
    return bundles[file].then(function (j) { return j[p[1]]; });
  }
  function fill(fig) {
    if (fig.dataset.done) return; fig.dataset.done = '1';
    var m = fig.querySelector('.cz-m');
    grab(fig.dataset.orig).then(function (t) {
      if (!t) throw 0;
      m.innerHTML = t;
      var s = m.querySelector('svg'); if (!s) return;
      s.removeAttribute('width'); s.removeAttribute('height');
      s.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      s.setAttribute('role', 'img'); s.setAttribute('aria-label', fig.dataset.alt || '');
      s.querySelectorAll('image[data-src]').forEach(function (im) { im.setAttribute('href', im.dataset.src); im.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', im.dataset.src); im.removeAttribute('data-src'); });
      var vb = s.viewBox && s.viewBox.baseVal; if (vb && vb.width && vb.height) fig.style.setProperty('--ar', (vb.width / vb.height).toFixed(3));
    }).catch(function () { delete fig.dataset.done; });
  }
  function isFile(a) { return !a || /\.(png|jpe?g|webp|gif)$/i.test(a) || /^(screen ?shot|image-asset|img_)/i.test(a); }
  function slideFromImg(fig) {
    var img = fig.querySelector('img'); if (!img) return null;
    fig.classList.remove('rv');
    var w = +img.getAttribute('width'), h = +img.getAttribute('height');
    if (w && h) fig.style.setProperty('--ar', (w / h).toFixed(3));
    var m = document.createElement('div'); m.className = 'cz-m';
    fig.insertBefore(m, img); m.appendChild(img);
    img.loading = 'lazy';
    var alt = img.getAttribute('alt');
    if (!isFile(alt) && !fig.querySelector('figcaption')) { var c = document.createElement('figcaption'); c.textContent = alt; fig.appendChild(c); }
    return fig;
  }
  function slideFromRef(ref, alt) {
    var f = document.createElement('figure'); f.className = 'sitefig';
    f.dataset.orig = ref; f.dataset.alt = alt || '';
    f.innerHTML = '<div class="cz-m"><div class="cz-ph"></div></div>';
    if (alt) { var c = document.createElement('figcaption'); c.textContent = alt.length > 60 ? alt.slice(0, 58) + '…' : alt; f.appendChild(c); }
    return f;
  }
  function btn(dir) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'cz-btn';
    b.setAttribute('aria-label', dir < 0 ? 'Previous image' : 'Next image');
    b.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (dir < 0 ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5') + '"/></svg>';
    return b;
  }
  function build() {
    var st = document.createElement('style'); st.id = 'cz-css'; st.textContent = css; document.head.appendChild(st);
    var sec = document.querySelector('section.archive'), grid, slides = [];
    if (sec) {
      grid = sec.querySelector('.arch-grid');
      [].slice.call(grid.children).forEach(function (f) {
        if (f.dataset.orig) { var n = slideFromRef(f.dataset.orig, f.dataset.alt); grid.replaceChild(n, f); slides.push(n); }
        else if (slideFromImg(f)) slides.push(f);
      });
    } else {
      var src = [].slice.call(document.querySelectorAll('figure[data-svg], figure.sitefig')).filter(function (f) {
        return !f.closest('.hero, header, footer, .archive') && !f.querySelector('svg.wbs') && (f.dataset.svg || f.querySelector('img'));
      });
      if (!src.length) return;
      sec = document.createElement('section'); sec.className = 'archive wrap'; sec.setAttribute('aria-label', 'More from the project');
      sec.innerHTML = '<p class="eyebrow"><i></i>More from the project</p>';
      grid = document.createElement('div'); sec.appendChild(grid);
      src.forEach(function (f) {
        var n;
        if (f.dataset.svg) n = slideFromRef(f.dataset.svg, f.dataset.alt);
        else { n = document.createElement('figure'); n.className = 'sitefig'; n.appendChild(f.querySelector('img').cloneNode()); slideFromImg(n); }
        grid.appendChild(n); slides.push(n);
      });
      var ft = document.querySelector('body > footer') || document.querySelector('footer');
      if (ft) ft.parentNode.insertBefore(sec, ft); else document.body.appendChild(sec);
    }
    if (!slides.length) return;
    sec.classList.add('cz'); if (!sec.id) sec.id = 'more';
    grid.className = 'cz-track'; grid.tabIndex = 0;
    grid.setAttribute('role', 'region'); grid.setAttribute('aria-label', 'Project images, scroll sideways');
    var eb = sec.querySelector('.eyebrow');
    if (eb) eb.innerHTML = '<i></i>More from the project · ' + slides.length + ' images';
    var head = document.createElement('div'); head.className = 'cz-head';
    var ctl = document.createElement('div'); ctl.className = 'cz-ctl';
    var prev = btn(-1), next = btn(1), cnt = document.createElement('span'); cnt.setAttribute('aria-live', 'polite');
    ctl.appendChild(prev); ctl.appendChild(cnt); ctl.appendChild(next);
    if (eb) sec.insertBefore(head, eb), head.appendChild(eb); else sec.insertBefore(head, grid);
    head.appendChild(ctl);
    function idx() { var x = grid.scrollLeft + 4, k = 0; for (var i = 0; i < slides.length; i++) if (slides[i].offsetLeft - grid.offsetLeft <= x) k = i; return k; }
    function upd() {
      var k = idx(), end = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
      cnt.textContent = (end ? slides.length : k + 1) + ' / ' + slides.length;
      prev.disabled = grid.scrollLeft <= 2; next.disabled = end;
    }
    function go(d) { var k = Math.max(0, Math.min(slides.length - 1, idx() + d)); grid.scrollTo({ left: slides[k].offsetLeft - grid.offsetLeft, behavior: 'smooth' }); }
    prev.onclick = function () { go(-1); }; next.onclick = function () { go(1); };
    grid.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    var raf = 0; grid.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; upd(); }); }, { passive: true });
    addEventListener('resize', upd);
    if ('ResizeObserver' in window) { var ro = new ResizeObserver(function () { upd(); }); slides.forEach(function (x) { ro.observe(x); }); }
    var lazy = slides.filter(function (s) { return s.dataset.orig; });
    if (lazy.length) {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); } }); }, { rootMargin: '300px 600px' });
        lazy.forEach(function (s) { io.observe(s); });
      } else lazy.forEach(fill);
    }
    upd();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
