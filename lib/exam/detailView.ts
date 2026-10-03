/**
 * detailView.ts — the ONE pure home for the EntityDetailPage display rules that
 * must not lie to a reader. The component only formats what these return; no
 * claim is decided inline in JSX. Same "derivation here, render there" split as
 * lib/exam/actionLinks.ts and lib/sarkari/verification.ts.
 *
 * Why these exist (Sprint-1 T1 trust hotfix):
 *  - (a) The detail page used to print "Verified by: IndianExamInfo Editorial
 *    Team" / "verified by our editorial team" UNCONDITIONALLY. The
 *    exams/admission/board/university tables have no verified_at / verified_by
 *    column (only sarkari_naukri does — see lib/sarkari/verification.ts), so that
 *    claim was false for every exam record. A record may advertise an editor
 *    verification ONLY when it actually carries one.
 *  - (c) A sidebar widget with no items (e.g. Tags) still rendered its heading
 *    and an empty box. It must disappear entirely when empty.
 */
import type { ExamEntity } from "@/types/exam";

/**
 * The approved honest line for a record with no editor verification. It links
 * the reader to the real source of truth (the official website) and never
 * claims our editors checked what they have not.
 */
export const UNVERIFIED_EXAM_NOTICE =
  "Compiled from the official notification. Not yet verified by our editors. " +
  "Always confirm dates, eligibility and fees on the official website before you apply or pay.";

export type VerificationAttribution =
  | { kind: "verified"; name: string; date: string }
  | { kind: "unverified" };

/**
 * The verified-by line is shown ONLY when the record carries real verification
 * data — a non-empty verifier name AND a date. Missing/blank on either → the
 * honest unverified line. Today no exam table populates these columns, so exam
 * records always resolve to "unverified"; the rule lights up automatically if
 * verified_at / verified_by are added, without touching the component.
 */
export function getExamVerification(
  exam: Pick<ExamEntity, "verifiedAt" | "verifiedBy">,
): VerificationAttribution {
  const name = exam.verifiedBy?.trim();
  const date = exam.verifiedAt?.trim();
  if (name && date) return { kind: "verified", name, date };
  return { kind: "unverified" };
}

/**
 * A sidebar list widget (Tags, or any similar) renders only when it has at least
 * one item. Empty → hide the whole panel, not just the rows, so no empty box or
 * stray heading appears.
 */
export function shouldShowListWidget(items: readonly unknown[] | null | undefined): boolean {
  return Array.isArray(items) && items.length > 0;
}
