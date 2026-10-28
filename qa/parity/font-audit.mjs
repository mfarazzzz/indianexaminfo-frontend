// qa/parity/font-audit.mjs — every font a public page actually downloads (owner batch 3, F6).
//
// For each target URL it reports, per .woff2 request:
//   family (the next/font generated name + the CSS variable it backs), weight, style,
//   subset (derived from the @font-face unicode-range), transfer KB,
// and which elements on the page resolve to that family (count + the first real samples).
// Also flags a family/weight that is DECLARED in the global CSS but never USED by any
// element, and the font family of the element above the fold (first visible text node).
//
// Local build only (read-only): it starts no server, so run `npm start` first.
//
//   node qa/parity/font-audit.mjs [http://localhost:3002] [label]
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || "http://localhost:3002").replace(/\/+$/, "");
const LABEL = process.argv[3] || "before";

// The SAME six URLs the Lighthouse harness measures (qa/parity/lighthouse.mjs TARGETS),
// so the font numbers and the LCP numbers describe the same pages.
const TARGETS = [
  ["home", "/"],
  ["exam (ssc-cgl)", "/sarkari-naukri/ssc/ssc-cgl"],
  ["entrance (jee-main)", "/admission/engineering/jee-main"],
  ["board (up-board-class-10)", "/board-exam/state/up-board/up-board-class-10"],
  ["hub (/results)", "/results"],
  ["blog article", "/blog/exam-prep/clat-2026-preparation-strategy"],
];

/** unicode-range → a readable subset name, from the codepoints actually in the range. */
function subsetOf(range) {
  if (!range) return "unknown";
  const cps = [];
  for (const m of range.toUpperCase().matchAll(/U\+([0-9A-F]{4,6})(?:-([0-9A-F]{4,6}))?/g)) {
    cps.push(parseInt(m[1], 16));
    if (m[2]) cps.push(parseInt(m[2], 16));
  }
  if (!cps.length) return "unknown";
  const inBlock = (lo, hi) => cps.some((c) => c >= lo && c <= hi);
  // Named by the highest block the file covers. Google ships the non-latin subsets with
  // basic latin included, so the DEVANAGARI check must come first; the rest only needs to
  // distinguish "plain latin" from anything wider, and the raw range is printed too.
  if (inBlock(0x0900, 0x097F)) return "devanagari";
  if (inBlock(0x0370, 0x03FF)) return "greek";
  if (inBlock(0x0400, 0x04FF)) return "cyrillic";
  if (inBlock(0x1E00, 0x1EFF)) return "vietnamese";
  if (inBlock(0x0041, 0x007A)) return cps.some((c) => c > 0x00FF && c < 0x0300 && ![0x0131, 0x0152, 0x0153, 0x02BB, 0x02BC, 0x02C6, 0x02DA, 0x02DC].includes(c)) ? "latin(+ext)" : "latin";
  return `other(${cps.length} ranges)`;
}

/**
 * Launch the installed browser. The pinned @playwright/test build may not match the
 * chromium revision cached under %LOCALAPPDATA%\ms-playwright (no download is performed
 * here), so fall back to the system Chrome, which the Lighthouse harness already uses.
 */
async function launch() {
  try { return await chromium.launch(); }
  catch (e) {
    console.error(`bundled browser unavailable (${String(e.message).split("\n")[0]}); using channel=chrome`);
    return await chromium.launch({ channel: "chrome" });
  }
}

const browser = await launch();
const out = [];

