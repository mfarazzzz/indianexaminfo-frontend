import { Search } from "lucide-react";

// Search-first hero. No marketing copy, no illustrations, no fabricated stats.
// The search bar is the sole visual focus; trending chips provide quick navigation.
const trending = [
  { label: "NEET UG",          href: "/entrance-exam/medical/neet-ug" },
  { label: "JEE Main",         href: "/entrance-exam/engineering/jee-main" },
  { label: "SSC CGL",          href: "/sarkari-naukri/ssc/ssc-cgl" },
  { label: "UPSC",             href: "/sarkari-naukri/upsc/civil-services" },
  { label: "IBPS PO",          href: "/sarkari-naukri/banking/ibps-po" },
  { label: "CAT",              href: "/entrance-exam/mba/cat" },
  { label: "UP Board Result",  href: "/board-exam/state/up-board/intermediate" },
  { label: "CBSE Date Sheet",  href: "/board-exam/cbse/class-12" },
];

export function SearchHero() {
  return (
    <section
      className="bg-primary"
      aria-label="Site search"
    >
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <form action="/search" method="get" role="search">
          {/* Single-row search control */}
          <div className="flex items-stretch bg-white rounded-lg shadow-md overflow-hidden max-w-3xl mx-auto">
            <label htmlFor="hero-cat" className="sr-only">Filter by category</label>
            <select
              id="hero-cat"
              name="pillar"
              className="h-12 sm:h-14 pl-3 pr-6 text-sm font-medium text-gray-700 bg-white border-r border-gray-200 focus:outline-none cursor-pointer shrink-0 min-w-[110px] sm:min-w-[130px]"
            >
              <option value="">All Exams</option>
              <option value="sarkari-naukri">Sarkari Naukri</option>
              <option value="entrance-exam">Entrance Exam</option>
              <option value="board-exam">Board &amp; University</option>
            </select>

            <label htmlFor="hero-search" className="sr-only">
              Search exams, jobs, results, admit cards
            </label>
            <input
              id="hero-search"
              type="search"
              name="q"
              placeholder="Search exams, jobs, results, admit cards…"
              className="flex-1 min-w-0 h-12 sm:h-14 px-4 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
              autoComplete="off"
            />

            <button
              type="submit"
              className="h-12 sm:h-14 px-5 sm:px-7 bg-accent hover:bg-accent/90 text-white font-semibold transition-colors shrink-0 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm sm:text-base">Search</span>
            </button>
          </div>

          {/* Trending — scrollable on mobile, wraps on desktop */}
          <div className="flex items-center gap-2 mt-3 max-w-3xl mx-auto overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-blue-200 text-xs font-semibold shrink-0">Trending:</span>
            {trending.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors whitespace-nowrap shrink-0"
              >
                {t.label}
              </a>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
