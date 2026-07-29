"use client";

/**
 * HeaderMegaNav — Client component that renders the mega navigation triggers
 * and manages open/close state for desktop hover and mobile accordion.
 */
import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X, Search } from "lucide-react";
import { MegaMenuDesktop } from "./MegaMenuDesktop";
import { MegaMenuMobile } from "./MegaMenuMobile";
import { getExamsForCategory, searchExamsInPillar } from "@/services/navigationService";
import type { NavigationCategory, NavigationExam } from "@/services/navigationService";
import type { Pillar } from "@/types/exam";

interface PillarNav {
  pillar: Pillar;
  label: string;
  href: string;
  categories: NavigationCategory[];
}

interface Props {
  pillars: PillarNav[];
}

export function HeaderMegaNav({ pillars }: Props) {
  const [activePillar, setActivePillar] = useState<Pillar | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((pillar: Pillar) => {
    // Cancel any pending close
    if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    // Hover intent: 80ms delay
    hoverTimerRef.current = setTimeout(() => setActivePillar(pillar), 80);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    closeTimerRef.current = setTimeout(() => setActivePillar(null), 150);
  }, []);

  const handleClose = useCallback(() => {
    setActivePillar(null);
  }, []);

  const fetchExams = useCallback(async (categoryId: string, limit: number, featuredIds: string[]): Promise<NavigationExam[]> => {
    return getExamsForCategory(categoryId, limit, featuredIds);
  }, []);

  const activePillarData = pillars.find((p) => p.pillar === activePillar);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-0.5 flex-1" aria-label="Main navigation">
        {pillars.map(({ pillar, label, href, categories }) => (
          <div
            key={pillar}
            className="relative"
            onMouseEnter={() => handleMouseEnter(pillar)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={href}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activePillar === pillar
                  ? "text-primary bg-primary/5"
                  : "text-gray-700 hover:text-primary hover:bg-gray-50"
              }`}
              aria-haspopup="true"
              aria-expanded={activePillar === pillar}
            >
              {label}
              {categories.length > 0 && <ChevronDown className="w-3.5 h-3.5" />}
            </Link>

            {/* Desktop Mega Menu */}
            {activePillar === pillar && categories.length > 0 && (
              <MegaMenuDesktop
                categories={categories}
                pillar={pillar}
                onClose={handleClose}
                fetchExams={fetchExams}
              />
            )}
          </div>
        ))}

        {/* Static links (News, Resources) */}
        <Link href="/blog" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors">
          News
        </Link>
      </nav>

      {/* Search + Mobile toggle */}
      <div className="flex items-center gap-2 ml-auto">
        <Link href="/search" className="p-2 text-gray-600 hover:text-primary rounded transition-colors" aria-label="Search">
          <Search className="w-5 h-5" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-gray-600 hover:text-primary rounded transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <MegaMenuMobile
          pillars={pillars.map((p) => ({ pillar: p.pillar, label: p.label, categories: p.categories }))}
          onClose={() => setMobileOpen(false)}
          fetchExams={fetchExams}
        />
      )}
    </>
  );
}
