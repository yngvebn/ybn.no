# YBN / LAB

A personal digital workshop. Live at [ybn.no](https://ybn.no/).

## Editing

The content lives in three small JSON files:

- `content/exhibits.json` — exhibits, state, project notes, public links and explained connections. Leave `related` empty when there is no useful connection.
- `content/notes.json` — short field notes.
- `content/bench.json` — brief descriptions of other experiments.

Edit the content, layout in `scripts/build.mjs`, styles in `src/styles.css`, or browser interactions in `src/interactions.js`. Then, with Node.js 22 or later:

```sh
npm run build
npm run check
```

There are no npm dependencies to install. Commit the generated `index.html` alongside source changes. It includes the styles, script, original SVG diagrams and locally stored fonts, and works without external asset services. All stories and the public commit excerpt remain readable without JavaScript. JavaScript adds the oracle recreation, array inspector and automatic opening of connected notes.

To add an exhibit, give it a unique ID, the existing content fields and related IDs. New exhibits get a text-based specimen surface unless a custom illustration is added to the build template. Exhibit IDs double as shareable fragment links, for example `https://ybn.no/#notequest`. The first item in `notes.json` is the featured field note in v0.1.

Preview locally with any static server, for example `python3 -m http.server 8080`.

## Deployment

The original nginx base image, port 80 and health check are preserved. The Dockerfile copies `index.html` and, since v0.2, `og.png` for social sharing. The existing Coolify/GitHub integration deploys the committed artifacts. No Node runtime, build service, database, authentication, analytics or external font requests are required in production.

```sh
docker build -t ybn-lab .
docker run --rm -p 8080:80 ybn-lab
```

## Editorial boundaries

The trip oracle is explicitly a historical recreation. Its seven negative answers are cycled to make them discoverable; the original chose randomly. The old shortened outbound link is shown only as text. The two October 2021 commits are linked in the specimen notes.

The array inspector demonstrates the code between the response change at 14:35:56 UTC and the index fix at 14:37:05 UTC on 27 October 2021. Those are recorded commit times, not evidence of live deployment timing. Its short diff is from the public trip repository. No private source code is used in that artifact.

NoteQuest's role split comes from the author's account. No name, age, private repository links, private source snippets or operational data are published. The Retrospective.fun visual is an original illustration, not customer data or a product screenshot. The SendToChrome note describes the verified historical flow and distinguishes that from unverified usage or motivation. Bench items are possibilities for further exploration, not release promises.

Do not add private activity feeds or publish source material automatically. Use only public-safe descriptions and cleared references.

Connections explain a comparison rather than asserting historical influence. The EventMapper/agent-session comparison links to the public dashboard repository; it does not publish the private EventMapper implementation. Projects may have no connections. Bench entries use specific behaviours from the investigation rather than release promises.

## Social image

`og.png` is the committed 1200 × 630 preview served at `/og.png`. Its authoring source is `src/social-preview.html`. To change the image, edit that file and run:

```sh
node scripts/render-social.mjs
npm run check
```

The optional renderer uses Playwright and Chromium from your authoring environment. `PLAYWRIGHT_MODULE` can select an existing module URL; `CHROME_BIN` can select a browser executable. It embeds the existing local fonts and renders a trusted local page. Neither tool is required by the normal build or deployment. Commit the regenerated PNG. The image is shared by the Open Graph and large Twitter/X card metadata.

## Typography

DM Sans and Instrument Serif are embedded from the local WOFF2 files. Their SIL Open Font License notices are in `src/fonts/`. No font request leaves the visitor's browser.
