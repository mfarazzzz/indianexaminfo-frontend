"use client";

import React from "react";
import Link from "next/link";
import type { NavigationCategory } from "@/services/navigationService";
import type { Pillar } from "@/types/exam";

interface Props {
  categories: NavigationCategory[];
  pillar: Pillar;
  activeCategoryId: string | null;
  onCategoryHover: (category: NavigationCategory) => void;
}

const BADGE_STYLES: Record<string, string> = {
  popular: "bg-amber-100 text-amber-700",
  new: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
};

export function CategoryPanel({ categories, pillar, activeCategoryId, onCategoryHover }: Props) {
  return (
    <div className="w-[220px] border-r border-gray-100 py-2 overflow-y-auto max-h-[60vh]" role="menu" aria-label="Categories">
      {categories.map((cat) => {
        const isActive = cat.id === activeCategoryId;
        const href = `/${pillar}/${cat.slug}`;

        return (
          <Link
            key={cat.id}
            href={href}
            role="menuitem"
            aria-current={isActive ? "true" : undefined}
            onMouseEnter={() => onCategoryHover(cat)}
            onFocus={() => onCategoryHover(cat)}
            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors group ${
              isActive
                ? "bg-primary/5 text-primary font-medium border-r-2 border-primary"
                : "text-gray-700 hover:bg-gray-50 hover:text-primary"
            }`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {cat.icon && <span className="text-base shrink-0">{cat.icon}</span>}
              <span className="truncate">{cat.name}</span>
            </span>

            <span className="flex items-center gap-1.5 shrink-0 ml-2">
              {cat.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${BADGE_STYLES[cat.badge] ?? ""}`}>
                  {cat.badge}
                </span>
              )}
              {cat.showExamCount && cat.examCount > 0 && (
                <span className="text-[10px] text-gray-400 font-mono">{cat.examCount}</span>
              )}
              <svg className="w-3 h-3 text-gray-300 group-hover:text-primary transition-colors" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 2l4 4-4 4" />
              </svg>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
