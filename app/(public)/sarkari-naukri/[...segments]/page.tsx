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
import { getSarkariNaukriBySlug, generateStaticSarkariNaukriParams } from "@/services/sarkariNaukriService";
import { getExamBySlug } from "@/services/examService";
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
    if (exam && exam.pillar === "sarkari-naukri") {
      const year = getCurrentYear();
      return buildExamMetadata({
        pageType: "exam-entity",
        title: exam.seoTitle ?? `${exam.name} ${year} — Notification, Eligibility & Apply`,
        description: exam.seoDescription ?? buildMetaDescription(exam.name, "notification", "", year),
        keywords: buildPageKeywords({ pageType: "exam-entity", pillar: "sarkari-naukri", examSlug: slug }),
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
    if (!exam || exam.pillar !== "sarkari-naukri") return {};
    const year = getCurrentYear();
    return buildExamMetadata({
      pageType: "exam-entity",
      title: exam.seoTitle ?? `${exam.name} ${year} — Notification, Eligibility & Apply`,
      description: exam.seoDescription ?? buildMetaDescription(exam.name, "notification", "", year),
      keywords: buildPageKeywords({ pageType: "exam-entity", pillar: "sarkari-naukri", examSlug: slug }),
      canonicalUrl: `${siteConfig.url}/sarkari-naukri/${category}/${slug}`,
      tags: exam.tags,
      updatedAt: exam.lastUpdated,
    });
  }

  if (segments.length === 3) {
    // category/slug/contentType — content type page
    const [category, slug, contentType] = segments;
    const exam = await getExamBySlug(slug, category);
    if (!exam || exam.pillar !== "sarkari-naukri") return {};
    const year = getCurrentYear();
    return buildExamMetadata({
      pageType: "content-type",
      title: buildSEOTitle(exam.shortName, contentType, year),
      description: buildMetaDescription(exam.name, contentType as ContentType, "", year),
      keywords: buildPageKeywords({ pageType: "content-type", pillar: "sarkari-naukri", examSlug: slug, contentType: contentType as ContentType }),
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
    if (exam && exam.pillar === "sarkari-naukri") {
      if (exam.category) {
        redirect(`/sarkari-naukri/${exam.category}/${exam.slug}`);
      }
      // No category — render EntityDetailPage directly
      return (
        <EntityDetailPage
          exam={exam}
          breadcrumbs={[
            { name: "Sarkari Naukri", href: "/sarkari-naukri" },
            { name: exam.shortName, href: `/sarkari-naukri/${exam.slug}` },
          ]}
        />
      );
    }

    notFound();
  }

  // ─── Pattern 2: category/slug — Exam entity detail ──────────────────
  if (segments.length === 2) {
    const [category, slug] = segments;
    const exam = await getExamBySlug(slug, category);

    if (!exam || exam.pillar !== "sarkari-naukri") notFound();

    const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return (
      <EntityDetailPage
        exam={exam}
        breadcrumbs={[
          { name: "Sarkari Naukri", href: "/sarkari-naukri" },
          { name: categoryLabel, href: `/sarkari-naukri/${category}` },
          { name: exam.shortName, href: `/sarkari-naukri/${category}/${slug}` },
        ]}
      />
    );
  }

  // ─── Pattern 3: category/slug/contentType — Content type page ───────
  if (segments.length === 3) {
    const [category, slug, contentType] = segments;
    const exam = await getExamBySlug(slug, category);

    if (!exam || exam.pillar !== "sarkari-naukri") notFound();

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
