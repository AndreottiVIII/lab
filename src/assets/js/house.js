/* La casa in sezione.
   1. L'effetto "sviluppo" della camera oscura. Le stampe sul filo arrivano in negativo (CSS) e si sviluppano
      quando ci passi sopra col mouse, le tocchi, le raggiungi con la tastiera o (da telefono) scorrono nello schermo.
      Restano sviluppate alle visite successive (localStorage, sempre dentro try/catch: se non funziona, si sviluppano e basta).
      La stessa stampa compare in piu' disegni (computer, copertina, piano da telefono): si sviluppano tutte insieme.
   2. Telefono: le fasce della copertina portano al piano con uno scorrimento morbido, e il segnapiano
      ("you are here") segue il piano che si sta guardando. */
(function () {
  'use strict';
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* i piccioni della piccionaia (Letters) si muovono pianissimo; con prefers-reduced-motion restano fermi */
  var defs = document.querySelector('.art-defs');
  if (reduce && defs) { try { defs.pauseAnimations(); [].slice.call(defs.querySelectorAll('animateTransform')).forEach(function (a) { a.parentNode.removeChild(a); }); } catch (e) {} }

  /* ---------------- sviluppo ---------------- */
  var KEY = 'dc-developed';
  var prints = $$('[data-dev]');
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function byId(id) { return prints.filter(function (p) { return p.getAttribute('data-dev') === id; }); }
  function isDone(el) { return el.classList.contains('developed'); }
  function developId(id) {
    byId(id).forEach(function (p) { p.classList.add('developed'); });
    var list = read();
    if (list.indexOf(id) < 0) { list.push(id); write(list); }
  }
  function develop(el) { if (!isDone(el)) developId(el.getAttribute('data-dev')); }

  if (prints.length) {
    /* le stampe gia' sviluppate nelle visite precedenti sono state sistemate da uno script in pagina, senza transizione */
    requestAnimationFrame(function () { requestAnimationFrame(function () { prints.forEach(function (p) { p.classList.remove('instant'); }); }); });

    prints.filter(function (p) { return !p.classList.contains('deco'); }).forEach(function (p) {
      p.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') develop(p); });
      p.addEventListener('focus', function () { develop(p); });
      /* da telefono il primo tocco sviluppa, il secondo apre la galleria */
      p.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch') { p._first = !isDone(p); develop(p); }
      });
      p.addEventListener('click', function (e) { if (p._first) { e.preventDefault(); p._first = false; } });
    });

    /* il numero e la riga della legenda sviluppano la loro stampa */
    $$('[data-dev-for]').forEach(function (el) {
      var go = function () { developId(el.getAttribute('data-dev-for')); };
      el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') go(); });
      el.addEventListener('focusin', go);
    });

    /* telefono (niente mouse): le stampe si sviluppano una dopo l'altra quando compaiono nello schermo (quelle dei piani, non la copertina) */
    var coarse = window.matchMedia && window.matchMedia('(hover: none)').matches;
    if (coarse && 'IntersectionObserver' in window) {
      var k = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          if (isDone(en.target)) return;
          setTimeout(function () { develop(en.target); }, 350 * k++);
        });
      }, { threshold: 0.6 });
      prints.forEach(function (p) { if (!p.classList.contains('deco')) io.observe(p); });
    }
  }

  /* ---------------- telefono: fasce e segnapiano ---------------- */
  var floors = $$('.pfloor');
  if (!floors.length) return;

  $$('.band').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var t = document.getElementById((b.getAttribute('href') || '').slice(1));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#' + t.id); } catch (x) {}
    });
  });

  var here = document.querySelector('.here');
  var label = document.getElementById('hl');
  var rects = [0, 1, 2, 3].map(function (i) { return document.getElementById('h' + i); });
  var cover = document.querySelector('.cover');
  var ticking = false;
  function mark() {
    ticking = false;
    if (!here || getComputedStyle(here.parentNode).display === 'none') return;
    var mid = window.innerHeight * 0.45, k = -1;
    floors.forEach(function (f, i) { if (f.getBoundingClientRect().top < mid) k = i; });
    /* compare solo quando si e' sotto la copertina */
    var below = k >= 0 && cover && cover.getBoundingClientRect().bottom < window.innerHeight * 0.35;
    here.hidden = !below;
    if (!below) return;
    rects.forEach(function (r, i) { if (r) r.classList.toggle('on', i === k); });
    if (label) label.textContent = floors[k].getAttribute('data-lv');
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(mark); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  mark();
})();
