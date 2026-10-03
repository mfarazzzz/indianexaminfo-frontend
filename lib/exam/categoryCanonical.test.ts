import { describe, it, expect } from "vitest";
import {
  categoryBreadcrumbLabel,
  categoryMismatch,
  type CategoryRecord,
} from "./categoryCanonical";

// The record is the ONLY source of the breadcrumb label and the canonical category.
// The URL segment must never leak into the label (that title-casing was the bug) and
// must never be trusted as the canonical category.

describe("categoryBreadcrumbLabel — from the RECORD, never the URL slug", () => {
  it("returns categories.name VERBATIM, so an ampersand and the author's casing survive", () => {
    const rec: CategoryRecord = { category: "research-fellowships", categoryName: "Research & Fellowships" };
    // Even a WRONG url segment cannot corrupt the label — it comes from the record.
    expect(categoryBreadcrumbLabel(rec, "totally-wrong-segment")).toBe("Research & Fellowships");
  });

  it("preserves mixed case stored by the editor (no re-casing, no HTML entity)", () => {
    const rec: CategoryRecord = { category: "teacher-education", categoryName: "Teacher Education" };
    expect(categoryBreadcrumbLabel(rec, "teacher-education")).toBe("Teacher Education");
  });

  it("does NOT double-encode an ampersand — the raw name is returned, the renderer escapes", () => {
    const rec: CategoryRecord = { category: "r-and-d", categoryName: "R & D" };
    const out = categoryBreadcrumbLabel(rec, "r-and-d");
    expect(out).toBe("R & D");
    expect(out).not.toContain("&amp;");
  });

  it("falls back to a title-cased RECORD slug only when the join carried no name", () => {
    const rec: CategoryRecord = { category: "teacher-education", categoryName: "" };
    expect(categoryBreadcrumbLabel(rec, "teacher-education")).toBe("Teacher Education");
  });

  it("falls back to the URL segment ONLY when the record has no category at all", () => {
    const rec: CategoryRecord = { category: "" };
    expect(categoryBreadcrumbLabel(rec, "some-flat-segment")).toBe("Some Flat Segment");
  });
});

describe("categoryMismatch — the 308 trigger", () => {
  const rec: CategoryRecord = { category: "teacher-education", categoryName: "Teacher Education" };

  it("is TRUE when the URL segment differs from the record's category slug", () => {
    expect(categoryMismatch("research-fellowships", rec)).toBe(true);
  });

  it("is FALSE when the URL segment matches the record's category", () => {
    expect(categoryMismatch("teacher-education", rec)).toBe(false);
  });

  it("is FALSE when the record has no category (nothing to redirect to)", () => {
    expect(categoryMismatch("anything", { category: "" })).toBe(false);
  });
});
