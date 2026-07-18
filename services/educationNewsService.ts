/**
 * educationNewsService.ts — Reads education news from `cms_education_news` table.
 * Used by search and any future news aggregation pages.
 */

import { createServerClient } from "@/lib/supabase/server";

export type EducationNewsItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string | null;
  source: string | null;
  isBreaking: boolean;
  isImportant: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

function mapRow(r: any): EducationNewsItem {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    category: r.category ?? "",
    excerpt: r.excerpt ?? null,
    source: r.source ?? null,
    isBreaking: r.is_breaking ?? false,
    isImportant: r.is_important ?? false,
    publishedAt: r.published_at ?? null,
    updatedAt: r.updated_at,
  };
}

export async function searchEducationNews(query: string): Promise<EducationNewsItem[]> {
  if (!query.trim()) return [];
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("cms_education_news")
      .select("id, slug, title, category, excerpt, source, is_breaking, is_important, published_at, updated_at")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.error("[educationNewsService] searchEducationNews failed:", err);
    return [];
  }
}
