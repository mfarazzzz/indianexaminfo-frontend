/**
 * regionService.ts — reads the `regions` controlled vocabulary + record counts.
 *
 * `regions` is the single source of truth for a region's slug, display label,
 * and kind (state | ut | national). State pages read the LABEL from here rather
 * than prettifying the slug, and the all-states list + content-gating read the
 * per-region record counts (exams by region + vacancies by state).
 */
import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";

export type RegionKind = "state" | "ut" | "national";

export interface Region {
  slug: string;
  label: string;
  kind: RegionKind;
}

export interface RegionWithCounts extends Region {
  /** Published exams whose exams.region = slug. */
  examCount: number;
  /** Published vacancies whose sarkari_naukri.state = slug. */
  vacancyCount: number;
}

function mapRegion(row: Record<string, unknown>): Region {
  return {
    slug: row.slug as string,
    label: row.label as string,
    kind: row.kind as RegionKind,
  };
}

/** A single region by slug (for the state-page label/heading). null if unknown. */
export async function getRegion(slug: string): Promise<Region | null> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("regions")
        .select("slug,label,kind")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? mapRegion(data as Record<string, unknown>) : null;
    } catch (err) {
      console.error("[regionService] getRegion failed:", err);
      return null;
    }
  }, ["regions", `region:${slug}`], { revalidate: 3600 });
}

/**
 * Every region that has AT LEAST ONE record — either a published exam
 * (exams.region) or a published vacancy (sarkari_naukri.state). This is the
 * content-gating source: the all-states list, the sidebar, and any state index
 * show ONLY these; a region with zero records is never linked and its page 404s.
 * `all-india` is excluded — it is national, not a state page.
 * Returned sorted by total desc within kind (states first, then UTs).
 */
export async function getRegionsWithRecords(): Promise<RegionWithCounts[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const [regionsRes, examsRes, vacRes] = await Promise.all([
        supabase.from("regions").select("slug,label,kind"),
        supabase.from("exams").select("region").eq("workflow_status", "published"),
        supabase.from("sarkari_naukri").select("state").eq("workflow_status", "published").not("state", "is", null),
      ]);
      if (regionsRes.error) throw regionsRes.error;
      const examCounts = new Map<string, number>();
      for (const r of (examsRes.data ?? []) as { region: string }[]) {
        if (r.region) examCounts.set(r.region, (examCounts.get(r.region) ?? 0) + 1);
      }
      const vacCounts = new Map<string, number>();
      for (const r of (vacRes.data ?? []) as { state: string }[]) {
        vacCounts.set(r.state, (vacCounts.get(r.state) ?? 0) + 1);
      }
      const out: RegionWithCounts[] = ((regionsRes.data ?? []) as Record<string, unknown>[])
        .map((row) => {
          const base = mapRegion(row);
          return {
            ...base,
            examCount: examCounts.get(base.slug) ?? 0,
            vacancyCount: vacCounts.get(base.slug) ?? 0,
          };
        })
        .filter((r) => r.kind !== "national" && r.examCount + r.vacancyCount > 0);
      const rank = (k: RegionKind) => (k === "state" ? 0 : 1); // states before UTs
      return out.sort(
        (a, b) =>
          rank(a.kind) - rank(b.kind) ||
          (b.examCount + b.vacancyCount) - (a.examCount + a.vacancyCount) ||
          a.label.localeCompare(b.label)
      );
    } catch (err) {
      console.error("[regionService] getRegionsWithRecords failed:", err);
      return [];
    }
  }, ["regions", "exams", "sarkari-naukri", "regions:with-records"], { revalidate: 1800 });
}
