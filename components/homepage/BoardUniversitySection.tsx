"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamCard } from "@/components/exam/ExamCard";
import type { ExamEntity } from "@/types/exam";

const TABS = ["All", "CBSE", "ICSE", "State Boards", "Central Universities", "State Universities", "IGNOU"] as const;
type Tab = typeof TABS[number];

const TAB_FILTER: Record<Tab, ((e: ExamEntity) => boolean) | null> = {
  All: null,
  CBSE: (e) => e.category === "cbse",
  ICSE: (e) => e.category === "cisce",
  "State Boards": (e) => ["up-board", "bihar-board", "rbse", "mpbse", "maharashtra-board"].includes(e.category),
  "Central Universities": (e) => e.entityType === "university" && e.subcategory === "central-university",
  "State Universities": (e) => e.entityType === "university" && e.subcategory === "up-universities",
  IGNOU: (e) => e.slug === "ignou",
};

function BoardUniversityClient({ exams }: { exams: ExamEntity[] }) {
  const [active, setActive] = useState<Tab>("All");
  const filterFn = TAB_FILTER[active];
  const filtered = filterFn ? exams.filter(filterFn) : exams;
  const shown    = filtered.slice(0, 6);

  return (
    <section aria-labelledby="board-university-heading" className="py-6 border-b border-gray-100">
      {/* Section header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-success">
        <div>
          <h2 id="board-university-heading" className="font-heading font-black text-base text-gray-900 uppercase tracking-wide">
            Boards &amp; Universities
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Class 10 &amp; 12 results, date sheets, university exams &amp; admit cards</p>
        </div>
        <Link href="/board-exam" className="text-xs font-semibold text-success hover:text-green-800 flex items-center gap-1 whitespace-nowrap mt-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 mb-4 border border-border rounded overflow-hidden w-fit max-w-full overflow-x-auto"
           role="group" aria-label="Filter board and university categories">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActive(tab)} aria-pressed={active === tab}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-semibold border-r border-border last:border-r-0 transition-colors whitespace-nowrap",
              active === tab ? "bg-success text-white" : "bg-white text-gray-600 hover:bg-gray-50"
            )}>
            {tab}
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-4 text-center">No exams found in this category.</p>
      )}
    </section>
  );
}

import { getExamsByPillar } from "@/services/examService";

export async function BoardUniversitySection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const exams = examsProp ?? await getExamsByPillar("board-university");
  const sorted = [...exams].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  return <BoardUniversityClient exams={sorted} />;
}
