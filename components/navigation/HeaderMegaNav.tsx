"use client";

/**
 * HeaderMegaNav — Client component for desktop navigation triggers
 * and mobile toggle. Uses hover intent with 60ms open / 200ms close delay.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Search } from "lucide-react";
import { NavigationPanel } from "./NavigationPanel";
import { MegaMenuMobileLazy } from "./MegaMenuMobileLazy";
import { ScreenReaderAnnounce } from "./ScreenReaderAnnounce";
import type { NavigationTree, NavigationPillar, QuickAccessItem } from "@/types/navigation";

interface Props {
  pillars: NavigationTree[];
  quickAccessItems: QuickAccessItem[];
}

export function HeaderMegaNav({ pillars, quickAccessItems }: Props) {
  const [activePillar, setActivePillar] = useState<NavigationPillar | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback((pillar: NavigationPillar) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    hoverTimerRef.current = setTimeout(() => setActivePillar(pillar), 60);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => setActivePillar(null), 200);
  }, []);

  const handlePanelMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handlePanelMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setActivePillar(null), 200);
  }, []);

  const handleClose = useCallback(() => {
    setActivePillar(null);
  }, []);

  // Close the mega menu on any route change — catches Link clicks that don't
  // trigger a full page reload (Next.js client-side navigation).
  const pathname = usePathname();
  useEffect(() => {
    setActivePillar(null);
    setMobileOpen(false);
  }, [pathname]);

  // Find the active tree
  const activeTree = pillars.find((p) => p.pillar === activePillar) ?? null;

  return (
    <>
      {/* Screen reader announcements */}
      <ScreenReaderAnnounce
        message={activePillar ? `${activeTree?.label ?? ""} navigation menu expanded` : ""}
      />

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-1 flex-1" aria-label="Main navigation">
        {pillars.map((tree) => (
          <div
            key={tree.pillar}
            className="relative"
            onMouseEnter={() => handleMouseEnter(tree.pillar)}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href={tree.href}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-md transition-all duration-150 ${
                activePillar === tree.pillar
                  ? "text-primary bg-primary/8 shadow-sm"
                  : "text-gray-700 hover:text-primary hover:bg-gray-50"
              }`}
              aria-haspopup="true"
              aria-expanded={activePillar === tree.pillar}
            >
              {tree.icon && <span className="text-sm">{tree.icon}</span>}
              {tree.label}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  activePillar === tree.pillar ? "rotate-180" : ""
                }`}
              />
            </Link>
          </div>
        ))}
      </nav>

      {/* Navigation Panel — rendered outside triggers for fixed positioning */}
      {activeTree && (
        <NavigationPanel
          tree={activeTree}
          onClose={handleClose}
          onPanelMouseEnter={handlePanelMouseEnter}
          onPanelMouseLeave={handlePanelMouseLeave}
        />
      )}

      {/* Search + Mobile toggle */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Link
          href="/search"
          className="p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-50 transition-colors"
          aria-label="Search"
        >
          <Search className="w-[18px] h-[18px]" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <MegaMenuMobileLazy
          pillars={pillars}
          quickAccessItems={quickAccessItems}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
