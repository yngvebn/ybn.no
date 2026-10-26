import { chmod, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => readFile(path.join(root, name), 'utf8');
const projects = JSON.parse(await read('content/projects.json'));
const pkg = JSON.parse(await read('package.json'));
const version = `v${pkg.version.split('.').slice(0, 2).join('.')}`;

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const https = (url) => {
  if (new URL(url).protocol !== 'https:') throw new Error(`Only HTTPS links are allowed: ${url}`);
  return escape(url);
};

// Validate content before rendering anything.
const ids = new Set();
for (const item of projects) {
  if (!/^[a-z0-9-]+$/.test(item.id)) throw new Error(`Invalid content id: ${item.id}`);
  if (ids.has(item.id)) throw new Error(`Duplicate content id: ${item.id}`);
  if (!Number.isInteger(item.year)) throw new Error(`Missing year: ${item.id}`);
  ids.add(item.id);
}
for (const item of projects) {
  if (item.related && !ids.has(item.related.id)) throw new Error(`Unknown related project: ${item.related.id}`);
}

// Screenshots are optional: a missing file renders no figure.
async function screenshot(item) {
  if (!item.screenshot) return '';
  const { file, shape, alt } = item.screenshot;
  let bytes;
  try {
    bytes = await readFile(path.join(root, 'src/screens', file));
  } catch {
    console.warn(`No screenshot at src/screens/${file}; skipping.`);
    return '';
  }
  if (bytes.length > 150_000) console.warn(`src/screens/${file} is ${Math.round(bytes.length / 1024)} kB; consider a smaller WebP.`);
  const type = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[path.extname(file).toLowerCase()];
  if (!type) throw new Error(`Unsupported screenshot type: ${file}`);
  const size = imageSize(bytes, type);
  return `<img class="shot shot-${shape === 'phone' ? 'phone' : 'wide'}" src="data:${type};base64,${bytes.toString('base64')}" alt="${escape(alt)}"${size ? ` width="${size.width}" height="${size.height}"` : ''} decoding="async">`;
}

function imageSize(bytes, type) {
  if (type === 'image/png') return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (type === 'image/webp' && bytes.toString('ascii', 12, 16) === 'VP8 ') return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (type === 'image/webp' && bytes.toString('ascii', 12, 16) === 'VP8L') {
    const b = bytes.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (type === 'image/webp' && bytes.toString('ascii', 12, 16) === 'VP8X') return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  return null;
}

const clock = (date) => date.slice(11, 19);

function history(h) {
  return `<figure class="evidence"><div class="evidence-times"><a href="${https(h.changedUrl)}"><time datetime="${h.changedAt}">${clock(h.changedAt)}</time><span>${escape(h.changedLabel)}</span></a><a href="${https(h.fixedUrl)}"><time datetime="${h.fixedAt}">${clock(h.fixedAt)}</time><span>${escape(h.fixedLabel)}</span></a></div><pre class="diff" aria-label="The index fix, from the public commit"><code><del><span aria-hidden="true">− </span>${escape(h.before)}</del><ins><span aria-hidden="true">+ </span>${escape(h.after)}</ins></code></pre><figcaption>${escape(h.caption)}</figcaption></figure>`;
}

async function entry(item, compact) {
  const meta = [item.state && `<span class="state${item.state === 'Still running' ? ' state-running' : ''}">${escape(item.state)}</span>`, item.kind && escape(item.kind)].filter(Boolean).join(' · ');
  const lang = item.lang ? ` lang="${item.lang}"` : '';
  const related = projects.find((p) => p.id === item.related?.id);
  return `<article class="entry${compact ? ' entry-compact' : ''}" id="${item.id}" aria-labelledby="title-${item.id}">
${meta ? `<p class="meta">${meta}</p>` : ''}<h3 id="title-${item.id}"${lang}>${escape(item.title).replace(/\.(?=\w)/g, '.<wbr>')}</h3>
${item.subtitle ? `<p class="subtitle">${escape(item.subtitle)}</p>` : ''}<p class="lead">${escape(item.lead)}</p>
${(item.paragraphs ?? []).map((p) => `<p class="body">${escape(p)}</p>`).join('')}
${item.chain ? `<ol class="chain">${item.chain.map((step) => `<li>${escape(step)}</li>`).join('')}</ol>` : ''}
${item.history ? history(item.history) : ''}${await screenshot(item)}
${item.story ? `<details class="story"><summary>${escape(item.story.summary)}</summary>${item.story.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('')}</details>` : ''}
${related ? `<p class="body">Related: <a href="#${related.id}">${escape(item.related.label)}</a>, ${escape(item.related.text)}</p>` : ''}
${item.link ? `<p class="action"><a href="${https(item.link.url)}">${escape(item.link.label)} <span aria-hidden="true">→</span></a></p>` : ''}
</article>`;
}

const years = [...new Set(projects.map((p) => p.year))].sort((a, b) => b - a);
const timeline = (await Promise.all(years.map(async (year) => {
  const items = projects.filter((p) => p.year === year);
  const running = items.some((p) => p.state === 'Still running');
  const entries = await Promise.all(items.map((item) => entry(item, items.length > 1)));
  return `<section class="year-row" id="y${year}" aria-labelledby="year-${year}"><h2 class="year${running ? ' year-running' : ''}" id="year-${year}">${year}</h2><div class="entries">${entries.join('')}</div></section>`;
}))).join('\n');

let css = await read('src/styles.css');
const licenses = await Promise.all(['Schibsted-Grotesk-OFL.txt', 'IBM-Plex-Mono-OFL.txt'].map((name) => read(`src/fonts/${name}`)));
css = `/* Embedded font licenses\n${licenses.join('\n\n').replaceAll('*/', '* /')}\n*/\n${css}`;
// Match the whole quoted placeholder so one font name can't be a prefix of another.
for (const name of ['schibsted-grotesk', 'ibm-plex-mono-400', 'ibm-plex-mono-500']) {
  const bytes = await readFile(path.join(root, 'src/fonts', `${name}.woff2`));
  const placeholder = `'FONT:${name}'`;
  if (!css.includes(placeholder)) throw new Error(`Missing font placeholder ${placeholder}`);
  css = css.replaceAll(placeholder, `'data:font/woff2;base64,${bytes.toString('base64')}'`);
}
if (css.includes('FONT:')) throw new Error('Unresolved font placeholder');

const description = 'Personal software projects by Yngve Bakken-Nilsen, from 2013 to now: Retrospective.fun, NoteQuest, a 2021 trip website and older tools.';
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#111111"/><path d="M18 16l14 18 14-18M32 34v16" fill="none" stroke="#fbfbfa" stroke-width="7" stroke-linecap="square"/></svg>`;

const html = `<!doctype html>
<!-- Generated by npm run build. Edit content/ and src/, then rebuild. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="theme-color" content="#fbfbfa"><title>ybn.no — personal software projects</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="https://ybn.no/"><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(favicon)}"><meta property="og:type" content="website"><meta property="og:url" content="https://ybn.no/"><meta property="og:title" content="ybn.no"><meta property="og:description" content="${escape(description)}"><meta property="og:image" content="https://ybn.no/og.png"><meta property="og:image:secure_url" content="https://ybn.no/og.png"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="There’s probably a pattern in here somewhere. Personal software projects by Yngve Bakken-Nilsen."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://ybn.no/og.png"><meta name="twitter:image:alt" content="There’s probably a pattern in here somewhere. Personal software projects by Yngve Bakken-Nilsen."><meta name="twitter:title" content="ybn.no"><meta name="twitter:description" content="${escape(description)}"><style>${css}</style></head>
<body><a class="skip-link" href="#main">Skip to content</a>
<div class="page"><header class="site-header"><a class="wordmark" href="#main">ybn.no</a><nav aria-label="Main"><a href="#projects">Projects</a><a href="https://github.com/yngvebn">GitHub</a></nav></header>
<main id="main"><section class="hero" aria-labelledby="hero-title"><h1 id="hero-title">There’s probably a pattern in here somewhere.</h1><p class="tagline">My personal software projects, from 2013 to now. Some are still running. Most use more infrastructure than they needed.</p></section>
<div class="timeline" id="projects" aria-label="Projects by year, newest first">
${timeline}
</div></main>
<footer class="site-footer"><p>Built and maintained by Yngve Bakken-Nilsen.</p><p><a href="https://github.com/yngvebn">GitHub</a><span class="version">${version}</span></p></footer></div></body></html>`;
await writeFile(path.join(root, 'index.html'), html);
// A local checkout may use restrictive permissions; nginx's worker must be
// able to read the artifact copied by the unchanged Dockerfile.
await chmod(path.join(root, 'index.html'), 0o644);
console.log(`Built index.html (${Math.round(Buffer.byteLength(html) / 1024)} kB): ${projects.length} projects across ${years.length} years. No runtime dependencies.`);
