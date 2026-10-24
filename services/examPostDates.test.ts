/**
 * examPostDates.test.ts — the cache-boundary + grouping contract behind the sitemap's
 * trustworthy update source (Item 1). postDatesByExam maps exam_id → updated_at strings
 * from published exam-linked posts. It must return a PLAIN object (not a Map) so it
 * survives unstable_cache serialisation, and skip rows with no exam or no real date.
 */
import { describe, it, expect } from "vitest";
import { postDatesByExam, type PostDateRow } from "@/services/contentPostService";

describe("postDatesByExam", () => {
  it("groups update dates by exam, skipping rows with no exam id or no date", () => {
    const rows: PostDateRow[] = [
      { exam_id: "e1", updated_at: "2026-10-05T00:00:00Z" },
      { exam_id: "e1", updated_at: "2026-10-06T00:00:00Z" },
      { exam_id: "e2", updated_at: "2026-10-01T00:00:00Z" },
      { exam_id: null, updated_at: "2026-10-02T00:00:00Z" },
      { exam_id: "e3", updated_at: "  " },
      { exam_id: "", updated_at: "2026-10-03T00:00:00Z" },
    ];
    expect(postDatesByExam(rows)).toEqual({
      e1: ["2026-10-05T00:00:00Z", "2026-10-06T00:00:00Z"],
      e2: ["2026-10-01T00:00:00Z"],
    });
  });

  it("survives a JSON round-trip (what unstable_cache does) — never a Map", () => {
    const out = postDatesByExam([{ exam_id: "e1", updated_at: "2026-10-05T00:00:00Z" }]);
    expect(out instanceof Map).toBe(false);
    expect(JSON.parse(JSON.stringify(out))).toEqual(out);
  });
});
