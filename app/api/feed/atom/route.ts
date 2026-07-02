import { NextResponse } from "next/server";
import { getAllBlogPosts } from "@/services/blogService";
import { siteConfig } from "@/config/site";

export const revalidate = 1800;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET() {
  const posts = await getAllBlogPosts();
  const BASE   = siteConfig.url;
  const now    = new Date().toISOString();

  const entries = posts
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 50)
    .map((post) => {
      const url = `${BASE}/blog/${post.section}/${post.slug}`;
      return `  <entry>
    <id>${escapeXml(url)}</id>
    <title>${escapeXml(post.title)}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(url)}"/>
    <updated>${new Date(post.updatedAt).toISOString()}</updated>
    <published>${new Date(post.publishedAt).toISOString()}</published>
    <author><name>${escapeXml(post.author.name)}</name></author>
    <summary type="text">${escapeXml(post.excerpt)}</summary>
    <category term="${escapeXml(post.section)}"/>
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${BASE}/</id>
  <title>${escapeXml(siteConfig.name)} — Blog &amp; Education News</title>
  <subtitle>${escapeXml(siteConfig.description)}</subtitle>
  <link rel="alternate" type="text/html" href="${BASE}/blog"/>
  <link rel="self" type="application/atom+xml" href="${BASE}/api/feed/atom"/>
  <updated>${now}</updated>
  <author><name>${escapeXml(siteConfig.name)}</name><uri>${BASE}</uri></author>
  <rights>Copyright ${new Date().getFullYear()} ${escapeXml(siteConfig.organization.name)}</rights>
  <generator uri="${BASE}">IndianExamInfo</generator>
${entries}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=300",
    },
  });
}
