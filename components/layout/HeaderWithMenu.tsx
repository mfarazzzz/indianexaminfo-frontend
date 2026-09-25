/**
 * HeaderWithMenu.tsx — Server component that resolves navigation data
 * and passes it to the client-side HeaderMegaNav.
 * 
 * Uses STATIC hardcoded navigation to avoid dependency on Supabase taxonomy_nodes.
 */
import Link from "next/link";
import { HeaderMegaNav } from "@/components/navigation/HeaderMegaNav";
import { buildNavigationTrees, STATIC_QUICK_ACCESS } from "@/lib/navigation/static-data";
import { getCategoryList } from "@/services/sarkariNaukriService";
import { getUniversityNavRecords } from "@/services/examService";

export async function HeaderWithMenu() {
  // Real DB-backed nav data, injected server-side:
  //  - sarkari_naukri categories (count desc) → "Sarkari Naukri" pillar
  //  - published university records → "University" pillar (Central group + per-region)
  // Both fall back to the static tree for their pillar if the fetch is empty.
  const [realCategories, universityRecords] = await Promise.all([
    getCategoryList(),
    getUniversityNavRecords(),
  ]);
  const navigationTrees = buildNavigationTrees(realCategories, universityRecords);

  return (
    <>
      {/* Main Header — z-[60] keeps the logo and nav triggers above the z-50 panel */}
      <header className="sticky top-0 z-[60] bg-white border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-6">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center gap-2.5" prefetch={false}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="IndianExamInfo" width={36} height={36} className="w-9 h-9" />
              <span className="font-heading font-bold text-primary text-lg hidden sm:block tracking-tight">
                IndianExamInfo
              </span>
            </Link>

            {/* Navigation (client component). STATIC_QUICK_ACCESS is still passed for the
                mobile mega-menu's "Quick Links" row inside HeaderMegaNav. */}
            <HeaderMegaNav pillars={navigationTrees} quickAccessItems={STATIC_QUICK_ACCESS} />
          </div>
        </div>
      </header>
    </>
  );
}
