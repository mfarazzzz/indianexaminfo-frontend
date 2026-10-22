/**
 * contentPostService.leak.test.ts — the D-P2 safety rule: an exam-linked update
 * (exam_id set) must NEVER surface through a GENERIC reader (hubs, lists, ticker,
 * RSS, search, the /news slug page). Every generic query must carry
 * `.is("exam_id", null)`; only getContentPostsByExam (the exam page) reads by
 * exam_id. This is the guard that makes "publish an exam update" safe.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cache", () => ({ cached: (fn: () => Promise<unknown>) => fn() }));

type Filter = [string, string, unknown];
let lastFilters: Filter[] = [];

function fakeClient() {
  const make = (): any => {
    const filters: Filter[] = [];
    lastFilters = filters;
    const chain: any = {
      select: () => chain,
      eq: (c: string, v: unknown) => { filters.push([c, "eq", v]); return chain; },
      is: (c: string, v: unknown) => { filters.push([c, "is", v]); return chain; },
      not: (c: string, op: string, v: unknown) => { filters.push([c, "not:" + op, v]); return chain; },
      in: () => chain,
      gte: () => chain,
      or: () => chain,
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: {}, error: null }),
      then: (res: (v: { data: unknown; error: unknown; count: number }) => unknown) =>
        res({ data: [], error: null, count: 0 }),
    };
    return chain;
  };
  return { from: () => make() };
}

let clientRef: ReturnType<typeof fakeClient>;
vi.mock("@/lib/supabase/server", () => ({ createServerClient: () => clientRef as never }));

import {
  getContentPostsByExam, getContentPostBySlug, getLatestByContentType,
  getContentPostsByPillar, getFeaturedContentPosts, searchContentPosts, getLatestContentPosts,
  getTickerUpdates, getHomeBulletin,
} from "@/services/contentPostService";

const hasExamNull = () => lastFilters.some(([c, op, v]) => c === "exam_id" && op === "is" && v === null);

beforeEach(() => { clientRef = fakeClient(); lastFilters = []; });

describe("generic content_post readers exclude exam-linked updates", () => {
  it("getLatestByContentType", async () => { await getLatestByContentType("result", 5); expect(hasExamNull()).toBe(true); });
  it("getLatestContentPosts (ticker + RSS)", async () => { await getLatestContentPosts(10); expect(hasExamNull()).toBe(true); });
  it("getContentPostsByPillar", async () => { await getContentPostsByPillar("government-exam" as never); expect(hasExamNull()).toBe(true); });
  it("getFeaturedContentPosts", async () => { await getFeaturedContentPosts(); expect(hasExamNull()).toBe(true); });
  it("searchContentPosts", async () => { await searchContentPosts("pet"); expect(hasExamNull()).toBe(true); });
  it("getContentPostBySlug (/news page)", async () => { await getContentPostBySlug("some-slug"); expect(hasExamNull()).toBe(true); });
});

describe("the exam-page reader is the ONLY one that reads by exam_id", () => {
  it("getContentPostsByExam filters exam_id = <id> and does NOT exclude exam posts", async () => {
    await getContentPostsByExam("ex-123");
    expect(lastFilters.some(([c, op, v]) => c === "exam_id" && op === "eq" && v === "ex-123")).toBe(true);
    expect(hasExamNull()).toBe(false);
  });
  it("getContentPostsByExam filters status=published, so a DRAFT can never appear publicly", async () => {
    await getContentPostsByExam("ex-123");
    // P0 item 5: the reader must never surface an unpublished draft update.
    expect(lastFilters.some(([c, op, v]) => c === "status" && op === "eq" && v === "published")).toBe(true);
  });
});

// B3/B4 (owner decision 22 Oct): the ticker/home pools are exam-linked BY DESIGN -
// the leak rule is the OTHER direction (exam updates must never surface in the
// generic readers above). These two must filter exam_id NOT NULL and must never
// carry the generic exam_id-is-null filter.
describe("ticker/home pools are exam-linked by design", () => {
  const hasExamNotNull = () => lastFilters.some(([c, op, v]) => c === "exam_id" && op === "not:is" && v === null);
  it("getTickerUpdates filters exam-linked, never generic", async () => {
    await getTickerUpdates(8);
    expect(hasExamNotNull()).toBe(true);
    expect(hasExamNull()).toBe(false);
  });
  it("getHomeBulletin filters exam-linked, never generic", async () => {
    await getHomeBulletin();
    expect(hasExamNotNull()).toBe(true);
    expect(hasExamNull()).toBe(false);
  });
});
