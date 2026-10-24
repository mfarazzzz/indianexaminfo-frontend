// qa/parity/homeBands-shot.mjs — Item 2 fixture screenshots at 360 and 1366.
// Loads the standalone HTML the fixture test writes (PARITY_HTML=1 vitest run),
// measures horizontal overflow at each width and saves a PNG. Local QA only;
// the PNGs are gitignored in qa/parity.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const cases = ["bands-allunverified", "bands-mixed", "bands-allverified", "sidebar"];
const widths = [["360", 360, 740], ["1366", 1366, 900]];

const browser = await chromium.launch();
let overflowFails = 0;
for (const c of cases) {
  for (const [wn, w, h] of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto("file:///" + resolve(dir, `out-${c}.html`).replace(/\\/g, "/"));
    const m = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`${c} @${wn}px  overflow=${m}px`);
    if (m > 0) overflowFails++;
    await page.screenshot({ path: resolve(dir, `homebands-${c}-${wn}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();
console.log(overflowFails === 0 ? "HOME BANDS SHOTS DONE: 0px overflow at 360 and 1366" : `FAIL: ${overflowFails} widths overflow`);
