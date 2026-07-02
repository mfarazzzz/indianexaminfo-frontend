import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostsBySection } from "@/services/blogService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { BLOG_SECTION_KEYWORDS, GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";
import type { BlogSection } from "@/types/blog";
import { Clock } from "lucide-react";

export const revalidate = 1800;

const sectionMeta: Record<string, { label: string; description: string }> = {
  "education-news":  { label: "Education News",    description: "Latest education news, policy updates, exam schedule announcements and breaking news for students." },
  "exam-prep":       { label: "Exam Preparation",  description: "Expert exam preparation guides, strategy, study plans and tips for UPSC, SSC, Banking, NEET, JEE and more." },
  "career-guidance": { label: "Career Guidance",   description: "Career guidance for students — government jobs, private sector, salary comparison and career path analysis." },
  "scholarship":     { label: "Scholarships",      description: "Scholarship opportunities for Indian students — government, private and international scholarship programs." },
  "study-abroad":    { label: "Study Abroad",      description: "Complete guide for studying abroad — GRE, IELTS, TOEFL, visa process, top universities and scholarship options." },
  "edtech":          { label: "EdTech",             description: "Latest education technology news, app reviews, online learning platforms and digital education trends in India." },
  "student-life":    { label: "Student Life",       description: "Hostel life, college tips, student productivity hacks, mental health and social life advice for Indian students." },
  "opinion":         { label: "Opinion",            description: "Expert opinions on Indian education policy, exam reforms, reservation system and higher education challenges." },
};

type Props = { params: Promise<{ section: string }> };

export async function generateStaticParams() {
  return Object.keys(sectionMeta).map((s) => ({ section: s }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  const meta = sectionMeta[section];
  if (!meta) return {};
  const sectionKws = BLOG_SECTION_KEYWORDS[section as BlogSection] ?? [];
  return buildExamMetadata({
    pageType: "blog-section",
    title: `${meta.label} — IndianExamInfo Blog`,
    description: meta.description,
    keywords: [...sectionKws.slice(0, 12), ...GLOBAL_SHORT_TAIL.slice(0, 4)],
    canonicalUrl: `${siteConfig.url}/blog/${section}`,
  });
}

export default async function BlogSectionPage({ params }: Props) {
  const { section } = await params;
  const meta = sectionMeta[section];
  if (!meta) notFound();

  const posts = await getBlogPostsBySection(section as BlogSection);

  return (
    <div className="bg-editorial-bg min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { name: "Blog & News", href: "/blog" },
          { name: meta.label, href: `/blog/${section}` },
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
                    <div className="bg-gray-100 h-36 flex items-center justify-center text-gray-300 text-xs shrink-0">
                      Image
                    </div>
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
                        <Link href={`/blog/${section}/${post.slug}`} className="hover:text-primary transition-colors">
                          {post.title}
                        </Link>
                      </h2>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-border mt-auto">
                        <span className="font-medium text-gray-600">{post.author.name}</span>
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
                All Blog Sections
              </h2>
              <ul className="space-y-1.5 text-sm">
                {Object.entries(sectionMeta).map(([slug, m]) => (
                  <li key={slug}>
                    <Link href={`/blog/${slug}`} className={`hover:text-primary hover:underline ${slug === section ? "text-primary font-semibold" : "text-gray-700"}`}>
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
