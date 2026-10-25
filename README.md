# YBN / LAB

A personal digital workshop. Live at [ybn.no](https://ybn.no/).

## Editing

The content lives in three small JSON files:

- `content/exhibits.json` — exhibits, state, specimen notes, public links and manually selected connections.
- `content/notes.json` — short field notes.
- `content/bench.json` — brief descriptions of other experiments.

Edit the content, layout in `scripts/build.mjs`, styles in `src/styles.css`, or browser interactions in `src/interactions.js`. Then, with Node.js 22 or later:

```sh
npm run build
npm run check
```

There are no npm dependencies to install. Commit the generated `index.html` alongside source changes. It includes the styles, script, original SVG diagrams and locally stored fonts, and works without external asset services. All stories remain readable without JavaScript; only the oracle recreation and automatic opening of connected notes need it.

To add an exhibit, give it a unique ID, the existing content fields and related IDs. New exhibits get a text-based specimen surface unless a custom illustration is added to the build template. Exhibit IDs double as shareable fragment links, for example `https://ybn.no/#notequest`. The first item in `notes.json` is the featured field note in v0.1.

Preview locally with any static server, for example `python3 -m http.server 8080`.

## Deployment

The original deployment setup is preserved: `Dockerfile` copies **only `index.html`** into nginx, serves port 80, and retains its original health check. The existing Coolify/GitHub integration deploys the committed artifact. No Node runtime, build service, database, authentication, analytics or external font requests are required in production.

```sh
docker build -t ybn-lab .
docker run --rm -p 8080:80 ybn-lab
```

## Editorial boundaries

The trip oracle is explicitly a historical recreation. Its seven negative answers are cycled to make them discoverable; the original chose randomly. The old shortened outbound link is shown only as text. The two October 2021 commits are linked in the specimen notes.

NoteQuest's role split comes from the author's account. No name, age, private repository links, private source snippets or operational data are published. The Retrospective.fun visual is an original illustration, not customer data or a product screenshot. The SendToChrome note describes the verified historical flow and distinguishes that from unverified usage or motivation. Bench items are possibilities for further exploration, not release promises.

Do not add private activity feeds or publish source material automatically. Use only public-safe descriptions and cleared references.

## Typography

DM Sans and Instrument Serif are embedded from the local WOFF2 files. Their SIL Open Font License notices are in `src/fonts/`. No font request leaves the visitor's browser.
