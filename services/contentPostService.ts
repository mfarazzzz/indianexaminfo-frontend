/**
 * contentPostService.ts — Reads content posts from Supabase (live CMS-managed data).
 *
 * Previously read from hardcoded /data/contentPosts.ts.
 * Now queries the `content_posts` table.
 * Field mapping mirrors CMS src/services/contentService.ts mapRow() exactly.
 */

import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";
import type { ContentPost, ContentType, Pillar } from "@/types/exam";
import { orderUpdatesForReader, tickerPool, homeBulletinPool, TICKER_CAP } from "@/lib/exam/updateFeed";
import { excludeTest } from "@/lib/testContent";

/** B2 reader rule: an update whose expiry has passed is hidden EVERYWHERE.
 *  Computed per call - never a module-level constant. */
const expiryOr = () => "expires_at.is.null,expires_at.gt." + new Date().toISOString();

/** The exam join for ticker/home cells: the reader link is the EXAM page,
 *  built from the stored exam row's own slug/pillar/category - never invented. */
const EXAM_EMBED =
  "exam:exams!content_posts_exam_id_fkey(slug, pillar, cat:categories!exams_category_id_fkey(slug))";

// ── Row mapper ───────────────────────────────────────────────────────────
function mapRow(row: Record<string, unknown>): ContentPost {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    excerpt: (row.excerpt as string) ?? "",
    content: (row.content as string) ?? "",
    examEntityId: (row.exam_id as string) ?? "",
    examEntityName: (row.exam_entity_name as string) ?? "",
    pillar: row.pillar as Pillar,
    contentType: row.content_type as ContentType,
    quickLinks: (row.quick_links as ContentPost["quickLinks"]) ?? [],
    importantDates: (row.important_dates as ContentPost["importantDates"]) ?? [],
    contentTypeData: (row.content_type_data as Record<string, unknown>) ?? {},
    attachmentUrls: (row.attachment_urls as ContentPost["attachmentUrls"]) ?? [],
    publishedAt: (row.published_at as string) ?? (row.updated_at as string) ?? "",
    updatedAt: (row.updated_at as string) ?? "",
    status: row.status === "published" ? "published" : "draft",
    featuredImage: (row.featured_image as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    isFeatured: (row.is_featured as boolean) ?? false,
    seoTitle: (row.seo_title as string) ?? "",
    seoDescription: (row.seo_description as string) ?? "",
    faqs: (row.faqs as ContentPost["faqs"]) ?? [],
    // D-P2 / 4b Updates lifecycle — only meaningful on an exam update; a plain
    // post leaves these null/undefined and the reader shows no chip for them.
    kind: (row.kind as ContentPost["kind"]) ?? null,
    supersedesId: (row.supersedes_id as string) ?? null,
    verifiedBy: (row.verified_by as string) ?? null,
    displayOrder: typeof row.display_order === "number" ? row.display_order : 0,
    expiresAt: (row.expires_at as string) ?? null,
    isPinned: (row.is_pinned as boolean) ?? false,
    // Joined exam identity - present only on the embed selects used by the
    // ticker/home pools (B3/B4); null elsewhere. Never invented.
    examSlug: ((row as any).exam?.slug as string) ?? null,
    examCategorySlug: ((row as any).exam?.cat?.slug as string) ?? null,
    examPillar: ((row as any).exam?.pillar as string) ?? null,
  };
}

// ── Service functions ────────────────────────────────────────────────────

export async function getContentPostsByExam(
  examId: string,
  contentType?: ContentType,
  examSlug?: string
): Promise<ContentPost[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      let query = supabase
        .from("content_posts")
        .select("*")
        .eq("exam_id", examId)
        .eq("status", "published")
        .or(expiryOr()); // B2: expired updates never render (withdrawn still shown - History)

      if (contentType) {
        query = query.eq("content_type", contentType);
      }

      const { data, error } = await query.order("updated_at", { ascending: false });
      if (error) throw error;
      // B2: pinned first (reader cap 3), then newest.
      return orderUpdatesForReader((data ?? []).map((r: any) => mapRow(r)));
    } catch (err) {
      console.error("[contentPostService] getContentPostsByExam failed:", err);
      return [];
    }
  }, [
    "exams",
    "content-posts",
    `content-posts:exam:${examId}`,
    ...(contentType ? [`content-type:${contentType}`] : []),
    // `exam:{slug}` is the tag the CMS revalidates on an exam save AND on a
    // content-module save for that exam (revalidateAfterExamSave /
    // revalidateAfterModuleSave), so editing this exam's content clears exactly
    // this entry. `exams` is the broad fallback (also CMS-emitted on exam save).
    ...(examSlug ? [`exam:${examSlug}`] : []),
  ], { revalidate: 600 });
}

