import Link from "next/link";
import { formatDate, isFutureOrToday } from "@/lib/utils";
import { buildAnchorText, getCurrentYear } from "@/lib/seo/keywords";
import type { ExamEntity, ContentType } from "@/types/exam";

type ExamCardProps = {
  exam: ExamEntity;
  showPillar?: boolean;
  className?: string;
  /** The single IST "today" anchor (from getTodayIST). Passed by server callers
   *  so the "next/last milestone" pick agrees with the derived-status VIEW and
   *  every other past/future decision, never the server UTC clock. */
  todayISO: string;
};

function getExamHref(exam: ExamEntity): string {
  if (exam.pillar === "board-exam") {
    return exam.entityType === "university"
      ? `/board-exam/university/${exam.slug}`
      : `/board-exam/state/${exam.category}/${exam.slug}`;
  }
  // If category is missing, fall back to flat slug URL (works for sarkari-naukri [slug] route)
  if (!exam.category) {
    return `/${exam.pillar}/${exam.slug}`;
  }
  return `/${exam.pillar}/${exam.category}/${exam.slug}`;
}

// Standardized status badge colors
function statusBadge(status: string): string {
  const map: Record<string, string> = {
    "registration-open":   "bg-green-100 text-green-700",
    "active":              "bg-blue-100 text-blue-700",
    "upcoming":            "bg-yellow-100 text-yellow-700",
    "result-declared":     "bg-purple-100 text-purple-700",
    "result-awaited":      "bg-purple-100 text-purple-700",
    "registration-closed": "bg-red-100 text-red-700",
    "completed":           "bg-gray-100 text-gray-500",
    "ongoing":             "bg-blue-100 text-blue-700",
    "notified":            "bg-yellow-100 text-yellow-700",
    "admit-card-out":      "bg-green-100 text-green-700",
    "dates-awaited":       "bg-gray-100 text-gray-400",
    "postponed":           "bg-orange-100 text-orange-700",
    "cancelled":           "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

export function ExamCard({ exam, todayISO }: ExamCardProps) {
  const href     = getExamHref(exam);
  // Filter out blank dates (no date value) — they shouldn't appear on frontend
  const validDates = exam.dates.filter((d) => d.date && d.date.trim() !== "");
  // "Future" = today-or-later on the IST anchor (the ONE past/future rule), so a
  // date that is today in IST but yesterday in UTC is still treated as upcoming.
  const nextDate = validDates.find((d) => isFutureOrToday(d.date, todayISO));

  // For result-declared/completed exams, show the most recent past milestone if no urgent future date
  let displayDate = nextDate;
  if (!nextDate || (exam.status === "result-declared" || exam.status === "completed")) {
    const pastDates = validDates.filter((d) => !isFutureOrToday(d.date, todayISO));
    const lastPast = pastDates.length > 0 ? pastDates[pastDates.length - 1] : null;
    // Prefer showing the most recent milestone (e.g. "Result Declared") for declared/completed
    if (lastPast && (exam.status === "result-declared" || exam.status === "completed")) {
      displayDate = nextDate?.isUrgent ? nextDate : lastPast;
    }
  }

  // Content-type links available for this record.
  const available: Partial<Record<ContentType, { label: string; href: string }>> = {
    "admit-card":  exam.hasAdmitCard   ? { label: buildAnchorText(exam.shortName, "admit-card", getCurrentYear()), href: `${href}/admit-card` } : undefined,
    result:        exam.hasResult       ? { label: buildAnchorText(exam.shortName, "result",     getCurrentYear()), href: `${href}/result` } : undefined,
    syllabus:      exam.hasSyllabus     ? { label: buildAnchorText(exam.shortName, "syllabus",   getCurrentYear()), href: `${href}/syllabus` } : undefined,
    "answer-key":  exam.hasAnswerKey    ? { label: buildAnchorText(exam.shortName, "answer-key", getCurrentYear()), href: `${href}/answer-key` } : undefined,
    "date-sheet":  exam.hasDateSheet    ? { label: buildAnchorText(exam.shortName, "date-sheet", getCurrentYear()), href: `${href}/date-sheet` } : undefined,
    application:   exam.hasApplication  ? { label: `Apply for ${exam.shortName} ${getCurrentYear()}`, href: `${href}/application` } : undefined,
  };

  // Part D: show at most TWO links, ordered by what the record's CURRENT status
  // makes most relevant, then filled from a sensible fallback order. The rest
  // live on the detail page.
  //   application phase → Apply first; results phase → Result first;
  //   admit-card phase  → Admit Card first.
  const priorityByStatus: Record<string, ContentType[]> = {
    "registration-open":   ["application", "admit-card"],
    notified:              ["application", "admit-card"],
    upcoming:              ["application", "syllabus"],
    "admit-card-out":      ["admit-card", "result"],
    "result-declared":     ["result", "answer-key"],
    "result-awaited":      ["result", "answer-key"],
    "registration-closed": ["admit-card", "application"],
    completed:             ["result", "answer-key"],
  };
  const fallbackOrder: ContentType[] = ["application", "admit-card", "result", "answer-key", "syllabus", "date-sheet"];
  const ordered: ContentType[] = [...(priorityByStatus[exam.status] ?? []), ...fallbackOrder];
  const seenCt = new Set<ContentType>();
  const ctLinks: { label: string; href: string; ct: ContentType }[] = [];
  for (const ct of ordered) {
    if (seenCt.has(ct)) continue;
    seenCt.add(ct);
    const entry = available[ct];
    if (entry) ctLinks.push({ ct, label: entry.label, href: entry.href });
    if (ctLinks.length === 2) break;
  }

  return (
    <article
      className="bg-white border border-border shadow-sm flex flex-col hover:shadow-md hover:border-blue-200 transition-all duration-200"
      data-entity-type="exam"
      data-entity-name={exam.name}
      data-pillar={exam.pillar}
    >
      {/* Category + status row */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <span className="text-xs text-gray-500 font-medium truncate min-w-0">
          {exam.category.replace(/-/g, " ")}
        </span>
        <span className={`status-badge shrink-0 text-xs font-medium px-2 py-0.5 rounded ${statusBadge(exam.status)}`}>
          {exam.status.replace(/-/g, " ")}
        </span>
      </div>

      {/* Title */}
      <div className="px-3 pt-2 pb-1">
        <h3 className="font-heading font-bold text-gray-900 text-sm leading-snug">
          {/* prefetch={false}: exam detail routes are dynamic/ISR, so prefetch={null}
              (the default) fetches the FULL RSC payload, not a static shell — measured
              at 25-108KB per link on prod. false is the only real "off" for these. */}
          <Link href={href} className="hover:text-primary transition-colors" prefetch={false}>
            {exam.name}
          </Link>
        </h3>
      </div>

      {/* Conducting body + vacancy */}
      <div className="px-3 pb-2 text-xs text-gray-500 flex items-center gap-1 flex-wrap">
        <span className="truncate">{exam.conductingBody}</span>
        {exam.vacancy != null && exam.vacancy > 0 && (
          <>
            <span className="text-gray-300">·</span>
            <span className="font-bold text-primary">
              {exam.vacancy.toLocaleString("en-IN")}
            </span>
            <span className="text-gray-400">vacancies</span>
          </>
        )}
      </div>

      {/* Admission to (entrance exams) */}
      {exam.admissionTo && (
        <div className="px-3 pb-1 text-xs text-gray-500">
          <span className="font-medium">Admission to:</span> {exam.admissionTo}
        </div>
      )}

      {/* Academic info (boards/universities) */}
      {exam.academicYear && (
        <div className="px-3 pb-1 text-xs text-gray-500">
          <span className="font-medium">Session:</span> {exam.academicYear}
          {exam.semester && <span> · {exam.semester}</span>}
        </div>
      )}

      {/* Next important date */}
      {displayDate && (
        <div className="px-3 pb-2 flex items-center gap-1.5 text-xs border-t border-border pt-2 mt-auto">
          <span className="text-gray-500">{displayDate.label}:</span>
          <span className={displayDate.isUrgent ? "text-accent font-semibold" : "text-gray-700 font-medium"}>
            {formatDate(displayDate.date)}
          </span>
        </div>
      )}

      {/* Content type quick links — Part D: at most two, plain text, status-driven */}
      {ctLinks.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-2">
          {ctLinks.map((ct) => (
            <Link
              key={ct.ct}
              href={ct.href}
              className="text-xs text-primary hover:underline font-medium"
              prefetch={false}
              title={ct.label}
            >
              {ct.ct === "admit-card"   ? "Admit card"  :
               ct.ct === "result"       ? "Result"      :
               ct.ct === "syllabus"     ? "Syllabus"    :
               ct.ct === "answer-key"   ? "Answer key"  :
               ct.ct === "date-sheet"   ? "Date sheet"  :
               "Apply"}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
