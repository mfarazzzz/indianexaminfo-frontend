/**
 * HeaderWithMenu.tsx — Server component that fetches navigation data
 * and renders the new mega navigation system.
 */
import { getNavigationMenus } from "@/services/menuService";
import { getAllNavigationData } from "@/services/navigationService";
import { HeaderMegaNav } from "@/components/navigation/HeaderMegaNav";
import { QuickAccessBar } from "./QuickAccessBar";
import Link from "next/link";
import type { Pillar } from "@/types/exam";

const PILLAR_CONFIG: { pillar: Pillar; label: string; href: string }[] = [
  { pillar: "sarkari-naukri", label: "Government Jobs", href: "/sarkari-naukri" },
  { pillar: "entrance-exam", label: "Entrance Exams", href: "/entrance-exam" },
  { pillar: "board-university", label: "Board Exams", href: "/board-exam" },
];

export async function HeaderWithMenu() {
  const [menus, navData] = await Promise.all([
    getNavigationMenus(),
    getAllNavigationData(),
  ]);

  const pillars = PILLAR_CONFIG.map((config) => ({
    ...config,
    categories: navData[config.pillar] ?? [],
  }));

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
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

            {/* New Mega Navigation */}
            <HeaderMegaNav pillars={pillars} />
          </div>
        </div>
      </header>
      <QuickAccessBar menu={menus.quickAccessBar} />
    </>
  );
}
