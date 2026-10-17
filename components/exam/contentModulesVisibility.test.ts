/**
 * contentModulesVisibility.test.ts — the duplicate "About This Exam" fix (Part 1 / 1c).
 *
 * On live exam pages overview rendered TWICE: once by the registry ordered-section
 * loop (SECTION_SUMMARY_RENDERERS.overview) and again by ContentModulesBlock. The
 * pure predicate below is the single rule ContentModulesBlock now uses; these tests
 * pin that overview is dropped from the block on the main page (so it shows once,
 * from the loop) while every other editorial module still renders, and that the
 * focused tab sub-page keeps its own behaviour.
 */
import { describe, it, expect } from "vitest";
import {
  moduleShowsInContentBlock, TAB_ONLY_MODULES, MAIN_PAGE_LOOP_MODULES,
} from "@/components/exam/contentModulesVisibility";

const ENABLED = ["overview", "eligibility", "important-dates", "vacancy-details", "result", "news", "_config"];

describe("ContentModulesBlock visibility (main page)", () => {
  it("drops overview so it is not rendered a second time next to the ordered loop", () => {
    expect(MAIN_PAGE_LOOP_MODULES.has("overview")).toBe(true);
    expect(moduleShowsInContentBlock("overview", ENABLED, false)).toBe(false);
  });

  it("still renders the editorial modules the ordered loop does NOT own", () => {
    for (const slug of ["eligibility", "important-dates", "vacancy-details"]) {
      expect(moduleShowsInContentBlock(slug, ENABLED, false), slug).toBe(true);
    }
  });

  it("keeps tab-only modules off the main page", () => {
    for (const slug of ["result", "news"]) {
      expect(TAB_ONLY_MODULES.has(slug)).toBe(true);
      expect(moduleShowsInContentBlock(slug, ENABLED, false), slug).toBe(false);
    }
  });

  it("skips _config and any module not in the enabled set", () => {
    expect(moduleShowsInContentBlock("_config", ENABLED, false)).toBe(false);
    expect(moduleShowsInContentBlock("syllabus", ENABLED, false)).toBe(false); // not enabled here
  });
});

describe("ContentModulesBlock visibility (focused tab sub-page)", () => {
  it("renders exactly the tab-only module requested, and not overview", () => {
    expect(moduleShowsInContentBlock("result", ENABLED, true)).toBe(true);
    expect(moduleShowsInContentBlock("news", ENABLED, true)).toBe(true);
    expect(moduleShowsInContentBlock("eligibility", ENABLED, true)).toBe(false); // not tab-only
    expect(moduleShowsInContentBlock("overview", ENABLED, true)).toBe(false);
  });
});
