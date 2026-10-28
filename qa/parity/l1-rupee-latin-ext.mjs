/**
 * qa/parity/l1-rupee-latin-ext.mjs — L1 (owner batch 4): what actually pulls the 83 KB
 * Inter latin-ext file onto an exam/entrance page, and is it the RUPEE SIGN (U+20B9)?
 *
 * The hypothesis is checked against the BUILT CSS, not against a guess: next/font writes one
 * @font-face per subset with its real unicode-range, so "is this character served by the latin
 * file or only by latin-ext" is a fact I can read, and Chrome fetches a face only when a
 * rendered character falls inside that face's range.
 *
 * For each URL it reports:
 *   1. the Inter faces as the build declares them (file, bytes, unicode-range) — which one is
 *      the 83 KB file, and whether U+20B9 is in the latin range or only in latin-ext;
 *   2. every character in the RENDERED page (text nodes + ::before/::after content, after
 *      hydration) whose codepoint falls in the latin-ext range, with counts and a snippet;
 *   3. CAUSATION, by A/B on the same build: load the page as served, then load it again with
 *      U+20B9 stripped out of the response body (text AND the RSC flight payload, so hydration
 *      cannot put it back) and record whether the latin-ext file is still requested.
 *
 * READ-ONLY against a local production build (default http://127.0.0.1:3002). Nothing is
 * written to the site; the strip happens only in this test's own response interception.
 *
 *   node qa/parity/l1-rupee-latin-ext.mjs [base] [path ...paths]
 *   node qa/parity/l1-rupee-latin-ext.mjs http://127.0.0.1:3002 /sarkari-naukri/ssc/ssc-cgl
 */
import { chromium } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, "..", "..");
const argv = process.argv.slice(2);
const BASE = (argv[0] || "http://127.0.0.1:3002").replace(/\/+$/, "");
const argPaths = argv.slice(1);

// ── 1. the faces, straight out of the built CSS ──────────────────────────────
const RUPEE = 0x20b9;

/** Parse one unicode-range value ("u+00??,u+0131,u+20ad-20c4") into inclusive spans. */
function parseRanges(value) {
  const spans = [];
  for (const raw of String(value).split(",")) {
    const token = raw.trim().replace(/^u\+/i, "");
    if (!token) continue;
    if (token.includes("-")) {
      const [lo, hi] = token.split("-");
      spans.push([parseInt(lo, 16), parseInt(hi, 16)]);
    } else if (/[?]/.test(token)) {
      const base = parseInt(token.replace(/\?/g, "0"), 16);
      const wildcardDigits = (token.match(/\?/g) || []).length;
      spans.push([base, base + (16 ** wildcardDigits - 1)]);
    } else {
      const cp = parseInt(token, 16);
      spans.push([cp, cp]);
    }
  }
  return spans;
}
const cssDir = resolve(root, ".next/static/css");
const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith(".css"));
const css = cssFiles.map((f) => readFileSync(resolve(cssDir, f), "utf8")).join("\n");

const faces = [];
for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
  const body = m[1];
  const decl = (name) => {
    const d = new RegExp(`${name}:([^;}]*)`).exec(body);
    return d ? d[1].trim().replace(/;$/, "") : "";
  };
  const family = decl("font-family").replace(/^['"]|['"]$/g, "");
  const src = decl("src");
  const url = src.includes("local(") ? "" : (/url\(([^)]+)\)/.exec(src) || [, ""])[1];
  if (!family || !url) continue;
  const range = decl("unicode-range");
  const file = url.split("/").pop();
  let bytes = null;
  try { bytes = statSync(resolve(root, ".next/static/media", file)).size; } catch { /* not emitted */ }
  faces.push({
    family, file, url, bytes, range,
    spans: range ? parseRanges(range) : [],
    coversRupee: range ? parseRanges(range).some(([lo, hi]) => RUPEE >= lo && RUPEE <= hi) : false,
  });
}

const inter = faces.filter((f) => /^Inter$/.test(f.family));
const interFaces = inter.filter((f) => f.bytes);
console.log("Inter faces as the BUILD declares them:");
for (const f of interFaces) {
  console.log(`  ${(f.bytes / 1024).toFixed(1).padStart(6)} KB  ${f.file}  rupee-in-range=${f.coversRupee}`);
  console.log(`          range: ${f.range}`);
}
const latin = interFaces.find((f) => /u\+00\?\?/.test(f.range) && !f.coversRupee);
const latinExt = interFaces.find((f) => f.coversRupee && f.bytes > 40_000);
console.log(JSON.stringify({
  latinFace: latin?.file, latinFaceKB: latin && (latin.bytes / 1024).toFixed(1),
  latinExtFace: latinExt?.file, latinExtFaceKB: latinExt && (latinExt.bytes / 1024).toFixed(1),
  rupeeInLatinRange: Boolean(latin?.coversRupee), rupeeInLatinExtRange: Boolean(latinExt?.coversRupee),
}));
if (!latinExt) { console.error("no Inter face covering U+20B9 found — cannot run the A/B"); process.exit(1); }

