"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CategoryPanel } from "./CategoryPanel";
import { ExamPanel } from "./ExamPanel";
import type { NavigationCategory, NavigationExam } from "@/services/navigationService";
import type { Pillar } from "@/types/exam";

interface Props {
  categories: NavigationCategory[];
  pillar: Pillar;
  onClose: () => void;
  /** Fetch exams for a category (called on hover) */
  fetchExams: (categoryId: string, limit: number, featuredIds: string[]) => Promise<NavigationExam[]>;
}

export function MegaMenuDesktop({ categories, pillar, onClose, fetchExams }: Props) {
  const [activeCategory, setActiveCategory] = useState<NavigationCategory | null>(categories[0] ?? null);
  const [exams, setExams] = useState<NavigationExam[] | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, NavigationExam[]>>(new Map());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch exams when active category changes
  useEffect(() => {
    if (!activeCategory) return;

    const cached = cacheRef.current.get(activeCategory.id);
    if (cached) {
      setExams(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchExams(activeCategory.id, activeCategory.maxItems, activeCategory.featuredExamIds)
      .then((data) => {
        cacheRef.current.set(activeCategory.id, data);
        setExams(data);
      })
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [activeCategory, fetchExams]);

  // Load first category on mount
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleCategoryHover = useCallback((cat: NavigationCategory) => {
    setActiveCategory(cat);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(onClose, 150);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  if (categories.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-full left-0 z-50 mt-0 bg-white border border-gray-200 shadow-xl rounded-b-lg overflow-hidden animate-fade-in"
      style={{ maxWidth: "900px", minWidth: "600px" }}
      role="menu"
      aria-label={`${pillar.replace(/-/g, " ")} navigation`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex">
        <CategoryPanel
          categories={categories}
          pillar={pillar}
          activeCategoryId={activeCategory?.id ?? null}
          onCategoryHover={handleCategoryHover}
        />
        <ExamPanel
          exams={exams}
          category={activeCategory}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
