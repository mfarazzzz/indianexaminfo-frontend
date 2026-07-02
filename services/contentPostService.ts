/**
 * contentPostService.ts — Reads content posts from Supabase (live CMS-managed data).
 *
 * Previously read from hardcoded /data/contentPosts.ts.
 * Now queries the `content_posts` table.
 * Field mapping mirrors CMS src/services/contentService.ts mapRow() exactly.
 */

import { createServerClient } from "@/lib/supabase/server";
import type { ContentPost, ContentType, Pillar } from "@/types/exam";

// ── Row mapper ───────────────────────────────────────────────────────────
function mapRow(row: Record<string, unknown>): ContentPost {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? "",
    content: (row.content as string) ?? "",
    // CMS uses exam_id + exam_entity_name; frontend type uses examEntityId / examEntityName
    examEntityId: (row.exam_entity_id as string) ?? (row.exam_id as string) ?? "",
    examEntityName: (row.exam_entity_name as string) ?? "",
    pillar: row.pillar as Pillar,
    contentType: row.content_type as ContentType,
    quickLinks: (row.quick_links as ContentPost["quickLinks"]) ?? [],
    importantDates: (row.important_dates as ContentPost["importantDates"]) ?? [],
    publishedAt: (row.published_at as string) ?? (row.updated_at as string) ?? "",
    updatedAt: (row.updated_at as string) ?? "",
    author: "",          // content_posts don't have an author join in current schema
    status: row.status === "published" ? "published" : "draft",
    featuredImage: (row.featured_image as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    isFeatured: (row.is_featured as boolean) ?? false,
    seoTitle: (row.seo_title as string) ?? "",
    seoDescription: (row.seo_description as string) ?? "",
    faqs: (row.faqs as ContentPost["faqs"]) ?? [],
  };
}

// ── Service functions ────────────────────────────────────────────────────

export async function getContentPostsByExam(
  examId: string,
  contentType?: ContentType
): Promise<ContentPost[]> {
  try {
    const supabase = createServerClient();
    let query = supabase
      .from("content_posts")
      .select("*")
      .eq("exam_id", examId)
      .eq("status", "published");

    if (contentType) {
      query = query.eq("content_type", contentType);
    }

    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[contentPostService] getContentPostsByExam failed:", err);
    return [];
  }
}

export async function getContentPostBySlug(slug: string): Promise<ContentPost | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  } catch (err) {
    console.error("[contentPostService] getContentPostBySlug failed:", err);
    return null;
  }
}

export async function getLatestByContentType(
  contentType: ContentType,
  limit = 10
): Promise<ContentPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("content_type", contentType)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[contentPostService] getLatestByContentType failed:", err);
    return [];
  }
}

export async function getContentPostsByPillar(pillar: Pillar): Promise<ContentPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("pillar", pillar)
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[contentPostService] getContentPostsByPillar failed:", err);
    return [];
  }
}

export async function getFeaturedContentPosts(): Promise<ContentPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("is_featured", true)
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[contentPostService] getFeaturedContentPosts failed:", err);
    return [];
  }
}

export async function searchContentPosts(query: string): Promise<ContentPost[]> {
  if (!query.trim()) return [];
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,exam_entity_name.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[contentPostService] searchContentPosts failed:", err);
    return [];
  }
}

export async function getLatestContentPosts(limit = 10): Promise<ContentPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[contentPostService] getLatestContentPosts failed:", err);
    return [];
  }
}
