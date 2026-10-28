/**
 * sitemap.routableUrls.test.ts — the sitemap never lists a URL the router 404s (owner batch 3, F2).
 *
 * The live crawl found 2 of 763 sitemap URLs answering 404. Both came from a generator block
 * that trusted the DATABASE instead of the ROUTER:
 *   • `/blog/author/indianexaminfo-editorial` — the author list came from every distinct
 *     post.author.slug in the DB, but /blog/author/[slug] resolves the slug against the
 *     editorial roster in data/authors.ts and calls notFound() for anything else.
 *   • `/test` — every published CMS `pages` row was submitted as `/{slug}`, yet no route
 *     renders an arbitrary page row (only about / privacy-policy / disclaimer read the table).
 *
 * Nothing here hits the network; the same fixtures prove the rule. The end-to-end proof
 * against the real router is e2e/sitemap-no-404.e2e.spec.ts (runs against the production
 * build and asks Next itself for every URL in the sitemap).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MetadataRoute } from "next";

vi.mock("@/services/examService", () => ({
  getAllExams: vi.fn(async () => [
    {
      id: "e1", slug: "ssc-cgl", name: "SSC CGL", pillar: "government-exam", category: "ssc",
      hasNotification: true, hasResult: true, dates: [],
    },
    {
      id: "e6", slug: "neet-ug", name: "NEET UG", pillar: "entrance-exam", category: "medical",
      dates: [],
    },
    {
      id: "e7", slug: "up-board-class-10", name: "UP Board 10th", pillar: "board-exam", category: "up-board",
      dates: [],
    },
    {
      id: "e8", slug: "du-cuet", name: "CUET", pillar: "university-exam", category: "state-university",
      dates: [],
    },
    // K3 — banking rows are NO LONGER withheld as a class; the hub has a submitted child again.
    {
      id: "e3", slug: "ibps-po", name: "IBPS PO", pillar: "government-exam", category: "banking", dates: [],
    },
    // A category whose hub 308s — neither the hub nor its rows are submitted.
    {
      id: "e4", slug: "up-police", name: "UP Police", pillar: "government-exam", category: "state-government-jobs", dates: [],
    },
    // K3 — the RETIRE losers: published records whose URL the router answers with a 308. They
    // must never be submitted, and their content-type children must go with them.
    {
      id: "e9", slug: "cds", name: "CDS (entrance twin)", pillar: "entrance-exam", category: "defence-entrance",
      hasNotification: true, dates: [],
    },
    {
      id: "e10", slug: "nta-ugc-net", name: "UGC NET (twin)", pillar: "government-exam", category: "teaching", dates: [],
    },
    // K3 — the WINNERS on the slugs that used to be withheld wholesale.
    {
      id: "e11", slug: "cds-exam", name: "CDS", pillar: "government-exam", category: "defence", dates: [],
    },
    {
      id: "e12", slug: "rpf-constable", name: "RPF Constable", pillar: "government-exam", category: "railways", dates: [],
    },
    // A reference TEST record must never reach the sitemap.
    {
      id: "e2", slug: "zz-test-government-exam", name: "ZZ Test Exam", pillar: "government-exam",
      category: "ssc", dates: [],
    },
  ]),
  getEditionSitemapEntries: vi.fn(async () => []),
}));
vi.mock("@/services/blogService", () => ({
  getAllBlogPosts: vi.fn(async () => [
    // A roster author (the route renders this page) and a DB-only author (it 404s).
    { id: "p1", slug: "post-one", section: "exam-prep", updatedAt: "2026-10-01T00:00:00Z", author: { slug: "priya-sharma" }, tags: [] },
    { id: "p2", slug: "post-two", section: "exam-prep", updatedAt: "2026-10-02T00:00:00Z", author: { slug: "indianexaminfo-editorial" }, tags: [] },
  ]),
}));
vi.mock("@/services/pageService", () => ({
  getAllPublishedPages: vi.fn(async () => [
    { id: "g1", slug: "test", title: "Test", status: "published", isSystem: false, updatedAt: "2026-10-01T00:00:00Z" },
    { id: "g2", slug: "about", title: "About", status: "published", isSystem: true, updatedAt: "2026-10-01T00:00:00Z" },
    { id: "g3", slug: "pricing", title: "Pricing", status: "published", isSystem: false, updatedAt: "2026-10-01T00:00:00Z" },
  ]),
}));
vi.mock("@/services/sarkariNaukriService", () => ({
  // The source service does NOT drop test rows — the generator has to. Nor does it know the
  // redirect table: `upsc-cds` below is a real vacancy row whose URL 308s (E3), so the
  // sitemap's last gate has to catch a FLAT url too, not just the category form.
  getSarkariNaukriSitemapEntries: vi.fn(async () => [
    { slug: "up-police-constable-2026", updatedAt: "2026-10-03T00:00:00Z" },
    { slug: "zz-test-vacancy-2026", updatedAt: "2026-10-03T00:00:00Z" },
    { slug: "upsc-cds", updatedAt: "2026-10-03T00:00:00Z" },
  ]),
}));
vi.mock("@/services/regionService", () => ({ getRegionsWithRecords: vi.fn(async () => []) }));
vi.mock("@/services/contentPostService", () => ({
  ctPagesWithOwnContent: vi.fn(async () => ({ e1: ["result"] })),
  examPostUpdatedAts: vi.fn(async () => ({})),
}));
// The J1b content-type view gate: these fixtures exercise the FALLBACK path (no view), so
// the generator must not reach for the network. The answered path is app/sitemap.ctgate.test.ts.
vi.mock("@/services/contentTypesService", () => ({ getContentTypesByExam: vi.fn(async () => null) }));
vi.mock("@/lib/hubs/contentHubs", () => ({
  CONTENT_HUBS: [{ href: "/results", label: "Results", contentType: "result" }],
  resolveHubPresence: vi.fn(async () => ({ "/results": true })),
  resolveHubLatestDates: vi.fn(async () => ({ "/results": null })),
}));

import sitemap, { ROUTABLE_CMS_PAGE_PATHS, submitted } from "@/app/sitemap";
import { authors } from "@/data/authors";
import { siteConfig } from "@/config/site";
import { pathIsRedirectSource } from "@/config/redirects";
import { RETIRE_REDIRECTS } from "@/config/retireRedirects";

const BASE = siteConfig.url;
let urls: MetadataRoute.Sitemap;
let paths: string[];

beforeEach(async () => {
  urls = await sitemap();
  paths = urls.map((u) => new URL(u.url).pathname);
});

describe("the sitemap only submits URLs the router renders (F2)", () => {
  it("does not submit a CMS page that no route renders", () => {
    expect(paths).not.toContain("/test");        // the live 404
    expect(paths).not.toContain("/pricing");     // same class of row, not routed
  });

  it("submits a routed CMS page exactly once, at the route's own path", () => {
    expect(paths.filter((p) => p === "/about")).toHaveLength(1);
    for (const slug of Object.keys(ROUTABLE_CMS_PAGE_PATHS)) {
      expect(paths).toContain(ROUTABLE_CMS_PAGE_PATHS[slug]);
    }
  });

  it("submits an author page only for an author the author route knows", () => {
    const roster = new Set(authors.map((a) => a.slug));
    const submitted = paths.filter((p) => p.startsWith("/blog/author/"));
    for (const p of submitted) {
      expect(roster.has(decodeURIComponent(p.split("/").pop() as string)), p).toBe(true);
    }
    // The DB-only author is out; the roster author with posts is in.
    expect(submitted).not.toContain("/blog/author/indianexaminfo-editorial");
    expect(submitted).toContain("/blog/author/priya-sharma");
  });

  it("every URL is well-formed: https origin, single slashes, no test slug", () => {
    for (const u of urls) {
      const parsed = new URL(u.url);
      expect(parsed.origin, u.url).toBe(BASE);
      if (parsed.pathname !== "/") {
        // No empty segment, no trailing slash (the site root is the only "/").
        expect(parsed.pathname, u.url).not.toMatch(/\/\/|\/$/);
      }
      expect(parsed.pathname.toLowerCase(), u.url).not.toContain("zz-test");
    }
    expect(paths).toContain("/sarkari-naukri/up-police-constable-2026"); // real rows still get in
  });

  it("an exam with no category never produces a /{pillar}//{slug} URL", async () => {
    // isSitemapEligible() is the guard; prove the shape it prevents is absent.
    expect(paths.some((p) => p.includes("//"))).toBe(false);
  });
});

/**
 * F4 — the category hub is the parent of every exam in it. It renders an uncapped
 * ExamListRow loop and is self-canonical (verified against the production build), but the
 * generator never submitted it, so a sitemap-scoped crawl saw the children as orphans.
 */
