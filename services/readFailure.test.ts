/**
 * readFailure.test.ts — a FAILED read is never an empty answer (owner batch 4, K4).
 *
 * The sweep changed ~40 `catch { return [] | null | {} }` sites across the read services to
 * rethrow, and split the `if (error || !data) return null` conflations, because a Supabase
 * blip (Cloudflare 522/525, headers overflow) was being read as "this record does not exist":
 * the route then answered 404 (or an empty list page) and Next CACHED that verdict for the
 * revalidation window. Batch 3 measured exactly that: five /admission URLs answered 404 during
 * a cold crawl and 200 minutes later, with the records published the whole time.
 *
 * Every entry point changed by K4 is listed here and asserted in BOTH directions — the mock
 * answers with an error (must throw) and with a clean miss (must still return null / []), so
 * the fix cannot be "always throw", which would be just as wrong. The three reads the sweep
 * deliberately did NOT convert are asserted too, in the direction they must keep.
 *
 * No network: the Supabase client and the cache wrapper are mocked; `cached()` is executed
 * inline so what is under test is the service function, not Next's cache layer.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const state = vi.hoisted(() => ({
  /** "error" = the read FAILED; "clean" = the read SUCCEEDED and found no rows. */
  mode: "error" as "error" | "clean",
}));

const READ_ERROR = { message: "fetch failed: Cloudflare 522", code: "FETCH_FAILED", details: "", hint: "" };

/**
 * A query builder that is BOTH chainable and awaitable: every method returns another chain,
 * and awaiting a chain yields the mode's result. That is what the real builder does
 * (`await supabase.from(...).select(...).eq(...)`), so the services under test need no
 * per-function fixture.
 */
function chain(): any {
  const result = () =>
    state.mode === "error"
      ? { data: null, error: READ_ERROR }
      : { data: null, error: null };          // a clean miss: no row, no error
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === "then") return (onFulfilled: any, onRejected?: any) => Promise.resolve(result()).then(onFulfilled, onRejected);
      if (prop === "catch") return (fn: any) => Promise.resolve(result()).catch(fn);
      if (prop === "finally") return (fn: any) => Promise.resolve(result()).finally(fn);
      if (prop === "error" || prop === "data") return result()[prop];
      if (typeof prop === "symbol") return undefined;
      return (..._args: any[]) => chain();
    },
  };
  return new Proxy({}, handler);
}

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () =>
    new Proxy({}, {
      get(_t, prop) {
        if (prop === "auth") return { getUser: async () => ({ data: { user: null }, error: null }) };
        if (typeof prop === "symbol") return undefined;
        return (..._args: any[]) => chain();
      },
    }),
}));
// The cache wrapper is orthogonal to this test — run the callback so the SERVICE logic is what
// is asserted. (unstable_cache would otherwise swallow the call in a unit-test environment.)
vi.mock("@/lib/cache", () => ({
  cached: (fn: () => unknown) => fn(),
}));

import * as examService from "@/services/examService";
import * as blogService from "@/services/blogService";
import * as contentPostService from "@/services/contentPostService";
import * as sarkariNaukriService from "@/services/sarkariNaukriService";
import * as pageService from "@/services/pageService";
import * as regionService from "@/services/regionService";
import * as categoryService from "@/services/categoryService";

