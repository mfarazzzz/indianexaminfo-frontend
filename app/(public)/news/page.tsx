import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts, getFeaturedBlogPosts, getBreakingBlogPosts } from "@/services/blogService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/utils";
import { Clock, TrendingUp, Zap } from "lucide-react";

export const revalidate = 600;

export const metadata: Metadata = buildExamMetadata({
  pageType: "blog-homepage",
  title: "News & Blog — Education News, Exam Updates & Scholarship",
  description:
    "Latest education news, exam updates, scholarship opportunities, career guidance and expert articles for Indian students.",
  keywords: [
    "education news", "exam news", "scholarship news", "blog",
    "sarkari result news", "admit card news", ...GLOBAL_SHORT_TAIL.slice(0, 4),
  ],
  canonicalUrl: `${siteConfig.url}/news`,
});

const sections = [
  { slug: "blog", label: "Blog", description: "Expert guides, how-tos and opinion pieces", color: "bg-blue-50 text-blue-700" },
  { slug: "article", label: "Articles", description: "In-depth articles on exams, career and education", color: "bg-green-50 text-green-700" },
  { slug: "scholarship", label: "Scholarship", description: "Latest scholarship opportunities for students", color: "bg-yellow-50 text-yellow-700" },
  { slug: "education-news", label: "Education News", description: "Breaking news on exams, results, policy changes", color: "bg-red-50 text-red-700" },
  { slug: "career-guidance", label: "Career Guidance", description: "Career advice, salary analysis and job market insights", color: "bg-purple-50 text-purple-700" },
  { slug: "exam-prep", label: "Exam Preparation", description: "Study plans, tips and strategies", color: "bg-indigo-50 text-indigo-700" },
  { slug: "study-abroad", label: "Study Abroad", description: "GRE, IELTS, TOEFL guides and university info", color: "bg-pink-50 text-pink-700" },
  { slug: "student-life", label: "Student Life", description: "College tips, productivity and student wellbeing", color: "bg-orange-50 text-orange-700" },
];

export default async function NewsHomepage() {
  const [allPosts, featuredPosts, breakingPosts] = await Promise.all([
    getAllBlogPosts(),
    getFeaturedBlogPosts(),
    getBreakingBlogPosts(),
  ]);

  const recentPosts = allPosts
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 12);

  return (
    <div className="bg-editorial-bg min-h-screen">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ name: "News & Blog", href: "/news" }]} />

        <div className="flex justify-center mb-4">
          <AdSlot position="blog-homepage-top" size="728x90" />
        </div>

        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
          News &amp; Blog
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Latest education news, exam updates, scholarships and expert articles
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <main>
            {/* Section pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {sections.map((s) => (
                <Link
                  key={s.slug}
                  href={`/news/${s.slug}`}
                  className={`text-xs font-semibold px-3 py-1.5 rounded border border-transparent hover:border-current ${s.color} transition-colors`}
                >
                  {s.label}
                </Link>
              ))}
            </div>

            {/* Breaking */}
            {breakingPosts.length > 0 && (
              <section aria-label="Breaking news" className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-accent" />
                  <h2 className="font-heading font-bold text-base text-gray-900">Breaking News</h2>
                </div>
                <div className="space-y-2">
                  {breakingPosts.slice(0, 3).map((post) => (
                    <Link
                      key={post.id}
                      href={`/news/${post.slug}`}
                      className="flex items-start gap-2 p-3 bg-card border border-accent/20 rounded hover:border-accent transition-colors group"
                    >
                      <span className="shrink-0 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded mt-0.5">NEW</span>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug">{post.title}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Featured post */}
            {featuredPosts[0] && (
              <section aria-label="Featured article" className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-editorial" />
                  <h2 className="font-heading font-bold text-base text-gray-900">Featured</h2>
                </div>
                <article className="bg-card border border-border rounded shadow-sm overflow-hidden">
                  <div className="bg-gray-100 h-52 flex items-center justify-center text-gray-400">Featured Image</div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="bg-editorial/10 text-editorial font-semibold px-2 py-0.5 rounded uppercase">
                        {featuredPosts[0].section.replace(/-/g, " ")}
                      </span>
                      <span className="text-gray-400">{featuredPosts[0].postType}</span>
                    </div>
                    <h3 className="font-heading font-bold text-lg text-gray-900 mb-2 leading-snug">
                      <Link href={`/news/${featuredPosts[0].slug}`} className="hover:text-primary transition-colors">
                        {featuredPosts[0].title}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{featuredPosts[0].excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{featuredPosts[0].author.name}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featuredPosts[0].readingTime} min read</span>
                      <span>{formatDate(featuredPosts[0].publishedAt)}</span>
                    </div>
                  </div>
                </article>
              </section>
            )}

            {/* Recent posts grid */}
            <section aria-label="Recent articles">
              <h2 className="font-heading font-bold text-base text-gray-900 mb-4">Recent Articles</h2>
              {recentPosts.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">No articles published yet. Check back soon.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentPosts.map((post) => (
                    <article key={post.id} className="bg-card border border-border rounded shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-gray-100 h-32 flex items-center justify-center text-gray-300 text-xs">Image</div>
                      <div className="p-3 flex-1 flex flex-col gap-2">
                        <span className="text-xs text-editorial font-semibold uppercase">{post.section.replace(/-/g, " ")}</span>
                        <h3 className="font-heading font-bold text-sm text-gray-900 leading-snug line-clamp-2">
                          <Link href={`/news/${post.slug}`} className="hover:text-primary transition-colors">{post.title}</Link>
                        </h3>
                        <p className="text-xs text-gray-600 line-clamp-2 flex-1">{post.excerpt}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                          <span>{post.author.name}</span>
                          <span>·</span>
                          <span>{post.readingTime} min</span>
                          <span>·</span>
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            <AdSlot position="blog-section-sidebar" size="300x250" />
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide pb-2 border-b border-border">
                Categories
              </h2>
              <ul className="space-y-2">
                {sections.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/news/${s.slug}`} className="text-sm text-gray-700 hover:text-primary hover:underline">
                      {s.label}
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
