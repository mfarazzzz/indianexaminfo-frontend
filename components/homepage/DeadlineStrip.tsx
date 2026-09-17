// Pure server component — NO "use client".
// Homepage deadline / status strip as FOUR date-derived bands from the existing
// exam_derived_status VIEW. Data is fetched ONCE in app/page.tsx via
// getDeadlineBands() and passed in as props — this component never queries
// Supabase itself.
//
// Each band is a distinct fact and carries its own label:
//   Application Closing Soon → application close date is still in the future
//   Admit Cards Out          → admit card released, exam not yet held
//   Results Declared         → result declared in the last 30 days
//   Exams Next 30 Days       → exam starts within the next 30 days
// A band is rendered ONLY when it has items — empty bands disappear entirely.
// Compact module: bands sit side by side on desktop (each a tight labelled
// column) and stack on mobile; pills wrap and stay low-height.
import Link from "next/link";
import { CalendarClock, IdCard, Trophy, CalendarDays } from "lucide-react";
import type { DeadlineBands, DeadlineBandItem } from "@/services/examService";
import { formatDate, getExamEntityHref, cn } from "@/lib/utils";

type Props = { bands: DeadlineBands };

type BandDef = {
  key: keyof Omit<DeadlineBands, "today">;
  title: string;
  /** How this band labels its single date. */
  dateLabel: string;
  Icon: typeof CalendarClock;
  accent: string; // border + text accent classes for the band header
  pill: string; // pill styling
};

const BANDS: BandDef[] = [
  {
    key: "closingSoon",
    title: "Application Closing Soon",
    dateLabel: "Last date",
    Icon: CalendarClock,
    accent: "text-accent",
    pill: "hover:bg-accent/5 text-gray-700",
  },
  {
    key: "admitCardOut",
    title: "Admit Cards Out",
    dateLabel: "Admit card",
    Icon: IdCard,
    accent: "text-primary",
    pill: "hover:bg-primary/5 text-gray-700",
  },
  {
    key: "resultsOut",
    title: "Results Declared",
    dateLabel: "Result",
    Icon: Trophy,
    accent: "text-success",
    pill: "hover:bg-success/5 text-gray-700",
  },
  {
    key: "examsThisMonth",
    title: "Exams Next 30 Days",
    dateLabel: "Exam",
    Icon: CalendarDays,
    accent: "text-editorial",
    pill: "hover:bg-editorial/5 text-gray-700",
  },
];

function Row({ item, dateLabel, pill }: { item: DeadlineBandItem; dateLabel: string; pill: string }) {
  const href = getExamEntityHref({ pillar: item.pillar, category: item.category, slug: item.slug });
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className={cn(
          "flex items-baseline justify-between gap-2 rounded px-1.5 py-1 text-xs transition-colors",
          pill
        )}
      >
        <span className="font-semibold truncate">{item.shortName}</span>
        <span className="shrink-0 text-[11px] text-gray-400">
          <span className="sr-only">{dateLabel}: </span>
          {formatDate(item.date)}
        </span>
      </Link>
    </li>
  );
}

export function DeadlineStrip({ bands }: Props) {
  const visible = BANDS.filter((b) => bands[b.key].length > 0);
  if (visible.length === 0) return null;

  return (
    <section
      className="bg-white border-b border-border"
      aria-label="Upcoming exam deadlines and status"
    >
      {/* Compact status module: bands as tight columns on desktop, stacked on
          mobile. Divided by thin separators rather than heavy blocks. */}
      <div className="container mx-auto px-4 py-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-3 divide-y sm:divide-y-0 divide-gray-100">
          {visible.map((band) => {
            const items = bands[band.key];
            const Icon = band.Icon;
            return (
              <div key={band.key} className="pt-3 sm:pt-0 min-w-0">
                {/* Band header — one tight line */}
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", band.accent)} aria-hidden="true" />
                  <h2 className={cn("text-[11px] font-bold uppercase tracking-wide", band.accent)}>
                    {band.title}
                  </h2>
                  <span className="text-[10px] text-gray-400 font-medium">{items.length}</span>
                </div>
                <ul className="divide-y divide-gray-50" role="list">
                  {items.map((item) => (
                    <Row key={`${band.key}-${item.examId}`} item={item} dateLabel={band.dateLabel} pill={band.pill} />
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
