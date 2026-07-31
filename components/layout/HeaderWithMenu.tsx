/**
 * HeaderWithMenu.tsx — Server component that resolves navigation data
 * and passes it to the client-side HeaderMegaNav.
 * 
 * Uses STATIC hardcoded navigation to avoid dependency on Supabase taxonomy_nodes.
 */
import Link from "next/link";
import { HeaderMegaNav } from "@/components/navigation/HeaderMegaNav";
import { QuickAccessBar } from "@/components/layout/QuickAccessBar";
import { STATIC_NAVIGATION_TREES, STATIC_QUICK_ACCESS } from "@/lib/navigation/static-data";

export async function HeaderWithMenu() {
  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-6">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center gap-2.5" prefetch>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-heading font-bold text-sm">IE</span>
              </div>
              <span className="font-heading font-bold text-primary text-lg hidden sm:block tracking-tight">
                IndianExamInfo
              </span>
            </Link>

            {/* Navigation (client component) */}
            <HeaderMegaNav pillars={STATIC_NAVIGATION_TREES} quickAccessItems={STATIC_QUICK_ACCESS} />
          </div>
        </div>
      </header>

      {/* Quick Access Bar */}
      <QuickAccessBar items={STATIC_QUICK_ACCESS} />
    </>
  );
}
