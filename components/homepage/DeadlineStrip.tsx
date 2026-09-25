// Pure server component — NO "use client".
// Homepage status area: FOUR date-derived cards from the existing
// exam_derived_status VIEW. Data is fetched ONCE in app/page.tsx via
// getDeadlineBands() and passed in as props — this component never queries
// Supabase itself. Underlying date/query semantics are UNCHANGED.
//
//   Application Closing Soon → future application close date (label "Last date")
//   Results Declared         → result declared in the last 30 days
//   Admit Cards Out          → admit card released, exam not yet held
//   Exams Next 30 Days       → exam starts within the next 30 days
//
// Presentation: four distinct but compact soft-surface cards in one row on
// desktop, wrapping on tablet, stacked on mobile. Each card shows a few item
// rows with a clearly visible date label, and a "View All →" where a real
// destination route exists. Empty bands are hidden entirely.
import Link from "next/link";
import type { DeadlineBands, DeadlineBandItem } from "@/services/examService";
import { formatDate, getExamEntityHref, cn } from "@/lib/utils";

type Props = { bands: DeadlineBands };

type BandDef = {
  key: keyof Omit<DeadlineBands, "today">;
  title: string;
  /** Visible per-row date label (e.g. "Last date"). */
  dateLabel: string;
  /** Status colour retained for the label + card border (Part E). */
  border: string;
  title_c: string;
};

// Order per approved reference: Closing → Results → Admit Cards → Exams.
const BANDS: BandDef[] = [
  {
    key: "closingSoon",
    title: "Application closing soon",
    dateLabel: "Last date",
    border: "border-red-200",
    title_c: "text-red-700",
  },
  {
    key: "resultsOut",
    title: "Results declared",
    dateLabel: "Result",
    border: "border-green-200",
    title_c: "text-green-700",
  },
  {
    key: "admitCardOut",
    title: "Admit cards out",
    dateLabel: "Admit card",
    border: "border-violet-200",
    title_c: "text-violet-700",
  },
  {
    key: "examsThisMonth",
    title: "Exams next 7 days",
    dateLabel: "Exam",
    border: "border-orange-200",
    title_c: "text-orange-700",
  },
];

function Row({ item, dateLabel }: { item: DeadlineBandItem; dateLabel: string }) {
  const href = getExamEntityHref({ pillar: item.pillar, category: item.category, slug: item.slug });
  return (
    <li>
      {/* Item 1: the NAME is what the reader needs, so it gets the full row width and
          is allowed to wrap; the secondary date drops to its own line beneath it. No
          font shrinking, no truncating the name to two characters. */}
      <Link
        href={href}
        prefetch={false}
        className="block py-1 group"
      >
        <span className="block text-[13px] font-semibold text-gray-800 group-hover:text-primary leading-snug">
          {item.shortName}
        </span>
        <span className="block text-[11px] text-gray-500 leading-snug">
          <span className="text-gray-400">{dateLabel}: </span>
          <span className="font-medium text-gray-600">{formatDate(item.date)}</span>
        </span>
      </Link>
    </li>
  );
}

export function DeadlineStrip({ bands }: Props) {
  const visible = BANDS.filter((b) => bands[b.key].length > 0);
  // Item 7: if every band is empty, render nothing — a strip carrying no information
  // gets no space and no taps.
  if (visible.length === 0) return null;

  // Item 7: a REAL summary line, not the word "Deadlines". Names the counts the reader
  // would act on, e.g. "Today: 2 admit cards, 1 result, 3 closing". Only non-empty bands
  // appear in the sentence, in the same Closing → Results → Admit → Exams order.
  const SUMMARY_NOUN: Record<BandDef["key"], (n: number) => string> = {
    closingSoon: (n) => `${n} closing`,
    resultsOut: (n) => `${n} result${n === 1 ? "" : "s"}`,
    admitCardOut: (n) => `${n} admit card${n === 1 ? "" : "s"}`,
    examsThisMonth: (n) => `${n} exam${n === 1 ? "" : "s"} soon`,
  };
  const summary = visible.map((b) => SUMMARY_NOUN[b.key](bands[b.key].length)).join(", ");

  const Grid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {visible.map((band) => {
        const items = bands[band.key];
        return (
          <div
            key={band.key}
            className={cn("border border-border bg-white p-3 sm:p-4 flex flex-col", band.border)}
          >
            <div className="mb-2.5">
              <h3 className={cn("text-[13px] font-bold leading-tight", band.title_c)}>
                {band.title}
              </h3>
            </div>
            <ul className="divide-y divide-black/5">
              {items.map((item) => (
                <Row key={`${band.key}-${item.examId}`} item={item} dateLabel={band.dateLabel} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="bg-white" aria-label="Exam status this week">
      <div className="container mx-auto px-4 py-4">
        {/* MOBILE: collapsed summary line, expands on tap. The summary carries real counts.
            `sm:hidden` so it never shows on desktop. */}
        <details className="sm:hidden group border border-border rounded-lg">
          <summary className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer list-none">
            <span className="text-[13px] text-gray-700">
              <span className="font-semibold text-gray-900">Today:</span> {summary}
            </span>
            <span className="text-xs text-primary font-medium shrink-0 group-open:hidden">Show</span>
            <span className="text-xs text-gray-400 font-medium shrink-0 hidden group-open:inline">Hide</span>
          </summary>
          <div className="px-3 pb-3">{Grid}</div>
        </details>

        {/* DESKTOP: the full grid, always visible (original behaviour). */}
        <div className="hidden sm:block">{Grid}</div>
      </div>
    </section>
  );
}
