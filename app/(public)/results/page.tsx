import type { Metadata } from "next";
import Link from "next/link";
import { getLatestByContentType } from "@/services/contentPostService";
import { getExamsByContentType } from "@/services/examService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { CONTENT_TYPE_KEYWORDS, GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate, pillarLabel } from "@/lib/utils";
import { ClipboardList, Calendar } from "lucide-react";

export const revalidate = 900;

const YEAR = getCurrentYear();

export const metadata: Metadata = buildExamMetadata({
  pageType: "hub",
  title: `Results ${YEAR} — Check Exam Results for All Competitive Exams`,
  description:
    `Check exam result ${YEAR} for UPSC, SSC, IBPS, NEET, JEE, CBSE, UP Board, IGNOU & all exams. ` +
    `Direct result link, cutoff marks, merit list & marksheet download.`,
  keywords: [
    ...CONTENT_TYPE_KEYWORDS["result"].suffixes,
    ...GLOBAL_SHORT_TAIL.slice(0, 8),
    `sarkari result ${YEAR}`, `board result ${YEAR}`, `entrance exam result ${YEAR}`,
  ],
  canonicalUrl: `${siteConfig.url}/results`,
});

export default async function ResultsPage() {
  const [latestPosts, exams] = await Promise.all([
    getLatestByContentType("result", 20),
    getExamsByContentType("result"),
  ]);

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Results", href: "/results" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="content-hub-top" size="728x90" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <main>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Results 2025 — Check Exam Results for All Competitive Exams
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            Last Updated: {new Date().toLocaleDateString("en-IN")} · {exams.length} exams with results
          </p>

          {latestPosts.length > 0 && (
            <section aria-label="Latest results" className="mb-6">
              <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Latest Results</h2>
              <div className="space-y-3">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.pillar}/${post.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`}
                    className="flex items-start justify-between gap-3 p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <ClipboardList className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug">{post.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{pillarLabel(post.pillar)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.updatedAt)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section aria-label="Exams with results">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">All Exam Results 2025</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/${exam.pillar}/${exam.category}/${exam.slug}/result`}
                  className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded hover:border-primary transition-colors group text-sm"
                >
                  <span className="font-medium text-gray-800 group-hover:text-primary">{exam.name}</span>
                  <span className="content-type-badge bg-success/10 text-success text-xs shrink-0">
                    {exam.status === "result-declared" ? "Declared" : "Check"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        <aside>
          <AdSlot position="article-sidebar" size="300x250" />
        </aside>
      </div>
    </div>
  );
}
