// Rete di sicurezza della pubblicazione.
//
// Dopo la build verifica che in _site esista, per ognuno degli indirizzi indicizzati sul vecchio
// sito Squarespace (142 della sua sitemap, piu' /work e la home), il file che GitHub Pages servira'
// a quell'indirizzo, e che <title> e meta description non siano vuoti
// (la description puo' mancare solo dove mancava gia' sul vecchio sito).
// Se manca qualcosa esce con errore: il workflow si ferma prima del deploy e il sito online resta com'e'.
//
// Uso:  node scripts/check-urls.mjs            (dopo `npx eleventy`)
// Variabili: SITE_DIR (default _site), PATH_PREFIX (default "/"; nel laboratorio "/lab/").
//
// Come GitHub Pages risolve un indirizzo: percorso decodificato ("%26" -> "&", "+" resta "+"),
// poi il file esatto, poi <percorso>.html. Una cartella con index.html risponderebbe con un redirect
// a "<percorso>/": gli indirizzi vecchi non hanno la barra finale, quindi qui non basta.
import fs from "node:fs";
import path from "node:path";

// ---- Elenco fisso: sitemap di Squarespace (export/sitemap.xml del 23/10/2026) ----
const SITEMAP = [
  // blog (1)
  "/post",
  // articoli (39)
  "/post/hockney-serpentine-a-farewell",
  "/post/david-hockney-25-at-fondation-louis-vuitton-drawing-keeps-you-young",
  "/post/anselm-kiefer-tintoretto-in-a-dying-venice",
  "/post/contax-645-the-wedding-test",
  "/post/damien-hirst-natural-history",
  "/post/kodak-gold-200-120-did-we-need-it",
  "/post/can-a-contax-tvs-digital-be-your-only-point-shoot",
  "/post/contax-tvs-digital-shooting-with-a-2002-digital-camera",
  "/post/a-great-start-for-2022",
  "/post/contax-645-80mm-planar-f2-on-gfx-with-fringer-adapter",
  "/post/unboxing-a-contax-645-kit",
  "/post/this-blog-is-one-year-old",
  "/post/cherry-blossom-by-damien-hirst-at-fondation-cartier",
  "/post/when-it-comes-to-foveon-do-sizes-matter",
  "/post/contax-g1-silver-label-conversion-to-green-label",
  "/post/the-tabernacle-an-exhibition-by-kate-dunn",
  "/post/archaeology-now-why-damien-hirst-is-a-genius",
  "/post/contax-g-28mm-biogon",
  "/post/konica-hexanon-40mm-18-a-lens-of-true-value",
  "/post/seagull-4a-welcome-to-the-tlr-world",
  "/post/post/seagull-4a-welcome-to-the-tlr-world",
  "/post/sigma-18-35mm-f18-f-ing-amazing",
  "/post/fomaspeed-variant-313-the-ilford-mg-v-killer",
  "/post/fujifilm-ga645-more-than-a-120-point-and-shoot",
  "/post/contax-hologon-16mm-story-and-black-and-white",
  "/post/infrared-photography-with-foveon",
  "/post/contax-tvs-a-little-zoom-in-a-luxury-case",
  "/post/post/helios-44-bokeh-lens-and-nothing-else",
  "/post/how-to-achieve-the-highest-dinamic-range-digital-edition",
  "/post/konica-hexar-af-the-best-point-and-shoot-ever",
  "/post/post/milan-lockdown",
  "/post/45mm-pentax-6x7-a-great-lens-with-a-bigger-neighbor",
  "/post/pentax-6x7-vs-pentax-67ii-the-battle-of-the-giants",
  "/post/milan-cohabitation",
  "/post/visualizing-foveon",
  "/post/bessa-r-unboxing-a-2000-camera",
  "/post/nikonos-iv-a-the-perfect-winter-camera",
  "/post/contax-g-35mm-planar-an-undeserved-bad-reputation",
  "/post/sigma-sd-quattro-hands-on",
  // categorie (3)
  "/post/category/Foveon",
  "/post/category/Cameras",
  "/post/category/Lenses",
  // tag (come nella sitemap di Squarespace: + = spazio, %26 = &) (91)
  "/post/tag/80mm",
  "/post/tag/london",
  "/post/tag/40mm",
  "/post/tag/Contax+645",
  "/post/tag/Raw",
  "/post/tag/M42",
  "/post/tag/Archaeology+Now",
  "/post/tag/Planr+80mm+f2",
  "/post/tag/Upgrade",
  "/post/tag/palazzo+ducale",
  "/post/tag/venice",
  "/post/tag/fondation+cartier",
  "/post/tag/Helios+44",
  "/post/tag/Konica",
  "/post/tag/Book",
  "/post/tag/Bokeh",
  "/post/tag/Kodak+Professional",
  "/post/tag/The+Tabernacle",
  "/post/tag/Planar",
  "/post/tag/35mm",
  "/post/tag/GA645",
  "/post/tag/Seagull",
  "/post/tag/Camera",
  "/post/tag/A+plus+A+gallery",
  "/post/tag/Medium+format",
  "/post/tag/Hexar+AF",
  "/post/tag/Kate+Dunn",
  "/post/tag/Medium+Format",
  "/post/tag/Hexanon",
  "/post/tag/Anniversary",
  "/post/tag/film",
  "/post/tag/Contax",
  "/post/tag/SD+Quattro+H",
  "/post/tag/120",
  "/post/tag/Gold+200",
  "/post/tag/Milan",
  "/post/tag/Galleria+Borghese",
  "/post/tag/645",
  "/post/tag/Gallery",
  "/post/tag/Point+and+shoot",
  "/post/tag/Point+%26+shoot",
  "/post/tag/Sensor",
  "/post/tag/Art",
  "/post/tag/tintoretto",
  "/post/tag/Opinion",
  "/post/tag/Infrared",
  "/post/tag/120+format",
  "/post/tag/Silver+label",
  "/post/tag/Sigma",
  "/post/tag/Review",
  "/post/tag/Fomapan",
  "/post/tag/natural+history",
  "/post/tag/Ilford",
  "/post/tag/paris",
  "/post/tag/Contax+TVS",
  "/post/tag/Pentax",
  "/post/tag/1+year",
  "/post/tag/Fujifilm",
  "/post/tag/China",
  "/post/tag/Green+label",
  "/post/tag/hirst",
  "/post/tag/f1-8",
  "/post/tag/18-35mm",
  "/post/tag/Silver+Print",
  "/post/tag/Tlr",
  "/post/tag/Blog",
  "/post/tag/Kodak",
  "/post/tag/Darkroom",
  "/post/tag/exhibition",
  "/post/tag/shark",
  "/post/tag/kiefer",
  "/post/tag/Damien+Hirst",
  "/post/tag/50mm",
  "/post/tag/Black+%26+white",
  "/post/tag/2022",
  "/post/tag/Analog+Photography",
  "/post/tag/Zine",
  "/post/tag/Dynamic+Range",
  "/post/tag/Contax+TVS+digital",
  "/post/tag/Unboxing",
  "/post/tag/Foveon",
  "/post/tag/Wedding",
  "/post/tag/6x7",
  "/post/tag/Contax+G",
  "/post/tag/45mm",
  "/post/tag/Paper",
  "/post/tag/Exhibitions",
  "/post/tag/Light+meter",
  "/post/tag/cherry+blossom",
  "/post/tag/RawDigger",
  "/post/tag/David+Hockney",
  // pagine (8)
  "/contact-davidecaniatti",
  "/index",
  "/still-life",
  "/human-nature-wells",
  "/corporate",
  "/out-of-time",
  "/portrait-",
  "/home",
];
// Oltre alla sitemap: /work (302 verso /portrait- sul vecchio sito) e la home.
const EXTRA = ["/work", "/"];
// Pagine che sul vecchio sito non avevano meta description (tag, categorie e 4 articoli): per queste
// la description puo' restare vuota; per tutte le altre deve esserci. Il title serve sempre.
const SENZA_DESCRIZIONE = new Set([
  "/post/contax-g-28mm-biogon",
  "/post/contax-hologon-16mm-story-and-black-and-white",
  "/post/nikonos-iv-a-the-perfect-winter-camera",
  "/post/sigma-sd-quattro-hands-on",
  "/post/category/Foveon",
  "/post/category/Cameras",
  "/post/category/Lenses",
  "/post/tag/80mm",
  "/post/tag/london",
  "/post/tag/40mm",
  "/post/tag/Contax+645",
  "/post/tag/Raw",
  "/post/tag/M42",
  "/post/tag/Archaeology+Now",
  "/post/tag/Planr+80mm+f2",
  "/post/tag/Upgrade",
  "/post/tag/palazzo+ducale",
  "/post/tag/venice",
  "/post/tag/fondation+cartier",
  "/post/tag/Helios+44",
  "/post/tag/Konica",
  "/post/tag/Book",
  "/post/tag/Bokeh",
  "/post/tag/Kodak+Professional",
  "/post/tag/The+Tabernacle",
  "/post/tag/Planar",
  "/post/tag/35mm",
  "/post/tag/GA645",
  "/post/tag/Seagull",
  "/post/tag/Camera",
  "/post/tag/A+plus+A+gallery",
  "/post/tag/Medium+format",
  "/post/tag/Hexar+AF",
  "/post/tag/Kate+Dunn",
  "/post/tag/Medium+Format",
  "/post/tag/Hexanon",
  "/post/tag/Anniversary",
  "/post/tag/film",
  "/post/tag/Contax",
  "/post/tag/SD+Quattro+H",
  "/post/tag/120",
  "/post/tag/Gold+200",
  "/post/tag/Milan",
  "/post/tag/Galleria+Borghese",
  "/post/tag/645",
  "/post/tag/Gallery",
  "/post/tag/Point+and+shoot",
  "/post/tag/Point+%26+shoot",
  "/post/tag/Sensor",
  "/post/tag/Art",
  "/post/tag/tintoretto",
  "/post/tag/Opinion",
  "/post/tag/Infrared",
  "/post/tag/120+format",
  "/post/tag/Silver+label",
  "/post/tag/Sigma",
  "/post/tag/Review",
  "/post/tag/Fomapan",
  "/post/tag/natural+history",
  "/post/tag/Ilford",
  "/post/tag/paris",
  "/post/tag/Contax+TVS",
  "/post/tag/Pentax",
  "/post/tag/1+year",
  "/post/tag/Fujifilm",
  "/post/tag/China",
  "/post/tag/Green+label",
  "/post/tag/hirst",
  "/post/tag/f1-8",
  "/post/tag/18-35mm",
  "/post/tag/Silver+Print",
  "/post/tag/Tlr",
  "/post/tag/Blog",
  "/post/tag/Kodak",
  "/post/tag/Darkroom",
  "/post/tag/exhibition",
  "/post/tag/shark",
  "/post/tag/kiefer",
  "/post/tag/Damien+Hirst",
  "/post/tag/50mm",
  "/post/tag/Black+%26+white",
  "/post/tag/2022",
  "/post/tag/Analog+Photography",
  "/post/tag/Zine",
  "/post/tag/Dynamic+Range",
  "/post/tag/Contax+TVS+digital",
  "/post/tag/Unboxing",
  "/post/tag/Foveon",
  "/post/tag/Wedding",
  "/post/tag/6x7",
  "/post/tag/Contax+G",
  "/post/tag/45mm",
  "/post/tag/Paper",
  "/post/tag/Exhibitions",
  "/post/tag/Light+meter",
  "/post/tag/cherry+blossom",
  "/post/tag/RawDigger",
  "/post/tag/David+Hockney",
  // /work non e' in sitemap ma ha la descrizione di /portrait-
]);
// Indirizzi che GitHub Pages non puo' servire come sul vecchio sito: il file trovato e' un altro
// e la differenza e' approvata (vedi JOURNAL.md, 23/10/2026).
const APPROVATI = {
  "/index": "GitHub Pages risolve /index a index.html (la home); la pagina Index sta a /blog-index",
};

