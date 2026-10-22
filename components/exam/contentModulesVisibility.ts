/**
 * contentModulesVisibility.ts — which editorial modules ContentModulesBlock renders.
 *
 * Kept as a tiny pure module (no React, no next/link, no server client) so it is
 * unit-testable in the node vitest environment and used by EntityDetailPage.
 *
 * Why: on the MAIN page the reader sections are rendered in registry order by
 * renderOrderedSections (via SECTION_SUMMARY_RENDERERS). ContentModulesBlock also
 * walks the enabled editorial modules; unless it skips the ones another surface
 * already owns, the reader sees the same concept TWICE under two headings
 * ("About This Exam" twice was the first report; the reference-page audit of 23 Oct
 * found Eligibility / Vacancy Details / Selection Process / Salary / Age Limit /
 * Reservation Policy / Answer Key / Previous Papers doing the same).
 *
 * The decision is NOT a hand-maintained list any more — it is derived from the
 * section registry through mainPageOwner() (lib/exam/sectionOwnership.ts), so a new
 * registry section is deduplicated the moment it is registered.
 */
import { mainPageOwner } from "@/lib/exam/sectionOwnership";

/**
 * Should this module slug be rendered by ContentModulesBlock?
 *
 * @param slug          the content_modules key (aliased to its registry slug inside)
 * @param enabled       the edition's enabledModules list (the editor's own switch)
 * @param onlyTabModules true on a focused content-type sub-page, false on the main page
 * @param pillar        the record's pillar — a section that does not apply to this
 *                      pillar has no other surface, so the block must still show it
 */
export function moduleShowsInContentBlock(
  slug: string,
  enabled: string[],
  onlyTabModules: boolean,
  pillar: string,
): boolean {
  if (slug === "_config") return false;
  if (!enabled.includes(slug)) return false;
  const owner = mainPageOwner(slug, pillar);
  // Focused content-type sub-page: the page already rendered the section its URL maps
  // to, so the block shows the tab surface — everything that is NOT one of the
  // main-page loop's own sections. (This is also what finally lets the previous-papers
  // and study-material tabs show their module text.)
  if (onlyTabModules) return owner !== "loop";
  // Main page: the loop renders its own sections, a placement-"tab" section lives on
  // its own sub-page, and only what no other surface can show stays here.
  return owner === "block";
}