for (const [name, path] of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  const fontReqs = [];
  page.on("response", async (res) => {
    const u = res.url();
    if (!/\.woff2?(\?|$)/.test(u)) return;
    let kb = 0;
    try {
      const body = await res.body();
      kb = Math.round((body.length / 1024) * 10) / 10;
    } catch { /* binary of a redirect, ignore */ }
    fontReqs.push({ url: u, kb });
  });

  await page.goto(BASE + path, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(1200);

  const faces = await page.evaluate(() => {
    const list = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = Array.from(sheet.cssRules); } catch { continue; }
      for (const rule of rules) {
        if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
        const s = rule.style;
        const m = /url\("?([^")]+)"?\)/.exec(s.getPropertyValue("src") || "");
        list.push({
          family: s.getPropertyValue("font-family").replace(/["']/g, ""),
          weight: s.getPropertyValue("font-weight"),
          style: s.getPropertyValue("font-style"),
          display: s.getPropertyValue("font-display"),
          unicodeRange: s.getPropertyValue("unicode-range"),
          url: m ? m[1] : "",
        });
      }
    }
    return list;
  });

  // Which elements resolve to which family, and with what weight.
  const usage = await page.evaluate(() => {
    const acc = {};
    const els = Array.from(document.querySelectorAll("body *"));
    for (const el of els) {
      const cs = getComputedStyle(el);
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
      if (!acc[fam]) acc[fam] = { count: 0, withText: 0, weights: {}, samples: [] };
      acc[fam].count += 1;
      if (own) {
        acc[fam].withText += 1;
        acc[fam].weights[cs.fontWeight] = (acc[fam].weights[cs.fontWeight] || 0) + 1;
        if (acc[fam].samples.length < 3) {
          const r = el.getBoundingClientRect();
          acc[fam].samples.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]} w=${cs.fontWeight} "${el.textContent.trim().slice(0, 34)}"` + (r.top < 740 ? " [above-fold]" : ""));
        }
      }
    }
    return acc;
  });

  const faceByUrl = new Map(faces.map((f) => [f.url, f]));
  const rows = fontReqs.map((r) => {
    const f = faceByUrl.get(r.url) || faceByUrl.get(new URL(r.url).pathname);
    const file = r.url.split("/").pop();
    return {
      file, kb: r.kb,
      family: f?.family ?? "(no @font-face in this page's CSS)",
      weight: f?.weight ?? "?", style: f?.style ?? "?",
      display: f?.display ?? "?",
      subset: subsetOf(f?.unicodeRange),
      range: (f?.unicodeRange || "").split(",").slice(0, 2).join(",").trim(),
    };
  });

  const usedFamilies = new Set(Object.keys(usage));
  const declaredUnused = [...new Set(faces.map((f) => f.family))].filter((fam) => !usedFamilies.has(fam));

  out.push({
    name, path,
    fonts: rows,
    totalKB: Math.round(rows.reduce((s, r) => s + (r.kb || 0), 0) * 10) / 10,
    usage,
    declaredUnused,
    facesCount: faces.length,
  });
  await ctx.close();
}
await browser.close();

const lines = [`FONT AUDIT ${LABEL} — ${BASE}  ${new Date().toISOString()}`, ""];
for (const o of out) {
  lines.push(`${o.name}  [${o.path}]   ${o.fonts.length} font file(s), ${o.totalKB} KB, ${o.facesCount} @font-face rules declared`);
  for (const r of o.fonts) {
    const u = o.usage[r.family] || {};
    lines.push(`  ${String(r.kb).padStart(6)} KB  ${r.family.padEnd(26)} w=${String(r.weight).padEnd(9)} ${r.style.padEnd(4)} ${r.subset.padEnd(12)} display=${String(r.display).padEnd(6)} ${r.file.padEnd(34)} used by ${u.withText ?? 0} text el(s)`);
    lines.push(`                       range=${r.range || "(none)"}${(u.samples || []).length ? `   e.g. ${u.samples[0]}` : ""}`);
  }
  for (const [fam, u] of Object.entries(o.usage)) {
    if (fam.startsWith("system-ui") || fam === "sans-serif" || fam === "serif") continue;
    if (o.fonts.some((r) => r.family === fam)) continue;
    lines.push(`  (no download)  ${fam.padEnd(26)} used by ${u.withText} text element(s) — resolves to a fallback`);
  }
  if (o.declaredUnused.length) lines.push(`  DECLARED BUT UNUSED ON THIS PAGE: ${o.declaredUnused.join(", ")}`);
  lines.push("");
}
const report = lines.join("\n");
console.log(report);
writeFileSync(resolve(dir, `font-audit-${LABEL}.txt`), report + "\n");
writeFileSync(resolve(dir, `font-audit-${LABEL}.json`), JSON.stringify(out, null, 2));
