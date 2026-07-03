import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getExamBySlug } from "@/services/examService";
import { getContentPostsByExam, getLatestByContentType } from "@/services/contentPostService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { RelatedKeywordsSection } from "@/components/seo/RelatedKeywords";
import { buildFAQSchema, buildHowToSchema } from "@/lib/seo/structured-data";
import { buildExamMetadata } from "@/lib/seo/metadata";
import {
  buildPageKeywords, buildSEOTitle, buildMetaDescription,
  buildAnchorText, buildLastModifiedSignal, getCurrentYear,
} from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { formatDate, contentTypeLabel } from "@/lib/utils";
import { safeHtml } from "@/lib/sanitize";
import { ContentTypeDataRenderer } from "@/components/exam/ContentTypeDataRenderer";
import type { ContentType } from "@/types/exam";
import { ExternalLink, Download, Clock, Share2 } from "lucide-react";

export const revalidate = 900;

type Props = {
  params: Promise<{ category: string; slug: string; contentType: string }>;
};

function getActionText(ct: string): string {
  const map: Record<string, string> = {
    "admit-card":      "Download Hall Ticket PDF",
    result:            "Check Scorecard & Marks",
    "answer-key":      "Download PDF & Raise Objection",
    syllabus:          "Complete Topic-wise PDF",
    "date-sheet":      "Complete Exam Schedule",
    notification:      "Read Official Notification",
    application:       "Apply Online — Last Date",
    cutoff:            "Category-wise Cutoff Marks",
    "previous-papers": "Download Year-wise PDFs",
    "mock-test":       "Practice Free Mock Tests",
    "study-material":  "Free Notes & PDF",
    books:             "Best Books & Free PDFs",
  };
  return map[ct] ?? "Latest Updates";
}

function getHowToSteps(ct: string, examName: string, officialHost: string) {
  if (ct === "admit-card") return [
    { title: "Visit official website", description: `Go to ${officialHost}` },
    { title: "Click on Admit Card link", description: `Find the ${examName} Admit Card download link on the homepage` },
    { title: "Enter credentials", description: "Enter your Registration Number and Date of Birth / Password" },
    { title: "Download and print", description: "Download the admit card PDF and take 2–3 printouts for exam day" },
  ];
  if (ct === "result") return [
    { title: "Visit the result portal", description: `Go to ${officialHost}` },
    { title: "Click Result link", description: `Find the ${examName} Result 2025 link` },
    { title: "Enter credentials", description: "Enter Roll Number / Registration Number and Date of Birth" },
    { title: "Download result", description: "Check your marks and download the PDF for future reference" },
  ];
  if (ct === "application") return [
    { title: "Visit official website", description: `Go to ${officialHost}` },
    { title: "Click Apply Online", description: `Find the ${examName} Apply Online link` },
    { title: "Register / Login", description: "New users register with mobile number and email. Existing users log in." },
    { title: "Fill application form", description: "Enter personal, educational and other required details" },
    { title: "Upload documents", description: "Upload photo, signature and required certificates as per specifications" },
    { title: "Pay fee and submit", description: "Pay application fee online and submit. Take printout of confirmation." },
  ];
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug, contentType } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return {};
  const year = getCurrentYear();
  const ct = contentType as ContentType;
  return buildExamMetadata({
    pageType: "content-type",
    title: buildSEOTitle(exam.shortName, contentType, year),
    description: buildMetaDescription(exam.name, ct, "", year),
    keywords: buildPageKeywords({ pageType: "content-type", pillar: exam.pillar, examSlug: slug, contentType: ct }),
    canonicalUrl: `${siteConfig.url}/sarkari-naukri/${category}/${slug}/${contentType}`,
    updatedAt: exam.lastUpdated,
  });
}

