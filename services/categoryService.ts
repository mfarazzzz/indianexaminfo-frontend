/**
 * categoryService.ts — Reads categories from Supabase.
 * Used by pillar listing pages to render category grids dynamically.
 */
import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";
import type { Pillar } from "@/types/exam";

export type Category = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  pillar: Pillar;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  orderIndex: number;
  isActive: boolean;
  examCount: number;
};

function mapRow(row: any): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name ?? null,
    pillar: row.pillar,
    parentId: row.parent_id ?? null,
    icon: row.icon ?? null,
    color: row.color ?? null,
    orderIndex: row.order_index ?? 0,
    isActive: row.is_active ?? true,
    examCount: row.exam_count ?? 0,
  };
}

/** Get active categories for a pillar (top-level only, no children). */
export async function getCategoriesByPillar(pillar: Pillar): Promise<Category[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("pillar", pillar)
        .eq("is_active", true)
        .is("parent_id", null)
        .order("order_index");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    } catch (err) {
      console.error(`[categoryService] getCategoriesByPillar(${pillar}) failed:`, err);
      return [];
    }
  }, [`pillar:${pillar}`, "categories"], { revalidate: 3600 });
}
