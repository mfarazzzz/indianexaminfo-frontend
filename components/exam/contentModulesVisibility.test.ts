/**
 * contentModulesVisibility.test.ts — the block renders what no other surface owns.
 *
 * The duplicate-section defect class (reference-page audit, 23 Oct): the ordered
 * main-page loop and ContentModulesBlock both walked the editorial modules, so a
 * record with an `eligibility` module got "Eligibility / योग्यता" AND "Eligibility
 * Criteria" on one page. The predicate now comes from the section registry (via
 * mainPageOwner), so ownership is derived, never hand-listed.
 */
import { describe, it, expect } from "vitest";
import { moduleShowsInContentBlock } from "@/components/exam/contentModulesVisibility";
import { mainPageOwner, TAB_SURFACE_MODULES } from "@/lib/exam/sectionOwnership";
import { SECTION_BY_SLUG } from "@/lib/sectionRegistry";

const ENABLED = [
  "overview", "eligibility", "important-dates", "vacancy-details", "salary",
  "age-limit", "selection-process", "reservation", "result", "news",
  "answer-key", "previous-papers", "study-material", "exam-pattern", "date-sheet",
  "revaluation",
];
const GOVT = "government-exam";

describe("main page — one heading per concept", () => {
  it("the block stays silent for every module the ordered loop already renders", () => {
    for (const slug of ["overview", "eligibility", "important-dates", "vacancy-details", "salary", "age-limit", "selection-process", "reservation", "result"]) {
      expect(mainPageOwner(slug, GOVT), slug).toBe("loop");
      expect(moduleShowsInContentBlock(slug, ENABLED, false, GOVT), slug).toBe(false);
    }
  });

  it("reference material lives on its own tab, not on the main page", () => {
    for (const slug of ["news", "answer-key", "previous-papers", "study-material", "exam-pattern"]) {
      expect(mainPageOwner(slug, GOVT), slug).toBe("tab");
      expect(moduleShowsInContentBlock(slug, ENABLED, false, GOVT), slug).toBe(false);
    }
  });

  it("a module with NO routable tab renders on the main page — never orphaned (P1 item 13)", () => {
    // date-sheet is intentionally absent from CONTENT_TYPE_TO_SECTION, so no /date-sheet
    // route can light. If the block skipped it too, an editor's Date Sheet was invisible
    // everywhere. It now renders as a main-page section.
    expect(mainPageOwner("date-sheet", "board-exam")).toBe("block");
    expect(moduleShowsInContentBlock("date-sheet", [...ENABLED, "date-sheet"], false, "board-exam")).toBe(true);
    // same for the CMS-rail concepts that have no reader tab yet
    for (const slug of ["revaluation", "practical-exams"]) {
      expect(mainPageOwner(slug, "university-exam"), slug).toBe("block");
      expect(moduleShowsInContentBlock(slug, [...ENABLED, slug], false, "university-exam"), slug).toBe(true);
    }
  });

  it("a module no other surface can show still renders (nothing is dropped silently)", () => {
    // revaluation has no registry section and no tab of its own -> only the block can show it
    expect(mainPageOwner("revaluation", GOVT)).toBe("block");
    expect(moduleShowsInContentBlock("revaluation", ENABLED, false, GOVT)).toBe(true);
    // a section that does not apply to THIS pillar has no other surface either
    expect(mainPageOwner("age-limit", "university-exam")).toBe("block");
    expect(moduleShowsInContentBlock("age-limit", ENABLED, false, "university-exam")).toBe(true);
  });

  it("skips _config and any module the editor disabled", () => {
    expect(moduleShowsInContentBlock("_config", ENABLED, false, GOVT)).toBe(false);
    expect(moduleShowsInContentBlock("revaluation", ["overview"], false, GOVT)).toBe(false);
  });
});

describe("focused content-type sub-page", () => {
  it("shows its tab material, and never re-shows a main-page loop section", () => {
    expect(moduleShowsInContentBlock("result", ENABLED, true, GOVT)).toBe(false); // loop-owned
    expect(moduleShowsInContentBlock("eligibility", ENABLED, true, GOVT)).toBe(false);
    expect(moduleShowsInContentBlock("news", ENABLED, true, GOVT)).toBe(true);
    expect(moduleShowsInContentBlock("exam-pattern", ENABLED, true, GOVT)).toBe(true);
    // the fix this rule unlocks: previous-papers / study-material were never rendered
    // on their own tab because the old hand-listed set did not contain them.
    expect(moduleShowsInContentBlock("previous-papers", ENABLED, true, GOVT)).toBe(true);
    expect(moduleShowsInContentBlock("study-material", ENABLED, true, GOVT)).toBe(true);
    expect(moduleShowsInContentBlock("answer-key", ENABLED, true, GOVT)).toBe(true);
  });
});

describe("ownership is derived from the registry, not from a list", () => {
  it("every registry section with a main-page placement is loop-owned for a pillar it applies to", () => {
    for (const [slug, def] of Object.entries(SECTION_BY_SLUG)) {
      if (def.placement === "tab" || def.source === "structure") continue;
      for (const pillar of def.appliesTo) {
        expect(mainPageOwner(slug, pillar), `${slug}@${pillar}`).toBe("loop");
      }
    }
  });

  it("every placement-tab registry section is tab-owned for a pillar it applies to", () => {
    for (const [slug, def] of Object.entries(SECTION_BY_SLUG)) {
      if (def.placement !== "tab") continue;
      for (const pillar of def.appliesTo) {
        expect(mainPageOwner(slug, pillar), `${slug}@${pillar}`).toBe("tab");
      }
    }
  });

  it("the escape hatch only speaks for modules the registry does not know", () => {
    for (const slug of TAB_SURFACE_MODULES) {
      expect(SECTION_BY_SLUG[slug], `${slug} is now registered — the registry must decide`).toBeUndefined();
    }
  });
});
