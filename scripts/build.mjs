import { chmod, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => readFile(path.join(root, name), 'utf8');
const [exhibits, notes, bench] = await Promise.all(['exhibits', 'notes', 'bench'].map(async (name) => JSON.parse(await read(`content/${name}.json`))));
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arrow = '<svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M4 15 15 4M4 4h11v11" stroke="currentColor" stroke-width="1.4"/></svg>';
const link = ({ label, url }, className = '') => {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error(`Only HTTPS links are allowed: ${url}`);
  return `<a class="${className}" href="${escape(url)}">${escape(label)}</a>`;
};
const ids = new Set([...exhibits, ...notes].map((item) => item.id));
if (ids.size !== exhibits.length + notes.length) throw new Error('Duplicate content ids');
for (const item of [...exhibits, ...notes]) {
  if (!/^[a-z0-9-]+$/.test(item.id)) throw new Error('Invalid content id');
  for (const related of item.related) if (!ids.has(related)) throw new Error(`Unknown related exhibit: ${related}`);
}

const diagram = `<svg class="curiosity-map" viewBox="0 0 430 400" aria-hidden="true">
  <defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".25"/></pattern></defs>
  <rect x="0" y="0" width="430" height="400" fill="url(#dots)"/>
  <g fill="none" stroke="currentColor" stroke-width="1"><path opacity=".45" d="M78 113C78 195 304 169 304 260M304 260C196 260 176 301 106 317M304 260C373 260 372 122 321 97"/><path opacity=".3" stroke-dasharray="3 6" d="M78 113C125 39 277 35 321 97M106 317C63 261 40 198 78 113"/>
  <circle cx="304" cy="260" r="28" opacity=".18"/><circle cx="304" cy="260" r="47" opacity=".1"/></g>
  <g fill="#c6c2b6"><circle cx="78" cy="113" r="4"/><circle cx="321" cy="97" r="4"/><circle cx="106" cy="317" r="4"/></g>
  <circle cx="304" cy="260" r="6" fill="#f19b77"/><circle cx="304" cy="260" r="3" fill="#171a17"/>
  <g font-family="monospace" font-size="13" fill="currentColor" letter-spacing="1"><text x="91" y="109">A LINK</text><text x="240" y="79">A CONVERSATION</text><text x="122" y="322">A MUSICAL NOTE</text></g>
  <path d="m288 257 5 3-5 3" fill="none" stroke="#f19b77"/>
</svg>`;

const oracle = `<div class="artifact oracle-artifact">
  <div class="artifact-top"><span>THE TRIP WEBSITE</span><span>2021</span></div>
  <div class="oracle-question" lang="nb">Er det tid for guttetur?</div>
  <p class="oracle-answer" id="oracle-answer" lang="nb" role="status" aria-live="polite" aria-atomic="true">Nope</p>
  <div class="oracle-controls"><button type="button" id="ask-oracle">Ask again</button><span id="oracle-counter" class="oracle-counter" aria-hidden="true">01 / 07</span></div>
  <fieldset class="oracle-era"><legend>Choose a version</legend><label><input type="radio" name="era" value="march" checked><span>MAR 2021</span></label><label><input type="radio" name="era" value="october"><span>27 OCT 2021</span></label></fieldset>
  <span class="artifact-foot">RECREATION · <span id="oracle-era-label">MARCH VERSION</span></span>
</div>`;

const retro = `<figure class="artifact retro-artifact" aria-label="Illustration of a note carried between two meetings">
  <div class="artifact-top"><span>NOTES BETWEEN MEETINGS</span></div>
  <div class="conversation-sheet sheet-back"><span class="sheet-label">LAST TIME</span><div class="paper-line long"></div><div class="paper-line"></div><div class="paper-line short"></div><span class="thought-dot"></span><div class="paper-line long"></div></div>
  <div class="conversation-sheet sheet-front"><span class="sheet-label">THIS TIME</span><span class="carried-note">Did we ever fix that?</span><div class="paper-line long"></div><div class="paper-line"></div><div class="paper-line short"></div><span class="sheet-bottom">FROM THE PREVIOUS SESSION</span></div>
  <svg class="memory-line" viewBox="0 0 500 350" aria-hidden="true"><path d="M128 200C15 180 60 317 215 280C325 254 330 180 383 140" fill="none" stroke="#e5ac6d" stroke-width="1.5" stroke-dasharray="3 4"/><circle cx="383" cy="140" r="4" fill="#e5ac6d"/></svg>

</figure>`;

const music = `<figure class="artifact music-artifact" aria-label="Illustration of NoteGame and NoteQuest">

  <svg class="music-staff" viewBox="0 0 500 260" aria-hidden="true"><g stroke="#bfbbd4" stroke-width="1" opacity=".35"><path d="M40 75h420M40 100h420M40 125h420M40 150h420M40 175h420"/></g>
  <g fill="#c8c2df" opacity=".3"><ellipse cx="110" cy="150" rx="12" ry="8" transform="rotate(-20 110 150)"/><path d="M120 148V82h2v66z"/></g>
  <path d="M133 155C196 218 253 211 303 148" fill="none" stroke="#c4b8ea" stroke-dasharray="3 6" opacity=".6"/>
  <g fill="#e1daf5"><ellipse cx="333" cy="125" rx="17" ry="11" transform="rotate(-20 333 125)"/><path d="M347 122V39h3v83z"/><path d="M349 39c2 17 30 24 23 47-2-14-18-17-23-23z"/></g><circle cx="333" cy="125" r="42" stroke="#bcb0dc" opacity=".2" fill="none"/></svg>
  <figcaption class="music-lineage">NoteGame, my experiment (2023), became NoteQuest, my daughter’s game</figcaption>

</figure>`;
const artifacts = { 'trip-oracle': oracle, retrospective: retro, notequest: music };

function connection(item) {
  const related = [...exhibits, ...notes].find((entry) => entry.id === item.related?.[0]);
  if (!related) return '';
  return `<a class="connection" href="#${related.id}" data-connection><span class="connection-icon" aria-hidden="true"><svg viewBox="0 0 16 20" fill="none"><path d="M3 2v11h10m-4-4 4 4-4 4" stroke="currentColor"/></svg></span><span><span class="connection-title">${escape(item.connectionTitle)}</span><span class="connection-reason">${escape(item.connection)}</span><strong>${escape(related.title)}</strong></span><span aria-hidden="true">${arrow}</span></a>`;
}

function historyArtifact(item) {
  if (!item.history) return '';
  const h = item.history;
  const clock = (date) => date.slice(11, 19);
  return `<section class="index-gap" id="oracle-gap" aria-label="From the public commit record"><p class="eyebrow">FROM THE PUBLIC COMMIT RECORD</p><div class="commit-times"><span><time datetime="${h.changedAt}">${clock(h.changedAt)}</time>Response changed</span><span><time datetime="${h.fixedAt}">${clock(h.fixedAt)}</time>Index fixed</span></div><p class="commit-time-label">27 October 2021 · recorded commit times, UTC</p><pre class="commit-diff" aria-label="The index fix, excerpted from the public commit"><code><del><span aria-hidden="true">− </span>${escape(h.before)}</del><ins><span aria-hidden="true">+ </span>${escape(h.after)}</ins></code></pre><div class="gap-controls" hidden><div class="gap-array" role="group" aria-label="Inspect the seven array positions">${Array.from({length:7},(_,i)=>`<button type="button" class="index-slot" data-index="${i}" aria-pressed="${i===0}" aria-label="Index ${i}: ${i===0?'Ja!':'empty'}"><span>${i}</span><strong>${i===0?'Ja!':'empty'}</strong></button>`).join('')}</div><p class="gap-result" role="status" aria-live="polite" aria-atomic="true">Position 0 returns “Ja!”</p><button type="button" class="gap-fix" aria-pressed="false">Try the next commit</button></div><p class="gap-explanation">The original chose randomly. Positions 1–6 no longer had a response; the fix always selects position 0.</p></section>`;
}

function exhibit(item) {
  return `<article class="exhibit" id="${item.id}" aria-labelledby="title-${item.id}">
    <div class="exhibit-identity"><span class="eyebrow">${escape(item.kind)}</span><span class="state state-${item.state.toLowerCase().replaceAll(' ', '-')}"><span aria-hidden="true"></span>${escape(item.state)}</span></div>
    <div class="exhibit-body">${artifacts[item.id] ?? `<div class="artifact text-artifact">${escape(item.subtitle)}</div>`}<div class="exhibit-copy"><span class="period">${escape(item.period)}</span><h3 id="title-${item.id}">${escape(item.title)}</h3><p class="exhibit-subtitle">${escape(item.subtitle)}</p><p class="exhibit-lead">${escape(item.lead)}</p>${link(item.link, 'text-link primary-link')}<details class="specimen-story"><summary>${item.history?'Two commits, 69 seconds apart':'Read about this project'} <span class="summary-mark" aria-hidden="true"></span></summary><div class="story-content">${item.storyTitle ? `<h4>${escape(item.storyTitle)}</h4>` : ''}${item.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('')}${historyArtifact(item)}${item.sources.length ? `<div class="source-links"><span>Commits</span>${item.sources.map((source) => link(source)).join('')}</div>` : ''}</div></details></div></div>
${connection(item)}
  </article>`;
}

const note = notes[0];
let css = await read('src/styles.css');
const licenses = await Promise.all(['DM-Sans-OFL.txt', 'Instrument-Serif-OFL.txt'].map((name) => read(`src/fonts/${name}`)));
css = `/* Embedded font licenses\n${licenses.join('\n\n').replaceAll('*/', '* /')}\n*/\n${css}`;
for (const name of ['dm-sans', 'instrument-serif', 'instrument-serif-italic']) {
  const bytes = await readFile(path.join(root, 'src/fonts', `${name}.woff2`));
  css = css.replaceAll(`FONT:${name}`, `data:font/woff2;base64,${bytes.toString('base64')}`);
}
const js = await read('src/interactions.js');
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#171a17"/><path d="M17 18v12l15 16 15-16V18M32 46v9M32 9v18" fill="none" stroke="#f19b77" stroke-width="4"/><circle cx="32" cy="32" r="4" fill="#eeeade"/></svg>`;
const html = `<!doctype html>
<!-- Generated by npm run build. Edit content/ and src/, then rebuild. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#171a17"><title>YBN / LAB</title><meta name="description" content="Personal software projects by Yngve Bakken-Nilsen: Retrospective.fun, NoteQuest, a 2021 trip website and notes on older tools."><link rel="canonical" href="https://ybn.no/"><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}"><meta property="og:type" content="website"><meta property="og:url" content="https://ybn.no/"><meta property="og:title" content="YBN / LAB"><meta property="og:description" content="Personal software projects by Yngve Bakken-Nilsen: Retrospective.fun, NoteQuest, a 2021 trip website and notes on older tools."><meta property="og:image" content="https://ybn.no/og.png"><meta property="og:image:secure_url" content="https://ybn.no/og.png"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="YBN / LAB: personal software projects by Yngve Bakken-Nilsen."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://ybn.no/og.png"><meta name="twitter:image:alt" content="YBN / LAB: personal software projects by Yngve Bakken-Nilsen."><meta name="twitter:title" content="YBN / LAB"><meta name="twitter:description" content="Personal software projects by Yngve Bakken-Nilsen: Retrospective.fun, NoteQuest, a 2021 trip website and notes on older tools."><style>${css}</style></head>
<body><a class="skip-link" href="#main">Skip to content</a>
<div class="page-shell"><header class="site-header"><a class="wordmark" href="#" aria-label="YBN LAB home"><svg viewBox="0 0 24 28" aria-hidden="true"><path d="M3 3v6l9 10 9-10V3M12 19v7M12 0v12" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="15" r="2" fill="currentColor"/></svg>YBN <span>/</span> LAB</a><nav aria-label="Main navigation"><a href="#collection">The collection</a><a href="#field-notes">Field notes</a><a href="#bench">On the bench</a></nav><span class="edition">v0.2 <span aria-hidden="true">/</span> PERSONAL PROJECTS</span></header>
<main id="main"><section class="hero" aria-labelledby="hero-title"><div class="hero-intro"><h1 id="hero-title">There’s probably<br>a pattern in here<br><em>somewhere.</em></h1><p class="tagline">My personal software projects, from 2013 to now. Some are still running. Most use more infrastructure than they needed.</p><a href="#collection" class="explore-link">See the projects</a></div><div class="hero-margin">${diagram}<p class="margin-note">Three projects you can try, and notes on a few older ones.</p></div></section>
<section class="collection" id="collection" aria-labelledby="collection-title"><div class="section-heading"><div><h2 id="collection-title">Projects</h2></div><p>A trip website, a retrospective tool and a game for learning to read music.</p></div>${exhibits.map(exhibit).join('')}</section>
<section class="field-notes" id="field-notes" aria-labelledby="field-title"><div class="section-label">Older projects</div><article id="${note.id}" class="field-note" aria-labelledby="field-title"><div class="note-margin"><span class="note-project">${escape(note.project)}<br>${escape(note.period)}</span><svg class="link-journey" viewBox="0 0 160 200" aria-hidden="true"><g stroke="currentColor" fill="none"><rect x="25" y="15" width="32" height="56" rx="3"/><path d="M30 61h22M40 22h4M42 71v35h75v33" stroke-dasharray="2 4"/><rect x="78" y="139" width="64" height="43" rx="2"/><path d="M78 148h64M87 144h1m4 0h1m4 0h1M93 190h34m-17-8v8"/></g><circle cx="42" cy="42" r="4" fill="#f19b77"/><circle cx="110" cy="162" r="4" fill="#f19b77"/></svg></div><div class="note-main"><h2 id="field-title">${escape(note.title)}</h2><p class="note-intro">${escape(note.intro)}</p><details class="full-note"><summary>How it worked <span class="summary-mark" aria-hidden="true"></span></summary><div class="note-prose">${note.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('')}${note.aside ? `<aside>${escape(note.aside)}</aside>` : ''}<p class="provenance">Source: the original SendToChrome implementation, 2015.</p>${connection(note)}</div></details></div></article></section>
<section class="bench" id="bench" aria-labelledby="bench-title"><div class="section-heading"><div><h2 id="bench-title">Other projects</h2></div></div><div class="bench-list">${bench.map((item) => `<div class="bench-item"><h3>${escape(item.name)}</h3><div class="bench-description"><p>${escape(item.description)}<span>${escape(item.detail)}</span></p>${item.connection ? `<p class="bench-related">${link(item.connection)}</p>` : ''}</div></div>`).join('')}</div></section>
<section class="closing"><p>Built and maintained by Yngve Bakken-Nilsen.</p></section></main>
<footer class="site-footer"><a class="wordmark footer-wordmark" href="#">YBN <span>/</span> LAB</a><a href="https://github.com/yngvebn">GitHub</a><span class="version">v0.2</span></footer></div><script type="module">${js}</script></body></html>`;
await writeFile(path.join(root, 'index.html'), html);
// A local checkout may use restrictive permissions; nginx's worker must be
// able to read the artifact copied by the unchanged Dockerfile.
await chmod(path.join(root, 'index.html'), 0o644);
console.log(`Built index.html (${Math.round(Buffer.byteLength(html) / 1024)} kB): ${exhibits.length} exhibits, ${notes.length} field note, ${bench.length} bench items. No runtime dependencies.`);
