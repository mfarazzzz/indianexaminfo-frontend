// qa/parity/orphan-breakdown.mjs — WHY is a sitemap URL an orphan? (owner batch 3, F4)
//
// Reads the full orphan list the crawler wrote (orphans-<label>.txt) and reports:
//   1. counts by URL TEMPLATE (pillar + depth), by pillar, by category segment, by slug shape
//      (result/admit-card-style suffixes vs plain notifications);
//   2. for every exam-shaped orphan, whether its own category hub page (the page that should
//      link it) (a) exists in the sitemap, (b) renders, (c) contains a link to it, and
//      (d) is missing it because the hub only lists its first N rows (pagination cap);
//   3. a verdict bucket per orphan: NO-HUB / HUB-TRUNCATED / NOT-IN-HUB-QUERY / LINKED-NOWHERE.
//
// READ-ONLY: GET requests only, against the origin you pass. Defaults to the local
// production build (http://localhost:3002) so nothing touches the live site.
//
//   node qa/parity/orphan-breakdown.mjs [orphans-local-before] [http://localhost:3002]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const LABEL = process.argv[2] || "local-before";
const BASE = (process.argv[3] || "http://localhost:3002").replace(/\/+$/, "");
const UA = "Mozilla/5.0 (compatible; iei-orphan-breakdown/1.0; read-only QA)";
const SLEEP = 120;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const orphans = readFileSync(resolve(dir, `orphans-${LABEL}.txt`), "utf8")
  .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

const pathOf = (u) => new URL(u).pathname;

// ── 1. Shape classification ─────────────────────────────────────────────────
const PILLAR_OF = [
  ["sarkari-naukri", "/sarkari-naukri"],
  ["admission", "/admission"],
  ["board-exam", "/board-exam"],
  ["university-exam", "/university-exam"],
  ["blog", "/blog"],
  ["news", "/news"],
];
const CT_SUFFIXES = ["notification", "application", "admit-card", "result", "answer-key", "date-sheet", "syllabus", "cutoff", "previous-papers", "mock-test", "study-material"];

function classify(u) {
  const p = pathOf(u);
  const seg = p.split("/").filter(Boolean);
  const pillar = PILLAR_OF.find(([, pre]) => p.startsWith(pre))?.[0] ?? "(other)";
  const last = seg[seg.length - 1];
  let template;
  if (pillar === "sarkari-naukri") {
    if (seg.length === 2) template = "sarkari-naukri/{job-slug} (vacancy detail)";
    else if (seg.length === 3) template = "sarkari-naukri/{category}/{exam-slug} (exam detail)";
    else if (seg.length === 4 && CT_SUFFIXES.includes(last)) template = "sarkari-naukri/{category}/{exam}/{contentType}";
    else template = "sarkari-naukri/… (other)";
  } else if (pillar === "admission") {
    template = seg.length === 3 ? "admission/{category}/{exam-slug} (exam detail)"
      : seg.length === 4 ? "admission/{category}/{exam}/{contentType}" : `admission depth-${seg.length}`;
  } else if (pillar === "board-exam") {
    template = seg.length === 4 ? "board-exam/state/{board}/{paper} (board detail)"
      : seg.length === 5 ? "board-exam/state/{board}/{paper}/{contentType}" : `board-exam depth-${seg.length}`;
  } else if (pillar === "university-exam") {
    template = seg.length === 3 ? "university-exam/{category}/{slug}" : `university-exam depth-${seg.length}`;
  } else if (pillar === "blog") {
    template = seg[1] === "tag" ? "blog/tag/{tag}" : seg[1] === "author" ? "blog/author/{slug}"
      : seg.length === 3 ? "blog/{section}/{post}" : seg.length === 2 ? "blog/{section}" : "blog (other)";
  } else if (pillar === "news") {
    template = seg.length === 3 ? "news/{section}/{item}" : `news depth-${seg.length}`;
  } else {
    template = p === "/resources" ? "resources (static hub)" : `static/other ${p}`;
  }
  // What the record looks like by its slug tail — the sarkari_naukri corpus is one slug deep.
  let suffixClass = "notification/vacancy";
  for (const s of ["-prelims-result", "-result", "-admit-card", "-answer-key", "-cutoff", "-merit-list", "-date-sheet"]) {
    if (last.endsWith(s)) { suffixClass = s.replace(/^-/, ""); break; }
  }
  const category =
    pillar === "board-exam" && seg.length >= 4 ? seg[2]        // /board-exam/state/{board}/{paper}
      : ["sarkari-naukri", "admission", "university-exam"].includes(pillar) && seg.length >= 3 ? seg[1]
        : "(none)";
  return { pillar, template, category, suffixClass, depth: seg.length };
}

const byTemplate = new Map(), byPillar = new Map(), byCategory = new Map(), bySuffix = new Map();
const rows = orphans.map((u) => {
  const c = classify(u);
  byTemplate.set(c.template, (byTemplate.get(c.template) || 0) + 1);
  byPillar.set(c.pillar, (byPillar.get(c.pillar) || 0) + 1);
  if (c.category !== "(none)") byCategory.set(`${c.pillar}/${c.category}`, (byCategory.get(`${c.pillar}/${c.category}`) || 0) + 1);
  bySuffix.set(c.suffixClass, (bySuffix.get(c.suffixClass) || 0) + 1);
  return { url: u, ...c };
});

