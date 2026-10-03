/**
 * Catch-all route for /university-exam/[...segments]
 * Handles: /university-exam/{category}/{slug} and /university-exam/{category}/{slug}/{ct}
 */
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { getExamBySlug, getExamsByCategory, contentTypeAvailable, getExamEditionsForSwitcher, getExamSlugsForPillar } from "@/services/examService";
import { getContentPostsByExam } from "@/services/contentPostService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildSEOTitle, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { contentTypeLabel } from "@/lib/utils";
import { isEditionYear, buildEditionContext } from "@/lib/exam/editions";
import { buildEditionMetadata, renderEditionPage } from "@/lib/exam/editionDispatch";
import { categoryBreadcrumbLabel, categoryMismatch } from "@/lib/exam/categoryCanonical";
import type { ContentType } from "@/types/exam";

export const revalidate = 3600;
export const dynamicParams = true;

// Prerender the {category}/{slug} entity pages so the catch-all segment enters the ISR
// Full Route Cache. Without generateStaticParams the dynamic segment renders fully
// dynamic (ƒ) even with revalidate > 0, returning "private, no-cache, no-store" on every
// request. Other depths (flat slug, content-type, edition year) generate on demand via
// dynamicParams=true. Same pattern as sarkari-naukri/[...segments].
export async function generateStaticParams() {
  const items = await getExamSlugsForPillar("university-exam");
  return items
    .filter((i) => i.category)
    .map((i) => ({ segments: [i.category as string, i.slug] }));
}

const SERVED_PILLARS = new Set(["university-exam", "board-exam"]);

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
        title: exam.seoTitle ?? `${exam.name} ${year} — Result, Date Sheet & Admission`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", year),
        canonicalUrl: `${siteConfig.url}/university-exam/${exam.category}/${slug}`,
        updatedAt: exam.lastUpdated,
      });
    }
    return {};
  }
  if (segments.length === 2) {
    const [, slug] = segments;
    // Lookup by SLUG ONLY; the canonical below comes from the RECORD's category, never the
    // URL segment. A served record with no category has no public URL at this shape → no
    // metadata (the page 404s it), matching the pre-fix filtered lookup that returned null.
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar) && exam.category) {
      // Title year = current edition's year (current_edition_id), not the calendar year.
      const year = exam.currentEditionYear ?? getCurrentYear();
      return buildExamMetadata({
        pageType: "exam-entity",
        title: exam.seoTitle ?? `${exam.name} ${year} — Result, Date Sheet & Admission`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", year),
        keywords: buildPageKeywords({ pageType: "exam-entity", pillar: "university-exam", examSlug: slug }),
        canonicalUrl: `${siteConfig.url}/university-exam/${exam.category}/${slug}`,
        updatedAt: exam.lastUpdated,
      });
    }
    return {};
  }
  if (segments.length === 3) {
    const [, slug, seg3] = segments;
    // Record-driven canonical for BOTH the year and content-type forms (see the page's
    // category-canonical guard — a wrong URL segment 308s to this canonical).
    const exam = await getExamBySlug(slug);
    if (!exam || !SERVED_PILLARS.has(exam.pillar) || !exam.category) return {};
    // Year → edition page. Shared dispatch owns canonical → MAIN / noindex / 404-safe.
    if (isEditionYear(seg3)) {
      return buildEditionMetadata({
        slug,
        year: Number(seg3),
        absoluteBasePath: `${siteConfig.url}/university-exam/${exam.category}/${slug}`,
        servedPillars: SERVED_PILLARS,
      });
    }
    const contentType = seg3;
    return buildExamMetadata({
      pageType: "content-type",
      title: buildSEOTitle(exam.shortName, contentType, getCurrentYear()),
      description: buildMetaDescription(exam.name, contentType as ContentType, "", getCurrentYear()),
      canonicalUrl: `${siteConfig.url}/university-exam/${exam.category}/${slug}/${contentType}`,
      updatedAt: exam.lastUpdated,
    });
  }
  return {};
}

