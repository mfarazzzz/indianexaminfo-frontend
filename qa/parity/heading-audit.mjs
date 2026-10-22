// qa/parity/heading-audit.mjs — LIVE heading audit: fetch pages, list every <h2>
// in document order and flag any heading text that appears MORE THAN ONCE on the
// page (the duplicate-section defect class). Read-only; local QA tool; not shipped.
//   node qa/parity/heading-audit.mjs [pathOrUrl ...]
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { writeFileSync } from "node:fs";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SITE_URL || "https://www.indianexaminfo.com";

const DEFAULT_PAGES = [
  ["entrance", "/admission/management/zz-test-entrance-exam"],
  ["government", "/sarkari-naukri/zz-test-government-exam"],
  ["govt-vacancy", "/sarkari-naukri/zz-test-govt-vacancy"],
  ["board", "/board-exam/state/uttar-pradesh/zz-test-board-exam"],
  ["university", "/university-exam/state-university/zz-test-university-exam"],
];

// argv entries are either a bare path ("/x/y") or a full URL; a "name=path" form
// is accepted too so a CT page can be labelled in the output.
function argPages() {
  const out = [];
  for (const a of process.argv.slice(2)) {
    const [maybeName, maybePath] = a.split("=");
    if (maybePath) out.push([maybeName, maybePath]);
    else out.push([a.split("/").filter(Boolean).join("-") || "root", a]);
  }
  return out;
}

const pages = argPages().length ? argPages() : DEFAULT_PAGES;
const lines = [];

for (const [name, path] of pages) {
  const url = /^https?:/.test(path) ? path : BASE + path;
  let html = "";
  let status = "ERR";
  try {
    const res = await fetch(url, { headers: { "user-agent": "qa-heading-audit" } });
    status = res.status;
    html = await res.text();
  } catch (e) {
    lines.push(`${name}  FETCH FAILED ${e.message.split("\n")[0]}  ${url}`);
    continue;
  }
  const heads = [...html.matchAll(/<h([12])\b[^>]*>([\s\S]*?)<\/h\1>/g)]
    .map((m) => ({ level: m[1], text: m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() }))
    .filter((h) => h.text);
  const counts = new Map();
  for (const h of heads) counts.set(h.text, (counts.get(h.text) ?? 0) + 1);
  const dupes = [...counts.entries()].filter(([, n]) => n > 1);
  lines.push(`${name}  ${status}  ${url}`);
  lines.push(`  h1 x${heads.filter((h) => h.level === "1").length}: ${heads.filter((h) => h.level === "1").map((h) => h.text).join(" | ")}`);
  lines.push(`  h2 (${heads.filter((h) => h.level === "2").length}): ${heads.filter((h) => h.level === "2").map((h) => h.text).join(" | ")}`);
  lines.push(dupes.length ? `  DUPLICATES: ${dupes.map(([t, n]) => `"${t}" x${n}`).join(", ")}` : "  DUPLICATES: none");
  // a header-only section shell (heading with no following content) shows up as an
  // empty <section>: capture those too.
  const shells = [...html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)]
    .map((m) => m[1].replace(/<h[12][\s\S]*?<\/h[12]>/g, "").replace(/<caption[\s\S]*?<\/caption>/g, "").replace(/<[^>]+>/g, "").trim())
    .filter((t) => t.length === 0).length;
  lines.push(`  empty-section-shells: ${shells}`);
}

const report = lines.join("\n");
console.log(report);
writeFileSync(resolve(dir, "heading-audit.txt"), report + "\n");
console.log(`saved -> qa/parity/heading-audit.txt`);
