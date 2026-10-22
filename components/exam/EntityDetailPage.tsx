import Link from "next/link";
import type { ExamEntity, ContentType } from "@/types/exam";
import { getContentPostsByExam } from "@/services/contentPostService";
import { getRelatedExams, getExamResources, getExamSyllabus, getTodayIST, type ExamResourceRow } from "@/services/examService";
import { ResourceLibrary } from "@/components/exam/ResourceLibrary";
import { SyllabusSection } from "@/components/exam/SyllabusSection";
import { StickyContextBar } from "@/components/exam/StickyContextBar";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { ExamListRow } from "@/components/exam/ExamListRow";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { ReportErrorControl } from "@/components/contact/ReportErrorControl";
import { SocialChannelBanner } from "@/components/layout/SocialChannelBanner";
import {
  buildFAQSchema,
  buildJobPostingSchema,
  buildHowToSchema,
} from "@/lib/seo/structured-data";
import {
  formatDate,
  statusLabel,
  contentTypeLabel,
} from "@/lib/utils";
import {
  getExamVerification,
  shouldShowListWidget,
  UNVERIFIED_EXAM_NOTICE,
} from "@/lib/exam/detailView";
import { contentTypeHasData, hasData, mainSectionsForPillar, CONTENT_TYPE_TO_SECTION, type HasDataView, type Pillar } from "@/lib/sectionRegistry";
import { getLeadBlock, type LeadBlock as LeadBlockData } from "@/lib/exam/actionLinks";
import { pillarToUrlSegment } from "@/lib/exam/pillarUrl";
import { SECTION_SUMMARY_RENDERERS, MODULE_RENDERERS } from "@/components/exam/sectionRenderers";
import { moduleShowsInContentBlock } from "@/components/exam/contentModulesVisibility";
import { hasDataViewOf } from "@/lib/exam/sectionOwnership";
import { sectionHeading } from "@/lib/exam/sectionHeadings";
import { resolveLastUpdated } from "@/lib/exam/lastUpdated";
import { partitionUpdates } from "@/lib/exam/updates";
import { KeyDatesStrip } from "@/components/exam/KeyDatesStrip";
import { QuickInfoCard, ImportantLinksCard } from "@/components/exam/ReaderInfoCards";
import { TestPageBanner } from "@/components/exam/TestPageBanner";
import { isTestSlug } from "@/lib/testContent";
import { pickAttestedAction, type AttestedLink } from "@/lib/exam/keyDates";
import { nameWithYear } from "@/lib/seo/keywords";
import { ExternalLink, Share2, ArrowRight } from "lucide-react";

/**
 * Colour-parity item 3 (mock .chip.ok): the derived statuses that are genuinely
 * POSITIVE for a reader — registration open, admit card out, result declared,
 * application active. Everything else (upcoming, awaited, closed, postponed…)
 * renders the neutral chip; we never colour-code a status we cannot derive.
 */
const POSITIVE_STATUSES: ReadonlySet<string> = new Set([
  "registration-open", "admit-card-out", "result-declared", "active",
]);

