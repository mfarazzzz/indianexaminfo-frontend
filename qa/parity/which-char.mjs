// qa/parity/which-char.mjs — which character on the page pulls in the latin-ext font file?
// (owner batch 3, F6). Walks the LIVE DOM (after hydration) including pseudo-element
// content, and prints every codepoint that falls in a non-latin unicode-range.
//
//   node qa/parity/which-char.mjs [http://localhost:3002] /path
import { chromium } from "@playwright/test";
const BASE = (process.argv[2] || "http://localhost:3002").replace(/\/+$/, "");
const PATH = process.argv[3] || "/sarkari-naukri/ssc/ssc-cgl";

async function launch() {
  try { return await chromium.launch(); }
  catch { return await chromium.launch({ channel: "chrome" }); }
}
const browser = await launch();
const page = await (await browser.newContext({ viewport: { width: 360, height: 740 } })).newPage();
await page.goto(BASE + PATH, { waitUntil: "load", timeout: 60_000 });
await page.waitForTimeout(1500);

const found = await page.evaluate(() => {
  const hits = [];
  const ranges = { latinExt: [0x0100, 0x02c5], viet: [0x1e00, 0x1eff], deva: [0x0900, 0x097f], greek: [0x0370, 0x03ff] };
  const scan = (text, where) => {
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (c < 0x80) continue;
      for (const [name, [lo, hi]] of Object.entries(ranges)) {
        if (c >= lo && c <= hi) hits.push({ name, where, cp: "U+" + c.toString(16).toUpperCase(), ch, snippet: text.slice(0, 60) });
      }
    }
  };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) scan(n.nodeValue || "", n.parentElement ? n.parentElement.tagName.toLowerCase() + "." + String(n.parentElement.className).split(" ")[0] : "?");
  for (const el of document.querySelectorAll("body *")) {
    const before = getComputedStyle(el, "::before").content;
    const after = getComputedStyle(el, "::after").content;
    for (const c of [before, after]) if (c && c !== "none") scan(c.replace(/["“”]/g, ""), el.tagName.toLowerCase() + " pseudo");
  }
  const byName = {};
  for (const h of hits) (byName[h.name] ||= []).push(h);
  return Object.fromEntries(Object.entries(byName).map(([k, v]) => [k, { count: v.length, unique: [...new Set(v.map((x) => x.cp))], samples: v.slice(0, 6) }]));
});

console.log(PATH, JSON.stringify(found, null, 2));

// Which faces did the browser actually LOAD (status "loaded" = the file was fetched)?
const loaded = await page.evaluate(async () => {
  await document.fonts.ready;
  const out = [];
  for (const f of document.fonts) {
    out.push({ family: f.family, weight: f.weight, status: f.status, range: (f.unicodeRange || "").slice(0, 46), src: (f.src || "").slice(0, 60) });
  }
  return out;
});
console.log("FACES:", JSON.stringify(loaded.filter((f) => f.status === "loaded"), null, 1));
await browser.close();
