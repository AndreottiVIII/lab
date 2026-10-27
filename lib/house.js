// La casa in sezione, disegnata dai dati.
//
// Questo modulo fa due cose:
//   1. build(items): decide, piano per piano, quali contenuti occupano i "posti" del disegno
//      (le stanze hanno un numero fisso di posti) e quali finiscono solo nella legenda;
//      assegna i numeri cerchiati in ordine, dall'alto in basso.
//   2. produce il disegno in tre versioni, tutte dagli stessi dati e dallo stesso disegno fisso (lib/art.js):
//        drawing()  la sezione intera per il computer;
//        cover()    la copertina da telefono: la casa intera con le quattro fasce da toccare;
//        floor()    un piano ingrandito a tutta larghezza (telefono), con numeri e scritte leggibili.
//      Le foto, i numeri e le scritte sono HTML e non SVG: cosi' sono link veri, con testo alternativo,
//      con area di tocco da 32 px e l'effetto "sviluppo" della camera oscura funziona in tutti i browser.
//
// Il disegno e' quello approvato (layout/G-sezione.html). Le coordinate sono nel suo viewBox 640 x 1200.

const fs = require("fs");
const path = require("path");
const FLOORS = require("../src/_data/floors.json");
const art = require("./art.js");

const VB_W = 640;
const VB_H = 1200;

// ---------------------------------------------------------------- posti nelle stanze
const GREEN = Array.from({ length: 6 }, (_, i) => ({ x: 140 + 60 * i, y: 200, w: 44, h: 28, nx: 135 + 60 * i, ny: 274 }));
const STUDY = [
  { x: 164, y: 336, w: 96, h: 76, nx: 212, ny: 420 },
  { x: 270, y: 340, w: 74, h: 56, nx: 307, ny: 402 },
  { x: 354, y: 336, w: 116, h: 58, nx: 412, ny: 400 },
  { x: 164, y: 424, w: 84, h: 64, nx: 206, ny: 496 },
  { x: 258, y: 408, w: 54, h: 66, nx: 285, ny: 482 },
  { x: 322, y: 406, w: 76, h: 54, nx: 388, ny: 466 },
  { x: 408, y: 404, w: 62, h: 76, nx: 439, ny: 488 },
  { x: 322, y: 470, w: 40, h: 40, nx: 342, ny: 520 },
];
const BENCH = [
  { x: 98, y: 752, w: 70, h: 48, nx: 133, ny: 744 },
  { x: 176, y: 756, w: 58, h: 44, nx: 205, ny: 746 },
  { x: 242, y: 758, w: 56, h: 42, nx: 270, ny: 748 },
  { x: 306, y: 758, w: 56, h: 42, nx: 334, ny: 748 },
  { x: 370, y: 756, w: 58, h: 44, nx: 399, ny: 746 },
];
const PEG_NUMBER = { nx: 322, ny: 690 };
const PEG_NUMBER_PHONE = { nx: 360, ny: 688 };
const PEG_BOARD = { x: 90, y: 642, w: 250, h: 92 };
const LINE = [
  { x: 98, y: 938, w: 46, h: 60, nx: 121, ny: 1010, peg: [118, 933] },
  { x: 166, y: 941, w: 64, h: 46, nx: 198, ny: 999, peg: [195, 936] },
  { x: 252, y: 942, w: 48, h: 48, nx: 276, ny: 1002, peg: [273, 937] },
  { x: 322, y: 942, w: 56, h: 42, nx: 350, ny: 996, peg: [347, 937] },
  { x: 400, y: 940, w: 58, h: 44, nx: 429, ny: 996, peg: [426, 935] },
];
const CAPACITY = { projects: GREEN.length, writing: STUDY.length, workshop: BENCH.length, photography: LINE.length };