type EntityDetailPageProps = {
  exam: ExamEntity;
  breadcrumbs: BreadcrumbItem[];
  /** When set, this is a content-type sub-page (e.g. /slug/syllabus), not the main page.
   *  Routes that reuse EntityDetailPage as a CT page (university, board) pass this so the
   *  focused section (e.g. structured syllabus) renders — matching the entrance CT page.
   *  One component, one behaviour across pillars. */
  contentType?: ContentType;
  /** When set, this renders a NON-CURRENT edition at its year URL (e.g. /slug/2026), NOT the
   *  main page. Same body + renderers as the main page (one home) plus: an "other edition"
   *  banner linking to the live cycle, and the year-pill switcher. The YEAR IS A LABEL — never
   *  a timeline signal; `isCurrent` (from current_edition_id) is the only live-cycle authority.
   *  Canonical→main + noindex-until-content are set by the ROUTE's generateMetadata, not here. */
  editionContext?: {
    /** The year label of the edition being viewed (this page's edition). */
    viewingYear: number;
    /** All editions for the switcher pills, year-desc; `isCurrent` marks the live one. */
    editions: { year: number; editionLabel: string; isCurrent: boolean; hasContent: boolean }[];
    /** Base path for building year-pill + "current cycle" hrefs, e.g. "/sarkari-naukri/banking/ibps-clerk". */
    basePath: string;
  };
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

// Slice 5 (2026-09-11): the pillar gate is GONE. ALL five pillars render through the single
// registry-driven renderOrderedSections. The legacy hardcoded body has been deleted.

// Toggle for the Key Highlights comparison (user decides on the rendered page).
// When false, Key Highlights is dropped from the ordered render.
const SHOW_KEY_HIGHLIGHTS = false;

/** Build the minimal view sectionRegistry.hasData needs from an ExamEntity.
 *  hasStructuredSyllabus comes from the separately-loaded exam_syllabus_subjects
 *  (the flat syllabus_highlights column was dropped 2026-09-11). The builder itself
 *  lives in lib/exam/sectionOwnership so the renderers use the SAME view. */
function buildHasDataView(exam: ExamEntity, hasStructuredSyllabus: boolean): HasDataView {
  return hasDataViewOf(exam, hasStructuredSyllabus);
}

/**
 * The one ordered render: every main-page section for this pillar, filtered to
 * those with data, in registry order, each via its Summary renderer. No
 * hardcoded section order, no per-section JSX in the page. Empty sections absent.
 */
// The unified body EVERY pillar renders. The registry-driven ordered section loop, then the
// standalone pieces that were previously legacy-branch-only (SyllabusSection, ContentModules,
// ResourceLibrary, content-posts). This is feature-complete parity with the old legacy body,
// so the gate can widen to all pillars and the legacy branch can be deleted.
function renderOrderedSections(
  exam: ExamEntity,
  hasStructuredSyllabusFlag: boolean,
  resources: ExamResourceRow[],
  contentPosts: Awaited<ReturnType<typeof getContentPostsByExam>>,
  todayISO: string,
): React.ReactNode {
  const view = buildHasDataView(exam, hasStructuredSyllabusFlag);

  // Item 5: does this record have a date the reader would want to be alerted about — one that
  // is not yet announced (expected/tba) or has no date value? If so, the subscribe box is placed
  // right after Important Dates with "we'll tell you when it lands". If not, it falls to the
  // bottom as a generic CTA. Either way it appears exactly ONCE.
  const hasAwaitingDate = exam.dates.some(
    (d) => d.state === "expected" || d.state === "tba" || !d.date || d.date.trim() === "",
  );

  const orderedSections = mainSectionsForPillar(exam.pillar as Pillar)
    .filter((s) => (s.slug === "key-highlights" ? SHOW_KEY_HIGHLIGHTS : true))
    .filter((s) => hasData(view, s.slug))
    .map((s) => {
      const Render = SECTION_SUMMARY_RENDERERS[s.slug];
      const node = Render ? Render(exam, todayISO) : null;
      if (!node) return null;
      // Attach the contextual subscribe box immediately after Important Dates.
      if (s.slug === "important-dates" && hasAwaitingDate) {
        return (
          <div key={s.slug}>
            {node}
            <SocialChannelBanner variant="awaiting-date" />
          </div>
        );
      }
      return <div key={s.slug}>{node}</div>;
    });

  return (
    <>
      {orderedSections}

      {/* Syllabus is placement:"tab" in the registry — it renders on its own /syllabus
          sub-page, NOT the main page. Do not render SyllabusSection here (that violated the
          tab-only placement and put it on the main page by mistake). */}

      {/* Content Modules — editorial modules from exam_editions.content_modules. The
          registry decides which ones land here (lib/exam/sectionOwnership): the ordered
          loop above already renders its own sections, a placement-"tab" section lives on
          its own sub-page, and only what no other surface can show is painted here — so
          no concept gets a second heading. Renders nothing when empty. */}
      <ContentModulesBlock contentModules={exam.contentModules} pillar={exam.pillar} />

      {/* Resource library — exam-level, shared across editions (exam_resources). */}
      <ResourceLibrary resources={resources} />

      {/* Updates — the exam's own published updates (content_posts). Rendered ONLY
          when published updates exist (the leak audit keeps them out of every
          generic list/feed/sitemap, so this is their only surface). 4b timeline:
          each item carries ONLY the chips its stored data supports — a content-type
          badge, a lifecycle kind badge (provisional/revised/corrigendum/final), a
          Verified chip ONLY when an editor verified it (verifiedBy set). Withdrawn
          and superseded updates move out of the live list into "History / Withdrawn"
          (still readable — withdrawal is history, not a secret). No per-update page
          exists, so each is shown INLINE — never linked to a made-up URL. */}
      {(() => {
        const { active, history } = partitionUpdates(contentPosts);
        if (active.length === 0 && history.length === 0) return null;
        const KIND_LABEL: Record<string, string> = { provisional: "Provisional", final: "Final", revised: "Revised", corrigendum: "Corrigendum" };
        // Sensible, AA-checked tones: neutral=informational, green=final,
        // indigo=revised, amber=corrigendum (red lives in History).
        const KIND_TONE: Record<string, string> = { provisional: "is-neutral", final: "is-final", revised: "is-revised", corrigendum: "is-corrigendum", withdrawn: "is-withdrawn" };
        return (
          <>
            {active.length > 0 && (
              <section aria-label="Updates" className="mb-5">
                <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{sectionHeading("updates")}</h2>
                <ul className="space-y-3">
                  {active.map(({ post, kind, verified }) => (
                    <li key={post.id} className="exam-upd">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="content-type-badge bg-primary/10 text-primary">{contentTypeLabel(post.contentType)}</span>
                        {kind && kind !== "withdrawn" && (
                          <span className={`exam-kind ${KIND_TONE[kind] ?? "is-neutral"}`}>{KIND_LABEL[kind] ?? kind}</span>
                        )}
                        {verified && (
                          <span
                            className="exam-kind is-final"
                            title="An editor confirmed this against the official notice"
                          >
                            Verified
                          </span>
                        )}
                        <time>{formatDate(post.publishedAt || post.updatedAt)}</time>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">{post.title}</p>
                      {post.excerpt && <p className="text-sm text-gray-600 mt-0.5">{post.excerpt}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {history.length > 0 && (
              <section aria-label="History and withdrawn updates" className="mb-5">
                <h2 className="font-heading font-semibold text-sm text-gray-500 mb-2">{sectionHeading("history")}</h2>
                <ul className="space-y-2">
                  {history.map(({ post, withdrawn, superseded }) => (
                    <li key={post.id} className="border-l-2 border-gray-300 pl-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="content-type-badge bg-gray-100 text-gray-500">{contentTypeLabel(post.contentType)}</span>
                        {withdrawn && <span className="exam-kind is-withdrawn">Withdrawn</span>}
                        {superseded && <span className="exam-kind is-corrigendum">Superseded</span>}
                        <time className="text-xs text-gray-400">{formatDate(post.publishedAt || post.updatedAt)}</time>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 leading-snug">{post.title}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        );
      })()}
    </>
  );
}

/**
 * FOCUSED content-type body — rendered when `contentType` is set (a /slug/{ct} sub-page).
 * Mirrors the bespoke entrance CT page structure so university/board CONVERGE on one shape:
 * CT badge + H1, the content-type section itself, a compact dates reference, and FAQs.
 * Deliberately does NOT render the full ordered body (eligibility, fee, vacancy, resources,
 * related exams) — those belong on the main page only. This removes the duplicate-content
 * problem where every CT URL re-rendered the whole main page.
 */
function renderFocusedContentType(
  exam: ExamEntity,
  contentType: ContentType,
  syllabus: Awaited<ReturnType<typeof getExamSyllabus>>,
  todayISO: string,
): React.ReactNode {
  const ctLabel = contentTypeLabel(contentType);
  return (
    <>
      {/* CT badge + focused H1 */}
      <span className="content-type-badge bg-primary/10 text-primary mb-3 inline-block">{ctLabel}</span>
      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-3 article-title">
        {nameWithYear(exam.name, exam.currentEditionYear)} {ctLabel}
      </h1>

      {/* The content-type section itself. Syllabus → structured SyllabusSection. Otherwise
          render the section this content type maps to (CONTENT_TYPE_TO_SECTION) using the SAME
          summary renderer the main page uses — so notification→overview, result→result, etc.
          render their real content. Fall back to the filtered ContentModulesBlock for any
          content type whose section has no summary renderer (e.g. tab-only editorial modules). */}
      {(() => {
        if (contentType === "syllabus") return <SyllabusSection syllabus={syllabus} />;
        const sectionSlug = CONTENT_TYPE_TO_SECTION[contentType];
        const Render = sectionSlug ? SECTION_SUMMARY_RENDERERS[sectionSlug] : undefined;
        if (Render) {
          const node = Render(exam, todayISO);
          if (node) return node;
        }
        // Fallback: render the mapped module (or tab-only modules) directly from content_modules.
        return <ContentModulesBlock contentModules={exam.contentModules} onlyTabModules pillar={exam.pillar} />;
      })()}

      {/* Compact Important Dates reference — matches the entrance CT page. A short dates list
          is genuinely useful on a result/admit-card page; it is NOT the full main-page section. */}
      {exam.dates.length > 0 && (
        <section aria-label="Important dates" className="mb-6 mt-6">
          <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{sectionHeading("important-dates")}</h2>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="min-w-[320px]">
              <caption className="sr-only">Key dates for {exam.name} {ctLabel}</caption>
              <thead><tr><th scope="col">Event</th><th scope="col">Date</th></tr></thead>
              <tbody>
                {exam.dates.slice(0, 8).map((d, i) => (
                  <tr key={`${d.label}-${i}`}>
                    <td className="font-medium text-gray-800">{d.label}</td>
                    <td className={`font-mono ${d.isUrgent ? "text-accent font-semibold" : "text-gray-700"}`}>{formatDate(d.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* FAQs from the exam (column). ONE renderer, the same one the main page uses
          (SECTION_SUMMARY_RENDERERS.faqs), so the visible section and the FAQPage
          JSON-LD gate below can never disagree about what is on screen. */}
      {SECTION_SUMMARY_RENDERERS.faqs?.(exam, todayISO)}
    </>
  );
}

function getContentTypeHref(exam: ExamEntity, ct: ContentType): string {
  // Pillar → public URL segment via the single authority (entrance-exam → admission,
  // government-exam/govt-vacancy → sarkari-naukri, legacy aliases folded in).
  const routePillar = pillarToUrlSegment(exam.pillar);

  return `/${routePillar}/${exam.category}/${exam.slug}/${ct}`;
}

/** Year-pill switcher for cycles. Year is the LABEL and the sort key only — the live pill is
 *  marked from `isCurrent` (current_edition_id), never from year order. Caps at 8 pills with a
 *  "+N more" that links to the current cycle's page (where the full set is also shown). Links are
 *  real anchors so they are crawlable. Shown on the main page and on other-edition pages. */
function EditionSwitcher({
  editions, activeYear, basePath,
}: {
  editions: { year: number; editionLabel: string; isCurrent: boolean; hasContent: boolean }[];
  activeYear: number; // the year currently shown (current edition's year on the main page)
  basePath: string;
}) {
  // Only pill editions that are the current one OR non-current WITH content (thin cycles get no page).
  const pillable = editions.filter((e) => e.isCurrent || e.hasContent);
  if (pillable.length <= 1) return null; // nothing to switch between
  const CAP = 8;
  const shown = pillable.slice(0, CAP);
  const moreCount = pillable.length - shown.length;
  const current = editions.find((e) => e.isCurrent);
  const hrefFor = (e: { year: number; isCurrent: boolean }) =>
    e.isCurrent ? basePath : `${basePath}/${e.year}`;
  return (
    <nav className="flex flex-wrap items-center gap-2 mb-4" aria-label="Exam cycles">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cycle:</span>
      {shown.map((e) => (
        <Link
          key={e.year}
          href={hrefFor(e)}
          prefetch={false}
          aria-current={e.year === activeYear ? "page" : undefined}
          className={`text-sm font-semibold px-3 py-1.5 rounded border transition-colors ${
            e.year === activeYear
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-700 border-border hover:border-primary hover:text-primary"
          }`}
        >
          {e.year}{e.isCurrent ? " · current" : ""}
        </Link>
      ))}
      {moreCount > 0 && current && (
        <Link href={basePath} prefetch={false} className="text-sm text-gray-500 hover:text-primary hover:underline px-2 py-1.5">
          +{moreCount} more
        </Link>
      )}
    </nav>
  );
}

/** Banner shown on a NON-CURRENT edition page. States which cycle you're on and links to the
 *  live one. No "archived" wording — true whether the non-current cycle's year is behind or ahead
 *  of the current one (the year is a label, not a position). */
function OtherEditionBanner({
  viewingLabel, currentLabel, currentHref,
}: {
  viewingLabel: string; currentLabel: string | null; currentHref: string;
}) {
  return (
    <div className="mt-1 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-sm text-amber-800">
        You&apos;re viewing the <strong>{viewingLabel}</strong> cycle.
        {currentLabel ? <> The current cycle is <strong>{currentLabel}</strong>.</> : null}
      </p>
      <Link href={currentHref} className="text-sm font-medium text-amber-800 hover:text-amber-900 flex items-center gap-1 whitespace-nowrap">
        Go to current cycle <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/** Lead block — renders the derived LeadBlock descriptor. Formatting only; every value comes
 *  from getLeadBlock (status headline, shared pickDisplayDate, shared top gated action). When
 *  there is no action the date stands alone; when there is no date the headline stands alone. */
function LeadBlock({ lead }: { lead: LeadBlockData }) {
  const { headline, date, daysRemaining, action } = lead;
  return (
    <div className="mb-5 rounded-lg border border-border bg-card p-4">
      {/* Colour parity item 6 + 10: the mock's micro-label is muted uppercase
          (.k #6b7280 = 4.83:1 on white, AA). The old statusColor text tones
          (e.g. editorial #E8630A ≈ 3.3:1) failed AA for small text. */}
      <div className="text-xs font-bold uppercase tracking-wide mb-1 text-gray-500">
        {headline}
      </div>
      {date ? (
        <p className="text-sm text-gray-800">
          <span className="text-gray-500">{date.label}: </span>
          <span className="font-semibold">{formatDate(date.date)}</span>
          {daysRemaining != null && (
            <span className="text-accent font-medium"> · in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}</span>
          )}
        </p>
      ) : (
        <p className="text-sm text-gray-500">Date not announced yet.</p>
      )}
      {action && (
        <Link
          href={action.href}
          prefetch={false}
          className="mt-3 inline-flex items-center gap-1.5 rounded bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
        >
          {action.label} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export async function EntityDetailPage({ exam, breadcrumbs, contentType, editionContext }: EntityDetailPageProps) {
  const [contentPosts, relatedExams, resources, syllabus, todayISO] = await Promise.all([
    getContentPostsByExam(exam.id, undefined, exam.slug),
    getRelatedExams(exam.id),
    getExamResources(exam.id),
    getExamSyllabus(exam.id, exam.syllabusWeightageType ?? null),
    getTodayIST(),
  ]);

  // D2: "Last Updated" is shown only from a trustworthy source (a human edition
  // edit, a published update, or a verification) — never the trigger-stamped
  // exams.updated_at, which the 25-Sep bulk region backfill set for ~356/398
  // records. null → the line is omitted entirely (we do not show a false date).
  const lastUpdated = resolveLastUpdated({
    editionUpdatedAt: exam.editionUpdatedAt,
    editionUpdatedBy: exam.editionUpdatedBy,
    verifiedAt: exam.verifiedAt,
    postUpdatedAts: (contentPosts as { updatedAt?: string | null }[]).map((p) => p?.updatedAt),
  });

  // Structured syllabus presence (exam_syllabus_subjects) drives the Syllabus TAB — the same
  // signal the /syllabus sub-page gate reads (both derive from getExamSyllabus, one source),
  // so the tab can't show while the page 404s.
  const hasStructuredSyllabusFlag = syllabus.subjects.length > 0;
  const hasDataView = buildHasDataView(exam, hasStructuredSyllabusFlag);

  // Item 5: the subscribe box appears ONCE. When a date is not yet announced it sits inside
  // the body after Important Dates (see renderOrderedSections); otherwise the single bottom
  // banner covers it. This flag keeps the two mutually exclusive.
  const hasAwaitingDate = exam.dates.some(
    (d) => d.state === "expected" || d.state === "tba" || !d.date || d.date.trim() === "",
  );

  // Step 2: tabs gated by the ONE registry hasData rule (presence of content is
  // the only switch). Replaces the old has_*/enabledModules logic that showed
  // tabs for empty pages. Same predicate drives sitemap + route 404 + hub lists.
  const availableContentTypes = contentTypeOrder.filter((ct) =>
    contentTypeHasData(hasDataView, ct)
  );

  const schemas: Record<string, unknown>[] = [];
  // FAQPage markup is emitted from THE SAME predicate that paints the visible FAQ
  // section (registry hasData for 'faqs', used by renderOrderedSections' filter and
  // by SECTION_SUMMARY_RENDERERS.faqs). Owner decision 2026-09-28: FAQs are a
  // visible main-page section and there is no /faqs URL; markup must never exist
  // without the content a reader can actually see.
  if (hasData(hasDataView, "faqs")) schemas.push(buildFAQSchema(exam.faqs ?? []));
  // JobPosting only when the recruitment is genuinely open AND datePosted resolves;
  // the builder returns null otherwise so we emit no (invalid/stale) markup.
  if (exam.pillar === "government-exam") {
    const jobPosting = buildJobPostingSchema(exam);
    if (jobPosting) schemas.push(jobPosting);
  }
  // 4b: HowTo markup ONLY when the admit-card module carries real steps (never empty).
  const admitSteps = (exam.contentModules?.["admit-card"] as { steps?: unknown } | undefined)?.steps;
  const howTo = buildHowToSchema(`${exam.name} admit card \u2014 how to download`, Array.isArray(admitSteps) ? admitSteps : []);
  if (howTo) schemas.push(howTo);

  return (
    <>
      {schemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}

      {/* Collapsed detail-page header — replaces the global header on scroll,
          carrying back + short name + status. Client component; scroll-driven. */}
      <StickyContextBar shortName={exam.shortName} status={exam.status} />

      <div className="exam-page container mx-auto px-4 py-4">
        <Breadcrumb items={breadcrumbs} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-4">
          {/* Main */}
          <main className="exam-content">
            {/* Reference TEST record: loud, non-dismissible honesty banner. The
                page is reachable by direct URL (owner inspection) but is forced
                noindex/nofollow in metadata; aggregate surfaces exclude it. */}
            {isTestSlug(exam.slug) && <TestPageBanner />}
            {/* Status + Last Updated */}
            <div className="flex items-center gap-3 mb-2 text-sm">
              {/* Colour parity item 3: neutral chip by default; the green "ok"
                  treatment ONLY for a genuinely positive DERIVED status. A status
                  we cannot read as positive never gets a colour claim. */}
              <span className={`exam-chip${POSITIVE_STATUSES.has(exam.status) ? " is-ok" : ""}`}>
                {statusLabel(exam.status)}
              </span>
              {lastUpdated && (
                <span className="text-gray-500 text-xs">
                  Last Updated: {formatDate(lastUpdated)}
                </span>
              )}
            </div>

            {/* Other-edition banner — ONLY when viewing a NON-CURRENT edition at its year URL.
                Suppressed on the main page (where viewingYear === the current cycle's year). */}
            {editionContext && !editionContext.editions.some((e) => e.isCurrent && e.year === editionContext.viewingYear) && (() => {
              const cur = editionContext.editions.find((e) => e.isCurrent);
              const viewing = editionContext.editions.find((e) => e.year === editionContext.viewingYear);
              return (
                <OtherEditionBanner
                  viewingLabel={viewing?.editionLabel ?? String(editionContext.viewingYear)}
                  currentLabel={cur?.editionLabel ?? null}
                  currentHref={editionContext.basePath}
                />
              );
            })()}

            {/* Main-page H1 — only on the main page (no contentType). On a CT sub-page the
                focused body renders its own CT-specific H1. On a NON-CURRENT edition page, label
                the cycle by its year (the year is a label). */}
            {!contentType && (
              <h1 className="font-heading font-bold text-[1.35rem] min-[700px]:text-[1.7rem] text-gray-900 mb-3 article-title">
                {editionContext && !editionContext.editions.some((e) => e.isCurrent && e.year === editionContext.viewingYear)
                  ? `${exam.name} ${editionContext.viewingYear} — Cycle Details`
                  : `${nameWithYear(exam.name, exam.currentEditionYear)} — Notification, Eligibility & Apply`}
              </h1>
            )}

            {/* 4a (2d): mobile-first — right under the title, the honest unverified
                notice (when not editor-verified) then the Key-dates strip (next 2-3
                dates + primary buttons). A Download/Apply button appears ONLY when an
                attested URL exists on the exam's published updates; never a greyed
                placeholder. MAIN PAGE ONLY. */}
            {!contentType && (() => {
              const v = getExamVerification(exam);
              const links: AttestedLink[] = contentPosts.flatMap(
                (p) => [...(p.quickLinks ?? []), ...(p.attachmentUrls ?? [])].map((l) => ({ label: l.label, url: l.url })),
              );
              return (
                <>
                  {v.kind === "verified" ? (
                    /* S3.2/D6 #3: the verified line names the TEAM and the date —
                       never a person. It replaces the honest notice at the same
                       spot; nothing here is shown unless the record really carries
                       flag + date + verifier. Mock .verified: green pill. */
                    <p className="mb-3" data-testid="verified-notice">
                      <span className="exam-verified-pill">Verified by {v.label} · {formatDate(v.date)}</span>
                    </p>
                  ) : (
                    <p className="exam-notice-warn mb-3">
                      {UNVERIFIED_EXAM_NOTICE}
                    </p>
                  )}
                  <KeyDatesStrip dates={exam.dates} todayISO={todayISO} officialWebsite={exam.officialWebsite} action={pickAttestedAction(exam.status, links)} />
                </>
              );
            })()}

            {/* Mock gap audit (22 Oct): the two mock blocks our template did not
                render — Quick information (facts from STORED fields only) and
                Important links (ATTESTED urls only). Each renders NOTHING when
                it has nothing to say; never an empty shell. MAIN PAGE ONLY. */}
            {!contentType && <QuickInfoCard exam={exam} />}
            {!contentType && <ImportantLinksCard exam={exam} contentPosts={contentPosts} todayISO={todayISO} />}

            {/* Lead block — the answer first. MAIN PAGE ONLY (a CT sub-page is already the
                answer to one question; repeating the card there is duplication). Reads derived
                status + shared pickDisplayDate + shared getActionLinks — nothing invented, no
                button where no page exists, date stands alone when there is no action. */}
            {!contentType && <LeadBlock lead={getLeadBlock(exam, todayISO)} />}

            {/* Cycle switcher (year pills) — main page and edition pages, when >1 cycle exists. */}
            {editionContext && (
              <EditionSwitcher
                editions={editionContext.editions}
                activeYear={editionContext.viewingYear}
                basePath={editionContext.basePath}
              />
            )}

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

            {/* "Report an error on this page" — near the top of the content, NOT
                buried in the footer (owner brief S0-5 A.2). One control covers
                every page type that renders through this component: vacancy,
                exam and its tabs, admission, board, university. Client island;
                the sheet reads URL + title from the live location. */}
            <div className="mb-4 -mt-1">
              <ReportErrorControl />
            </div>

            {/* Content Type Navigation — the tab row. Shown on both main and CT pages; on a CT
                page the active tab is highlighted. */}
            {availableContentTypes.length > 1 && (
              <nav className="flex flex-wrap gap-2 mb-5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 -mx-1 px-1" aria-label="Available content modules">
                {availableContentTypes.map((ct) => (
                  <Link
                    key={ct}
                    href={getContentTypeHref(exam, ct)}
                    className={`text-sm font-semibold px-3.5 py-2 min-h-[44px] flex items-center rounded border transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none whitespace-nowrap ${
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
            )}

            {/* Item 5: the subscribe box was here (top) AND at the bottom — twice per page,
                above the content the reader came for. Removed from the top. It now renders
                ONCE, inside the ordered body, right after Important Dates when a date is not
                yet announced (see renderOrderedSections) — where the reader actually feels the
                need to be told when it lands. */}
            {contentType ? (
              /* FOCUSED content-type view — the CT section + compact shell. Suppresses the full
                 ordered body so a CT URL is NOT a duplicate of the main page. Converges with the
                 bespoke entrance/board/sarkari CT pages (same shape). */
              renderFocusedContentType(exam, contentType, syllabus, todayISO)
            ) : (
              <>
                {/* MAIN PAGE — the one ordered, registry-driven body for all five pillars. */}
                {renderOrderedSections(exam, hasStructuredSyllabusFlag, resources, contentPosts, todayISO)}

                {/* Bottom banner ONLY when the contextual (awaiting-date) one did not render,
                    so the subscribe box is shown exactly once per page. */}
                {!hasAwaitingDate && <SocialChannelBanner variant="bottom" />}

                {/* Related Exams — main page only. */}
                {relatedExams.length > 0 && (
                  <section aria-label="Related exams" className="mb-5">
                    <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
                      {sectionHeading("related-exams")}
                    </h2>
                    <div className="divide-y divide-border border-t border-border">
                      {relatedExams.slice(0, 6).map((e) => (
                        <ExamListRow key={e.id} exam={e} />
                      ))}
                    </div>
                  </section>
                )}
              </>
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
                {lastUpdated && (
                  <p>
                    <span className="font-medium text-gray-600">Last Updated:</span>{" "}
                    {formatDate(lastUpdated)}
                  </p>
                )}
                {(() => {
                  const v = getExamVerification(exam);
                  return v.kind === "verified" ? (
                    <p>
                      <span className="exam-verified-pill">Verified by {v.label} · {formatDate(v.date)}</span>
                    </p>
                  ) : (
                    <p className="text-gray-500 mt-1">{UNVERIFIED_EXAM_NOTICE}</p>
                  );
                })()}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          {/* Mock parity (@700px aside sticky): the sidebar holds position while
              the reader scrolls the body, at the same lg breakpoint the two
              column layout switches to. */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-4 self-start">
            <AdSlot position="article-sidebar" size="300x250" />

            {/* Quick Links — hide the whole panel when it would be empty */}
            {(exam.officialWebsite || availableContentTypes.length > 0) && (
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide pb-2 border-b border-border">
                {sectionHeading("quick-links")}
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
                      prefetch={false}
                    >
                      {exam.shortName} {contentTypeLabel(ct)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {/* Tags — hide the whole panel when there are none (H2) */}
            {shouldShowListWidget(exam.tags) && (
            <div className="bg-card border border-border rounded p-4">
              <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">
                {sectionHeading("tags")}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {exam.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            )}

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
  return val
    .replace(/^<html[^>]*><body[^>]*>/i, "")
    .replace(/<\/body><\/html>$/i, "")
    // The section already owns the <h2>; prose inside it must not open a second
    // section-level heading (P1 items 6 and 11). Demote one level.
    .replace(/<h2\b/gi, "<h3")
    .replace(/<\/h2>/gi, "</h3>")
    .trim();
}

// Headings come from ONE config (lib/exam/sectionHeadings.ts) — `English / हिन्दी`
// for every section, with the humanised slug as the fallback for a module the
// registry does not know. MODULE_LABELS used to be a second, drifting copy of the
// registry's own labels; it is gone.

/**
 * The editorial-module block. WHICH slugs land here is decided by the section
 * registry (lib/exam/sectionOwnership.ts -> moduleShowsInContentBlock), so a concept
 * the ordered loop or a tab sub-page already renders can never open a second heading
 * from here. The eligibility/vacancy/dates module TEXT is not lost: the column-backed
 * renderer shows it as notes under its own heading.
 */
function ContentModulesBlock({ contentModules, onlyTabModules = false, pillar }: { contentModules?: Record<string, unknown>; onlyTabModules?: boolean; pillar: string }) {
  if (!contentModules) return null;
  const config = contentModules._config as { moduleOrder?: string[]; enabledModules?: string[] } | undefined;
  const order = config?.moduleOrder ?? Object.keys(contentModules).filter(k => k !== "_config");
  const enabled = config?.enabledModules ?? order;

  const items = order.filter(slug => {
    if (!contentModules[slug]) return false;
    return moduleShowsInContentBlock(slug, enabled, onlyTabModules, pillar);
  });

  return (
    <>
      {items.map(slug => {
        const data = contentModules[slug] as Record<string, unknown>;
        if (!data || typeof data !== "object") return null;
        const label = sectionHeading(slug);

        // Structured modules render through the SHARED MODULE_RENDERERS (one home). This is what
        // makes the bespoke CT tab pages render identically to the main page / focused CT view —
        // e.g. result, admit-card, exam-pattern, and the selection-outcome modules show their
        // structured fields here instead of body-only. Any slug not in the map falls through to
        // the branches below (eligibility, application-process, overview, faqs, news, generic).
        const moduleRender = MODULE_RENDERERS[slug];
        if (moduleRender) {
          const node = moduleRender(data);
          return node ? <div key={slug}>{node}</div> : null;
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
          // `description` is the field the CMS writes for overview (268/273 records) — read it
          // so the About-This-Exam text is visible (it was previously invisible on both paths).
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
              <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">{sectionHeading("news")}</h2>
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