describe("category hubs are submitted where the hub really renders (F4)", () => {
  it("submits the hub of every pillar whose listing page is self-canonical", () => {
    expect(paths).toContain("/sarkari-naukri/ssc");
    expect(paths).toContain("/admission/medical");
  });

  it("never submits a hub whose own URL 308s", () => {
    expect(paths).not.toContain("/sarkari-naukri/state-government-jobs");
    expect(paths).not.toContain("/sarkari-naukri/central-government-jobs");
  });

  it("K3 — the withheld-as-a-class categories are submitted again", () => {
    // Batch 3 withheld banking/railways/defence/teaching wholesale as a conservative choice.
    // The owner's K3 decision removes it: these hubs render a real self-canonical listing and
    // the retire WINNERS live on these slugs, so withholding them hid the better page.
    expect(paths).toContain("/sarkari-naukri/banking");
    expect(paths).toContain("/sarkari-naukri/banking/ibps-po");
    expect(paths).toContain("/sarkari-naukri/defence/cds-exam");
    expect(paths).toContain("/sarkari-naukri/railways/rpf-constable");
    expect(paths).toContain("/sarkari-naukri/defence");
    expect(paths).toContain("/sarkari-naukri/railways");
  });

  it("K1 — the board and university hubs enter once their own canonical exists", () => {
    expect(paths).toContain("/board-exam/state/up-board");
    expect(paths).toContain("/university-exam/state-university");
    // The bare /board-exam/{category} form 308s to the state route, so it is still not submitted.
    expect(paths).not.toContain("/board-exam/up-board");
  });

  it("submits each hub once, with no lastmod (a listing has no single honest date)", () => {
    for (const p of ["/sarkari-naukri/ssc", "/admission/medical"]) {
      const hits = urls.filter((u) => new URL(u.url).pathname === p);
      expect(hits, p).toHaveLength(1);
      expect(hits[0].lastModified, `${p} lastmod`).toBeUndefined();
    }
  });
});

