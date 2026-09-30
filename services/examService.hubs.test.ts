/**
 * examService.hubs.test.ts — what the content-hub query actually loads (R2a).
 *
 * THE BUG THIS PINS: hub pages aggregate exams through getExamsByContentType, and
 * the presence rule (contentTypeHasData) decides editorial presence from
 * exam_editions.content_modules and syllabus presence from exam_syllabus_subjects.
 * The shared LIST_SELECT carried NEITHER, so every hub computed "0 exams" while the
 * database held admit-card content on 7 exams, results on 6 and syllabus on 13 —
 * and the empty hubs were then hidden and noindexed, hiding the bug instead of
 * fixing it.
 *
 * Fix under test: the hub path loads EXACTLY the two stores the gate reads, and it
 * stays small — for an editorial section it asks for the editions that carry the
 * section key first (a provable superset: editorialHasData returns false when the
 * key is absent) and then fetches only those exams, with content_modules.
 *
 * The gate itself is never duplicated here: every row still passes through
 * contentTypeHasData, so a candidate that carries an empty or disabled module is
 * dropped exactly as the tab row / sub-page route / sitemap would drop it.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// cached() is next/cache glue; the hub logic under test is the query + the gate.
vi.mock("@/lib/cache", () => ({
  cached: (fn: () => Promise<unknown>) => fn(),
}));

import { getExamsByContentType } from "@/services/examService";

type Call = { table: string; select: string; inIds: string[] | null; filters: [string, string, unknown][] };

/** A chainable PostgREST-shaped stub that records what was asked of each table. */
function fakeClient(
  fixture: Record<string, unknown[]>,
  failures: Record<string, string> = {},
) {
  const calls: Call[] = [];
  const make = (table: string, select: string): any => {
    const record: Call = { table, select, inIds: null, filters: [] };
    calls.push(record);
    const chain: any = {
      select: (s: string) => { record.select = s; return chain; },
      in: (_col: string, ids: string[]) => { record.inIds = ids; return chain; },
      filter: (col: string, op: string, v: unknown) => { record.filters.push([col, op, v]); return chain; },
      eq: (col: string, v: unknown) => { record.filters.push([col, "eq", v]); return chain; },
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      // Thenable so `await supabase.from(t).select(...).in(...)` resolves to a
      // PostgREST-shaped result, whatever the chain length. A table named in
      // `failures` answers the way PostgREST does when the request URL is too
      // long: a RESULT error, not a thrown one.
      then: (res: (v: { data: unknown; error: unknown }) => unknown) =>
        res(failures[table]
          ? { data: null, error: { message: failures[table], code: "" } }
          : { data: fixture[table] ?? [], error: null }),
    };
    return chain;
  };
  return { calls, from: (table: string) => make(table, "") };
}

let clientRef: ReturnType<typeof fakeClient> | null = null;
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => clientRef as never,
}));

/** An exam row shaped like the LIST_SELECT / HUB_SELECT response. */
const row = (over: Record<string, unknown> = {}) => ({
  id: "e1", slug: "ibps-po-2026", name: "IBPS PO 2026", short_name: "IBPS PO",
  pillar: "government-exam", region: null, entity_type: "exam", is_featured: false,
  updated_at: "2026-09-01T00:00:00Z", tags: [], search_keywords: [],
  cat: { slug: "banking" }, subcat: { slug: "po" },
  current_ed: {
    id: "ed1", year: 2026, edition_label: "2026", status: "result-declared",
    important_dates: [], vacancy: null,
    has_admit_card: true, has_result: true, has_answer_key: false, has_syllabus: true,
    has_application: false, has_notification: false, has_cutoff: false,
    content_modules: {},
  },
  ...over,
});

beforeEach(() => { clientRef = null; });

describe("getExamsByContentType — editorial sections", () => {
  it("asks for the editions carrying the section key, then loads them with content_modules", async () => {
    const fixture = {
      exam_editions: [{ id: "ed1" }],
      exams: [row({ current_ed: { ...row().current_ed, content_modules: { "admit-card": { body: "Hall ticket here." } } } })],
      exam_derived_status: [],
      exam_syllabus_subjects: [],
    };
    const client = fakeClient(fixture);
    clientRef = client;

    const exams = await getExamsByContentType("admit-card" as never);

    expect(exams.map((e) => e.id)).toEqual(["e1"]);

    // 1. candidate editions, filtered on jsonb key presence for THIS section only
    const editionCall = client.calls.find((c) => c.table === "exam_editions")!;
    expect(editionCall.filters).toEqual([["content_modules", "cs", '{"admit-card":{}}']]);

    // 2. only those exams, and the select carries the store the gate reads
    const examCall = client.calls.find((c) => c.table === "exams")!;
    expect(examCall.inIds).toEqual(["ed1"]);
    expect(examCall.select).toContain("content_modules");
  });

  it("keeps only rows the gate passes: an empty module and a disabled module are dropped", async () => {
    const withRealBody = row({
      id: "e-ok",
      current_ed: { ...row().current_ed, content_modules: { "admit-card": { body: "Download here." } } },
    });
    const emptyModule = row({
      id: "e-empty",
      current_ed: { ...row().current_ed, id: "ed2", content_modules: { "admit-card": {} } },
    });
    const disabledModule = row({
      id: "e-off",
      current_ed: {
        ...row().current_ed, id: "ed3",
        content_modules: { "admit-card": { body: "hidden" }, _config: { enabledModules: ["result"] } },
      },
    });
    clientRef = fakeClient({
      exam_editions: [{ id: "ed1" }, { id: "ed2" }, { id: "ed3" }],
      exams: [withRealBody, emptyModule, disabledModule],
      exam_derived_status: [],
      exam_syllabus_subjects: [],
    });

    const exams = await getExamsByContentType("admit-card" as never);
    expect(exams.map((e) => e.id)).toEqual(["e-ok"]);
  });

  it("respects pillar applicability — an answer-key module on a board exam is not content", async () => {
    clientRef = fakeClient({
      exam_editions: [{ id: "ed1" }],
      exams: [row({
        pillar: "board-exam",
        current_ed: { ...row().current_ed, content_modules: { "answer-key": { body: "Answers." } } },
      })],
      exam_derived_status: [],
      exam_syllabus_subjects: [],
    });
    expect(await getExamsByContentType("answer-key" as never)).toEqual([]);
  });

  it("no candidate editions means no exam query at all and an empty hub", async () => {
    const client = fakeClient({ exam_editions: [], exams: [], exam_derived_status: [], exam_syllabus_subjects: [] });
    clientRef = client;
    expect(await getExamsByContentType("study-material" as never)).toEqual([]);
    expect(client.calls.filter((c) => c.table === "exams")).toHaveLength(0);
  });
});

