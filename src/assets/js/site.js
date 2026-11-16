/* davidecaniatti.com - JS leggero: lightbox, cookie/Analytics. Nessuna libreria. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var cfg = window.SITE || {};

  /* ---- immagini che non si caricano (quelle gia' rotte sul vecchio sito) ---- */
  function markBroken(img) { img.classList.add('broken'); }
  $$('img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) markBroken(img);
    img.addEventListener('error', function () { markBroken(img); });
  });

  /* ---- lightbox a schermo intero ---- */
  var box, boxImg, boxCount, list = [], idx = 0, touchX = null, opener = null;
  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button class="lb-close" aria-label="Close">&times;</button><button class="lb-prev" aria-label="Previous">&#8249;</button><img alt=""><button class="lb-next" aria-label="Next">&#8250;</button><div class="lb-count"></div>';
    document.body.appendChild(box);
    boxImg = $('img', box); boxCount = $('.lb-count', box);
    $('.lb-close', box).addEventListener('click', close);
    $('.lb-prev', box).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', box).addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }
  function show(i) {
    idx = (i + list.length) % list.length;
    boxImg.src = list[idx].href;
    boxImg.alt = list[idx].getAttribute('data-alt') || '';
    boxCount.textContent = (idx + 1) + ' / ' + list.length;
  }
  function open(links, i) {
    if (!box) build();
    opener = document.activeElement;
    list = links; box.classList.add('open'); document.body.classList.add('lb-open');
    box.classList.toggle('single', links.length < 2); /* una foto sola: niente frecce */
    show(i); $('.lb-close', box).focus();
  }
  function close() {
    box.classList.remove('open'); document.body.classList.remove('lb-open'); boxImg.removeAttribute('src');
    /* la tastiera torna sulla foto da cui si era partiti */
    if (opener && opener.focus) opener.focus();
  }
  function bindLightbox(g) {
    var links = $$('a.lb', g);
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(links, i); });
    });
  }
  $$('[data-lightbox]').forEach(bindLightbox);
  window.dcLightbox = bindLightbox; /* il vault lo usa dopo aver aperto le foto */
  document.addEventListener('keydown', function (e) {
    if (!box || !box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'Tab') {
      /* la tastiera resta dentro la lightbox finche' e' aperta */
      var b = $$('button', box).filter(function (x) { return x.offsetParent !== null; });
      var k = b.indexOf(document.activeElement);
      e.preventDefault();
      b[(k + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
    }
  });

  /* ---- cookie e Google Analytics ---- */
  var KEY = 'dc-consent';
  var banner = $('#cookie-banner');
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA() {
    /* In modalita' prova (mockup) Analytics non parte MAI, qualunque scelta. */
    if (cfg.mockup || !cfg.gaId || window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', cfg.gaId, { allow_google_signals: false, allow_ad_personalization_signals: false }); /* niente segnali pubblicitari */
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.gaId);
    document.head.appendChild(s);
  }
  /* cookie lasciati da Analytics (_ga, _ga_XXXX, _gid): si cancellano quando il consenso viene rifiutato o ritirato */
  function clearGA() {
    var host = location.hostname.split('.'), domains = [''];
    for (var i = 0; i < host.length - 1; i++) domains.push('; domain=.' + host.slice(i).join('.'));
    document.cookie.split(';').forEach(function (kv) {
      var name = kv.split('=')[0].trim();
      if (!/^_ga|^_gid$|^_gat/.test(name)) return;
      domains.forEach(function (d) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d; });
    });
  }
  if (banner) {
    var c = stored();
    if (c === 'granted') loadGA(); else if (c === 'denied') clearGA(); /* rifiutato: via i cookie _ga anche se Google li ha riscritti all'ultimo */ else banner.hidden = false;
    $$('[data-cookie]', banner).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-cookie'); store(v); banner.hidden = true;
        if (v === 'granted') loadGA();
        else { clearGA(); if (window.__gaLoaded) location.reload(); } /* ritirato il consenso: via i cookie di Analytics, ricarico senza */
      });
    });
    $$('[data-cookie-open]').forEach(function (b) { b.addEventListener('click', function () { banner.hidden = false; }); });
  }
})();
