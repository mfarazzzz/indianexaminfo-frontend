import Link from "next/link";
import { notFound } from "next/navigation";
import type { ExamEntity, ContentType } from "@/types/exam";
import { getContentPostsByExam } from "@/services/contentPostService";
import { getRelatedExams } from "@/services/examService";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { ExamCard } from "@/components/exam/ExamCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildFAQSchema,
  buildJobPostingSchema,
  buildEventSchema,
  buildDatasetSchema,
} from "@/lib/seo/structured-data";
import {
  formatDate,
  statusColor,
  contentTypeLabel,
  pillarLabel,
} from "@/lib/utils";
import { ExternalLink, Calendar, Share2 } from "lucide-react";

type EntityDetailPageProps = {
  exam: ExamEntity;
  breadcrumbs: BreadcrumbItem[];
};

const contentTypeOrder: ContentType[] = [
  "notification",
  "application",
  "admit-card",
  "result",
  "answer-key",
  "date-sheet",
  "syllabus",
  "cutoff",
  "previous-papers",
  "mock-test",
  "study-material",
  "books",
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

function getContentTypeHref(exam: ExamEntity, ct: ContentType): string {
  if (exam.pillar === "board-university") {
    if (exam.entityType === "university") {
      return `/board-exam/university/${exam.slug}/${ct}`;
    }
    return `/board-exam/state/${exam.category}/${exam.slug}/${ct}`;
  }
  return `/${exam.pillar}/${exam.category}/${exam.slug}/${ct}`;
}

export async function EntityDetailPage({ exam, breadcrumbs }: EntityDetailPageProps) {
  const [contentPosts, relatedExams] = await Promise.all([
    getContentPostsByExam(exam.id),
    getRelatedExams(exam.id),
  ]);

  const availableContentTypes = contentTypeOrder.filter((ct) =>
    hasContentType(exam, ct)
  );

  const schemas: Record<string, unknown>[] = [];
  if (exam.faqs?.length) schemas.push(buildFAQSchema(exam.faqs));
  if (exam.pillar === "sarkari-naukri") schemas.push(buildJobPostingSchema(exam));
  const eventSchema = buildEventSchema(exam);
  if (eventSchema) schemas.push(eventSchema);
  if (exam.dates.length) schemas.push(buildDatasetSchema(exam, exam.dates));

  return (
    <>
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={breadcrumbs} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-4">
          {/* Main */}
          <main>
            {/* Status + Last Updated */}
            <div className="flex items-center gap-3 mb-2 text-sm">
              <span className={`status-badge ${statusColor(exam.status)}`}>
                {exam.status.replace(/-/g, " ")}
              </span>
              <span className="text-gray-400 text-xs">
                Last Updated: {formatDate(exam.lastUpdated)}
              </span>
            </div>

            {/* H1 */}
            <h1 className="font-heading font-bold text-2xl text-gray-900 mb-3 article-title">
              {exam.name} {new Date().getFullYear()} — Notification, Eligibility &amp; Apply
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border text-sm">
              <span className="text-gray-600">
                <span className="font-medium">Conducted by:</span> {exam.conductingBody}
              </span>
              {exam.officialWebsite && (
              <a
                href={exam.officialWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline text-xs font-medium"
                aria-label={`Official website for ${exam.name}`}
              >
                Official Website <ExternalLink className="w-3.5 h-3.5" />
              </a>
              )}
              <button
                className="flex items-center gap-1 text-gray-500 hover:text-primary text-xs transition-colors ml-auto"
                aria-label="Share this page"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>

            {/* Summary Box */}
            <section className="summary-box mb-5" aria-label="Quick Summary">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-2">Key Highlights</h2>
              <ul className="space-y-1.5 text-sm text-gray-700">
                {exam.vacancy && (
                  <li>
                    <span className="font-medium">Total Vacancies:</span>{" "}
                    {exam.vacancy.toLocaleString("en-IN")}
                  </li>
                )}
                {exam.eligibility && (
                  <li>
                    <span className="font-medium">Eligibility:</span>{" "}
                    {exam.eligibility.qualification}
                  </li>
                )}
                {exam.applicationFee && (
                  <li>
                    <span className="font-medium">Application Fee:</span>{" "}
                    ₹{exam.applicationFee.general} (General)
                    {exam.applicationFee.obc > 0 && ` | ₹${exam.applicationFee.obc} (OBC)`}
                    {exam.applicationFee.ews != null && exam.applicationFee.ews > 0 && ` | ₹${exam.applicationFee.ews} (EWS)`}
                    {` | ₹${exam.applicationFee.sc} (SC/ST)`}
                  </li>
                )}
                {(() => {
                  // Show most relevant dates: urgent future dates first, then most recent past milestone
                  const now = new Date();
                  const futureDates = exam.dates.filter(d => new Date(d.date) > now);
                  const pastDates = exam.dates.filter(d => new Date(d.date) <= now);
                  const urgentFuture = futureDates.filter(d => d.isUrgent);
                  const relevantDates = [
                    ...urgentFuture,
                    ...(pastDates.length > 0 ? [pastDates[pastDates.length - 1]] : []),
                    ...futureDates.filter(d => !d.isUrgent),
                  ].slice(0, 2);
                  return relevantDates.map((d) => (
                    <li key={d.label}>
                      <span className="font-medium">{d.label}:</span>{" "}
                      <span className={d.isUrgent ? "text-accent font-semibold" : ""}>
                        {formatDate(d.date)}
                      </span>
                    </li>
                  ));
                })()}
                {exam.officialWebsite && (
                  <li>
                    <span className="font-medium">Official Website:</span>{" "}
                    <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {(() => { try { return new URL(exam.officialWebsite).hostname; } catch { return exam.officialWebsite; } })()}
                    </a>
                  </li>
                )}
              </ul>
            </section>

            {/* Content Type Navigation */}
            {availableContentTypes.length > 0 && (
              <section aria-label="Content types" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Available Content
                </h2>
                <div className="flex flex-wrap gap-2">
                  {availableContentTypes.map((ct) => (
                    <Link
                      key={ct}
                      href={getContentTypeHref(exam, ct)}
                      className="text-sm font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary hover:text-white transition-colors"
                      prefetch={false}
                    >
                      {contentTypeLabel(ct)}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Important Dates Table */}
            {exam.dates.length > 0 && (
              <section aria-label="Important dates" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Important Dates
                </h2>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="min-w-[420px]">
                    <caption className="sr-only">Important dates for {exam.name}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Event</th>
                        <th scope="col">Date</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.dates.map((d) => (
                        <tr key={d.label}>
                          <td className="font-medium text-gray-800">{d.label}</td>
                          <td
                            className={`font-mono ${d.isUrgent ? "text-accent font-semibold" : "text-gray-700"}`}
                          >
                            {formatDate(d.date)}
                          </td>
                          <td>
                            {new Date(d.date) < new Date() ? (
                              <span className="text-xs text-gray-400">Passed</span>
                            ) : d.isUrgent ? (
                              <span className="text-xs text-accent font-semibold">Urgent</span>
                            ) : (
                              <span className="text-xs text-success">Upcoming</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Eligibility */}
            {exam.eligibility && (
              <section aria-label="Eligibility criteria" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Eligibility Criteria
                </h2>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="min-w-[320px]">
                    <caption className="sr-only">Eligibility for {exam.name}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Criteria</th>
                        <th scope="col">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Age Limit</td>
                        <td>{exam.eligibility.age}</td>
                      </tr>
                      <tr>
                        <td>Educational Qualification</td>
                        <td>{exam.eligibility.qualification}</td>
                      </tr>
                      <tr>
                        <td>Nationality</td>
                        <td>{exam.eligibility.nationality}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Selection Process */}
            {exam.selectionProcess && exam.selectionProcess.length > 0 && (
              <section aria-label="Selection process" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Selection Process
                </h2>
                <ol className="space-y-2">
                  {exam.selectionProcess.map((step, i) => (
                    <li key={step} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Application Fee */}
            {exam.applicationFee && (
              <section aria-label="Application fee" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Application Fee
                </h2>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="min-w-[280px]">
                    <caption className="sr-only">Application fee for {exam.name}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Category</th>
                        <th scope="col">Fee Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.applicationFee.general != null && (
                        <tr><td>General</td><td>₹{exam.applicationFee.general}</td></tr>
                      )}
                      {exam.applicationFee.obc != null && exam.applicationFee.obc > 0 && (
                        <tr><td>OBC-NCL</td><td>₹{exam.applicationFee.obc}</td></tr>
                      )}
                      {exam.applicationFee.ews != null && exam.applicationFee.ews > 0 && (
                        <tr><td>EWS</td><td>₹{exam.applicationFee.ews}</td></tr>
                      )}
                      {exam.applicationFee.sc != null && (
                        <tr><td>SC</td><td>₹{exam.applicationFee.sc}</td></tr>
                      )}
                      {exam.applicationFee.st != null && exam.applicationFee.st !== exam.applicationFee.sc && (
                        <tr><td>ST</td><td>₹{exam.applicationFee.st}</td></tr>
                      )}
                      {exam.applicationFee.st != null && exam.applicationFee.st === exam.applicationFee.sc && (
                        <tr><td>SC / ST</td><td>₹{exam.applicationFee.sc}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Syllabus Highlights */}
            {exam.syllabusHighlights && exam.syllabusHighlights.length > 0 && (
              <section aria-label="Syllabus highlights" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Syllabus Highlights
                </h2>
                <ul className="grid grid-cols-2 gap-1.5">
                  {exam.syllabusHighlights.map((subject) => (
                    <li key={subject} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {subject}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Academic Info (Board/University exams) */}
            {(exam.academicYear || exam.semester || exam.admissionTo) && (
              <section aria-label="Academic information" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Academic Information
                </h2>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="min-w-[280px]">
                    <caption className="sr-only">Academic details for {exam.name}</caption>
                    <thead><tr><th scope="col">Detail</th><th scope="col">Value</th></tr></thead>
                    <tbody>
                      {exam.academicYear && <tr><td className="font-medium text-gray-800">Academic Year</td><td className="text-gray-700">{exam.academicYear}</td></tr>}
                      {exam.semester && <tr><td className="font-medium text-gray-800">Semester</td><td className="text-gray-700">{exam.semester}</td></tr>}
                      {exam.admissionTo && <tr><td className="font-medium text-gray-800">Admission To</td><td className="text-gray-700">{exam.admissionTo}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Content Posts */}
            {contentPosts.length > 0 && (
              <section aria-label="Related content" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Latest Updates
                </h2>
                <div className="space-y-3">
                  {contentPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/${post.pillar}/${post.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${post.slug}`}
                      className="flex items-start gap-3 p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
                    >
                      <span className="content-type-badge bg-primary/10 text-primary mt-0.5 shrink-0">
                        {contentTypeLabel(post.contentType)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary leading-snug">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(post.updatedAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {exam.faqs && exam.faqs.length > 0 && (
              <section aria-label="Frequently asked questions" className="mb-5">
                <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {exam.faqs.map((faq, i) => (
                    <div key={i} className="border border-border rounded p-4">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">{faq.question}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related Exams */}
            {relatedExams.length > 0 && (
              <section aria-label="Related exams" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Related Exams
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedExams.slice(0, 4).map((e) => (
                    <ExamCard key={e.id} exam={e} />
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4">
            <AdSlot position="article-sidebar" size="300x250" />

            {/* Quick Links */}
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide pb-2 border-b border-border">
                Quick Links
              </h2>
              <ul className="space-y-2">
                {exam.officialWebsite && (
                <li>
                  <a
                    href={exam.officialWebsite || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                  >
                    Official Website <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
                )}
                {availableContentTypes.slice(0, 6).map((ct) => (
                  <li key={ct}>
                    <Link
                      href={getContentTypeHref(exam, ct)}
                      className="text-sm text-gray-700 hover:text-primary hover:underline"
                    >
                      {exam.shortName} {contentTypeLabel(ct)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {exam.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <AdSlot position="article-sidebar-2" size="300x250" />
          </aside>
        </div>
      </div>
    </>
  );
}
