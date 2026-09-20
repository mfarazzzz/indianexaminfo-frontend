import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { buildAnchorText, getCurrentYear } from "@/lib/seo/keywords";
import type { ExamEntity, ContentType } from "@/types/exam";

// Full-width list row used by the dense homepage listing sections (Government
// Jobs, Entrance Exams, Boards & Universities). Part C: these sections are
// bordered list rows separated by a hairline rule — no rounded corners, no
// per-item border box, no card padding. The bordered-card treatment (ExamCard)
// is reserved for category doorways and sidebar blocks.

function getExamHref(exam: ExamEntity): string {
  if (exam.pillar === "board-exam") {
    return exam.entityType === "university"
      ? `/board-exam/university/${exam.slug}`
      : `/board-exam/state/${exam.category}/${exam.slug}`;
  }
  if (!exam.category) return `/${exam.pillar}/${exam.slug}`;
  return `/${exam.pillar}/${exam.category}/${exam.slug}`;
}

// Status text colour — status colours are retained (Part E keeps status colour,
// drops decorative tint). Plain coloured text, no pastel pill background.
function statusText(status: string): string {
  const map: Record<string, string> = {
    "registration-open": "text-green-700",
    "admit-card-out": "text-green-700",
    "result-declared": "text-purple-700",
    "result-awaited": "text-purple-700",
    "registration-closed": "text-red-700",
    cancelled: "text-red-700",
    postponed: "text-orange-700",
  };
  return map[status] ?? "text-gray-500";
}

/** Pick at most two content links, ordered by the record's current status. */
function pickLinks(exam: ExamEntity, href: string): { label: string; ct: ContentType; href: string }[] {
  const available: Partial<Record<ContentType, string>> = {
    "admit-card":  exam.hasAdmitCard   ? `${href}/admit-card` : undefined,
    result:        exam.hasResult       ? `${href}/result` : undefined,
    syllabus:      exam.hasSyllabus     ? `${href}/syllabus` : undefined,
    "answer-key":  exam.hasAnswerKey    ? `${href}/answer-key` : undefined,
    "date-sheet":  exam.hasDateSheet    ? `${href}/date-sheet` : undefined,
    application:   exam.hasApplication  ? `${href}/application` : undefined,
  };
  const priorityByStatus: Record<string, ContentType[]> = {
    "registration-open": ["application", "admit-card"],
    notified: ["application", "admit-card"],
    upcoming: ["application", "syllabus"],
    "admit-card-out": ["admit-card", "result"],
    "result-declared": ["result", "answer-key"],
    "result-awaited": ["result", "answer-key"],
    "registration-closed": ["admit-card", "application"],
    completed: ["result", "answer-key"],
  };
  const fallback: ContentType[] = ["application", "admit-card", "result", "answer-key", "syllabus", "date-sheet"];
  const ordered = [...(priorityByStatus[exam.status] ?? []), ...fallback];
  const seen = new Set<ContentType>();
  const out: { label: string; ct: ContentType; href: string }[] = [];
  for (const ct of ordered) {
    if (seen.has(ct)) continue;
    seen.add(ct);
    const url = available[ct];
    if (url) {
      const label =
        ct === "admit-card" ? "Admit card" :
        ct === "result" ? "Result" :
        ct === "syllabus" ? "Syllabus" :
        ct === "answer-key" ? "Answer key" :
        ct === "date-sheet" ? "Date sheet" : "Apply";
      out.push({ label, ct, href: url });
    }
    if (out.length === 2) break;
  }
  return out;
}

export function ExamListRow({ exam }: { exam: ExamEntity }) {
  const href = getExamHref(exam);
  const links = pickLinks(exam, href);
  const validDates = exam.dates.filter((d) => d.date && d.date.trim() !== "");
  const next = validDates[0];

  return (
    // Track 3/2: the NAME is what the reader needs. On narrow screens the row stacks —
    // name + meta first (full width), the two content links drop to their own line — so
    // the two shrink-0 links can never squeeze the name. Side-by-side returns at sm+.
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={href} prefetch={false} className="font-heading font-semibold text-sm text-gray-900 hover:text-primary transition-colors">
            {exam.name}
          </Link>
          <span className={`text-xs font-medium ${statusText(exam.status)}`}>
            {exam.status.replace(/-/g, " ")}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="truncate">{exam.conductingBody}</span>
          {exam.vacancy != null && exam.vacancy > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-primary">{exam.vacancy.toLocaleString("en-IN")}</span>
              <span>vacancies</span>
            </>
          )}
          {next && (
            <>
              <span className="text-gray-300">·</span>
              <span>{next.label}: <span className="font-medium text-gray-700">{formatDate(next.date)}</span></span>
            </>
          )}
        </div>
      </div>
      {links.length > 0 && (
        <div className="shrink-0 flex items-center gap-4">
          {links.map((l) => (
            <Link key={l.ct} href={l.href} prefetch={false} className="text-xs text-primary hover:underline font-medium whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
