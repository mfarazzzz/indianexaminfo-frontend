/**
 * Catch-all route for /sarkari-naukri/[...segments]
 *
 * Handles three URL patterns:
 * 1. /sarkari-naukri/{slug}                   → sarkari_naukri table detail (direct bharti/exam jobs)
 * 2. /sarkari-naukri/{category}/{slug}        → exams table entity detail page (CMS Exam Manager)
 * 3. /sarkari-naukri/{category}/{slug}/{ct}   → exams content type page (admit-card, result, etc.)
 *
 * Static sub-routes (exam, bharti, state, department) have their own folders
 * and take precedence over this catch-all.
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSarkariNaukriBySlug, generateStaticSarkariNaukriParams } from "@/services/sarkariNaukriService";
import { getExamBySlug, getExamsByCategory, getExamEditionsForSwitcher } from "@/services/examService";
import { isEditionYear, buildEditionContext } from "@/lib/exam/editions";
import { buildEditionMetadata, renderEditionPage } from "@/lib/exam/editionDispatch";
import { getContentPostsByExam, getLatestByContentType } from "@/services/contentPostService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildSEOTitle, buildMetaDescription, buildLastModifiedSignal, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import type { ContentType } from "@/types/exam";

// Sub-page components
import { SarkariNaukriDetailView } from "./SarkariNaukriDetailView";
import { SarkariNaukriContentTypeView } from "./SarkariNaukriContentTypeView";

export const revalidate = 600;
export const dynamicParams = true;

// Legacy category slugs that need redirects
const LEGACY_REDIRECTS: Record<string, string> = {
  "central-government-jobs": "/sarkari-naukri/exam",
  "state-government-jobs": "/sarkari-naukri/bharti",
  banking: "/sarkari-naukri/exam?category=banking",
  railways: "/sarkari-naukri/exam?category=railway",
  defence: "/sarkari-naukri/exam?category=defence",
  teaching: "/sarkari-naukri/exam?category=teaching",
};

/** Pillars that are served by this route (covers both old and new DB values) */
const SERVED_PILLARS = new Set(["sarkari-naukri", "government-exam", "govt-vacancy"]);

type Props = { params: Promise<{ segments: string[] }> };

