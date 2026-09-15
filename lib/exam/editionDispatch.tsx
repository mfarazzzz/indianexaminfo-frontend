/**
 * Shared edition-URL dispatch for the "Other Editions" feature.
 *
 * ONE implementation of the year-segment route behaviour, used by every pillar
 * (sarkari-naukri, entrance-exam, university-exam, board-exam, board-exam/state).
 * Divergent per-route copies caused a regression; this module is the single home
 * for both halves of the dispatch:
 *
 *   - buildEditionMetadata(): the generateMetadata half.
 *       canonical → the MAIN exam URL (never self), noindex on a non-current
 *       edition, and 404-safe (a thin/absent edition yields empty metadata; the
 *       page's notFound() produces the 404).
 *   - renderEditionPage(): the page half.
 *       resolve → redirect the current edition's own year URL to the main page →
 *       notFound() a thin/absent edition → render EntityDetailPage with the
 *       edition overlaid + the year-pill switcher + breadcrumbs.
 *
 * CORE INVARIANT (see lib/exam/editions.ts and services/examService.ts): `year`
 * is a LABEL, not a timeline position. Only is_current decides what is live.
 * resolveEditionYear() is the single content/lifecycle authority — this module
 * NEVER re-derives hasContent or compares a year against today or the current
 * edition's year.
 *
 * Placement of sections (main / tab / both) is owned by sectionRegistry and is
 * respected because rendering goes through EntityDetailPage, which drives its
 * section loop from the registry. This module adds no section rendering of its
 * own — it must not hardcode any section onto the page.
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import type { BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { getExamEditionsForSwitcher, resolveEditionYear } from "@/services/examService";
import { buildEditionContext } from "@/lib/exam/editions";
import { buildExamMetadata } from "@/lib/seo/metadata";

/**
 * Parameters that a pillar route supplies to the shared dispatch.
 *  - slug        : exam slug (from the URL).
 *  - year        : the requested 4-digit year label (already validated by isEditionYear).
 *  - basePath    : the MAIN exam URL, NO year segment and NO origin
 *                  (e.g. "/sarkari-naukri/banking/ibps-clerk"). Canonical and the
 *                  current-edition redirect both target this.
 *  - absoluteBasePath : the same path with origin (e.g. `${siteConfig.url}${basePath}`),
 *                  used as the canonical URL in metadata.
 *  - servedPillars : the pillar set this route serves; an edition whose exam is not
 *                  in this set 404s (a route must not render another pillar's exam).
 *  - breadcrumbs : a builder that returns the breadcrumb trail for the edition page,
 *                  given the resolved exam and year. Kept as a callback because the
 *                  label/href shape differs per pillar (category vs state, etc.).
 */
export interface EditionRouteParams {
  slug: string;
  year: number;
  basePath: string;
  absoluteBasePath: string;
  servedPillars: ReadonlySet<string>;
  breadcrumbs: (exam: ExamForCrumbs, year: number) => BreadcrumbItem[];
}

/** Minimal shape the breadcrumb builder needs; ExamEntity satisfies it. */
export interface ExamForCrumbs {
  name: string;
  shortName: string;
  pillar: string;
}

/**
 * The generateMetadata half for a year segment. Returns:
 *  - {} when the edition is thin/absent (page 404s; empty metadata is correct).
 *  - main canonical, no noindex, for the current edition's year URL (it redirects
 *    to main in the page; giving it the main canonical avoids a duplicate signal).
 *  - a "Cycle Details" title with canonical → MAIN and noIndex:true for a real
 *    non-current edition.
 */
export async function buildEditionMetadata(
  params: Pick<EditionRouteParams, "slug" | "year" | "absoluteBasePath" | "servedPillars">,
): Promise<Metadata> {
  const { slug, year, absoluteBasePath, servedPillars } = params;
  const resolved = await resolveEditionYear(slug, year);
  if (resolved.kind === "notfound") return {};
  if (!servedPillars.has(resolved.exam.pillar)) return {};

  if (resolved.isCurrent) {
    // The current edition's own year URL redirects to main; give it the main
    // canonical and no noindex so it never competes as a second indexable page.
    return buildExamMetadata({
      pageType: "exam-entity",
      title: resolved.exam.seoTitle ?? `${resolved.exam.name} — Notification, Eligibility & Apply`,
      canonicalUrl: absoluteBasePath,
    });
  }

  return buildExamMetadata({
    pageType: "exam-entity",
    title: `${resolved.exam.name} ${year} — Cycle Details | IndianExamInfo`,
    description: `${resolved.exam.name} ${year} cycle: dates, vacancy, result and cutoff for that edition. For the current cycle see the main ${resolved.exam.shortName} page.`,
    canonicalUrl: absoluteBasePath, // canonical → MAIN page, never self
    noIndex: true, // non-current edition pages are supporting detail, not indexable
  });
}

/**
 * The page half for a year segment. Resolves the edition, redirects the current
 * edition's year URL to the main page, 404s a thin/absent edition, and otherwise
 * renders EntityDetailPage with the edition overlaid and the year-pill switcher.
 *
 * Returns a React element; callers `return renderEditionPage(...)` from the page.
 */
export async function renderEditionPage(params: EditionRouteParams) {
  const { slug, year, basePath, servedPillars, breadcrumbs } = params;

  const resolved = await resolveEditionYear(slug, year);
  if (resolved.kind === "notfound") notFound(); // thin/absent edition → 404
  if (!servedPillars.has(resolved.exam.pillar)) notFound();

  // The current edition's own year URL is not a second page — send to the canonical main URL.
  if (resolved.isCurrent) redirect(basePath);

  const exam = resolved.exam;
  // viewingYear is THIS edition's year (a label). The switcher context is built from the
  // single edition source; buildEditionContext returns null for ≤1 pillable edition, so the
  // switcher is omitted on single-edition exams automatically.
  const editions = await getExamEditionsForSwitcher(slug);
  const editionContext = buildEditionContext(editions, year, basePath);

  return (
    <EntityDetailPage
      exam={exam}
      breadcrumbs={breadcrumbs(exam, year)}
      editionContext={editionContext ?? undefined}
    />
  );
}
