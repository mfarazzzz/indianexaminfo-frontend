"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamCard } from "@/components/exam/ExamCard";
import type { ExamEntity } from "@/types/exam";

const TABS = ["All", "Engineering", "Medical", "MBA", "Law", "Agriculture", "Design", "Teaching", "Science PG"] as const;
type Tab = typeof TABS[number];

const TAB_FILTER: Record<Tab, string | null> = {
  All: null, Engineering: "engineering", Medical: "medical", MBA: "mba",
  Law: "law", Agriculture: "agriculture", Design: "design",
  Teaching: "teaching", "Science PG": "science-pg",
};

function EntranceExamClient({ exams }: { exams: ExamEntity[] }) {
  const [active, setActive] = useState<Tab>("All");
  const filtered = TAB_FILTER[active] ? exams.filter((e) => e.category === TAB_FILTER[active]) : exams;
  const shown = filtered.slice(0, 6);

  return (
    <section aria-labelledby="entrance-exam-heading" className="py-6 border-b border-gray-100">
      {/* Section header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-amber-500">
        <div>
          <h2 id="entrance-exam-heading" className="font-heading font-black text-base text-gray-900 uppercase tracking-wide">
            Entrance Exams
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Engineering, Medical, MBA, Law &amp; more</p>
        </div>
        <Link href="/entrance-exam" className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 whitespace-nowrap mt-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 mb-4 border border-border rounded overflow-hidden w-fit max-w-full overflow-x-auto"
           role="group" aria-label="Filter entrance exam categories">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActive(tab)} aria-pressed={active === tab}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-semibold border-r border-border last:border-r-0 transition-colors whitespace-nowrap",
              active === tab ? "bg-amber-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
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

export async function EntranceExamSection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const exams    = examsProp ?? await getExamsByPillar("entrance-exam");
  const featured = exams.filter((e) => e.isFeatured);
  return <EntranceExamClient exams={featured} />;
}
