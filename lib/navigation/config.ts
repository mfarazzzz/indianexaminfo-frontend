/**
 * Navigation system configuration.
 * Controls static vs dynamic mode and pillar definitions.
 */
import type { NavigationMode, PillarConfig } from "@/types/navigation";
import { PILLAR_CONFIGS } from "@/types/navigation";

/** Current navigation mode — "static" uses bundled JSON, "dynamic" uses Supabase ISR */
export const NAVIGATION_MODE: NavigationMode =
  (process.env.NEXT_PUBLIC_NAVIGATION_MODE as NavigationMode) ?? "static";

/** ISR revalidation interval in seconds (1 hour) */
export const NAV_REVALIDATE_INTERVAL = 3600;

/** Path to static navigation data file */
export const STATIC_DATA_PATH = "data/navigation.json";

/** Get enabled pillars */
export function getEnabledPillars(): PillarConfig[] {
  return PILLAR_CONFIGS.filter((p) => p.isEnabled);
}
