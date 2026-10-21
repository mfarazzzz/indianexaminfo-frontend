/**
 * detailView.ts — the ONE pure home for the EntityDetailPage display rules that
 * must not lie to a reader. The component only formats what these return; no
 * claim is decided inline in JSX. Same "derivation here, render there" split as
 * lib/exam/actionLinks.ts and lib/sarkari/verification.ts.
 *
 * Why these exist (Sprint-1 T1 trust hotfix, updated for S3.2 / D6):
 *  - (a) The detail page used to print "Verified by: IndianExamInfo Editorial
 *    Team" UNCONDITIONALLY — a false claim for every exam record. A record may
 *    advertise an editor verification ONLY when it actually carries one. The
 *    exams table now has is_verified / verified_at / verified_by (the S3.2
 *    verify control writes them); the reader claim lights up only when all
 *    three are present, and names the TEAM — never the person (D6 decision 3:
 *    verified_by is a uuid and stays internal).
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

/**
 * The ONE claim a verified page may make (D6 decision 3): the editorial team,
 * never a personal name. verified_by stays an internal uuid; the read path
 * folds it into the `verified` boolean and this label replaces any name.
 */
export const VERIFIED_BY_LABEL = "IndianExamInfo editorial team";

export type VerificationAttribution =
  | { kind: "verified"; label: string; date: string }
  | { kind: "unverified" };

/**
 * The verified line is shown ONLY when the record carries real verification —
 * the is_verified flag AND a verified_at date (the service already requires a
 * verifier id to set `verified`; the uuid itself is never mapped). Anything
 * less stays on the honest unverified line — a flag without an author or a
 * date is not something a reader can trust.
 */
export function getExamVerification(
  exam: Pick<ExamEntity, "verified" | "verifiedAt">,
): VerificationAttribution {
  const date = exam.verifiedAt?.trim();
  if (exam.verified === true && date) return { kind: "verified", label: VERIFIED_BY_LABEL, date };
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
