// Differenze tra le destinazioni di pubblicazione. Le decide il workflow (variabili del repo
// PATH_PREFIX e MOCKUP), non il codice: sul sito restano vuote e non cambia nulla.
//   sito       PATH_PREFIX vuoto  -> indirizzi alla radice, `mockup` come in site.json
//   laboratorio PATH_PREFIX="/lab/", MOCKUP="true" -> indirizzi sotto /lab/, sempre noindex e senza Analytics
const site = require("./site.json");

function normalizePrefix(p) {
  p = String(p || "").trim();
  if (!p || p === "/") return "/";
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.endsWith("/")) p += "/";
  return p;
}

const prefix = normalizePrefix(process.env.PATH_PREFIX);
const lab = prefix !== "/";
const mockupEnv = String(process.env.MOCKUP || "").trim().toLowerCase();
// con un prefisso (cioe' nel laboratorio) la modalita' prova e' sempre accesa, qualunque cosa dica site.json
const mockup = lab || (mockupEnv ? mockupEnv === "true" : !!site.mockup);

module.exports = {
  prefix,                                   // "/" oppure "/lab/"
  lab,                                      // true solo nel laboratorio
  mockup,                                   // noindex + niente Analytics
  origin: (mockup ? site.mock_url : site.url) + (lab ? prefix.slice(0, -1) : ""), // per sitemap, feed, robots, og:image
};