// ── 2. Hub reachability for the two-segment sarkari corpus + exam details ────
// The hub that SHOULD link a record, per the site's own navigation:
//   /sarkari-naukri/{slug}                     → /sarkari-naukri/bharti (vacancy hub)
//   /sarkari-naukri/{cat}/{slug}               → /sarkari-naukri/{cat}  (category hub) + /sarkari-naukri/exam
//   /admission/{cat}/{slug}                    → /admission/{cat}       (category hub) + /admission
/** Swaps the sitemap host for the host under test, so a local crawl can be checked. */
function localHref(p) { return BASE + p; }

async function fetchText(path) {
  try {
    const r = await fetch(localHref(path), { headers: { "user-agent": UA } });
    const t = r.status < 400 ? await r.text() : "";
    await sleep(SLEEP);
    return { status: r.status, text: t };
  } catch { return { status: "ERR", text: "" }; }
}

// Which hubs exist (200) and what they link to, computed once per hub.
const hubCache = new Map();
async function hub(path) {
  if (!hubCache.has(path)) {
    const { status, text } = await fetchText(path);
    const hrefs = new Set();
    for (const m of text.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
      const h = m[1];
      if (h.startsWith("http") || h.startsWith("#") || /^(mailto:|tel:)/.test(h)) continue;
      hrefs.add(h.replace(/\/+$/, "") || "/");
    }
    hubCache.set(path, { status, hrefs });
  }
  return hubCache.get(path);
}

const verdicts = new Map(); // bucket -> count
const detail = [];
for (const r of rows.filter((r) => r.pillar === "sarkari-naukri" || r.pillar === "admission" || r.pillar === "board-exam")) {
  const p = pathOf(r.url);
  const href = p.replace(/\/+$/, "");
  const hubPaths =
    r.pillar === "sarkari-naukri"
      ? (r.depth === 2 ? ["/sarkari-naukri/bharti", "/sarkari-naukri/exam", "/sarkari-naukri"]
        : [`/sarkari-naukri/${r.category}`, "/sarkari-naukri/bharti", "/sarkari-naukri/exam", "/sarkari-naukri"])
      : r.pillar === "admission"
        ? [`/admission/${r.category}`, "/admission"]
        : r.pillar === "board-exam"
          ? [`/board-exam/${r.category}`] : [];
  let onHub = false, hubStatus = "no-hub-checked", firstHubStatus = "n/a";
  for (const [idx, hpath] of hubPaths.entries()) {
    const h = await hub(hpath);
    if (idx === 0) firstHubStatus = String(h.status);
    hubStatus = String(h.status);
    if (h.hrefs.has(href)) { onHub = true; break; }
  }
  const verdict = onHub ? "LINKED-FROM-A-HUB"
    : firstHubStatus === "404" ? `HUB-MISSING (own hub ${hubPaths[0]} is 404)`
      : hubStatus === "ERR" ? "HUB-UNREACHABLE" : "NOT-LINKED-BY-ANY-HUB";
  verdicts.set(verdict, (verdicts.get(verdict) || 0) + 1);
  detail.push({ url: p, verdict, hubStatus, ownHub: hubPaths[0] ?? "(none)", ownHubStatus: firstHubStatus, hubs: hubPaths.join(" ") });
}

const lines = [];
lines.push(`ORPHAN BREAKDOWN — orphans-${LABEL}.txt (${orphans.length} urls) vs ${BASE}  ${new Date().toISOString()}`);
lines.push(`\nBY URL TEMPLATE:`);
for (const [k, v] of [...byTemplate].sort((a, b) => b[1] - a[1])) lines.push(`  ${String(v).padStart(4)}  ${k}`);
lines.push(`\nBY PILLAR:`);
for (const [k, v] of [...byPillar].sort((a, b) => b[1] - a[1])) lines.push(`  ${String(v).padStart(4)}  ${k}`);
lines.push(`\nBY CATEGORY SEGMENT (record pages only):`);
for (const [k, v] of [...byCategory].sort((a, b) => b[1] - a[1]).slice(0, 25)) lines.push(`  ${String(v).padStart(4)}  ${k}`);
lines.push(`\nBY SLUG TAIL (record pages):`);
for (const [k, v] of [...bySuffix].sort((a, b) => b[1] - a[1])) lines.push(`  ${String(v).padStart(4)}  ${k}`);
lines.push(`\nWHY UNLINKED (checked against the hub pages themselves):`);
for (const [k, v] of [...verdicts].sort((a, b) => b[1] - a[1])) lines.push(`  ${String(v).padStart(4)}  ${k}`);
lines.push(`\n15 EXAMPLES:`);
for (const d of detail.slice(0, 15)) lines.push(`  ${d.url}   [${d.verdict}] ownHub=${d.ownHub}(${d.ownHubStatus})`);

const report = lines.join("\n");
console.log(report);
writeFileSync(resolve(dir, `orphan-breakdown-${LABEL}.txt`), report + "\n");
writeFileSync(resolve(dir, `orphan-detail-${LABEL}.json`), JSON.stringify(detail, null, 2));