export async function getContentPostBySlug(slug: string): Promise<ContentPost | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .or(expiryOr())
      .is("exam_id", null) // a generic /news page never renders an exam-linked update
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
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("content_posts")
        .select("*")
        .eq("content_type", contentType)
        .eq("status", "published")
        .or(expiryOr())
        .is("exam_id", null) // hubs/lists show generic posts only; exam updates live on the exam page
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return excludeTest((data ?? []).map((r: any) => mapRow(r)));
    } catch (err) {
      console.error("[contentPostService] getLatestByContentType failed:", err);
      return [];
    }
  }, [`hub:${contentType}`, "content-posts"], { revalidate: 900 });
}

export async function getContentPostsByPillar(pillar: Pillar): Promise<ContentPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("content_posts")
      .select("*")
      .eq("pillar", pillar)
      .eq("status", "published")
      .or(expiryOr())
      .is("exam_id", null)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return excludeTest((data ?? []).map((r: any) => mapRow(r)));
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
      .or(expiryOr())
      .is("exam_id", null)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return excludeTest((data ?? []).map((r: any) => mapRow(r)));
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
      .or(expiryOr())
      .is("exam_id", null) // search surfaces generic posts, not an exam's update feed
      .or(`title.ilike.%${query}%,exam_entity_name.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return excludeTest((data ?? []).map((r: any) => mapRow(r)));
  } catch (err) {
    console.error("[contentPostService] searchContentPosts failed:", err);
    return [];
  }
}

export async function getLatestContentPosts(limit = 10): Promise<ContentPost[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("content_posts")
        .select("*")
        .eq("status", "published")
        .or(expiryOr())
        .is("exam_id", null) // latest/ticker/RSS show generic posts only
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return excludeTest((data ?? []).map((r: any) => mapRow(r)));
    } catch (err) {
      console.error("[contentPostService] getLatestContentPosts failed:", err);
      return [];
    }
  }, ["exams", "content-posts"], { revalidate: 900 });
}

/**
 * B3 ticker pool: the latest PUBLISHED EXAM-LINKED updates (not withdrawn,
 * not expired, newest first, cap 8), each joined to its exam so the cell can
 * link to the exam page. Generic news is excluded - it has /news. Empty ->
 * the ticker renders NOTHING (never an empty bar).
 */
export async function getTickerUpdates(limit = TICKER_CAP): Promise<ContentPost[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("content_posts")
        .select("*, " + EXAM_EMBED)
        .eq("status", "published")
        .not("exam_id", "is", null) // exam-linked BY DESIGN (the opposite of the leak rule)
        .or(expiryOr())
        .order("updated_at", { ascending: false })
        .limit(limit * 2); // headroom: withdrawn-kind rows are dropped client-side
      if (error) throw error;
      return excludeTest(tickerPool((data ?? []).map((r: any) => mapRow(r)), new Date().toISOString(), limit));
    } catch (err) {
      console.error("[contentPostService] getTickerUpdates failed:", err);
      return [];
    }
  }, ["exams", "content-posts", "ticker"], { revalidate: 600 });
}

/**
 * B4 home pool: same eligibility as the ticker, but pinned first (reader cap
 * 3) and filled to 6 total. Empty -> the home section renders NOTHING.
 */
export async function getHomeBulletin(): Promise<ContentPost[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("content_posts")
        .select("*, " + EXAM_EMBED)
        .eq("status", "published")
        .not("exam_id", "is", null)
        .or(expiryOr())
        .order("updated_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return excludeTest(homeBulletinPool((data ?? []).map((r: any) => mapRow(r)), new Date().toISOString()));
    } catch (err) {
      console.error("[contentPostService] getHomeBulletin failed:", err);
      return [];
    }
  }, ["exams", "content-posts", "ticker"], { revalidate: 600 });
}
