"use client";

import React from "react";
import Link from "next/link";

export interface NavigationCardData {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  examCount: number;
  topExams: { slug: string; shortName: string }[];
  badge: "popular" | "new" | "updated" | null;
  pillar: string;
}

interface Props {
  card: NavigationCardData;
  onNavigate?: () => void;
}

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  popular: { bg: "bg-amber-50", text: "text-amber-600", label: "🔥 Popular" },
  new: { bg: "bg-green-50", text: "text-green-600", label: "✨ New" },
  updated: { bg: "bg-blue-50", text: "text-blue-600", label: "🔄 Updated" },
};

export function NavigationCard({ card, onNavigate }: Props) {
  const viewAllHref = `/${card.pillar}/${card.slug}`;
  const badgeInfo = card.badge ? BADGE_STYLES[card.badge] : null;

  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Header: Icon + Name + Count */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {card.icon && <span className="text-xl">{card.icon}</span>}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {card.name}
            </h3>
            <p className="text-[11px] text-gray-400">{card.examCount} Exams</p>
          </div>
        </div>
        {badgeInfo && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${badgeInfo.bg} ${badgeInfo.text}`}>
            {badgeInfo.label}
          </span>
        )}
      </div>

      {/* Top 3 exams as direct links */}
      <div className="flex-1 space-y-1 mb-3">
        {card.topExams.slice(0, 3).map((exam) => (
          <Link
            key={exam.slug}
            href={`/${card.pillar}/${card.slug}/${exam.slug}`}
            onClick={onNavigate}
            className="block text-xs text-gray-600 hover:text-primary transition-colors truncate py-0.5"
          >
            {exam.shortName}
          </Link>
        ))}
        {card.topExams.length === 0 && (
          <p className="text-xs text-gray-300 italic">No exams yet</p>
        )}
      </div>

      {/* View All link */}
      <Link
        href={viewAllHref}
        onClick={onNavigate}
        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-auto pt-2 border-t border-gray-50"
      >
        View All →
      </Link>
    </div>
  );
}
