/**
 * sitemap.degrade.test.ts — owner batch 9, E2 (option 1): the two modes, and the line between
 * them.
 *
 * THE PROBLEM. `next build` prerenders /sitemap.xml, and before this the generator awaited
 * seven database reads with no guard. One unreachable read therefore took the whole build down:
 *
 *   Error occurred prerendering page "/sitemap.xml".
 *   Export encountered an error on /sitemap.xml/route: /sitemap.xml, exiting the build.
 *
 * Since the ONLY way this site is ever published is a push, a transient Supabase outage at
 * push time blocked publishing entirely.
 *
 * THE TWO MODES THIS FILE PINS
 *   1. BUILD (NEXT_PHASE=phase-production-build) + a failed read  -> RESOLVES with the small
 *      static fallback: home plus the pages that read no rows. There is no previous page to
 *      destroy at build time, and a truthful five-URL index beats no deploy.
 *   2. RUNTIME (a regeneration) + a failed read -> REJECTS, always. Next's ISR keeps serving
 *      the LAST GOOD sitemap when a regeneration throws; a regeneration that RESOLVES replaces
 *      it. Answering the fallback here would overwrite a good 5,000-URL sitemap with eight
 *      URLs because of one timeout — the exact thing K4 ("a failed read is not an empty
 *      answer") exists to prevent.
 *
 * The fallback is ALL-OR-NOTHING on purpose: a partially-built sitemap looks healthy while
 * silently dropping thousands of URLs, which is worse than a deliberately small one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Which read should fail on this test, if any. Mutated per test, read by the mocks below. */
const failAt: { current: string | null } = { current: null };
const boom = (name: string): void => {
  if (failAt.current === name) throw new TypeError("fetch failed");
};

vi.mock("@/services/examService", () => ({
  getAllExams: vi.fn(async () => {
    boom("getAllExams");
    return [
      { id: "e1", slug: "ssc-cgl", name: "SSC CGL", pillar: "government-exam", category: "ssc", dates: [] },
    ];
  }),
  getEditionSitemapEntries: vi.fn(async () => []),
}));
vi.mock("@/services/blogService", () => ({ getAllBlogPosts: vi.fn(async () => []) }));
vi.mock("@/services/pageService", () => ({ getAllPublishedPages: vi.fn(async () => []) }));
vi.mock("@/services/sarkariNaukriService", () => ({
  getSarkariNaukriSitemapEntries: vi.fn(async () => {
    boom("getSarkariNaukriSitemapEntries");
    return [];
  }),
}));
vi.mock("@/services/regionService", () => ({ getRegionsWithRecords: vi.fn(async () => []) }));
vi.mock("@/services/contentTypesService", () => ({
  getContentTypesByExam: vi.fn(async () => {
    boom("getContentTypesByExam");
    return null;
  }),
}));
vi.mock("@/services/contentPostService", () => ({
  ctPagesWithOwnContent: vi.fn(async () => ({})),
  examPostUpdatedAts: vi.fn(async () => ({})),
}));
vi.mock("@/lib/hubs/contentHubs", () => ({
  CONTENT_HUBS: [],
  resolveHubPresence: vi.fn(async () => ({})),
  resolveHubLatestDates: vi.fn(async () => ({})),
}));

import sitemap, { staticFallback } from "@/app/sitemap";

const ORIGINAL_PHASE = process.env.NEXT_PHASE;
const paths = (urls: MetadataRoute.Sitemap) => urls.map((u) => new URL(u.url).pathname);

/** The eight pages that render with no database read at all — the fallback, exactly. */
const FALLBACK_PATHS = [
  "/", "/sarkari-naukri", "/admission", "/blog",
  "/about", "/contact", "/privacy-policy", "/disclaimer",
];

beforeEach(() => {
  failAt.current = null;
  process.env.NEXT_PHASE = "phase-production-build";
});
afterEach(() => {
  failAt.current = null;
  if (ORIGINAL_PHASE === undefined) delete process.env.NEXT_PHASE;
  else process.env.NEXT_PHASE = ORIGINAL_PHASE;
  vi.restoreAllMocks();
});

describe("E2 — a BUILD that cannot read the database ships the static fallback", () => {
  it("resolves instead of throwing when one read fails", async () => {
    failAt.current = "getAllExams";
    const urls = await sitemap();
    expect(paths(urls)).toEqual(FALLBACK_PATHS);
  });

  it("also covers a failure in a DIFFERENT read — the guard is all-or-nothing", async () => {
    failAt.current = "getSarkariNaukriSitemapEntries";
    expect(paths(await sitemap())).toEqual(FALLBACK_PATHS);
  });

  it("emits no database-derived URL, and nothing empty", async () => {
    failAt.current = "getAllExams";
    const urls = await sitemap();
    expect(paths(urls)).not.toContain("/sarkari-naukri/ssc/ssc-cgl");
    expect(urls.length).toBeGreaterThan(0);
    // Every entry is the real site origin, and it is the home page first.
    for (const u of urls) expect(u.url.startsWith(siteConfig.url)).toBe(true);
    expect(urls[0].url).toBe(siteConfig.url);
  });

  it("staticFallback() is the same list, so the two can never drift", () => {
    expect(paths(staticFallback())).toEqual(FALLBACK_PATHS);
  });
});

describe("E2 — a RUNTIME regeneration that cannot read the database must NOT replace a good sitemap", () => {
  it("rejects, so ISR keeps serving the last good copy", async () => {
    delete process.env.NEXT_PHASE;              // `next start`, i.e. a regeneration
    failAt.current = "getAllExams";
    await expect(sitemap()).rejects.toThrow(/fetch failed/);
  });

  it("rejects for a failure in any other read too", async () => {
    delete process.env.NEXT_PHASE;
    failAt.current = "getSarkariNaukriSitemapEntries";
    await expect(sitemap()).rejects.toThrow(/fetch failed/);
  });
});

describe("E2 — the healthy path is unchanged", () => {
  it("a build with every read working still emits the FULL sitemap", async () => {
    const urls = await sitemap();
    const p = paths(urls);
    expect(p).toContain("/sarkari-naukri/ssc/ssc-cgl");   // the database row
    expect(p).toEqual(expect.arrayContaining(FALLBACK_PATHS));
    expect(p.length).toBeGreaterThan(FALLBACK_PATHS.length);
  });

  it("a RUNTIME render with every read working emits the full sitemap too", async () => {
    delete process.env.NEXT_PHASE;
    expect(paths(await sitemap())).toContain("/sarkari-naukri/ssc/ssc-cgl");
  });
});
