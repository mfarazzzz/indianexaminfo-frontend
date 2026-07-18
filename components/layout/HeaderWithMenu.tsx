/**
 * HeaderWithMenu.tsx — Server component that fetches ALL navigation menus
 * and passes them to client-side components (Header, QuickAccessBar).
 * This is the single data-loading point for navigation — no fetch in client components.
 */
import { getNavigationMenus } from "@/services/menuService";
import { Header } from "./Header";
import { QuickAccessBar } from "./QuickAccessBar";

export async function HeaderWithMenu() {
  const menus = await getNavigationMenus();

  return (
    <>
      <Header
        primaryNav={menus.primaryNav}
        megaMenus={{
          "government-jobs-mega": menus.governmentJobsMega,
          "entrance-exams-mega": menus.entranceExamsMega,
          "board-university-mega": menus.boardUniversityMega,
          "news-mega": menus.newsMega,
        }}
      />
      <QuickAccessBar menu={menus.quickAccessBar} />
    </>
  );
}
