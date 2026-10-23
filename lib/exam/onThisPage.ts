/**
 * onThisPage.ts — P1 item 9: the jump list under the tab row.
 *
 * The rule that matters is in the NAME: a chip exists only when the section it
 * points at actually rendered. A "Syllabus" chip scrolling you to nothing, or a
 * "Fee" chip on a record with no fee table, is worse than no chip at all — the
 * reader taps it, the page does not move, and every other chip becomes
 * untrustworthy. So this takes the ALREADY-rendered slugs (the same list the body
 * loop produced) and says nothing about sections that are absent.
 *
 * Order is reader order, not registry order: the questions people come for first
 * (dates → eligibility → fee → how to apply → syllabus → FAQ → updates). A section
 * that is not in JUMP_ORDER is simply not offered as a jump, even when it renders —
 * this is a short list of the common ones, not a table of contents.
 */
import { sectionHeadingEn } from "@/lib/exam/sectionHeadings";

export interface TocItem {
  key: string;
  label: string;
  /** In-page anchor for a section on this page; a real URL for a sub-page jump. */
  href: string;
}

/** The concepts offered as jump targets, in the order a reader wants them. */
export const JUMP_ORDER = [
  "important-dates",
  "eligibility",
  "application-fee",
  "application-process",
  "syllabus",
  "faqs",
] as const;

/** The DOM id a section renders with — ONE convention, used by the body and the chips. */
export const sectionAnchorId = (slug: string): string => `sec-${slug}`;

export function buildOnThisPage(opts: {
  /** Registry slugs whose section actually painted on the main page, in page order. */
  renderedSlugs: readonly string[];
  /** True when the exam has a live updates timeline on this page. */
  hasUpdates?: boolean;
  /** Real URL of the syllabus sub-page, when that tab exists (it is tab-only, so it is
   *  never a section on this page — the chip is a link, not an anchor). */
  syllabusHref?: string | null;
}): TocItem[] {
  const items: TocItem[] = [];
  for (const slug of JUMP_ORDER) {
    if (slug === "syllabus") {
      if (opts.syllabusHref) items.push({ key: slug, label: sectionHeadingEn("syllabus"), href: opts.syllabusHref });
      continue;
    }
    if (!opts.renderedSlugs.includes(slug)) continue;
    items.push({ key: slug, label: sectionHeadingEn(slug), href: `#${sectionAnchorId(slug)}` });
  }
  if (opts.hasUpdates) items.push({ key: "updates", label: sectionHeadingEn("updates"), href: "#updates" });
  return items;
}
