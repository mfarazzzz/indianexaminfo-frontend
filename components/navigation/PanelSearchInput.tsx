"use client";

/**
 * PanelSearchInput — Search input at the top of the desktop navigation panel.
 *
 * Queries the REAL records site-wide via useSiteSearch (/api/search), not the
 * old static-label matcher. Site-wide is deliberate: a reader does not think in
 * pillars, so a query typed in any panel finds anything on the site. The
 * placeholder says "Search all of IndianExamInfo" to set that expectation.
 *
 * When a query genuinely returns nothing, we don't dead-end — we offer the full
 * site-search page for the same query.
 */
import React, { useRef } from "react";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { useSiteSearch, fullSiteSearchHref, type SiteSearchResult } from "@/lib/navigation/useSiteSearch";

interface Props {
  /** Kept for API compatibility; no longer used to scope the search. */
  pillarLabel?: string;
  onClose: () => void;
}

export function PanelSearchInput({ onClose }: Props) {
  const { query, results, loading, searched, search, reset } = useSiteSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const showPanel = query.trim().length >= 2;
  const grouped = groupByCategory(results);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search all of IndianExamInfo — exams, jobs, results…"
          className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          aria-label="Search all of IndianExamInfo"
        />
        {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" aria-hidden="true" />}
        {query && (
          <button
            onClick={() => { reset(); inputRef.current?.focus(); }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <>
              <div className="py-1">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                      {category}
                    </div>
                    {items.map((result) => (
                      <Link
                        key={result.id}
                        href={result.url}
                        onClick={onClose}
                        className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">{result.title}</span>
                          {result.meta && (
                            <span className="block text-[11px] text-gray-400 truncate">{result.meta}</span>
                          )}
                        </span>
                        {result.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                            {result.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
              <FullSiteLink query={query} onClose={onClose} />
            </>
          ) : loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Searching…</div>
          ) : searched ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-gray-500">No matches for &ldquo;{query}&rdquo; in the menu index.</p>
              <FullSiteLink query={query} onClose={onClose} prominent />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FullSiteLink({ query, onClose, prominent }: { query: string; onClose: () => void; prominent?: boolean }) {
  return (
    <Link
      href={fullSiteSearchHref(query)}
      onClick={onClose}
      className={
        prominent
          ? "inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary hover:underline"
          : "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 border-t border-gray-100"
      }
    >
      <Search className="w-3.5 h-3.5" />
      Search all of IndianExamInfo for &ldquo;{query}&rdquo;
    </Link>
  );
}

function groupByCategory(results: SiteSearchResult[]): Record<string, SiteSearchResult[]> {
  const groups: Record<string, SiteSearchResult[]> = {};
  for (const result of results) {
    (groups[result.category] ??= []).push(result);
  }
  return groups;
}
