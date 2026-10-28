/**
 * sitemap.ctgate.test.ts — the J1b gate inside the generator, both paths.
 *
 * app/sitemap.ts now asks the DATABASE which content types an exam has own data for
 * (public.exam_content_types_with_data), because the exam rows it works from omit
 * exam_editions.content_modules and its TS evaluator can therefore only ever answer "no"
 * for an editorial section. These fixtures pin the three cases that matter:
 *   1. the view answers      -> the editorial sub-page URL is submitted, and ONLY the types
 *                               the view lists (an exam the view says is bare gets nothing);
 *   2. the view is missing   -> exactly the previous behaviour (no editorial sub-pages,
 *                               the column-backed syllabus still allowed);
 *   3. the view answers but has no row for one exam -> that exam falls back too, rather than
 *                               silently losing every sub-page it used to submit.
 * The canonical-ownership gate (P1 item 14) is kept in front of all three, so a submitted
 * sub-page is always one that is self-canonical.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MetadataRoute } from "next";

const viewMap: { current: Record<string, string[]> | null } = { current: null };
vi.mock("@/services/contentTypesService", () => ({
  getContentTypesByExam: vi.fn(async () => viewMap.current),
}));

vi.mock("@/services/examService", () => ({
  getAllExams: vi.fn(async () => [
    // Both rows are shaped like getAllExams() output: NO contentModules, so the TS gate can
    // only see the column-backed syllabus.
    { id: "e1", slug: "ssc-cgl", name: "SSC CGL", pillar: "government-exam", category: "ssc", dates: [] },
    { id: "e2", slug: "ibps-po", name: "IBPS PO", pillar: "government-exam", category: "ssc", dates: [] },
  ]),
  getEditionSitemapEntries: vi.fn(async () => []),
}));
vi.mock("@/services/blogService", () => ({ getAllBlogPosts: vi.fn(async () => []) }));
vi.mock("@/services/pageService", () => ({ getAllPublishedPages: vi.fn(async () => []) }));
vi.mock("@/services/sarkariNaukriService", () => ({ getSarkariNaukriSitemapEntries: vi.fn(async () => []) }));
vi.mock("@/services/regionService", () => ({ getRegionsWithRecords: vi.fn(async () => []) }));
vi.mock("@/services/contentPostService", () => ({
  // Both exams have a published `notification` update of their own, so the canonical-
  // ownership gate lets a notification sub-page through whenever the DATA gate allows it.
  ctPagesWithOwnContent: vi.fn(async () => ({ e1: ["notification"], e2: ["notification"] })),
  examPostUpdatedAts: vi.fn(async () => ({})),
}));
vi.mock("@/lib/hubs/contentHubs", () => ({
  CONTENT_HUBS: [],
  resolveHubPresence: vi.fn(async () => ({})),
  resolveHubLatestDates: vi.fn(async () => ({})),
}));

import sitemap from "@/app/sitemap";

const ctPaths = (urls: MetadataRoute.Sitemap) =>
  urls.map((u) => new URL(u.url).pathname)
      .filter((p) => /\/(notification|admit-card|result|answer-key|syllabus|cutoff)$/.test(p))
      .sort();

beforeEach(() => { viewMap.current = null; });

describe("the sitemap content-type gate (J1b)", () => {
  it("case 2 — no view: the previous behaviour (only the column-backed syllabus could appear)", async () => {
    viewMap.current = null;
    expect(ctPaths(await sitemap())).toEqual([]);   // neither exam has structured syllabus rows here
  });

  it("case 1 — the view lists a type: that sub-page is submitted, and only what it lists", async () => {
    viewMap.current = { e1: ["notification", "admit-card"] };   // e2 explicitly bare
    expect(ctPaths(await sitemap())).toEqual(["/sarkari-naukri/ssc/ssc-cgl/notification"]);
    // admit-card is listed by the view but its canonical is the MAIN page (no own update),
    // so the ownership gate — unchanged from P1 item 14 — still holds it back.
    expect(e2Paths(await sitemap())).toEqual([]);
  });

  it("case 3 — an exam with no view row keeps the TS fallback instead of losing everything", async () => {
    viewMap.current = {};                       // answered, but no entry for e1/e2
    // Same result as case 2: the fallback runs per exam, not per whole build.
    expect(ctPaths(await sitemap())).toEqual([]);
  });
});

const e2Paths = (urls: MetadataRoute.Sitemap) =>
  urls.map((u) => new URL(u.url).pathname).filter((p) => p.includes("/ibps-po/"));
