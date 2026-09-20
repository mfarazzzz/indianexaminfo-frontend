import Link from "next/link";
import { getAllExams, getTodayIST } from "@/services/examService";
import { formatDate, isUrgent, isClosingSoon, isFutureOrToday, getExamEntityHref } from "@/lib/utils";
import { AdSlot } from "@/components/ads/AdSlot";
import { cn } from "@/lib/utils";
import type { ExamEntity } from "@/types/exam";

const trending = [
  { label: "UPSC Civil Services 2025",   href: "/sarkari-naukri/upsc/civil-services" },
  { label: "IBPS PO 2025",              href: "/sarkari-naukri/banking/ibps-po" },
  { label: "SSC CGL 2025",              href: "/sarkari-naukri/ssc/ssc-cgl" },
  { label: "NEET UG 2025 Result",       href: "/entrance-exam/medical/neet-ug" },
  { label: "JEE Main 2026",             href: "/entrance-exam/engineering/jee-main" },
  { label: "CBSE Class 12 Result",      href: "/board-exam/cbse/class-12" },
  { label: "UP Board Result 2025",      href: "/board-exam/state/up-board/intermediate" },
  { label: "MJPRU Result 2025",         href: "/board-exam/university/mjpru" },
  { label: "Agniveer Army 2025",        href: "/sarkari-naukri/defence/agniveer-army" },
  { label: "CAT 2025",                  href: "/entrance-exam/mba/cat" },
];

/** The one date signal the "Upcoming exams" block shows for an exam, read from the
 *  SAME important_dates convention the detail-page timeline uses (date + state + note):
 *   1. the soonest CONFIRMED future/today date  -> { date }        (plain)
 *   2. else the first EXPECTED/POSTPONED/CANCELLED row              (tentative)
 *        -> { note } if it has one, else { date } if it has one
 *   3. else null                                                    -> name-only row
 *  Never invents placeholder text. */
function pickUpcomingDate(
  e: ExamEntity,
  todayISO: string,
): { date?: string; note?: string; tentative?: boolean } | null {
  const dates = e.dates ?? [];
  // 1. earliest confirmed (or unstated-state = confirmed) future date.
  const confirmedFuture = dates
    .filter((d) => d.date && d.date.trim() !== "" && (d.state ?? "confirmed") === "confirmed" && isFutureOrToday(d.date, todayISO))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (confirmedFuture) return { date: confirmedFuture.date };

  // 2. a tentative row (expected/postponed/cancelled) — show its note, else its date.
  const tentativeRow = dates.find(
    (d) => d.state === "expected" || d.state === "postponed" || d.state === "cancelled",
  );
  if (tentativeRow) {
    if (tentativeRow.note && tentativeRow.note.trim() !== "") return { note: tentativeRow.note.trim(), tentative: true };
    if (tentativeRow.date && tentativeRow.date.trim() !== "") return { date: tentativeRow.date, tentative: true };
  }
  // 3. nothing to show.
  return null;
}

