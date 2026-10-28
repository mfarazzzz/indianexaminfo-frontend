/**
 * lib/sarkari/vacancyPages.ts — the shape of the crawlable vacancy list (owner batch 4, K5).
 *
 * Kept out of the route file because TWO places need the same numbers: the pages themselves
 * (/sarkari-naukri/jobs/page/N) and the links that let a crawler find them from
 * /sarkari-naukri, which is in the sitemap. A page-count formula copied into both would drift,
 * and drift here means either a page that 404s or a trail that never reaches the last rows —
 * which is the exact orphan class this exists to remove (~160 vacancy records below the
 * client-side "Load more" fold in batch 3's measurement).
 */
/**
 * Rows per page — 20, the same size the reader already sees on the first fold of
 * /sarkari-naukri and the step the "Load more" button takes (components/sarkari-naukri/
 * SarkariNaukriList.tsx PAGE_SIZE). The ORDER is deliberately not the same: the hub sorts by
 * live urgency, this list by the clock-free order in lib/sarkari/listing, because pages that
 * reshuffle between regenerations would put one record on two pages or on none.
 */
export const VACANCY_PAGE_SIZE = 20;

/** The only place a vacancy-list page URL is built. */
export function jobPageHref(page: number): string {
  return `/sarkari-naukri/jobs/page/${page}`;
}

/** Total pages for N records — always at least 1, so an empty corpus still has a page 1 to 404 cleanly. */
export function vacancyPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / VACANCY_PAGE_SIZE));
}

/** The slugs that belong on page `page` (1-based) of an already-ordered list. */
export function sliceForPage<T>(ordered: readonly T[], page: number): T[] {
  return ordered.slice((page - 1) * VACANCY_PAGE_SIZE, page * VACANCY_PAGE_SIZE);
}

/**
 * The page numbers to show as real anchors: first, last, and a window around the current page.
 * Sorted, de-duplicated, in range. A crawler entering anywhere can walk to both ends, and the
 * last page is always one click away (otherwise the tail of the list is only reachable by
 * clicking "next" dozens of times, which is how rows end up uncrawled).
 */
export function pageTrail(page: number, pages: number): number[] {
  if (pages <= 0) return [];
  const wanted = [1, pages, page, page - 1, page + 1, page + 2];
  return [...new Set(wanted.filter((p) => p >= 1 && p <= pages))].sort((a, b) => a - b);
}

/** "/sarkari-naukri/jobs/page/0", ".../2.5", ".../abc" and beyond-last are NOT page 1. */
export function parseVacancyPage(raw: string | number): number {
  const s = String(raw);
  if (!/^\d{1,4}$/.test(s)) return NaN;
  return Number(s);
}
