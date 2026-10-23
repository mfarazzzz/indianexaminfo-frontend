/**
 * dateChange.ts — "the date moved, and this notice moved it".
 *
 * The edition timeline (exam_editions.important_dates) is the ONE canonical schedule
 * (P0 item 4): the strip, the status line, the dates list and the JSON-LD all read it,
 * so they can never disagree. A corrigendum or revised notice therefore cannot CHANGE a
 * reader's date by existing — the editor updates the timeline, and the notice records
 * what was announced. That left a reader looking at 30 Nov with no idea that the last
 * published notice had said 10 Nov.
 *
 * This derives that missing sentence, and nothing else. A note exists ONLY when:
 *   • the update is reader-live (published, not withdrawn, not expired, not superseded)
 *     — the same eligibility the Updates timeline uses, so a hidden notice cannot
 *     annotate a date;
 *   • its kind is one that moves a date (corrigendum | revised);
 *   • BOTH values exist — the notice's own date for that event AND the edition's — and
 *     they differ.
 * There is no "was TBA, now 30 Nov" and no invented previous value: if the notice did
 * not carry a date for that event, nothing is claimed.
 *
 * The edition date stays canonical everywhere it is displayed. This adds context, never
 * a second schedule.
 */
import { isLiveUpdate } from "@/lib/exam/updateFeed";
import { partitionUpdates } from "@/lib/exam/updates";
import type { ContentPost, ExamEntity } from "@/types/exam";

/** The kinds that legitimately move a published date. */
export const DATE_CHANGING_KINDS: ReadonlySet<string> = new Set(["corrigendum", "revised"]);

export interface DateChange {
  /** the edition row's machine type, when it has one (preferred match key) */
  key: string;
  /** the edition row's label, for the note text */
  label: string;
  /** the date the notice carried (ISO) */
  was: string;
  /** the edition's canonical date (ISO) */
  now: string;
  /** the notice's kind — "corrigendum" | "revised" */
  kind: string;
  /** the notice's own date (ISO) — published_at, falling back to updated_at */
  noticeDate: string;
}

type EditionRow = NonNullable<ExamEntity["dates"]>[number];
type NoticeRow = NonNullable<ContentPost["importantDates"]>[number];

const norm = (v: unknown): string => String(v ?? "").trim().toLowerCase();
const dated = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s && s !== "0000-0000-0000" ? s.slice(0, 10) : null;
};

/** The key a notice row and an edition row are matched on: type first, label second. */
const rowKey = (r: { type?: string; label?: string }): string =>
  norm(r.type) || norm(r.label);

/**
 * One note per edition row, from the NEWEST qualifying notice. Input order is the
 * query's (newest first), so the first match for a key is the most recent word on it.
 */
export function deriveDateChanges(
  dates: readonly EditionRow[] | null | undefined,
  updates: readonly ContentPost[] | null | undefined,
  todayISO: string,
): Map<string, DateChange> {
  const out = new Map<string, DateChange>();
  const rows = (dates ?? []).filter((d) => dated(d.date));
  if (rows.length === 0) return out;

  // Reader-live AND date-moving notices only. Superseded/withdrawn/expired notices are
  // history — they annotate nothing.
  const live = partitionUpdates((updates ?? []).filter((u) => isLiveUpdate(u, todayISO))).active;
  const notices = live
    .filter((v) => v.kind && DATE_CHANGING_KINDS.has(v.kind))
    .map((v) => v.post);
  if (notices.length === 0) return out;

  for (const edition of rows) {
    const eKey = rowKey(edition);
    if (!eKey) continue;
    const now = dated(edition.date);
    if (!now) continue;

    for (const notice of notices) {
      const entry: NoticeRow | undefined = (notice.importantDates ?? []).find(
        (n) => rowKey(n) === eKey || norm(n.label) === norm(edition.label),
      );
      const was = dated(entry?.date);
      if (!was || was === now) continue; // nothing to say: absent, or already agreed
      out.set(eKey || norm(edition.label), {
        key: eKey || norm(edition.label),
        label: edition.label,
        was,
        now,
        kind: notice.kind ?? "revised",
        noticeDate: dated(notice.publishedAt) ?? dated(notice.updatedAt) ?? now,
      });
      break; // the newest notice for this row wins
    }
  }
  return out;
}

/**
 * The reader's sentence. Dates are formatted by the caller (this stays a pure string
 * builder over ISO values, so it is testable without a locale).
 */
export function dateChangeSentence(c: DateChange, formatDate: (iso: string) => string): string {
  const kindWord = c.kind === "corrigendum" ? "corrigendum" : "revised notice";
  return `Updated by the ${kindWord} of ${formatDate(c.noticeDate)}: was ${formatDate(c.was)}, now ${formatDate(c.now)}.`;
}
