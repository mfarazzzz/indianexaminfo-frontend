/**
 * onThisPage.test.ts — P1 item 9: a jump chip exists only for what rendered.
 */
import { describe, it, expect } from "vitest";
import { buildOnThisPage, sectionAnchorId, JUMP_ORDER } from "@/lib/exam/onThisPage";

const ALL = ["important-dates", "eligibility", "application-fee", "application-process", "faqs"];

describe("buildOnThisPage", () => {
  it("offers a chip for every target concept that rendered, in reader order", () => {
    const items = buildOnThisPage({ renderedSlugs: [...ALL].reverse(), hasUpdates: true });
    expect(items.map((i) => i.key)).toEqual(["important-dates", "eligibility", "application-fee", "application-process", "faqs", "updates"]);
  });

  it("drops a chip when its section did not render (never a jump to nothing)", () => {
    const items = buildOnThisPage({ renderedSlugs: ["important-dates", "faqs"] });
    expect(items.map((i) => i.key)).toEqual(["important-dates", "faqs"]);
  });

  it("in-page chips are anchors into the ids the body actually paints", () => {
    const items = buildOnThisPage({ renderedSlugs: ["eligibility"] });
    expect(items[0].href).toBe(`#${sectionAnchorId("eligibility")}`);
    expect(sectionAnchorId("eligibility")).toBe("sec-eligibility");
  });

  it("syllabus is a real link only when its tab exists (it is a tab, never a section here)", () => {
    const withTab = buildOnThisPage({ renderedSlugs: ["important-dates"], syllabusHref: "/sarkari-naukri/c/exam/syllabus" });
    expect(withTab.find((i) => i.key === "syllabus")?.href).toBe("/sarkari-naukri/c/exam/syllabus");
    const withoutTab = buildOnThisPage({ renderedSlugs: ["important-dates", "syllabus"] });
    expect(withoutTab.some((i) => i.key === "syllabus")).toBe(false); // never an in-page anchor
  });

  it("the updates chip only appears when there is a live timeline, and points at #updates", () => {
    expect(buildOnThisPage({ renderedSlugs: ALL, hasUpdates: true }).at(-1)?.href).toBe("#updates");
    expect(buildOnThisPage({ renderedSlugs: ALL, hasUpdates: false }).some((i) => i.key === "updates")).toBe(false);
  });

  it("chip labels are English-only (the bilingual pair belongs to the section heading)", () => {
    for (const it of buildOnThisPage({ renderedSlugs: [...ALL], hasUpdates: true })) {
      expect(it.label).not.toContain(" / ");
      expect(it.label).toMatch(/^[A-Za-z]/);
    }
  });

  it("never invents a chip for a section outside the jump list", () => {
    const items = buildOnThisPage({ renderedSlugs: ["vacancy", "salary", "age-limit", "selection-process"] });
    expect(items).toEqual([]);
    expect(JUMP_ORDER).not.toContain("vacancy");
  });
});
