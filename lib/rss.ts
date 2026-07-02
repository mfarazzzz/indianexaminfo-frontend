import { siteConfig } from "@/config/site";
import type { ContentPost } from "@/types/exam";
import type { BlogPost } from "@/types/blog";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildRssItem(item: {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  author?: string;
  categories?: string[];
}): string {
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
      <guid isPermaLink="true">${item.link}</guid>
      ${item.author ? `<author>${escapeXml(item.author)}</author>` : ""}
      ${(item.categories ?? []).map((c) => `<category>${escapeXml(c)}</category>`).join("\n      ")}
    </item>`;
}

function buildRssFeed(
  title: string,
  description: string,
  link: string,
  items: string[]
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${link}</link>
    <description>${escapeXml(description)}</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${link}/feed.xml" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>`;
}

export function generateBlogRss(posts: BlogPost[]): string {
  const items = posts.slice(0, 50).map((post) =>
    buildRssItem({
      title: post.title,
      link: `${siteConfig.url}/blog/${post.section}/${post.slug}`,
      description: post.excerpt,
      pubDate: post.publishedAt,
      author: post.author.name,
      categories: post.tags,
    })
  );
  return buildRssFeed(
    "IndianExamInfo Blog — Education News & Exam Prep",
    "Latest education news, exam preparation guides and career guidance",
    siteConfig.url
  , items);
}

export function generateExamRss(posts: ContentPost[]): string {
  const items = posts.slice(0, 50).map((post) =>
    buildRssItem({
      title: post.title,
      link: `${siteConfig.url}/${post.pillar}/${post.examEntityName
        .toLowerCase()
        .replace(/\s+/g, "-")}/${post.slug}`,
      description: post.excerpt,
      pubDate: post.publishedAt,
      categories: post.tags,
    })
  );
  return buildRssFeed(
    "IndianExamInfo — Latest Exam Updates",
    "Latest exam notifications, admit cards, results and answer keys",
    siteConfig.url
  , items);
}
