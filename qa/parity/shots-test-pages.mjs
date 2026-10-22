// qa/parity/shots-test-pages.mjs — LIVE screenshots of the five zz-test- reference
// pages at 360 and 1366 (fullPage). Local QA only; PNGs are gitignored. Not shipped.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SITE_URL || "https://www.indianexaminfo.com";
const pages = [
  ["entrance", "/admission/management/zz-test-entrance-exam"],
  ["government", "/sarkari-naukri/zz-test-government-exam"],
  ["govt-vacancy", "/sarkari-naukri/zz-test-govt-vacancy"],
  ["board", "/board-exam/state/uttar-pradesh/zz-test-board-exam"],
  ["university", "/university-exam/state-university/zz-test-university-exam"],
  ["entrance-admitcard", "/admission/management/zz-test-entrance-exam/admit-card"],
];
const widths = [["360", 360, 800], ["1366", 1366, 900]];

const browser = await chromium.launch();
for (const [name, path] of pages) {
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
