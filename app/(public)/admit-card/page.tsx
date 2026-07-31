import type { Metadata } from "next";
import Link from "next/link";
import { getLatestByContentType } from "@/services/contentPostService";
import { getExamsByContentType } from "@/services/examService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { CONTENT_TYPE_KEYWORDS, GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate, pillarLabel, getExamContentTypeHref } from "@/lib/utils";
import { Download, Calendar } from "lucide-react";

export const revalidate = 1800;

const YEAR = getCurrentYear();

export const metadata: Metadata = buildExamMetadata({
  pageType: "hub",
  title: `Admit Card ${YEAR} — Download Hall Ticket for All Exams`,
  description:
    `Download admit card ${YEAR} for UPSC, SSC, IBPS, SBI, RRB, NEET, JEE, CBSE & all exams. ` +
    `Direct official link, hall ticket release dates, steps to download.`,
  keywords: [
    ...CONTENT_TYPE_KEYWORDS["admit-card"].suffixes,
    ...CONTENT_TYPE_KEYWORDS["admit-card"].longTailTemplates
      .slice(0, 5)
      .map((t) => t.replace("{exam}", "").trim()),
    ...GLOBAL_SHORT_TAIL.slice(0, 8),
  ],
  canonicalUrl: `${siteConfig.url}/admit-card`,
});

export default async function AdmitCardPage() {
  const [latestPosts, exams] = await Promise.all([
    getLatestByContentType("admit-card", 20),
    getExamsByContentType("admit-card"),
  ]);

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Admit Card", href: "/admit-card" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="content-hub-top" size="728x90" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <main>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Admit Card {new Date().getFullYear()} — Download Hall Ticket for All Exams
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            Last Updated: {new Date().toLocaleDateString("en-IN")} ·{" "}
            {exams.length} exams with admit cards
          </p>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-5 pb-4 border-b border-border">
            <span className="text-xs font-medium text-gray-500 self-center">Filter by:</span>
            {["All", "Sarkari Naukri", "Entrance Exam", "Board Exam"].map((f) => (
              <button
                key={f}
                className="text-xs font-semibold px-3 py-1.5 rounded border border-border text-gray-600 hover:bg-primary hover:text-white hover:border-primary transition-colors"
              >
                {f}
              </button>
            ))}
          </div>

          {/* Latest admit card posts */}
          {latestPosts.length > 0 && (
            <section aria-label="Latest admit cards" className="mb-6">
              <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Latest Admit Cards</h2>
              <div className="space-y-3">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.pillar}/${post.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`}
                    className="flex items-start justify-between gap-3 p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Download className="w-4 h-4 text-accent mt-0.5 shrink-0" />
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

          {/* All exams with admit card */}
          <section aria-label="Exams with admit cards">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
              All Exams — Admit Card Available
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exams.slice(0, 20).map((exam) => (
                <Link
                  key={exam.id}
                  href={getExamContentTypeHref(exam, "admit-card")}
                  className="flex items-center justify-between gap-2 p-3 bg-card border border-border rounded hover:border-primary transition-colors group text-sm"
                >
                  <span className="font-medium text-gray-800 group-hover:text-primary">{exam.name}</span>
                  <span className="content-type-badge bg-accent/10 text-accent text-xs shrink-0">Download</span>
                </Link>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <AdSlot position="article-sidebar" size="300x250" />

          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide pb-2 border-b border-border">
              Other Content Types
            </h2>
            <ul className="space-y-1.5 text-sm">
              {[
                { label: "Results", href: "/results" },
                { label: "Answer Key", href: "/answer-key" },
                { label: "Syllabus", href: "/syllabus" },
                { label: "Date Sheet", href: "/date-sheet" },
                { label: "Mock Test", href: "/mock-test" },
                { label: "Previous Papers", href: "/previous-papers" },
                { label: "Study Material", href: "/study-material" },
              ].map((q: { label: string; href: string }) => (
                <li key={q.href}>
                  <Link href={q.href} className="text-gray-700 hover:text-primary hover:underline">{q.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
