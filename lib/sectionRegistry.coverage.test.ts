import { describe, it, expect } from "vitest";
import { SECTION_REGISTRY, type SectionDef } from "@/lib/sectionRegistry";
import { SECTION_SUMMARY_RENDERERS } from "@/components/exam/sectionRenderers";

/**
 * RENDERER-COVERAGE GUARD — the fourth CI rule (the other three live in the CMS repo, which
 * owns MODULE_REGISTRY). This repo owns SECTION_REGISTRY ↔ SECTION_SUMMARY_RENDERERS, so the
 * renderer rule belongs here.
 *
 * WHY: syllabus-highlights sat rendered-nowhere for months and nobody noticed. This makes both
 * failure directions a TEST FAILURE:
 *   Forward  — a registry section that would appear (has a renderer path) but has none
 *              → dead tab / silent gap. Allowed ONLY if explicitly RETIRED with a reason.
 *   Reverse  — a renderer (or a content_modules key an editor can fill) with NO registry
 *              section → content that can never surface. This is the syllabus-highlights class.
 *
 * "empty" is never a valid retirement reason — only supersession (another home owns it).
 */

// Sections that intentionally render WITHOUT a SECTION_SUMMARY_RENDERERS entry, each with a
// supersession reason. These are not gaps — they render through a dedicated component or are
// structural furniture, not the editorial-summary map.
const RENDERS_ELSEWHERE: Record<string, string> = {
  "key-highlights": "Structural furniture synthesized in EntityDetailPage, not an editorial summary",
  syllabus: "Rendered by the dedicated <SyllabusSection> (structured exam_syllabus_subjects), not the summary map",
  "cut-off": "Tab-only reference page; no main-page summary renderer by design",
  "answer-key": "Tab-only reference page; no main-page summary renderer by design",
  news: "Rendered by the News tab / Related News, not the editorial summary map",
};

// Explicitly RETIRED sections — removed from the registry, must stay gone. Recorded with a
// supersession reason so a re-add is a conscious act. (Kept for documentation + reverse check.)
const RETIRED: Record<string, string> = {
  "previous-papers": "Superseded by the exam_resources library (year-tagged, shared across editions)",
  "study-material": "Superseded by the exam_resources library",
  "syllabus-highlights": "Superseded by structured exam_syllabus_subjects (the flat column was dropped)",
};

const EMPTY_REASON = /\b(empty|no data|nothing to show|blank|not filled|no content)\b/i;
const isValidReason = (r: string) => r.trim().length >= 8 && !EMPTY_REASON.test(r);

describe("Rule 4 — renderer coverage (SECTION_REGISTRY ↔ SECTION_SUMMARY_RENDERERS)", () => {
  // Forward: every registry section that shows a main-page summary must have a renderer,
  // or be listed in RENDERS_ELSEWHERE with a supersession reason.
  describe("forward — every main-page section has a renderer or a documented reason", () => {
    const mainSections = SECTION_REGISTRY.filter(
      (s: SectionDef) => s.source !== "structure" && (s.placement === "main" || s.placement === "both")
    );
    for (const s of mainSections) {
      it(`${s.slug}: has a renderer or a valid "renders elsewhere" reason`, () => {
        const hasRenderer = s.slug in SECTION_SUMMARY_RENDERERS;
        const reason = RENDERS_ELSEWHERE[s.slug];
        expect(
          hasRenderer || (reason !== undefined && isValidReason(reason)),
          `Section "${s.slug}" is a main-page section with NO renderer and no valid ` +
            `RENDERS_ELSEWHERE reason. Add a SECTION_SUMMARY_RENDERERS entry, or record why ` +
            `it renders elsewhere (supersession, never "empty").`
        ).toBe(true);
      });
    }
  });

  // Reverse: every renderer must map to a registry section (no orphan renderer that can
  // never be reached), AND every registry slug must be known (not silently missing).
  describe("reverse — no renderer without a registry section", () => {
    for (const slug of Object.keys(SECTION_SUMMARY_RENDERERS)) {
      it(`${slug}: renderer maps to a registry section`, () => {
        const inRegistry = SECTION_REGISTRY.some((s) => s.slug === slug);
        expect(
          inRegistry,
          `Renderer "${slug}" has no SECTION_REGISTRY entry — it can never be reached. ` +
            `Add a SectionDef, or remove the orphan renderer.`
        ).toBe(true);
      });
    }
  });

  // Retirement reasons must be supersession-based, never "empty".
  it("retired sections carry a supersession reason (never 'empty')", () => {
    for (const [slug, reason] of Object.entries(RETIRED)) {
      expect(isValidReason(reason), `Retired "${slug}" reason invalid: "${reason}"`).toBe(true);
      // A retired section must NOT be back in the registry.
      expect(SECTION_REGISTRY.some((s) => s.slug === slug), `Retired "${slug}" is back in the registry`).toBe(false);
    }
  });
});

// ── Deliberate FAILING cases — prove the rule catches both drift directions ──
describe("renderer-coverage rule rejects drift (deliberate failing cases)", () => {
  it("forward: a main-page section with no renderer and no reason is caught", () => {
    const fakeSlug = "__ghost_section__";
    const hasRenderer = fakeSlug in SECTION_SUMMARY_RENDERERS;
    const reason = (RENDERS_ELSEWHERE as Record<string, string>)[fakeSlug];
    expect(hasRenderer || (reason !== undefined && isValidReason(reason))).toBe(false); // caught
  });

  it("reverse: an orphan renderer with no registry section is caught (the syllabus-highlights class)", () => {
    const orphan = "__orphan_renderer__";
    const inRegistry = SECTION_REGISTRY.some((s) => s.slug === orphan);
    expect(inRegistry).toBe(false); // the rule would fail for such a renderer
  });

  it("'empty' is rejected as a retirement/elsewhere reason", () => {
    expect(isValidReason("empty")).toBe(false);
    expect(isValidReason("no content yet")).toBe(false);
    expect(isValidReason("Superseded by the exam_resources library")).toBe(true);
  });
});
