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
      <Link
        href={href}
        prefetch={false}
        className="flex items-baseline justify-between gap-2 py-1 group"
      >
        <span className="text-[13px] font-semibold text-gray-800 truncate group-hover:text-primary">
          {item.shortName}
        </span>
        <span className="shrink-0 text-[11px] text-gray-500">
          <span className="text-gray-400">{dateLabel}: </span>
          <span className="font-medium text-gray-600">{formatDate(item.date)}</span>
        </span>
      </Link>
    </li>
  );
}

export function DeadlineStrip({ bands }: Props) {
  const visible = BANDS.filter((b) => bands[b.key].length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="bg-white" aria-label="Exam status this week">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {visible.map((band) => {
            const items = bands[band.key];
            return (
              <div
                key={band.key}
                className={cn("border border-border bg-white p-3 sm:p-4 flex flex-col", band.border)}
              >
                {/* Header — status colour retained on the label (Part E), no
                    decorative icon or pastel fill (Part B/E). */}
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
      </div>
    </section>
  );
}
