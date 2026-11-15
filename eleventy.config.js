// Configurazione Eleventy per davidecaniatti.com
// Gli URL sono SEMPRE decisi dal campo `permalink` di ogni file: GitHub Pages serve
// "percorso/nome.html" all'indirizzo "/percorso/nome" (senza .html e senza barra finale).
const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");
const sharp = require("sharp");
const build = require("./src/_data/build.js");
const house = require("./lib/house.js");
const letters = require("./src/_data/letters.json");

const SRC_IMG = path.join(__dirname, "src", "img");
const WIDTHS = [480, 960, 1600];
const imageInfo = {}; // nome file -> {w, h, big}
const MAX_IMG_BYTES = 2 * 1024 * 1024; // nessun file pubblicato oltre 2 MB
const MAX_IMG_SIDE = 2500;
// "" sul sito, "/lab" nel laboratorio. Il plugin HTML Base (in fondo) gira PRIMA di "html-polish":
// quando questa trasformazione vede l'HTML, i percorsi locali hanno gia' il prefisso.
const BASE = build.prefix.slice(0, -1);

function pad(n) { return String(n).padStart(2, "0"); }

module.exports = async function (eleventyConfig) {
  // ---------- Markdown ----------
  const md = new MarkdownIt({ html: true, breaks: false, linkify: false });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("mdBlock", (s) => (s ? md.render(String(s)) : ""));

  // ---------- File copiati cosi' come sono ----------
  eleventyConfig.addPassthroughCopy({ "src/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/vault-box": "vault-box" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // ---------- Collezioni ----------
  // piu' recente prima. L'articolo "copia" (duplicate_of: il doppio indirizzo del Seagull 4A) ha la sua pagina
  // ma non entra negli elenchi (registro, etichette, categorie, feed, sitemap), come gia' nella casa e nell'Index.
  const byDate = (a, b) => b.date - a.date || a.inputPath.localeCompare(b.inputPath);
  const allPosts = (api) => api.getFilteredByGlob("src/posts/*.md").sort(byDate);
  eleventyConfig.addCollection("posts", (api) => allPosts(api).filter((p) => !p.data.duplicate_of));

  // etichette e categorie: i nomi vengono da tutti gli articoli (nessuna pagina vecchia sparisce), gli elenchi senza la copia
  const group = (api, key) => {
    const map = new Map();
    for (const p of allPosts(api)) {
      for (const name of p.data[key] || []) {
        if (!map.has(name)) map.set(name, []);
        if (!p.data.duplicate_of) map.get(name).push(p);
      }
    }
    return [...map.entries()].map(([name, posts]) => ({ name, posts }));
  };
  eleventyConfig.addCollection("tagList", (api) => group(api, "labels"));
  eleventyConfig.addCollection("categoryList", (api) => group(api, "categories"));
  // descrizione per Google delle pagine di tag e categoria (su Squarespace erano vuote): si aggiorna da sola con gli articoli
  eleventyConfig.addFilter("listDesc", (g, kind) => {
    const titles = (g.posts || [])
      .slice()
      .sort((a, b) => b.date - a.date)
      .map((p) => String(p.data.title || "").replace(/\s+/g, " ").trim().replace(/[.\s]+$/, ""))
      .filter(Boolean);
    const head = kind === "tag" ? `Articles tagged ${g.name} by Davide Caniatti` : `Articles in ${g.name} by Davide Caniatti`;
    if (!titles.length) return head + ".";
    let out = head + ": " + titles[0];
    let k = 1;
    while (k < titles.length && (out + ", " + titles[k]).length <= 140) out += ", " + titles[k++];
    const rest = titles.length - k;
    return out + (rest ? ` and ${rest} more.` : ".");
  });

  // ---------- La casa in sezione (home e pagine dei piani) ----------
  // Un solo elenco di contenuti (articoli, gallerie, progetti) con gli stessi campi; lib/house.js decide
  // quali stanno nei posti del disegno e quali solo nella legenda. Niente e' scritto a mano nel disegno.
  const cleanUrl = (u) => {
    const x = String(u).replace(/\.html$/, "");
    return x === "/index" || x === "" ? "/" : x;
  };
  eleventyConfig.addCollection("house", (api) => {
    const items = [];
    for (const p of api.getFilteredByGlob("src/posts/*.md")) {
      if (p.data.duplicate_of) continue; // la copia dello stesso articolo non compare
      items.push(house.toItem("post", p.data, cleanUrl(p.url), false, p.date, SRC_IMG));
    }
    for (const p of api.getFilteredByGlob("src/galleries/*.md")) {
      const d = { ...p.data };
      if (!d.image && Array.isArray(d.gallery) && d.gallery[0]) d.image = d.gallery[0].image;
      items.push(house.toItem("gallery", d, cleanUrl(p.url), false, null, SRC_IMG));
    }
    for (const p of api.getFilteredByGlob("src/projects/*.md")) {
      const ext = /^https?:/.test(p.data.url || "");
      items.push(house.toItem("project", p.data, p.data.url, ext, p.data.date ? p.date : null, SRC_IMG));
    }
    return house.build(items, letters);
  });
  eleventyConfig.addShortcode("houseDrawing", (h) => house.drawing(h));
  eleventyConfig.addShortcode("houseDefs", (h) => house.defs(h));
  eleventyConfig.addShortcode("houseCover", (h) => house.cover(h));
  eleventyConfig.addShortcode("houseFloor", (h, key) => house.floor(h, key));
  eleventyConfig.addShortcode("houseRemember", () => house.remember());

  // ---------- Filtri ----------
  // Nome etichetta -> URL come lo scriveva Squarespace: spazio = "+", "&" = "%26"
  const encName = (n) => encodeURIComponent(n).replace(/%20/g, "+");
  // /post/foo.html -> /post/foo ; /index.html -> /
  eleventyConfig.addFilter("cleanUrl", (u) => {
    let x = String(u).replace(/\.html$/, "");
    if (x === "/index" || x === "") x = "/";
    return x;
  });
  eleventyConfig.addFilter("tagUrl", (n) => "/post/tag/" + encName(n));
  eleventyConfig.addFilter("categoryUrl", (n) => "/post/category/" + encName(n));
  // ...e il nome del file corrispondente (GitHub Pages decodifica il percorso, "+" resta "+")
  eleventyConfig.addFilter("tagFile", (n) => "/post/tag/" + n.replace(/ /g, "+") + ".html");
  eleventyConfig.addFilter("categoryFile", (n) => "/post/category/" + n.replace(/ /g, "+") + ".html");

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  eleventyConfig.addFilter("dateMD", (d) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`);
  eleventyConfig.addFilter("dateDots", (d) => `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`);
  eleventyConfig.addFilter("dateLong", (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`);
  eleventyConfig.addFilter("urlIndex", (list, url) => Math.max(0, list.findIndex((x) => x.url === url)));
  eleventyConfig.addFilter("countFloor", (list, key) => list.filter((p) => (p.data.floor || "writing") === key).length);
  eleventyConfig.addFilter("pad2", (n) => pad(n));
  // vero se la foto esiste in src/ (le foto perse su Squarespace non ci sono: al loro posto il riquadro tratteggiato)
  eleventyConfig.addFilter("hasImg", (p) => !!p && (/^https?:/.test(p) || fs.existsSync(path.join(SRC_IMG, "..", String(p)))));
  // posizione di un articolo dentro il suo piano (dal piu' recente): {i, n, newer, older}
  eleventyConfig.addFilter("sheetIn", (F, url) => {
    const items = (F && F.items) || [];
    const i = items.findIndex((x) => x.url === url);
    return { i, n: items.length, newer: i > 0 ? items[i - 1] : null, older: i >= 0 ? items[i + 1] || null : null };
  });
  // l'Index: tutti i contenuti della casa, piano per piano, in ordine alfabetico dentro il piano, numerati di seguito
  eleventyConfig.addFilter("catalog", (H, letters) => {
    let n = 0;
    const sections = H.floors.map((f) => {
      const entries = f.items
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base", ignorePunctuation: true }))
        .map((it) => ({ n: ++n, title: it.title, url: it.url, ext: it.ext, lang: it.lang, year: it.date ? it.date.getUTCFullYear() : "" }));
      return { key: f.key, name: f.name, room: f.room, url: f.url, entries };
    });
    if (letters && letters.url) {
      const entries = [{ n: ++n, title: letters.label + " (Substack)", url: letters.url, ext: true, lang: "", year: "" }];
      for (const a of letters.also || []) entries.push({ n: ++n, title: a.label, url: a.url, ext: true, lang: a.lang || "", year: "" });
      sections.push({ key: "letters", name: letters.label, room: "Dovecote", url: letters.page || letters.url, ext: !letters.page, entries });
    }
    return { sections, total: n };
  });
  eleventyConfig.addFilter("dateISO", (d) => d.toISOString().slice(0, 10));
  eleventyConfig.addFilter("dateRFC822", (d) => d.toUTCString());
  eleventyConfig.addFilter("findUrl", (list, url) => list.find((p) => p.url === url || p.page?.url === url));
  eleventyConfig.addFilter("limit", (a, n) => a.slice(0, n));
  eleventyConfig.addFilter("absUrl", (p, base) => (p === "/" ? base : base + p));
  eleventyConfig.addFilter("xmlEscape", (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  );

  // ---------- Immagini: misure e versioni piccole ----------
  eleventyConfig.on("eleventy.before", async () => {
    if (!fs.existsSync(SRC_IMG)) return;
    for (const f of fs.readdirSync(SRC_IMG)) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      if (imageInfo[f]) continue;
      const file = path.join(SRC_IMG, f);
      const m = await sharp(file).metadata();
      // foto da telefono: l'orientamento sta nei dati EXIF (5-8 = girata di 90 gradi)
      let w = m.orientation >= 5 ? m.height : m.width;
      let h = m.orientation >= 5 ? m.width : m.height;
      // foto oltre 2 MB (caricate dal pannello cosi' come escono dal telefono): sul sito va una copia
      // ridotta a 2500 px di lato lungo, l'originale in src/img resta com'e'. La rete di sicurezza blocca i file oltre 2 MB.
      const big = fs.statSync(file).size > MAX_IMG_BYTES;
      if (big && Math.max(w, h) > MAX_IMG_SIDE) {
        const k = MAX_IMG_SIDE / Math.max(w, h);
        w = Math.round(w * k);
        h = Math.round(h * k);
      }
      imageInfo[f] = { w, h, big };
    }
  });

  // stesso formato del file di partenza; l'estensione resta scritta com'era (".JPG" resta ".JPG": su Linux conta)
  const encode = (pipe, ext, quality = 82) => {
    const e = ext.toLowerCase();
    if (e === ".png") return pipe.png({ compressionLevel: 9 });
    if (e === ".webp") return pipe.webp({ quality });
    return pipe.jpeg({ quality, progressive: true, mozjpeg: true });
  };

  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const outW = path.join(dir.output, "img", "w");
    fs.mkdirSync(outW, { recursive: true });
    const cache = path.join(__dirname, ".cache", "img-w");
    fs.mkdirSync(cache, { recursive: true });
    const jobs = [];
    for (const [f, info] of Object.entries(imageInfo)) {
      const ext = path.extname(f);
      const stem = path.basename(f, ext);
      const src = path.join(SRC_IMG, f);
      if (info.big) {
        // la copia ridotta prende il posto dell'originale in _site/img (dopo la copia dei file)
        jobs.push(async () => {
          const dest = path.join(dir.output, "img", f);
          for (const q of [82, 72, 60]) {
            await encode(sharp(src).rotate().resize({ width: info.w, height: info.h, fit: "inside", withoutEnlargement: true }), ext, q).toFile(dest + ".tmp");
            fs.renameSync(dest + ".tmp", dest);
            if (fs.statSync(dest).size <= MAX_IMG_BYTES) break;
          }
        });
      }
      for (const w of WIDTHS) {
        if (info.w <= w + 40) continue;
        const name = `${stem}-${w}${ext}`;
        const dest = path.join(outW, name);
        const cached = path.join(cache, name);
        const fresh = fs.existsSync(cached) && fs.statSync(cached).mtimeMs >= fs.statSync(src).mtimeMs;
        jobs.push(async () => {
          if (!fresh) await encode(sharp(src).rotate().resize({ width: w, withoutEnlargement: true }), ext).toFile(cached);
          fs.copyFileSync(cached, dest);
        });
      }
    }
    // a gruppi, per non saturare la memoria
    for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map((j) => j()));
  });

  // ---------- Trasformazioni dell'HTML prodotto ----------
  eleventyConfig.addTransform("html-polish", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;

    // 1) elenchi di sole immagini -> galleria con apertura a schermo intero
    content = content.replace(/<ul>\s*((?:<li>\s*<img [^>]*>\s*<\/li>\s*)+)<\/ul>/g, (m, items) => {
      const imgs = [...items.matchAll(/<img ([^>]*)>/g)].map((x) => x[1]);
      const cells = imgs
        .map((attrs) => {
          const src = (attrs.match(/src="([^"]+)"/) || [])[1];
          const alt = (attrs.match(/alt="([^"]*)"/) || [])[1] || "";
          return `<a class="lb" href="${src}" data-alt="${alt}" aria-label="View fullsize"><img ${attrs} sizes="(max-width: 700px) 50vw, 33vw"></a>`;
        })
        .join("");
      return `<div class="gallery-grid" data-lightbox>${cells}</div>`;
    });
    // 2) immagine + riga in corsivo subito sotto = foto con didascalia
    content = content.replace(/<p>((?:<a [^>]*>)?<img [^>]*>(?:<\/a>)?)\s*\n<em>([\s\S]*?)<\/em><\/p>/g, '<figure class="photo">$1<figcaption>$2</figcaption></figure>');
    // 3) immagine da sola in un paragrafo
    content = content.replace(/<p>((?:<a [^>]*>)?<img [^>]*>(?:<\/a>)?)<\/p>/g, '<figure class="photo">$1</figure>');

    // 4) <img> locali: misure, srcset e caricamento pigro
    content = content.replace(/<img ([^>]*?)(\s*\/)?>/g, (m, attrs) => {
      const src = (attrs.match(new RegExp('src="' + BASE + '/img/([^"/]+)"')) || [])[1];
      if (!src) return m;
      const info = imageInfo[src];
      let a = attrs;
      if (info) {
        if (!/\swidth=/.test(" " + a)) a += ` width="${info.w}" height="${info.h}"`;
        if (!/srcset=/.test(a)) {
          const ext = path.extname(src);
          const stem = path.basename(src, ext);
          const set = WIDTHS.filter((w) => info.w > w + 40).map((w) => `${BASE}/img/w/${stem}-${w}${ext} ${w}w`);
          if (set.length) {
            set.push(`${BASE}/img/${src} ${info.w}w`);
            a += ` srcset="${set.join(", ")}"`;
            if (!/sizes=/.test(a)) a += ` sizes="(max-width: 800px) 100vw, 800px"`;
          }
        }
      }
      if (!/loading=/.test(a)) a += ` loading="lazy"`;
      if (!/decoding=/.test(a)) a += ` decoding="async"`;
      return `<img ${a}>`;
    });

    // 5) link esterni in una nuova scheda
    content = content.replace(/<a href="(https?:\/\/[^"]+)"([^>]*)>/g, (m, href, rest) => {
      // pagine del sito stesso: stessa scheda. I progetti (Lexodus, Grand Strategy...) si aprono sempre in una scheda nuova.
      const own = /^https?:\/\/(www\.)?(davidecaniatti\.com|andreottiviii\.github\.io)(\/|$)/.test(href) && !/\/(lexodus|grand-strategy)(\/|$)/.test(href);
      if (own || /target=/.test(rest)) return m;
      return `<a href="${href}" target="_blank" rel="noopener"${rest}>`;
    });
    return content;
  });

  // Nel laboratorio (PATH_PREFIX="/lab/") tutti i link, le immagini, il CSS e il JS ricevono il prefisso.
  // Il plugin lavora prima di "html-polish" (vedi BASE in cima): le trasformazioni qui sopra ne tengono conto.
  // Sul sito (nessun prefisso) non viene nemmeno attivato.
  if (build.lab) {
    const { EleventyHtmlBasePlugin } = await import("@11ty/eleventy");
    eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
  }

  return {
    pathPrefix: build.prefix,
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: false, // il Markdown non passa da Nunjucks: le graffe nei testi restano testo
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "11ty.js"],
  };
};
