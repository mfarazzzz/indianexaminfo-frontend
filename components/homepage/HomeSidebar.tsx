import Link from "next/link";
import { getAllExams } from "@/services/examService";
import { formatDate, isUrgent, isClosingSoon, getExamEntityHref } from "@/lib/utils";
import { AdSlot } from "@/components/ads/AdSlot";
import { cn } from "@/lib/utils";
import { CalendarDays, TrendingUp, ExternalLink } from "lucide-react";
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

export async function HomeSidebar({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const exams = examsProp ?? await getAllExams();

  // Upcoming important dates (next 15, sorted by date ascending)
  const importantDates = exams
    .flatMap((e) =>
      e.dates
        .filter((d) => new Date(d.date) >= new Date())
        .map((d) => ({
          examName: e.shortName,
          href:     getExamEntityHref(e),
          event:    d.label,
          date:     d.date,
          isUrgent: isUrgent(d.date, 7),
          isClosingSoon: isClosingSoon(d.date, 30),
        }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 12);

  return (
    <aside className="flex flex-col gap-5">
      {/* Sidebar top ad */}
      <AdSlot position="homepage-sidebar" size="300x250" />

      {/* ── Important Dates ── */}
      <div className="bg-white border border-border shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 bg-primary">
          <CalendarDays className="w-4 h-4 text-white" aria-hidden="true" />
          <h2 className="font-heading font-bold text-xs text-white uppercase tracking-wide">
            Important Dates
          </h2>
        </div>
        <div className="divide-y divide-border">
          {importantDates.map((row, i) => (
            <Link
              key={i}
              href={row.href}
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

      {/* ── Trending Searches / Quick Navigation ── */}
      <div className="bg-white border border-border shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-700">
          <TrendingUp className="w-4 h-4 text-white" aria-hidden="true" />
          <h2 className="font-heading font-bold text-xs text-white uppercase tracking-wide">
            Popular Right Now
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {trending.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors group text-xs"
              >
                <span className="w-4 shrink-0 text-gray-300 font-mono font-medium text-right">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-gray-700 group-hover:text-primary">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Second sidebar ad */}
      <AdSlot position="homepage-sidebar-2" size="300x250" />

      {/* ── Upcoming Exams ── */}
      <div className="bg-white border border-border shadow-sm">
        <div className="px-3 py-2 bg-teal-700">
          <h2 className="font-heading font-bold text-xs text-white uppercase tracking-wide">
            Upcoming Exams
          </h2>
        </div>
        <ul className="divide-y divide-border">
          {exams
            .filter((e) => e.status === "upcoming" || e.status === "registration-open")
            .slice(0, 6)
            .map((e) => {
              const href = getExamEntityHref(e);
              return (
                <li key={e.id}>
                  <Link
                    href={href}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-gray-50 transition-colors group text-xs"
                  >
                    <span className="text-gray-700 group-hover:text-primary flex-1 truncate">
                      {e.shortName}
                    </span>
                    <span className="shrink-0 text-xs px-1.5 py-0.5 bg-success/10 text-success font-semibold rounded capitalize">
                      {e.status.replace(/-/g, " ")}
                    </span>
                  </Link>
                </li>
              );
            })}
        </ul>
      </div>

      {/* ── Quick Navigation ── */}
      <div className="bg-white border border-border shadow-sm">
        <div className="px-3 py-2 border-b border-border">
          <h2 className="font-heading font-bold text-xs text-gray-800 uppercase tracking-wide">
            Quick Navigation
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-border">
          {[
            { label: "Sarkari Naukri", href: "/sarkari-naukri" },
            { label: "Entrance Exams", href: "/entrance-exam" },
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
              className="px-3 py-2 text-xs text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3 shrink-0 text-gray-300" aria-hidden="true" />
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
