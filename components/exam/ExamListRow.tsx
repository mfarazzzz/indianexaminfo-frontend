import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { getActionLinks, getExamEntityHref, pickDisplayDate } from "@/lib/exam/actionLinks";
import type { ExamEntity } from "@/types/exam";

// Full-width list row used by the dense homepage listing sections (Government
// Jobs, Entrance Exams, Boards & Universities). Part C: these sections are
// bordered list rows separated by a hairline rule — no rounded corners, no
// per-item border box, no card padding. The bordered-card treatment (ExamCard)
// is reserved for category doorways and sidebar blocks.
//
// Link selection, href building, and the date-for-state pick all live in the
// shared lib/exam/actionLinks module — this component renders what it returns and
// adds NO link logic of its own (that duplication is exactly what 404'd the site).

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

export function ExamListRow({ exam }: { exam: ExamEntity }) {
  const href = getExamEntityHref(exam);
  const links = getActionLinks(exam);
  const next = pickDisplayDate(exam);

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
