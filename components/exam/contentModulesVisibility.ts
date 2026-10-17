/**
 * contentModulesVisibility.ts — which editorial modules ContentModulesBlock renders.
 *
 * Kept as a tiny pure module (no React, no next/link, no server client) so it is
 * unit-testable in the node vitest environment and used by EntityDetailPage.
 *
 * Why: on the MAIN page the reader sections are rendered in registry order by
 * renderOrderedSections (via SECTION_SUMMARY_RENDERERS). `overview` ("About This
 * Exam") is one of them. ContentModulesBlock also walks the enabled editorial
 * modules; unless it skips the ones the ordered loop already renders, the reader
 * sees the same block TWICE (the duplicate "About This Exam" seen on live exam
 * pages). MAIN_PAGE_LOOP_MODULES lists the slugs the loop owns so the block stays
 * silent for them.
 */

/** Editorial modules that live on a content-type sub-page, not the main page. */
export const TAB_ONLY_MODULES = new Set([
  "application-process", "admit-card", "result", "cut-off", "syllabus",
  "date-sheet", "news", "faqs", "exam-pattern",
]);

/** Slugs the ordered-section loop (SECTION_SUMMARY_RENDERERS) already renders on
 *  the main page; ContentModulesBlock must not duplicate them. */
export const MAIN_PAGE_LOOP_MODULES = new Set(["overview"]);

/**
 * Should this module slug be rendered by ContentModulesBlock, given the record's
 * enabled modules and whether this is a focused tab sub-page (onlyTabModules)?
 * Pure: reads only its arguments.
 */
export function moduleShowsInContentBlock(
  slug: string,
  enabled: string[],
  onlyTabModules: boolean,
): boolean {
  if (slug === "_config") return false;
  if (!enabled.includes(slug)) return false;
  // Focused content-type sub-page: render exactly the tab-only module requested.
  if (onlyTabModules) return TAB_ONLY_MODULES.has(slug);
  // Main page: the ordered loop owns these slugs — do not render them again.
  if (MAIN_PAGE_LOOP_MODULES.has(slug)) return false;
  return !TAB_ONLY_MODULES.has(slug);
}
