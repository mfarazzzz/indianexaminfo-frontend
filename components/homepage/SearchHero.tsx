import Link from "next/link";

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

const stats = [
  { value: "500+",   label: "Exams Covered" },
  { value: "1,200+", label: "Articles" },
  { value: "Daily",  label: "Updates" },
];

export function SearchHero() {
  return (
    <section className="bg-primary py-7 border-b-4 border-primary-800" aria-label="Site search">
      <div className="container mx-auto px-4">

        {/* Tagline */}
        <p className="text-blue-200 text-xs text-center tracking-widest uppercase mb-4 font-body">
          India&apos;s Most Trusted Exam Information Portal
        </p>

        {/* Search bar */}
        <form action="/search" method="get" className="max-w-2xl mx-auto" role="search">
          <div className="flex items-stretch shadow-md overflow-hidden">

            {/* Category select */}
            <label htmlFor="hero-cat" className="sr-only">Filter by category</label>
            <select
              id="hero-cat"
              name="pillar"
              className="h-12 pl-3 pr-7 text-sm text-gray-700 bg-white border-r border-gray-200 focus:outline-none cursor-pointer shrink-0 min-w-[120px]"
            >
              <option value="">All Exams</option>
              <option value="sarkari-naukri">Sarkari Naukri</option>
              <option value="entrance-exam">Entrance Exam</option>
              <option value="board-exam">Board &amp; University</option>
            </select>

            {/* Search input */}
            <label htmlFor="hero-search" className="sr-only">
              Search exams, jobs, results, admit cards
            </label>
            <input
              id="hero-search"
              type="search"
              name="q"
              placeholder="Search Exams, Jobs, Results, Admit Cards, Universities..."
              className="flex-1 h-12 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              autoComplete="off"
            />

            {/* Submit */}
            <button
              type="submit"
              className="h-12 px-6 bg-accent hover:bg-accent/90 text-white text-sm font-semibold transition-colors shrink-0"
              aria-label="Search"
            >
              Search
            </button>
          </div>

          {/* Trending pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <span className="text-blue-300 text-xs font-medium shrink-0">Trending:</span>
            {trending.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className="text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
              >
                {t.label}
              </a>
            ))}
          </div>
        </form>

        {/* Stats bar */}
        <div className="max-w-lg mx-auto mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-white font-black text-lg leading-tight">{s.value}</div>
              <div className="text-blue-200 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
