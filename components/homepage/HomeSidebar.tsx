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

export async function HomeSidebar({ exams: examsProp, todayISO: todayProp }: { exams?: ExamEntity[]; todayISO?: string } = {}) {
  const [exams, todayISO] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getAllExams(),
    todayProp ? Promise.resolve(todayProp) : getTodayIST(),
  ]);

  // Upcoming important dates (next 15, sorted by date ascending). Past/future
  // is decided by the single IST anchor (todayISO), never the server clock.
  const importantDates = exams
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
            .slice(0, 6)
            .map((e) => {
              const href = getExamEntityHref(e);
              return (
                <li key={e.id}>
                  <Link
                    href={href}
                    prefetch={false}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 transition-colors group text-xs"
                  >
                    <span className="text-gray-700 group-hover:text-primary flex-1 truncate">
                      {e.shortName}
                    </span>
                  </Link>
                </li>
              );
            })}
        </ul>
      </div>

      {/* ── Quick Navigation ── */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="font-heading font-bold text-sm text-gray-900">
            Quick navigation
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-border">
          {[
            { label: "Sarkari Naukri", href: "/sarkari-naukri" },
            { label: "Admissions", href: "/entrance-exam" },
            { label: "Board Exams",    href: "/board-exam" },
            { label: "Admit Card",     href: "/admit-card" },
            { label: "Results",        href: "/results" },
            { label: "Answer Key",     href: "/answer-key" },
            { label: "Syllabus",       href: "/syllabus" },
            { label: "Blog & News",    href: "/blog" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              className="px-3 py-2 text-xs text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
