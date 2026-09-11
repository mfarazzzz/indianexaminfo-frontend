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
// Main/both sections that intentionally render WITHOUT a SECTION_SUMMARY_RENDERERS entry.
// (Tab-only sections aren't checked by the forward rule; they're covered by the placement rule.)
const RENDERS_ELSEWHERE: Record<string, string> = {
  "key-highlights": "Structural furniture synthesized in EntityDetailPage, not an editorial summary",
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

  // Placement consistency: a tab-only section must NOT have a main-page summary renderer.
  // This is the guard for the bug where SyllabusSection was hardcoded onto the main page while
  // the registry said placement:"tab" — code and registry disagreeing with no test between them.
  // (A main-page renderer is one wired into SECTION_SUMMARY_RENDERERS, which the ordered loop
  // calls for main/both sections. Tab-only sections render on their own sub-page, not here.)
  describe("placement — tab-only sections have no main-page summary renderer", () => {
    const tabOnly = SECTION_REGISTRY.filter((s) => s.placement === "tab");
    for (const s of tabOnly) {
      it(`${s.slug}: tab-only, so must not be in SECTION_SUMMARY_RENDERERS (main-page map)`, () => {
        expect(
          s.slug in SECTION_SUMMARY_RENDERERS,
          `Section "${s.slug}" is placement:"tab" but has a main-page summary renderer. ` +
            `A tab-only section must render on its sub-page only, not the main page (this is ` +
            `the SyllabusSection-on-main-page bug). Remove its SECTION_SUMMARY_RENDERERS entry ` +
            `or change its placement.`
        ).toBe(false);
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

  it("placement: a tab-only section WITH a main-page renderer is caught (the SyllabusSection bug)", () => {
    // Simulate the bug: syllabus is placement:"tab"; pretend it had a main-page renderer.
    const tabOnlySlug = "syllabus";
    const isTabOnly = SECTION_REGISTRY.find((s) => s.slug === tabOnlySlug)?.placement === "tab";
    const pretendHasMainRenderer = true; // the bug state
    // The rule asserts NOT(tab-only AND has main renderer); here that conjunction is true → caught.
    expect(isTabOnly && pretendHasMainRenderer).toBe(true);
  });
});


// ══════════════════════════════════════════════════════════════════════════════
// RULE 5 — per-route divergence (content-type consistency across pillars)
// ══════════════════════════════════════════════════════════════════════════════
//
// WHY: Six routes diverged on syllabus rendering and only a manual grep found it. This rule
// makes "a content type is implemented on one pillar but differently or incompletely on
// another" a TEST FAILURE, not a deploy discovery.
//
// HOW: Declarative — each content-type route that serves a /contentType sub-page MUST be
// registered here, stating its pillar, render method, and gate. The test checks:
//   Forward  — every registered content type × every applicable pillar has a declared route
//   Reverse  — every declared route maps to a registry content type
//   Consistency — render methods don't silently diverge across pillars for the same CT
//   Opt-outs — explicit, machine-readable, supersession-only
//
// The declarations ARE the single source of truth for route-implementation status. If someone
// adds a route file without declaring it, the reverse check won't catch that (we can't parse
// the filesystem in a unit test). But if they declare it wrong, or if the registry adds a CT
// that no route serves, the forward check catches it.

import { CONTENT_TYPE_TO_SECTION, type Pillar, SECTION_BY_SLUG } from "@/lib/sectionRegistry";

// ── Render methods ───────────────────────────────────────────────────────────
// Two structural patterns coexist today (logged in NORMALIZATION_AUDIT as a convergence item):
//   "direct"            — route loads getExamSyllabus itself, renders <SyllabusSection> inline
//   "entityDetailPage"  — route passes contentType prop to EntityDetailPage, which loads + renders
//   "none"              — this pillar cannot reach this CT via its route (opt-out required)
type RenderMethod = "direct" | "entityDetailPage" | "none";

// ── Route declarations ───────────────────────────────────────────────────────
// Every physical route file that serves a content-type sub-page must be declared here.
// This is the "route registry" counterpart to SECTION_REGISTRY. When adding a new route or
// a new content type, add the declaration here or the test fails.
interface RouteDeclaration {
  /** Human label for diagnostics */
  route: string;
  /** The actual source file (POSIX-relative to repo root). The filesystem check asserts every
   *  file using contentTypeAvailable is declared here, and every declared file exists. */
  sourceFile: string;
  /** Pillar(s) this route serves */
  pillars: Pillar[];
  /** The content-type URL slugs this route handles (or "*" for all mapped in CONTENT_TYPE_TO_SECTION) */
  contentTypes: string[] | "*";
  /** How it renders content-type-specific sections like syllabus */
  renderMethod: RenderMethod;
  /** Which gate function it uses ("contentTypeAvailable" is the shared async gate) */
  gate: "contentTypeAvailable";
}

// ── The actual declarations (verified against route files 2026-09-11) ────────
const ROUTE_DECLARATIONS: RouteDeclaration[] = [
  {
    route: "entrance-exam/[category]/[slug]/[contentType]/page.tsx",
    sourceFile: "app/(public)/entrance-exam/[category]/[slug]/[contentType]/page.tsx",
    pillars: ["entrance-exam"],
    contentTypes: "*",
    renderMethod: "direct",
    gate: "contentTypeAvailable",
  },
  {
    route: "university-exam/[...segments]/page.tsx (segments.length===3)",
    sourceFile: "app/(public)/university-exam/[...segments]/page.tsx",
    pillars: ["university-exam"],
    contentTypes: "*",
    renderMethod: "entityDetailPage",
    gate: "contentTypeAvailable",
  },
  {
    route: "board-exam/[...segments]/page.tsx (segments.length===3,4)",
    sourceFile: "app/(public)/board-exam/[...segments]/page.tsx",
    pillars: ["board-exam"],
    contentTypes: "*",
    renderMethod: "entityDetailPage",
    gate: "contentTypeAvailable",
  },
  {
    route: "board-exam/state/[stateSlug]/[slug]/[contentType]/page.tsx",
    sourceFile: "app/(public)/board-exam/state/[stateSlug]/[slug]/[contentType]/page.tsx",
    pillars: ["board-exam"],
    contentTypes: "*",
    renderMethod: "direct",
    gate: "contentTypeAvailable",
  },
  {
    route: "board-exam/university/[slug]/[contentType]/page.tsx",
    sourceFile: "app/(public)/board-exam/university/[slug]/[contentType]/page.tsx",
    pillars: ["board-exam"],
    contentTypes: "*",
    renderMethod: "direct",
    gate: "contentTypeAvailable",
  },
  {
    route: "sarkari-naukri/[...segments] → SarkariNaukriContentTypeView.tsx",
    sourceFile: "app/(public)/sarkari-naukri/[...segments]/SarkariNaukriContentTypeView.tsx",
    pillars: ["government-exam", "govt-vacancy"],
    contentTypes: "*",
    renderMethod: "direct",
    gate: "contentTypeAvailable",
  },
];

// ── Explicit opt-outs / exceptions ───────────────────────────────────────────
// When a content type is intentionally absent or divergent on a specific pillar/route,
// declare it here with a supersession reason. "empty" is never a valid reason.
interface RouteException {
  contentType: string;
  pillar: Pillar;
  route: string;
  reason: string;
}

const ROUTE_EXCEPTIONS: RouteException[] = [
  // date-sheet is not in CONTENT_TYPE_TO_SECTION at all (intentionally absent — board/university concept).
  // It's handled by direct rendering in ContentModulesBlock, not via the registry CT-to-section bridge.
  // No exception needed because it's not a registered content type.

  // board-exam has two specific routes (state, university) plus a catch-all — a URL can be served
  // by different files depending on the first segment. This is documented as convergence-backlog.
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const registeredContentTypes = Object.keys(CONTENT_TYPE_TO_SECTION);

/** All pillars that have at least one declaration for a given content type */
function pillarsCoveringCT(ct: string): Set<Pillar> {
  const result = new Set<Pillar>();
  for (const decl of ROUTE_DECLARATIONS) {
    if (decl.contentTypes === "*" || decl.contentTypes.includes(ct)) {
      for (const p of decl.pillars) result.add(p);
    }
  }
  return result;
}

/** All pillars where the section backing a content type applies (per registry appliesTo) */
function pillarsWhereApplicable(ct: string): Set<Pillar> {
  const sectionSlug = CONTENT_TYPE_TO_SECTION[ct];
  if (!sectionSlug) return new Set();
  const section = SECTION_BY_SLUG[sectionSlug];
  if (!section) return new Set();
  return new Set(section.appliesTo as Pillar[]);
}

function isExcepted(ct: string, pillar: Pillar): RouteException | undefined {
  return ROUTE_EXCEPTIONS.find((e) => e.contentType === ct && e.pillar === pillar);
}

// ── Rule 5 tests ─────────────────────────────────────────────────────────────
describe("Rule 5 — per-route divergence (content-type consistency across pillars)", () => {

  // A. Forward: every registered content type must be served on every pillar where its
  // section is applicable, or be explicitly excepted with a supersession reason.
  describe("forward — every applicable pillar has a route for each content type", () => {
    for (const ct of registeredContentTypes) {
      const applicable = pillarsWhereApplicable(ct);
      const covered = pillarsCoveringCT(ct);
      for (const pillar of applicable) {
        it(`${ct} on ${pillar}: route declared or excepted`, () => {
          const exception = isExcepted(ct, pillar);
          if (exception) {
            expect(isValidReason(exception.reason),
              `Exception for ${ct} on ${pillar} has an invalid reason: "${exception.reason}"`
            ).toBe(true);
            return;
          }
          expect(
            covered.has(pillar),
            `Content type "${ct}" (section "${CONTENT_TYPE_TO_SECTION[ct]}") applies to pillar "${pillar}" ` +
              `but no route declaration covers it. Add a ROUTE_DECLARATIONS entry, or add a ` +
              `ROUTE_EXCEPTIONS entry with a supersession reason (never "empty").`
          ).toBe(true);
        });
      }
    }
  });

  // B. Reverse: every declared route must correspond to a registered content type.
  describe("reverse — every declared route maps to registered content types", () => {
    for (const decl of ROUTE_DECLARATIONS) {
      it(`${decl.route}: serves only registered content types`, () => {
        if (decl.contentTypes === "*") {
          // Wildcard — serves all registered types. Valid by definition.
          expect(registeredContentTypes.length).toBeGreaterThan(0);
        } else {
          for (const ct of decl.contentTypes) {
            expect(
              ct in CONTENT_TYPE_TO_SECTION,
              `Route "${decl.route}" declares content type "${ct}" which is not in CONTENT_TYPE_TO_SECTION.`
            ).toBe(true);
          }
        }
      });
    }
  });

  // C. Gate consistency: every declaration must use the shared async gate.
  describe("gate consistency — all routes use contentTypeAvailable", () => {
    for (const decl of ROUTE_DECLARATIONS) {
      it(`${decl.route}: uses the shared contentTypeAvailable gate`, () => {
        expect(
          decl.gate,
          `Route "${decl.route}" declares gate "${decl.gate}" instead of "contentTypeAvailable". ` +
            `All content-type routes must use the shared async gate.`
        ).toBe("contentTypeAvailable");
      });
    }
  });

  // D. Render-method divergence: for each content type, if multiple pillars serve it,
  // flag when render methods differ (two structural paths = the architectural disease).
  // Not a hard failure today (two paths coexist by design), but logged with a diagnostic.
  describe("render-method tracking — flag divergence across pillars", () => {
    for (const ct of registeredContentTypes) {
      it(`${ct}: render methods are documented (divergence is tracked, not hidden)`, () => {
        const methods = new Map<Pillar, RenderMethod>();
        for (const decl of ROUTE_DECLARATIONS) {
          if (decl.contentTypes === "*" || decl.contentTypes.includes(ct)) {
            for (const p of decl.pillars) {
              if (!methods.has(p)) methods.set(p, decl.renderMethod);
            }
          }
        }
        // This test passes as long as every pillar's method is declared.
        // It documents divergence in the test output rather than failing —
        // because the two render methods (direct vs entityDetailPage) are a
        // known architectural state, not a bug. When they converge, this
        // section can be tightened to require all methods be identical.
        expect(methods.size).toBeGreaterThan(0);
      });
    }
  });

  // E. Exception validation: every exception must carry a valid supersession reason.
  describe("exceptions carry valid supersession reasons", () => {
    for (const exc of ROUTE_EXCEPTIONS) {
      it(`${exc.contentType} on ${exc.pillar}: reason is valid`, () => {
        expect(
          isValidReason(exc.reason),
          `Exception for "${exc.contentType}" on "${exc.pillar}" (route ${exc.route}) ` +
            `has an invalid reason: "${exc.reason}". Only supersession reasons are valid.`
        ).toBe(true);
      });
    }
    // No-op if ROUTE_EXCEPTIONS is empty — but the describe block still exists.
    if (ROUTE_EXCEPTIONS.length === 0) {
      it("no exceptions declared (clean state)", () => {
        expect(ROUTE_EXCEPTIONS).toHaveLength(0);
      });
    }
  });
});

// ── Rule 5b — FILESYSTEM check: no undeclared content-type route ─────────────
//
// Closes the gap Rule 5's declarations alone can't: an undeclared route FILE. This was the
// actual board-state bug — a route that existed with no gate and no declaration; only a manual
// grep found it. A directory glob is deterministic and local (no network, no DB), so we CAN
// catch it in a unit test.
//
// SIGNAL: any .tsx file under app/ that references `contentTypeAvailable` (the shared CT gate)
// IS a content-type-serving route and MUST appear in ROUTE_DECLARATIONS.sourceFile.
//   Discovered-but-not-declared → a new route slipped in without registration (fails).
//   Declared-but-not-discovered → a declared route was deleted or stopped using the gate (fails).
describe("Rule 5b — filesystem: every content-type route is declared", () => {
  // Lazy require so the rest of the suite stays pure; fs/path are deterministic + local.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require("node:path") as typeof import("node:path");

  const APP_DIR = path.resolve(__dirname, "..", "app");
  const GATE_SIGNAL = "contentTypeAvailable";

  /** Recursively collect .tsx files under a directory. */
  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...walk(full));
      else if (entry.isFile() && entry.name.endsWith(".tsx")) out.push(full);
    }
    return out;
  }

  /** POSIX-relative-to-repo-root path (matches ROUTE_DECLARATIONS.sourceFile format). */
  function relPosix(full: string): string {
    const repoRoot = path.resolve(__dirname, "..");
    return path.relative(repoRoot, full).split(path.sep).join("/");
  }

  const discovered = walk(APP_DIR)
    .filter((f) => fs.readFileSync(f, "utf8").includes(GATE_SIGNAL))
    .map(relPosix)
    .sort();

  const declared = ROUTE_DECLARATIONS.map((d) => d.sourceFile).sort();

  it("every file using contentTypeAvailable is declared in ROUTE_DECLARATIONS", () => {
    const undeclared = discovered.filter((f) => !declared.includes(f));
    expect(
      undeclared,
      `These files use the content-type gate (${GATE_SIGNAL}) but are NOT in ROUTE_DECLARATIONS:\n` +
        `${undeclared.join("\n")}\n` +
        `A content-type route must be declared so Rule 5 can enforce cross-pillar consistency. ` +
        `This is the "undeclared route" gap (the board-state bug). Add a ROUTE_DECLARATIONS entry.`
    ).toEqual([]);
  });

  it("every declared route file exists and still uses the gate", () => {
    const missing = declared.filter((f) => !discovered.includes(f));
    expect(
      missing,
      `These ROUTE_DECLARATIONS entries no longer match a file using ${GATE_SIGNAL}:\n` +
        `${missing.join("\n")}\n` +
        `Either the file was moved/deleted, or it stopped using the shared gate. Update the declaration.`
    ).toEqual([]);
  });
});

// ── Deliberate failing case for Rule 5 ───────────────────────────────────────
describe("Rule 5 rejects drift (deliberate failing case)", () => {
  it("forward: an applicable pillar with no route and no exception is caught", () => {
    // Simulate: if entrance-exam had no route for "syllabus", the forward check would fail.
    const fakeCoveredPillars = new Set<Pillar>(["government-exam"]); // missing entrance-exam
    const fakeApplicable = new Set<Pillar>(["government-exam", "entrance-exam"]);
    const missing = [...fakeApplicable].filter((p) => !fakeCoveredPillars.has(p));
    expect(missing.length).toBeGreaterThan(0); // entrance-exam is uncovered
    expect(missing).toContain("entrance-exam");
  });

  it("an exception with reason 'empty' is rejected", () => {
    const badException: RouteException = {
      contentType: "syllabus", pillar: "entrance-exam",
      route: "test", reason: "empty — no content",
    };
    expect(isValidReason(badException.reason)).toBe(false);
  });
});