/** Every K4 entry point: [label, the call]. All take arguments that reach a read. */
const CHANGED: Array<[string, () => Promise<unknown>]> = [
  // examService
  ["examService.getAllExams", () => examService.getAllExams()],
  ["examService.getExamsByPillar", () => examService.getExamsByPillar("government-exam")],
  ["examService.getExamsByRegion", () => examService.getExamsByRegion("uttar-pradesh")],
  ["examService.getFeaturedExams", () => examService.getFeaturedExams()],
  ["examService.getExamsByContentType", () => examService.getExamsByContentType("result")],
  ["examService.getExamsByStatus", () => examService.getExamsByStatus("active")],
  ["examService.getExamEditions", () => examService.getExamEditions("ssc-cgl")],
  ["examService.getExamSyllabus", () => examService.getExamSyllabus("11111111-1111-1111-1111-111111111111", null)],
  ["examService.getEditionSitemapEntries", () => examService.getEditionSitemapEntries()],
  // blogService
  ["blogService.getAllBlogPosts", () => blogService.getAllBlogPosts()],
  ["blogService.getBlogPostBySlug", () => blogService.getBlogPostBySlug("post-one")],
  ["blogService.getBlogPostsBySection", () => blogService.getBlogPostsBySection("exam-prep")],
  ["blogService.getBlogPostsByTag", () => blogService.getBlogPostsByTag("ssc")],
  ["blogService.getAllTags", () => blogService.getAllTags()],
  ["blogService.getBlogAuthorBySlug", () => blogService.getBlogAuthorBySlug("priya-sharma")],
  // contentPostService
  ["contentPostService.getContentPostsByExam", () => contentPostService.getContentPostsByExam("e1")],
  ["contentPostService.getContentPostBySlug", () => contentPostService.getContentPostBySlug("ssc-cgl-2026-notification")],
  ["contentPostService.getLatestByContentType", () => contentPostService.getLatestByContentType("result")],
  ["contentPostService.getContentPostsByPillar", () => contentPostService.getContentPostsByPillar("government-exam")],
  ["contentPostService.ctPagesWithOwnContent", () => contentPostService.ctPagesWithOwnContent()],
  // sarkariNaukriService
  ["sarkariNaukriService.getAllSarkariNaukri", () => sarkariNaukriService.getAllSarkariNaukri()],
  ["sarkariNaukriService.getSarkariNaukriBySlug", () => sarkariNaukriService.getSarkariNaukriBySlug("up-police-constable-2026")],
  ["sarkariNaukriService.getByRecruitmentType", () => sarkariNaukriService.getByRecruitmentType("direct")],
  ["sarkariNaukriService.getByState", () => sarkariNaukriService.getByState("uttar-pradesh")],
  ["sarkariNaukriService.getByDepartment", () => sarkariNaukriService.getByDepartment("uppsc")],
  ["sarkariNaukriService.getByCategory", () => sarkariNaukriService.getByCategory("ssc")],
  ["sarkariNaukriService.getStateList", () => sarkariNaukriService.getStateList()],
  ["sarkariNaukriService.getCategoryList", () => sarkariNaukriService.getCategoryList()],
  ["sarkariNaukriService.getSarkariNaukriSitemapEntries", () => sarkariNaukriService.getSarkariNaukriSitemapEntries()],
  // pageService / regionService / categoryService
  ["pageService.getPageBySlug", () => pageService.getPageBySlug("about")],
  ["pageService.getAllPublishedPages", () => pageService.getAllPublishedPages()],
  ["regionService.getRegion", () => regionService.getRegion("uttar-pradesh")],
  ["regionService.getRegionsWithRecords", () => regionService.getRegionsWithRecords()],
  ["categoryService.getCategoriesByPillar", () => categoryService.getCategoriesByPillar("government-exam")],
];

beforeEach(() => {
  state.mode = "error";
  vi.spyOn(console, "error").mockImplementation(() => {});   // the sweep logs, then rethrows
});

describe("K4 — every swept read rethrows when the read fails", () => {
  it.each(CHANGED)("%s does not answer with an empty result", async (_label, call) => {
    await expect(call()).rejects.toBeTruthy();
  });

  it("the sweep really covers all seven services it changed", () => {
    const services = new Set(CHANGED.map(([label]) => label.split(".")[0]));
    expect([...services].sort()).toEqual([
      "blogService", "categoryService", "contentPostService", "examService",
      "pageService", "regionService", "sarkariNaukriService",
    ]);
    expect(CHANGED.length).toBeGreaterThanOrEqual(34);
  });

  it("the reads that were DELIBERATELY left degrading still answer an empty list", async () => {
    // Three sites are outside the rule on purpose, and each has to keep its old answer or a
    // navigation blip would 500 every page: the mega-menu record read, the exam resource
    // library block and the noindex /search exam read.
    await expect(examService.getUniversityNavRecords()).resolves.toEqual([]);
    await expect(examService.getExamResources("11111111-1111-1111-1111-111111111111")).resolves.toEqual([]);
    await expect(examService.searchExams("ssc")).resolves.toEqual([]);
  });
});

describe("K4 — a CLEAN MISS is still a miss, never an error", () => {
  // The other half of the rule. If these threw, a genuine "no such row" would stop being a
  // 404 and become a 500, which is the same mistake in the opposite direction.
  beforeEach(() => { state.mode = "clean"; });

  it.each([
    ["pageService.getPageBySlug", () => pageService.getPageBySlug("no-such-page")],
    ["regionService.getRegion", () => regionService.getRegion("no-such-region")],
  ])("%s resolves (null / empty) for a row that really is absent", async (_label, call) => {
    const value = await call();
    expect(value === null || value === undefined || Array.isArray(value), String(value)).toBeTruthy();
  });

  it("the list reads resolve to an empty list when the table simply has no matching rows", async () => {
    await expect(sarkariNaukriService.getByState("ladakh")).resolves.toEqual([]);
    await expect(blogService.getAllTags()).resolves.toEqual([]);
  });
});
