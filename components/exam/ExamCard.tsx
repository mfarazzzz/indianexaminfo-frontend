import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getActionLinks, getExamEntityHref, pickDisplayDate } from "@/lib/exam/actionLinks";
import type { ExamEntity } from "@/types/exam";

type ExamCardProps = {
  exam: ExamEntity;
  showPillar?: boolean;
  className?: string;
  /** The single IST "today" anchor (from getTodayIST). Kept in the props for
   *  call-site compatibility; the date shown is now the state-relevant one picked
   *  by the shared module, so this is no longer read here. */
  todayISO: string;
};

// Card used by category doorways and pillar hubs (/entrance-exam, /board-exam,
// related-exam grids). Link selection, href building, and the date-for-state pick
// all live in the shared lib/exam/actionLinks module — this component renders what
// it returns and adds NO link logic of its own. Before, its own copy of the logic
// linked off the has_* flags and 404'd like ExamListRow did.

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

export function ExamCard({ exam }: ExamCardProps) {
  const href = getExamEntityHref(exam);
  const displayDate = pickDisplayDate(exam);
  const ctLinks = getActionLinks(exam);

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

      {/* Next important date — the one that matters for the record's current state */}
      {displayDate && (
        <div className="px-3 pb-2 flex items-center gap-1.5 text-xs border-t border-border pt-2 mt-auto">
          <span className="text-gray-500">{displayDate.label}:</span>
          <span className="text-gray-700 font-medium">
            {formatDate(displayDate.date)}
          </span>
        </div>
      )}

      {/* Content type quick links — at most two, gated on page-existence AND state */}
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
              {ct.label}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
