"use client";

/**
 * SubCategoryPanel — Middle column of the mega menu.
 * Shows sub-categories of the selected category as navigable links.
 */
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TaxonomyNode, NavigationPillar } from "@/types/navigation";

interface Props {
  parentNode: TaxonomyNode;
  subCategories: TaxonomyNode[];
  pillar: NavigationPillar;
}

const BADGE_COLORS: Record<string, string> = {
  popular: "bg-orange-100 text-orange-700",
  new: "bg-emerald-100 text-emerald-700",
  updated: "bg-blue-100 text-blue-700",
  trending: "bg-purple-100 text-purple-700",
  urgent: "bg-red-100 text-red-700",
};

export function SubCategoryPanel({ parentNode, subCategories, pillar }: Props) {
  return (
    <div className="flex-1 px-5 py-3 overflow-y-auto max-h-[calc(70vh-56px)]">
      {/* Header */}
      <div className="mb-3 pb-2 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{parentNode.label}</h3>
        {parentNode.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{parentNode.description}</p>
        )}
      </div>

      {/* Sub-category links */}
      <div className="space-y-0.5">
        {subCategories.map((node) => (
          <Link
            key={node.id}
            href={node.customUrl ?? `/${node.path}`}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors group"
          >
            {node.icon && <span className="text-sm shrink-0">{node.icon}</span>}
            <span className="flex-1 truncate">{node.label}</span>
            {node.badge && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                  BADGE_COLORS[node.badge] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {node.badge}
              </span>
            )}
            {node.showItemCount && node.itemCount > 0 && (
              <span className="text-[10px] text-gray-400 shrink-0">{node.itemCount}</span>
            )}
          </Link>
        ))}
      </div>

      {subCategories.length === 0 && (
        <p className="text-xs text-gray-400 py-4 text-center">No sub-categories</p>
      )}

      {/* View All link */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <Link
          href={parentNode.customUrl ?? `/${parentNode.path}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All {parentNode.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
