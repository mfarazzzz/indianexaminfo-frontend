// qa/parity/lighthouse.mjs — Phase A1. Runs the Lighthouse CLI (mobile, slow-4G +
// 4x CPU simulated) against the LOCAL production build (next start -p 3002), 3 passes
// per URL, and reports the MEDIAN of LCP / TBT / CLS / total transfer / requests / JS KB,
// plus the largest images (format, transfer size) and font requests.
//
//   node qa/parity/lighthouse.mjs [label]      # label tags the output file (baseline|after)
//   env CHROME_PATH=<chrome.exe>               # a Chrome build Lighthouse can drive
//
// Lighthouse is installed with `npm install --no-save` (NOT a committed dependency).
// Read-only against localhost; writes only the report + JSON under qa/parity.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.LH_BASE || "http://localhost:3002";
const label = process.argv[2] || "baseline";
const LH_CMD = resolve(dir, "..", "..", "node_modules", ".bin", "lighthouse.cmd");
const RUNS = 3;

const TARGETS = [
  ["home", "/"],
  ["sarkari-exam (ssc-cgl)", "/sarkari-naukri/ssc/ssc-cgl"],
  ["entrance (jee-main)", "/admission/engineering/jee-main"],
  ["board (up-board-class-10)", "/board-exam/state/up-board/up-board-class-10"],
  ["hub (/results)", "/results"],
  ["article (blog)", "/blog/exam-prep/clat-2026-preparation-strategy"],
];

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const kb = (b) => Math.round(b / 1024);

function runOnce(url, tmp) {
  const r = spawnSync(LH_CMD, [
    url, "--only-categories=performance", "--form-factor=mobile", "--throttling-method=simulate",
    "--output=json", `--output-path=${tmp}`, "--chrome-flags=--headless=new --no-sandbox --disable-gpu", "--quiet",
  ], { shell: true, encoding: "utf8" });
  if (!readExists(tmp)) throw new Error(`lighthouse produced no report (exit ${r.status}): ${(r.stderr || "").slice(0, 200)}`);
  const j = JSON.parse(readFileSync(tmp, "utf8"));
  const a = j.audits;
  const reqs = a["network-requests"]?.details?.items ?? [];
  const jsBytes = reqs.filter((x) => x.resourceType === "Script").reduce((s, x) => s + (x.transferSize || 0), 0);
  const fontReqs = reqs.filter((x) => x.resourceType === "Font");
  const imgReqs = reqs.filter((x) => x.resourceType === "Image").sort((x, y) => (y.transferSize || 0) - (x.transferSize || 0));
  const lcpEl = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0];
  return {
    lcp: a["largest-contentful-paint"].numericValue,
    tbt: a["total-blocking-time"].numericValue,
    cls: a["cumulative-layout-shift"].numericValue,
    totalBytes: a["total-byte-weight"].numericValue,
    requests: reqs.length, jsBytes,
    fontCount: fontReqs.length, fontBytes: fontReqs.reduce((s, x) => s + (x.transferSize || 0), 0),
    topImages: imgReqs.slice(0, 3).map((x) => ({ url: (x.url || "").replace(/^https?:\/\/[^/]+/, "").slice(0, 60), kb: kb(x.transferSize || 0), mime: x.mimeType || "" })),
    lcpImage: lcpEl ? { url: (lcpEl.url || "").replace(/^https?:\/\/[^/]+/, "").slice(0, 60) } : null,
    score: j.categories?.performance?.score ?? 0,
  };
}
function readExists(p) { try { readFileSync(p); return true; } catch { return false; } }

const out = [];
for (const [name, path] of TARGETS) {
  const url = BASE + path;
  const tmp = resolve(dir, `_lh_tmp_${name.replace(/[^a-z0-9]+/gi, "_")}.json`);
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    try { rmSync(tmp, { force: true }); runs.push(runOnce(url, tmp)); }
    catch (e) { console.error(`${name} run ${i} failed: ${e.message}`); }
  }
  rmSync(tmp, { force: true });
  if (runs.length === 0) { out.push({ name, error: "all runs failed" }); continue; }
  const med = {
    name, url, n: runs.length,
    lcpMs: Math.round(median(runs.map((r) => r.lcp))),
    tbtMs: Math.round(median(runs.map((r) => r.tbt))),
    cls: Number(median(runs.map((r) => r.cls)).toFixed(3)),
    totalKB: kb(median(runs.map((r) => r.totalBytes))),
    requests: Math.round(median(runs.map((r) => r.requests))),
    jsKB: kb(median(runs.map((r) => r.jsBytes))),
    fontCount: Math.round(median(runs.map((r) => r.fontCount))),
    fontKB: kb(median(runs.map((r) => r.fontBytes))),
    perfScore: Number(median(runs.map((r) => r.score)).toFixed(2)),
    topImages: runs[Math.floor(runs.length / 2)].topImages,
    lcpImage: runs[Math.floor(runs.length / 2)].lcpImage,
  };
  out.push(med);
  console.log(`${med.name.padEnd(28)} LCP=${med.lcpMs}ms TBT=${med.tbtMs}ms CLS=${med.cls} total=${med.totalKB}KB req=${med.requests} js=${med.jsKB}KB fonts=${med.fontCount}/${med.fontKB}KB score=${med.perfScore}`);
}

const lines = [`LIGHTHOUSE ${label} (${new Date().toISOString()})  mobile slow-4G + 4x CPU, median of ${RUNS}`, ""];
for (const m of out) {
  if (m.error) { lines.push(`${m.name}: ${m.error}`); continue; }
  lines.push(
    `${m.name}  [${m.url}]  (n=${m.n})\n` +
    `  LCP=${m.lcpMs}ms  TBT=${m.tbtMs}ms  CLS=${m.cls}  perf=${m.perfScore}\n` +
    `  total=${m.totalKB}KB  requests=${m.requests}  JS=${m.jsKB}KB  fonts=${m.fontCount} req / ${m.fontKB}KB\n` +
    `  LCP element: ${m.lcpImage ? m.lcpImage.url : "(non-image)"}\n` +
    `  largest images: ${m.topImages.map((i) => `${i.kb}KB ${i.mime.replace("image/", "")} ${i.url}`).join("  |  ")}`,
  );
}
const report = lines.join("\n");
writeFileSync(resolve(dir, `lighthouse-${label}.txt`), report + "\n");
writeFileSync(resolve(dir, `lighthouse-${label}.json`), JSON.stringify(out, null, 2));
console.log("\n" + report);
