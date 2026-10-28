/**
 * contentTypesService.test.ts — the J1b wiring, both paths (owner batch 4).
 *
 * The view/RPC is an OPTIMISATION, never a dependency: this file proves the two paths the
 * owner asked for —
 *   • the RPC answers            -> the map it returns is what the caller gets (and the ids
 *                                   are chunked, because a 400-id list in the request URL is
 *                                   a rejected request, not a slow one);
 *   • the RPC is missing/errors  -> the caller gets null (= "keep the previous behaviour"),
 *                                   and the reason is logged ONCE per process, not per chunk.
 * An exam the view has no row for must also stay distinguishable from "no content types" —
 * that decision lives in app/sitemap.ts and is covered by app/sitemap.ctgate.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

type RpcResult = { data?: unknown; error?: { code?: string; message: string } | null };

const rpc = vi.fn(async (_name: string, _body: { exam_ids: string[] }): Promise<RpcResult> => ({ data: [], error: null }));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({ rpc: (name: string, body: { exam_ids: string[] }) => rpc(name, body) }),
}));

import { getContentTypesByExam, resetContentTypeWarning } from "@/services/contentTypesService";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `00000000-0000-0000-0000-0000000000${String(i).padStart(2, "0")}`);

beforeEach(() => { rpc.mockClear(); resetContentTypeWarning(); });

describe("getContentTypesByExam — the RPC answers", () => {
  it("returns the per-exam sets and chunks the id list at 100 per request", async () => {
    rpc.mockImplementation(async (_n, body) => ({
      data: body.exam_ids.map((id) => ({ exam_id: id, content_types: ["notification", "syllabus"] })),
      error: null,
    }));
    const all = ids(250);
    const out = await getContentTypesByExam(all);
    expect(rpc).toHaveBeenCalledTimes(3);                      // 100 + 100 + 50
    expect(rpc.mock.calls.map((c) => (c[1] as { exam_ids: string[] }).exam_ids.length)).toEqual([100, 100, 50]);
    expect(Object.keys(out ?? {}).length).toBe(250);
    expect(out?.[all[0]]).toEqual(["notification", "syllabus"]);
  });

  it("an exam with no content types is an EMPTY ARRAY, never a missing key turned into null", async () => {
    rpc.mockImplementation(async (_n, body) => ({
      data: body.exam_ids.map((id) => ({ exam_id: id, content_types: [] })),
      error: null,
    }));
    const out = await getContentTypesByExam(ids(2));
    expect(out).not.toBeNull();
    expect(Object.values(out ?? {}).every((v) => Array.isArray(v) && v.length === 0)).toBe(true);
  });

  it("no ids means no request at all", async () => {
    expect(await getContentTypesByExam([])).toEqual({});
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("getContentTypesByExam — the RPC is unavailable", () => {
  it("a missing function (PGRST202) returns null and warns ONCE, not per chunk", async () => {
    rpc.mockImplementation(async () => ({ data: null, error: { code: "PGRST202", message: "Could not find the function" } }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await getContentTypesByExam(ids(250))).toBeNull();     // 3 chunks internally
    expect(rpc).toHaveBeenCalledTimes(1);                          // the first failure returns at once
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("falling back");

    // a second call in the same process must not repeat the warning
    expect(await getContentTypesByExam(ids(3))).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("a thrown client (no result error at all) is also the fallback, not a crash", async () => {
    rpc.mockRejectedValue(new Error("fetch failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(getContentTypesByExam(ids(5))).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
