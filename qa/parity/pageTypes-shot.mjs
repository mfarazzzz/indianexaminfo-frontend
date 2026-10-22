/**
 * pageTypes-shot.mjs — PHASE 2 audit harness (read-only, local).
 *
 * Walks the reader-facing templates OTHER than the exam main page (already
 * parity-checked by live-shot.mjs) against the production build, at 360 and
 * 1366: status, horizontal overflow px, and a full-page screenshot per size
 * under qa/parity/ (gitignored). No DB write, no deploy — this exists to give
 * the page-type delta table measured evidence, same rules as the exam page:
 * 0px horizontal overflow at 360 and no empty shells.
 *
 * Usage: node qa/parity/pageTypes-shot.mjs   (server must run at :3112)
 */
import { chromium } from "playwright";

const BASE = process.env.PARITY_BASE || "http://localhost:3112";
const targets = [
  { key: "home",            path: "/" },
  { key: "results-hub",     path: "/results" },
  { key: "admitcard-hub",   path: "/admit-card" },
  { key: "sarkari-index",   path: "/sarkari-naukri" },
  { key: "state-hub",       path: "/sarkari-naukri/state/up" },
  { key: "category-hub",    path: "/admission/medical" },
  { key: "exam-ct-results", path: "/sarkari-naukri/state-government-jobs/upsssc-pet/results" },
  { key: "news-article",    path: "/news/guide/clat-2026-preparation-strategy" },
  { key: "news-home",       path: "/news" },
];
const sizes = [
  { name: "360", width: 360, height: 800 },
  { name: "1366", width: 1366, height: 900 },
];

const browser = await chromium.launch();
const results = [];
for (const t of targets) {
  for (const s of sizes) {
    const page = await browser.newPage({ viewport: { width: s.width, height: s.height } });
    let status = "ERR";
    let overflow = -1;
    try {
      const resp = await page.goto(BASE + t.path, { waitUntil: "networkidle", timeout: 60000 });
      status = resp ? String(resp.status()) : "no-response";
      overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      await page.screenshot({ path: `qa/parity/page-${t.key}-${s.name}.png`, fullPage: true });
    } catch (e) {
      status = "nav-error:" + e.message.slice(0, 60);
    }
    results.push(`${t.key.padEnd(16)} ${String(s.name).padEnd(5)} status=${status.padEnd(4)} overflow=${overflow}px`);
    await page.close();
  }
}
await browser.close();
console.log(results.join("\n"));
const bad = results.filter((r) => !/status=200\b/.test(r) || !/overflow=0px/.test(r));
console.log(bad.length ? "PAGE-TYPE ISSUES:\n" + bad.join("\n") : "ALL 200 / 0px OVERFLOW");
process.exit(bad.length ? 1 : 0);
