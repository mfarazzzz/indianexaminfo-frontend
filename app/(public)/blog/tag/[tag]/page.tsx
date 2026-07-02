import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPostsByTag, getAllTags } from "@/services/blogService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";

export const revalidate = 86400;

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const posts = await getBlogPostsByTag(tag);

  // noindex for tags with fewer than 3 posts
  const noIndex = posts.length < 3;

  return buildExamMetadata({
    pageType: "static",
    title: `#${tag} — Articles & Guides | IndianExamInfo`,
    description: `All articles tagged with ${tag} on IndianExamInfo. Expert guides, news and preparation tips.`,
    keywords: [tag, `${tag} exam`, `${tag} preparation`, ...GLOBAL_SHORT_TAIL.slice(0, 3)],
    canonicalUrl: `${siteConfig.url}/blog/tag/${tag}`,
    noIndex,
  });
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = await getBlogPostsByTag(tag);

  return (
    <div className="bg-editorial-bg min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { name: "Blog & News", href: "/blog" },
          { name: `#${tag}`, href: `/blog/tag/${tag}` },
        ]} />

        <h1 className="font-heading font-bold text-2xl text-gray-900 mt-4 mb-1">
          Articles tagged: <span className="text-editorial">#{tag}</span>
        </h1>
        <p className="text-sm text-gray-500 mb-5">{posts.length} articles</p>

        {posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No articles found for this tag.</p>
            <Link href="/blog" className="text-primary font-medium hover:underline">← Back to Blog</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <article key={post.id} className="bg-card border border-border rounded shadow-sm p-4 flex flex-col gap-2">
                <span className="text-xs text-editorial font-semibold uppercase">{post.section.replace(/-/g, " ")}</span>
                <h2 className="font-heading font-bold text-sm text-gray-900 leading-snug line-clamp-2">
                  <Link href={`/blog/${post.section}/${post.slug}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-xs text-gray-600 line-clamp-2 flex-1">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto pt-2 border-t border-border">
                  <span>{post.author.name}</span>
                  <span>·</span>
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
