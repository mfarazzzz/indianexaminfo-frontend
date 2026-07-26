"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExamCard } from "@/components/exam/ExamCard";
import type { ExamEntity } from "@/types/exam";

type CategoryTab = { label: string; slug: string | null };

function SarkariNaukriClient({ exams, tabs }: { exams: ExamEntity[]; tabs: CategoryTab[] }) {
  const [active, setActive] = useState<string>("all");
  const activeSlug = tabs.find((t) => (active === "all" && t.slug === null) || t.slug === active)?.slug ?? null;
  const filtered = activeSlug ? exams.filter((e) => e.category === activeSlug) : exams;
  const shown = filtered.slice(0, 6);

  return (
    <section aria-labelledby="govt-jobs-heading" className="py-6 border-b border-gray-100">
      {/* Section header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b-2 border-primary">
        <div>
          <h2 id="govt-jobs-heading" className="font-heading font-black text-base text-gray-900 uppercase tracking-wide">
            Government Jobs
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Latest notifications, admit cards &amp; results</p>
        </div>
        <Link href="/sarkari-naukri" className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center gap-1 whitespace-nowrap mt-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 mb-4 border border-border rounded overflow-hidden w-fit max-w-full overflow-x-auto"
           role="group" aria-label="Filter government job categories">
        {tabs.map((tab) => {
          const key = tab.slug ?? "all";
          return (
            <button key={key} onClick={() => setActive(key)} aria-pressed={active === key}
              className={cn(
                "shrink-0 px-3 py-1.5 text-xs font-semibold border-r border-border last:border-r-0 transition-colors whitespace-nowrap",
                active === key ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              )}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
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

export async function SarkariNaukriSection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const [exams, categories] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getExamsByPillar("sarkari-naukri"),
    getCategoriesByPillar("sarkari-naukri"),
  ]);
  // Show featured first, then rest — never filter out non-featured
  const sorted = [...exams].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  // Build dynamic tabs from actual database categories
  const tabs: CategoryTab[] = [
    { label: "All", slug: null },
    ...categories.map((c) => ({
      label: c.shortName || c.name.replace(/ & .*$/, "").replace(/ Jobs$/, ""),
      slug: c.slug,
    })),
  ];

  return <SarkariNaukriClient exams={sorted} tabs={tabs} />;
}
