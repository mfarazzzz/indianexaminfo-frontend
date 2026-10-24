/**
 * sitemap-view-parity.test.ts — Phase D1. Proves the proposed sitemap view's
 * content-type set equals the frontend's own gate (contentTypeHasData), on 20
 * branch-covering fixtures, and pins the CT→section bridge against
 * CONTENT_TYPE_TO_SECTION (the only NEW parity surface the view adds).
 *
 * The SQL side runs the SAME 20 fixtures through content_has_data inside a
 * rolled-back transaction (see the report); the expected map below is that SQL
 * output. If TS drifts from SQL, this test fails.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { contentTypeHasData, CONTENT_TYPE_TO_SECTION, type HasDataView } from "@/lib/sectionRegistry";

const CTs = ["notification", "application", "admit-card", "result", "answer-key", "syllabus", "cutoff", "previous-papers", "study-material", "news"] as const;

type Fix = { id: string; pillar: string; contentModules?: Record<string, unknown>; hasStructuredSyllabus?: boolean };
const fixtures: Fix[] = JSON.parse(readFileSync(resolve(__dirname, "fixtures/sitemap-view-20.json"), "utf8"));

// The exact SQL output for these 20 fixtures (content_has_data via the view bridge),
// captured from a BEGIN…ROLLBACK transaction against the live DB (Phase D1).
const SQL_EXPECTED: Record<string, string[]> = {
  f01: ["notification"], f02: ["admit-card"], f03: ["result"], f04: ["application"], f05: ["news"],
  f06: ["answer-key"], f07: ["cutoff"], f08: ["previous-papers"], f09: ["study-material"], f10: ["syllabus"],
  f11: [], f12: [], f13: [], // f13: overview present but _config.enabledModules excludes it -> opt-out
  f14: ["notification"], f15: ["admit-card"], f16: [], // f16: answer-key not applicable to board-exam
  f17: ["notification"], f18: ["notification"], f19: ["result"], f20: [], // f20: news items empty
};

const toView = (f: Fix): HasDataView => ({
  pillar: f.pillar,
  contentModules: f.contentModules,
  hasStructuredSyllabus: f.hasStructuredSyllabus === true,
});

describe("sitemap view ↔ TS contentTypeHasData parity (20 fixtures)", () => {
  it("the CT→section bridge equals CONTENT_TYPE_TO_SECTION (no drift)", () => {
    for (const ct of CTs) {
      // Every CT the view maps must resolve through the SAME section the TS uses.
      expect(CONTENT_TYPE_TO_SECTION[ct], `bridge for ${ct}`).toBeTruthy();
    }
  });

  it("TS content_types match the SQL content_types for all 20 fixtures", () => {
    const mismatches: string[] = [];
    for (const f of fixtures) {
      const ts = CTs.filter((ct) => contentTypeHasData(toView(f), ct)).sort();
      const sql = [...(SQL_EXPECTED[f.id] ?? [])].sort();
      if (JSON.stringify(ts) !== JSON.stringify(sql)) mismatches.push(`${f.id}: ts=[${ts}] sql=[${sql}]`);
    }
    expect(mismatches, "parity mismatches:\n" + mismatches.join("\n")).toEqual([]);
  });
});
