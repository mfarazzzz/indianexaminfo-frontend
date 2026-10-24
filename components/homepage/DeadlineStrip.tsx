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
import { formatDate, getExamEntityHref, daysUntil, cn } from "@/lib/utils";
import { UNVERIFIED_MARKER, BAND_UNVERIFIED_CAPTION } from "@/lib/exam/unverifiedMarker";

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

function Row({ item, dateLabel, showMarker }: { item: DeadlineBandItem; dateLabel: string; showMarker: boolean }) {
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
        <span className="block text-[13px] font-semibold text-gray-800 group-hover:text-primary leading-snug break-words">
          {item.name}
        </span>
        {/* Reader-trust (owner, 23–24 Oct): a per-row marker on an unverified row, but only
            in a MIXED band — when EVERY row of the band is unverified the band shows one
            caption instead (showMarker=false). Verified rows never show it. text-gray-500 on
            white = 4.84:1 (>= 4.5:1). */}
        {showMarker && !item.verified && (
          <span className="mt-0.5 block text-[11px] font-medium text-gray-500 break-words" title={UNVERIFIED_MARKER}>
            {UNVERIFIED_MARKER}
          </span>
        )}
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

  // Item 1: the collapsed line shows the SINGLE most-urgent item (not a bag of counts),
  // with the rest as an overflow count. Urgency order across ALL bands:
  //   closing > exam this week > admit card released > result declared.
  // Within that, the soonest date wins. "days left" is computed against the IST anchor
  // (bands.today) so no arithmetic is asked of the reader; today/tomorrow are spelled out.
  const URGENCY: BandDef["key"][] = ["closingSoon", "examsThisMonth", "admitCardOut", "resultsOut"];
  // bands.today is the IST anchor from the VIEW. It is non-null whenever bands exist (they do
  // here — visible.length > 0), but the type allows null; fall back to the IST calendar date so
  // daysUntil always receives a string. Same UTC+5:30 fallback getTodayIST uses.
  const today: string = bands.today ?? new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

  type Lead = { band: BandDef; item: DeadlineBandItem; days: number };
  let lead: Lead | null = null;
  let totalItems = 0;
  for (const key of URGENCY) {
    const band = BANDS.find((b) => b.key === key)!;
    const items = bands[key];
    totalItems += items.length;
    if (!lead && items.length > 0) {
      // soonest date within this (highest-priority non-empty) band
      const sorted = [...items].sort((a, b) => Math.abs(daysUntil(a.date, today)) - Math.abs(daysUntil(b.date, today)));
      lead = { band, item: sorted[0], days: daysUntil(sorted[0].date, today) };
    }
  }
  const overflow = lead ? totalItems - 1 : 0;
  // "in N days" → today / tomorrow / N days left. Past (admit/result already out) reads plainly.
  const daysPhrase = (n: number): string =>
    n <= 0 ? (n === 0 ? "today" : `${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"} ago`)
    : n === 1 ? "tomorrow"
    : `${n} days left`;
  // Left-border tint reuses the band's existing colour (closing = red, exams = orange, …).
  const leadBorder = lead?.band.border ?? "border-border";
  // The mobile lead belongs to a band: if that band is entirely unverified it shows the
  // ONE caption (not a per-row marker), matching the desktop card rule.
  const leadAllUnverified = lead ? bands[lead.band.key].every((i) => !i.verified) : false;

  // Item (c): the cards must FILL the available width — never leave a big empty area to
  // the right. The desktop column count equals the number of visible bands (1–4), so each
  // card stretches to 1fr; a single band spans the full row (no half-width card). Content
  // is never fabricated — a band only exists because the data put rows in it.
  const colCls =
    visible.length >= 4 ? "lg:grid-cols-4"
    : visible.length === 3 ? "lg:grid-cols-3"
    : visible.length === 2 ? "lg:grid-cols-2"
    : ""; // 1 band → base grid-cols-1, full width
  const smColCls = visible.length >= 2 ? "sm:grid-cols-2" : "";

  const Grid = (
    <div className={cn("grid grid-cols-1", smColCls, colCls, "gap-2 sm:gap-3")}>
      {visible.map((band) => {
        const items = bands[band.key];
        // Owner polish (24 Oct): if EVERY row of this band is unverified, say it ONCE as a
        // caption under the title and drop the per-row markers. A mixed band keeps per-row
        // markers on its unverified rows; an all-verified band shows neither.
        const allUnverified = items.length > 0 && items.every((i) => !i.verified);
        return (
          <div
            key={band.key}
            className={cn("border border-border bg-white p-3 sm:p-4 flex flex-col", band.border)}
          >
            <div className="mb-2.5">
              <h3 className={cn("text-[13px] font-bold leading-tight", band.title_c)}>
                {band.title}
              </h3>
              {allUnverified && (
                <p className="mt-1 text-[11px] font-medium text-gray-500 break-words" title={BAND_UNVERIFIED_CAPTION}>
                  {BAND_UNVERIFIED_CAPTION}
                </p>
              )}
            </div>
            <ul className="divide-y divide-black/5">
              {items.map((item) => (
                <Row key={`${band.key}-${item.examId}`} item={item} dateLabel={band.dateLabel} showMarker={!allUnverified} />
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
        {/* MOBILE: the single most-urgent item, tinted by its band via a left border rule.
            The WHOLE block taps to expand the full set. `sm:hidden` so it never shows on
            desktop. lead is always set here (visible.length > 0 guarantees an item). */}
        {lead && (
          <details className={cn("sm:hidden group rounded-lg border border-border border-l-4", leadBorder)}>
            <summary className="flex items-start justify-between gap-3 px-3 py-2.5 cursor-pointer list-none">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-bold uppercase tracking-wide", lead.band.title_c)}>
                    {lead.band.title}
                  </span>
                  {overflow > 0 && (
                    <span className="text-[11px] text-gray-500">+{overflow} more this week</span>
                  )}
                </div>
                <span className="block text-sm font-semibold text-gray-900 leading-snug mt-0.5 break-words">
                  {lead.item.name}
                </span>
                {leadAllUnverified ? (
                  <span className="block text-[11px] font-medium text-gray-500 mt-0.5 break-words" title={BAND_UNVERIFIED_CAPTION}>
                    {BAND_UNVERIFIED_CAPTION}
                  </span>
                ) : !lead.item.verified ? (
                  <span className="block text-[11px] font-medium text-gray-500 mt-0.5 break-words" title={UNVERIFIED_MARKER}>
                    {UNVERIFIED_MARKER}
                  </span>
                ) : null}
                <span className="block text-[12px] text-gray-500">
                  {lead.band.dateLabel} {formatDate(lead.item.date)} · <span className="font-medium text-gray-700">{daysPhrase(lead.days)}</span>
                </span>
              </div>
              <span className="text-gray-400 shrink-0 mt-0.5 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="px-3 pb-3 pt-1">{Grid}</div>
          </details>
        )}

        {/* DESKTOP: the full grid, always visible (original behaviour). */}
        <div className="hidden sm:block">{Grid}</div>
      </div>
    </section>
  );
}
