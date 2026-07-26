import Link from "next/link";
import { Briefcase, GraduationCap, BookOpen } from "lucide-react";
import { getSarkariNaukriStats } from "@/services/sarkariNaukriService";
import { getExamCountByPillar } from "@/services/examService";

export async function AudienceGateway() {
  // All three cards read live counts. Zero is rendered as "—" rather than a
  // made-up number, so an empty pillar is visible instead of being masked.
  const [sarkariStats, entranceCount, boardCount] = await Promise.all([
    getSarkariNaukriStats(),
    getExamCountByPillar("entrance-exam"),
    getExamCountByPillar("board-university"),
  ]);

  const examCount = sarkariStats.exam;
  const directCount = sarkariStats.direct;

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      role="navigation"
      aria-label="Choose your exam category"
    >
      {/* ── Government Jobs (Sarkari Naukri) — Redesigned ── */}
      <div
        className="block bg-white border border-border shadow-sm p-5 border-t-4 border-primary hover:shadow-md transition-shadow"
        aria-label="Government Jobs — Competitive exams and direct merit-based recruitment"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-primary/10">
              <Briefcase className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">Government Jobs</h2>
              <p className="text-xs text-gray-400">Sarkari Naukri</p>
            </div>
          </div>
          {/* Two small badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
              {examCount} Exam
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
              {directCount} Bharti
            </span>
          </div>
        </div>

        {/* Description — signals both pathways */}
        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Competitive exams (SSC, Banking, Railway) and direct merit-based recruitment (Anganwadi, Municipal, Panchayat, Hospital) across all states
        </p>

        {/* Tag pills — mix of both pathways */}
        <div className="flex flex-wrap gap-1 mb-4">
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">SSC</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Banking</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Railway</span>
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">Anganwadi</span>
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">Municipal</span>
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">Panchayat</span>
        </div>

        {/* Split CTAs */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Link href="/sarkari-naukri/exam" className="text-xs font-semibold text-primary hover:text-primary-700 transition-colors">
            Sarkari Exam →
          </Link>
          <Link href="/sarkari-naukri/bharti" className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors">
            Sarkari Bharti →
          </Link>
        </div>
      </div>

      {/* ── Entrance Exams — unchanged ── */}
      <Link
        href="/entrance-exam"
        className="block bg-white border border-border shadow-sm p-5 border-t-4 border-amber-500 hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Entrance Exams — Engineering, Medical, MBA, Law, Agriculture, Design"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-amber-50">
              <GraduationCap className="w-5 h-5 text-amber-700" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">Entrance Exams</h2>
              <p className="text-xs text-gray-400">College Admissions</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0 bg-amber-100 text-amber-700">
            {entranceCount > 0 ? `${entranceCount} exams` : "Coming soon"}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">Engineering, Medical, MBA, Law, Agriculture, Design</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {["NEET", "JEE", "CAT", "CLAT", "GATE"].map((cat) => (
            <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat}</span>
          ))}
          <span className="text-xs text-gray-400 px-1 py-0.5">+more</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {entranceCount > 0 ? `${entranceCount} entrance exams` : "Being added soon"}
          </span>
          <span className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors">Explore Entrance Exams →</span>
        </div>
      </Link>

      {/* ── Board & University — unchanged ── */}
      <Link
        href="/board-exam"
        className="block bg-white border border-border shadow-sm p-5 border-t-4 border-success hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Board & University — Boards, Universities, Semester Exams, Results"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-success/10">
              <BookOpen className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">Board & University</h2>
              <p className="text-xs text-gray-400">Academic Exams</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0 bg-green-100 text-green-700">
            {boardCount > 0 ? `${boardCount} exams` : "Coming soon"}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">Boards, Universities, Semester Exams, Results</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {["CBSE", "UP Board", "IGNOU", "BHU", "MJPRU"].map((cat) => (
            <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat}</span>
          ))}
          <span className="text-xs text-gray-400 px-1 py-0.5">+more</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {boardCount > 0 ? "State boards & universities" : "Being added soon"}
          </span>
          <span className="text-xs font-semibold text-success hover:text-green-800 transition-colors">Explore Board Exams →</span>
        </div>
      </Link>
    </div>
  );
}
