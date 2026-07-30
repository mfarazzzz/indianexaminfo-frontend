"use client";

/**
 * MegaMenuMobile — Full-screen mobile navigation drawer.
 * Pillar accordions with expandable categories and sub-categories.
 * Body scroll locked, touch targets >= 44px.
 */
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, X, Search } from "lucide-react";
import { searchNavigationStatic } from "@/services/taxonomyService";
import type {
  NavigationTree,
  NavigationPillar,
  QuickAccessItem,
  TaxonomyNode,
  NavigationSearchResult,
} from "@/types/navigation";

interface Props {
  pillars: NavigationTree[];
  quickAccessItems: QuickAccessItem[];
  onClose: () => void;
}

export function MegaMenuMobile({ pillars, quickAccessItems, onClose }: Props) {
  const [expandedPillar, setExpandedPillar] = useState<NavigationPillar | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NavigationSearchResult[]>([]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Search handler
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      const results = searchNavigationStatic(pillars, query, null, 15);
      setSearchResults(results);
    },
    [pillars]
  );

  const handlePillarTap = (pillar: NavigationPillar) => {
    setExpandedPillar(expandedPillar === pillar ? null : pillar);
    setExpandedCategory(null);
  };

  const handleCategoryTap = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer from left */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-white overflow-y-auto animate-in slide-in-from-left duration-200"
        role="dialog"
        aria-label="Navigation menu"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between min-h-[44px]">
          <span className="font-heading font-bold text-primary text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-primary rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search exams, jobs..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-gray-50"
              aria-label="Search navigation"
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-100">
              {searchResults.map((result) => (
                <Link
                  key={result.id}
                  href={result.href}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 min-h-[44px]"
                >
                  {result.icon && <span className="text-sm">{result.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{result.label}</span>
                    <span className="text-[10px] text-gray-400 truncate">
                      {result.breadcrumb.join(" › ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links — horizontal scroll */}
        {quickAccessItems.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Quick Links
            </h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {quickAccessItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors min-h-[44px]"
                >
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pillar accordions */}
        <nav className="px-4 py-2" aria-label="Mobile navigation">
          {pillars.map((tree) => (
            <div key={tree.pillar} className="border-b border-gray-100 last:border-0">
              {/* Pillar trigger */}
              <button
                onClick={() => handlePillarTap(tree.pillar)}
                className="flex items-center justify-between w-full py-3.5 text-sm font-semibold text-gray-800 min-h-[44px]"
                aria-expanded={expandedPillar === tree.pillar}
              >
                <span className="flex items-center gap-2">
                  {tree.icon && <span className="text-base">{tree.icon}</span>}
                  {tree.label}
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    expandedPillar === tree.pillar ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Categories */}
              {expandedPillar === tree.pillar && (
                <div className="pb-3 pl-3 space-y-0.5">
                  {tree.nodes.length > 0 ? (
                    tree.nodes.map((category) => (
                      <CategoryAccordion
                        key={category.id}
                        category={category}
                        isExpanded={expandedCategory === category.id}
                        onToggle={() => handleCategoryTap(category.id)}
                        onClose={onClose}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 py-2 px-2">No items available</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}

function CategoryAccordion({
  category,
  isExpanded,
  onToggle,
  onClose,
}: {
  category: TaxonomyNode;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const children = category.children ?? [];

  return (
    <div>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full py-2.5 px-2 text-sm rounded transition-colors min-h-[44px] ${
          isExpanded
            ? "bg-primary/5 text-primary font-medium"
            : "text-gray-700 hover:bg-gray-50"
        }`}
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          {category.icon && <span className="text-sm">{category.icon}</span>}
          {category.label}
          {category.showItemCount && category.itemCount > 0 && (
            <span className="text-[10px] text-gray-400">({category.itemCount})</span>
          )}
        </span>
        <ChevronRight
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {isExpanded && children.length > 0 && (
        <div className="pl-4 py-1 space-y-0.5">
          {children.map((child) => (
            <Link
              key={child.id}
              href={child.customUrl ?? `/${child.path}`}
              onClick={onClose}
              className="block py-2 px-2 text-sm text-gray-600 hover:text-primary rounded hover:bg-gray-50 min-h-[44px] flex items-center"
            >
              {child.icon && <span className="text-sm mr-2">{child.icon}</span>}
              {child.label}
            </Link>
          ))}
          <Link
            href={category.customUrl ?? `/${category.path}`}
            onClick={onClose}
            className="block py-2 px-2 text-sm font-semibold text-primary min-h-[44px] flex items-center"
          >
            View All →
          </Link>
        </div>
      )}
    </div>
  );
}
