/**
 * navigationService.ts — Data service for the mega navigation.
 *
 * Server-side: getNavigationCategories (ISR cached 60min)
 * Client-side: getExamsForCategory, searchExamsInPillar (on-demand)
 */
import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";
import type { Pillar } from "@/types/exam";

// ── Types ──────────────────────────────────────────────────────────────────

export interface NavigationCategory {
  id: string;
  slug: string;
  name: string;
  pillar: Pillar;
  icon: string | null;
  displayOrder: number;
  isVisible: boolean;
  badge: "popular" | "new" | "updated" | null;
  customLabel: string | null;
  customIcon: string | null;
  featuredExamIds: string[];
  maxItems: number;
  showExamCount: boolean;
  examCount: number;
}

export interface NavigationExam {
  id: string;
  slug: string;
  shortName: string;
  name: string;
  isFeatured: boolean;
  status: string;
  categorySlug: string;
  pillar: Pillar;
}

// ── Server-side: Categories (ISR cached) ────────────────────────────────────

export async function getNavigationCategories(pillar: Pillar): Promise<NavigationCategory[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();

      const { data, error } = await supabase
        .from("categories")
        .select(`
          id, slug, name, pillar, icon, order_index,
          navigation_config!inner(
            display_order, is_visible, badge, custom_label, custom_icon,
            featured_exam_ids, max_items, show_exam_count
          )
        `)
        .eq("pillar", pillar)
        .eq("is_active", true)
        .is("parent_id", null)
        .order("order_index");

      if (error) {
        // Fallback: query without navigation_config join
        const { data: fallback } = await supabase
          .from("categories")
          .select("id, slug, name, pillar, icon, order_index")
          .eq("pillar", pillar)
          .eq("is_active", true)
          .is("parent_id", null)
          .order("order_index");

        return (fallback ?? []).map((c: any, i: number) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          pillar: c.pillar,
          icon: c.icon,
          displayOrder: c.order_index ?? i,
          isVisible: true,
          badge: null,
          customLabel: null,
          customIcon: null,
          featuredExamIds: [],
          maxItems: 15,
          showExamCount: true,
          examCount: 0,
        }));
      }

      // Get exam counts per category
      const categoryIds = (data ?? []).map((c: any) => c.id);
      const { data: counts } = await supabase
        .from("exams")
        .select("category_id")
        .in("category_id", categoryIds)
        .eq("is_published", true);

      const countMap: Record<string, number> = {};
      for (const row of (counts ?? []) as any[]) {
        countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
      }

      return (data ?? [])
        .map((c: any) => {
          const nc = c.navigation_config;
          return {
            id: c.id,
            slug: c.slug,
            name: nc?.custom_label || c.name,
            pillar: c.pillar,
            icon: nc?.custom_icon || c.icon,
            displayOrder: nc?.display_order ?? c.order_index ?? 0,
            isVisible: nc?.is_visible ?? true,
            badge: nc?.badge ?? null,
            customLabel: nc?.custom_label ?? null,
            customIcon: nc?.custom_icon ?? null,
            featuredExamIds: nc?.featured_exam_ids ?? [],
            maxItems: nc?.max_items ?? 15,
            showExamCount: nc?.show_exam_count ?? true,
            examCount: countMap[c.id] ?? 0,
          };
        })
        .filter((c) => c.isVisible)
        .sort((a, b) => a.displayOrder - b.displayOrder);
    } catch (err) {
      console.error(`[navigationService] getNavigationCategories(${pillar}) failed:`, err);
      return [];
    }
  }, ["navigation", `nav:${pillar}`], { revalidate: 3600 });
}

// ── Client-side: Exams for a category (called on hover/tap) ─────────────────

export async function getExamsForCategory(
  categoryId: string,
  limit = 15,
  featuredIds: string[] = []
): Promise<NavigationExam[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select("id, slug, short_name, name, is_featured, status, category_id, pillar, categories!category_id(slug)")
      .eq("category_id", categoryId)
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("name")
      .limit(limit);

    if (error) throw error;

    const exams = (data ?? []).map((e: any) => ({
      id: e.id,
      slug: e.slug,
      shortName: e.short_name ?? "",
      name: e.name,
      isFeatured: e.is_featured ?? false,
      status: e.status ?? "upcoming",
      categorySlug: e.categories?.slug ?? "",
      pillar: e.pillar,
    }));

    // Pin featured exams (from navigation_config) to the top
    if (featuredIds.length > 0) {
      const featured = exams.filter((e) => featuredIds.includes(e.id));
      const rest = exams.filter((e) => !featuredIds.includes(e.id));
      return [...featured, ...rest];
    }

    return exams;
  } catch (err) {
    console.error("[navigationService] getExamsForCategory failed:", err);
    return [];
  }
}

// ── Client-side: Search exams within a pillar ───────────────────────────────

export async function searchExamsInPillar(
  pillar: Pillar,
  query: string,
  limit = 20
): Promise<NavigationExam[]> {
  if (!query || query.length < 2) return [];

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select("id, slug, short_name, name, is_featured, status, pillar, categories!category_id(slug)")
      .eq("pillar", pillar)
      .eq("is_published", true)
      .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
      .order("is_featured", { ascending: false })
      .order("name")
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((e: any) => ({
      id: e.id,
      slug: e.slug,
      shortName: e.short_name ?? "",
      name: e.name,
      isFeatured: e.is_featured ?? false,
      status: e.status ?? "upcoming",
      categorySlug: e.categories?.slug ?? "",
      pillar: e.pillar,
    }));
  } catch (err) {
    console.error("[navigationService] searchExamsInPillar failed:", err);
    return [];
  }
}

// ── Get all pillar categories (for header server rendering) ─────────────────

export async function getAllNavigationData(): Promise<Record<Pillar, NavigationCategory[]>> {
  const [entranceExam, sarkariNaukri, boardUniversity] = await Promise.all([
    getNavigationCategories("entrance-exam"),
    getNavigationCategories("sarkari-naukri"),
    getNavigationCategories("board-university"),
  ]);

  return {
    "entrance-exam": entranceExam,
    "sarkari-naukri": sarkariNaukri,
    "board-university": boardUniversity,
  };
}
