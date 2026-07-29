"use client";

/**
 * NavigationPanel — Full-width dropdown panel with card grid.
 * Replaces traditional mega menu with modern app-style navigation.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { NavigationCard, type NavigationCardData } from "./NavigationCard";
import type { NavigationCategory, NavigationExam } from "@/services/navigationService";
import type { Pillar } from "@/types/exam";

interface Props {
  categories: NavigationCategory[];
  pillar: Pillar;
  pillarLabel: string;
  onClose: () => void;
  fetchExams: (categoryId: string, limit: number, featuredIds: string[]) => Promise<NavigationExam[]>;
}

export function NavigationPanel({ categories, pillar, pillarLabel, onClose, fetchExams }: Props) {
  const [cards, setCards] = useState<NavigationCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NavigationExam[] | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build card data on mount — fetch top 3 exams per category
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadCards() {
      const cardPromises = categories.slice(0, 12).map(async (cat) => {
        try {
          const exams = await fetchExams(cat.id, 3, cat.featuredExamIds);
          return {
            id: cat.id,
            slug: cat.slug,
            name: cat.customLabel || cat.name,
            icon: cat.customIcon || cat.icon,
            examCount: cat.examCount,
            topExams: exams.map((e) => ({ slug: e.slug, shortName: e.shortName || e.name })),
            badge: cat.badge,
            pillar,
          } as NavigationCardData;
        } catch {
          return {
            id: cat.id, slug: cat.slug, name: cat.name, icon: cat.icon,
            examCount: cat.examCount, topExams: [], badge: cat.badge, pillar,
          } as NavigationCardData;
        }
      });

      const results = await Promise.all(cardPromises);
      if (!cancelled) { setCards(results); setLoading(false); }
    }

    loadCards();
    return () => { cancelled = true; };
  }, [categories, pillar, fetchExams]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (query.length < 2) { setSearchResults(null); return; }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const { searchExamsInPillar } = await import("@/services/navigationService");
        const results = await searchExamsInPillar(pillar, query, 10);
        setSearchResults(results);
      } catch { setSearchResults([]); }
    }, 300);
  }, [pillar]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl animate-fade-in"
      style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}
      role="dialog"
      aria-label={`${pillarLabel} navigation`}
    >
      <div className="container mx-auto px-4 py-5 max-w-7xl">
        {/* Search */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={`Search ${pillarLabel}...`}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              aria-label={`Search within ${pillarLabel}`}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults(null); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" aria-label="Close navigation">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Results */}
        {searchResults !== null ? (
          <div className="mb-4">
            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No results for "{searchQuery}". <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} onClick={onClose} className="text-primary hover:underline">Search entire site →</Link></p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {searchResults.map((exam) => (
                  <Link key={exam.id} href={`/${pillar}/${exam.categorySlug}/${exam.slug}`} onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    <span className="text-sm text-gray-800 truncate">{exam.shortName || exam.name}</span>
                    <span className="text-[10px] text-gray-400 ml-auto shrink-0">{exam.categorySlug}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Card Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-gray-100 p-4">
                    <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-gray-50 rounded w-20" />
                      <div className="h-2.5 bg-gray-50 rounded w-16" />
                      <div className="h-2.5 bg-gray-50 rounded w-18" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                  <NavigationCard key={card.id} card={card} onNavigate={onClose} />
                ))}
              </div>
            )}

            {/* Trending Footer (placeholder for CMS-driven content) */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-4 overflow-x-auto">
              <span className="text-xs font-semibold text-gray-400 shrink-0">🔥 Trending:</span>
              {cards.slice(0, 4).flatMap((c) => c.topExams.slice(0, 1)).map((exam, i) => (
                <Link key={i} href={`/${pillar}/${cards[i]?.slug}/${exam.slug}`} onClick={onClose}
                  className="text-xs text-gray-600 hover:text-primary whitespace-nowrap shrink-0">
                  {exam.shortName}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
