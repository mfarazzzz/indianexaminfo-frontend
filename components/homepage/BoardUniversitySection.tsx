"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamCard } from "@/components/exam/ExamCard";
import type { ExamEntity } from "@/types/exam";

type CategoryTab = { label: string; slug: string | null };

function BoardUniversityClient({ exams, tabs }: { exams: ExamEntity[]; tabs: CategoryTab[] }) {
  const [active, setActive] = useState<string>("all");
  const activeSlug = tabs.find((t) => (active === "all" && t.slug === null) || t.slug === active)?.slug ?? null;
  const filtered = activeSlug ? exams.filter((e) => e.category === activeSlug) : exams;
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
        {tabs.map((tab) => {
          const key = tab.slug ?? "all";
          return (
            <button key={key} onClick={() => setActive(key)} aria-pressed={active === key}
              className={cn(
                "shrink-0 px-3 py-1.5 text-xs font-semibold border-r border-border last:border-r-0 transition-colors whitespace-nowrap",
                active === key ? "bg-success text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              )}>
              {tab.label}
            </button>
          );
        })}
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
import { getCategoriesByPillar } from "@/services/categoryService";

export async function BoardUniversitySection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const [exams, categories] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getExamsByPillar("board-university"),
    getCategoriesByPillar("board-university"),
  ]);
  const sorted = [...exams].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  // Build dynamic tabs from actual database categories
  const tabs: CategoryTab[] = [
    { label: "All", slug: null },
    ...categories.map((c) => ({
      label: c.shortName || c.name.replace(/ Board$/, "").replace(/ Exams$/, ""),
      slug: c.slug,
    })),
  ];

  return <BoardUniversityClient exams={sorted} tabs={tabs} />;
}
