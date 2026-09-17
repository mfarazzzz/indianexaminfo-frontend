// Pure server component — NO "use client".
// Homepage deadline / status strip as FOUR date-derived bands from the existing
// exam_derived_status VIEW. Data is fetched ONCE in app/page.tsx via
// getDeadlineBands() and passed in as props — this component never queries
// Supabase itself.
//
// Each band is a distinct fact and carries its own label:
//   Closing soon      → application close date is still in the future
//   Admit card out    → admit card released, exam not yet held
//   Results out       → result declared in the last 30 days
//   Exams next 30 days → exam starts within the next 30 days
// A band is rendered ONLY when it has items — empty bands disappear entirely.
// Each band is capped by the service (no horizontal scroll; pills wrap).
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
    title: "Closing soon",
    dateLabel: "Last date",
    Icon: CalendarClock,
    accent: "text-accent border-accent",
    pill: "border-accent/30 bg-accent/5 hover:bg-accent/10 text-gray-800",
  },
  {
    key: "admitCardOut",
    title: "Admit card out",
    dateLabel: "Admit card",
    Icon: IdCard,
    accent: "text-primary border-primary",
    pill: "border-primary/30 bg-primary/5 hover:bg-primary/10 text-gray-800",
  },
  {
    key: "resultsOut",
    title: "Results out",
    dateLabel: "Result",
    Icon: Trophy,
    accent: "text-success border-success",
    pill: "border-success/30 bg-success/5 hover:bg-success/10 text-gray-800",
  },
  {
    key: "examsThisMonth",
    title: "Exams next 30 days",
    dateLabel: "Exam",
    Icon: CalendarDays,
    accent: "text-editorial border-editorial",
    pill: "border-editorial/30 bg-editorial/5 hover:bg-editorial/10 text-gray-800",
  },
];

function Pill({ item, dateLabel, pill }: { item: DeadlineBandItem; dateLabel: string; pill: string }) {
  const href = getExamEntityHref({ pillar: item.pillar, category: item.category, slug: item.slug });
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className={cn(
          "flex items-center gap-2 whitespace-nowrap rounded border px-3 py-1.5 text-xs transition-colors",
          pill
        )}
      >
        <span className="font-semibold">{item.shortName}</span>
        <span className="text-gray-400">{dateLabel}:</span>
        <span className="font-medium text-gray-700">{formatDate(item.date)}</span>
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
      <div className="container mx-auto px-4 py-3 space-y-3">
        {visible.map((band) => {
          const items = bands[band.key];
          const Icon = band.Icon;
          return (
            <div key={band.key}>
              {/* Band header */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={cn("w-4 h-4", band.accent.split(" ")[0])} aria-hidden="true" />
                <h2 className={cn("text-xs font-bold uppercase tracking-wide border-b-2 pb-0.5", band.accent)}>
                  {band.title}
                </h2>
                <span className="text-[10px] text-gray-400 font-semibold">({items.length})</span>
              </div>
              {/* Wrapping pills — no horizontal scroll */}
              <ul className="flex flex-wrap gap-2" role="list">
                {items.map((item) => (
                  <Pill key={`${band.key}-${item.examId}`} item={item} dateLabel={band.dateLabel} pill={band.pill} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
