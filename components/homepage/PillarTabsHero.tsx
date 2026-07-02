"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const pillars = [
  {
    id: "sarkari-naukri",
    label: "🏛 Sarkari Naukri",
    searchPlaceholder: "Search govt jobs — UPSC, SSC, Banking...",
    quickLinks: [
      { label: "Admit Card", href: "/admit-card" },
      { label: "Result", href: "/results" },
      { label: "Syllabus", href: "/syllabus" },
      { label: "Apply Now", href: "/sarkari-naukri" },
    ],
    featuredLinks: [
      { label: "IBPS PO 2025", href: "/sarkari-naukri/banking/ibps-po" },
      { label: "SSC CGL 2025", href: "/sarkari-naukri/ssc/ssc-cgl" },
      { label: "Agniveer Army", href: "/sarkari-naukri/defence/agniveer-army" },
    ],
  },
  {
    id: "entrance-exam",
    label: "🎓 Entrance Exam",
    searchPlaceholder: "Search entrance exams — JEE, NEET, CAT...",
    quickLinks: [
      { label: "Admit Card", href: "/admit-card" },
      { label: "Result", href: "/results" },
      { label: "Cutoff", href: "/entrance-exam" },
      { label: "Counselling", href: "/entrance-exam" },
    ],
    featuredLinks: [
      { label: "NEET UG 2025", href: "/entrance-exam/medical/neet-ug" },
      { label: "JEE Main 2026", href: "/entrance-exam/engineering/jee-main" },
      { label: "CAT 2025", href: "/entrance-exam/mba/cat" },
    ],
  },
  {
    id: "board-university",
    label: "📚 Board & University",
    searchPlaceholder: "Search board/university — CBSE, UP Board...",
    quickLinks: [
      { label: "Result", href: "/results" },
      { label: "Date Sheet", href: "/date-sheet" },
      { label: "Admit Card", href: "/admit-card" },
      { label: "Marksheet", href: "/results" },
    ],
    featuredLinks: [
      { label: "CBSE Class 12 Result", href: "/board-exam/cbse/class-12" },
      { label: "UP Board Result 2025", href: "/board-exam/state/up-board/intermediate" },
      { label: "MJPRU Result", href: "/board-exam/university/mjpru" },
    ],
  },
];

export function PillarTabsHero() {
  const [active, setActive] = useState(0);
  const pillar = pillars[active];

  return (
    <div className="bg-primary rounded shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex" role="tablist" aria-label="Exam category tabs">
        {pillars.map((p, i) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={active === i}
            aria-controls={`pillar-panel-${p.id}`}
            id={`pillar-tab-${p.id}`}
            onClick={() => setActive(i)}
            className={cn(
              "flex-1 px-3 py-3 text-sm font-semibold transition-colors",
              active === i
                ? "bg-white text-primary border-b-2 border-primary"
                : "text-white/80 hover:text-white hover:bg-primary-600"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div
        id={`pillar-panel-${pillar.id}`}
        role="tabpanel"
        aria-labelledby={`pillar-tab-${pillar.id}`}
        className="bg-white p-5"
      >
        {/* Search */}
        <form action="/search" method="get" className="flex items-center gap-2 mb-4">
          <input type="hidden" name="pillar" value={pillar.id} />
          <div className="flex-1 flex items-center gap-2 border border-border rounded px-3 py-2 bg-white focus-within:border-primary transition-colors">
            <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
            <input
              type="search"
              name="q"
              placeholder={pillar.searchPlaceholder}
              className="flex-1 text-sm outline-none text-gray-800"
              aria-label={pillar.searchPlaceholder}
            />
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Quick links */}
        <div className="flex gap-2 flex-wrap mb-4">
          {pillar.quickLinks.map((ql) => (
            <Link
              key={ql.href}
              href={ql.href}
              className="text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded hover:bg-primary hover:text-white transition-colors"
            >
              {ql.label}
            </Link>
          ))}
        </div>

        {/* Featured */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Trending:</span>
          {pillar.featuredLinks.map((fl) => (
            <Link
              key={fl.href}
              href={fl.href}
              className="text-xs text-primary font-medium hover:underline"
            >
              {fl.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
