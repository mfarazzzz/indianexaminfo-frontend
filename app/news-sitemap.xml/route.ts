/**
 * Google News Sitemap — /news-sitemap.xml
 * 
 * Required for Google News inclusion. Returns articles published in the last 48 hours.
 * Only includes time-sensitive content types: result, admit-card, answer-key, notification, application.
 * 
 * Google News Sitemap spec:
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

export const revalidate = 900; // 15 minutes

const BASE = siteConfig.url;
const NEWS_CONTENT_TYPES = ["result", "admit-card", "answer-key", "notification", "application", "date-sheet"];

export async function GET() {
  try {
    const supabase = createServerClient();
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Fetch recent published content posts (time-sensitive types)
    const { data: posts, error: postsErr } = await supabase
      .from("content_posts")
      .select("slug, title, published_at, content_type, tags, exam_entity_name")
      .eq("status", "published")
      .in("content_type", NEWS_CONTENT_TYPES)
      .gte("published_at", twoDaysAgo)
      .order("published_at", { ascending: false })
      .limit(1000);
    if (postsErr) throw postsErr;

    // Fetch recent sarkari_naukri entries
    const { data: sarkariItems, error: sarkariErr } = await supabase
      .from("sarkari_naukri")
      .select("slug, title, published_at, tags")
      .eq("workflow_status", "published")
      .gte("published_at", twoDaysAgo)
      .order("published_at", { ascending: false })
      .limit(500);
    if (sarkariErr) throw sarkariErr;

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    // Content posts
    for (const post of posts ?? []) {
      const url = `${BASE}/sarkari-naukri/${post.slug}`;
      const pubDate = post.published_at
        ? new Date(post.published_at).toISOString()
        : new Date().toISOString();
      const keywords = Array.isArray(post.tags) ? post.tags.slice(0, 10).join(", ") : "";
      const title = escapeXml(post.title);

      xml += `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
      ${keywords ? `<news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>
`;
    }

    // Sarkari Naukri items
    for (const item of sarkariItems ?? []) {
      const url = `${BASE}/sarkari-naukri/${item.slug}`;
      const pubDate = item.published_at
        ? new Date(item.published_at).toISOString()
        : new Date().toISOString();
      const keywords = Array.isArray(item.tags) ? item.tags.slice(0, 10).join(", ") : "";
      const title = escapeXml(item.title);

      xml += `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
      ${keywords ? `<news:keywords>${escapeXml(keywords)}</news:keywords>` : ""}
    </news:news>
  </url>
`;
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=900, s-maxage=900",
      },
    });
  } catch (err) {
    // NEVER serve a well-formed EMPTY sitemap on a failed read — Google would
    // read "0 news URLs" as truth and drop news results. A 5xx makes crawlers
    // keep the last good sitemap and retry. Logged with context.
    console.error("[news-sitemap] Generation failed (serving 500, not a fake-empty sitemap):", err);
    return new NextResponse("News sitemap temporarily unavailable", { status: 500 });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
