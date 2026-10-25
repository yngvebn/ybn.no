import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('the deployment artifact is self-contained and needs no runtime services', () => {
  assert.doesNotMatch(html, /FONT:|<script[^>]+src=|<link[^>]+rel="stylesheet"|@import|\bfetch\(/);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.match(match[1], /^(?:#|https:\/\/|data:)/, `Unexpected asset dependency: ${match[1]}`);
  }
  assert.ok(Buffer.byteLength(html) < 250_000, 'Keep the entire release below 250 kB');
});

test('all internal anchors work and all document IDs are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
  for (const match of html.matchAll(/href="#([^"\s]+)"/g)) {
    assert.ok(ids.includes(match[1]), `Missing anchor #${match[1]}`);
  }
});

test('the three exhibits and field note are available before JavaScript runs', () => {
  assert.equal((html.match(/class="exhibit"/g) ?? []).length, 3);
  assert.match(html, /id="send-to-chrome"/);
  assert.match(html, /https:\/\/retrospective\.fun/);
  assert.match(html, /https:\/\/notequest\.no\//);
  assert.match(html, /She develops the game/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/ybn\.no\/">/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});

test('public references do not expose private repositories or local paths', () => {
  for (const match of html.matchAll(/href="(https:\/\/github\.com\/[^"\s]+)"/g)) {
    const url = new URL(match[1]);
    assert.ok(url.pathname === '/yngvebn' || url.pathname.startsWith('/yngvebn/erdettidforguttetur.no'), `Review public reference: ${url}`);
  }
  assert.doesNotMatch(html, /\/workspace\/|C:\\\\|\.env\b|PRIVATE KEY|client_secret|api[_-]key/i);
});

test('rebuilding does not change the committed deployment artifact', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
  const again = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(again, html);
});
