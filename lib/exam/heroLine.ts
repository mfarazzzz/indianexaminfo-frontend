/**
 * heroLine.ts — the ONE derivation for the top of an exam page: the clean name,
 * the derived status and the single date that matters right now.
 *
 * Why it exists (reference-page review 23 Oct, P1 items 7 and 12):
 *  - the H1 was a template sentence ("<name> — Notification, Eligibility & Apply")
 *    printed on EVERY record, including one whose result was already declared. A
 *    heading that cannot change is marketing copy, not information — and it reads
 *    wrong on a completed exam. The H1 is now the exam's own name; the status and
 *    the newest meaningful date live in the subtitle line under it.
 *  - the key-dates strip used to fall back to PAST dates in reverse order, so a
 *    completed exam showed a stack of history that repeated the Important Dates
 *    section. Past dates are now stated ONCE, in this line, and the strip only
 *    lists what is still to come (chronological, soonest first).
 *
 * Nothing is invented here: the status label is the shared statusLabel(), the date
 * and the day count come from getLeadBlock(), which itself uses the shared
 * pickDisplayDate() (the same date every other surface shows — the P0 item 4 rule).
 */
import { getLeadBlock } from "@/lib/exam/actionLinks";
import { statusLabel } from "@/lib/utils";
import { nameWithYear } from "@/lib/seo/keywords";
import type { ExamEntity } from "@/types/exam";

/**
 * The derived statuses that are genuinely POSITIVE for a reader — a deadline they
 * can still act on, an admit card, a declared result. Only these get the green
 * chip; a status we cannot read as positive never gets a colour claim
 * (colour-parity item 3, mock .chip.ok).
 */
export const POSITIVE_STATUSES: ReadonlySet<string> = new Set([
  "registration-open", "admit-card-out", "result-declared", "active",
]);

export interface HeroLine {
  /** The page H1: the exam's own name, with the EDITION year appended when the
   *  official name does not already carry one. No template suffix, ever. */
  title: string;
  /** The derived status, in the same words the rest of the site uses. */
  status: string;
  /** True → the chip may carry the green "ok" treatment. */
  isPositive: boolean;
  /** The one date that matters for this status (label + ISO), or null. */
  date: { label: string; value: string } | null;
  /** Whole days until that date, ONLY for a future confirmed date; null otherwise. */
  daysRemaining: number | null;
}

export function deriveHeroLine(exam: ExamEntity, todayISO: string): HeroLine {
  const lead = getLeadBlock(exam, todayISO);
  return {
    title: nameWithYear(exam.name, exam.currentEditionYear),
    status: statusLabel(exam.status),
    isPositive: POSITIVE_STATUSES.has(exam.status),
    date: lead.date ? { label: lead.date.label, value: lead.date.date } : null,
    daysRemaining: lead.daysRemaining,
  };
}

/** Does this record still have anything to come? Drives the key-dates strip. */
export function hasUpcomingDates(exam: ExamEntity, todayISO: string): boolean {
  return (exam.dates ?? []).some(
    (d) => d.date && String(d.date).trim() && String(d.date).slice(0, 10) >= todayISO,
  );
}
