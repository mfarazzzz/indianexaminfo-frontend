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
  const lcpNode = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node;
  // WHAT actually moved (F5): Lighthouse reports every shifting node with its own CLS contribution.
  const shiftNodes = (a["layout-shift-elements"]?.details?.items ?? [])
    .map((i) => ({
      score: Number((i.score || 0).toFixed(5)),
      selector: i.node?.selector || "",
      label: (i.node?.nodeLabel || "").slice(0, 70),
      snippet: (i.node?.snippet || "").slice(0, 120),
      paintLocation: i.node?.boundingRect ? `${Math.round(i.node.boundingRect.top)}px top, ${Math.round(i.node.boundingRect.height)}px h` : "",
    }))
    .sort((x, y) => y.score - x.score);
  // WHAT blocked the main thread (F7): long tasks with their script and duration.
  const longTasks = (a["long-tasks"]?.details?.items ?? [])
    .map((t) => ({ duration: Math.round(t.duration || 0), url: (t.url || "").replace(/^https?:\/\/[^/]+/, "").slice(0, 70) }))
    .sort((x, y) => y.duration - x.duration);
  return {
    lcp: a["largest-contentful-paint"].numericValue,
    tbt: a["total-blocking-time"].numericValue,
    cls: a["cumulative-layout-shift"].numericValue,
    totalBytes: a["total-byte-weight"].numericValue,
    requests: reqs.length, jsBytes,
    fontCount: fontReqs.length, fontBytes: fontReqs.reduce((s, x) => s + (x.transferSize || 0), 0),
    fonts: fontReqs.map((f) => ({ url: (f.url || "").replace(/^https?:\/\/[^/]+/, ""), kb: kb(f.transferSize || 0) })),
    imgCount: imgReqs.length, imgBytes: imgReqs.reduce((s, x) => s + (x.transferSize || 0), 0),
    topImages: imgReqs.slice(0, 3).map((x) => ({ url: (x.url || "").replace(/^https?:\/\/[^/]+/, "").slice(0, 60), kb: kb(x.transferSize || 0), mime: x.mimeType || "" })),
    lcpElement: lcpNode ? { label: (lcpNode.nodeLabel || "").slice(0, 70), selector: lcpNode.selector || "" } : null,
    shiftNodes, longTasks,
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
    lcpElement: runs[Math.floor(runs.length / 2)].lcpElement,
    fonts: runs[Math.floor(runs.length / 2)].fonts,
    // The middle run's trace is representative; the shifts are deterministic enough to name.
    shiftNodes: runs.map((r) => r.shiftNodes).sort((x, y) => y.length - x.length)[0],
    longTasks: runs.map((r) => r.longTasks).sort((x, y) => y.length - x.length)[0],
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
    `  LCP element: ${m.lcpElement ? `${m.lcpElement.selector} "${m.lcpElement.label}"` : "(unknown)"}\n` +
    `  largest images: ${m.topImages.map((i) => `${i.kb}KB ${i.mime.replace("image/", "")} ${i.url}`).join("  |  ")}\n` +
    `  font files: ${(m.fonts || []).map((f) => `${f.kb}KB ${f.url.split("/").pop()}`).join("  |  ")}\n` +
    `  layout shifts (${(m.shiftNodes || []).reduce((s, x) => s + x.score, 0).toFixed(3)} total):\n` +
    (m.shiftNodes || []).slice(0, 6).map((s) => `    ${s.score}  ${s.selector}  [${s.paintLocation}]  "${s.label}"`).join("\n") + "\n" +
    `  longest tasks:\n` +
    (m.longTasks || []).slice(0, 4).map((t) => `    ${t.duration}ms  ${t.url}`).join("\n"),
  );
}
const report = lines.join("\n");
writeFileSync(resolve(dir, `lighthouse-${label}.txt`), report + "\n");
writeFileSync(resolve(dir, `lighthouse-${label}.json`), JSON.stringify(out, null, 2));
console.log("\n" + report);
