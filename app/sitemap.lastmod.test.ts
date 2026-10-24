/**
 * sitemap.lastmod.test.ts — the honest <lastmod> rule (owner reader-trust fix, 23 Oct).
 *
 * The live sitemap stamped EVERY URL with the build time. These fixtures pin that the
 * rebuild uses a REAL content date or OMITS lastmod, via the SAME trustworthy rule the
 * pages print (lib/exam/lastUpdated#resolveLastUpdated):
 *   • a human edition edit wins; a published update's date is next; a verification is a
 *     third source; and
 *   • NO trustworthy source (system/stale edition, no update, not verified) → no lastmod
 *     at all — the URL is still submitted, just without a fabricated date.
 * Static + landing pages are omitted; hubs carry the newest date among the rows they list
 * and omit when they have none. Nothing here touches the network: every service is mocked.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MetadataRoute } from "next";

vi.mock("@/services/examService", () => ({
  getAllExams: vi.fn(),
  getEditionSitemapEntries: vi.fn(async () => []),
}));
vi.mock("@/services/blogService", () => ({ getAllBlogPosts: vi.fn(async () => []) }));
vi.mock("@/services/pageService", () => ({ getAllPublishedPages: vi.fn(async () => []) }));
vi.mock("@/services/sarkariNaukriService", () => ({ getSarkariNaukriSitemapEntries: vi.fn(async () => []) }));
vi.mock("@/services/regionService", () => ({ getRegionsWithRecords: vi.fn(async () => []) }));
vi.mock("@/services/contentPostService", () => ({
  ctPagesWithOwnContent: vi.fn(async () => ({})),
  examPostUpdatedAts: vi.fn(async () => ({ b1: ["2026-10-05T00:00:00Z"] } as Record<string, string[]>)),
}));
vi.mock("@/lib/hubs/contentHubs", () => ({
  CONTENT_HUBS: [
    { href: "/admit-card", label: "Admit Card", contentType: "admit-card" },
    { href: "/results", label: "Results", contentType: "result" },
  ],
  resolveHubPresence: vi.fn(async () => ({ "/admit-card": true, "/results": true })),
  resolveHubLatestDates: vi.fn(async () => ({ "/admit-card": "2026-10-09T00:00:00Z", "/results": null } as Record<string, string | null>)),
}));

import { getAllExams } from "@/services/examService";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/config/site";

const BASE = siteConfig.url;
const exam = (over: Record<string, unknown>) => ({
  id: "x", slug: "s", name: "N", pillar: "government-exam", category: "ssc",
  lastUpdated: "2020-01-01", dates: [], ...over,
});

beforeEach(() => {
  vi.mocked(getAllExams).mockResolvedValue([
    // A — a HUMAN edition edit is trustworthy (newest of its sources).
    exam({ id: "a1", slug: "exam-a", editionUpdatedAt: "2026-10-10T00:00:00Z", editionUpdatedBy: "human-uid" }),
    // B — edition edit was by "system" (NOT trustworthy); a published update supplies the date.
    exam({ id: "b1", slug: "exam-b", editionUpdatedAt: "2026-10-01T00:00:00Z", editionUpdatedBy: "system" }),
    // C — no human edition edit, no update; a verification is the source.
    exam({ id: "c1", slug: "exam-c", editionUpdatedBy: null, verifiedAt: "2026-10-07T00:00:00Z" }),
    // D — NO trustworthy source at all → the URL stays, lastmod is omitted.
    exam({ id: "d1", slug: "exam-d", editionUpdatedAt: "2026-10-01T00:00:00Z", editionUpdatedBy: "system", verifiedAt: null }),
  ] as never);
});

const byUrl = (urls: MetadataRoute.Sitemap) =>
  new Map(urls.map((e) => [e.url, e]));

describe("sitemap lastmod — honest, never the build time", () => {
  it("exam URL: a human edition edit sets lastmod; system/no source omits it", async () => {
    const urls = byUrl(await sitemap());
    expect(urls.get(`${BASE}/sarkari-naukri/ssc/exam-a`)?.lastModified).toEqual(new Date("2026-10-10T00:00:00Z"));
    expect(urls.get(`${BASE}/sarkari-naukri/ssc/exam-d`)?.lastModified).toBeUndefined(); // no trustworthy source
    expect("lastModified" in (urls.get(`${BASE}/sarkari-naukri/ssc/exam-d`) as object)).toBe(false);
  });

  it("exam URL: a published update and a verification are each trustworthy sources", async () => {
    const urls = byUrl(await sitemap());
    expect(urls.get(`${BASE}/sarkari-naukri/ssc/exam-b`)?.lastModified).toEqual(new Date("2026-10-05T00:00:00Z")); // the update
    expect(urls.get(`${BASE}/sarkari-naukri/ssc/exam-c`)?.lastModified).toEqual(new Date("2026-10-07T00:00:00Z")); // the verification
  });

  it("hub URL: lastmod from the newest listed date, omitted when there is none", async () => {
    const urls = byUrl(await sitemap());
    expect(urls.get(`${BASE}/admit-card`)?.lastModified).toEqual(new Date("2026-10-09T00:00:00Z"));
    expect(urls.get(`${BASE}/results`)?.lastModified).toBeUndefined(); // present, but no real date
    expect(urls.has(`${BASE}/results`)).toBe(true);                    // the URL is still submitted
  });

  it("static / landing pages carry NO lastmod", async () => {
    const urls = byUrl(await sitemap());
    for (const u of [BASE, `${BASE}/sarkari-naukri`, `${BASE}/about`, `${BASE}/disclaimer`]) {
      expect(urls.get(u)?.lastModified, u).toBeUndefined();
    }
  });

  it("no URL is stamped with the current/build time", async () => {
    const before = Date.now();
    const urls = await sitemap();
    const after = Date.now();
    for (const e of urls) {
      if (!e.lastModified) continue;
      const t = new Date(e.lastModified).getTime();
      // A lastmod that falls inside the build window is the forbidden "now".
      const isNow = t >= before - 1000 && t <= after + 1000;
      expect(isNow, `url ${e.url} looks like the build time`).toBe(false);
    }
  });
});
