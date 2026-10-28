import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";

/** Open/actionable recruitments always precede terminal records on filtered lists. */
const STATUS_PRIORITY: Record<string, number> = {
  "application-open": 0,
  "admit-card-released": 1,
  "exam-scheduled": 2,
  notified: 2,
  upcoming: 2,
  "answer-key-released": 3,
  "interview-scheduled": 3,
  "merit-list-released": 3,
  "result-declared": 4,
  "application-closed": 5,
  completed: 6,
  cancelled: 7,
};

function relevantDate(item: SarkariNaukriItem): string | null {
  if (item.status === "application-open" && item.applicationEndDate) return item.applicationEndDate;
  if (item.status === "admit-card-released" && item.admitCardDate) return item.admitCardDate;
  if (item.status === "exam-scheduled" && item.examDate) return item.examDate;
  // G2: result_date is seed data on sarkari_naukri (unverified) — excluded from
  // ordering so a fabricated date cannot drive reader-facing list sequence.
  return item.applicationEndDate ?? item.examDate;
}

export function sortRecruitmentsOpenFirst(items: SarkariNaukriItem[]): SarkariNaukriItem[] {
  const today = Date.now();
  return [...items].sort((a, b) => {
    const priority = (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5);
    if (priority !== 0) return priority;

    const aDate = relevantDate(a);
    const bDate = relevantDate(b);
    if (aDate && bDate) {
      const aTime = new Date(aDate).getTime();
      const bTime = new Date(bDate).getTime();
      const aFuture = aTime >= today;
      const bFuture = bTime >= today;
      if (aFuture !== bFuture) return aFuture ? -1 : 1;
      return aFuture ? aTime - bTime : bTime - aTime;
    }
    if (aDate) return -1;
    if (bDate) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/**
 * The minimum a pagination order needs to be reproducible. Kept as its own type so the
 * comparator can be unit-tested without the full record (K5, owner batch 4).
 */
export interface VacancyOrderRow {
  slug: string;
  status: string;
  applicationEndDate?: string | null;
  examDate?: string | null;
  admitCardDate?: string | null;
  updatedAt: string;
}

/**
 * sortForStablePagination — the order used by the crawlable vacancy pages
 * /sarkari-naukri/jobs/page/N (owner batch 4, K5).
 *
 * WHY IT IS NOT sortRecruitmentsOpenFirst: that comparator asks "is this date still in the
 * future?" against Date.now(), so the sequence of the whole corpus CHANGES as records cross
 * their own deadlines. Fine for one page in one request; wrong across pages generated at
 * different times, because a row sliding from page 3 to page 2 would leave page 3 with a gap
 * and put the same row on two pages. A crawler that follows prev/next must see a TOTAL,
 * CLOCK-FREE order, so this sorts by status priority, then the relevant date ascending (past or
 * future — no clock), then updatedAt descending, and finally by slug, which makes the order
 * strict even for two identical rows.
 *
 * The reader still gets the urgency-first ordering they had before on the hub pages
 * (sortRecruitmentsOpenFirst is untouched); this order only decides WHICH 20 rows are on
 * page N, and page 1 of a stable order starts at the same row either way.
 */
function paginationDate(row: VacancyOrderRow): string | null {
  if (row.status === "application-open" && row.applicationEndDate) return row.applicationEndDate;
  if (row.status === "admit-card-released" && row.admitCardDate) return row.admitCardDate;
  if (row.status === "exam-scheduled" && row.examDate) return row.examDate;
  // result_date is never used for ordering (G2: unverified seed data on sarkari_naukri).
  return row.applicationEndDate ?? row.examDate ?? null;
}

export function compareForStablePagination(a: VacancyOrderRow, b: VacancyOrderRow): number {
  const byStatus = (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5);
  if (byStatus !== 0) return byStatus;

  const aDate = paginationDate(a);
  const bDate = paginationDate(b);
  // A record with a relevant date precedes one without — but only when the OTHER one truly has
  // none. Comparing the date strings for inequality here would short-circuit every dated pair
  // before the numeric compare below and make the order non-transitive (my first version did
  // exactly that; lib/sarkari/vacancyPages.test.ts pins it).
  if (!aDate && bDate) return 1;
  if (aDate && !bDate) return -1;
  if (aDate && bDate) {
    const byDate = new Date(aDate).getTime() - new Date(bDate).getTime();
    if (byDate !== 0) return byDate;   // nearest date first, past or future — no clock involved
  }

  const byUpdate = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  if (byUpdate !== 0) return byUpdate;
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;   // total, so pages cannot drift
}

export function sortForStablePagination<T extends VacancyOrderRow>(rows: readonly T[]): T[] {
  return [...rows].sort(compareForStablePagination);
}
