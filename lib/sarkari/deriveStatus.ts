/**
 * deriveSarkariVacancyStatus.ts — Single source for vacancy page status.
 *
 * Derives reader-facing status from the three structured dates ONLY.
 * Replaces the stored `sarkari_naukri.status` column (98.6% wrong).
 *
 * Vocabulary matches the user-facing labels requested by the owner:
 *   dates-awaited       — all three dates null (notification not yet issued)
 *   notified            — notificationDate present, application window absent
 *   registration-open   — today falls within [start, end]
 *   registration-closed — application end date has passed
 *
 * The same function feeds both the page badge AND the JobPosting gate.
 */
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";

export type VacancyDerivedStatus =
  | "dates-awaited"
  | "notified"
  | "registration-open"
  | "registration-closed";

/**
 * Derive status purely from the date columns. Does NOT read `item.status`.
 * `todayISO` is the single IST anchor (YYYY-MM-DD from getTodayIST).
 * All sarkari date columns are Postgres `date` → service yields clean
 * YYYY-MM-DD → timezone-free lexical compare is sound.
 */
export function deriveVacancyStatus(
  item: Pick<SarkariNaukriItem, "notificationDate" | "applicationStartDate" | "applicationEndDate">,
  todayISO: string
): VacancyDerivedStatus {
  const notification = item.notificationDate?.slice(0, 10) ?? null;
  const start = item.applicationStartDate?.slice(0, 10) ?? null;
  const end = item.applicationEndDate?.slice(0, 10) ?? null;

  // All three null → dates awaited
  if (!notification && !start && !end) return "dates-awaited";

  // Notification exists but application window incomplete → notified
  if (!start || !end) return "notified";

  // Application window present: is it open or closed?
  if (todayISO <= end) return "registration-open";
  return "registration-closed";
}

/**
 * User-friendly label for display.
 */
const STATUS_LABELS: Record<VacancyDerivedStatus, string> = {
  "dates-awaited": "Dates Awaited",
  "notified": "Notified",
  "registration-open": "Registration Open",
  "registration-closed": "Registration Closed",
};

export function vacancyStatusLabel(status: VacancyDerivedStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Tailwind colour class for the status badge.
 */
export function vacancyStatusColor(status: VacancyDerivedStatus): string {
  switch (status) {
    case "registration-open": return "bg-green-100 text-green-700";
    case "registration-closed": return "bg-gray-100 text-gray-600";
    case "notified": return "bg-blue-100 text-blue-700";
    case "dates-awaited": return "bg-amber-50 text-amber-700";
  }
}
