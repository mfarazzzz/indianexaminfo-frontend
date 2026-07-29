"use client";

/**
 * useNavAnalytics — GA4 event tracking for mega navigation interactions.
 */
import { useCallback } from "react";
import type { Pillar } from "@/types/exam";

type NavEventName = "nav_open" | "nav_category_hover" | "nav_exam_click" | "nav_search" | "nav_view_all" | "nav_close";

interface NavEvent {
  event: NavEventName;
  pillar: Pillar;
  category?: string;
  exam_slug?: string;
  search_query?: string;
  source: "desktop" | "mobile";
}

function sendEvent(event: NavEvent) {
  if (typeof window === "undefined") return;
  try {
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag("event", event.event, {
        nav_pillar: event.pillar,
        nav_category: event.category ?? "",
        nav_exam: event.exam_slug ?? "",
        nav_search_query: event.search_query ?? "",
        nav_source: event.source,
      });
    }
  } catch {
    // Analytics should never break navigation
  }
}

export function useNavAnalytics() {
  const source = typeof window !== "undefined" && window.innerWidth >= 1024 ? "desktop" : "mobile";

  const trackOpen = useCallback((pillar: Pillar) => {
    sendEvent({ event: "nav_open", pillar, source: source as "desktop" | "mobile" });
  }, [source]);

  const trackCategoryHover = useCallback((pillar: Pillar, category: string) => {
    sendEvent({ event: "nav_category_hover", pillar, category, source: source as "desktop" | "mobile" });
  }, [source]);

  const trackExamClick = useCallback((pillar: Pillar, category: string, examSlug: string) => {
    sendEvent({ event: "nav_exam_click", pillar, category, exam_slug: examSlug, source: source as "desktop" | "mobile" });
  }, [source]);

  const trackSearch = useCallback((pillar: Pillar, query: string) => {
    sendEvent({ event: "nav_search", pillar, search_query: query, source: source as "desktop" | "mobile" });
  }, [source]);

  const trackViewAll = useCallback((pillar: Pillar, category: string) => {
    sendEvent({ event: "nav_view_all", pillar, category, source: source as "desktop" | "mobile" });
  }, [source]);

  const trackClose = useCallback((pillar: Pillar) => {
    sendEvent({ event: "nav_close", pillar, source: source as "desktop" | "mobile" });
  }, [source]);

  return { trackOpen, trackCategoryHover, trackExamClick, trackSearch, trackViewAll, trackClose };
}