const SITE_DIR = path.resolve(process.env.SITE_DIR || "_site");
let prefix = (process.env.PATH_PREFIX || "/").trim() || "/";
if (!prefix.startsWith("/")) prefix = "/" + prefix;
if (!prefix.endsWith("/")) prefix += "/";
const IS_LAB = prefix !== "/";

const errors = [];
const fail = (m) => errors.push(m);

// ---- esistenza di un file con maiuscole/minuscole esatte (come su Linux/GitHub Pages) ----
function isFileExact(rel) {
  let dir = SITE_DIR;
  const parts = rel.split("/").filter(Boolean);
  if (!parts.length) return false;
  for (let i = 0; i < parts.length; i++) {
    let names;
    try { names = fs.readdirSync(dir); } catch { return false; }
    if (!names.includes(parts[i])) return false;
    dir = path.join(dir, parts[i]);
  }
  try { return fs.statSync(dir).isFile() ? dir : false; } catch { return false; }
}

function resolveLikePages(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath.split("?")[0].replace(/\+/g, "%2B")); } catch { return null; }
  if (p === "/" || p === "") return isFileExact("index.html") || null;
  const rel = p.replace(/^\/+/, "");
  return isFileExact(rel) || isFileExact(rel + ".html") || null;
}

const read = (f) => fs.readFileSync(f, "utf8");
const decodeEntities = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");

