/**
 * Catch-all route for /university-exam/[...segments]
 * Handles: /university-exam/{category}/{slug} and /university-exam/{category}/{slug}/{ct}
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getExamBySlug, getExamsByCategory, contentTypeAvailable, getExamEditionsForSwitcher } from "@/services/examService";
import { getContentPostsByExam } from "@/services/contentPostService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildSEOTitle, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { contentTypeLabel } from "@/lib/utils";
import { isEditionYear, buildEditionContext } from "@/lib/exam/editions";
import { buildEditionMetadata, renderEditionPage } from "@/lib/exam/editionDispatch";
import type { ContentType } from "@/types/exam";

export const revalidate = 3600;
export const dynamicParams = true;

const SERVED_PILLARS = new Set(["university-exam", "board-exam"]);

type Props = { params: Promise<{ segments: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  if (segments.length === 1) {
    const slug = segments[0];
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      return buildExamMetadata({
        pageType: "exam-entity",
        title: exam.seoTitle ?? `${exam.name} ${getCurrentYear()} — Result, Date Sheet & Admission`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", getCurrentYear()),
        canonicalUrl: `${siteConfig.url}/university-exam/${exam.category}/${slug}`,
        updatedAt: exam.lastUpdated,
      });
    }
    return {};
  }
  if (segments.length === 2) {
    const [category, slug] = segments;
    const exam = await getExamBySlug(slug, category);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      return buildExamMetadata({
        pageType: "exam-entity",
        title: exam.seoTitle ?? `${exam.name} ${getCurrentYear()} — Result, Date Sheet & Admission`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", getCurrentYear()),
        keywords: buildPageKeywords({ pageType: "exam-entity", pillar: "university-exam", examSlug: slug }),
        canonicalUrl: `${siteConfig.url}/university-exam/${category}/${slug}`,
        updatedAt: exam.lastUpdated,
      });
    }
    return {};
  }
  if (segments.length === 3) {
    const [category, slug, seg3] = segments;
    // Year → edition page. Shared dispatch owns canonical → MAIN / noindex / 404-safe.
    if (isEditionYear(seg3)) {
      return buildEditionMetadata({
        slug,
        year: Number(seg3),
        absoluteBasePath: `${siteConfig.url}/university-exam/${category}/${slug}`,
        servedPillars: SERVED_PILLARS,
      });
    }
    const contentType = seg3;
    const exam = await getExamBySlug(slug, category);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      return buildExamMetadata({
        pageType: "content-type",
        title: buildSEOTitle(exam.shortName, contentType, getCurrentYear()),
        description: buildMetaDescription(exam.name, contentType as ContentType, "", getCurrentYear()),
        canonicalUrl: `${siteConfig.url}/university-exam/${category}/${slug}/${contentType}`,
        updatedAt: exam.lastUpdated,
      });
    }
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
    const exam = await getExamBySlug(slug, category);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      const catLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const basePath = `/university-exam/${category}/${slug}`;
      const editions = await getExamEditionsForSwitcher(slug);
      const currentEd = editions.find((e) => e.isCurrent);
      const editionContext = currentEd ? buildEditionContext(editions, currentEd.year, basePath) : null;
      return (
        <EntityDetailPage exam={exam} editionContext={editionContext ?? undefined} breadcrumbs={[
          { name: "University Exam", href: "/university-exam" },
          { name: catLabel, href: `/university-exam/${category}` },
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

    // Year segment → a specific edition (see CORE INVARIANT: year is a label, not lifecycle).
    if (isEditionYear(seg3)) {
      const year = Number(seg3);
      const basePath = `/university-exam/${category}/${slug}`;
      const catLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return renderEditionPage({
        slug,
        year,
        basePath,
        absoluteBasePath: `${siteConfig.url}${basePath}`,
        servedPillars: SERVED_PILLARS,
        breadcrumbs: (exam, y) => [
          { name: "University Exam", href: "/university-exam" },
          { name: catLabel, href: `/university-exam/${category}` },
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
        { name: category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), href: `/university-exam/${category}` },
        { name: exam.shortName, href: `/university-exam/${category}/${slug}` },
        { name: contentTypeLabel(contentType), href: `/university-exam/${category}/${slug}/${contentType}` },
      ]} />
    );
  }

  notFound();
}
