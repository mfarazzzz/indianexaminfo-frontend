/**
 * qa/parity/vacancy-link-coverage.mjs — K5 (owner batch 4): is every vacancy record reachable
 * by a crawler that starts from the sitemap and only follows links?
 *
 * WHY THIS EXISTS AND THE CRAWLER CANNOT ANSWER IT. crawl-hygiene.mjs calls a URL an orphan when
 * no OTHER SITEMAP PAGE links to it. The page-by-page vacancy list (/sarkari-naukri/jobs/page/N)
 * is deliberately NOT in the sitemap (owner decision), so the records it newly links to still
 * score as "orphans" there even though Googlebot can now walk to them in two hops. This script
 * measures the thing that actually matters: does the set of pages reachable from the sitemap
 * WITHOUT clicking anything contain a link to each vacancy record?
 *
 * It reports the same coverage BEFORE and AFTER the pagination, using only what the server
 * answers today: the vacancy URLs the /sarkari-naukri HTML itself links to (the 20-row fold —
 * the whole corpus is in the DOM but only `shown` rows are rendered as anchors), and the union
 * of that with every /jobs/page/N anchor.
 *
 * READ-ONLY: GET requests against a local production build.
 *   node qa/parity/vacancy-link-coverage.mjs [http://localhost:3002]
 */
const BASE = (process.argv[2] || "http://localhost:3002").replace(/\/+$/, "");
const UA = "Mozilla/5.0 (compatible; iei-vacancy-coverage/1.0; read-only QA)";

const get = async (path) => {
  const res = await fetch(BASE + path, { headers: { "user-agent": UA } });
  return { status: res.status, html: await res.text() };
};

const hrefsOn = (html) => {
  const out = new Set();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const raw = m[1];
    try {
      const u = new URL(raw, BASE);
      if (u.origin === new URL(BASE).origin) out.add(u.pathname);
    } catch { /* a relative/odd href is simply not a link we count */ }
  }
  return out;
};

const sitemap = await get("/sitemap.xml");
const locs = [...(await sitemap.html).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
// The corpus this feature is about: FLAT /sarkari-naukri/{slug} vacancy record URLs. A category
// hub has the same depth, so a record is identified by the sitemap generator's own rule: it is
// submitted, and it is not one of the known hub/listing paths.
const HUBS = new Set(["/sarkari-naukri", "/sarkari-naukri/exam", "/sarkari-naukri/bharti", "/sarkari-naukri/state", "/sarkari-naukri/resources"]);
const records = locs.filter((p) => /^\/sarkari-naukri\/[^/]+$/.test(p) && !HUBS.has(p) && !p.endsWith("/state"));
const statePages = locs.filter((p) => /^\/sarkari-naukri\/state\/[^/]+$/.test(p));
const pagination = locs.filter((p) => p.startsWith("/sarkari-naukri/jobs/page/"));

const root = await get("/sarkari-naukri");
const rootLinks = hrefsOn(root.html);
const linkedFromRoot = records.filter((r) => rootLinks.has(r));

// The page chain: /sarkari-naukri's trail anchors, then whatever those pages link to. The
// pagination pages are NOT in the sitemap (that is the point), so the chain is discovered by
// following the anchors from the root page instead of assuming a count.
const queue = [...rootLinks].filter((p) => p.startsWith("/sarkari-naukri/jobs/page/"));
const visited = new Set();
const chainLinks = new Set();
for (let i = 0; i < queue.length; i++) {
  const p = queue[i];
  if (visited.has(p) || visited.size > 80) continue;
  visited.add(p);
  const page = await get(p);
  if (page.status !== 200) { console.log(`  chain page ${p} → HTTP ${page.status}`); continue; }
  for (const h of hrefsOn(page.html)) {
    chainLinks.add(h);
    if (h.startsWith("/sarkari-naukri/jobs/page/") && !visited.has(h)) queue.push(h);
  }
}

const covered = records.filter((r) => rootLinks.has(r) || chainLinks.has(r));
const uncovered = records.filter((r) => !rootLinks.has(r) && !chainLinks.has(r));

console.log(JSON.stringify({
  sitemapUrls: locs.length,
  vacancyRecordsInSitemap: records.length,
  paginationPagesInSitemap: pagination.length,
  chainPagesVisited: visited.size,
  linkedFromSarkariNaukriAlone: linkedFromRoot.length,
  coveredViaSitemapPagePlusChain: covered.length,
  stillUncovered: uncovered.length,
  statePagesInSitemap: statePages.length,
}, null, 1));
console.log("first uncovered (up to 15):", uncovered.slice(0, 15));
console.log("chain pages:", [...visited].sort().join(" "));
