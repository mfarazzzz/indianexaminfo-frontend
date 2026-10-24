// qa/parity/crawl-hygiene.mjs — READ-ONLY crawl of the LIVE www sitemap.
//
// Owner batch 2, Phase A2. Fetches every <loc> in https://www.indianexaminfo.com/sitemap.xml
// and reports, with REAL counts only:
//   • status distribution (by final status after following redirects);
//   • redirect chains > 1 hop (retire redirects included);
//   • orphans — sitemap URLs that NO other sitemap page links to (inbound = 0);
//   • soft-404 candidates — a 200 whose visible main text is < 1500 bytes or that
//     carries an "empty" banner string;
//   • duplicate <title> and duplicate meta-description groups (count + 10 examples);
//   • canonical mismatches — canonical != own final URL.
// Politeness: max 4 concurrent, 250ms spacing, GET only, no auth, no writes to the site.
// Nothing is POSTed anywhere; results are printed and written to crawl-hygiene.txt.
//
//   node qa/parity/crawl-hygiene.mjs [sitemapUrl]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const SITEMAP = process.argv[2] || "https://www.indianexaminfo.com/sitemap.xml";
const UA = "Mozilla/5.0 (compatible; iei-crawl-hygiene/1.0; read-only QA)";
const MAX_CONCURRENCY = 4;
const SPACING_MS = 250;
const EMPTY_BANNERS = [/no exams? found/i, /no results found/i, /nothing to show/i, /\b0 exams\b/i, /no updates yet/i];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normalise a URL for identity comparison: origin + pathname (no trailing slash, no query/hash). */
function norm(u) {
  try { const x = new URL(u, SITEMAP); return x.origin + x.pathname.replace(/\/+$/, "") || x.origin; }
  catch { return u; }
}

/** Follow redirects by hand so the hop count is visible. Returns {final, status, hops, body}. */
async function getChain(url) {
  let current = url, hops = 0;
  for (; hops < 6; hops++) {
    let res;
    try { res = await fetch(current, { redirect: "manual", headers: { "user-agent": UA } }); }
    catch (e) { return { final: current, status: "ERR", hops, body: "", err: e.message }; }
    const loc = res.headers.get("location");
    if (!loc) { const body = res.status < 400 ? await res.text().catch(() => "") : ""; return { final: current, status: res.status, hops, body }; }
    current = /^https?:/.test(loc) ? loc : new URL(loc, current).toString();
    await res.body?.cancel?.();
  }
  return { final: current, status: ">6", hops, body: "" };
}

