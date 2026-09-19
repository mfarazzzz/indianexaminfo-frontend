import Link from "next/link";

/**
 * Four primary destination cards. No data fetching — purely presentational.
 *
 * The Sarkari Naukri card surfaces both pathways (competitive exam and direct
 * recruitment) as two CTAs inside one card. The reader sees "government job",
 * not "which selection method". Exam/merit/interview is a filter inside the
 * section, not a homepage-level split.
 *
 * Cards: Sarkari Naukri · Admissions · Board Exams · University Exams.
 */
export function AudienceGateway() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="navigation"
      aria-label="Choose your exam category"
    >
      {/* ── ① Sarkari Naukri ── */}
      <div className="flex flex-col bg-white border border-border border-t-2 border-t-primary rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="font-heading font-bold text-gray-900 text-base leading-tight">Sarkari Naukri</h3>
        <p className="text-xs text-gray-500 leading-tight mt-0.5 mb-3">Government jobs &amp; recruitment</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Competitive exams (SSC, Banking, Railway) and direct recruitment across all states.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["SSC", "UPSC", "Railway", "Anganwadi"].map((t) => (
            <span key={t} className="text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <Link href="/sarkari-naukri" className="text-xs font-semibold text-primary hover:underline transition-colors mt-auto">
          Explore Sarkari Naukri →
        </Link>
      </div>

      {/* ── ② Admissions ── */}
      <Link
        href="/entrance-exam"
        className="flex flex-col bg-white border border-border border-t-2 border-t-amber-500 rounded-lg p-4 shadow-sm hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Admissions — Entrance exams"
      >
        <h3 className="font-heading font-bold text-gray-900 text-base leading-tight">Admissions</h3>
        <p className="text-xs text-gray-500 leading-relaxed mt-1 mb-3">
          Engineering, Medical, MBA, Law, Agriculture and more.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["NEET", "JEE", "CAT", "CUET"].map((t) => (
            <span key={t} className="text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <span className="text-xs font-semibold text-amber-700 mt-auto">Explore Admissions →</span>
      </Link>

      {/* ── ③ Board Exams ── */}
      <Link
        href="/board-exam"
        className="flex flex-col bg-white border border-border border-t-2 border-t-success rounded-lg p-4 shadow-sm hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Board Exams"
      >
        <h3 className="font-heading font-bold text-gray-900 text-base leading-tight">Board Exams</h3>
        <p className="text-xs text-gray-500 leading-relaxed mt-1 mb-3">
          Class 10 &amp; 12 boards, date sheets, results and study material.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["CBSE", "UP Board", "Bihar Board"].map((t) => (
            <span key={t} className="text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <span className="text-xs font-semibold text-success mt-auto">Explore Board Exams →</span>
      </Link>

      {/* ── ④ University Exams ── */}
      <Link
        href="/university-exam"
        className="flex flex-col bg-white border border-border border-t-2 border-t-editorial rounded-lg p-4 shadow-sm hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="University Exams"
      >
        <h3 className="font-heading font-bold text-gray-900 text-base leading-tight">University Exams</h3>
        <p className="text-xs text-gray-500 leading-relaxed mt-1 mb-3">
          Semester exams, results, admit cards &amp; degree updates.
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {["IGNOU", "BHU", "DU", "MJPRU"].map((t) => (
            <span key={t} className="text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <span className="text-xs font-semibold text-editorial mt-auto">Explore University Exams →</span>
      </Link>
    </div>
  );
}
