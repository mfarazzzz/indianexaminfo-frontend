"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { navigation } from "@/config/navigation";
import { MegaMenu } from "./MegaMenu";
import { cn } from "@/lib/utils";
import { Search, Menu, X, ChevronDown } from "lucide-react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMega, setActiveMega] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mega menu on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMega(null);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 bg-white transition-shadow",
          scrolled ? "shadow-md" : "border-b border-border"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14 gap-4">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center gap-2 mr-4" prefetch>
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">IE</span>
              </div>
              <span className="font-heading font-bold text-primary text-lg hidden sm:block">
                IndianExamInfo
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0 flex-1" aria-label="Main navigation">
              {/* Sarkari Naukri */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMega("sarkari-naukri")}
                onMouseLeave={() => setActiveMega(null)}
              >
                <Link
                  href={navigation.sarkariNaukri.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors",
                    activeMega === "sarkari-naukri"
                      ? "text-primary bg-primary-50"
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  )}
                  prefetch
                >
                  Sarkari Naukri <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {activeMega === "sarkari-naukri" && (
                  <MegaMenu
                    categories={navigation.sarkariNaukri.categories}
                    onClose={() => setActiveMega(null)}
                  />
                )}
              </div>

              {/* Entrance Exam */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMega("entrance-exam")}
                onMouseLeave={() => setActiveMega(null)}
              >
                <Link
                  href={navigation.entranceExam.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors",
                    activeMega === "entrance-exam"
                      ? "text-primary bg-primary-50"
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  )}
                  prefetch
                >
                  Entrance Exam <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {activeMega === "entrance-exam" && (
                  <MegaMenu
                    categories={navigation.entranceExam.categories}
                    onClose={() => setActiveMega(null)}
                  />
                )}
              </div>

              {/* Board Exam */}
              <div
                className="relative"
                onMouseEnter={() => setActiveMega("board-exam")}
                onMouseLeave={() => setActiveMega(null)}
              >
                <Link
                  href={navigation.boardExam.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 text-sm font-medium rounded transition-colors",
                    activeMega === "board-exam"
                      ? "text-primary bg-primary-50"
                      : "text-gray-700 hover:text-primary hover:bg-gray-50"
                  )}
                  prefetch
                >
                  Board Exam <ChevronDown className="w-3.5 h-3.5" />
                </Link>
                {activeMega === "board-exam" && (
                  <MegaMenu
                    categories={navigation.boardExam.categories}
                    onClose={() => setActiveMega(null)}
                  />
                )}
              </div>

              {/* Blog */}
              <Link
                href={navigation.blog.href}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-colors"
                prefetch
              >
                Blog & News
              </Link>

              {/* Quick links */}
              <div className="flex items-center gap-0 ml-2 border-l border-border pl-2">
                <Link
                  href="/admit-card"
                  className="px-3 py-1 text-sm font-semibold text-accent hover:bg-accent/5 rounded transition-colors"
                  prefetch
                >
                  Admit Card
                </Link>
                <Link
                  href="/results"
                  className="px-3 py-1 text-sm font-semibold text-success hover:bg-success/5 rounded transition-colors"
                  prefetch
                >
                  Results
                </Link>
              </div>
            </nav>

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              className="ml-auto p-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className="lg:hidden p-2 text-gray-600 hover:text-primary rounded transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-white animate-fade-in">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              <Link href="/sarkari-naukri" className="py-2 text-sm font-medium text-gray-800 hover:text-primary border-b border-border/50">Sarkari Naukri</Link>
              <Link href="/entrance-exam" className="py-2 text-sm font-medium text-gray-800 hover:text-primary border-b border-border/50">Entrance Exam</Link>
              <Link href="/board-exam" className="py-2 text-sm font-medium text-gray-800 hover:text-primary border-b border-border/50">Board Exam</Link>
              <Link href="/blog" className="py-2 text-sm font-medium text-gray-800 hover:text-primary border-b border-border/50">Blog & News</Link>
              <div className="flex gap-3 pt-2">
                <Link href="/admit-card" className="text-sm font-semibold text-accent">Admit Card</Link>
                <Link href="/results" className="text-sm font-semibold text-success">Results</Link>
                <Link href="/answer-key" className="text-sm font-medium text-gray-600">Answer Key</Link>
                <Link href="/syllabus" className="text-sm font-medium text-gray-600">Syllabus</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center pt-16"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="bg-white w-full max-w-2xl mx-4 rounded shadow-lg animate-fade-in">
            <form
              action="/search"
              method="get"
              className="flex items-center p-4 gap-3"
            >
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                autoFocus
                type="search"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams, results, admit cards..."
                className="flex-1 text-base outline-none text-gray-900"
                aria-label="Search"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </form>
            <div className="px-4 pb-3 border-t border-border">
              <p className="text-xs text-gray-400 mt-2 mb-1.5">Quick searches:</p>
              <div className="flex flex-wrap gap-2">
                {["IBPS PO", "NEET UG", "SSC CGL", "UP Board Result", "CBSE Date Sheet"].map((q) => (
                  <a
                    key={q}
                    href={`/search?q=${encodeURIComponent(q)}`}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-primary hover:text-white transition-colors"
                  >
                    {q}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
