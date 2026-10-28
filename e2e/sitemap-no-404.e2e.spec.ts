import { test, expect } from "@playwright/test";

/**
 * The sitemap never lists a URL the router would 404 (owner batch 3, F2).
 *
 * Runs against a real production build (`npm run build` + `npm start`, default
 * http://127.0.0.1:3002) so the ANSWER COMES FROM THE ROUTER itself — this is the check
 * unit tests cannot make, because the 404 was produced by a route (notFound() in
 * /blog/author/[slug]) that the generator did not consult.
 *
 * The local build's sitemap emits ABSOLUTE PRODUCTION urls (siteConfig.url is baked at
 * build), so every <loc> is re-hosted onto the build under test before it is requested.
 * Read-only: GET only, no writes.
 *
 *   npx playwright test --config=playwright.qa.config.ts
 */

const BATCH = 8;
const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3002";

test("every sitemap URL resolves (no 404, no 5xx)", async ({ request }) => {
  const smRes = await request.get("/sitemap.xml");
  expect(smRes.ok(), `sitemap.xml itself must be 200 (got ${smRes.status()})`).toBe(true);
  const xml = await smRes.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  expect(locs.length, "the sitemap must not be empty — an empty crawl proves nothing").toBeGreaterThan(100);

  const target = new URL(BASE);
  const urls = locs.map((loc) => {
    const u = new URL(loc);
    u.protocol = target.protocol;
    u.host = target.host;
    return u.toString();
  });

  const failures: { url: string; status: number }[] = [];
  for (let i = 0; i < urls.length; i += BATCH) {
    const slice = urls.slice(i, i + BATCH);
    const res = await Promise.all(
      slice.map(async (url) => {
        try {
          const r = await request.get(url, { maxRedirects: 5, timeout: 30_000 });
          return { url, status: r.status() };
        } catch {
          // An unreachable host / transport error counts as a failure, never a pass.
          return { url, status: -1 };
        }
      }),
    );
    for (const r of res) if (r.status >= 400 || r.status < 0) failures.push(r);
  }

  // Documented, owner-approved exceptions (comma-separated pathnames) — empty by default.
  const allow = new Set((process.env.SITEMAP_404_ALLOWLIST || "").split(",").map((s) => s.trim()).filter(Boolean));
  const unexpected = failures.filter((f) => !allow.has(new URL(f.url).pathname));

  expect(
    unexpected,
    `${unexpected.length} sitemap URL(s) the router 404s:\n${unexpected.map((f) => `  ${f.status}  ${f.url}`).join("\n")}`,
  ).toEqual([]);
});
