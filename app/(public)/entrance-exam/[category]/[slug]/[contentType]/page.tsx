import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamBySlug, getExamArchive } from "@/services/examService";
import { getContentPostsByExam, getLatestByContentType } from "@/services/contentPostService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedKeywordsSection } from "@/components/seo/RelatedKeywords";
import { buildFAQSchema } from "@/lib/seo/structured-data";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildSEOTitle, buildMetaDescription, buildLastModifiedSignal, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate, contentTypeLabel } from "@/lib/utils";
import { safeHtml } from "@/lib/sanitize";
import { ContentTypeDataRenderer } from "@/components/exam/ContentTypeDataRenderer";
import { ContentTypeModules } from "@/components/exam/ContentTypeModules";
import type { ContentType } from "@/types/exam";
import { ExternalLink, Download, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ExamCard } from "@/components/exam/ExamCard";

export const revalidate = 1800;

type Props = { params: Promise<{ category: string; slug: string; contentType: string }> };

/** Check if the contentType param is actually a year (e.g. "2025", "2026") */
function isYearParam(val: string): boolean {
  const num = parseInt(val);
  return !isNaN(num) && num >= 2000 && num <= 2100 && val === String(num);
}

function actionText(ct: string) {
  const m: Record<string, string> = {
    "admit-card": "Download Hall Ticket PDF", result: "Check Scorecard",
    "answer-key": "Download PDF", syllabus: "Complete Topic-wise PDF",
    notification: "Read Official Notification", application: "Apply Online",
    cutoff: "Category-wise Cutoff", "previous-papers": "Year-wise PDFs",
    "mock-test": "Free Practice Tests", "study-material": "Free Notes & PDF",
  };
  return m[ct] ?? "Latest Updates";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug, contentType } = await params;

  // Handle year-based archive pages
  if (isYearParam(contentType)) {
    const year = contentType;
    const exam = await getExamArchive(slug, parseInt(year));
    if (!exam) return { title: "Not Found" };
    return {
      title: `${exam.name} ${year} — Archive | IndianExamInfo`,
      description: `Archived information for ${exam.name} ${year} including dates, results, and cutoff data.`,
      alternates: {
        canonical: `${siteConfig.url}/entrance-exam/${category}/${slug}/${year}`,
      },
    };
  }

  const exam = await getExamBySlug(slug);
  if (!exam) return {};
  const ct = contentType as ContentType;
  const year = getCurrentYear();
  return buildExamMetadata({
    pageType: "content-type",
    title: buildSEOTitle(exam.shortName, contentType, year),
    description: buildMetaDescription(exam.name, ct, "", year),
    keywords: buildPageKeywords({ pageType: "content-type", pillar: exam.pillar, examSlug: slug, contentType: ct }),
    canonicalUrl: `${siteConfig.url}/entrance-exam/${category}/${slug}/${contentType}`,
    updatedAt: exam.lastUpdated,
  });
}

export default async function EntranceContentTypePage({ params }: Props) {
  const { category, slug, contentType } = await params;

  // Handle year-based archive pages
  if (isYearParam(contentType)) {
    const yearNum = parseInt(contentType);
    const exam = await getExamArchive(slug, yearNum);
    if (!exam) return notFound();

    const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { name: "Entrance Exam", href: "/entrance-exam" },
            { name: label, href: `/entrance-exam/${category}` },
            { name: exam.shortName || exam.name, href: `/entrance-exam/${category}/${slug}` },
            { name: contentType, href: `/entrance-exam/${category}/${slug}/${contentType}` },
          ]}
        />
        <div className="mt-4 mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            📋 You&apos;re viewing <strong>{exam.name} {contentType}</strong> (archived edition).
          </p>
          <Link
            href={`/entrance-exam/${category}/${slug}`}
            className="text-sm font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1"
          >
            See latest <ArrowRight size={14} />
          </Link>
        </div>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-5">
          {exam.name} {contentType} — Archive
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <main>
            <ExamCard exam={exam} />
          </main>
          <aside className="text-sm text-slate-500">
            <p>This is an archived edition. For the most current information, visit the main exam page.</p>
          </aside>
        </div>
      </div>
    );
  }

  // Normal content type page
  const [exam, relatedPosts] = await Promise.all([
    getExamBySlug(slug),
    getLatestByContentType(contentType as ContentType, 5),
  ]);

  if (!exam || exam.pillar !== "entrance-exam") notFound();

  const posts = await getContentPostsByExam(exam.id, contentType as ContentType);
  const post  = posts[0];
  const ctLabel = contentTypeLabel(contentType);
  const catLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let officialHost = "";
  try { officialHost = new URL(exam.officialWebsite).hostname; } catch {}

  return (
    <>
      {post?.faqs?.length && <JsonLd data={buildFAQSchema(post.faqs)} />}

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { name: "Entrance Exam", href: "/entrance-exam" },
          { name: catLabel,        href: `/entrance-exam/${category}` },
          { name: exam.shortName,  href: `/entrance-exam/${category}/${slug}` },
          { name: ctLabel,         href: `/entrance-exam/${category}/${slug}/${contentType}` },
        ]} />

        {/* Persistent content module navigation — always visible */}
        <nav className="flex flex-wrap gap-2 mt-3 mb-4 pb-3 border-b border-border" aria-label="Available content modules">
          <Link href={`/entrance-exam/${category}/${slug}`}
            className="text-xs font-semibold px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
            Overview
          </Link>
          {(["notification","application","admit-card","answer-key","syllabus","result","cutoff"] as ContentType[])
            .filter((ct) => {
              const map: Record<string, keyof typeof exam> = { notification: "hasNotification", application: "hasApplication", "admit-card": "hasAdmitCard", "answer-key": "hasAnswerKey", syllabus: "hasSyllabus", result: "hasResult", cutoff: "hasCutoff" };
              return !!(exam as any)[map[ct]];
            })
            .map((ct) => (
              <Link key={ct} href={`/entrance-exam/${category}/${slug}/${ct}`}
                className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors ${
                  ct === contentType
                    ? "bg-primary text-white border-primary"
                    : "border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white"
                }`}>
                {contentTypeLabel(ct)}
              </Link>
            ))
          }
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
              <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 text-primary hover:underline ml-auto">
                Official Website <ExternalLink className="w-3 h-3" />
              </a>
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
                <li><span className="font-medium">Official Site:</span>{" "}
                  <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{officialHost}</a>
                </li>
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
                <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Visit Official Website
                </a>
              )}
            </div>

            {post?.content && <div className="article-body mb-6" {...safeHtml(post.content)} />}

            {/* CMS Structured Module Content for this tab */}
            <ContentTypeModules contentModules={exam.contentModules} contentType={contentType} />
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
              Information sourced from <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{officialHost}</a>.{" "}
              Last verified: {buildLastModifiedSignal(exam.lastUpdated)}.
            </p>

            {/* Related keyword searches */}
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
                {(["admit-card","result","syllabus","answer-key","previous-papers"] as ContentType[])
                  .filter((ct) => ct !== contentType)
                  .map((ct) => (
                    <li key={ct}>
                      <Link href={`/entrance-exam/${category}/${slug}/${ct}`}
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