function headOf(html) {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let d = null;
  for (const m of html.matchAll(/<meta\s+[^>]*>/gi)) {
    if (/name=["']description["']/i.test(m[0])) {
      const c = m[0].match(/content=["']([^"']*)["']/i);
      d = c ? c[1] : "";
    }
  }
  return {
    title: t ? decodeEntities(t[1]).trim() : "",
    description: d === null ? "" : decodeEntities(d).trim(),
  };
}

// ---- 1) ogni indirizzo vecchio ha il suo file, con title e description ----
if (!fs.existsSync(SITE_DIR)) {
  console.error(`Cartella ${SITE_DIR} non trovata: lanciare prima la build.`);
  process.exit(1);
}
const all = [...SITEMAP, ...EXTRA];
const seen = new Set();
let ok = 0;
for (const u of all) {
  if (seen.has(u)) continue;
  seen.add(u);
  const file = resolveLikePages(u);
  if (!file) { fail(`MANCA ${u}: in ${path.basename(SITE_DIR)} non c'e' il file che GitHub Pages servirebbe a questo indirizzo`); continue; }
  const h = headOf(read(file));
  const problems = [];
  if (!h.title) problems.push("title vuoto");
  if (!h.description && !SENZA_DESCRIZIONE.has(u)) problems.push("meta description vuota");
  if (problems.length) { fail(`VUOTO ${u}: ${problems.join(", ")} (${path.relative(SITE_DIR, file)})`); continue; }
  ok++;
}
console.log(`Indirizzi controllati: ${seen.size} (${SITEMAP.length} della sitemap + extra); con file, title e description: ${ok}`);
for (const [u, why] of Object.entries(APPROVATI)) console.log(`  nota: ${u} - ${why}`);

// ---- 2) laboratorio: prefisso nei link, noindex, niente Analytics ----
if (IS_LAB) {
  const htmlFiles = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith(".html")) htmlFiles.push(f);
    }
  })(SITE_DIR);
  let sbagliati = 0;
  for (const f of htmlFiles) {
    const h = read(f);
    const rel = path.relative(SITE_DIR, f);
    if (!/<meta name="robots" content="noindex, nofollow">/.test(h)) fail(`LAB ${rel}: manca noindex`);
    if (/googletagmanager|G-[A-Z0-9]{8,}/.test(h)) fail(`LAB ${rel}: compare Analytics`);
    const locali = [];
    for (const m of h.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) locali.push(m[1]);
    for (const m of h.matchAll(/\ssrcset="([^"]*)"/g)) {
      for (const part of m[1].split(",")) { const u = part.trim().split(/\s+/)[0]; if (u.startsWith("/")) locali.push(u); }
    }
    const refresh = h.match(/http-equiv="refresh" content="\d+; url=([^"]*)"/i);
    if (refresh && refresh[1].startsWith("/")) locali.push(refresh[1]);
    for (const v of locali) {
      if (v.startsWith("//")) continue;
      if (!v.startsWith(prefix) && v !== prefix.slice(0, -1)) {
        if (sbagliati++ < 10) fail(`LAB ${rel}: indirizzo senza prefisso ${prefix}: ${v}`);
      } else if (v.startsWith(prefix + prefix.slice(1))) {
        if (sbagliati++ < 10) fail(`LAB ${rel}: prefisso doppio: ${v}`);
      }
    }
  }
  console.log(`Laboratorio (${prefix}): ${htmlFiles.length} pagine HTML controllate per noindex, Analytics e prefisso nei link`);
}

if (errors.length) {
  console.error(`\nRETE DI SICUREZZA: ${errors.length} problema/i`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("Rete di sicurezza: tutto a posto.");
