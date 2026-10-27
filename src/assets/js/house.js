/* La casa in sezione: l'effetto "sviluppo" della camera oscura.
   Le stampe sul filo arrivano in negativo (CSS) e si sviluppano quando ci passi sopra col mouse,
   le tocchi, le raggiungi con la tastiera o (da telefono) scorrono nello schermo.
   Restano sviluppate alle visite successive (localStorage, sempre dentro try/catch: se non funziona, si sviluppano e basta). */
(function () {
  'use strict';
  var KEY = 'dc-developed';
  var prints = [].slice.call(document.querySelectorAll('[data-dev]'));
  if (!prints.length) return;

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function isDone(el) { return el.classList.contains('developed'); }
  function develop(el) {
    if (isDone(el)) return;
    el.classList.add('developed');
    var id = el.getAttribute('data-dev'), list = read();
    if (list.indexOf(id) < 0) { list.push(id); write(list); }
  }
  function byId(id) { return prints.filter(function (p) { return p.getAttribute('data-dev') === id; })[0]; }

  /* le stampe gia' sviluppate nelle visite precedenti sono state sistemate da uno script in pagina, senza transizione */
  requestAnimationFrame(function () { requestAnimationFrame(function () { prints.forEach(function (p) { p.classList.remove('instant'); }); }); });

  prints.forEach(function (p) {
    p.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') develop(p); });
    p.addEventListener('focus', function () { develop(p); });
    /* da telefono il primo tocco sviluppa, il secondo apre la galleria */
    p.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') { p._first = !isDone(p); develop(p); }
    });
    p.addEventListener('click', function (e) { if (p._first) { e.preventDefault(); p._first = false; } });
  });

  /* il numero e la riga della legenda sviluppano la loro stampa (non aprono niente di diverso) */
  [].forEach.call(document.querySelectorAll('[data-dev-for]'), function (el) {
    var go = function () { var p = byId(el.getAttribute('data-dev-for')); if (p) develop(p); };
    el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') go(); });
    el.addEventListener('focusin', go);
  });

  /* telefono (niente mouse): le stampe si sviluppano una dopo l'altra quando compaiono nello schermo */
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
    prints.forEach(function (p) { io.observe(p); });
  }
})();
