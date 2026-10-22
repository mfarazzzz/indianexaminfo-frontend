import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const pages = ["rich", "no-dates", "no-elig", "no-links", "bulletin", "bulletin-empty"];
const widths = [["360", 360, 740], ["1366", 1366, 900]];

const browser = await chromium.launch();
let overflowFails = 0;
let emptyFails = 0;
for (const p of pages) {
  for (const [wn, w, h] of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto("file:///" + resolve(dir, `out-${p}.html`).replace(/\\/g, "/"));
    const m = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const empty = [...document.querySelectorAll("section")].filter((s) => {
        const t = s.cloneNode(true);
        t.querySelectorAll("h2,h3,style").forEach((n) => n.remove());
        const hasBody = !!t.querySelector("table,ul,ol,p,a,button,details,input,img,li");
        return !hasBody && t.textContent.trim() === "";
      }).length;
      return { overflow, empty };
    });
    console.log(`${p} @${wn}px  overflow=${m.overflow}px  emptySections=${m.empty}`);
    if (m.overflow > 0) overflowFails++;
    if (m.empty > 0) emptyFails++;
    await page.screenshot({ path: resolve(dir, `parity-${p}-${wn}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();
console.log(overflowFails === 0 && emptyFails === 0 ? "ALL OK: 0px overflow, 0 empty shells" : `FAIL overflow=${overflowFails} empty=${emptyFails}`);
