/**
 * Shared edition-URL helpers for the "Other Editions" feature.
 *
 * CORE INVARIANT: `year` is a LABEL/identifier for an exam cycle, NOT a timeline position.
 * These helpers NEVER compare a year against today or against the current edition's year to
 * decide lifecycle. The only lifecycle authority is `isCurrent` (derived upstream from
 * exam.current_edition_id / exam_editions.is_current). Year is used solely as a URL segment and
 * a descending sort key for the switcher pills.
 */

import type { OtherEditionSummary } from "@/services/examService";

/** True when a URL segment is a 4-digit exam-cycle year label (2000–2100), not a content type.
 *  This is how a year URL is disambiguated from a content-type URL — content types are text
 *  slugs, never 4-digit numbers. Same rule the entrance route used (isYearParam). */
export function isEditionYear(seg: string): boolean {
  if (!/^\d{4}$/.test(seg)) return false;
  const n = Number(seg);
  return n >= 2000 && n <= 2100;
}

export interface EditionContext {
  viewingYear: number;
  editions: { year: number; editionLabel: string; isCurrent: boolean; hasContent: boolean }[];
  basePath: string;
}

/**
 * Build the EntityDetailPage `editionContext` prop from the switcher list. `viewingYear` is the
 * year label of the edition on THIS page. `basePath` is the main exam URL (no year segment);
 * the switcher builds `${basePath}/${year}` for non-current pills and `basePath` for the current
 * pill. Returns null when there is nothing to switch between (≤1 pillable edition), so callers
 * can omit the prop entirely on single-edition exams.
 */
export function buildEditionContext(
  editions: OtherEditionSummary[],
  viewingYear: number,
  basePath: string,
): EditionContext | null {
  const pillable = editions.filter((e) => e.isCurrent || e.hasContent);
  if (pillable.length <= 1) return null;
  return {
    viewingYear,
    basePath,
    editions: editions.map((e) => ({
      year: e.year,
      editionLabel: e.editionLabel,
      isCurrent: e.isCurrent,
      hasContent: e.hasContent,
    })),
  };
}
