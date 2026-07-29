"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import type { Pillar } from "@/types/exam";
import type { NavigationCategory, NavigationExam } from "@/services/navigationService";

// ── Types ──────────────────────────────────────────────────────────────────

interface NavigationContextValue {
  activePillar: Pillar | null;
  setActivePillar: (pillar: Pillar | null) => void;
  activeCategory: NavigationCategory | null;
  setActiveCategory: (cat: NavigationCategory | null) => void;
  // Exam cache
  getExams: (categoryId: string) => NavigationExam[] | null;
  setExams: (categoryId: string, exams: NavigationExam[]) => void;
  isLoading: (categoryId: string) => boolean;
  setLoading: (categoryId: string, loading: boolean) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activePillar, setActivePillar] = useState<Pillar | null>(null);
  const [activeCategory, setActiveCategory] = useState<NavigationCategory | null>(null);
  const examCacheRef = useRef<Map<string, NavigationExam[]>>(new Map());
  const loadingRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  const getExams = useCallback((categoryId: string) => {
    return examCacheRef.current.get(categoryId) ?? null;
  }, []);

  const setExams = useCallback((categoryId: string, exams: NavigationExam[]) => {
    examCacheRef.current.set(categoryId, exams);
    loadingRef.current.delete(categoryId);
    forceUpdate((n) => n + 1);
  }, []);

  const isLoading = useCallback((categoryId: string) => {
    return loadingRef.current.has(categoryId);
  }, []);

  const setLoading = useCallback((categoryId: string, loading: boolean) => {
    if (loading) loadingRef.current.add(categoryId);
    else loadingRef.current.delete(categoryId);
    forceUpdate((n) => n + 1);
  }, []);

  return (
    <NavigationContext.Provider value={{
      activePillar, setActivePillar,
      activeCategory, setActiveCategory,
      getExams, setExams, isLoading, setLoading,
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}

// ── useHoverIntent Hook ────────────────────────────────────────────────────

export function useHoverIntent(delay = 80) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback((callback: () => void) => {
    timerRef.current = setTimeout(callback, delay);
  }, [delay]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

// ── useNavCache Hook ───────────────────────────────────────────────────────

export function useNavCache() {
  const cacheRef = useRef<Map<string, NavigationExam[]>>(new Map());

  const get = useCallback((key: string) => cacheRef.current.get(key) ?? null, []);
  const set = useCallback((key: string, data: NavigationExam[]) => { cacheRef.current.set(key, data); }, []);
  const has = useCallback((key: string) => cacheRef.current.has(key), []);

  return { get, set, has };
}
