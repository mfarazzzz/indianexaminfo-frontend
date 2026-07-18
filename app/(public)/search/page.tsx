import type { Metadata } from "next";
import Link from "next/link";
import { searchExams } from "@/services/examService";
import { searchBlogPosts } from "@/services/blogService";
import { searchContentPosts } from "@/services/contentPostService";
import { searchSarkariNaukri } from "@/services/sarkariNaukriService";
import { searchEducationNews } from "@/services/educationNewsService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { Search, Briefcase, GraduationCap, Newspaper, FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search — IndianExamInfo",
  description: "Search government jobs, entrance exams, board results, admit cards, news and resources.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ q?: string; type?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", type = "all" } = await searchParams;
  const query = q.trim();

  // Run parallel searches across all content domains
  const [exams, sarkariNaukri, contentPosts, blogPosts, educationNews] = query.length > 1
    ? await Promise.all([
        type === "all" || type === "exams" ? searchExams(query) : [],
        type === "all" || type === "jobs" ? searchSarkariNaukri(query) : [],
        type === "all" || type === "exams" ? searchContentPosts(query) : [],
        type === "all" || type === "news" ? searchBlogPosts(query) : [],
        type === "all" || type === "news" ? searchEducationNews(query) : [],
      ])
    : [[], [], [], [], []];

  const totalResults = exams.length + sarkariNaukri.length + contentPosts.length + blogPosts.length + educationNews.length;

  const tabs = [
    { key: "all", label: "All", count: totalResults },
    { key: "jobs", label: "Govt Jobs", count: sarkariNaukri.length, icon: Briefcase },
    { key: "exams", label: "Exams", count: exams.length + contentPosts.length, icon: GraduationCap },
    { key: "news", label: "News", count: blogPosts.length + educationNews.length, icon: Newspaper },
  ];

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Search", href: "/search" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      {/* Search form */}
      <div className="max-w-2xl mx-auto mb-6">
        <form action="/search" method="get">
          <input type="hidden" name="type" value={type} />
          <div className="flex items-center gap-2 border-2 border-primary rounded-lg px-4 py-3 bg-white focus-within:ring-2 ring-primary/20">
            <Search className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search government jobs, exams, results, news..."
              className="flex-1 text-base outline-none text-gray-900"
              aria-label="Search query"
              autoFocus
            />
            <button type="submit" className="bg-primary text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Type filter tabs */}
      {query.length > 1 && (
        <div className="flex items-center gap-2 mb-6 max-w-2xl mx-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/search?q=${encodeURIComponent(query)}&type=${tab.key}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                type === tab.key
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] ${type === tab.key ? "text-white/70" : "text-gray-400"}`}>
                {tab.count}
              </span>
            </Link>
          ))}
        </div>
      )}

      {query.length > 1 ? (
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-500 mb-5">
            {totalResults} results for <strong>&quot;{query}&quot;</strong>
          </p>

          {/* Government Jobs */}
          {sarkariNaukri.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 font-heading font-bold text-base text-gray-900 mb-3 pb-2 border-b border-border">
                <Briefcase className="w-4 h-4 text-primary" />
                Government Jobs ({sarkariNaukri.length})
              </h2>
              <div className="space-y-2">
                {sarkariNaukri.map((item) => (
                  <Link
                    key={item.id}
                    href={`/sarkari-naukri/${item.slug}`}
                    className="flex items-start justify-between gap-3 p-3 bg-card border border-border rounded hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.organization} · {item.state?.replace(/-/g, " ")}
                        {item.vacancyCount && ` · ${item.vacancyCount} posts`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.recruitmentType === "exam" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {item.recruitmentType === "exam" ? "Exam" : "Bharti"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Entrance / Board Exams */}
          {exams.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 font-heading font-bold text-base text-gray-900 mb-3 pb-2 border-b border-border">
                <GraduationCap className="w-4 h-4 text-amber-600" />
                Exams ({exams.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exams.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/${exam.pillar}/${exam.category}/${exam.slug}`}
                    className="flex items-start justify-between gap-2 p-3 bg-card border border-border rounded hover:border-primary/50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug">{exam.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{exam.conductingBody}</p>
                    </div>
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 capitalize">
                      {exam.status.replace(/-/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Content Posts (Admit Cards, Results, etc.) */}
          {contentPosts.length > 0 && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 font-heading font-bold text-base text-gray-900 mb-3 pb-2 border-b border-border">
                <FileText className="w-4 h-4 text-indigo-600" />
                Updates ({contentPosts.length})
              </h2>
              <div className="space-y-2">
                {contentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/sarkari-naukri/${post.slug}`}
                    className="flex items-start gap-3 p-3 bg-card border border-border rounded hover:border-primary/50 transition-colors group"
                  >
                    <span className="shrink-0 rounded bg-indigo-50 text-indigo-600 text-[10px] font-semibold px-1.5 py-0.5 mt-0.5 capitalize">
                      {post.contentType.replace(/-/g, " ")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{post.examEntityName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* News & Articles */}
          {(blogPosts.length > 0 || educationNews.length > 0) && (
            <section className="mb-8">
              <h2 className="flex items-center gap-2 font-heading font-bold text-base text-gray-900 mb-3 pb-2 border-b border-border">
                <Newspaper className="w-4 h-4 text-green-600" />
                News & Articles ({blogPosts.length + educationNews.length})
              </h2>
              <div className="space-y-2">
                {educationNews.map((item) => (
                  <Link
                    key={item.id}
                    href="/blog/education-news"
                    className="flex items-start gap-3 p-3 bg-card border border-border rounded hover:border-primary/50 transition-colors group"
                  >
                    <span className="shrink-0 rounded bg-green-50 text-green-600 text-[10px] font-semibold px-1.5 py-0.5 mt-0.5">
                      {item.isBreaking ? "BREAKING" : "NEWS"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.category.replace(/-/g, " ")} {item.source && `· ${item.source}`}</p>
                    </div>
                  </Link>
                ))}
                {blogPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.section}/${post.slug}`}
                    className="flex items-start gap-3 p-3 bg-card border border-border rounded hover:border-primary/50 transition-colors group"
                  >
                    <span className="shrink-0 rounded bg-purple-50 text-purple-600 text-[10px] font-semibold px-1.5 py-0.5 mt-0.5 capitalize">
                      {post.postType ?? "article"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{post.section.replace(/-/g, " ")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {totalResults === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-2">No results found for &quot;{query}&quot;</p>
              <p className="text-gray-400 text-sm mb-6">Try different keywords or browse by category</p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link href="/sarkari-naukri" className="text-sm text-primary font-medium hover:underline">Government Jobs</Link>
                <Link href="/entrance-exam" className="text-sm text-primary font-medium hover:underline">Entrance Exams</Link>
                <Link href="/board-exam" className="text-sm text-primary font-medium hover:underline">Board & University</Link>
                <Link href="/blog" className="text-sm text-primary font-medium hover:underline">News</Link>
                <Link href="/resources" className="text-sm text-primary font-medium hover:underline">Resources</Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto text-center py-10">
          <p className="text-gray-400 mb-6">Type at least 2 characters to search</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Govt Jobs", href: "/sarkari-naukri", icon: "🏛️" },
              { label: "Entrance Exams", href: "/entrance-exam", icon: "📝" },
              { label: "Board Results", href: "/board-exam", icon: "🏫" },
              { label: "News", href: "/blog", icon: "📰" },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex flex-col items-center gap-1 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
