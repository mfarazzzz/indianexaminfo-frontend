"use client";

import React from "react";
import Link from "next/link";
import type { NavigationExam, NavigationCategory } from "@/services/navigationService";

interface Props {
  exams: NavigationExam[] | null;
  category: NavigationCategory | null;
  isLoading: boolean;
  onExamClick?: (exam: NavigationExam) => void;
}

export function ExamPanel({ exams, category, isLoading, onExamClick }: Props) {
  if (!category) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8">
        Hover a category to see exams
      </div>
    );
  }

  // Loading skeleton
  if (isLoading || exams === null) {
    return (
      <div className="flex-1 p-4 animate-pulse" aria-label="Loading exams">
        <div className="h-4 bg-gray-100 rounded w-48 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-100 rounded w-full mb-3" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    );
  }

  const pillar = category.pillar;
  const viewAllHref = `/${pillar}/${category.slug}`;

  return (
    <div className="flex-1 p-4 overflow-y-auto max-h-[60vh]" role="menu" aria-label={`Exams in ${category.name}`}>
      {/* Category header */}
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
        {category.name}
      </h3>

      {/* Exam list */}
      {exams.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">No exams in this category yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {exams.map((exam) => {
            const href = `/${pillar}/${category.slug}/${exam.slug}`;
            return (
              <li key={exam.id}>
                <Link
                  href={href}
                  role="menuitem"
                  onClick={() => onExamClick?.(exam)}
                  className="flex items-center gap-2 py-2 px-2 -mx-2 rounded text-sm text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors group"
                >
                  <span className="flex-1 truncate">{exam.shortName || exam.name}</span>
                  {exam.isFeatured && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold shrink-0">★</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* View All link */}
      <Link
        href={viewAllHref}
        className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-100 text-sm font-semibold text-primary hover:underline"
      >
        View All {category.name} →
      </Link>
    </div>
  );
}
