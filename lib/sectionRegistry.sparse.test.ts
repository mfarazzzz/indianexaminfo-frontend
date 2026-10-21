/**
 * sectionRegistry.sparse.test.ts — A2: a sparse exam record renders NO empty
 * section shells. renderOrderedSections filters every section through hasData(),
 * so a section whose data is absent is never emitted (no empty heading/box).
 * This pins that for the sections 4a touches, and confirms the gate is
 * data-driven (present data still shows), not always-off.
 */
import { describe, it, expect } from "vitest";
import { hasData, type HasDataView } from "./sectionRegistry";

// A record shaped like the sparsest real ones (e.g. aiims-nursing: 0 dates).
const sparse: HasDataView = {
  pillar: "government-exam",
  dates: [],
  eligibility: null,
  vacancy: null,
  applicationFee: null,
  selectionProcess: null,
  academicInfo: null,
  hasStructuredSyllabus: false,
  faqs: null,
  contentModules: {},
};

describe("A2 sparse gating — empty sections are filtered out", () => {
  it("important-dates hidden when there are no dates", () => {
    expect(hasData(sparse, "important-dates")).toBe(false);
  });
  it("eligibility hidden when null", () => {
    expect(hasData(sparse, "eligibility")).toBe(false);
  });
  it("application-fee hidden when null", () => {
    expect(hasData(sparse, "application-fee")).toBe(false);
  });
  it("vacancy hidden when null or 0", () => {
    expect(hasData(sparse, "vacancy")).toBe(false);
    expect(hasData({ ...sparse, vacancy: 0 }, "vacancy")).toBe(false);
  });
  it("selection-process hidden when empty", () => {
    expect(hasData(sparse, "selection-process")).toBe(false);
  });
  it("the gate is data-driven: present data still shows the section", () => {
    expect(hasData({ ...sparse, dates: [{ label: "Exam", date: "2026-10-25" }] }, "important-dates")).toBe(true);
    expect(hasData({ ...sparse, vacancy: 100 }, "vacancy")).toBe(true);
  });
});
