// qa/parity/ga-probe.mjs — Phase G diagnostic: what does GA actually send, and when?
// Prints every analytics request with its timing, plus whether window.gtag exists at
// 1 s / 3 s / 6 s after each page load. Read-only against the running local build.
//   node qa/parity/ga-probe.mjs [base]
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://127.0.0.1:3002").replace(/\/+$/, "");

async function launch() {
  try { return await chromium.launch(); } catch { return await chromium.launch({ channel: "chrome" }); }
}
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
const page = await ctx.newPage();
let t0 = Date.now();
page.on("request", (r) => {
  if (/googletagmanager|google-analytics|analytics\.google/.test(r.url())) {
    console.log(`  +${Date.now() - t0}ms REQ ${r.url().slice(0, 150)}`);
  }
});
page.on("console", (m) => { if (/gtag|google/i.test(m.text())) console.log(`  console: ${m.text().slice(0, 120)}`); });

await page.goto(`${BASE}/`, { waitUntil: "load" });
t0 = Date.now();
await page.getByRole("button", { name: /^Accept/i }).click();
for (const ms of [1000, 3000, 6000]) {
  await page.waitForTimeout(ms - (ms === 1000 ? 0 : 0));
  const st = await page.evaluate(() => ({
    gtag: typeof window.gtag,
    dl: (window.dataLayer || []).length,
    scripts: document.querySelectorAll("script[src*='gtag']").length,
  }));
  console.log(`  after page1 +${ms}ms: gtag=${st.gtag} dataLayer=${st.dl} gtag-script-tags=${st.scripts}`);
}

console.log("  --- navigating to /results (full document load) ---");
t0 = Date.now();
await page.goto(`${BASE}/results`, { waitUntil: "load" });
for (const ms of [1500, 4000, 8000]) {
  await page.waitForTimeout(ms);
  const st = await page.evaluate(() => ({
    gtag: typeof window.gtag,
    dl: (window.dataLayer || []).length,
    scripts: document.querySelectorAll("script[src*='gtag']").length,
  }));
  console.log(`  after page2 +${ms}ms: gtag=${st.gtag} dataLayer=${st.dl} gtag-script-tags=${st.scripts}`);
}
await browser.close();