// ---------------------------------------------------------------- utilita'
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pc = (v, total) => (Math.round((v / total) * 100000) / 1000).toString() + "%";
// le tre viste del disegno: porzione del viewBox 640 x 1200 che si mostra
const VIEW = {
  desk: { vx: 0, vy: 0, vw: 640, vh: 1200 },
  cover: { vx: 0, vy: 0, vw: 560, vh: 1200 },
  projects: { vx: 40, vy: 62, vw: 520, vh: 262 },
  writing: { vx: 40, vy: 296, vw: 520, vh: 326 },
  workshop: { vx: 40, vy: 596, vw: 520, vh: 308 },
  photography: { vx: 40, vy: 878, vw: 520, vh: 268 },
};
const boxIn = (v, b) => `left:${pc(b.x - v.vx, v.vw)};top:${pc(b.y - v.vy, v.vh)};width:${pc(b.w, v.vw)};height:${pc(b.h, v.vh)}`;
const pinIn = (v, x, y) => `left:${pc(x - v.vx, v.vw)};top:${pc(y - v.vy, v.vh)}`;

function plain(s) {
  return String(s || "").replace(/<[^>]+>/g, "").replace(/[*_`]/g, "").replace(/\\/g, "").replace(/\s+/g, " ").trim();
}
function cut(s, n) {
  s = plain(s);
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, "") + "…";
}
// nome corto per le targhette: la parte del titolo prima di : , ? - (se manca "short" nel frontmatter)
function shortName(it) {
  if (it.short) return it.short;
  const t = plain(it.title).split(/\s*[:,?!–—]\s*|\s+[-–—]\s+/)[0].replace(/[.\s]+$/, "");
  return t.length > 15 ? t.slice(0, 14).trim() + "…" : t;
}

// ---------------------------------------------------------------- dai file ai contenuti
// Ogni contenuto (articolo, galleria, progetto) diventa un oggetto con gli stessi campi.
function toItem(kind, data, url, ext, date, srcImgDir) {
  const featured = data.featured === true || data.featured === "true";
  const order = typeof data.order === "number" ? data.order : Infinity;
  let image = data.image || (kind === "post" ? data.cover : null) || null;
  if (image && !/^https?:/.test(image) && !fs.existsSync(path.join(srcImgDir, "..", image))) image = null; // foto non presente: niente foto, il disegno regge
  return {
    kind,
    title: data.title,
    short: data.short || "",
    plate: data.plate || "",
    url,
    ext,
    floor: data.floor || (kind === "post" ? "writing" : kind === "gallery" ? "photography" : "projects"),
    featured,
    order,
    time: date ? +date : 0,
    date: date || null,
    image,
    alt: data.image_alt || data.title,
    lang: data.lang || "",
    tag: data.tag || "",
    desc: kind === "gallery" ? "" : cut(data.house_description || data.description || "", 150), // le descrizioni delle gallerie sono testi per Google: non si mostrano
    focus: data.focus || "",
  };
}

function rank(list) {
  return list.slice().sort(
    (a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
      (a.order === b.order ? 0 : a.order < b.order ? -1 : 1) ||
      b.time - a.time ||
      a.title.localeCompare(b.title)
  );
}


// ---------------------------------------------------------------- targhette del pannello forato
const plateLabel = (it) => (it.plate || shortName(it)).toUpperCase();

// computer: si dispongono a righe, finche' ci stanno (al massimo 2 righe, 5 targhette)
function layPlates(items) {
  const plates = [];
  const rows = [
    { y: 656, jit: [0, 8, -2, 4], x0: 100 },
    { y: 698, jit: [0, 4, 0, 4], x0: 112 },
  ];
  const maxX = 306;
  let r = 0;
  let x = rows[0].x0;
  let k = 0;
  for (const it of items) {
    if (plates.length >= 5) break;
    const label = plateLabel(it);
    const w = Math.min(96, Math.max(40, Math.round(label.length * 4.4 + 12)));
    if (x + w > maxX) {
      r++;
      if (r >= rows.length) break;
      x = rows[r].x0;
      k = 0;
    }
    plates.push({ item: it, label, x, y: rows[r].y + rows[r].jit[k % rows[r].jit.length], w, h: 16 });
    x += w + 14;
    k++;
  }
  return plates;
}

// telefono: stesse targhette, ingrandite (scritta da 12 px circa), due per riga, tre righe
const PH_COLS = [96, 218];
const PH_ROWS = [650, 678, 706];
function layPlatesPhone(items) {
  return items.map((it, i) => {
    let label = plateLabel(it);
    if (label.length > 10) label = label.slice(0, 9).trim() + "…";
    return { item: it, label, x: PH_COLS[i % 2], y: PH_ROWS[Math.floor(i / 2)], w: 116, h: 24 };
  });
}

function slug(it) {
  return String(it.url).replace(/^\/+/, "").replace(/[^a-z0-9-]+/gi, "-") || "home";
}

function build(items) {
  const floors = [];
  let n = 1;
  for (const meta of FLOORS) {
    const mine = items.filter((i) => i.floor === meta.key);
    const ranked = rank(mine);
    const cap = CAPACITY[meta.key];
    const shown = ranked.slice(0, cap).map((it, i) => ({ ...it, slot: i, n: n++, dev: meta.key === "photography" ? slug(it) : "" }));
    const rest = ranked.slice(cap);
    let plates = [];
    let platesPhone = [];
    let pegN = null;
    if (meta.key === "workshop" && rest.length) {
      plates = layPlates(rest);
      platesPhone = layPlatesPhone(plates.map((p) => p.item));
      pegN = n++;
    }
    // elenco completo per la pagina del piano
    const all = meta.sort === "order" ? ranked : mine.slice().sort((a, b) => b.time - a.time || a.title.localeCompare(b.title));
    floors.push({
      ...meta,
      items: all,
      count: ranked.length,
      shown,
      plates,
      platesPhone,
      pegN,
      pegItems: plates.map((p) => ({ title: p.item.short || shortName(p.item), url: p.item.url, ext: p.item.ext })),
      more: rest.length - plates.length,
    });
  }
  return { floors, byKey: Object.fromEntries(floors.map((f) => [f.key, f])), total: n - 1 };
}

// ---------------------------------------------------------------- oggetti sopra il disegno
// Elenco neutro di "cose da mettere nel disegno" (foto, targhette, numeri, scritte), con le coordinate del viewBox.
// Ogni vista (computer, copertina, piano da telefono) lo disegna a modo suo.
const ROOM_LABELS = { projects: [100, 168], writing: [164, 590], workshop: [112, 842], photography: [226, 1108] };

function placements(house, phone) {
  const F = house.byKey;
  const out = [];
  for (const it of F.projects.shown) {
    const s = GREEN[it.slot];
    out.push({ floor: "projects", t: it.image ? "img" : "paper", cls: "shot", box: s, it, focus: "0 0" });
    out.push({ floor: "projects", t: "num", x: s.nx, y: s.ny, it });
  }
  for (const it of F.writing.shown) {
    const f = STUDY[it.slot];
    out.push({ floor: "writing", t: it.image ? "img" : "blank", box: { x: f.x + 4, y: f.y + 4, w: f.w - 8, h: f.h - 8 }, it });
    out.push({ floor: "writing", t: "num", x: f.nx, y: f.ny, it });
  }
  for (const it of F.workshop.shown) {
    const s = BENCH[it.slot];
    out.push({ floor: "workshop", t: it.image ? "img" : "blank", box: s, it });
    out.push({ floor: "workshop", t: "num", x: s.nx, y: s.ny, it });
  }
  for (const p of phone ? F.workshop.platesPhone : F.workshop.plates) out.push({ floor: "workshop", t: "plate", box: p, label: p.label, it: p.item });
  if (F.workshop.pegN) {
    const pn = phone ? PEG_NUMBER_PHONE : PEG_NUMBER;
    out.push({ floor: "workshop", t: "num", x: pn.nx, y: pn.ny, it: { n: F.workshop.pegN, url: F.workshop.url, title: "" } });
  }
  for (const it of F.photography.shown) {
    const m = LINE[it.slot];
    out.push({ floor: "photography", t: it.image ? "print" : "blank", box: { x: m.x + 3, y: m.y + 3, w: m.w - 6, h: m.h - 6 }, it });
    out.push({ floor: "photography", t: "num", x: m.nx, y: m.ny, it, dark: true });
  }
  out.push({ floor: "photography", t: "wash", box: { x: 70, y: 930, w: 460, h: 70 } });
  return out;
}

const imgTag = (it, sizes, alt, focus) =>
  `<img src="${esc(it.image)}" alt="${esc(alt)}" sizes="${sizes}" loading="lazy"${focus || it.focus ? ` style="object-position:${esc(focus || it.focus)}"` : ""}>`;

// mode: "desk" (computer), "cover" (copertina: solo decorazione, i link sono le fasce), "floor" (un piano da telefono)
function layer(house, mode, only) {
  const v = VIEW[mode === "floor" ? only : mode];
  const list = placements(house, mode === "floor").filter((p) => !only || p.floor === only);
  const sizes = mode === "cover" ? "40px" : mode === "floor" ? "160px" : "120px";
  const html = [];
  for (const p of list) {
    const it = p.it;
    if (p.t === "wash") {
      html.push(`<div class="wash" style="${boxIn(v, p.box)}"></div>`);
    } else if (mode === "cover") {
      if (p.t === "img" || p.t === "print") {
        const dev = p.t === "print" ? ` data-dev="${esc(it.dev)}"` : "";
        html.push(`<span class="obj${p.t === "print" ? " print deco" : ""}"${dev} style="${boxIn(v, p.box)}">${imgTag(it, sizes, "", p.focus)}</span>`);
      } else if (p.t === "paper") {
        html.push(`<span class="obj paper" style="${boxIn(v, p.box)}"><span>${esc(it.tag || "")}</span></span>`);
      } else if (p.t === "plate") {
        html.push(`<span class="plate" style="${boxIn(v, p.box)}"></span>`);
      }
    } else if (p.t === "num") {
      html.push(
        `<a class="n${p.dark ? " dark" : ""}" href="${esc(it.url)}" style="${pinIn(v, p.x, p.y)}" tabindex="-1" aria-hidden="true"${it.dev ? ` data-dev-for="${esc(it.dev)}"` : ""}><span>${it.n}</span></a>`
      );
    } else if (p.t === "img" || p.t === "print") {
      const dev = p.t === "print" ? ` data-dev="${esc(it.dev)}"` : "";
      html.push(`<a class="obj${p.cls ? " " + p.cls : ""}${p.t === "print" ? " print" : ""}" href="${esc(it.url)}"${dev} style="${boxIn(v, p.box)}">${imgTag(it, sizes, it.alt, p.focus)}</a>`);
    } else if (p.t === "paper") {
      html.push(`<a class="obj paper" href="${esc(it.url)}" style="${boxIn(v, p.box)}"><span>${esc(it.tag || "")}</span><span class="sr-only">${esc(it.title)}</span></a>`);
    } else if (p.t === "blank") {
      html.push(`<a class="obj blank" href="${esc(it.url)}" style="${boxIn(v, p.box)}"><span class="sr-only">${esc(it.title)}</span></a>`);
    } else if (p.t === "plate") {
      html.push(`<a class="plate" href="${esc(it.url)}" style="${boxIn(v, p.box)}" title="${esc(it.title)}"><span aria-hidden="true">${esc(p.label)}</span><span class="sr-only">${esc(it.title)}</span></a>`);
    }
  }
  if (mode === "floor") {
    const [lx, ly] = ROOM_LABELS[only];
    const meta = house.byKey[only];
    html.push(`<span class="rlabel${only === "photography" ? " dark" : ""}" style="${pinIn(v, lx, ly)}" aria-hidden="true">${esc(meta.room.toUpperCase())}</span>`);
  }
  return html.join("\n");
}

// ---------------------------------------------------------------- il disegno fisso, definito una volta sola
function staticParts(house) {
  const F = house.byKey;
  let studyFrames = "";
  for (const it of F.writing.shown) {
    const f = STUDY[it.slot];
    studyFrames += `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}"/>`;
    if (!it.image) studyFrames += `<rect x="${f.x + 4}" y="${f.y + 4}" width="${f.w - 8}" height="${f.h - 8}" fill="url(#hatch)" stroke="none"/>`;
  }
  let darkMats = "";
  for (const it of F.photography.shown) {
    const m = LINE[it.slot];
    darkMats += `<rect x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" fill="#fff"/>`;
  }
  const pegs = F.photography.shown.map((it) => `<rect x="${LINE[it.slot].peg[0]}" y="${LINE[it.slot].peg[1]}" width="5" height="9"/>`).join("");
  const levels = Object.fromEntries(house.floors.map((f) => [f.key, f.level]));
  return { studyFrames, darkMats, pegs, levels, peg: PEG_BOARD };
}

