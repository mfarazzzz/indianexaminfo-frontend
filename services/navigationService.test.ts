/**
 * navigationService.test.ts — the mega-menu status bug (Part 1 / A2).
 *
 * `exams.status` was DROPPED (step 4). getExamsForCategory and searchExamsInPillar
 * still selected it, so the query threw 42703, the `if (error) throw error` was
 * caught, and BOTH returned [] — the category lists and in-pillar search silently
 * empty, and the Postgres log spammed. These tests pin the fix:
 *  - the exams projection must NOT name a `status` column;
 *  - status now comes from the exam_derived_status VIEW (the same single source
 *    examService uses), defaulting to "upcoming" when the view has no row;
 *  - results actually come back (not []).
 * Mocks the Supabase client the way examService.hubs.test.ts does.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/cache", () => ({ cached: (fn: () => Promise<unknown>) => fn() }));

type Call = { table: string; select: string; filters: [string, string, unknown][] };

function fakeClient(fixture: Record<string, unknown[]>) {
  const calls: Call[] = [];
  const make = (table: string): any => {
    const record: Call = { table, select: "", filters: [] };
    calls.push(record);
    const chain: any = {
      select: (s: string) => { record.select = s; return chain; },
      eq: (c: string, v: unknown) => { record.filters.push([c, "eq", v]); return chain; },
      in: () => chain,
      or: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (res: (v: { data: unknown; error: unknown }) => unknown) =>
        res({ data: fixture[table] ?? [], error: null }),
    };
    return chain;
  };
  return { calls, from: (table: string) => make(table) };
}

let clientRef: ReturnType<typeof fakeClient> | null = null;
vi.mock("@/lib/supabase/server", () => ({ createServerClient: () => clientRef as never }));

import { getExamsForCategory, searchExamsInPillar } from "@/services/navigationService";

const examRow = {
  id: "e1", slug: "upsssc-pet", short_name: "UPSSSC PET", name: "UPSSSC PET 2026",
  is_featured: false, category_id: "c1", pillar: "government-exam",
  categories: { slug: "state-government-jobs" },
};

beforeEach(() => { clientRef = null; });

describe("getExamsForCategory — status from the VIEW, not the dropped column", () => {
  it("does not select any status column from exams", async () => {
    clientRef = fakeClient({ exams: [examRow], exam_derived_status: [] });
    await getExamsForCategory("c1");
    const examCall = clientRef!.calls.find((c) => c.table === "exams")!;
    expect(examCall.select).not.toMatch(/\bstatus\b/);
  });

  it("returns rows (not the old silent []) and sources status from exam_derived_status", async () => {
    clientRef = fakeClient({
      exams: [examRow],
      exam_derived_status: [{ exam_id: "e1", derived_status: "result-declared", strip_eligible: false, has_confirmed_dates: true, admit_card_date: null, result_date: null }],
    });
    const out = await getExamsForCategory("c1");
    expect(out.map((e) => e.id)).toEqual(["e1"]);
    expect(out[0].status).toBe("result-declared");
    expect(clientRef!.calls.some((c) => c.table === "exam_derived_status")).toBe(true);
  });

  it("defaults to 'upcoming' when the view has no row for the exam", async () => {
    clientRef = fakeClient({ exams: [examRow], exam_derived_status: [] });
    const out = await getExamsForCategory("c1");
    expect(out[0].status).toBe("upcoming");
  });
});

describe("searchExamsInPillar — same fix on the search path", () => {
  it("does not select any status column from exams", async () => {
    clientRef = fakeClient({ exams: [examRow], exam_derived_status: [] });
    await searchExamsInPillar("government-exam", "pet");
    const examCall = clientRef!.calls.find((c) => c.table === "exams")!;
    expect(examCall.select).not.toMatch(/\bstatus\b/);
  });

  it("returns rows with the derived status", async () => {
    clientRef = fakeClient({
      exams: [examRow],
      exam_derived_status: [{ exam_id: "e1", derived_status: "admit-card-out", strip_eligible: false, has_confirmed_dates: true, admit_card_date: "2026-10-17", result_date: null }],
    });
    const out = await searchExamsInPillar("government-exam", "pet");
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe("admit-card-out");
  });

  it("a query shorter than 2 chars still returns [] (unchanged behaviour)", async () => {
    clientRef = fakeClient({ exams: [examRow], exam_derived_status: [] });
    expect(await searchExamsInPillar("government-exam", "p")).toEqual([]);
  });
});
