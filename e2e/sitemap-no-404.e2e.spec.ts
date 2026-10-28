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
 *
 * K3 adds the strict second pass (no redirect, canonical must name itself), because a URL
 * that survives a redirect-following check can still be a promise the sitemap cannot keep.
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

  // A -1 here has meant a cold ISR render exceeding 30 s on a page that answers 200 in well
  // under a second when warm (measured: /board-exam/state/up-board/up-board-class-10/2026).
  // The assertion is about what the ROUTER answers, so anything that did not answer at all
  // gets ONE serial retry with a generous timeout before it is counted.
  const retried: { url: string; status: number }[] = [];
  for (const f of failures.filter((f) => f.status < 0)) {
    try {
      const r = await request.get(f.url, { maxRedirects: 5, timeout: 120_000 });
      retried.push({ url: f.url, status: r.status() });
    } catch {
      retried.push({ url: f.url, status: -1 });
    }
  }

  const answered = [...failures.filter((f) => f.status >= 0), ...retried.filter((r) => r.status >= 0)];
  const stillUnanswered = retried.filter((r) => r.status < 0);

  // Documented, owner-approved exceptions (comma-separated pathnames) — empty by default.
  const allow = new Set((process.env.SITEMAP_404_ALLOWLIST || "").split(",").map((s) => s.trim()).filter(Boolean));
  const unexpected = answered.filter((f) => !allow.has(new URL(f.url).pathname));

  expect(
    unexpected,
    `${unexpected.length} sitemap URL(s) the router answered with 4xx/5xx:\n${unexpected.map((f) => `  ${f.status}  ${f.url}`).join("\n")}`,
  ).toEqual([]);

  // A page that never answers within 120 s is reported, not silently passed.
  expect(
    stillUnanswered,
    `${stillUnanswered.length} sitemap URL(s) never answered (transport error or >120 s render):\n${stillUnanswered.map((f) => f.url).join("\n")}`,
  ).toEqual([]);
});

/**
 * K3 (owner batch 4) — "every submitted URL is 200 AND self-canonical".
 *
 * The test above follows redirects, which is right for "the router answers" but says nothing
 * about the promise the sitemap actually makes: a <loc> is a claim that THIS URL is the
 * canonical page. Two ways that claim breaks, both measured here rather than assumed:
 *   • the URL answers 3xx (a retire pair, an E3 typo slug, a year-suffixed admission slug that
 *     the generator built from the database and the database does not know is redirected);
 *   • the URL answers 200 but its <link rel="canonical"> names a different page — the exact
 *     bug class of the root layout's blanket canonical (K1), where a hub declared the home page.
 * Requests are issued with maxRedirects: 0 so a 308 is a FAILURE here, never a follow-along.
 */
test("every sitemap URL answers 200 with its own canonical", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  expect(locs.length).toBeGreaterThan(100);

  const target = new URL(BASE);
  const urls = locs.map((loc) => {
    const u = new URL(loc);
    u.protocol = target.protocol;
    u.host = target.host;
    return u.toString();
  });

  const redirected: { url: string; status: number; location: string }[] = [];
  const notOk: { url: string; status: number }[] = [];
  const wrongCanonical: { url: string; canonical: string | null }[] = [];
  const silentPages: { url: string; noindex: boolean }[] = [];

  for (let i = 0; i < urls.length; i += BATCH) {
    const res = await Promise.all(
      urls.slice(i, i + BATCH).map(async (url) => {
        try {
          const r = await request.get(url, { maxRedirects: 0, timeout: 60_000 });
          return { url, status: r.status(), headers: r.headers(), body: r.status() === 200 ? await r.text() : "" };
        } catch {
          return { url, status: -1, headers: {} as Record<string, string>, body: "" };
        }
      }),
    );
    for (const r of res) {
      if (r.status >= 300 && r.status < 400) {
        redirected.push({ url: r.url, status: r.status, location: (r.headers as Record<string, string>).location ?? "" });
        continue;
      }
      if (r.status !== 200) { notOk.push({ url: r.url, status: r.status }); continue; }
      const canonical = /<link[^>]+rel="canonical"[^>]*href="([^"]+)"/i.exec(r.body)?.[1] ?? null;
      if (canonical === null) {
        // K1's rule is "every route declares its own canonical OR opts out of indexing". A
        // sitemap URL with neither is a page making no claim while the sitemap makes one.
        const noindex = /<meta[^>]+name="robots"[^>]*content="[^"]*noindex/i.test(r.body);
        silentPages.push({ url: r.url, noindex });
        continue;
      }
      const path = new URL(canonical).pathname;
      if (path !== new URL(r.url).pathname) wrongCanonical.push({ url: r.url, canonical });
    }
  }

  const allowRedirect = new Set(csvSet(process.env.SITEMAP_REDIRECT_ALLOWLIST));
  expect(
    redirected.filter((r) => !allowRedirect.has(new URL(r.url).pathname)),
    `${redirected.length} sitemap URL(s) the router redirected instead of answering:\n`
      + redirected.map((r) => `  ${r.status}  ${r.url} → ${r.location}`).join("\n"),
  ).toEqual([]);

  expect(
    notOk,
    `${notOk.length} sitemap URL(s) that did not answer 200:\n${notOk.map((f) => `  ${f.status}  ${f.url}`).join("\n")}`,
  ).toEqual([]);

  const allowCanonical = new Set(csvSet(process.env.SITEMAP_CANONICAL_ALLOWLIST));
  const unexpectedCanonical = wrongCanonical.filter((w) => !allowCanonical.has(new URL(w.url).pathname));
  expect(
    unexpectedCanonical,
    `${unexpectedCanonical.length} sitemap URL(s) whose canonical names another page:\n`
      + unexpectedCanonical.map((w) => `  ${w.url}\n      canonical: ${w.canonical}`).join("\n"),
  ).toEqual([]);

  // A noindex page in the sitemap is a contradiction by itself, so both halves are reported.
  const unclaimed = silentPages.filter((s) => !s.noindex && !allowCanonical.has(new URL(s.url).pathname));
  expect(
    unclaimed,
    `${unclaimed.length} sitemap URL(s) with neither a canonical nor a noindex:\n`
      + unclaimed.map((s) => `  ${s.url}`).join("\n"),
  ).toEqual([]);
  const noindexedButSubmitted = silentPages.filter((s) => s.noindex);
  expect(
    noindexedButSubmitted,
    `${noindexedButSubmitted.length} sitemap URL(s) that are noindex and must leave the sitemap:\n`
      + noindexedButSubmitted.map((s) => `  ${s.url}`).join("\n"),
  ).toEqual([]);
});

/** Comma-separated env → trimmed, non-empty set members. */
function csvSet(value: string | undefined): string[] {
  return (value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