// SVG nascosto con il disegno e le scritte delle stanze: le tre viste lo richiamano con <use>
function defs(house) {
  const F = house.byKey;
  const t = (key, extra) => {
    const [x, y] = ROOM_LABELS[key];
    return `<text x="${x}" y="${y - 14}" font-size="9" font-family="Overpass Mono, monospace" ${extra.note}>${esc(F[key].roomNote)}</text>` +
      `<text x="${x}" y="${y}" font-size="15" font-weight="600" letter-spacing="2.4" ${extra.name}>${esc(F[key].room.toUpperCase())}</text>`;
  };
  const labels = [
    t("projects", { note: 'class="mu"', name: 'fill="#1a1a1a"' }),
    t("writing", { note: 'class="mu"', name: 'fill="#1a1a1a"' }),
    t("workshop", { note: 'class="mu"', name: 'fill="#1a1a1a"' }),
    t("photography", { note: 'fill="#d48b7c"', name: 'fill="#e5705b"' }),
  ].join("");
  return `<svg class="art-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
${art.artDefs()}
<defs><g id="house-art">
${art.artBody(staticParts(house))}
</g><g id="house-labels">${labels}</g></defs>
</svg>`;
}

const useSvg = (cls, v, labels) =>
  `<svg class="${cls}" viewBox="${v.vx} ${v.vy} ${v.vw} ${v.vh}" xmlns="http://www.w3.org/2000/svg" font-family="Jost, sans-serif" aria-hidden="true" focusable="false"><use href="#house-art"></use>${labels ? '<use href="#house-labels"></use>' : ""}</svg>`;

