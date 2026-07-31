import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentPostsByExam, getLatestByContentType } from "@/services/contentPostService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedKeywordsSection } from "@/components/seo/RelatedKeywords";
import { buildFAQSchema } from "@/lib/seo/structured-data";
import { buildSEOTitle, buildLastModifiedSignal, getCurrentYear } from "@/lib/seo/keywords";
import { formatDate, contentTypeLabel } from "@/lib/utils";
import { safeHtml } from "@/lib/sanitize";
import { ContentTypeDataRenderer } from "@/components/exam/ContentTypeDataRenderer";
import type { ExamEntity, ContentType } from "@/types/exam";
import { ExternalLink, Download, Clock } from "lucide-react";

const CONTENT_TYPE_ORDER: ContentType[] = [
  "notification", "application", "admit-card", "result",
  "answer-key", "syllabus", "cutoff", "date-sheet",
  "previous-papers", "mock-test", "study-material",
];

function hasContentType(exam: ExamEntity, ct: ContentType): boolean {
  const map: Record<ContentType, keyof ExamEntity> = {
    notification: "hasNotification",
    application: "hasApplication",
    "admit-card": "hasAdmitCard",
    "date-sheet": "hasDateSheet",
    syllabus: "hasSyllabus",
    "answer-key": "hasAnswerKey",
    result: "hasResult",
    cutoff: "hasCutoff",
    "previous-papers": "hasPreviousPapers",
    "mock-test": "hasMockTest",
    "study-material": "hasStudyMaterial",
    books: "hasStudyMaterial",
  };
  return !!exam[map[ct]];
}

type Props = {
  exam: ExamEntity;
  category: string;
  slug: string;
  contentType: string;
};

export async function SarkariNaukriContentTypeView({ exam, category, slug, contentType }: Props) {
  const [posts, relatedPosts] = await Promise.all([
    getContentPostsByExam(exam.id, contentType as ContentType),
    getLatestByContentType(contentType as ContentType, 5),
  ]);

  const post = posts[0];
  const ctLabel = contentTypeLabel(contentType);
  const catLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let officialHost = "";
  try { officialHost = new URL(exam.officialWebsite).hostname; } catch {}

  return (
    <>
      {post?.faqs?.length && <JsonLd data={buildFAQSchema(post.faqs)} />}

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { name: "Sarkari Naukri", href: "/sarkari-naukri" },
          { name: catLabel, href: `/sarkari-naukri/${category}` },
          { name: exam.shortName, href: `/sarkari-naukri/${category}/${slug}` },
          { name: ctLabel, href: `/sarkari-naukri/${category}/${slug}/${contentType}` },
        ]} />

        {/* Module Tabs — same as EntityDetailPage */}
        <nav className="flex flex-wrap gap-2 my-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-1 px-1" aria-label="Content modules">
          {CONTENT_TYPE_ORDER.filter((ct) => hasContentType(exam, ct)).map((ct) => (
            <Link
              key={ct}
              href={`/sarkari-naukri/${category}/${slug}/${ct}`}
              className={`text-sm font-semibold px-3.5 py-2 min-h-[44px] flex items-center rounded border transition-colors whitespace-nowrap ${
                ct === contentType
                  ? "bg-primary text-white border-primary"
                  : "bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white"
              }`}
              prefetch={false}
            >
              {contentTypeLabel(ct)}
            </Link>
          ))}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-4">
          <main>
            <span className="content-type-badge bg-primary/10 text-primary mb-3 inline-block">{ctLabel}</span>

            <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2 article-title">
              {buildSEOTitle(exam.shortName, contentType, getCurrentYear())}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500 border-b border-border pb-3">
              <span>By IndianExamInfo Team</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Updated: {buildLastModifiedSignal(exam.lastUpdated)}</span>
              {exam.officialWebsite && (
                <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1 text-primary hover:underline ml-auto">
                  Official Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Summary box */}
            <section className="summary-box mb-5" aria-label="Quick Summary">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-2">Key Highlights</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                {exam.dates.slice(0, 4).map((d) => (
                  <li key={d.label}>
                    <span className="font-medium">{d.label}:</span>{" "}
                    <span className={d.isUrgent ? "text-accent font-semibold" : ""}>{formatDate(d.date)}</span>
                  </li>
                ))}
                {exam.officialWebsite && (
                  <li><span className="font-medium">Official Site:</span>{" "}
                    <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{officialHost}</a>
                  </li>
                )}
              </ul>
            </section>

            {/* CTA */}
            <div className="mb-5 flex flex-wrap gap-3">
              {post?.quickLinks?.filter((l) => l.isOfficial).slice(0, 2).map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
                  {link.isPDF ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  {link.label}
                </a>
              )) ?? (
                exam.officialWebsite && (
                  <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Visit Official Website
                  </a>
                )
              )}
            </div>

            {post?.content && <div className="article-body mb-6" {...safeHtml(post.content)} />}

            {/* Structured content-type-specific data */}
            {post?.contentTypeData && (
              <ContentTypeDataRenderer
                contentType={contentType}
                data={post.contentTypeData}
                attachmentUrls={post.attachmentUrls}
              />
            )}

            {/* Dates table */}
            <section aria-label="Important dates" className="mb-6">
              <h2 className="font-heading font-bold text-lg text-gray-900 mb-3">Important Dates</h2>
              <div className="overflow-x-auto">
                <table>
                  <caption className="sr-only">Dates for {exam.name} {ctLabel}</caption>
                  <thead><tr><th scope="col">Event</th><th scope="col">Date</th></tr></thead>
                  <tbody>
                    {(post?.importantDates ?? exam.dates).map((d) => (
                      <tr key={d.label}>
                        <td>{d.label}</td>
                        <td className={`font-mono ${d.isUrgent ? "text-accent font-semibold" : "text-gray-700"}`}>
                          {formatDate(d.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* FAQs */}
            {post?.faqs?.length ? (
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
            ) : null}

            {officialHost && (
              <p className="text-xs text-gray-400 border-t border-border pt-3">
                Information sourced from <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{officialHost}</a>.{" "}
                Last verified: {buildLastModifiedSignal(exam.lastUpdated)}.
              </p>
            )}

            <RelatedKeywordsSection examSlug={slug} />
          </main>

          <aside className="flex flex-col gap-4">
            <AdSlot position="article-sidebar" size="300x250" />
            {relatedPosts.filter((p) => p.examEntityId !== exam.id).length > 0 && (
              <div className="bg-card border border-border rounded p-4">
                <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 pb-2 border-b border-border uppercase tracking-wide">
                  More {ctLabel}
                </h2>
                <ul className="space-y-2 text-sm">
                  {relatedPosts.filter((p) => p.examEntityId !== exam.id).slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link href={`/${p.pillar}/${p.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${p.slug}`}
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
                {(["admit-card", "result", "syllabus", "answer-key", "previous-papers"] as ContentType[])
                  .filter((ct) => ct !== contentType)
                  .map((ct) => (
                    <li key={ct}>
                      <Link href={`/sarkari-naukri/${category}/${slug}/${ct}`}
                            className="text-gray-700 hover:text-primary hover:underline">
                        {exam.shortName} {contentTypeLabel(ct)}
                      </Link>
                    </li>
                  ))
                }
              </ul>
            </div>
            <AdSlot position="article-sidebar-2" size="300x250" />
          </aside>
        </div>
      </div>
    </>
  );
}
