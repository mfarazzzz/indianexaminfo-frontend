/**
 * Catch-all route for /board-exam/[...segments]
 * 
 * Handles:
 * 1. /board-exam/{category}/{slug}        → exam entity detail
 * 2. /board-exam/{category}/{slug}/{ct}   → content type page
 * 3. /board-exam/{slug}                   → single slug lookup
 *
 * Static sub-routes (cbse, state, university) take precedence.
 */
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getExamBySlug, getExamsByCategory, contentTypeAvailable, getExamEditionsForSwitcher } from "@/services/examService";
import { getContentPostsByExam, getLatestByContentType } from "@/services/contentPostService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { contentTypeLabel } from "@/lib/utils";
import { isEditionYear, buildEditionContext } from "@/lib/exam/editions";
import { buildEditionMetadata, renderEditionPage } from "@/lib/exam/editionDispatch";
import type { ContentType } from "@/types/exam";

export const revalidate = 3600;
export const dynamicParams = true;

/** Pillars served by this route */
const SERVED_PILLARS = new Set(["board-exam"]);

type Props = { params: Promise<{ segments: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;

  if (segments.length === 1) {
    const slug = segments[0];
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      // Title year = current edition's year (current_edition_id), not the calendar year.
      const year = exam.currentEditionYear ?? getCurrentYear();
      return buildExamMetadata({
        pageType: "exam-entity",
        title: exam.seoTitle ?? `${exam.name} ${year}`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", year),
        canonicalUrl: `${siteConfig.url}/board-exam/${exam.category}/${slug}`,
        updatedAt: exam.lastUpdated,
      });
    }
    return {};
  }

  // 2-seg (category/slug) and 3-seg content-type now PERMANENTLY REDIRECT to the canonical
  // /board-exam/state/{category}/{slug}[/{contentType}] form (see the page handler). A
  // redirecting URL must not emit its own metadata, so we return {} for those. The year/
  // edition segment is NOT redirected and keeps its shared-dispatch metadata.
  if (segments.length === 2) {
    return {};
  }

  if (segments.length === 3) {
    const [category, slug, seg3] = segments;
    // Year → edition page. Shared dispatch owns canonical → MAIN / noindex / 404-safe.
    if (isEditionYear(seg3)) {
      return buildEditionMetadata({
        slug,
        year: Number(seg3),
        absoluteBasePath: `${siteConfig.url}/board-exam/${category}/${slug}`,
        servedPillars: SERVED_PILLARS,
      });
    }
    // Non-year third segment = content-type → redirecting URL → no metadata.
    return {};
  }

  return {};
}

export default async function BoardExamCatchAll({ params }: Props) {
  const { segments } = await params;

  // Pattern 1: Single slug
  if (segments.length === 1) {
    const slug = segments[0];
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      const basePath = `/board-exam/${slug}`;
      const editions = await getExamEditionsForSwitcher(slug);
      const currentEd = editions.find((e) => e.isCurrent);
      const editionContext = currentEd ? buildEditionContext(editions, currentEd.year, basePath) : null;
      return (
        <EntityDetailPage
          exam={exam}
          editionContext={editionContext ?? undefined}
          breadcrumbs={[
            { name: "Board Exam", href: "/board-exam" },
            { name: exam.shortName, href: basePath },
          ]}
        />
      );
    }
    // Try as category
    const catExams = await getExamsByCategory(slug);
    if (catExams.length > 0) {
      const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">{label}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catExams.map((e) => (
              <Link key={e.id} href={`/board-exam/${e.category || slug}/${e.slug}`}
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all">
                <h2 className="font-heading font-semibold text-sm text-gray-900">{e.name}</h2>
                <p className="text-xs text-gray-500 mt-1">{e.conductingBody}</p>
              </Link>
            ))}
          </div>
        </div>
      );
    }
    notFound();
  }

  // Pattern 2: category/slug — CANONICAL is /board-exam/state/{category}/{slug}.
  // This bare catch-all form was a self-canonical duplicate; permanently redirect it to the
  // state-route canonical (the form the sitemap already emits). Loop-safe: /board-exam/state/…
  // is a distinct route that renders (does not bounce back here). Category listing fallbacks
  // below are preserved (only real served entities redirect).
  if (segments.length === 2) {
    const [category, slug] = segments;
    const exam = await getExamBySlug(slug, category);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      permanentRedirect(`/board-exam/state/${category}/${slug}`);
    }
    // Try slug as subcategory
    const subExams = await getExamsByCategory(slug);
    if (subExams.length > 0) {
      const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">{label}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subExams.map((e) => (
              <Link key={e.id} href={`/board-exam/${e.category || category}/${e.slug}`}
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all">
                <h2 className="font-heading font-semibold text-sm text-gray-900">{e.name}</h2>
                <p className="text-xs text-gray-500 mt-1">{e.conductingBody}</p>
              </Link>
            ))}
          </div>
        </div>
      );
    }
    notFound();
  }

  // Pattern 3: category/slug/{contentType | year}
  if (segments.length === 3) {
    const [category, slug, seg3] = segments;

    // Year segment → a specific edition (see CORE INVARIANT: year is a label, not lifecycle).
    if (isEditionYear(seg3)) {
      const year = Number(seg3);
      const basePath = `/board-exam/${category}/${slug}`;
      const catLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return renderEditionPage({
        slug,
        year,
        basePath,
        absoluteBasePath: `${siteConfig.url}${basePath}`,
        servedPillars: SERVED_PILLARS,
        breadcrumbs: (exam, y) => [
          { name: "Board Exam", href: "/board-exam" },
          { name: catLabel, href: `/board-exam/${category}` },
          { name: exam.shortName, href: basePath },
          { name: String(y), href: `${basePath}/${y}` },
        ],
      });
    }

    // Non-year third segment = content-type → CANONICAL is
    // /board-exam/state/{category}/{slug}/{contentType}. Permanently redirect the bare
    // catch-all form there. Preserve the existence + content-availability guard so an
    // absent exam or empty content type still 404s (matching the canonical route) rather
    // than redirecting into a page that would 404 anyway. Loop-safe: distinct state route.
    const contentType = seg3;
    const exam = await getExamBySlug(slug, category);
    if (!exam || !SERVED_PILLARS.has(exam.pillar)) notFound();
    if (!(await contentTypeAvailable(exam, contentType))) notFound();
    permanentRedirect(`/board-exam/state/${category}/${slug}/${contentType}`);
  }

  // Pattern 4: category/slug/contentType — same as 3 but accessed differently
  if (segments.length === 4) {
    // Treat as category/subcategory/slug/contentType — try without subcategory first
    const [, slug, , contentType] = segments;
    const category = segments[0];
    const exam = await getExamBySlug(slug, category);
    if (exam && SERVED_PILLARS.has(exam.pillar) && (await contentTypeAvailable(exam, contentType))) {
      return (
        <EntityDetailPage
          exam={exam}
          contentType={contentType as ContentType}
          breadcrumbs={[
            { name: "Board Exam", href: "/board-exam" },
            { name: category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), href: `/board-exam/${category}` },
            { name: exam.shortName, href: `/board-exam/${category}/${slug}` },
            { name: contentTypeLabel(contentType), href: `/board-exam/${category}/${slug}/${contentType}` },
          ]}
        />
      );
    }
    notFound();
  }

  notFound();
}
