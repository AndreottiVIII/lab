/* Consenso ai cookie e Google Analytics per le pagine del dominio che non passano dal modello del sito
   (per ora /appalti/, una pagina gia' pronta copiata da appalti-anac/paper).
   Stessa scelta del resto del sito: chiave 'dc-consent' nel localStorage, quindi chi ha gia' risposto non rivede il banner.
   Nessuna richiesta a Google prima di "Accept"; con "Decline" (o ritirando il consenso) si cancellano i cookie _ga.
   L'ID arriva dall'attributo data-ga del tag <script>, messo in fase di build (eleventy.config.js). */
(function () {
  'use strict';
  var me = document.currentScript;
  var GA = me && me.getAttribute('data-ga');
  var KEY = 'dc-consent';
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA() {
    if (!GA || window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA);
    document.head.appendChild(s);
  }
  function clearGA() {
    var host = location.hostname.split('.'), domains = [''];
    for (var i = 0; i < host.length - 1; i++) domains.push('; domain=.' + host.slice(i).join('.'));
    document.cookie.split(';').forEach(function (kv) {
      var name = kv.split('=')[0].trim();
      if (!/^_ga|^_gid$|^_gat/.test(name)) return;
      domains.forEach(function (d) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d; });
    });
  }
  function start() {
    var css = document.createElement('style');
    css.textContent =
      '.dc-cookie{position:fixed;left:0;right:0;bottom:0;z-index:90;background:#fff;color:#2b2b2b;border-top:1.5px solid #1a1a1a;padding:14px 16px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}' +
      '.dc-cookie[hidden]{display:none}.dc-cookie p{margin:0;max-width:60ch}.dc-cookie p span{display:block;color:#6b6b6b}' +
      '.dc-cookie div{display:flex;gap:10px}.dc-cookie button{font:500 14px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;min-width:110px;padding:10px 18px;border:1px solid #1a1a1a;background:#fff;color:#1a1a1a;cursor:pointer}' +
      '.dc-cookie button:hover{background:#1a1a1a;color:#fff}' +
      '.dc-cookie-open{display:block;margin:32px auto 0;background:none;border:0;font:12px ui-monospace,Menlo,Consolas,monospace;color:#6b6b6b;text-decoration:underline;cursor:pointer;padding:8px}' +
      '@media (max-width:640px){.dc-cookie{padding:10px 16px;gap:8px;font-size:13px;line-height:1.35}.dc-cookie div{width:100%}.dc-cookie button{flex:1;min-width:0;padding:8px 12px;font-size:13px}}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.className = 'dc-cookie'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-live', 'polite'); box.setAttribute('aria-label', 'Cookie'); box.hidden = true;
    box.innerHTML = '<p>This site uses Google Analytics to see how much it is read, but only if you agree.<span lang="it">Questo sito usa Google Analytics per capire quanto viene letto, ma solo se acconsenti.</span></p>' +
      '<div><button type="button" data-cookie="denied">Decline · Rifiuta</button><button type="button" data-cookie="granted">Accept · Accetta</button></div>';
    var reopen = document.createElement('button');
    reopen.type = 'button'; reopen.className = 'dc-cookie-open'; reopen.textContent = 'Cookie';
    reopen.addEventListener('click', function () { box.hidden = false; });
    document.body.appendChild(reopen);
    document.body.appendChild(box);
    var c = stored();
    if (c === 'granted') loadGA(); else if (c === 'denied') clearGA(); /* rifiutato: via i cookie _ga anche se Google li ha riscritti all'ultimo */ else box.hidden = false;
    box.querySelectorAll('[data-cookie]').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-cookie'); store(v); box.hidden = true;
        if (v === 'granted') loadGA();
        else { clearGA(); if (window.__gaLoaded) location.reload(); }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