// ── 2 + 3. per URL: which characters hit latin-ext, and does stripping the rupee stop it ───
async function launch() {
  try { return await chromium.launch(); }
  catch { return await chromium.launch({ channel: "chrome" }); }
}
const browser = await launch();

const sitemapText = await (await fetch(`${BASE}/sitemap.xml`)).text();
const allPaths = [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname);
const targets = argPaths.length
  ? argPaths
  : allPaths.filter((p) => /^(\/(sarkari-naukri|admission|board-exam|university-exam)\/[^/]+\/[^/]+)$/.test(p)).slice(0, 6);

const scanScript = ({ extSpans }) => {
  const hits = [];
  const inRange = (cp) => extSpans.some(([lo, hi]) => cp >= lo && cp <= hi);
  const walkText = (node, where) => {
    for (const ch of node.nodeValue || "") {
      const cp = ch.codePointAt(0);
      if (cp < 0x80) continue;
      if (inRange(cp)) hits.push({ cp, ch, where, snippet: (node.nodeValue || "").slice(0, 70) });
    }
  };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const el = n.parentElement;
    walkText(n, el ? `${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""}` : "?");
  }
  for (const el of document.querySelectorAll("body *")) {
    for (const pseudo of ["::before", "::after"]) {
      const c = getComputedStyle(el, pseudo).content;
      if (!c || c === "none") continue;
      const text = c.replace(/^["']|["']$/g, "");
      for (const ch of text) {
        const cp = ch.codePointAt(0);
        if (cp >= 0x80 && inRange(cp)) hits.push({ cp, ch, where: `${el.tagName.toLowerCase()} ${pseudo}`, snippet: text.slice(0, 70) });
      }
    }
  }
  const byCp = {};
  for (const h of hits) (byCp["U+" + h.cp.toString(16).toUpperCase()] ||= { count: 0, samples: [] }).count++,
    (byCp["U+" + h.cp.toString(16).toUpperCase()].samples ||= []).push(h.where + " :: " + h.snippet);
  return Object.fromEntries(Object.entries(byCp).map(([k, v]) => [k, { count: v.count, samples: v.samples.slice(0, 3) }]));
};

for (const path of targets) {
  const extSpans = latinExt.spans;
  const rupeeFile = latinExt.file;

  // --- A: as served
  const ctxA = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const pageA = await ctxA.newPage();
  const reqA = [];
  pageA.on("request", (r) => { if (r.url().includes(rupeeFile)) reqA.push(r.url()); });
  await pageA.goto(BASE + path, { waitUntil: "load", timeout: 90_000 });
  await pageA.evaluate(() => document.fonts.ready);
  await pageA.waitForTimeout(1200);
  const chars = await pageA.evaluate(scanScript, { extSpans });

  // --- B: the same page with U+20B9 removed from the response (HTML + flight payload)
  const ctxB = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const pageB = await ctxB.newPage();
  const reqB = [];
  pageB.on("request", (r) => { if (r.url().includes(rupeeFile)) reqB.push(r.url()); });
  await pageB.route(BASE + path, async (route) => {
    const res = await route.fetch();
    const body = (await res.body()).toString("utf8").replace(/\u20b9/g, "");
    await route.fulfill({ response: res, body });
  });
  await pageB.goto(BASE + path, { waitUntil: "load", timeout: 90_000 });
  await pageB.evaluate(() => document.fonts.ready);
  await pageB.waitForTimeout(1200);
  const rupeesLeft = await pageB.evaluate(() => (document.body.innerText.match(/\u20b9/g) || []).length);

  console.log(JSON.stringify({
    path,
    latinExtRequested_asServed: reqA.length > 0,
    latinExtRequested_rupeeStripped: reqB.length > 0,
    rupeeCharsLeftInStrippedPage: rupeesLeft,
    charactersInLatinExtRange_asServed: chars,
  }, null, 1));

  await ctxA.close();
  await ctxB.close();
}

await browser.close();
