// qa/parity/cls-trace.mjs — name the elements that actually shift (owner batch 3, F5).
//
// Lighthouse's `layout-shift-elements` audit came back EMPTY on pages whose CLS was
// 0.012-0.028 (batch-3 f-before run): small shifts below its per-item reporting threshold
// are counted in the score but never attributed. So this harness asks Chrome directly:
// a PerformanceObserver on "layout-shift" with `sources`, which gives the element, its old
// and new box, and the moment it moved — the same data the Layout Shift inspector shows.
//
// Read-only against a running build. No network throttling here (Lighthouse does that);
// this answers WHICH, Lighthouse answers HOW MUCH.
//
//   node qa/parity/cls-trace.mjs [http://localhost:3002] [/path …]
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || "http://localhost:3002").replace(/\/+$/, "");
const PATHS = process.argv.slice(3).length ? process.argv.slice(3) : [
  "/", "/board-exam/state/up-board/up-board-class-10", "/sarkari-naukri/ssc/ssc-cgl", "/results",
];

async function launch() {
  try { return await chromium.launch(); } catch { return await chromium.launch({ channel: "chrome" }); }
}

const OBSERVER = `
window.__shifts = [];
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.hadRecentInput) continue;
    window.__shifts.push({
      score: Number(e.value.toFixed(6)),
      time: Math.round(e.startTime),
      sources: (e.sources || []).map((s) => ({
        sel: (() => { const n = s.node; if (!n) return "(detached)";
          const cls = String(n.className || "").split(" ").filter(Boolean).slice(0, 2).join(".");
          return n.tagName.toLowerCase() + (cls ? "." + cls : ""); })(),
        text: (s.node && s.node.textContent ? s.node.textContent.trim().slice(0, 40) : ""),
        from: [Math.round(s.previousRect.top), Math.round(s.previousRect.height), Math.round(s.previousRect.width)],
        to:   [Math.round(s.currentRect.top),  Math.round(s.currentRect.height),  Math.round(s.currentRect.width)],
      })),
    });
  }
}).observe({ type: "layout-shift", buffered: true });
`;

const browser = await launch();
const report = [];
for (const path of PATHS) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  await page.addInitScript(OBSERVER);
  await page.goto(BASE + path, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(6000);           // let late-loading strips/ads settle
  const shifts = await page.evaluate(async () => {
    await document.fonts.ready;
    return window.__shifts;
  });
  const total = shifts.reduce((s, x) => s + x.score, 0);
  report.push({ path, total: Number(total.toFixed(4)), shifts });
  console.log(`\n${path}  CLS(from observer)=${total.toFixed(4)}  shift entries=${shifts.length}`);
  for (const s of shifts.sort((a, b) => b.score - a.score).slice(0, 8)) {
    console.log(`  ${s.score.toFixed(5)} @${s.time}ms  ${s.sources.map((x) => `${x.sel} "[${x.text}]" top ${x.from[0]}->${x.to[0]} h ${x.from[1]}->${x.to[1]}`).join(" ; ")}`);
  }
  await ctx.close();
}
await browser.close();
writeFileSync(resolve(dir, "cls-trace.txt"), JSON.stringify(report, null, 2) + "\n");
console.log("\nwrote qa/parity/cls-trace.txt");
