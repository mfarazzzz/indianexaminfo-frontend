"use client";

/**
 * useSiteSearch — client hook that queries the REAL records via the existing
 * global search API (/api/search), rather than the old static-label matcher.
 *
 * Why this exists: the mega-menu search used to match only the ~119 hardcoded
 * leaf labels in lib/navigation/static-data.ts, so real records like "Jamia",
 * "MJPRU", or "Delhi University …" returned nothing even though they exist in
 * the database. This hook reuses /api/search (which searches exams,
 * sarkari_naukri, content_posts, blog_posts and education_news in parallel) —
 * one search service for the whole site, not a second implementation.
 *
 * Scope: SITE-WIDE from every panel. A reader does not think in pillars, so a
 * query typed in the "University" panel still finds a government job. The panel
 * says as much in its placeholder/label.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/** One row of the unified search API response. */
export interface SiteSearchResult {
  id: string;
  title: string;
  url: string;
  category: string;
  subcategory: string;
  meta: string;
  badge: string | null;
}

interface SiteSearchState {
  query: string;
  results: SiteSearchResult[];
  loading: boolean;
  /** True once a query >= 2 chars has resolved (so callers can show "no results"). */
  searched: boolean;
}

const MIN_CHARS = 2;
const DEBOUNCE_MS = 200;

export function useSiteSearch() {
  const [state, setState] = useState<SiteSearchState>({
    query: "",
    results: [],
    loading: false,
    searched: false,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`search failed: ${res.status}`);
      const data = (await res.json()) as { results: SiteSearchResult[] };
      setState({ query, results: data.results ?? [], loading: false, searched: true });
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // superseded by a newer query
      setState({ query, results: [], loading: false, searched: true });
    }
  }, []);

  const search = useCallback(
    (query: string) => {
      setState((s) => ({ ...s, query }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.trim().length < MIN_CHARS) {
        abortRef.current?.abort();
        setState({ query, results: [], loading: false, searched: false });
        return;
      }
      debounceRef.current = setTimeout(() => run(query.trim()), DEBOUNCE_MS);
    },
    [run]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState({ query: "", results: [], loading: false, searched: false });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { ...state, search, reset };
}

/** Full-site search page URL for the "search everything" fallback. */
export function fullSiteSearchHref(query: string): string {
  return `/search?q=${encodeURIComponent(query)}`;
}
