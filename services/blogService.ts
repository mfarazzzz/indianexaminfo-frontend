/**
 * blogService.ts — Reads blog data from Supabase (live CMS-managed data).
 *
 * Previously read from hardcoded /data/blogPosts.ts.
 * Now queries `blog_posts` and `blog_authors` tables.
 * Field mapping mirrors CMS src/services/blogService.ts mapPost() exactly.
 */

import { createServerClient } from "@/lib/supabase/server";
import type { BlogPost, BlogAuthor, BlogSection } from "@/types/blog";

// ── Row mappers ──────────────────────────────────────────────────────────

function mapAuthor(row: any): BlogAuthor {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    designation: row.designation ?? "",
    avatar: row.avatar ?? "",
    bio: row.bio ?? "",
    totalPosts: row.total_posts ?? 0,
    specialization: row.specialization ?? [],
    socialLinks: row.social_links ?? {},
  };
}

function mapPost(row: any): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    section: row.section,
    postType: row.post_type,
    author: row.blog_authors ? mapAuthor(row.blog_authors) : ({} as BlogAuthor),
    featuredImage: row.featured_image ?? "",
    featuredImageCaption: row.featured_image_caption ?? "",
    readingTime: row.reading_time ?? 0,
    wordCount: row.word_count ?? 0,
    views: row.views ?? 0,
    shares: row.shares ?? 0,
    tags: row.tags ?? [],
    relatedExamSlugs: row.related_exam_slugs ?? [],
    publishedAt: row.published_at ?? row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    isFeatured: row.is_featured,
    isBreaking: row.is_breaking,
    isPinned: row.is_pinned,
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    canonicalUrl: row.canonical_url ?? "",
    tableOfContents: row.table_of_contents ?? [],
    faqs: row.faqs ?? [],
  };
}

const POST_SELECT = "*, blog_authors(*)";

// ── Service functions ────────────────────────────────────────────────────

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getAllBlogPosts failed:", err);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapPost(data);
  } catch (err) {
    console.error("[blogService] getBlogPostBySlug failed:", err);
    return null;
  }
}

export async function getBlogPostsBySection(section: BlogSection): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("section", section)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getBlogPostsBySection failed:", err);
    return [];
  }
}

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("is_featured", true)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getFeaturedBlogPosts failed:", err);
    return [];
  }
}

export async function getBreakingBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("is_breaking", true)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getBreakingBlogPosts failed:", err);
    return [];
  }
}

export async function getBlogPostsByAuthor(authorSlug: string): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    // Look up author id by slug
    const { data: authorData } = await supabase
      .from("blog_authors")
      .select("id")
      .eq("slug", authorSlug)
      .maybeSingle();

    if (!authorData) return [];

    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("author_id", (authorData as any).id)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getBlogPostsByAuthor failed:", err);
    return [];
  }
}

export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .contains("tags", [tag])
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getBlogPostsByTag failed:", err);
    return [];
  }
}

export async function getRelatedBlogPosts(postSlug: string): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    // First get the post's section by slug (not id)
    const { data: post } = await supabase
      .from("blog_posts")
      .select("id, section, tags")
      .eq("slug", postSlug)
      .eq("status", "published")
      .maybeSingle();

    if (!post) return [];

    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .neq("id", (post as any).id)
      .eq("status", "published")
      .eq("section", (post as any).section)
      .limit(3)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getRelatedBlogPosts failed:", err);
    return [];
  }
}

export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
  if (!query.trim()) return [];
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] searchBlogPosts failed:", err);
    return [];
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("tags")
      .eq("status", "published");
    if (error) throw error;
    const allTags = (data ?? []).flatMap((r: any) => r.tags ?? []);
    return [...new Set(allTags)].sort();
  } catch (err) {
    console.error("[blogService] getAllTags failed:", err);
    return [];
  }
}

export async function getLatestBlogPosts(limit = 5): Promise<BlogPost[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapPost);
  } catch (err) {
    console.error("[blogService] getLatestBlogPosts failed:", err);
    return [];
  }
}

/** Fetch a single blog author's public profile. */
export async function getBlogAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("blog_authors")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) return null;
    return mapAuthor(data);
  } catch (err) {
    console.error("[blogService] getBlogAuthorBySlug failed:", err);
    return null;
  }
}
