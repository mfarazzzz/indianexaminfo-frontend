// University Board Exam — Content Type Page (v2)
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getExamBySlug } from "@/services/examService";
import { getContentPostsByExam, getLatestByContentType } from "@/services/contentPostService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedKeywordsSection } from "@/components/seo/RelatedKeywords";
import { buildFAQSchema } from "@/lib/seo/structured-data";
import { ContentTypeModules } from "@/components/exam/ContentTypeModules";
import { buildExamMetadata } from "@/lib/seo/metadata";
import {
  buildPageKeywords, buildSEOTitle, buildMetaDescription,
  buildLastModifiedSignal, getCurrentYear,
} from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate, contentTypeLabel } from "@/lib/utils";
import { safeHtml } from "@/lib/sanitize";
import type { ContentType } from "@/types/exam";
import { ExternalLink, Download, Clock } from "lucide-react";

export const revalidate = 900;

type Props = { params: Promise<{ slug: string; contentType: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, contentType } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return {};
  const ct = contentType as ContentType;
  const year = getCurrentYear();
  return buildExamMetadata({
    pageType: "content-type",
    title: buildSEOTitle(exam.shortName, contentType, year),
    description: buildMetaDescription(exam.name, ct, "", year),
    keywords: buildPageKeywords({ pageType: "content-type", pillar: "board-exam", examSlug: slug, contentType: ct }),
    canonicalUrl: `${siteConfig.url}/board-exam/university/${slug}/${contentType}`,
    updatedAt: exam.lastUpdated,
  });
}

export default async function UniversityContentTypePage({ params }: Props) {
  const { slug, contentType } = await params;
  const [exam, relatedPosts] = await Promise.all([
    getExamBySlug(slug),
    getLatestByContentType(contentType as ContentType, 5),
  ]);
  if (!exam || exam.entityType !== "university") notFound();

  const posts  = await getContentPostsByExam(exam.id, contentType as ContentType);
  const post   = posts[0];
  const ctLabel = contentTypeLabel(contentType);
  let officialHost = "";
  try { officialHost = new URL(exam.officialWebsite).hostname; } catch {}

  return (
    <>
      {post?.faqs?.length && <JsonLd data={buildFAQSchema(post.faqs)} />}

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { name: "Board Exam",    href: "/board-exam" },
          { name: "Universities",  href: "/board-exam" },
          { name: exam.shortName,  href: `/board-exam/university/${slug}` },
          { name: ctLabel,         href: `/board-exam/university/${slug}/${contentType}` },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-4">
          <main>
            <span className="content-type-badge bg-primary/10 text-primary mb-3 inline-block">{ctLabel}</span>

            <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2 article-title">
              {buildSEOTitle(exam.shortName, contentType, getCurrentYear())}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500 border-b border-border pb-3">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Updated: {buildLastModifiedSignal(exam.lastUpdated)}</span>
              <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 text-primary hover:underline ml-auto">
                Official Website <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <section className="summary-box mb-5" aria-label="Quick Summary">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-2">Key Highlights</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                {exam.dates.slice(0, 4).map((d) => (
                  <li key={d.label}>
                    <span className="font-medium">{d.label}:</span>{" "}
                    <span className={d.isUrgent ? "text-accent font-semibold" : ""}>{formatDate(d.date)}</span>
                  </li>
                ))}
                <li>
                  <span className="font-medium">Official Site:</span>{" "}
                  <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{officialHost}</a>
                </li>
              </ul>
            </section>

            <div className="mb-5 flex flex-wrap gap-3">
              {post?.quickLinks?.filter((l) => l.isOfficial).slice(0, 2).map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
                  {link.isPDF ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {link.label}
                </a>
              )) ?? (
                <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Visit Official Website
                </a>
              )}
            </div>

            {post?.content && <div className="article-body mb-6" {...safeHtml(post.content)} />}

            {/* CMS Structured Module Content for this tab */}
            <ContentTypeModules contentModules={exam.contentModules} contentType={contentType} />
              <h2 className="font-heading font-bold text-lg text-gray-900 mb-3">Important Dates</h2>
              <div className="overflow-x-auto">
                <table>
                  <caption className="sr-only">Dates for {exam.name}</caption>
                  <thead><tr><th scope="col">Event</th><th scope="col">Date</th></tr></thead>
                  <tbody>
                    {(post?.importantDates ?? exam.dates).map((d) => (
                      <tr key={d.label}>
                        <td>{d.label}</td>
                        <td className={`font-mono ${d.isUrgent ? "text-accent font-semibold" : "text-gray-700"}`}>{formatDate(d.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {post?.faqs?.length && (
              <section aria-label="FAQ" className="mb-6">
                <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-3">
                  {post.faqs.map((faq, i) => (
                    <div key={i} className="border border-border rounded p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">{faq.question}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="text-xs text-gray-400 border-t border-border pt-3">
              Information sourced from{" "}
              <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{officialHost}</a>.
              Last verified: {buildLastModifiedSignal(exam.lastUpdated)}.
            </p>

            {/* Related keyword searches */}
            <RelatedKeywordsSection examSlug={slug} />
          </main>

          <aside className="flex flex-col gap-4">
            <AdSlot position="article-sidebar" size="300x250" />
            {relatedPosts.filter((p) => p.examEntityId !== exam.id).length > 0 && (
              <div className="bg-card border border-border rounded p-4">
                <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 pb-2 border-b border-border uppercase tracking-wide">More {ctLabel}</h2>
                <ul className="space-y-2 text-sm">
                  {relatedPosts.filter((p) => p.examEntityId !== exam.id).slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link href={`/board-exam/university/${p.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${p.slug}`}
                            className="text-gray-700 hover:text-primary hover:underline">
                        {p.examEntityName} {ctLabel} {new Date().getFullYear()}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 pb-2 border-b border-border uppercase tracking-wide">
                More for {exam.shortName}
              </h2>
              <ul className="space-y-1.5 text-sm">
                {(["result","date-sheet","admit-card","syllabus","previous-papers"] as ContentType[])
                  .filter((ct) => ct !== contentType)
                  .map((ct) => (
                    <li key={ct}>
                      <Link href={`/board-exam/university/${slug}/${ct}`}
                            className="text-gray-700 hover:text-primary hover:underline">
                        {exam.shortName} {contentTypeLabel(ct)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
            <AdSlot position="article-sidebar-2" size="300x250" />
          </aside>
        </div>
      </div>
    </>
  );
}
