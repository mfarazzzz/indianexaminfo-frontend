/**
 * NavigationLoader — Server component that fetches all navigation data
 * and passes it to the client-side HeaderMegaNav component.
 *
 * This is the data-loading entry point for the mega navigation.
 * Replace HeaderWithMenu's mega menu portion with this component.
 */
import { getAllNavigationData } from "@/services/navigationService";
import { HeaderMegaNav } from "./HeaderMegaNav";
import type { Pillar } from "@/types/exam";

const PILLAR_CONFIG: { pillar: Pillar; label: string; href: string }[] = [
  { pillar: "entrance-exam", label: "Entrance Exams", href: "/entrance-exam" },
  { pillar: "sarkari-naukri", label: "Government Jobs", href: "/sarkari-naukri" },
  { pillar: "board-university", label: "Board Exams", href: "/board-exam" },
];

export async function NavigationLoader() {
  const navData = await getAllNavigationData();

  const pillars = PILLAR_CONFIG.map((config) => ({
    ...config,
    categories: navData[config.pillar] ?? [],
  }));

  return <HeaderMegaNav pillars={pillars} />;
}