// computer: la sezione intera
function drawing(house) {
  return `<div class="draw-wrap">
${useSvg("draw-svg", VIEW.desk, true)}
<div class="objs">
${layer(house, "desk")}
</div>
</div>`;
}

// telefono: la copertina. Le fasce stanno tra le quote dei solai (unita' del viewBox).
const BANDS = { projects: [82, 300], writing: [300, 600], workshop: [600, 880], photography: [880, 1120] };
function cover(house) {
  const bands = house.floors
    .map((f) => {
      const [a, b] = BANDS[f.key];
      return `<a class="band k-${f.key}" href="#floor-${f.key}" style="top:calc(var(--h)*${(a / 1200).toFixed(4)});height:calc(var(--h)*${((b - a) / 1200).toFixed(4)})"><span class="lab"><span class="lv">▽ ${esc(f.level)}</span><b>${esc(f.name)}</b><span class="note">${esc(f.bandNote || f.room.toLowerCase())}</span></span><span class="go" aria-hidden="true">›</span></a>`;
    })
    .join("\n");
  return `<div class="house">
<div class="house-art">
${useSvg("art-svg", VIEW.cover, true)}
<div class="objs" aria-hidden="true">
${layer(house, "cover")}
</div>
</div>
${bands}
</div>`;
}

// telefono: un piano ingrandito
function floor(house, key) {
  const v = VIEW[key];
  return `<div class="fwrap" style="aspect-ratio:${v.vw} / ${v.vh}">
${useSvg("art-svg", v, false)}
<div class="objs">
${layer(house, "floor", key)}
</div>
</div>`;
}

// le stampe gia' sviluppate nelle visite precedenti: va messo DOPO tutte le stampe della pagina, prima che il browser le disegni
function remember() {
  return `<script>(function(){try{var d=JSON.parse(localStorage.getItem("dc-developed"))||[];[].forEach.call(document.querySelectorAll("[data-dev]"),function(e){if(d.indexOf(e.getAttribute("data-dev"))>-1)e.classList.add("developed","instant")})}catch(e){}})()</script>`;
}

module.exports = { build, drawing, cover, floor, defs, remember, toItem, rank, shortName, CAPACITY, FLOORS };
