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
import { notFound } from "next/navigation";
import Link from "next/link";
import { getExamBySlug, getExamsByCategory } from "@/services/examService";
import { getContentPostsByExam, getLatestByContentType } from "@/services/contentPostService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildSEOTitle, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { contentTypeLabel } from "@/lib/utils";
import type { ContentType } from "@/types/exam";

export const revalidate = 3600;
export const dynamicParams = true;

/** Pillars served by this route */
const SERVED_PILLARS = new Set(["board-exam", "board-exam"]);

type Props = { params: Promise<{ segments: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;

  if (segments.length === 1) {
    const slug = segments[0];
    const exam = await getExamBySlug(slug);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      return buildExamMetadata({
        pageType: "exam-entity",
        title: exam.seoTitle ?? `${exam.name} ${getCurrentYear()}`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", getCurrentYear()),
        canonicalUrl: `${siteConfig.url}/board-exam/${exam.category}/${slug}`,
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
        title: exam.seoTitle ?? `${exam.name} ${getCurrentYear()} — Result, Date Sheet & Syllabus`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", getCurrentYear()),
        keywords: buildPageKeywords({ pageType: "exam-entity", pillar: "board-exam", examSlug: slug }),
        canonicalUrl: `${siteConfig.url}/board-exam/${category}/${slug}`,
        updatedAt: exam.lastUpdated,
      });
    }
    return {};
  }

  if (segments.length === 3) {
    const [category, slug, contentType] = segments;
    const exam = await getExamBySlug(slug, category);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      return buildExamMetadata({
        pageType: "content-type",
        title: buildSEOTitle(exam.shortName, contentType, getCurrentYear()),
        description: buildMetaDescription(exam.name, contentType as ContentType, "", getCurrentYear()),
        canonicalUrl: `${siteConfig.url}/board-exam/${category}/${slug}/${contentType}`,
        updatedAt: exam.lastUpdated,
      });
    }
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
      return (
        <EntityDetailPage
          exam={exam}
          breadcrumbs={[
            { name: "Board Exam", href: "/board-exam" },
            { name: exam.shortName, href: `/board-exam/${slug}` },
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

  // Pattern 2: category/slug — entity detail
  if (segments.length === 2) {
    const [category, slug] = segments;
    const exam = await getExamBySlug(slug, category);
    if (exam && SERVED_PILLARS.has(exam.pillar)) {
      const catLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return (
        <EntityDetailPage
          exam={exam}
          breadcrumbs={[
            { name: "Board Exam", href: "/board-exam" },
            { name: catLabel, href: `/board-exam/${category}` },
            { name: exam.shortName, href: `/board-exam/${category}/${slug}` },
          ]}
        />
      );
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

  // Pattern 3: category/slug/contentType — content type page
  if (segments.length === 3) {
    const [category, slug, contentType] = segments;
    const exam = await getExamBySlug(slug, category);
    if (!exam || !SERVED_PILLARS.has(exam.pillar)) notFound();

    const posts = await getContentPostsByExam(exam.id, contentType as ContentType);
    const post = posts[0];
    const ctLabel = contentTypeLabel(contentType);

    // Render EntityDetailPage with content type focus (reuse existing component)
    return (
      <EntityDetailPage
        exam={exam}
        breadcrumbs={[
          { name: "Board Exam", href: "/board-exam" },
          { name: category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), href: `/board-exam/${category}` },
          { name: exam.shortName, href: `/board-exam/${category}/${slug}` },
          { name: ctLabel, href: `/board-exam/${category}/${slug}/${contentType}` },
        ]}
      />
    );
  }

  notFound();
}
