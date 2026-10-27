// Il disegno fisso della casa (layout/G-sezione.html), senza foto, numeri e scritte delle stanze:
// quelli sono HTML sopra il disegno (vedi house.js). Colori del fondo, del pannello forato e dei testi
// grigi sono classi CSS (.pp .pg) che leggono le variabili --paper e --peg: si cambiano in house.css.
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function artBody(p) {
  return `  <!-- earth around the basement -->
  <rect x="8" y="880" width="42" height="290" fill="url(#earth)"/>
  <rect x="550" y="880" width="42" height="290" fill="url(#earth)"/>
  <line x1="0" y1="880" x2="50" y2="880" stroke="#1a1a1a" stroke-width="2"/>
  <line x1="550" y1="880" x2="640" y2="880" stroke="#1a1a1a" stroke-width="2"/>

  <!-- BASEMENT: darkroom -->
  <rect x="70" y="900" width="460" height="220" fill="#24100e"/>
  <g clip-path="url(#dark)">
    <polygon points="292,914 308,914 470,1120 130,1120" fill="#c8321e" opacity=".22"/>
    <path d="M84 934 Q 280 948 476 934" stroke="#e9b3a8" stroke-width="1" fill="none"/>
    ${p.darkMats}
    <g fill="#e9b3a8">${p.pegs}</g>
    <g stroke="#e9b3a8" stroke-width="1.3" fill="none">
      <line x1="96" y1="1060" x2="96" y2="1000"/><rect x="92" y="1000" width="40" height="22"/><path d="M104 1022 v10 h16 v-10"/>
      <rect x="80" y="1060" width="130" height="6"/><line x1="86" y1="1066" x2="86" y2="1120"/><line x1="204" y1="1066" x2="204" y2="1120"/>
    </g>
    <g stroke="#e9b3a8" stroke-width="1.3" fill="none">
      <rect x="262" y="1060" width="208" height="8"/><line x1="268" y1="1068" x2="268" y2="1120"/><line x1="464" y1="1068" x2="464" y2="1120"/>
      <rect x="272" y="1052" width="56" height="8"/><rect x="338" y="1052" width="56" height="8"/><rect x="404" y="1052" width="56" height="8"/>
      <path d="M456 1052 v-26 h-14 v8"/>
    </g>
    <rect x="294" y="904" width="12" height="10" fill="#e5462e"/>
  </g>

  <!-- GROUND: workshop -->
  <rect x="${p.peg.x}" y="${p.peg.y}" width="${p.peg.w}" height="${p.peg.h}" fill="url(#peg)" stroke="#1a1a1a" stroke-width="1"/>
  <line x1="400" y1="618" x2="400" y2="716" stroke="#1a1a1a"/><path d="M386 728 L400 714 L414 728 Z" fill="none" stroke="#1a1a1a"/>
  <g stroke="#1a1a1a" stroke-width="1.3" fill="none">
    <rect x="90" y="800" width="370" height="8" class="pp"/><line x1="98" y1="808" x2="98" y2="880"/><line x1="452" y1="808" x2="452" y2="880"/><line x1="98" y1="850" x2="452" y2="850"/>
  </g>

  <!-- PIANO NOBILE: study -->
  <g stroke="#1a1a1a" stroke-width="1" fill="none">
    <rect x="80" y="334" width="70" height="262"/>
    <line x1="80" y1="376" x2="150" y2="376"/><line x1="80" y1="420" x2="150" y2="420"/><line x1="80" y1="464" x2="150" y2="464"/><line x1="80" y1="508" x2="150" y2="508"/><line x1="80" y1="552" x2="150" y2="552"/>
  </g>
  <g stroke="#1a1a1a" stroke-width="2.2">
    <path d="M85 376v-30M90 376v-26M95 376v-34M100 376v-28M106 376v-22M111 376v-32M117 376v-30M123 376v-24M129 376v-34M135 376v-27M141 376v-31M146 376v-23"/>
    <path d="M85 420v-28M91 420v-34M97 420v-30M103 420v-25M109 420v-33M115 420v-29M122 420v-35M128 420v-24M134 420v-31M140 420v-27M146 420v-33"/>
    <path d="M85 464v-33M90 464v-25M96 464v-31M102 464v-35M108 464v-27M114 464v-30M120 464v-24M126 464v-33M132 464v-29M139 464v-34M145 464v-26"/>
    <path d="M85 508v-26M91 508v-32M97 508v-29M104 508v-35M110 508v-24M116 508v-31M122 508v-28M128 508v-34M134 508v-25M141 508v-30M146 508v-33"/>
    <path d="M85 552v-31M91 552v-27M97 552v-34M103 552v-25M110 552v-30M116 552v-33M122 552v-26M129 552v-32M135 552v-28M141 552v-35"/>
    <path d="M85 596v-30M91 596v-34M98 596v-27M104 596v-32M110 596v-25M117 596v-33M123 596v-29M130 596v-35M136 596v-26M142 596v-31"/>
  </g>
  <g stroke="#1a1a1a" stroke-width="1" class="pp">${p.studyFrames}</g>
  <g stroke="#1a1a1a" stroke-width="1.3" fill="none">
    <rect x="262" y="560" width="190" height="7" class="pp"/><line x1="270" y1="567" x2="270" y2="600"/><line x1="444" y1="567" x2="444" y2="600"/>
    <path d="M420 560 l-10 -26 h-14"/><path d="M392 530 h20 l-4 -8 h-12 z"/>
  </g>

  <!-- ROOF: greenhouse -->
  <g stroke="#1a1a1a" stroke-width="1.4" fill="none">
    <path d="M84 300 V176 L300 82 L516 176 V300"/>
    <path d="M84 176 H516" stroke-width=".8"/>
    <path d="M126 300V158 M168 300V140 M210 300V121 M252 300V103 M300 300V82 M348 300V103 M390 300V121 M432 300V140 M474 300V158" stroke-width=".6"/>
    <rect x="100" y="252" width="372" height="6" class="pp"/><line x1="108" y1="258" x2="108" y2="300"/><line x1="464" y1="258" x2="464" y2="300"/>
  </g>
  <g stroke="#1a1a1a" stroke-width="1" fill="none">
    <rect x="110" y="242" width="50" height="10"/><rect x="170" y="242" width="50" height="10"/><rect x="230" y="242" width="50" height="10"/>
    <rect x="290" y="242" width="50" height="10"/><rect x="350" y="242" width="50" height="10"/><rect x="410" y="242" width="50" height="10"/>
    <path d="M135 242 V186 M135 222 q-14 -6 -18 -18 M135 206 q14 -6 18 -18 M135 194 q-10 -4 -12 -12"/>
    <path d="M195 242 V196 M195 226 q-12 -6 -16 -16 M195 208 q12 -6 16 -16"/>
    <path d="M255 242 V204 M255 228 q12 -6 16 -16 M255 214 q-12 -4 -14 -14"/>
    <path d="M315 242 V218 M315 232 q10 -4 12 -12"/>
    <path d="M375 242 V200 M375 230 q-12 -6 -14 -14 M375 214 q12 -4 14 -14"/>
    <path d="M435 242 V208 M435 230 q10 -6 12 -14 M435 218 q-10 -4 -12 -12"/>
  </g>
  <g stroke="#1a1a1a" stroke-width=".8">
    <line x1="148" y1="242" x2="148" y2="226"/><line x1="208" y1="242" x2="208" y2="226"/><line x1="268" y1="242" x2="268" y2="226"/>
    <line x1="328" y1="242" x2="328" y2="226"/><line x1="388" y1="242" x2="388" y2="226"/><line x1="448" y1="242" x2="448" y2="226"/>
  </g>
  <rect x="94" y="140" width="150" height="34" class="pp"/>

  <!-- CUT ELEMENTS: walls and slabs (hatched) -->
  <g fill="url(#hatch)" stroke="#1a1a1a" stroke-width="1.4">
    <rect x="50" y="270" width="20" height="100"/><rect x="50" y="530" width="20" height="610"/>
    <rect x="530" y="270" width="20" height="390"/><rect x="530" y="820" width="20" height="320"/>
    <rect x="70" y="300" width="408" height="18"/><rect x="526" y="300" width="4" height="18"/>
    <rect x="70" y="600" width="408" height="18"/><rect x="526" y="600" width="4" height="18"/>
    <rect x="70" y="880" width="408" height="20"/><rect x="526" y="880" width="4" height="20"/>
    <rect x="40" y="1120" width="520" height="22"/>
  </g>
  <g stroke="#1a1a1a" stroke-width=".9">
    <line x1="50" y1="370" x2="50" y2="530"/><line x1="70" y1="370" x2="70" y2="530"/><line x1="58" y1="370" x2="58" y2="530"/><line x1="62" y1="370" x2="62" y2="530"/>
    <line x1="530" y1="660" x2="530" y2="820"/><line x1="550" y1="660" x2="550" y2="820"/><line x1="538" y1="660" x2="538" y2="820"/><line x1="542" y1="660" x2="542" y2="820"/>
  </g>
  <!-- spiral stair -->
  <g stroke="#1a1a1a" stroke-width="1">
    <line x1="502" y1="300" x2="502" y2="1120" stroke-width="1.6"/>
    <path d="M482 318h20M502 336h20M482 354h20M502 372h20M482 390h20M502 408h20M482 426h20M502 444h20M482 462h20M502 480h20M482 498h20M502 516h20M482 534h20M502 552h20M482 570h20M502 588h20"/>
    <path d="M482 636h20M502 654h20M482 672h20M502 690h20M482 708h20M502 726h20M482 744h20M502 762h20M482 780h20M502 798h20M482 816h20M502 834h20M482 852h20M502 870h20"/>
  </g>
  <g stroke="#e9b3a8" stroke-width="1"><path d="M482 918h20M502 936h20M482 954h20M502 972h20M482 990h20M502 1008h20M482 1026h20M502 1044h20M482 1062h20M502 1080h20M482 1098h20"/></g>

  <!-- dimensions -->
  <g stroke="#1a1a1a" stroke-width=".8" font-family="Overpass Mono, monospace" font-size="9" fill="#1a1a1a">
    <line x1="28" y1="300" x2="28" y2="1120"/>
    <path d="M23 305l10 -10M23 605l10 -10M23 885l10 -10M23 1125l10 -10"/>
    <line x1="22" y1="300" x2="44" y2="300"/><line x1="22" y1="600" x2="44" y2="600"/><line x1="22" y1="880" x2="44" y2="880"/><line x1="22" y1="1120" x2="44" y2="1120"/>
    <text x="20" y="450" transform="rotate(-90 20 450)" text-anchor="middle" stroke="none">4.50</text>
    <text x="20" y="740" transform="rotate(-90 20 740)" text-anchor="middle" stroke="none">4.20</text>
    <text x="20" y="1000" transform="rotate(-90 20 1000)" text-anchor="middle" stroke="none">3.60</text>
  </g>
  <g font-family="Overpass Mono, monospace" font-size="9.5" fill="#1a1a1a" stroke="#1a1a1a" stroke-width=".8">
    <path d="M560 82h20M566 76l6 6l6 -6z" fill="none"/><text x="584" y="85" stroke="none">+11.85</text>
    <path d="M560 300h20M566 294l6 6l6 -6z" fill="none"/><text x="584" y="303" stroke="none">${esc(p.levels.projects)}</text>
    <path d="M560 600h20M566 594l6 6l6 -6z" fill="none"/><text x="584" y="603" stroke="none">${esc(p.levels.writing)}</text>
    <path d="M600 880h20M606 874l6 6l6 -6z" fill="none"/><text x="604" y="896" stroke="none">${esc(p.levels.workshop)}</text>
    <path d="M560 1120h20M566 1114l6 6l6 -6z" fill="none"/><text x="584" y="1123" stroke="none">${esc(p.levels.photography)}</text>
  </g>
  <!-- scale bar -->
  <g font-family="Overpass Mono, monospace" font-size="8.5" fill="#1a1a1a">
    <rect x="70" y="1172" width="66.7" height="6" fill="#1a1a1a"/><rect x="136.7" y="1172" width="66.7" height="6" class="pp" stroke="#1a1a1a" stroke-width=".8"/>
    <rect x="203.4" y="1172" width="66.7" height="6" fill="#1a1a1a"/><rect x="270.1" y="1172" width="66.7" height="6" class="pp" stroke="#1a1a1a" stroke-width=".8"/>
    <rect x="336.8" y="1172" width="66.7" height="6" fill="#1a1a1a"/>
    <text x="68" y="1192">0</text><text x="134" y="1192">1</text><text x="201" y="1192">2</text><text x="268" y="1192">3</text><text x="334" y="1192">4</text><text x="398" y="1192">5 m</text>
    <text x="560" y="1192" text-anchor="end">A–A</text>
  </g>`;
}

function artDefs() {
  return `  <defs>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="pp"/><line x1="0" y1="0" x2="0" y2="6" stroke="#1a1a1a" stroke-width="1.1"/></pattern>
    <pattern id="earth" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" class="pp"/><circle cx="2" cy="2" r=".8" fill="#1a1a1a"/><circle cx="6.5" cy="6" r=".6" fill="#1a1a1a"/></pattern>
    <pattern id="peg" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" class="pg"/><circle cx="5" cy="5" r="1" fill="#1a1a1a"/></pattern>
    <clipPath id="dark"><rect x="70" y="900" width="460" height="220"/></clipPath>
  </defs>`;
}

module.exports = { artBody, artDefs };