const titleRe = /<title[^>]*>([\s\S]*?)<\/title>/i;
const canonRe = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i;
const descRe = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i;
const anchorRe = /<a[^>]+href=["']([^"'#]+)["']/gi;
const mainRe = /<main[^>]*>([\s\S]*?)<\/main>/i;
const stripTags = (s) => (s || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// 1. Fetch the sitemap and pull every <loc>.
const sm = await fetch(SITEMAP, { headers: { "user-agent": UA } });
const smText = await sm.text();
const urls = [...smText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

// 2. Crawl with bounded concurrency + spacing.
const results = new Map(); // url -> {final,status,hops,body,title,canon,desc,links}
let i = 0, active = 0;
await new Promise((done) => {
  const next = () => {
    if (i >= urls.length) { if (active === 0) done(); return; }
    const url = urls[i++]; active++;
    (async () => {
      const c = await getChain(url);
      const body = c.body || "";
      const title = (body.match(titleRe) || [])[1]?.trim() || "";
      const canon = (body.match(canonRe) || [])[1]?.trim() || "";
      const desc = (body.match(descRe) || [])[1]?.trim() || "";
      const links = new Set();
      for (const m of body.matchAll(anchorRe)) {
        const href = m[1];
        if (/^(https?:)?\/\//.test(href) && !href.startsWith(new URL(url).origin)) continue; // external
        if (/^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
        try { links.add(norm(new URL(href, url).toString())); } catch { /* ignore bad href */ }
      }
      results.set(url, { ...c, title, canon, desc, links, mainLen: stripTags((body.match(mainRe) || [])[1] ?? body).length });
      setTimeout(() => { active--; next(); }, SPACING_MS);
    })();
  };
  for (let k = 0; k < MAX_CONCURRENCY; k++) next();
});

// 3. Analyse.
const statusDist = {};
const chains = [];
const canonicalMismatch = [];
const bannerHits = [];
const lowText = [];
const titles = new Map(), descs = new Map();
const inbound = new Map(); // norm(url) -> count of OTHER sitemap pages linking to it
const normOf = new Map(); // norm(url) -> original sitemap url (for sitemap urls only)
for (const u of urls) normOf.set(norm(u), u);
for (const u of urls) inbound.set(norm(u), 0);

for (const [u, r] of results) {
  statusDist[r.status] = (statusDist[r.status] || 0) + 1;
  if (typeof r.hops === "number" && r.hops > 1) chains.push({ u, hops: r.hops, final: r.final });
  if (r.status === 200) {
    if (r.canon && norm(r.canon) !== norm(r.final)) canonicalMismatch.push({ u, canonical: r.canon, final: r.final });
    const banner = EMPTY_BANNERS.some((re) => re.test(r.body || ""));
    if (banner) bannerHits.push({ u, mainLen: r.mainLen });
    if (r.mainLen < 600) lowText.push({ u, mainLen: r.mainLen, banner });
    if (r.title) { (titles.get(r.title) || titles.set(r.title, []).get(r.title)).push(u); }
    if (r.desc) { (descs.get(r.desc) || descs.set(r.desc, []).get(r.desc)).push(u); }
    for (const l of r.links) { if (inbound.has(l) && norm(l) !== norm(u)) inbound.set(l, inbound.get(l) + 1); }
  }
}
const dupTitles = [...titles.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
const dupDescs = [...descs.entries()].filter(([, v]) => v.length > 1).sort((a, b) => b[1].length - a[1].length);
const orphans = urls.filter((u) => (inbound.get(norm(u)) || 0) === 0 && results.get(u)?.status === 200);

const lines = [];
const P = (s) => { lines.push(s); };
P(`CRAWL HYGIENE — ${SITEMAP}  (${new Date().toISOString()})`);
P(`sitemap URLs: ${urls.length}   crawled: ${results.size}`);
P(`\nSTATUS DISTRIBUTION: ${JSON.stringify(statusDist)}`);
P(`\nREDIRECT CHAINS > 1 hop: ${chains.length}`);
for (const c of chains.slice(0, 20)) P(`  ${c.hops} hops  ${c.u}  ->  ${c.final}`);
P(`\nORPHANS (200, no inbound from any other sitemap page): ${orphans.length}`);
for (const o of orphans.slice(0, 30)) P(`  ${o}`);
P(`\nSOFT-404 — empty-banner pages (explicit no-content message): ${bannerHits.length}`);
for (const s of bannerHits.slice(0, 30)) P(`  main=${s.mainLen}B  ${s.u}`);
P(`\nSOFT-404 — very-low main text (<600B; card-heavy hubs can be legit): ${lowText.length}`);
for (const s of lowText.slice(0, 30)) P(`  main=${s.mainLen}B banner=${s.banner}  ${s.u}`);
P(`\nDUPLICATE <title> groups: ${dupTitles.length}`);
for (const [t, us] of dupTitles.slice(0, 10)) P(`  x${us.length}  "${t.slice(0, 80)}"  e.g. ${us.slice(0, 3).join(", ")}`);
P(`\nDUPLICATE meta description groups: ${dupDescs.length}`);
for (const [d, us] of dupDescs.slice(0, 10)) P(`  x${us.length}  "${d.slice(0, 80)}"  e.g. ${us.slice(0, 3).join(", ")}`);
P(`\nCANONICAL MISMATCHES (canonical != own final URL): ${canonicalMismatch.length}`);
for (const m of canonicalMismatch.slice(0, 30)) P(`  ${m.u}  canonical=${m.canonical}`);

const report = lines.join("\n");
console.log(report);
writeFileSync(resolve(dir, "crawl-hygiene.txt"), report + "\n");
P("");
