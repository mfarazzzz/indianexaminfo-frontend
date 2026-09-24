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
  if (["result-declared", "answer-key-released", "merit-list-released"].includes(item.status) && item.resultDate) {
    return item.resultDate;
  }
  return item.applicationEndDate ?? item.examDate ?? item.resultDate;
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
