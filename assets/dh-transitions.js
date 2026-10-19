/*! Kaleidoscope Hero page transitions v1.3.1 */
(function () {
  'use strict';
  var cfg = window.DH_TRANSITIONS || {};
  var mode = cfg.mode || 'marked', reveal = cfg.reveal || 'fade', DUR = 720;
  var html = document.documentElement, prefetched = {};
  function duration() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DUR; }

  function wipe() {
    var w = document.getElementById('dh-wipe');
    if (!w) {
      w = document.createElement('div');
      w.id = 'dh-wipe'; w.className = 'dh-wipe'; w.setAttribute('aria-hidden', 'true');
      w.innerHTML = '<span class="dh-spinner"></span>';
      document.body.appendChild(w);
    }
    return w;
  }
  function side(dir) { return 'translateX(' + (dir === 'left' ? '-100%' : '100%') + ')'; }

  function cover(url, dir) {
    var w = wipe();
    w.classList.remove('dh-loading', 'dh-fade');
    w.style.transition = 'none';
    w.style.opacity = '1';
    w.style.transform = side(dir);
    w.classList.add('dh-on');
    void w.offsetWidth;
    w.style.transition = '';
    w.style.transform = 'translateX(0)';
    try { sessionStorage.setItem('dh_wipe', dir); } catch (e) {}
    setTimeout(function () { w.classList.add('dh-loading'); window.location.href = url; }, duration());
  }

  function doReveal() {
    if (!html.classList.contains('dh-covered')) return;
    var dir = html.getAttribute('data-dh-dir') || 'right';
    var out = reveal === 'reverse' ? dir : (dir === 'left' ? 'right' : 'left');
    var w = wipe();
    w.style.transition = 'none';
    w.style.transform = 'translateX(0)';
    w.style.opacity = '1';
    w.classList.add('dh-on');
    w.classList.toggle('dh-fade', reveal === 'fade');
    html.classList.remove('dh-covered');
    void w.offsetWidth;
    w.style.transition = '';
    if (reveal === 'fade') w.style.opacity = '0';
    else w.style.transform = side(out);
    setTimeout(function () {
      w.style.transition = 'none';
      w.classList.remove('dh-on', 'dh-loading', 'dh-fade');
      w.style.transform = ''; w.style.opacity = '';
    }, duration() + 60);
  }

  function onReady() {
    try { sessionStorage.removeItem('dh_wipe'); } catch (e) {}
    if (!html.classList.contains('dh-covered')) return;
    var w = wipe(), done = false;
    var spin = setTimeout(function () { w.classList.add('dh-loading'); }, 400);
    var go = function () {
      if (done) return; done = true;
      clearTimeout(spin); w.classList.remove('dh-loading');
      requestAnimationFrame(function () { requestAnimationFrame(doReveal); });
    };
    if (document.readyState === 'complete') go();
    else { window.addEventListener('load', go); setTimeout(go, 3000); }
  }

  function eligible(a, e) {
    if (!a || !a.href) return false;
    if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return false;
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(raw)) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download') || a.closest('[data-dh-no-transition],.no-transition')) return false;
    var u;
    try { u = new URL(a.href, window.location.href); } catch (err) { return false; }
    if (u.origin !== window.location.origin) return false;
    if (u.pathname === window.location.pathname && u.search === window.location.search) return false;
    if (/\/wp-(admin|login)/.test(u.pathname)) return false;
    if (/\.(pdf|zip|jpe?g|png|gif|webp|svg|mp4|mov|docx?|xlsx?|pptx?)$/i.test(u.pathname)) return false;
    return true;
  }
  function wants(a) {
    if (mode === 'off') return false;
    if (mode === 'all') return true;
    return a.matches('.dh-transition, [data-dh-dir], .dh-transition a');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a || !wants(a) || !eligible(a, e)) return;
    e.preventDefault();
    cover(a.href, a.getAttribute('data-dh-dir') || (a.closest('[data-dh-dir]') && a.closest('[data-dh-dir]').getAttribute('data-dh-dir')) || 'right');
  });

  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a || !wants(a) || !eligible(a, null) || prefetched[a.href]) return;
    prefetched[a.href] = 1;
    var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href; document.head.appendChild(l);
  }, { passive: true });

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    html.classList.remove('dh-covered');
    var w = document.getElementById('dh-wipe');
    if (w) { w.style.transition = 'none'; w.classList.remove('dh-on', 'dh-loading', 'dh-fade'); w.style.transform = ''; w.style.opacity = ''; }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
