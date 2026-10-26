# ybn.no

Personal software projects by Yngve Bakken-Nilsen, from 2013 to now. Live at [ybn.no](https://ybn.no/).

## Editing

All content lives in `content/projects.json`, one entry per project. The page groups entries by `year`, newest first, and shows the year in the accent colour when any project in it is `"state": "Still running"`.

| Field | Required | Notes |
| --- | --- | --- |
| `id` | ✅ | Unique, `a-z0-9-`. Doubles as a fragment link, e.g. `https://ybn.no/#notequest`. |
| `year` | ✅ | The year the project started. |
| `title`, `lead` | ✅ | `lang` sets the title's language when it isn't English. |
| `kind`, `state`, `subtitle` | | Shown above and below the title. `state` is free text; only `Still running` is highlighted. |
| `paragraphs` | | Extra body text, shown under the lead. |
| `story` | | `{ summary, paragraphs }`, rendered as a fold-out. |
| `chain` | | A short list of parts, rendered as boxes; the last box is filled. |
| `history` | | Commit evidence with times, links and a two-line diff (used by the 2021 trip website). |
| `screenshot` | | `{ file, shape: "wide" \| "phone", alt }`. The file goes in `src/screens/`. A missing file renders no figure. |
| `related` | | `{ id, label, text }`, linking to another project on the page. |
| `link` | | `{ label, url }`. HTTPS only. |

Edit the content, the template in `scripts/build.mjs` or the styles in `src/styles.css`. Then, with Node.js 22 or later:

```sh
npm run build
npm run check
```

There are no npm dependencies to install. Commit the generated `index.html` alongside source changes. It contains the styles, fonts and screenshots, needs no JavaScript and makes no external requests. Keep screenshots as WebP under about 100 kB each; the tests keep the whole page below 250 kB.

Preview locally with any static server, for example `python3 -m http.server 8080`.

## Deployment

The nginx base image, port 80 and health check are unchanged. The Dockerfile copies `index.html` and `og.png`. The existing Coolify/GitHub integration deploys the committed artifacts. No Node runtime, build service, database, authentication, analytics or external font requests are needed in production.

```sh
docker build -t ybn-no .
docker run --rm -p 8080:80 ybn-no
```

## Editorial boundaries

The 2021 trip website entry quotes two public commits. Their times are recorded commit times, not evidence of live deployment timing, and the diff comes from the public repository.

NoteQuest's role split comes from the author's account. No name, age, private repository links, private source snippets or operational data are published. The SendToChrome entry describes the verified historical flow.

Related links point at comparable projects; they don't claim one influenced the other. The agent-session dashboard links to its public repository; the EventMapper implementation stays private.

Don't add private activity feeds or publish source material automatically. Use only public-safe descriptions and cleared references. See `docs/copy-style.md` for the writing rules.

## Social image

`og.png` is the committed 1200 × 630 preview served at `/og.png`. Its source is `src/social-preview.html`. To change it, edit that file and run:

```sh
node scripts/render-social.mjs
npm run check
```

The renderer needs Playwright and Chromium in your authoring environment. `PLAYWRIGHT_MODULE` can point at an existing module URL; `CHROME_BIN` can select a browser executable. Neither is needed by the normal build or deployment. Commit the regenerated PNG.

## Typography

Schibsted Grotesk (variable, 400–900) and IBM Plex Mono (400, 500) are embedded from the local WOFF2 files in `src/fonts/`, Latin subset, via Fontsource. Their SIL Open Font License notices are next to them. No font request leaves the visitor's browser.
