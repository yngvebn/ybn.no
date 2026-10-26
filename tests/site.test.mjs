import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const projects = JSON.parse(await readFile(new URL('../content/projects.json', import.meta.url), 'utf8'));

test('the deployment artifact is self-contained and needs no runtime services', () => {
  assert.doesNotMatch(html, /FONT:|<script\b|<link[^>]+rel="stylesheet"|@import|\bfetch\(/);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.match(match[1], /^(?:#|https:\/\/|data:)/, `Unexpected asset dependency: ${match[1].slice(0, 60)}`);
  }
  assert.ok(Buffer.byteLength(html) < 250_000, 'Keep the entire release below 250 kB');
});

test('every embedded font is a real WOFF2 file', () => {
  const fonts = [...html.matchAll(/url\('data:font\/woff2;base64,([^']+)'\)/g)];
  assert.equal(fonts.length, 3);
  for (const [, data] of fonts) assert.equal(Buffer.from(data, 'base64').subarray(0, 4).toString('ascii'), 'wOF2');
});

test('all internal anchors work and all document IDs are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
  for (const match of html.matchAll(/href="#([^"\s]+)"/g)) {
    assert.ok(ids.includes(match[1]), `Missing anchor #${match[1]}`);
  }
});

test('the timeline lists every project, newest year first', () => {
  const years = [...html.matchAll(/<h2 class="year[^"]*" id="year-(\d{4})">/g)].map((match) => Number(match[1]));
  assert.deepEqual(years, [...years].sort((a, b) => b - a));
  assert.deepEqual(new Set(years), new Set(projects.map((p) => p.year)));
  assert.equal((html.match(/<article class="entry/g) ?? []).length, projects.length);
  for (const project of projects) assert.match(html, new RegExp(`id="${project.id}"`));
  assert.match(html, /https:\/\/retrospective\.fun/);
  assert.match(html, /https:\/\/notequest\.no\//);
  assert.match(html, /she develops the game/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/ybn\.no\/">/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});

test('screenshots have alternative text', () => {
  for (const match of html.matchAll(/<img\b[^>]*>/g)) assert.match(match[0], /\salt="[^"]{10,}"/);
});

test('public references do not expose private repositories or local paths', () => {
  for (const match of html.matchAll(/href="(https:\/\/github\.com\/[^"\s]+)"/g)) {
    const url = new URL(match[1]);
    assert.ok(url.pathname === '/yngvebn' || url.pathname === '/yngvebn/agent-session-dashboard' || url.pathname === '/yngvebn/Chess' || url.pathname.startsWith('/yngvebn/erdettidforguttetur.no'), `Review public reference: ${url}`);
  }
  assert.doesNotMatch(html, /\/workspace\/|C:\\\\|\.env\b|PRIVATE KEY|client_secret|api[_-]key/i);
});

test('social cards reference the actual, deployable 1200 × 630 PNG', async () => {
  const png = await readFile(new URL('../og.png', import.meta.url));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.match(html, /property="og:image" content="https:\/\/ybn\.no\/og\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="twitter:image" content="https:\/\/ybn\.no\/og\.png"/);
  const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
  assert.match(dockerfile, /COPY og\.png \/usr\/share\/nginx\/html\/og\.png/);
});

test('rebuilding does not change the committed deployment artifact', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
  const again = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(again, html);
});
