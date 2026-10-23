// qa/parity/shots-test-pages.mjs — LIVE screenshots of the five zz-test- reference
// pages at 360 and 1366 (fullPage). Local QA only; PNGs are gitignored. Not shipped.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SITE_URL || "https://www.indianexaminfo.com";
const pages = [
  ["entrance", "/admission/management/zz-test-entrance-exam"],
  ["government", "/sarkari-naukri/central-government-jobs/zz-test-government-exam"],
  ["govt-vacancy", "/sarkari-naukri/agriculture-recruitment/zz-test-govt-vacancy"],
  ["board", "/board-exam/state/up-board/zz-test-board-exam"],
  ["university", "/university-exam/state-university/zz-test-university-exam"],
  ["entrance-admitcard", "/admission/management/zz-test-entrance-exam/admit-card"],
];
// argv "name=/path" entries REPLACE the defaults (the routes are category-based, so a
// stale path in the list 404s and the screenshot proves nothing).
const overrides = process.argv.slice(2).filter((a) => a.includes("=")).map((a) => {
  const i = a.indexOf("=");
  return [a.slice(0, i), a.slice(i + 1)];
});
const chosen = overrides.length ? overrides : pages;
const widths = [["360", 360, 800], ["1366", 1366, 900]];

const browser = await chromium.launch();
for (const [name, path] of chosen) {
  for (const [wn, w, h] of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    let status = "ERR";
    try {
      const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
      status = resp ? resp.status() : "no-resp";
      const banner = await page.getByText("TEST PAGE").first().isVisible().catch(() => false);
      await page.screenshot({ path: resolve(dir, `test-${name}-${wn}.png`), fullPage: true });
      console.log(`test-${name}-${wn}.png  ${status}  banner=${banner}`);
    } catch (e) {
      console.log(`test-${name}-${wn}  FAILED ${e.message.split("\n")[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log("DONE");
