import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostsBySection, getAllBlogPosts, getBlogPostBySlug } from "@/services/blogService";
import { getContentPostBySlug } from "@/services/contentPostService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { safeHtml } from "@/lib/sanitize";
import type { BlogSection, BlogPost } from "@/types/blog";
import { Clock } from "lucide-react";

export const revalidate = 1800;

/**
 * Section metadata — maps URL slugs to display info.
 * "blog" and "article" are virtual sections that aggregate multiple BlogSection values.
 */
const sectionMeta: Record<string, { label: string; description: string; blogSections: BlogSection[] }> = {
  "blog": {
    label: "Blog",
    description: "Expert guides, how-to articles, opinions and in-depth analysis on Indian education.",
    blogSections: ["exam-prep", "career-guidance", "edtech", "student-life", "opinion"],
  },
  "article": {
    label: "Articles",
    description: "In-depth articles covering exams, education policy, study abroad and more.",
    blogSections: ["education-news", "exam-prep", "career-guidance", "study-abroad", "edtech", "student-life", "opinion"],
  },
  "scholarship": {
    label: "Scholarship",
    description: "Latest scholarship opportunities — government, private and international programs for Indian students.",
    blogSections: ["scholarship"],
  },
  "education-news": {
    label: "Education News",
    description: "Latest education news, policy updates, exam schedule announcements and breaking news.",
    blogSections: ["education-news"],
  },
  "career-guidance": {
    label: "Career Guidance",
    description: "Career guidance for students — government jobs, private sector, salary comparison and career paths.",
    blogSections: ["career-guidance"],
  },
  "exam-prep": {
    label: "Exam Preparation",
    description: "Expert exam preparation guides, strategies, study plans and tips for all competitive exams.",
    blogSections: ["exam-prep"],
  },
  "study-abroad": {
    label: "Study Abroad",
    description: "Complete guide for studying abroad — GRE, IELTS, TOEFL, visa process and top universities.",
    blogSections: ["study-abroad"],
  },
  "student-life": {
    label: "Student Life",
    description: "Hostel life, college tips, student productivity, mental health and campus experiences.",
    blogSections: ["student-life"],
  },
  "opinion": {
    label: "Opinion",
    description: "Expert opinions on education policy, exam reforms and higher education challenges in India.",
    blogSections: ["opinion"],
  },
  "edtech": {
    label: "EdTech",
    description: "Latest education technology news, app reviews, online learning platforms and digital trends.",
    blogSections: ["edtech"],
  },
};

type Props = { params: Promise<{ section: string }> };

