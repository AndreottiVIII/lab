// Configurazione Eleventy per davidecaniatti.com
// Gli URL sono SEMPRE decisi dal campo `permalink` di ogni file: GitHub Pages serve
// "percorso/nome.html" all'indirizzo "/percorso/nome" (senza .html e senza barra finale).
const fs = require("fs");
const path = require("path");
const MarkdownIt = require("markdown-it");
const sharp = require("sharp");
const build = require("./src/_data/build.js");
const house = require("./lib/house.js");

const SRC_IMG = path.join(__dirname, "src", "img");
const WIDTHS = [480, 960, 1600];
const imageInfo = {}; // nome file -> {w, h}
// "" sul sito, "/lab" nel laboratorio. Il plugin HTML Base (in fondo) gira PRIMA di "html-polish":
// quando questa trasformazione vede l'HTML, i percorsi locali hanno gia' il prefisso.
const BASE = build.prefix.slice(0, -1);

function pad(n) { return String(n).padStart(2, "0"); }

module.exports = async function (eleventyConfig) {
  // ---------- Markdown ----------
  const md = new MarkdownIt({ html: true, breaks: false, linkify: false });
  eleventyConfig.setLibrary("md", md);
  eleventyConfig.addFilter("mdInline", (s) => (s ? md.renderInline(String(s)) : ""));
  eleventyConfig.addFilter("mdBlock", (s) => (s ? md.render(String(s)) : ""));

  // ---------- File copiati cosi' come sono ----------
  eleventyConfig.addPassthroughCopy({ "src/img": "img" });
  eleventyConfig.addPassthroughCopy({ "src/fonts": "fonts" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });

  // ---------- Collezioni ----------
  // piu' recente prima; a parita' di data l'articolo "copia" (duplicate_of) viene dopo l'originale
  const byDate = (a, b) =>
    b.date - a.date ||
    (a.data.duplicate_of ? 1 : 0) - (b.data.duplicate_of ? 1 : 0) ||
    a.inputPath.localeCompare(b.inputPath);
  eleventyConfig.addCollection("posts", (api) => api.getFilteredByGlob("src/posts/*.md").sort(byDate));
  eleventyConfig.addCollection("pageDocs", (api) => api.getFilteredByGlob("src/pages/*.md"));

  const group = (api, key) => {
    const map = new Map();
    for (const p of api.getFilteredByGlob("src/posts/*.md").sort(byDate)) {
      for (const name of p.data[key] || []) {
        if (!map.has(name)) map.set(name, []);
        map.get(name).push(p);
      }
    }
    return [...map.entries()].map(([name, posts]) => ({ name, posts }));
  };
  eleventyConfig.addCollection("tagList", (api) => group(api, "labels"));
  eleventyConfig.addCollection("categoryList", (api) => group(api, "categories"));

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
    return house.build(items);
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

  eleventyConfig.addFilter("dateShort", (d) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${pad(d.getUTCFullYear() % 100)}`);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  eleventyConfig.addFilter("dateMD", (d) => `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`);
  eleventyConfig.addFilter("dateISO", (d) => d.toISOString().slice(0, 10));
  eleventyConfig.addFilter("dateRFC822", (d) => d.toUTCString());
  eleventyConfig.addFilter("neighbour", (list, url, off) => {
    const i = list.findIndex((p) => p.url === url);
    return i < 0 ? null : list[i + off] || null;
  });
  eleventyConfig.addFilter("findUrl", (list, url) => list.find((p) => p.url === url || p.page?.url === url));
  eleventyConfig.addFilter("pageByKey", (list, key) => list.find((p) => p.fileSlug === key));
  eleventyConfig.addFilter("limit", (a, n) => a.slice(0, n));
  eleventyConfig.addFilter("notDuplicate", (a) => a.filter((p) => !p.data.duplicate_of));
  eleventyConfig.addFilter("absUrl", (p, base) => (p === "/" ? base : base + p));
  eleventyConfig.addFilter("imgPath", (p) => p);
  eleventyConfig.addFilter("jsonStr", (s) => JSON.stringify(s));
  eleventyConfig.addFilter("xmlEscape", (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  );

  // ---------- Immagini: misure e versioni piccole ----------
  eleventyConfig.on("eleventy.before", async () => {
    if (!fs.existsSync(SRC_IMG)) return;
    for (const f of fs.readdirSync(SRC_IMG)) {
      if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
      if (imageInfo[f]) continue;
      const m = await sharp(path.join(SRC_IMG, f)).metadata();
      imageInfo[f] = { w: m.width, h: m.height };
    }
  });

  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    const outW = path.join(dir.output, "img", "w");
    fs.mkdirSync(outW, { recursive: true });
    const cache = path.join(__dirname, ".cache", "img-w");
    fs.mkdirSync(cache, { recursive: true });
    const jobs = [];
    for (const [f, info] of Object.entries(imageInfo)) {
      const ext = path.extname(f).toLowerCase();
      const stem = path.basename(f, ext);
      for (const w of WIDTHS) {
        if (info.w <= w + 40) continue;
        const name = `${stem}-${w}${ext}`;
        const dest = path.join(outW, name);
        const cached = path.join(cache, name);
        const src = path.join(SRC_IMG, f);
        const fresh = fs.existsSync(cached) && fs.statSync(cached).mtimeMs >= fs.statSync(src).mtimeMs;
        jobs.push(async () => {
          if (!fresh) {
            const pipe = sharp(src).resize({ width: w, withoutEnlargement: true });
            if (ext === ".png") await pipe.png({ compressionLevel: 9 }).toFile(cached);
            else await pipe.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(cached);
          }
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
      if (/davidecaniatti\.com|andreottiviii\.github\.io/.test(href) || /target=/.test(rest)) return m;
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