export async function HomeSidebar({
  exams: examsProp,
  todayISO: todayProp,
  stripExamIds,
}: {
  exams?: ExamEntity[];
  todayISO?: string;
  /** Exam ids already shown in the deadline strip. The sidebar EXCLUDES these so it
   *  answers a different question ("and after that, what's coming") instead of
   *  repeating the strip's imminent exams. Empty/undefined = exclude nothing (e.g.
   *  the strip is empty), so the sidebar behaves as before. */
  stripExamIds?: string[];
} = {}) {
  const [exams, todayISO] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getAllExams(),
    todayProp ? Promise.resolve(todayProp) : getTodayIST(),
  ]);

  // Exclude BY EXAM: if an exam appears in any strip band, it does not appear here.
  const stripSet = new Set(stripExamIds ?? []);

  // Upcoming important dates (next 12, sorted by date ascending), for exams NOT already
  // in the strip. Past/future decided by the single IST anchor (todayISO).
  const importantDates = exams
    .filter((e) => !stripSet.has(e.id))
    .flatMap((e) =>
      e.dates
        .filter((d) => isFutureOrToday(d.date, todayISO))
        .map((d) => ({
          examName: e.shortName,
          href:     getExamEntityHref(e),
          event:    d.label,
          date:     d.date,
          isUrgent: isUrgent(d.date, todayISO, 7),
          isClosingSoon: isClosingSoon(d.date, todayISO, 30),
        }))
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);

  return (
    <aside className="flex flex-col gap-5">
      {/* Sidebar top ad — hidden until a real creative is served */}
      <AdSlot position="homepage-sidebar" size="300x250" hideWhenEmpty />

      {/* ── Important Dates ── */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="font-heading font-bold text-sm text-gray-900">
            Important dates
          </h2>
        </div>
        <div className="divide-y divide-border">
          {importantDates.map((row, i) => (
            <Link
              key={i}
              href={row.href}
              prefetch={false}
              className="flex items-start justify-between gap-2 px-3 py-2 hover:bg-gray-50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 group-hover:text-primary truncate">
                  {row.examName}
                </p>
                <p className="text-xs text-gray-500">{row.event}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-mono font-medium",
                  row.isUrgent
                    ? "text-accent"
                    : row.isClosingSoon
                    ? "text-warning"
                    : "text-gray-500"
                )}
              >
                {formatDate(row.date)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Popular Right Now ── */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="font-heading font-bold text-sm text-gray-900">
            Popular right now
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {trending.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={false}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors group text-xs"
              >
                <span className="w-4 shrink-0 text-gray-400 font-semibold text-[11px] text-right">
                  {i + 1}
                </span>
                <span className="flex-1 text-gray-700 group-hover:text-primary">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Second sidebar ad — hidden until a real creative is served */}
      <AdSlot position="homepage-sidebar-2" size="300x250" hideWhenEmpty />

      {/* ── Upcoming Exams ── */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="font-heading font-bold text-sm text-gray-900">
            Upcoming exams
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {exams
            .filter((e) => (
              e.status === "upcoming" ||
              e.status === "registration-open" ||
              e.status === "notified" ||
              e.status === "registration-closed" ||
              e.status === "admit-card-out"
            ))
            // A date the reader can act on is the point of this block. Compute each
            // exam's upcoming date-signal (see pickUpcomingDate) and order the ones that
            // HAVE a signal first, so the six slots aren't filled by recency-only,
            // date-less records while 50+ eligible exams have real dates. Selection set
            // is unchanged — this only orders within it.
            .map((e) => ({ e, signal: pickUpcomingDate(e, todayISO) }))
            .sort((a, b) => {
              const aHas = a.signal ? 0 : 1;
              const bHas = b.signal ? 0 : 1;
              if (aHas !== bHas) return aHas - bHas;              // date-bearing first
              // then soonest confirmed date first (undated rows keep source order)
              if (a.signal?.date && b.signal?.date) return a.signal.date.localeCompare(b.signal.date);
              return 0;
            })
            .slice(0, 6)
            .map(({ e, signal }) => {
              const href = getExamEntityHref(e);
              return (
                <li key={e.id}>
                  <Link
                    href={href}
                    prefetch={false}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 transition-colors group text-xs"
                  >
                    <span className="text-gray-700 group-hover:text-primary min-w-0 flex-1 truncate">
                      {e.shortName}
                    </span>
                    {/* Date signal, same convention as the timeline:
                        - confirmed future date -> show it plainly
                        - expected/postponed/cancelled row with a note -> note + (expected) marker
                        - neither -> render nothing (name-only is the honest empty state).
                        Never a hardcoded placeholder. */}
                    {signal && (
                      signal.note ? (
                        <span className="shrink-0 text-right text-[11px] text-gray-500 max-w-[55%] truncate" title={signal.note}>
                          {signal.note}{" "}
                          <span className="text-gray-400">(expected)</span>
                        </span>
                      ) : signal.date ? (
                        <span className={cn(
                          "shrink-0 text-xs font-mono font-medium",
                          signal.tentative ? "text-gray-400" : "text-gray-500"
                        )}>
                          {formatDate(signal.date)}
                          {signal.tentative && <span className="ml-1 text-[10px] font-sans">(expected)</span>}
                        </span>
                      ) : null
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      </div>

      {/* Track 3: "Quick navigation" block removed — it was the fourth copy of the site
          navigation (after the nav bar, the four category cards, and the module row). */}
    </aside>
  );
}
