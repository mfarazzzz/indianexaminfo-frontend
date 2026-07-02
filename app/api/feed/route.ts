import { NextRequest, NextResponse } from "next/server";
import { getAllBlogPosts } from "@/services/blogService";
import { getLatestContentPosts } from "@/services/contentPostService";
import { generateBlogRss, generateExamRss } from "@/lib/rss";
import { siteConfig } from "@/config/site";

export const revalidate = 1800;

function escapeXml(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type   = searchParams.get("type")   ?? "all";
  const format = searchParams.get("format") ?? "rss";

  // ── Atom format ──────────────────────────────────────────────────
  if (format === "atom") {
    const posts  = await getAllBlogPosts();
    const BASE   = siteConfig.url;
    const now    = new Date().toISOString();
    const sorted = [...posts].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ).slice(0, 50);

    const entries = sorted.map((p) => {
      const url = `${BASE}/blog/${p.section}/${p.slug}`;
      return `  <entry>
    <id>${escapeXml(url)}</id>
    <title>${escapeXml(p.title)}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(url)}"/>
    <updated>${new Date(p.updatedAt).toISOString()}</updated>
    <published>${new Date(p.publishedAt).toISOString()}</published>
    <author><name>${escapeXml(p.author.name)}</name></author>
    <summary type="text">${escapeXml(p.excerpt)}</summary>
    <category term="${escapeXml(p.section)}"/>
  </entry>`;
    }).join("\n");

    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${BASE}/</id>
  <title>${escapeXml(siteConfig.name)} — Blog &amp; Education News</title>
  <link rel="alternate" type="text/html" href="${BASE}/blog"/>
  <link rel="self" type="application/atom+xml" href="${BASE}/api/feed?format=atom"/>
  <updated>${now}</updated>
  <author><name>${escapeXml(siteConfig.name)}</name><uri>${BASE}</uri></author>
  <rights>Copyright ${new Date().getFullYear()} ${escapeXml(siteConfig.organization.name)}</rights>
${entries}
</feed>`;
    return new NextResponse(atom, {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=300",
      },
    });
  }

  // ── RSS format ───────────────────────────────────────────────────
  let xml = "";
  if (type === "blog") {
    const posts = await getAllBlogPosts();
    xml = generateBlogRss(posts);
  } else if (type === "exams") {
    const posts = await getLatestContentPosts(50);
    xml = generateExamRss(posts);
  } else {
    const [blogPosts] = await Promise.all([getAllBlogPosts(), getLatestContentPosts(30)]);
    xml = generateBlogRss(
      [...blogPosts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    );
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=300",
    },
  });
}
