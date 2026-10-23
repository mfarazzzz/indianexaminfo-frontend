// qa/parity/seo-audit.mjs — read-only SEO surface audit.
// For each URL it prints the <title>, meta description, rel=canonical, robots and the <h1>,
// so the pillar page and its content-type pages can be compared for cannibalisation.
//   node qa/parity/seo-audit.mjs <pathOrUrl> [<pathOrUrl> ...]
//   node qa/parity/seo-audit.mjs --exam <basePath> [ct1 ct2 ...]   (defaults to the CT list)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SITE_URL || "https://www.indianexaminfo.com";
const DEFAULT_CTS = ["notification", "admit-card", "result", "syllabus", "cutoff", "answer-key"];

const arg = process.argv.slice(2);
let urls = [];
if (arg[0] === "--exam") {
  const base = arg[1];
  const cts = arg.slice(2).length ? arg.slice(2) : DEFAULT_CTS;
  urls = [base, ...cts.map((c) => `${base}/${c}`)];
} else {
  urls = arg;
}
if (urls.length === 0) {
  console.error("give URLs, or: --exam /sarkari-naukri/<category>/<slug>");
  process.exit(2);
}

const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
};

const lines = [];
for (const u of urls) {
  const url = /^https?:/.test(u) ? u : BASE + u;
  let html = "", status = "ERR";
  try {
    const r = await fetch(url, { headers: { "user-agent": "qa-seo-audit" } });
    status = r.status;
    html = await r.text();
  } catch (e) {
    lines.push(`${u}\n  FETCH FAILED ${e.message.split("\n")[0]}`);
    continue;
  }
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const desc = pick(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = pick(html, /<link rel="canonical" href="([^"]*)"/i);
  const robots = pick(html, /<meta name="robots" content="([^"]*)"/i);
  const h1 = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, "");
  lines.push(
    `${u}  [${status}]\n  title:     ${title}\n  desc:      ${desc.slice(0, 140)}\n  canonical: ${canonical}\n  robots:    ${robots}\n  h1:        ${h1}`,
  );
}
const report = lines.join("\n");
console.log(report);
writeFileSync(resolve(dir, "seo-audit.txt"), report + "\n");
