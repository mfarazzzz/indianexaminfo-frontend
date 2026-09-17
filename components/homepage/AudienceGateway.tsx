import Link from "next/link";
import { Briefcase, GraduationCap, BookOpen, School } from "lucide-react";

/**
 * Four primary category cards. Counts are fetched ONCE in app/page.tsx and
 * passed in as props — this component performs NO data fetching of its own
 * (previously it ran its own Promise.all, duplicating the page-level queries).
 *
 * Zero is rendered as "Coming soon" rather than a fabricated number, so an
 * empty pillar is honestly visible instead of being masked.
 */
type AudienceGatewayProps = {
  /** Government jobs split: competitive exams vs direct (bharti) recruitment. */
  sarkariExamCount: number;
  sarkariDirectCount: number;
  /** Entrance-exam pillar count — public label is "Admissions". */
  admissionsCount: number;
  /** Board-exam pillar count. */
  boardCount: number;
  /** University-exam pillar count. */
  universityCount: number;
};

export function AudienceGateway({
  sarkariExamCount,
  sarkariDirectCount,
  admissionsCount,
  boardCount,
  universityCount,
}: AudienceGatewayProps) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="navigation"
      aria-label="Choose your exam category"
    >
      {/* ── ① Sarkari Naukri (Government Jobs) ── */}
      <div
        className="block bg-white border border-border shadow-sm p-5 border-t-4 border-primary hover:shadow-md transition-shadow"
        aria-label="Sarkari Naukri — Competitive exams and direct merit-based recruitment"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-primary/10">
              <Briefcase className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">Sarkari Naukri</h2>
              <p className="text-xs text-gray-400">Government Jobs</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
              {sarkariExamCount} Exam
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-green-100 text-green-700">
              {sarkariDirectCount} Bharti
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-3">
          Competitive exams (SSC, Banking, Railway) and direct merit-based recruitment (Anganwadi, Municipal, Panchayat, Hospital) across all states
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">SSC</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Banking</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Railway</span>
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">Anganwadi</span>
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">Municipal</span>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Link href="/sarkari-naukri/exam" className="text-xs font-semibold text-primary hover:text-primary-700 transition-colors">
            Sarkari Exam →
          </Link>
          <Link href="/sarkari-naukri/bharti" className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors">
            Sarkari Bharti →
          </Link>
        </div>
      </div>

      {/* ── ② Admissions (public label for the entrance-exam pillar) ── */}
      <Link
        href="/entrance-exam"
        className="block bg-white border border-border shadow-sm p-5 border-t-4 border-amber-500 hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Admissions — Engineering, Medical, MBA, Law, Agriculture, Design entrance exams"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-amber-50">
              <GraduationCap className="w-5 h-5 text-amber-700" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">Admissions</h2>
              <p className="text-xs text-gray-400">Entrance Exams</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0 bg-amber-100 text-amber-700">
            {admissionsCount > 0 ? `${admissionsCount} exams` : "Coming soon"}
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
            {admissionsCount > 0 ? `${admissionsCount} entrance exams` : "Being added soon"}
          </span>
          <span className="text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors">Explore Admissions →</span>
        </div>
      </Link>

      {/* ── ③ Board Exams ── */}
      <Link
        href="/board-exam"
        className="block bg-white border border-border shadow-sm p-5 border-t-4 border-success hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Board Exams — State and national boards, date sheets, results"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-success/10">
              <BookOpen className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">Board Exams</h2>
              <p className="text-xs text-gray-400">School Boards</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0 bg-green-100 text-green-700">
            {boardCount > 0 ? `${boardCount} exams` : "Coming soon"}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">Class 10 &amp; 12 boards, date sheets, results</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {["CBSE", "UP Board", "Bihar Board", "ICSE"].map((cat) => (
            <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat}</span>
          ))}
          <span className="text-xs text-gray-400 px-1 py-0.5">+more</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {boardCount > 0 ? "State & national boards" : "Being added soon"}
          </span>
          <span className="text-xs font-semibold text-success hover:text-green-800 transition-colors">Explore Board Exams →</span>
        </div>
      </Link>

      {/* ── ④ University Exams ── */}
      <Link
        href="/university-exam"
        className="block bg-white border border-border shadow-sm p-5 border-t-4 border-editorial hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="University Exams — University semester exams, results and admit cards"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-editorial/10">
              <School className="w-5 h-5 text-editorial" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">University Exams</h2>
              <p className="text-xs text-gray-400">Universities</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0 bg-purple-100 text-purple-700">
            {universityCount > 0 ? `${universityCount} exams` : "Coming soon"}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">Semester exams, results, admit cards &amp; degree updates</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {["IGNOU", "BHU", "DU", "MJPRU"].map((cat) => (
            <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{cat}</span>
          ))}
          <span className="text-xs text-gray-400 px-1 py-0.5">+more</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {universityCount > 0 ? "Universities & colleges" : "Being added soon"}
          </span>
          <span className="text-xs font-semibold text-editorial hover:opacity-80 transition-colors">Explore University Exams →</span>
        </div>
      </Link>
    </div>
  );
}
