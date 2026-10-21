/**
 * examUpdateMeta.ts — 4a (2g): a page <title>/description derived from the exam's
 * LATEST PUBLISHED update, so a fresh admit-card/result notice reads as
 * "<Exam> <Year> Admit Card Out - Exam <date>" instead of the evergreen
 * "Notification, Eligibility & Apply". Returns null when there is no published
 * update (or its type has no reader-facing headline) so the caller keeps the
 * evergreen title. NEVER reads a draft. Values are escaped and length-limited.
 */
import type { ContentPost, ContentType } from "@/types/exam";

const HEADLINE: Partial<Record<ContentType, string>> = {
  "admit-card": "Admit Card Out",
  "result": "Result Out",
  "answer-key": "Answer Key Out",
  "cutoff": "Cut-off Out",
  "date-sheet": "Date Sheet Out",
  "notification": "Notification Released",
  "application": "Apply Online",
};

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Strip angle brackets + collapse whitespace — safe for <title> and og tags. */
function escapeMeta(s: string): string {
  return s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}
/** Hard length cap with an ellipsis (Google truncates ~60 title / ~160 desc). */
function clamp(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, Math.max(0, n - 1)).trimEnd() + "…";
}
function formatShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** The exam's newest PUBLISHED update → a fresher title/description, or null. */
export function examUpdateSeo(
  exam: { name: string; currentEditionYear?: number | null },
  updates: ContentPost[],
): { title: string; description: string } | null {
  const published = (updates ?? []).filter((u) => u && u.status === "published");
  if (published.length === 0) return null;
  const latest = [...published].sort(
    (a, b) => new Date(b.publishedAt || b.updatedAt || 0).getTime() - new Date(a.publishedAt || a.updatedAt || 0).getTime(),
  )[0];
  const headline = HEADLINE[latest.contentType];
  if (!headline) return null;

  const year = exam.currentEditionYear;
  // A date only when the update itself carries an exam date — never invented.
  const examDate = (latest.importantDates ?? []).find((d) => /exam/i.test(d.label ?? "") && d.date)?.date;
  const datePart = examDate ? ` - Exam ${formatShort(examDate)}` : "";

  const title = clamp(escapeMeta(`${exam.name}${year ? ` ${year}` : ""} ${headline}${datePart}`), 60);
  const description = clamp(escapeMeta(latest.excerpt || `${exam.name}${year ? ` ${year}` : ""} ${headline}.`), 158);
  return { title, description };
}