export default async function SarkariContentTypePage({ params }: Props) {
  const { category, slug, contentType } = await params;
  const [exam, relatedPosts] = await Promise.all([
    getExamBySlug(slug),
    getLatestByContentType(contentType as ContentType, 6),
  ]);

  if (!exam || exam.pillar !== "sarkari-naukri") {
    // Exam doesn't exist — go up to category
    redirect(`/sarkari-naukri/${category}`);
  }

  // Guard: redirect to exam page if the content flag for this content type is not enabled
  const contentFlagMap: Record<string, keyof typeof exam> = {
    notification:      "hasNotification",
    application:       "hasApplication",
    "admit-card":      "hasAdmitCard",
    result:            "hasResult",
    "answer-key":      "hasAnswerKey",
    "date-sheet":      "hasDateSheet",
    syllabus:          "hasSyllabus",
    cutoff:            "hasCutoff",
    "previous-papers": "hasPreviousPapers",
    "mock-test":       "hasMockTest",
    "study-material":  "hasStudyMaterial",
    books:             "hasStudyMaterial",
  };
  const flag = contentFlagMap[contentType];
  if (flag && !exam[flag]) {
    redirect(`/sarkari-naukri/${category}/${slug}`);
  }

  const posts = await getContentPostsByExam(exam.id, contentType as ContentType);
  const post = posts[0];

  const ctLabel = contentTypeLabel(contentType);
  const catLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let officialHost = "";
  try { officialHost = new URL(exam.officialWebsite).hostname; } catch {}

  const howToSteps = getHowToSteps(contentType, exam.shortName, officialHost);

  const shareUrl  = encodeURIComponent(`${siteConfig.url}/sarkari-naukri/${category}/${slug}/${contentType}`);
  const shareText = encodeURIComponent(`${exam.shortName} ${ctLabel} 2025 — ${getActionText(contentType)}`);

  return (
    <>
      {post?.faqs?.length  && <JsonLd data={buildFAQSchema(post.faqs)} />}
      {howToSteps.length   && (
        <JsonLd data={buildHowToSchema(
          `How to ${getActionText(contentType)} — ${exam.name} 2025`,
          howToSteps,
        )} />
      )}

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { name: "Sarkari Naukri",   href: "/sarkari-naukri" },
          { name: catLabel,           href: `/sarkari-naukri/${category}` },
          { name: exam.shortName,     href: `/sarkari-naukri/${category}/${slug}` },
          { name: ctLabel,            href: `/sarkari-naukri/${category}/${slug}/${contentType}` },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-4">
          {/* ── MAIN ── */}
          <main>
            <span className="content-type-badge bg-primary/10 text-primary mb-3 inline-block">
              {ctLabel}
            </span>

            <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2 article-title">
              {buildSEOTitle(exam.shortName, contentType, getCurrentYear())}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500 border-b border-border pb-3">
              <span>By IndianExamInfo Team</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Last Updated: {buildLastModifiedSignal(exam.lastUpdated)}
              </span>
              <span className="text-gray-300">|</span>
              <span>Information as of {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
              <a href={exam.officialWebsite || "#"} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 text-primary hover:underline ml-auto">
                Official Website <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Summary / Quick-answer box */}
            <section className="summary-box mb-5" aria-label="Quick Summary">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-2">Key Highlights</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                {post?.importantDates?.slice(0, 3).map((d) => (
                  <li key={d.label}>
                    <span className="font-medium">{d.label}:</span>{" "}
                    <span className={d.isUrgent ? "text-accent font-semibold" : ""}>
                      {formatDate(d.date)}
                    </span>
                  </li>
                ))}
                {!post?.importantDates?.length && exam.dates.slice(0, 3).map((d) => (
                  <li key={d.label}>
                    <span className="font-medium">{d.label}:</span>{" "}
                    <span className={d.isUrgent ? "text-accent font-semibold" : ""}>{formatDate(d.date)}</span>
                  </li>
                ))}
                <li>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="text-success font-semibold capitalize">{exam.status.replace(/-/g, " ")}</span>
                </li>
                <li>
                  <span className="font-medium">Official Website:</span>{" "}
                  <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                     className="text-primary hover:underline">{officialHost}</a>
                </li>
              </ul>
            </section>

            {/* Primary CTAs */}
            {post?.quickLinks?.length ? (
              <div className="mb-5 flex flex-wrap gap-3">
                {post.quickLinks.filter((l) => l.isOfficial).slice(0, 2).map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
                    {link.isPDF ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    {link.label}
                  </a>
                ))}
              </div>
            ) : (
              <div className="mb-5">
                <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Visit Official Website
                </a>
              </div>
            )}

            {post?.content && (
              <div className="article-body mb-6" {...safeHtml(post.content)} />
            )}

            {/* Structured content-type-specific data */}
            {post?.contentTypeData && (
              <ContentTypeDataRenderer
                contentType={contentType}
                data={post.contentTypeData}
                attachmentUrls={post.attachmentUrls}
              />
            )}

            {/* How-to steps */}
            {howToSteps.length > 0 && (
              <section aria-label="How-to guide" className="mb-6">
                <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">
                  How to {getActionText(contentType)} — Step by Step
                </h2>
                <ol className="space-y-3">
                  {howToSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{step.title}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Important Dates */}
            {(post?.importantDates ?? exam.dates).length > 0 && (
              <section aria-label="Important dates" className="mb-6">
                <h2 className="font-heading font-bold text-lg text-gray-900 mb-3">Important Dates</h2>
                <div className="overflow-x-auto">
                  <table>
                    <caption className="sr-only">Important dates for {exam.name} {ctLabel}</caption>
                    <thead>
                      <tr><th scope="col">Event</th><th scope="col">Date</th></tr>
                    </thead>
                    <tbody>
                      {(post?.importantDates ?? exam.dates).map((d) => (
                        <tr key={d.label}>
                          <td className="font-medium text-gray-800">{d.label}</td>
                          <td className={`font-mono ${d.isUrgent ? "text-accent font-semibold" : "text-gray-700"}`}>
                            {formatDate(d.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Quick Links table */}
            {post?.quickLinks?.length && (
              <section aria-label="Official links" className="mb-6">
                <h2 className="font-heading font-bold text-lg text-gray-900 mb-3">Official Links</h2>
                <div className="overflow-x-auto">
                  <table>
                    <caption className="sr-only">Official links for {exam.name}</caption>
                    <thead>
                      <tr><th scope="col">Link</th><th scope="col">Status</th></tr>
                    </thead>
                    <tbody>
                      {post.quickLinks.map((link) => (
                        <tr key={link.url}>
                          <td>
                            <a href={link.url} target="_blank" rel="noopener noreferrer"
                               className="text-primary hover:underline flex items-center gap-1">
                              {link.label}
                              {link.isPDF && <span className="text-xs text-gray-400">[PDF]</span>}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td><span className="text-xs font-semibold text-success">Active ↗</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* FAQs */}
            {post?.faqs?.length && (
              <section aria-label="Frequently asked questions" className="mb-6">
                <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
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

            {/* Tags */}
            {exam.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {exam.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">#{t}</span>
                ))}
              </div>
            )}

            {/* Related keyword searches */}
            <RelatedKeywordsSection examSlug={slug} />

            {/* Source note */}
            <p className="text-xs text-gray-400 border-t border-border pt-3 mt-4">
              Information sourced from{" "}
              <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {officialHost}
              </a>
              . Last verified: {buildLastModifiedSignal(exam.lastUpdated)}.
            </p>
          </main>

          {/* ── SIDEBAR ── */}
          <aside className="flex flex-col gap-4">
            <AdSlot position="article-sidebar" size="300x250" />

            {/* Share */}
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">Share</h2>
              <div className="flex flex-col gap-2">
                <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm font-medium text-white bg-[#25D366] px-3 py-2 rounded hover:opacity-90 transition-opacity">
                  <Share2 className="w-4 h-4" /> WhatsApp
                </a>
                <a href={`https://t.me/share/url?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 text-sm font-medium text-white bg-[#2CA5E0] px-3 py-2 rounded hover:opacity-90 transition-opacity">
                  <ExternalLink className="w-4 h-4" /> Telegram
                </a>
              </div>
            </div>

            {/* Related same content type */}
            {relatedPosts.filter((p) => p.examEntityId !== exam.id).length > 0 && (
              <div className="bg-card border border-border rounded p-4">
                <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 pb-2 border-b border-border uppercase tracking-wide">
                  More {ctLabel}
                </h2>
                <ul className="space-y-2">
                  {relatedPosts.filter((p) => p.examEntityId !== exam.id).slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/${p.pillar}/${p.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${p.slug}`}
                        className="text-sm text-gray-700 hover:text-primary hover:underline">
                        {p.examEntityName} {ctLabel} 2025
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Other content types for this exam */}
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 pb-2 border-b border-border uppercase tracking-wide">
                More for {exam.shortName}
              </h2>
              <ul className="space-y-1.5 text-sm">
                {(["admit-card","result","syllabus","answer-key","previous-papers","mock-test"] as const)
                  .filter((ct) => ct !== contentType && exam[`has${ct.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("")}` as keyof typeof exam])
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
