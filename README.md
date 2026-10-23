# davidecaniatti.com

Sito di Davide Caniatti. Generato con [Eleventy](https://www.11ty.dev/), pubblicato su GitHub Pages dall'azione `.github/workflows/pages.yml` a ogni modifica del ramo `main`.

## Dove sta cosa

| Cosa | Dove |
|---|---|
| Articoli | `src/posts/*.md` (Markdown + frontmatter) |
| Gallerie del portfolio | `src/galleries/*.md` (la lista `gallery:` nel frontmatter) |
| Home, About me, Index | `src/pages/` |
| Foto (2500 px di lato lungo) | `src/img/` (le versioni piccole si generano da sole alla pubblicazione) |
| Impostazioni (menu, social, **modalità prova**) | `src/_data/site.json` |
| Grafica | `src/assets/css/site.css`, `src/assets/js/site.js`, `src/_includes/` |
| Pannello per scrivere | `.pages.yml` ([Pages CMS](https://pagescms.org)) |

Gli indirizzi sono decisi dal campo `permalink` di ogni file: GitHub Pages serve `percorso/nome.html` all'indirizzo `/percorso/nome`, senza `.html`. Gli indirizzi già pubblicati non si cambiano.

## Modalità prova

`src/_data/site.json` contiene `"mockup": true`. Con l'interruttore acceso tutte le pagine hanno `noindex, nofollow` e Google Analytics non parte mai. Con `"mockup": false` Analytics parte solo dopo che il visitatore preme "Accetta" nel banner.

## In locale

```
npm ci
npm start      # http://localhost:8080
```

Per provare come il laboratorio: `PATH_PREFIX=/lab/ MOCKUP=true npm start` (http://localhost:8080/lab/). In Git Bash su Windows aggiungere `MSYS_NO_PATHCONV=1` davanti, o `/lab/` diventa un percorso di Windows.

In un articolo, una **galleria** è un elenco puntato di sole immagini; una **didascalia** è una riga in corsivo subito sotto un'immagine.

## Sito e laboratorio

Due repo, **un solo codice** (stessa storia git):

| | Repo | Indirizzo | Per cosa |
|---|---|---|---|
| **laboratorio** | `AndreottiVIII/lab` (cartella `lab/`) | https://andreottiviii.github.io/lab/ | dove si prova: sempre `noindex`, senza Analytics, con l'etichetta "LAB" in alto |
| **sito** | `AndreottiVIII/andreottiviii.github.io` (cartella `site/`) | https://andreottiviii.github.io | la copia 1:1 pronta per il cambio di dominio: riceve solo ciò che è approvato |

Le differenze non stanno nel codice ma nella pubblicazione: il workflow legge le *variabili del repo* `PATH_PREFIX` e `MOCKUP` (Settings > Secrets and variables > Actions > Variables).
Sul sito sono vuote: indirizzi alla radice e `mockup` come in `src/_data/site.json`. Nel laboratorio sono `/lab/` e `true`: Eleventy mette il prefisso a link, immagini, CSS, JS, sitemap e feed, e la modalità prova è sempre accesa. La logica sta in `src/_data/build.js` e in fondo a `eleventy.config.js`.

**Pages CMS solo sul sito.** Il laboratorio non ha `.pages.yml`: i contenuti nascono sul sito.

Le due cartelle hanno i due repo come remote: in `site/` il laboratorio si chiama `lab`, in `lab/` il sito si chiama `site`.

### Dal sito al laboratorio (contenuti: articoli, foto, impostazioni)

```
cd lab
git pull
git fetch site
git merge site/main
git push
```

Se il sito ha cambiato `.pages.yml`, il merge si ferma con un conflitto su quel file: `git rm .pages.yml`, poi `git commit`.

### Dal laboratorio al sito (solo ciò che Davide approva)

```
cd site
git pull
git fetch lab
git merge --no-commit --no-ff lab/main
git checkout HEAD -- .pages.yml
git commit -m "Dal laboratorio: ..."
git push
```

La riga con `.pages.yml` impedisce che il merge tolga il pannello al sito. Per portare solo alcune modifiche invece di tutto: `git cherry-pick <commit>`.

### Prima di pubblicare

Si guarda il laboratorio. Per il sito il controllo è automatico: la rete di sicurezza (qui sotto) ferma la pubblicazione se manca un indirizzo vecchio.
`tools/check_site.py` (nella cartella di lavoro, fuori dai repo) misura il sito pubblicato: `python check_site.py https://andreottiviii.github.io/lab` oppure senza argomento per il sito.

## Rete di sicurezza

Dopo la build, il workflow lancia `node scripts/check-urls.mjs`. Lo script ha dentro l'elenco fisso dei 142 indirizzi della sitemap di Squarespace, più `/work` e la home, e verifica che in `_site` esista il file che GitHub Pages servirà per ognuno. Controlla anche che `<title>` e meta description non siano vuoti (la description può mancare solo dove mancava già sul vecchio sito: tag, categorie e 4 articoli). Se manca anche un solo indirizzo il lavoro fallisce **prima** del deploy e il sito online resta com'era.

In locale, dopo `npx eleventy`: `node scripts/check-urls.mjs`. Su Windows segnala `/post/tag/Medium+format`, perché lì i due tag che differiscono solo per le maiuscole si sovrappongono: su GitHub Actions (Linux) non succede e fa fede quello.

Gli indirizzi vecchi non si tolgono né si rinominano. Se un giorno uno deve sparire davvero, si toglie dall'elenco nello script, di proposito e in un commit a parte.
