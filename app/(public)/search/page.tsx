import type { Metadata } from "next";
import Link from "next/link";
import { searchExams } from "@/services/examService";
import { searchBlogPosts } from "@/services/blogService";
import { searchContentPosts } from "@/services/contentPostService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { formatDate, pillarLabel, statusColor, contentTypeLabel } from "@/lib/utils";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { Search } from "lucide-react";

// Search pages are never cached and never indexed
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Search — IndianExamInfo",
  description: "Search exams, jobs, results, admit cards and universities on IndianExamInfo.",
  keywords: ["search exams", "search sarkari naukri", "find exam result", ...GLOBAL_SHORT_TAIL.slice(0, 4)],
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ q?: string; pillar?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", pillar } = await searchParams;
  const query = q.trim();

  const [exams, blogPosts, contentPosts] = query.length > 1
    ? await Promise.all([
        searchExams(query),
        searchBlogPosts(query),
        searchContentPosts(query),
      ])
    : [[], [], []];

  const totalResults = exams.length + blogPosts.length + contentPosts.length;

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Search", href: "/search" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      {/* Search form */}
      <div className="max-w-2xl mx-auto mb-8">
        <form action="/search" method="get">
          <div className="flex items-center gap-2 border-2 border-primary rounded px-4 py-3 bg-white focus-within:ring-2 ring-primary/20">
            <Search className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search exams, results, admit cards, blog..."
              className="flex-1 text-base outline-none text-gray-900"
              aria-label="Search query"
              autoFocus
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-1.5 rounded text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {query.length > 1 ? (
        <>
          <p className="text-sm text-gray-500 mb-5">
            {totalResults} results for <strong>&quot;{query}&quot;</strong>
          </p>

          {/* Exam Entities */}
          {exams.length > 0 && (
            <section aria-label="Exam results" className="mb-8">
              <h2 className="font-heading font-bold text-lg text-gray-900 mb-3 pb-2 border-b border-border">
                Exams ({exams.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exams.map((exam) => (
                  <Link
                    key={exam.id}
                    href={`/${exam.pillar}/${exam.category}/${exam.slug}`}
                    className="flex items-start justify-between gap-3 p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug">{exam.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pillarLabel(exam.pillar)} · {exam.conductingBody}</p>
                    </div>
                    <span className={`status-badge shrink-0 text-xs ${statusColor(exam.status)}`}>
                      {exam.status.replace(/-/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Content Posts */}
          {contentPosts.length > 0 && (
            <section aria-label="Content results" className="mb-8">
              <h2 className="font-heading font-bold text-lg text-gray-900 mb-3 pb-2 border-b border-border">
                Exam Updates ({contentPosts.length})
              </h2>
              <div className="space-y-2">
                {contentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.pillar}/${post.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`}
                    className="flex items-start gap-3 p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
                  >
                    <span className="content-type-badge bg-primary/10 text-primary text-xs shrink-0 mt-0.5">
                      {contentTypeLabel(post.contentType)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{post.examEntityName} · {formatDate(post.updatedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Blog Posts */}
          {blogPosts.length > 0 && (
            <section aria-label="Blog results" className="mb-8">
              <h2 className="font-heading font-bold text-lg text-gray-900 mb-3 pb-2 border-b border-border">
                Blog Articles ({blogPosts.length})
              </h2>
              <div className="space-y-2">
                {blogPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.section}/${post.slug}`}
                    className="flex items-start gap-3 p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
                  >
                    <span className="content-type-badge bg-editorial/10 text-editorial text-xs shrink-0 mt-0.5 capitalize">
                      {post.postType}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{post.author.name} · {formatDate(post.publishedAt)}</p>
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
                <Link href="/sarkari-naukri" className="text-sm text-primary font-medium hover:underline">Sarkari Naukri</Link>
                <Link href="/entrance-exam" className="text-sm text-primary font-medium hover:underline">Entrance Exam</Link>
                <Link href="/board-exam" className="text-sm text-primary font-medium hover:underline">Board Exam</Link>
                <Link href="/blog" className="text-sm text-primary font-medium hover:underline">Blog</Link>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 text-gray-400">
          <p>Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
}
