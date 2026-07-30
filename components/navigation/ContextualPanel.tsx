"use client";

/**
 * ContextualPanel — Right column of the mega menu.
 * Shows trending/featured content from the parent node's children.
 */
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TaxonomyNode, NavigationPillar } from "@/types/navigation";

interface Props {
  pillar: NavigationPillar;
  parentNode: TaxonomyNode | null;
}

export function ContextualPanel({ pillar, parentNode }: Props) {
  // Derive content from parent node's children (first 3 items per section)
  const children = parentNode?.children ?? [];
  const featured = children.filter((c) => c.isPinned).slice(0, 3);
  const trending = children
    .filter((c) => c.badge === "trending" || c.badge === "popular")
    .slice(0, 3);
  const quickLinks = children
    .filter((c) => !c.isPinned && c.badge !== "trending" && c.badge !== "popular")
    .slice(0, 3);

  // Fallback: if no categorized items, just show first 3
  const fallbackItems = children.slice(0, 3);
  const hasSections = featured.length > 0 || trending.length > 0 || quickLinks.length > 0;

  return (
    <div className="w-64 border-l border-gray-100 px-4 py-3 overflow-y-auto max-h-[calc(70vh-56px)] bg-gray-50/50">
      {parentNode ? (
        <>
          {hasSections ? (
            <>
              {featured.length > 0 && (
                <Section title="Featured" items={featured} pillar={pillar} />
              )}
              {trending.length > 0 && (
                <Section title="Trending" items={trending} pillar={pillar} />
              )}
              {quickLinks.length > 0 && (
                <Section title="Quick Links" items={quickLinks} pillar={pillar} />
              )}
            </>
          ) : (
            // Fallback: just show first children
            <Section title="Quick Links" items={fallbackItems} pillar={pillar} />
          )}

          {/* Explore pillar link */}
          <div className="mt-4 pt-3 border-t border-gray-200/60">
            <Link
              href={`/${pillar}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Explore All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-xs text-gray-400">Select a category to see details</p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  pillar,
}: {
  title: string;
  items: TaxonomyNode[];
  pillar: NavigationPillar;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.customUrl ?? `/${item.path}`}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-gray-700 hover:bg-white hover:text-primary hover:shadow-sm transition-all"
          >
            {item.icon && <span className="text-sm shrink-0">{item.icon}</span>}
            <span className="flex-1 truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