export async function generateStaticParams() {
  return Object.keys(sectionMeta).map((s) => ({ section: s }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const meta = sectionMeta[section];
  if (!meta) return {};
  return buildExamMetadata({
    pageType: "blog-section",
    title: `${meta.label} — News & Blog | IndianExamInfo`,
    description: meta.description,
    keywords: [meta.label.toLowerCase(), "news", "education", ...GLOBAL_SHORT_TAIL.slice(0, 4)],
    canonicalUrl: `${siteConfig.url}/news/${section}`,
  });
}

export default async function NewsSectionPage({ params }: Props) {
  const { section } = await params;
  const meta = sectionMeta[section];

  // If section is not a known category, try looking it up as a post slug
  if (!meta) {
    // Try blog_posts first
    const blogPost = await getBlogPostBySlug(section);
    if (blogPost && blogPost.status === "published") {
      // Render the blog article inline at /news/[slug]
      return (
        <div className="bg-editorial-bg min-h-screen">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb items={[
              { name: "News & Blog", href: "/news" },
              { name: blogPost.section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), href: `/news/${blogPost.section}` },
              { name: blogPost.title.slice(0, 40) + "…", href: `/news/${section}` },
            ]} />
            <div className="max-w-4xl mx-auto mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Link href={`/news/${blogPost.section}`} className="bg-editorial/10 text-editorial font-semibold text-xs px-2 py-0.5 rounded uppercase tracking-wide hover:bg-editorial hover:text-white transition-colors">
                  {blogPost.section.replace(/-/g, " ")}
                </Link>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded capitalize">{blogPost.postType}</span>
              </div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 mb-3 leading-tight">{blogPost.title}</h1>
              <p className="text-lg text-gray-500 mb-5 leading-relaxed">{blogPost.excerpt}</p>
              {blogPost.author?.name && (
                <div className="flex items-center gap-3 mb-5 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{blogPost.author.name}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{blogPost.readingTime} min read</span>
                  <span>{formatDate(blogPost.publishedAt)}</span>
                </div>
              )}
              <div className="flex justify-center my-5">
                <AdSlot position="blog-article-after-intro" size="336x280" />
              </div>
              <div className="article-body" suppressHydrationWarning {...safeHtml(blogPost.content)} />
              <div className="flex flex-wrap gap-1.5 my-5">
                {blogPost.tags.map((tag) => (
                  <Link key={tag} href={`/news/tag/${tag}`} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-primary hover:text-white transition-colors">#{tag}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Try content_posts table
    const contentPost = await getContentPostBySlug(section);
    if (contentPost && contentPost.status === "published") {
      // Render content post inline at /news/[slug]
      return (
        <div className="bg-editorial-bg min-h-screen">
          <div className="container mx-auto px-4 py-4">
            <Breadcrumb items={[
              { name: "News & Blog", href: "/news" },
              { name: contentPost.contentType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), href: "/news/education-news" },
              { name: contentPost.title.slice(0, 40) + "…", href: `/news/${section}` },
            ]} />
            <div className="max-w-4xl mx-auto mt-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-editorial/10 text-editorial font-semibold text-xs px-2 py-0.5 rounded uppercase tracking-wide">
                  {contentPost.contentType.replace(/-/g, " ")}
                </span>
                {contentPost.examEntityName && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{contentPost.examEntityName}</span>
                )}
              </div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 mb-3 leading-tight">{contentPost.title}</h1>
              {contentPost.excerpt && (
                <p className="text-lg text-gray-500 mb-5 leading-relaxed">{contentPost.excerpt}</p>
              )}
              <div className="flex items-center gap-3 mb-5 text-sm text-gray-500">
                <span>{formatDate(contentPost.publishedAt)}</span>
                {contentPost.updatedAt !== contentPost.publishedAt && (
                  <span>Updated: {formatDate(contentPost.updatedAt)}</span>
                )}
              </div>
              <div className="flex justify-center my-5">
                <AdSlot position="blog-article-after-intro" size="336x280" />
              </div>
              <div className="article-body" suppressHydrationWarning {...safeHtml(contentPost.content)} />
              {contentPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 my-5">
                  {contentPost.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">#{tag}</span>
                  ))}
                </div>
              )}
              {contentPost.faqs && contentPost.faqs.length > 0 && (
                <section className="mb-6">
                  <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">FAQs</h2>
                  <div className="space-y-3">
                    {contentPost.faqs.map((faq, i) => (
                      <div key={i} className="border border-border rounded">
                        <h3 className="font-semibold text-gray-900 text-sm p-4 pb-2">{faq.question}</h3>
                        <p className="text-sm text-gray-700 px-4 pb-4 leading-relaxed">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      );
    }

    notFound();
  }

  // Fetch posts for all matching blog sections
  let posts: BlogPost[] = [];
  if (meta.blogSections.length === 1) {
    posts = await getBlogPostsBySection(meta.blogSections[0]);
  } else {
    // Aggregate from multiple sections
    const allPosts = await getAllBlogPosts();
    posts = allPosts
      .filter((p) => meta.blogSections.includes(p.section))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  return (
    <div className="bg-editorial-bg min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { name: "News & Blog", href: "/news" },
          { name: meta.label, href: `/news/${section}` },
        ]} />

        <div className="flex justify-center mb-4">
          <AdSlot position="blog-homepage-top" size="728x90" />
        </div>

        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">{meta.label}</h1>
        <p className="text-sm text-gray-500 mb-5">{meta.description}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <main>
            {posts.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No articles yet in this section. Check back soon.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {posts.map((post) => (
                  <article key={post.id} className="bg-card border border-border rounded shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gray-100 h-36 flex items-center justify-center text-gray-300 text-xs shrink-0">Image</div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-editorial/10 text-editorial font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                          {post.postType}
                        </span>
                        {post.isBreaking && (
                          <span className="bg-accent text-white font-bold px-1.5 py-0.5 rounded text-xs">BREAKING</span>
                        )}
                      </div>
                      <h2 className="font-heading font-bold text-sm text-gray-900 leading-snug">
                        <Link href={`/news/${post.slug}`} className="hover:text-primary transition-colors">{post.title}</Link>
                      </h2>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-border mt-auto">
                        <span className="font-medium text-gray-600">{post.author?.name}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime} min</span>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>

          <aside className="flex flex-col gap-4">
            <AdSlot position="blog-section-sidebar" size="300x250" />
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide pb-2 border-b border-border">
                All Sections
              </h2>
              <ul className="space-y-1.5 text-sm">
                {Object.entries(sectionMeta).map(([slug, m]) => (
                  <li key={slug}>
                    <Link href={`/news/${slug}`} className={`hover:text-primary hover:underline ${slug === section ? "text-primary font-semibold" : "text-gray-700"}`}>
                      {m.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
