// Optional authoring tool; the committed PNG needs no browser in production.
// Use an existing Playwright installation, or install it in your authoring
// environment. PLAYWRIGHT_MODULE may select an existing module URL.
import { readFile, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let source = await readFile(join(root, 'src/social-preview.html'), 'utf8');
for (const name of ['schibsted-grotesk']) {
  const font = await readFile(join(root, 'src/fonts', `${name}.woff2`));
  source = source.replaceAll(`fonts/${name}.woff2`, `data:font/woff2;base64,${font.toString('base64')}`);
}
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || undefined,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(source, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(root, 'og.png') });
  await chmod(join(root, 'og.png'), 0o644);
  console.log('Rendered og.png at 1200 × 630.');
} finally {
  await browser.close();
}
