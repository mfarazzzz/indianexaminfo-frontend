import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug, getRelatedBlogPosts } from "@/services/blogService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildArticleSchema, buildFAQSchema } from "@/lib/seo/structured-data";
import { BLOG_SECTION_KEYWORDS, GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate, formatDateLong } from "@/lib/utils";
import { safeHtml } from "@/lib/sanitize";
import type { BlogSection } from "@/types/blog";
import { Clock, Twitter, Linkedin, Share2, ExternalLink } from "lucide-react";

export const revalidate = 3600;

type Props = { params: Promise<{ section: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section, slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  return buildExamMetadata({
    pageType: "blog-post",
    title: post.seoTitle,
    description: post.seoDescription,
    keywords: [
      ...(BLOG_SECTION_KEYWORDS[post.section as BlogSection] ?? []).slice(0, 8),
      ...post.tags.slice(0, 6),
      ...GLOBAL_SHORT_TAIL.slice(0, 4),
    ],
    canonicalUrl: post.canonicalUrl,
    ogImage: post.featuredImage.startsWith("http") ? post.featuredImage : undefined,
    ogAlt: post.title,
    section: post.section,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    tags: post.tags,
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { section, slug } = await params;
  const [post, related] = await Promise.all([
    getBlogPostBySlug(slug),
    getRelatedBlogPosts(slug).catch(() => []),
  ]);

  if (!post || post.status !== "published") notFound();

  const articleUrl = `${siteConfig.url}/blog/${section}/${slug}`;
  const authorUrl = `${siteConfig.url}/blog/author/${post.author.slug}`;

  const shareText = encodeURIComponent(`${post.title} — @IndianExamInfo`);
  const shareUrl = encodeURIComponent(articleUrl);

  const sectionLabel = section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <JsonLd data={buildArticleSchema(post, articleUrl, authorUrl)} />
      {post.faqs?.length && <JsonLd data={buildFAQSchema(post.faqs)} />}

      <div className="bg-editorial-bg min-h-screen">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[
            { name: "Blog & News", href: "/blog" },
            { name: sectionLabel, href: `/blog/${section}` },
            { name: post.title.slice(0, 40) + "…", href: `/blog/${section}/${slug}` },
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-4">
            {/* Main article */}
            <main>
              {/* Section + Type badges */}
              <div className="flex items-center gap-2 mb-3">
                <Link href={`/blog/${section}`} className="bg-editorial/10 text-editorial font-semibold text-xs px-2 py-0.5 rounded uppercase tracking-wide hover:bg-editorial hover:text-white transition-colors">
                  {sectionLabel}
                </Link>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded capitalize">{post.postType}</span>
                {post.isBreaking && (
                  <span className="bg-accent text-white font-bold text-xs px-1.5 py-0.5 rounded">BREAKING</span>
                )}
              </div>

              {/* H1 */}
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 mb-3 leading-tight article-title">
                {post.title}
              </h1>

              {/* Deck */}
              <p className="text-lg text-gray-500 mb-5 leading-relaxed">{post.excerpt}</p>

              {/* Author block */}
              <div className="flex items-start gap-4 p-4 bg-card border border-border rounded mb-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                  {post.author.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{post.author.name}</p>
                  <p className="text-xs text-gray-500">{post.author.designation}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{formatDateLong(post.publishedAt)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime} min read</span>
                    {post.updatedAt !== post.publishedAt && (
                      <span>Updated: {formatDate(post.updatedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {post.author.socialLinks.twitter && (
                    <a href={post.author.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Author Twitter" className="text-gray-400 hover:text-primary transition-colors">
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {post.author.socialLinks.linkedin && (
                    <a href={post.author.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Author LinkedIn" className="text-gray-400 hover:text-primary transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Featured image */}
              <figure className="mb-5 rounded overflow-hidden bg-gray-100 h-64 flex items-center justify-center text-gray-400">
                <figcaption className="sr-only">{post.featuredImageCaption}</figcaption>
                <span className="text-sm">{post.featuredImageCaption || "Featured Image"}</span>
              </figure>

              {/* Table of Contents */}
              {post.tableOfContents.length > 0 && (
                <nav aria-label="Table of contents" className="bg-surface border border-border rounded p-4 mb-6">
                  <p className="font-semibold text-sm text-gray-800 mb-2">Table of Contents</p>
                  <ol className="space-y-1">
                    {post.tableOfContents.map((item) => (
                      <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                        <a href={`#${item.id}`} className="text-sm text-primary hover:underline">
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              {/* Ad after intro */}
              <div className="flex justify-center my-5">
                <AdSlot position="blog-article-after-intro" size="336x280" />
              </div>

              {/* Article body */}
              <div className="article-body" {...safeHtml(post.content)} />

              {/* Related exam links */}
              {post.relatedExamSlugs.length > 0 && (
                <section aria-label="Related exam updates" className="my-6 bg-primary-50 border border-primary-100 rounded p-4">
                  <h2 className="font-heading font-semibold text-sm text-primary mb-2">Related Exam Updates</h2>
                  <div className="flex flex-wrap gap-2">
                    {post.relatedExamSlugs.map((examSlug) => (
                      <Link key={examSlug} href={`/sarkari-naukri/banking/${examSlug}`} className="text-xs font-semibold text-primary bg-white border border-primary/20 px-2 py-1 rounded hover:bg-primary hover:text-white transition-colors">
                        {examSlug.toUpperCase()} 2025
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 my-5">
                {post.tags.map((tag) => (
                  <Link key={tag} href={`/blog/tag/${tag}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-primary hover:text-white transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>

              {/* Source note */}
              <p className="text-xs text-gray-400 border-t border-border pt-4 mb-4">
                Information sourced from official exam body websites. Last reviewed: {formatDate(post.updatedAt)}.
              </p>

              {/* FAQs */}
              {post.faqs && post.faqs.length > 0 && (
                <section aria-label="Frequently asked questions" className="mb-6">
                  <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-3">
                    {post.faqs.map((faq, i) => (
                      <div key={i} className="border border-border rounded">
                        <h3 className="font-semibold text-gray-900 text-sm p-4 pb-2">{faq.question}</h3>
                        <p className="text-sm text-gray-700 px-4 pb-4 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Ad before related */}
              <div className="flex justify-center my-5">
                <AdSlot position="blog-article-mid" size="728x90" />
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <section aria-label="Related articles" className="mb-6">
                  <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Related Articles</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {related.map((rel) => (
                      <article key={rel.id} className="bg-card border border-border rounded p-3 flex flex-col gap-2">
                        <span className="text-xs text-editorial font-semibold uppercase">{rel.section.replace(/-/g, " ")}</span>
                        <h3 className="font-heading font-bold text-sm text-gray-900 leading-snug line-clamp-3">
                          <Link href={`/blog/${rel.section}/${rel.slug}`} className="hover:text-primary transition-colors">
                            {rel.title}
                          </Link>
                        </h3>
                        <p className="text-xs text-gray-400 mt-auto">{formatDate(rel.publishedAt)}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Author bio card */}
              <section aria-label="About the author" className="bg-surface border border-border rounded p-5">
                <h2 className="font-heading font-semibold text-sm text-gray-800 uppercase tracking-wide mb-4">About the Author</h2>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                    {post.author.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-base text-gray-900">{post.author.name}</p>
                    <p className="text-sm text-gray-500 mb-2">{post.author.designation}</p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{post.author.bio}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.author.specialization.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{post.author.totalPosts} articles published</p>
                    <div className="flex gap-3 mt-2">
                      {post.author.socialLinks.twitter && (
                        <a href={post.author.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Twitter className="w-3.5 h-3.5" /> Twitter
                        </a>
                      )}
                      {post.author.socialLinks.linkedin && (
                        <a href={post.author.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </main>

            {/* Sidebar */}
            <aside className="flex flex-col gap-5">
              {/* Share buttons (sticky) */}
              <div className="bg-card border border-border rounded p-4 sticky top-20">
                <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">Share</h2>
                <div className="flex flex-col gap-2">
                  <a
                    href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-white bg-[#25D366] px-3 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-white bg-[#2CA5E0] px-3 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink className="w-4 h-4" /> Telegram
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}&via=IndianExamInfo`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-white bg-[#1DA1F2] px-3 py-2 rounded hover:opacity-90 transition-opacity"
                  >
                    <Twitter className="w-4 h-4" /> Twitter / X
                  </a>
                </div>
              </div>

              {/* You may also like */}
              {related.length > 0 && (
                <div className="bg-card border border-border rounded p-4">
                  <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide pb-2 border-b border-border">You May Also Like</h2>
                  <ul className="space-y-2">
                    {related.map((r) => (
                      <li key={r.id}>
                        <Link href={`/blog/${r.section}/${r.slug}`} className="text-sm text-gray-700 hover:text-primary hover:underline leading-snug block">
                          {r.title}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.publishedAt)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <AdSlot position="blog-article-sidebar" size="300x250" />

              {/* Tags */}
              <div className="bg-card border border-border rounded p-4">
                <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">Popular Tags</h2>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/blog/tag/${tag}`} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-primary hover:text-white transition-colors">
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
