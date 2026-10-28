/**
 * examService.getExamBySlug.test.ts — a read failure is never a fake 404 (owner batch 3, F2).
 *
 * WHY: the sitemap listed /admission/... URLs for records that are published in the database,
 * and the crawl got 404 for five of them (christ-cuet, ibsat, amu-entrance, ilicat, nid-dat),
 * while the SAME urls served 200 minutes later. The records never changed. The reason is in
 * this function: every Supabase error used to fall through to `return null`, and null is what
 * the route reads as notFound(). So one Cloudflare 522/525 blip during a cold crawl answered
 * "this page does not exist" — a permanent-looking signal to a crawler — instead of a retryable
 * error. getExamsByCategory had already been fixed for exactly this (see its comment); the
 * detail lookup is the same bug class.
 *
 * The rule proven here:
 *   • every attempt ERRORED            -> the promise REJECTS (the page renders the error
 *                                         boundary and the crawler can retry);
 *   • an attempt was clean and empty   -> the promise resolves null (a real 404 stays a 404).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

type Outcome = { data?: unknown; error?: unknown };

const outcomes: { exams: Outcome[] } = { exams: [] };
let examQueryCount = 0;

function builderFor(store: () => Outcome) {
  const b: Record<string, unknown> = {};
  const chain = () => b;
  b.select = chain; b.eq = chain; b.ilike = chain; b.neq = chain; b.in = chain;
  b.order = chain; b.limit = chain; b.single = chain; b.maybeSingle = chain;
  let call = 0;
  const resolve = () => { const o = store(); call++; return o; };
  b.maybeSingle = async () => { examQueryCount++; return resolve(); };
  b.single = async () => resolve();
  b.then = undefined;
  return b;
}

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    from: (table: string) => {
      if (table === "exams") return builderFor(() => outcomes.exams[Math.min(examQueryCount, outcomes.exams.length - 1)] ?? { data: null, error: null });
      // exam_syllabus_subjects / exam_editions / derived-status lookups: answer "nothing extra".
      return builderFor(() => ({ data: [], error: null }));
    },
  }),
}));

// `cached()` is Next's unstable_cache wrapper, which needs a runtime incremental cache that
// does not exist under vitest. The function under test is the data path, so run it directly.
vi.mock("@/lib/cache", () => ({ cached: (fn: () => Promise<unknown>) => fn() }));

import { getExamBySlug } from "@/services/examService";

beforeEach(() => { examQueryCount = 0; });

describe("getExamBySlug — transport failure is not a 404", () => {
  it("rejects with the upstream error when every lookup attempt errored", async () => {
    const blip = { code: "FETCH_ERROR", message: "upstream 522" };
    outcomes.exams = [{ data: null, error: blip }];
    // Asserted on the REASON, not merely on rejection: a rejection for any other cause
    // (e.g. a broken harness) must not be read as this rule passing.
    await expect(getExamBySlug(`blip-probe-${Date.now()}`)).rejects.toBe(blip);
  });

  it("still resolves null for a clean miss (a genuine 404 stays a 404)", async () => {
    outcomes.exams = [{ data: null, error: null }];
    await expect(getExamBySlug(`genuine-miss-${Date.now()}`)).resolves.toBeNull();
  });
});
