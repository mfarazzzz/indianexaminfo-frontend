// Pure server component — NO "use client".
// Renders the homepage deadline / status strip from the EXISTING
// exam_derived_status VIEW (date-derived status model). Data is fetched ONCE in
// app/page.tsx via getDeadlineStripItems() and passed in as props — this
// component never queries Supabase itself.
//
// Truthfulness rules (mirrors the requirement):
//  • Only strip_eligible=true rows reach here (enforced by the service query).
//  • A date is shown as a firm deadline ONLY when hasConfirmedDates is true.
//    Otherwise it is labelled "expected" and never styled as a confirmed fact.
//  • derived_status keeps its priority: cancelled / postponed override the date
//    framing entirely.
//  • "Closing soon" urgency applies ONLY to confirmed upcoming deadlines.
import Link from "next/link";
import { AlertCircle, CalendarClock, XCircle } from "lucide-react";
import type { DeadlineStripItem } from "@/services/examService";
import { formatDate, isClosingSoon, getExamEntityHref, cn } from "@/lib/utils";

type Props = { items: DeadlineStripItem[] };

/** Which date to surface, and how to label it, given the derived status. */
function primaryDate(item: DeadlineStripItem): { label: string; date: string } | null {
  // Prefer an application close date when present (most actionable), else the
  // nearest confirmed date the VIEW computed.
  if (item.appCloseDate) return { label: "Last date", date: item.appCloseDate };
  if (item.admitCardDate) return { label: "Admit card", date: item.admitCardDate };
  if (item.resultDate) return { label: "Result", date: item.resultDate };
  if (item.nextConfirmedDate) return { label: "Next", date: item.nextConfirmedDate };
  return null;
}

export function DeadlineStrip({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section
      className="bg-white border-b border-border"
      aria-label="Upcoming exam deadlines and status"
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-stretch gap-2">
          {/* Static leading label */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 pr-3 border-r border-border">
            <CalendarClock className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wide text-gray-700">
              Deadlines
            </span>
          </div>

          {/* Horizontally scrollable on mobile; wrapping inline row on larger screens */}
          <ul
            className="flex-1 min-w-0 flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible scrollbar-thin"
            role="list"
          >
            {items.map((item) => {
              const cancelled = item.derivedStatus === "cancelled";
              const postponed = item.derivedStatus === "postponed";
              const pd = primaryDate(item);
              // Confirmed only when the VIEW says so AND status is not an override.
              const confirmed = item.hasConfirmedDates && !cancelled && !postponed;
              const closingSoon = confirmed && pd ? isClosingSoon(pd.date, 30) : false;

              const href = getExamEntityHref({
                pillar: item.pillar,
                category: item.category,
                slug: item.slug,
              });

              return (
                <li key={item.examId} className="shrink-0 lg:shrink">
                  <Link
                    href={href}
                    prefetch={false}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded border px-3 py-1.5 text-xs transition-colors",
                      cancelled
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : postponed
                        ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : closingSoon
                        ? "border-accent/30 bg-accent/5 text-gray-800 hover:bg-accent/10"
                        : "border-border bg-white text-gray-800 hover:bg-gray-50"
                    )}
                  >
                    <span className="font-semibold">{item.shortName}</span>

                    {cancelled ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                        <XCircle className="w-3 h-3" aria-hidden="true" />
                        Cancelled
                      </span>
                    ) : postponed ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                        <AlertCircle className="w-3 h-3" aria-hidden="true" />
                        Postponed
                      </span>
                    ) : pd ? (
                      <span className="inline-flex items-center gap-1 text-gray-500">
                        <span className="text-gray-400">{pd.label}:</span>
                        <span className="font-medium text-gray-700">{formatDate(pd.date)}</span>
                        {/* Confirmed dates are firm; anything else is explicitly tentative. */}
                        {!confirmed && (
                          <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                            (expected)
                          </span>
                        )}
                        {closingSoon && (
                          <span className="text-[10px] uppercase tracking-wide text-accent font-bold">
                            Closing soon
                          </span>
                        )}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
