// Mounts one hairline figure per case study (https://github.com/lucasmarkes/hairline, MIT).
// A figure mounts when it scrolls into view. If the library fails to load, the slot stays empty and collapses.
import * as HL from './vendor/hairline.js';

const slots = [...document.querySelectorAll('[data-hl]')];
const mount = (el) => {
  const make = HL[el.dataset.hl];
  if (typeof make !== 'function' || el.dataset.hlOn) return;
  el.dataset.hlOn = '1';
  const cap = el.parentElement && el.parentElement.querySelector('.hl-read');
  const chip = el.classList.contains('hl-chip');
  try {
    make(el, {
      theme: 'light',
      play: !chip,
      label: el.dataset.hlLabel || undefined,
      onRead: cap ? (t) => { cap.textContent = t; } : undefined,
    });
    if (chip) { el.removeAttribute('tabindex'); el.setAttribute('aria-hidden', 'true'); el.removeAttribute('role'); el.removeAttribute('aria-label'); }
    el.classList.add('hl-in');
  } catch (e) { el.hidden = true; }
};
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } }), { rootMargin: '200px' });
  slots.forEach((s) => io.observe(s));
} else slots.forEach(mount);
