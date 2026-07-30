"use client";

/**
 * PanelSearchInput — Search input at the top of the navigation panel.
 * Debounced input with grouped results display.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { NavigationSearchResult } from "@/types/navigation";

interface Props {
  pillarLabel: string;
  onSearch: (query: string) => void;
  results: NavigationSearchResult[];
  onClose: () => void;
}

export function PanelSearchInput({ pillarLabel, onSearch, results, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(value);
        setShowResults(value.length >= 2);
      }, 200);
    },
    [onSearch]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Group results by breadcrumb path (category)
  const grouped = groupByCategory(results);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/50">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={`Search ${pillarLabel.toLowerCase()}...`}
          className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
          aria-label={`Search within ${pillarLabel}`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              onSearch("");
              setShowResults(false);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-72 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-1">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                    {category}
                  </div>
                  {items.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      onClick={onClose}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      {result.icon && <span className="text-sm">{result.icon}</span>}
                      <span className="flex-1 truncate">{result.label}</span>
                      {result.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {result.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-300 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function groupByCategory(
  results: NavigationSearchResult[]
): Record<string, NavigationSearchResult[]> {
  const groups: Record<string, NavigationSearchResult[]> = {};
  for (const result of results) {
    // Use the first breadcrumb item as category (pillar > category)
    const category = result.breadcrumb.slice(0, 2).join(" › ") || result.pillar;
    if (!groups[category]) groups[category] = [];
    groups[category].push(result);
  }
  return groups;
}
