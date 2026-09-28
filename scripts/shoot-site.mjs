/**
 * shoot-site.mjs — capture a public page at the two proof sizes.
 *
 * Usage:  npm run shoot:site -- https://indianexaminfo.com/<path>
 *         SHOT_DIR=qa/screenshots npm run shoot:site -- <url>
 *
 * No login, no storageState, no third-party scripts injected. Screenshots land at
 *   <out>/<slug>-360x800.png  and  <out>/<slug>-1440x900.png
 * The browser binary must already be installed once per machine:
 *   node node_modules/@playwright/test/cli.js install chromium
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 1440, height: 900 },
];

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Usage: npm run shoot:site -- <full http(s) URL>');
  process.exit(2);
}

const outDir = path.resolve(process.env.SHOT_DIR || 'qa/screenshots');
await mkdir(outDir, { recursive: true });

// /sarkari-naukri/x -> sarkari-naukri-x ; strip query/hash
const slug =
  decodeURIComponent(url.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, ''))
    .split('/')
    .filter(Boolean)
    .join('-')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'home';

const browser = await chromium.launch();
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: vp,
      deviceScaleFactor: 1,
      // A mid-range Android reader, not a desktop connection.
      ...(vp.width < 500 ? { userAgent:
        'Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36' } : {}),
    });
    const page = await ctx.newPage();
    const resp = await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    const file = path.join(outDir, `${slug}-${vp.width}x${vp.height}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`status=${resp?.status() ?? 'n/a'} ${vp.width}x${vp.height} -> ${file}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