export async function generateStaticParams() {
  const items = await generateStaticSarkariNaukriParams();
  return items.map((item) => ({ segments: [item.slug] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;

  if (segments.length === 1) {
    // Single slug — sarkari_naukri item or exams fallback
    const slug = segments[0];
    if (LEGACY_REDIRECTS[slug]) return {};

    const item = await getSarkariNaukriBySlug(slug);
    if (item) {
      return buildExamMetadata({
        pageType: "exam-entity",
        title: item.seoTitle ?? `${item.title} — IndianExamInfo`,
        description: item.seoDescription ?? `${item.title}. ${item.organization}. Check status, dates, eligibility and apply online.`,
        canonicalUrl: `${siteConfig.url}/sarkari-naukri/${slug}`,
      });
    }
    // Try exams table
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      // Title year = the CURRENT edition's year (current_edition_id), not the calendar year,
      // so the main page's title matches the cycle it renders. Falls back to calendar year
      // only when no current edition is loaded.
      const year = exam.currentEditionYear ?? getCurrentYear();
      return buildExamMetadata({
        pageType: "exam-entity",
        title: exam.seoTitle ?? `${exam.name} ${year} — Notification, Eligibility & Apply`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "notification", "", year),
        keywords: buildPageKeywords({ pageType: "exam-entity", pillar: "government-exam", examSlug: slug }),
        canonicalUrl: `${siteConfig.url}/sarkari-naukri/${exam.category}/${slug}`,
        tags: exam.tags,
        updatedAt: exam.lastUpdated,
      });
    }
    return {};
  }

  if (segments.length === 2) {
    // category/slug — exams table entity
    const [category, slug] = segments;
    const exam = await getExamBySlug(slug, category);
    if (!exam || !SERVED_PILLARS.has(exam.pillar)) return {};
    // Title year = current edition's year (current_edition_id), not calendar year.
    const year = exam.currentEditionYear ?? getCurrentYear();
    return buildExamMetadata({
      pageType: "exam-entity",
      title: exam.seoTitle ?? `${exam.name} ${year} — Notification, Eligibility & Apply`,
      description: exam.seoDescription ?? buildMetaDescription(exam.name, "notification", "", year),
      keywords: buildPageKeywords({ pageType: "exam-entity", pillar: "government-exam", examSlug: slug }),
      canonicalUrl: `${siteConfig.url}/sarkari-naukri/${category}/${slug}`,
      tags: exam.tags,
      updatedAt: exam.lastUpdated,
    });
  }

  if (segments.length === 3) {
    const [category, slug, seg3] = segments;
    const basePath = `${siteConfig.url}/sarkari-naukri/${category}/${slug}`;

    // Year → a specific edition page. Shared dispatch owns the SEO rules (canonical → MAIN,
    // noindex non-current, 404-safe). basePath here has no origin; pass the absolute form.
    if (isEditionYear(seg3)) {
      return buildEditionMetadata({
        slug,
        year: Number(seg3),
        absoluteBasePath: basePath,
        servedPillars: SERVED_PILLARS,
      });
    }

    // Otherwise → content type page
    const contentType = seg3;
    const exam = await getExamBySlug(slug, category);
    if (!exam || !SERVED_PILLARS.has(exam.pillar)) return {};
    const year = getCurrentYear();
    return buildExamMetadata({
      pageType: "content-type",
      title: buildSEOTitle(exam.shortName, contentType, year),
      description: buildMetaDescription(exam.name, contentType as ContentType, "", year),
      keywords: buildPageKeywords({ pageType: "content-type", pillar: "government-exam", examSlug: slug, contentType: contentType as ContentType }),
      canonicalUrl: `${siteConfig.url}/sarkari-naukri/${category}/${slug}/${contentType}`,
      updatedAt: exam.lastUpdated,
    });
  }

  return {};
}

export default async function SarkariNaukriCatchAll({ params }: Props) {
  const { segments } = await params;

  // ─── Pattern 1: Single slug ─────────────────────────────────────────
  if (segments.length === 1) {
    const slug = segments[0];

    // Handle legacy redirects
    if (LEGACY_REDIRECTS[slug]) {
      redirect(LEGACY_REDIRECTS[slug]);
    }

    // Try sarkari_naukri table first (direct bharti/exam jobs)
    const item = await getSarkariNaukriBySlug(slug);
    if (item) {
      return <SarkariNaukriDetailView item={item} slug={slug} />;
    }

    // Fallback: try exams table — if found with category, redirect to canonical URL
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      if (exam.category) {
        redirect(`/sarkari-naukri/${exam.category}/${exam.slug}`);
      }
      // No category — render EntityDetailPage directly (with switcher, same rule as every route)
      const basePath = `/sarkari-naukri/${exam.slug}`;
      const editions = await getExamEditionsForSwitcher(exam.slug);
      const currentEd = editions.find((e) => e.isCurrent);
      const editionContext = currentEd ? buildEditionContext(editions, currentEd.year, basePath) : null;
      return (
        <EntityDetailPage
          exam={exam}
          editionContext={editionContext ?? undefined}
          breadcrumbs={[
            { name: "Sarkari Naukri", href: "/sarkari-naukri" },
            { name: exam.shortName, href: basePath },
          ]}
        />
      );
    }

    // Fallback: try as category slug — show category listing
    const categoryExams = await getExamsByCategory(slug);
    if (categoryExams.length > 0) {
      const categoryLabel = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return (
        <div className="container mx-auto px-4 py-4">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">{categoryLabel}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryExams.map((e) => (
              <Link key={e.id} href={`/sarkari-naukri/${e.category || slug}/${e.slug}`}
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

  // ─── Pattern 2: category/slug — Exam entity detail ──────────────────
  if (segments.length === 2) {
    const [category, slug] = segments;
    const exam = await getExamBySlug(slug, category);

    if (!exam || !SERVED_PILLARS.has(exam.pillar)) {
      // Maybe slug is a subcategory — show listing
      const subCategoryExams = await getExamsByCategory(slug);
      if (subCategoryExams.length > 0) {
        const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        const subLabel = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
        return (
          <div className="container mx-auto px-4 py-4">
            <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">{subLabel}</h1>
            <p className="text-sm text-gray-500 mb-4">Under {categoryLabel}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subCategoryExams.map((e) => (
                <Link key={e.id} href={`/sarkari-naukri/${e.category || category}/${e.slug}`}
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

    const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const basePath = `/sarkari-naukri/${category}/${slug}`;

    // Switcher on the MAIN page when ≥1 other edition with content exists. viewingYear = the
    // CURRENT edition's year (resolved from is_current, NOT from year order).
    const editions = await getExamEditionsForSwitcher(slug);
    const currentEd = editions.find((e) => e.isCurrent);
    const editionContext = currentEd
      ? buildEditionContext(editions, currentEd.year, basePath)
      : null;

    return (
      <EntityDetailPage
        exam={exam}
        breadcrumbs={[
          { name: "Sarkari Naukri", href: "/sarkari-naukri" },
          { name: categoryLabel, href: `/sarkari-naukri/${category}` },
          { name: exam.shortName, href: basePath },
        ]}
        editionContext={editionContext ?? undefined}
      />
    );
  }

  // ─── Pattern 3: category/slug/{contentType | year} ──────────────────
  if (segments.length === 3) {
    const [category, slug, seg3] = segments;

    // 3a. Year segment → a specific edition (see CORE INVARIANT: year is a label, not lifecycle).
    // Shared dispatch owns resolve → current-year redirect → thin-404 → render + switcher.
    if (isEditionYear(seg3)) {
      const year = Number(seg3);
      const basePath = `/sarkari-naukri/${category}/${slug}`;
      const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return renderEditionPage({
        slug,
        year,
        basePath,
        absoluteBasePath: `${siteConfig.url}${basePath}`,
        servedPillars: SERVED_PILLARS,
        breadcrumbs: (exam, y) => [
          { name: "Sarkari Naukri", href: "/sarkari-naukri" },
          { name: categoryLabel, href: `/sarkari-naukri/${category}` },
          { name: exam.shortName, href: basePath },
          { name: String(y), href: `${basePath}/${y}` },
        ],
      });
    }

    // 3b. Otherwise → content-type page (existing behaviour).
    const contentType = seg3;
    const exam = await getExamBySlug(slug, category);
    if (!exam || !SERVED_PILLARS.has(exam.pillar)) notFound();
    return (
      <SarkariNaukriContentTypeView
        exam={exam}
        category={category}
        slug={slug}
        contentType={contentType}
      />
    );
  }

  notFound();
}
