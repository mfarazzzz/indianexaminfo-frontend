import Link from "next/link";
import type { ExamEntity, ContentType } from "@/types/exam";
import { getContentPostsByExam } from "@/services/contentPostService";
import { getRelatedExams } from "@/services/examService";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { ExamCard } from "@/components/exam/ExamCard";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { SocialChannelBanner } from "@/components/layout/SocialChannelBanner";
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
  // Virtual module-backed tabs
  "about",
  "faqs",
  "news",
];

function hasContentType(exam: ExamEntity, ct: ContentType): boolean {
  const map: Partial<Partial<Record<ContentType, keyof ExamEntity>> = {
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
  // Check legacy flags first
  const flag = map[ct];
  if (flag && exam[flag]) return true;

  // Also check if the corresponding content module is enabled
  const moduleConfig = exam.contentModules?._config as { enabledModules?: string[] } | undefined;
  const enabledModules = moduleConfig?.enabledModules ?? [];
  // Map content types to their module slugs
  const ctToModule: Partial<Partial<Record<ContentType, string[]>> = {
    application:     ["application-process"],
    notification:    ["notification", "overview"],
    result:          ["result"],
    cutoff:          ["cut-off"],
    syllabus:        ["syllabus"],
    "admit-card":    ["admit-card"],
    "answer-key":    ["faqs"],
    "date-sheet":    ["date-sheet"],
    "previous-papers": ["previous-papers"],
    // Virtual tabs
    about:           ["overview", "eligibility", "vacancy-details", "salary", "age-limit", "selection-process", "documents-required", "reservation"],
    faqs:            ["faqs"],
    news:            ["news"],
  };
  const moduleSlugs = ctToModule[ct] ?? [];
  return moduleSlugs.some(slug => enabledModules.includes(slug));
}

function getContentTypeHref(exam: ExamEntity, ct: ContentType): string {
  // Map DB pillar values to frontend route
  const pillarRouteMap: Record<string, string> = {
    "government-exam": "sarkari-naukri",
    "govt-vacancy": "sarkari-naukri",
    "sarkari-naukri": "sarkari-naukri",
    "sarkari-bharti": "sarkari-naukri",
    "board-exam": "board-exam",
    "board-university": "board-exam",
    "entrance-exam": "entrance-exam",
    "university-exam": "university-exam",
  };
  const routePillar = pillarRouteMap[exam.pillar] ?? exam.pillar;

  if (routePillar === "board-exam" && exam.entityType === "university") {
    return `/university-exam/${exam.category}/${exam.slug}/${ct}`;
  }
  return `/${routePillar}/${exam.category}/${exam.slug}/${ct}`;
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
  if (exam.pillar === "government-exam") schemas.push(buildJobPostingSchema(exam));
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

            {/* Content Type Navigation — placed right after official website */}
            {availableContentTypes.length > 0 && (
              <nav className="flex flex-wrap gap-2 mb-5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-1 px-1" aria-label="Available content modules">
                {availableContentTypes.map((ct) => (
                  <Link
                    key={ct}
                    href={getContentTypeHref(exam, ct)}
                    className="text-sm font-semibold px-3.5 py-2 min-h-[44px] flex items-center bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary hover:text-white transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none whitespace-nowrap"
                    prefetch={false}
                  >
                    {contentTypeLabel(ct)}
                  </Link>
                ))}
              </nav>
            )}

            {/* Social Channel CTA — top banner */}
            <SocialChannelBanner variant="top" />

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
                    {(() => {
                      const fee = exam.applicationFee;
                      // Group same amounts together
                      const amounts: Record<number, string[]> = {};
                      if (fee.general != null && fee.general > 0) {
                        amounts[fee.general] = [...(amounts[fee.general] ?? []), "General"];
                      }
                      if (fee.obc != null && fee.obc > 0 && fee.obc !== fee.general) {
                        amounts[fee.obc] = [...(amounts[fee.obc] ?? []), "OBC"];
                      } else if (fee.obc != null && fee.obc > 0) {
                        amounts[fee.obc] = [...(amounts[fee.obc] ?? []), "OBC"];
                      }
                      if (fee.sc != null && fee.sc > 0) {
                        const scCategories = ["SC"];
                        if (fee.st != null && fee.st === fee.sc) scCategories.push("ST");
                        if (fee.pwd != null && fee.pwd === fee.sc) scCategories.push("PwBD");
                        amounts[fee.sc] = [...(amounts[fee.sc] ?? []), ...scCategories];
                      }
                      if (fee.st != null && fee.st > 0 && fee.st !== fee.sc) {
                        amounts[fee.st] = [...(amounts[fee.st] ?? []), "ST"];
                      }
                      // Render grouped
                      const entries = Object.entries(amounts).filter(([amt]) => Number(amt) > 0);
                      if (entries.length === 0) return "Check official notification";
                      return entries.map(([amt, cats]) => `₹${Number(amt).toLocaleString("en-IN")} (${cats.join("/")})`).join(" | ");
                    })()}
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
            {exam.eligibility && Object.values(exam.eligibility).some(v => v) && (
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
                      {(() => {
                        const fee = exam.applicationFee!;
                        const rows: { category: string; amount: number }[] = [];
                        // Group same amounts
                        if (fee.general != null && fee.general > 0) {
                          const cats = ["General"];
                          if (fee.obc != null && fee.obc === fee.general) cats.push("OBC");
                          if (fee.ews != null && fee.ews === fee.general) cats.push("EWS");
                          rows.push({ category: cats.join(" / "), amount: fee.general });
                        }
                        if (fee.obc != null && fee.obc > 0 && fee.obc !== fee.general) {
                          rows.push({ category: "OBC-NCL", amount: fee.obc });
                        }
                        if (fee.ews != null && fee.ews > 0 && fee.ews !== fee.general) {
                          rows.push({ category: "EWS", amount: fee.ews });
                        }
                        if (fee.sc != null && fee.sc > 0) {
                          const cats = ["SC"];
                          if (fee.st != null && fee.st === fee.sc) cats.push("ST");
                          if (fee.pwd != null && fee.pwd === fee.sc) cats.push("PwBD");
                          rows.push({ category: cats.join(" / "), amount: fee.sc });
                        }
                        if (fee.st != null && fee.st > 0 && fee.st !== fee.sc) {
                          rows.push({ category: "ST", amount: fee.st });
                        }
                        if (fee.pwd != null && fee.pwd > 0 && fee.pwd !== fee.sc) {
                          rows.push({ category: "PwBD", amount: fee.pwd! });
                        }
                        return rows.map((r) => (
                          <tr key={r.category}><td>{r.category}</td><td>₹{r.amount.toLocaleString("en-IN")}</td></tr>
                        ));
                      })()}
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

            {/* Content Modules — from exam_editions.content_modules */}
            <ContentModulesBlock contentModules={exam.contentModules} />

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

            {/* Social Channel CTA — bottom banner */}
            <SocialChannelBanner variant="bottom" />

            {/* Related Exams */}
            {relatedExams.length > 0 && (
              <section aria-label="Related exams" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                  Related Exams
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedExams.slice(0, 6).map((e) => (
                    <ExamCard key={e.id} exam={e} />
                  ))}
                </div>
              </section>
            )}

            {/* Source Attribution + E-E-A-T (Google compliance) */}
            <section aria-label="Data source and verification" className="mb-5 border-t border-border pt-4">
              <div className="flex flex-col gap-2 text-xs text-gray-500">
                {exam.officialWebsite && (
                  <p>
                    <span className="font-medium text-gray-600">Data Source:</span>{" "}
                    <a
                      href={exam.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {exam.conductingBody} Official Website
                    </a>
                  </p>
                )}
                <p>
                  <span className="font-medium text-gray-600">Last Updated:</span>{" "}
                  {formatDate(exam.lastUpdated)}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Verified by:</span>{" "}
                  IndianExamInfo Editorial Team
                </p>
                <p className="text-gray-400 mt-1">
                  Information compiled from official notifications and verified by our editorial team.
                  Always confirm details from the official website before applying.
                </p>
              </div>
            </section>
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

export { ContentModulesBlock };

// ── Content Modules Block ─────────────────────────────────────────────────

function safeHtml(val: unknown): string | null {
  if (typeof val !== "string" || !val.trim()) return null;
  return val.replace(/^<html[^>]*><body[^>]*>/i, "").replace(/<\/body><\/html>$/i, "").trim();
}

const MODULE_LABELS: Record<string, string> = {
  overview: "About This Exam",
  eligibility: "Eligibility Criteria",
  "important-dates": "Important Dates",
  "application-process": "How to Apply",
  "exam-pattern": "Exam Pattern",
  syllabus: "Syllabus",
  faqs: "Frequently Asked Questions",
  "admit-card": "Admit Card",
  result: "Result",
  "cut-off": "Cut Off Marks",
  "vacancy-details": "Vacancy Details",
  salary: "Salary & Pay Scale",
  "age-limit": "Age Limit",
  "selection-process": "Selection Process",
  "documents-required": "Documents Required",
  reservation: "Reservation Policy",
  counselling: "Counselling Process",
  news: "News & Updates",
};

// These modules show on content type tab pages, not the main exam page
const TAB_ONLY_MODULES = new Set(["application-process", "admit-card", "result", "cut-off", "syllabus", "date-sheet", "news"]);

function ContentModulesBlock({ contentModules, onlyTabModules = false }: { contentModules?: Record<string, unknown>; onlyTabModules?: boolean }) {
  if (!contentModules) return null;
  const config = contentModules._config as { moduleOrder?: string[]; enabledModules?: string[] } | undefined;
  const order = config?.moduleOrder ?? Object.keys(contentModules).filter(k => k !== "_config");
  const enabled = config?.enabledModules ?? order;

  const items = order.filter(slug => {
    if (!enabled.includes(slug) || !contentModules[slug] || slug === "_config") return false;
    // Main page: skip tab-only modules. Tab page: only show that specific module.
    if (onlyTabModules) return TAB_ONLY_MODULES.has(slug);
    return !TAB_ONLY_MODULES.has(slug);
  });

  return (
    <>
      {items.map(slug => {
        const data = contentModules[slug] as Record<string, unknown>;
        if (!data || typeof data !== "object") return null;
        const label = MODULE_LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

        if (slug === "eligibility") {
          const qualification = data.qualification as string | undefined;
          const ageLimit = data.ageLimit as string | undefined;
          const nationality = data.nationality as string | undefined;
          const additionalCriteria = safeHtml(data.additionalCriteria);
          if (!qualification && !ageLimit && !additionalCriteria) return null;
          return (
            <section key={slug} aria-label={label} className="mb-5">
              <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{label}</h2>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <table><thead><tr><th scope="col">Criteria</th><th scope="col">Details</th></tr></thead>
                  <tbody>
                    {ageLimit && <tr><td>Age Limit</td><td>{ageLimit}</td></tr>}
                    {qualification && <tr><td>Educational Qualification</td><td>{qualification}</td></tr>}
                    {nationality && <tr><td>Nationality</td><td>{nationality}</td></tr>}
                  </tbody>
                </table>
              </div>
              {additionalCriteria && <div className="article-body text-sm mt-3" dangerouslySetInnerHTML={{ __html: additionalCriteria }} />}
            </section>
          );
        }

        if (slug === "application-process") {
          const steps = data.steps as { title?: string; description?: string }[] | undefined;
          const description = safeHtml(data.description);
          const fee = safeHtml(data.fee);
          if (!steps?.length && !description) return null;
          return (
            <section key={slug} aria-label={label} className="mb-5">
              <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{label}</h2>
              {description && <div className="article-body text-sm mb-4" dangerouslySetInnerHTML={{ __html: description }} />}
              {steps && steps.length > 0 && (
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <div>
                        {step.title && <p className="font-medium text-gray-800">{step.title}</p>}
                        {step.description && <p className="text-gray-600 mt-0.5" dangerouslySetInnerHTML={{ __html: step.description }} />}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {fee && (
                <div className="mt-4 p-3 bg-gray-50 rounded border border-border">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Application Fee</p>
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: fee }} />
                </div>
              )}
            </section>
          );
        }

        if (slug === "overview") {
          const body = safeHtml(data.body) || safeHtml(data.content);
          const summary = data.summary as string | undefined;
          if (!body && !summary) return null;
          return (
            <section key={slug} aria-label={label} className="mb-5">
              <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{label}</h2>
              {summary && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{summary}</p>}
              {body && <div className="article-body text-sm" dangerouslySetInnerHTML={{ __html: body }} />}
            </section>
          );
        }

        if (slug === "faqs") {
          const items2 = (data.items as { question: string; answer: string }[]) ?? [];
          if (!items2.length) return null;
          return (
            <section key={slug} aria-label={label} className="mb-5">
              <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">{label}</h2>
              <div className="space-y-4">
                {items2.map((faq, i) => (
                  <div key={i} className="border border-border rounded p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">{faq.question}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        if (slug === "news") return null;

        // Generic fallback
        const body = safeHtml(data.body) || safeHtml(data.content) || safeHtml(data.description);
        const summary = data.summary as string | undefined;
        if (!body && !summary) return null;
        return (
          <section key={slug} aria-label={label} className="mb-5">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{label}</h2>
            {summary && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{summary}</p>}
            {body && <div className="article-body text-sm" dangerouslySetInnerHTML={{ __html: body }} />}
          </section>
        );
      })}
    </>
  );
}
