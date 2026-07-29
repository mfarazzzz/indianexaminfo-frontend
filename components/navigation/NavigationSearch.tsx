"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { NavigationExam } from "@/services/navigationService";
import type { Pillar } from "@/types/exam";

interface Props {
  pillar: Pillar;
  onSearch: (query: string) => Promise<NavigationExam[]>;
  onClose?: () => void;
  placeholder?: string;
}

export function NavigationSearch({ pillar, onSearch, onClose, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NavigationExam[] | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const data = await onSearch(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSearch]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const clearSearch = () => { setQuery(""); setResults(null); inputRef.current?.focus(); };

  return (
    <div className="relative">
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "Search exams..."}
          className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
          aria-label="Search exams in navigation"
        />
        {query && (
          <button onClick={clearSearch} className="p-0.5 text-gray-400 hover:text-gray-600" aria-label="Clear search">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results */}
      {results !== null && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-gray-100 rounded w-3/4" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No exams found for &ldquo;{query}&rdquo;</p>
              <Link href={`/search?q=${encodeURIComponent(query)}`} onClick={onClose}
                className="text-xs text-primary hover:underline mt-1 inline-block">
                Search entire site →
              </Link>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((exam) => (
                <li key={exam.id}>
                  <Link
                    href={`/${pillar}/${exam.categorySlug}/${exam.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    <span className="flex-1 truncate">{exam.shortName || exam.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{exam.categorySlug}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
