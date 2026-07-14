/**
 * HeaderWithMenu.tsx — Server component wrapper that fetches CMS menu data
 * and passes it to the client-side Header.
 * Falls back to hardcoded config/navigation.ts if DB is unavailable.
 */
import { getMenuBySlug } from "@/services/menuService";
import { Header } from "./Header";

export async function HeaderWithMenu() {
  // Attempt to load the main navigation menu from CMS
  const mainMenu = await getMenuBySlug("main-nav");

  // Pass to Header — it will use CMS data if available, else hardcoded fallback
  return <Header cmsMenu={mainMenu} />;
}
