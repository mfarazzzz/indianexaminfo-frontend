/**
 * pageService.ts — Reads static pages from Supabase pages table.
 *
 * The CMS manages static pages (About, Contact, Privacy Policy, Disclaimer, custom)
 * via Pages → PageEditPage with a WYSIWYG editor.
 *
 * Frontend page routes (about, contact, etc.) should call getPageBySlug()
 * to render CMS-managed HTML content instead of hardcoded JSX.
 */

import { createServerClient } from "@/lib/supabase/server";

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isSystem: boolean;
  status: "draft" | "published";
  orderIndex: number;
  updatedAt: string;
};

function mapRow(row: any): CmsPage {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content ?? null,
    metaTitle: row.meta_title ?? null,
    metaDescription: row.meta_description ?? null,
    isSystem: row.is_system ?? false,
    status: row.status,
    orderIndex: row.order_index ?? 0,
    updatedAt: row.updated_at,
  };
}

/** Returns a published page by its slug, or null if not found / not published. */
export async function getPageBySlug(slug: string): Promise<CmsPage | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data);
  } catch (err) {
    console.error(`[pageService] getPageBySlug(${slug}) failed:`, err);
    return null;
  }
}

/** Returns all published pages (for sitemap, navigation etc.). */
export async function getAllPublishedPages(): Promise<CmsPage[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("status", "published")
      .order("order_index");
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.error("[pageService] getAllPublishedPages failed:", err);
    return [];
  }
}
