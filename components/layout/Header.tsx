"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import type { Menu as CmsMenu } from "@/services/menuService";

// Lazy-load mega menu components — only loaded when user hovers a nav item
const CmsMegaMenu = dynamic(() => import("./MegaMenu").then(m => ({ default: m.CmsMegaMenu })), { ssr: false });
const SimpleDropdown = dynamic(() => import("./MegaMenu").then(m => ({ default: m.SimpleDropdown })), { ssr: false });

type HeaderProps = {
  primaryNav: CmsMenu | null;
  megaMenus: Record<string, CmsMenu | null>;
};

/**
 * Main site header — 100% CMS-driven navigation.
 * Primary nav items come from `primary-nav` menu.
 * Mega menus come from separate menu slugs referenced in each item's metadata.mega_menu.
 * No hardcoded links — if CMS is unavailable, renders empty (graceful degradation).
 */
export function Header({ primaryNav, megaMenus }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMega, setActiveMega] = useState<string | null>(null);

  // Track scroll for shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close on escape
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

  // Close mobile nav on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const navItems = primaryNav?.items ?? [];

  // Get mega menu for a nav item (if it references one)
  const getMegaMenu = useCallback((item: typeof navItems[0]): CmsMenu | null => {
    const megaSlug = (item.metadata as Record<string, unknown>)?.mega_menu as string | undefined;
    if (!megaSlug) return null;
    return megaMenus[megaSlug] ?? null;
  }, [megaMenus]);

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

            {/* Desktop Nav — CMS-driven */}
            <nav className="hidden lg:flex items-center gap-0 flex-1" aria-label="Main navigation">
              {navItems.map((item) => {
                const megaMenu = getMegaMenu(item);
                const hasMega = megaMenu && megaMenu.items.length > 0;
                const isSimpleMega = megaMenu && megaMenu.items.length > 0 && megaMenu.items.length <= 10 && !megaMenu.items.some(i => i.itemType === "heading");
                const isActive = activeMega === item.id;

                // Skip "Home" in desktop nav (implied by logo)
                if (item.url === "/") return null;

                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => hasMega ? setActiveMega(item.id) : undefined}
                    onMouseLeave={() => setActiveMega(null)}
                  >
                    <Link
                      href={item.url ?? "#"}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded transition-colors",
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-gray-700 hover:text-primary hover:bg-gray-50"
                      )}
                      prefetch
                      aria-haspopup={hasMega ? "true" : undefined}
                      aria-expanded={isActive ? "true" : undefined}
                    >
                      {item.label}
                      {hasMega && <ChevronDown className="w-3.5 h-3.5" />}
                    </Link>

                    {/* Mega menu dropdown */}
                    {isActive && megaMenu && (
                      isSimpleMega
                        ? <SimpleDropdown menu={megaMenu} onClose={() => setActiveMega(null)} />
                        : <CmsMegaMenu menu={megaMenu} onClose={() => setActiveMega(null)} />
                    )}
                  </div>
                );
              })}
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

        {/* ── Mobile Nav (Accordion) ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-white max-h-[80vh] overflow-y-auto animate-fade-in">
            <nav className="container mx-auto px-4 py-3" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const megaMenu = getMegaMenu(item);
                const hasChildren = megaMenu && megaMenu.items.length > 0;

                return (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    megaMenu={megaMenu}
                    onNavigate={() => setMobileOpen(false)}
                  />
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* ── Search Overlay ── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center pt-16"
          onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
        >
          <div className="bg-white w-full max-w-2xl mx-4 rounded-lg shadow-xl animate-fade-in">
            <form action="/search" method="get" className="flex items-center p-4 gap-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                autoFocus
                type="search"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams, jobs, results, admit cards..."
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
              <p className="text-xs text-gray-400 mt-2 mb-1.5">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {["SSC CGL", "IBPS PO", "NEET UG", "JEE Main", "UP Board Result", "CBSE Date Sheet", "Railway Jobs"].map((q) => (
                  <a
                    key={q}
                    href={`/search?q=${encodeURIComponent(q)}`}
                    className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-primary hover:text-white transition-colors"
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

// ── Mobile Nav Item (Accordion) ───────────────────────────────────────────────

function MobileNavItem({
  item,
  megaMenu,
  onNavigate,
}: {
  item: { id: string; label: string; url: string | null; icon: string | null };
  megaMenu: CmsMenu | null;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = megaMenu && megaMenu.items.length > 0;

  if (!hasChildren) {
    return (
      <Link
        href={item.url ?? "#"}
        onClick={onNavigate}
        className="flex items-center gap-2 py-3 text-sm font-medium text-gray-800 hover:text-primary border-b border-border/50"
      >
        {item.icon && <span className="text-base">{item.icon}</span>}
        {item.label}
      </Link>
    );
  }

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full py-3 text-sm font-medium text-gray-800"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          {item.icon && <span className="text-base">{item.icon}</span>}
          {item.label}
        </span>
        <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", expanded && "rotate-90")} />
      </button>

      {expanded && (
        <div className="pb-3 pl-4 space-y-1 animate-fade-in">
          {/* Direct link to parent */}
          {item.url && (
            <Link
              href={item.url}
              onClick={onNavigate}
              className="block py-1.5 text-sm text-primary font-medium"
            >
              View All →
            </Link>
          )}
          {/* Mega menu items flattened for mobile */}
          {megaMenu!.items.map((section) => (
            <div key={section.id} className="pt-2 first:pt-0">
              {section.itemType === "heading" ? (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {section.label}
                  </p>
                  {section.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={child.url ?? "#"}
                      onClick={onNavigate}
                      className="block py-1.5 text-sm text-gray-600 hover:text-primary"
                    >
                      {child.icon && <span className="mr-1.5">{child.icon}</span>}
                      {child.label}
                    </Link>
                  ))}
                </>
              ) : (
                <Link
                  href={section.url ?? "#"}
                  onClick={onNavigate}
                  className="block py-1.5 text-sm text-gray-600 hover:text-primary"
                >
                  {section.icon && <span className="mr-1.5">{section.icon}</span>}
                  {section.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
