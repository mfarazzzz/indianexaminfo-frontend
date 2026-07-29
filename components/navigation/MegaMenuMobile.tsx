"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import type { NavigationCategory, NavigationExam } from "@/services/navigationService";
import type { Pillar } from "@/types/exam";

interface PillarData {
  pillar: Pillar;
  label: string;
  categories: NavigationCategory[];
}

interface Props {
  pillars: PillarData[];
  onClose: () => void;
  fetchExams: (categoryId: string, limit: number, featuredIds: string[]) => Promise<NavigationExam[]>;
}

export function MegaMenuMobile({ pillars, onClose, fetchExams }: Props) {
  const [expandedPillar, setExpandedPillar] = useState<Pillar | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryExams, setCategoryExams] = useState<Record<string, NavigationExam[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  const handlePillarTap = (pillar: Pillar) => {
    setExpandedPillar(expandedPillar === pillar ? null : pillar);
    setExpandedCategory(null);
  };

  const handleCategoryTap = async (cat: NavigationCategory) => {
    if (expandedCategory === cat.id) {
      setExpandedCategory(null);
      return;
    }
    setExpandedCategory(cat.id);

    if (!categoryExams[cat.id]) {
      setLoadingCategory(cat.id);
      try {
        const exams = await fetchExams(cat.id, cat.maxItems, cat.featuredExamIds);
        setCategoryExams((prev) => ({ ...prev, [cat.id]: exams }));
      } catch {
        setCategoryExams((prev) => ({ ...prev, [cat.id]: [] }));
      } finally {
        setLoadingCategory(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-slide-in-right" role="dialog" aria-label="Navigation menu">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="font-heading font-bold text-primary text-lg">Menu</span>
        <button onClick={onClose} className="p-2 text-gray-600 hover:text-primary rounded" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Pillar accordions */}
      <nav className="px-4 py-2" aria-label="Mobile navigation">
        {pillars.map(({ pillar, label, categories }) => (
          <div key={pillar} className="border-b border-gray-100 last:border-0">
            {/* Pillar trigger */}
            <button
              onClick={() => handlePillarTap(pillar)}
              className="flex items-center justify-between w-full py-3.5 text-sm font-semibold text-gray-800"
              aria-expanded={expandedPillar === pillar}
            >
              {label}
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedPillar === pillar ? "rotate-90" : ""}`} />
            </button>

            {/* Categories */}
            {expandedPillar === pillar && (
              <div className="pb-3 pl-3 space-y-0.5">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    {/* Category trigger */}
                    <button
                      onClick={() => handleCategoryTap(cat)}
                      className={`flex items-center justify-between w-full py-2.5 px-2 text-sm rounded transition-colors ${
                        expandedCategory === cat.id ? "bg-primary/5 text-primary font-medium" : "text-gray-700 hover:bg-gray-50"
                      }`}
                      aria-expanded={expandedCategory === cat.id}
                    >
                      <span className="flex items-center gap-2">
                        {cat.icon && <span className="text-sm">{cat.icon}</span>}
                        {cat.name}
                        {cat.showExamCount && cat.examCount > 0 && (
                          <span className="text-[10px] text-gray-400">({cat.examCount})</span>
                        )}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${expandedCategory === cat.id ? "rotate-90" : ""}`} />
                    </button>

                    {/* Exam list */}
                    {expandedCategory === cat.id && (
                      <div className="pl-4 py-1 space-y-0.5">
                        {loadingCategory === cat.id ? (
                          <div className="py-2 space-y-2 animate-pulse">
                            {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-gray-100 rounded w-3/4" />)}
                          </div>
                        ) : (
                          <>
                            {(categoryExams[cat.id] ?? []).map((exam) => (
                              <Link
                                key={exam.id}
                                href={`/${pillar}/${cat.slug}/${exam.slug}`}
                                onClick={onClose}
                                className="block py-2 px-2 text-sm text-gray-600 hover:text-primary rounded hover:bg-gray-50"
                              >
                                {exam.shortName || exam.name}
                              </Link>
                            ))}
                            <Link
                              href={`/${pillar}/${cat.slug}`}
                              onClick={onClose}
                              className="block py-2 px-2 text-sm font-semibold text-primary"
                            >
                              View All →
                            </Link>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
