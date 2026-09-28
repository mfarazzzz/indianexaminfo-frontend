/**
 * verification.ts — the ONE reader-protection rule for unverified vacancies.
 *
 * Owner decision 2026-09-28: an unverified vacancy is NEVER unpublished. What
 * protection actually means is (a) the unverified notice on the page, (b) no
 * seeded statistics, (c) no result/merit link, (d) no JobPosting markup, and
 * (e) verification ordered by traffic. (c) and (d) were already in force
 * (SarkariNaukriDetailView L4, buildSarkariJobPostingSchema); this file is the
 * single home for (b) so the same words cannot mean different things on the
 * detail page, a listing card and a search row.
 *
 * The switch is `sarkari_naukri.verified_at` — the same column result_date (G2)
 * and the result link (L4) already key off. Nothing is inferred from
 * content_source or is_verified: verified_at is the only field an editor sets
 * when they have actually compared a row against the official notification.
 *
 * Measured on 28 Sep (read-only SQL): 361 rows, 0 with verified_at set;
 * total_candidates non-null on 361/361, pass_percentage 60/361, cutoff_marks
 * 60/361, vacancy_count 0/361. So today this gate hides seeded numbers on
 * every vacancy page — which is the honest state, not a regression.
 */
import type { SarkariNaukriItem } from '@/services/sarkariNaukriService';

/**
 * True only when the row has been verified by an editor. Every seeded numeric
 * claim (statistics, counts, marks, percentages) must be rendered behind this,
 * in the same way the result link already is.
 */
export function showsSeededStatistics(
  item: Pick<SarkariNaukriItem, 'verifiedAt'>,
): boolean {
  return Boolean(item.verifiedAt);
}
