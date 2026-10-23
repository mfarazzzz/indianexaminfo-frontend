// qa/parity/apex-check.mjs — READ-ONLY host canonicalisation check.
//
// Search Console reports two properties (apex + www). Two hosts serving the same pages
// split every signal, so the question is narrow: does the bare domain hand over to www
// in ONE hop, and does every page's own <link rel="canonical"> agree?
//
// This walks each path on both hosts with redirect: "manual" so the chain is visible
// (status + Location per hop, up to 5), then reads the canonical tag on whatever the
// final URL serves. Nothing is written anywhere.
//
//   node qa/parity/apex-check.mjs [path ...]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const APEX = process.env.APEX_URL || "https://indianexaminfo.com";
const WWW = process.env.WWW_URL || "https://www.indianexaminfo.com";

const DEFAULT_PATHS = [
  "/",
  "/sarkari-naukri/central-government-jobs/isro-scientist-engine",
  "/university-exam/state-university/mdu-rohtak-exam/notification",
  "/sitemap.xml",
  "/robots.txt",
];
const paths = process.argv.slice(2).filter((a) => a.startsWith("/"));
const targets = paths.length ? paths : DEFAULT_PATHS;

/** Follow redirects by hand so every hop (status + Location) is reportable. */
async function chain(url) {
  const hops = [];
  let current = url;
  for (let i = 0; i < 5; i++) {
    let res;
    try {
      res = await fetch(current, { redirect: "manual", headers: { "user-agent": "qa-apex-check" } });
    } catch (e) {
      hops.push(`${current} -> FETCH ERROR ${e.message.split("\n")[0]}`);
      return { hops, final: current, status: "ERR", body: "" };
    }
    const loc = res.headers.get("location");
    hops.push(`${current} -> ${res.status}${loc ? ` Location: ${loc}` : ""}`);
    if (!loc) return { hops, final: current, status: res.status, body: res.status < 400 ? await res.text().catch(() => "") : "" };
    current = /^https?:/.test(loc) ? loc : new URL(loc, current).toString();
  }
  return { hops, final: current, status: ">5 hops", body: "" };
}

const canonicalOf = (html) => (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] ?? "(none)";
const lines = [];

for (const host of [["APEX", APEX], ["WWW", WWW]]) {
  for (const p of targets) {
    const r = await chain(host[1] + p);
    const canon = r.body ? canonicalOf(r.body) : "(not read)";
    const onWww = canon.startsWith(WWW);
    lines.push(
      `[${host[0]}] ${p}  final=${r.final}  status=${r.status}\n` +
      `  chain: ${r.hops.join("  |  ")}\n` +
      `  canonical: ${canon}  ${canon === "(none)" || canon === "(not read)" ? "" : onWww ? "(www)" : "*** NOT www ***"}`,
    );
  }
}

const report = lines.join("\n");
console.log(report);
writeFileSync(resolve(dir, "apex-check.txt"), report + "\n");
