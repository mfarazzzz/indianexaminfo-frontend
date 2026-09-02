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
import { contentTypeHasData, hasData, mainSectionsForPillar, type HasDataView, type Pillar } from "@/lib/sectionRegistry";
import { SECTION_SUMMARY_RENDERERS } from "@/components/exam/sectionRenderers";
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

// Tab derivation now lives in the shared registry (contentTypeHasData). The old
// hasContentType/moduleHasData (has_*/enabledModules-based) were removed in Step 2.

// ── Slice 1: one ordered section loop, gated to GDS pillars ──────────────────
// Only these pillars use the new registry-driven ordered render. The other
// pillars keep the legacy hardcoded body until later slices (coexisting paths,
// no feature flag — the gate disappears when Slice 5 rolls out to all pillars).
const NEW_RENDER_PILLARS = new Set<string>(["government-exam", "govt-vacancy"]);

// Toggle for the Key Highlights comparison (user decides on the rendered page).
// When false, Key Highlights is dropped from the ordered render.
const SHOW_KEY_HIGHLIGHTS = false;

/** Build the minimal view sectionRegistry.hasData needs from an ExamEntity. */
function buildHasDataView(exam: ExamEntity): HasDataView {
  return {
    pillar: exam.pillar,
    dates: exam.dates,
    eligibility: exam.eligibility ?? null,
    vacancy: exam.vacancy ?? null,
    applicationFee: (exam.applicationFee ?? null) as HasDataView["applicationFee"],
    selectionProcess: exam.selectionProcess ?? null,
    syllabusHighlights: exam.syllabusHighlights ?? null,
    faqs: exam.faqs ?? null,
    contentModules: exam.contentModules,
  };
}

/**
 * The one ordered render: every main-page section for this pillar, filtered to
 * those with data, in registry order, each via its Summary renderer. No
 * hardcoded section order, no per-section JSX in the page. Empty sections absent.
 */
function renderOrderedSections(exam: ExamEntity): React.ReactNode {
  const view = buildHasDataView(exam);
  return mainSectionsForPillar(exam.pillar as Pillar)
    .filter((s) => (s.slug === "key-highlights" ? SHOW_KEY_HIGHLIGHTS : true))
    .filter((s) => hasData(view, s.slug))
    .map((s) => {
      const Render = SECTION_SUMMARY_RENDERERS[s.slug];
      const node = Render ? Render(exam) : null;
      return node ? <div key={s.slug}>{node}</div> : null;
    });
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

  // Step 2: tabs gated by the ONE registry hasData rule (presence of content is
  // the only switch). Replaces the old has_*/enabledModules logic that showed
  // tabs for empty pages. Same predicate drives sitemap + route 404 + hub lists.
  const availableContentTypes = contentTypeOrder.filter((ct) =>
    contentTypeHasData(exam, ct)
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

            {/* ── Slice 1: GDS pillars render one ordered section list from the
                registry; other pillars keep the legacy hardcoded body below. ── */}
            {NEW_RENDER_PILLARS.has(exam.pillar) ? (
              renderOrderedSections(exam)
            ) : (
            <>
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
                      {exam.dates.map((d, i) => {
                        const isCancelled = d.state === "cancelled";
                        const isExpected  = d.state === "expected" || d.state === "tba";
                        const isPostponed = d.state === "postponed";
                        const isPast = !isCancelled && !isExpected && new Date(d.date) < new Date();
                        return (
                          <tr key={`${d.label}-${i}`} className={isCancelled ? "opacity-60" : undefined}>
                            <td className={`font-medium ${isCancelled ? "text-gray-400 line-through" : "text-gray-800"}`}>
                              {d.label}
                            </td>
                            <td className={`font-mono ${
                              isCancelled ? "text-gray-400 line-through"
                              : isExpected ? "text-gray-500"
                              : d.isUrgent ? "text-accent font-semibold"
                              : "text-gray-700"
                            }`}>
                              {isExpected ? (
                                <span title="Tentative date — not yet officially confirmed. Check the official website before acting on this." className="cursor-help">
                                  {formatDate(d.date)}{" "}
                                  <span className="text-[11px] font-normal">(expected)</span>
                                </span>
                              ) : formatDate(d.date)}
                            </td>
                            <td>
                              {isCancelled ? (
                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Cancelled</span>
                              ) : isPostponed ? (
                                <span className="text-xs font-medium text-amber-600">Postponed</span>
                              ) : isExpected ? (
                                <span className="text-xs text-gray-400">Tentative</span>
                              ) : isPast ? (
                                <span className="text-xs text-gray-400">Passed</span>
                              ) : d.isUrgent ? (
                                <span className="text-xs text-accent font-semibold">Urgent</span>
                              ) : (
                                <span className="text-xs text-success">Upcoming</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                      {exam.eligibility.age && exam.eligibility.age.trim() && (
                        <tr>
                          <td>Age Limit</td>
                          <td>{exam.eligibility.age}</td>
                        </tr>
                      )}
                      {exam.eligibility.qualification && exam.eligibility.qualification.trim() && (
                        <tr>
                          <td>Educational Qualification</td>
                          <td>{exam.eligibility.qualification}</td>
                        </tr>
                      )}
                      {exam.eligibility.nationality && exam.eligibility.nationality.trim() && (
                        <tr>
                          <td>Nationality</td>
                          <td>{exam.eligibility.nationality}</td>
                        </tr>
                      )}
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
            </>
            )}
            {/* ── end legacy body / ordered-render branch ── */}

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

            {/* Quick Links — hide the whole panel when it would be empty */}
            {(exam.officialWebsite || availableContentTypes.length > 0) && (
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
            )}

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
const TAB_ONLY_MODULES = new Set(["application-process", "admit-card", "result", "cut-off", "syllabus", "date-sheet", "news", "faqs"]);

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

        if (slug === "news") {
          const newsItems = (data.items as { title?: string; content?: string; excerpt?: string; publishedAt?: string }[]) ?? [];
          if (!newsItems.length) return null;
          return (
            <section key={slug} aria-label="News & Updates" className="mb-5">
              <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">News &amp; Updates</h2>
              <div className="space-y-4">
                {newsItems.filter(item => item.title).map((item, i) => (
                  <div key={i} className="border border-border rounded p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">{item.title}</h3>
                    {item.excerpt && <p className="text-sm text-gray-600 mb-2">{item.excerpt}</p>}
                    {item.content && <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: item.content }} />}
                  </div>
                ))}
              </div>
            </section>
          );
        }

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