describe("getExamsByContentType — the syllabus section (structured store)", () => {
  it("does not pay for content_modules, and lights up only on exam_syllabus_subjects rows", async () => {
    const client = fakeClient({
      exams: [row(), row({ id: "e2", slug: "jee-main-2026", pillar: "entrance-exam" })],
      exam_derived_status: [],
      exam_syllabus_subjects: [{ exam_id: "e2" }],
    });
    clientRef = client;

    const exams = await getExamsByContentType("syllabus" as never);

    expect(exams.map((e) => e.id)).toEqual(["e2"]);
    const examCall = client.calls.find((c) => c.table === "exams")!;
    expect(examCall.select).not.toContain("content_modules");
    expect(examCall.select).toContain("current_ed:exam_editions!current_edition_id");
    // The batched flag query is the ONLY syllabus store read — the edition has_syllabus
    // flag is deliberately not the gate (it is true on ~390 editions with no subjects).
    expect(examCall.filters).toEqual([]);
    const flagCall = client.calls.find((c) => c.table === "exam_syllabus_subjects")!;
    expect(flagCall.inIds).toEqual(["e1", "e2"]);
  });

  it("splits a big id set into URL-safe chunks — PostgREST puts `in()` in the request URL", async () => {
    // Measured 2026-09-30: all 396 exam ids in one `in()` is a 15,545-character
    // URL, and Supabase rejects it with Headers Overflow Error. Chunking is what
    // keeps the syllabus hub reading its real 13 exams instead of 0.
    const many = Array.from({ length: 250 }, (_, i) =>
      row({ id: `e${i}`, slug: `exam-${i}`, pillar: "entrance-exam" }),
    );
    const client = fakeClient({
      exams: many,
      exam_derived_status: [],
      exam_syllabus_subjects: [{ exam_id: "e7" }, { exam_id: "e201" }],
    });
    clientRef = client;

    const exams = await getExamsByContentType("syllabus" as never);

    expect(exams.map((e) => e.id)).toEqual(["e7", "e201"]);
    const flagCalls = client.calls.filter((c) => c.table === "exam_syllabus_subjects");
    expect(flagCalls).toHaveLength(3);
    expect(flagCalls.map((c) => c.inIds!.length)).toEqual([100, 100, 50]);
    // Every chunked call must carry a URL well under the header limit.
    for (const c of flagCalls) expect(c.inIds!.join(",").length).toBeLessThan(4000);
  });

  it("a FAILED flag lookup is not an empty hub: the error surfaces instead of noindexing", async () => {
    // The old code read `{ data }` only, so a HeadersOverflow/timeout result left
    // every hasStructuredSyllabus undefined and /syllabus rendered as an empty,
    // noindexed page — the symptom the owner asked to fix, not to hide.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    clientRef = fakeClient(
      { exams: [row()], exam_derived_status: [], exam_syllabus_subjects: [] },
      { exam_syllabus_subjects: "Headers Overflow Error" },
    );

    const exams = await getExamsByContentType("syllabus" as never);

    expect(exams).toEqual([]);
    expect(spy).toHaveBeenCalledWith(
      "[examService] getExamsByContentType failed:",
      expect.objectContaining({ message: expect.stringContaining("Headers Overflow Error") }),
    );
    spy.mockRestore();
  });
});

describe("getExamsByContentType — content types with no backing store", () => {
  it("date-sheet and mock-test answer empty without touching the database", async () => {
    // R2c: they are EMPTY (hidden + noindexed), not 404 — the page still renders,
    // and the day a registry section is wired for them this answers rows.
    const client = fakeClient({ exams: [], exam_editions: [], exam_derived_status: [], exam_syllabus_subjects: [] });
    clientRef = client;

    expect(await getExamsByContentType("date-sheet" as never)).toEqual([]);
    expect(await getExamsByContentType("mock-test" as never)).toEqual([]);
    expect(client.calls).toHaveLength(0);
  });
});