export default async function UniversityExamCatchAll({ params }: Props) {
  const { segments } = await params;

  // Single slug
  if (segments.length === 1) {
    const slug = segments[0];
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      const basePath = `/university-exam/${slug}`;
      const editions = await getExamEditionsForSwitcher(slug);
      const currentEd = editions.find((e) => e.isCurrent);
      const editionContext = currentEd ? buildEditionContext(editions, currentEd.year, basePath) : null;
      return (
        <EntityDetailPage exam={exam} editionContext={editionContext ?? undefined} breadcrumbs={[
          { name: "University Exam", href: "/university-exam" },
          { name: exam.shortName, href: basePath },
        ]} />
      );
    }
    // Try as category
    const catExams = await getExamsByCategory(slug);
    const filtered = catExams.filter(e => SERVED_PILLARS.has(e.pillar));
    if (filtered.length > 0) {
      const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">{label}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <Link key={e.id} href={`/university-exam/${e.category || slug}/${e.slug}`}
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

  // category/slug
  if (segments.length === 2) {
    const [category, slug] = segments;
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      // A served record with no category has no public URL at this shape (the filtered
      // pre-fix lookup 404ed it too) — and there is no canonical to redirect to.
      if (!exam.category) notFound();
      // Category-canonical (one 308 hop): the URL segment must EQUAL the record's category.
      // Loop-safe: the target's segment matches, so it renders 200.
      if (categoryMismatch(category, exam)) permanentRedirect(`/university-exam/${exam.category}/${slug}`);
      // Label and hrefs from the RECORD (categories.name verbatim), never the URL segment.
      const catLabel = categoryBreadcrumbLabel(exam, category);
      const basePath = `/university-exam/${exam.category}/${slug}`;
      const editions = await getExamEditionsForSwitcher(slug);
      const currentEd = editions.find((e) => e.isCurrent);
      const editionContext = currentEd ? buildEditionContext(editions, currentEd.year, basePath) : null;
      return (
        <EntityDetailPage exam={exam} editionContext={editionContext ?? undefined} breadcrumbs={[
          { name: "University Exam", href: "/university-exam" },
          { name: catLabel, href: `/university-exam/${exam.category}` },
          { name: exam.shortName, href: basePath },
        ]} />
      );
    }
    // Try slug as subcategory
    const subExams = await getExamsByCategory(slug);
    const filtered = subExams.filter(e => SERVED_PILLARS.has(e.pillar));
    if (filtered.length > 0) {
      const label = slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4">{label}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <Link key={e.id} href={`/university-exam/${e.category || category}/${e.slug}`}
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

  // category/slug/{contentType | year}
  if (segments.length === 3) {
    const [category, slug, seg3] = segments;

    // Category-canonical (one 308 hop) — covers BOTH the year and content-type forms;
    // the suffix is preserved. A served record with no category has no public URL here.
    {
      const rec = await getExamBySlug(slug);
      if (rec && SERVED_PILLARS.has(rec.pillar)) {
        if (!rec.category) notFound();
        if (categoryMismatch(category, rec)) permanentRedirect(`/university-exam/${rec.category}/${slug}/${seg3}`);
      }
    }

    // Year segment → a specific edition (see CORE INVARIANT: year is a label, not lifecycle).
    if (isEditionYear(seg3)) {
      const year = Number(seg3);
      const basePath = `/university-exam/${category}/${slug}`;
      return renderEditionPage({
        slug,
        year,
        basePath,
        absoluteBasePath: `${siteConfig.url}${basePath}`,
        servedPillars: SERVED_PILLARS,
        breadcrumbs: (exam, y) => [
          { name: "University Exam", href: "/university-exam" },
          { name: categoryBreadcrumbLabel(exam, category), href: `/university-exam/${exam.category ?? category}` },
          { name: exam.shortName, href: basePath },
          { name: String(y), href: `${basePath}/${y}` },
        ],
      });
    }

    const contentType = seg3;
    const exam = await getExamBySlug(slug, category);
    if (!exam || !SERVED_PILLARS.has(exam.pillar)) notFound();
    // Step 2 (c): 404 when this content type has no data. Shared async gate (incl. syllabus).
    if (!(await contentTypeAvailable(exam, contentType))) notFound();
    return (
      <EntityDetailPage exam={exam} contentType={contentType as ContentType} breadcrumbs={[
        { name: "University Exam", href: "/university-exam" },
        { name: categoryBreadcrumbLabel(exam, category), href: `/university-exam/${exam.category}` },
        { name: exam.shortName, href: `/university-exam/${exam.category}/${slug}` },
        { name: contentTypeLabel(contentType), href: `/university-exam/${exam.category}/${slug}/${contentType}` },
      ]} />
    );
  }

  notFound();
}