/**
 * K3 (owner batch 4) — "never submit a URL that is a redirect source".
 * The generator builds URLs from the database and the database does not know the redirect
 * table, so a published loser row is otherwise submitted as if it were a page.
 */
describe("the sitemap never submits a URL the router redirects (K3)", () => {
  it("no submitted URL matches any rule in config/redirects.ts", () => {
    for (const p of paths) {
      expect(pathIsRedirectSource(p), `${p} is a redirect source`).toBe(false);
    }
  });

  it.each(RETIRE_REDIRECTS.map((r) => [r.source, r.destination] as const))(
    "the retire loser %s is out and its winner %s is in",
    (source, destination) => {
      expect(paths).not.toContain(source);
      expect(paths).not.toContain(`${source}/notification`);   // no orphaned child of a 308
      // Only the winners this fixture actually contains a row for can be expected.
      const winnerSlug = (destination.split("/").pop() ?? "");
      if (urls.some((u) => new URL(u.url).pathname.split("/").pop() === winnerSlug)) {
        expect(paths).toContain(destination);
      }
    },
  );

  it("drops the retire losers this fixture carries and keeps the winners", () => {
    expect(paths).not.toContain("/admission/defence-entrance/cds");       // → /sarkari-naukri/defence/cds-exam
    expect(paths).not.toContain("/sarkari-naukri/teaching/nta-ugc-net");  // → /admission/research-fellowships/ugc-net
    expect(paths).toContain("/sarkari-naukri/defence/cds-exam");
    expect(paths).not.toContain("/admission/defence-entrance");           // its only row was the loser
  });

  it("applies the same gate to a FLAT vacancy URL whose slug 308s (E3)", () => {
    expect(paths).not.toContain("/sarkari-naukri/upsc-cds");
    expect(paths).toContain("/sarkari-naukri/up-police-constable-2026");
  });

  it("emits each URL at most once", () => {
    const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dupes).toEqual([]);
  });

  it("the last gate itself is honest about what it removes (unit)", () => {
    const out = submitted([
      { url: `${BASE}/sarkari-naukri/central-government-jobs` },
      { url: `${BASE}/sarkari-naukri/exam` },
      { url: `${BASE}/sarkari-naukri/exam` },
      { url: `${BASE}/result` },
      { url: `${BASE}/results` },
    ]);
    expect(out.map((u) => new URL(u.url).pathname)).toEqual(["/sarkari-naukri/exam", "/results"]);
  });
});
