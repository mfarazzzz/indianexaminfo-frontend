import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { buildAnchorText, getCurrentYear } from "@/lib/seo/keywords";
import type { ExamEntity, ContentType } from "@/types/exam";
import { Calendar } from "lucide-react";

type ExamCardProps = {
  exam: ExamEntity;
  showPillar?: boolean;
  className?: string;
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
    "registration-closed": "bg-red-100 text-red-700",
    "completed":           "bg-gray-100 text-gray-500",
    "ongoing":             "bg-blue-100 text-blue-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}

// Category dot color by pillar
function categoryDot(pillar: string): string {
  if (pillar === "entrance-exam") return "bg-amber-500";
  if (pillar === "board-exam") return "bg-success";
  return "bg-primary";
}

export function ExamCard({ exam }: ExamCardProps) {
  const href     = getExamHref(exam);
  const now      = new Date();
  // Filter out blank dates (no date value) — they shouldn't appear on frontend
  const validDates = exam.dates.filter((d) => d.date && d.date.trim() !== "");
  const nextDate = validDates.find((d) => new Date(d.date) > now);

  // For result-declared/completed exams, show the most recent past milestone if no urgent future date
  let displayDate = nextDate;
  if (!nextDate || (exam.status === "result-declared" || exam.status === "completed")) {
    const pastDates = validDates.filter((d) => new Date(d.date) <= now);
    const lastPast = pastDates.length > 0 ? pastDates[pastDates.length - 1] : null;
    // Prefer showing the most recent milestone (e.g. "Result Declared") for declared/completed
    if (lastPast && (exam.status === "result-declared" || exam.status === "completed")) {
      displayDate = nextDate?.isUrgent ? nextDate : lastPast;
    }
  }

  const ctLinks: { label: string; href: string; ct: ContentType }[] = [];
  if (exam.hasAdmitCard)   ctLinks.push({ ct: "admit-card",      label: buildAnchorText(exam.shortName, "admit-card",      getCurrentYear()), href: `${href}/admit-card` });
  if (exam.hasResult)      ctLinks.push({ ct: "result",          label: buildAnchorText(exam.shortName, "result",          getCurrentYear()), href: `${href}/result` });
  if (exam.hasSyllabus)    ctLinks.push({ ct: "syllabus",        label: buildAnchorText(exam.shortName, "syllabus",        getCurrentYear()), href: `${href}/syllabus` });
  if (exam.hasAnswerKey)   ctLinks.push({ ct: "answer-key",      label: buildAnchorText(exam.shortName, "answer-key",      getCurrentYear()), href: `${href}/answer-key` });
  if (exam.hasDateSheet)   ctLinks.push({ ct: "date-sheet",      label: buildAnchorText(exam.shortName, "date-sheet",      getCurrentYear()), href: `${href}/date-sheet` });
  if (exam.hasApplication) ctLinks.push({ ct: "application",     label: `Apply for ${exam.shortName} ${getCurrentYear()}`, href: `${href}/application` });

  return (
    <article
      className="bg-white border border-border shadow-sm flex flex-col hover:shadow-md hover:border-blue-200 transition-all duration-200"
      data-entity-type="exam"
      data-entity-name={exam.name}
      data-pillar={exam.pillar}
    >
      {/* Category + status row */}
      <div className="flex items-center justify-between gap-2 px-3 pt-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${categoryDot(exam.pillar)}`} aria-hidden="true" />
          <span className="text-xs text-gray-400 uppercase tracking-wide font-medium truncate">
            {exam.category.replace(/-/g, " ")}
          </span>
        </div>
        <span className={`status-badge shrink-0 text-xs font-medium px-2 py-0.5 rounded ${statusBadge(exam.status)}`}>
          {exam.status.replace(/-/g, " ")}
        </span>
      </div>

      {/* Title */}
      <div className="px-3 pt-2 pb-1">
        <h3 className="font-heading font-bold text-gray-900 text-sm leading-snug">
          <Link href={href} className="hover:text-primary transition-colors" prefetch={false}>
            {exam.name}
          </Link>
        </h3>
      </div>

      {/* Conducting body + vacancy */}
      <div className="px-3 pb-2 text-xs text-gray-500 flex items-center gap-1 flex-wrap">
        <span className="truncate">{exam.conductingBody}</span>
        {exam.vacancy != null && (
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
          <Calendar className="w-3 h-3 text-gray-400 shrink-0" aria-hidden="true" />
          <span className="text-gray-500">{displayDate.label}:</span>
          <span className={displayDate.isUrgent ? "text-accent font-semibold" : "text-gray-700 font-medium"}>
            {formatDate(displayDate.date)}
          </span>
        </div>
      )}

      {/* Content type quick links */}
      {ctLinks.length > 0 && (
        <div className="px-3 pb-3 flex flex-wrap gap-1 border-t border-border pt-2">
          {ctLinks.slice(0, 4).map((ct) => (
            <Link
              key={ct.ct}
              href={ct.href}
              className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              prefetch={false}
              title={ct.label}
            >
              {/* Short display label — keeps card compact */}
              {ct.ct === "admit-card"   ? "Admit Card"  :
               ct.ct === "result"       ? "Result"      :
               ct.ct === "syllabus"     ? "Syllabus"    :
               ct.ct === "answer-key"   ? "Answer Key"  :
               ct.ct === "date-sheet"   ? "Date Sheet"  :
               "Apply"}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
