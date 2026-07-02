import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamBySlug, generateStaticExamParams } from "@/services/examService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildSEOTitle, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 7200;
export const dynamicParams = true; // serve new exams added after build without rebuilding

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateStaticParams() {
  return generateStaticExamParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return {};
  const year = getCurrentYear();

  return buildExamMetadata({
    pageType: "exam-entity",
    title: exam.seoTitle ?? `${exam.name} ${year} — Notification, Eligibility & Apply`,
    description: exam.seoDescription ?? buildMetaDescription(exam.name, "notification", "", year),
    keywords: buildPageKeywords({ pageType: "exam-entity", pillar: exam.pillar, examSlug: slug }),
    canonicalUrl: `${siteConfig.url}/sarkari-naukri/${category}/${slug}`,
    tags: exam.tags,
    updatedAt: exam.lastUpdated,
  });
}

export default async function ExamEntityPage({ params }: Props) {
  const { category, slug } = await params;
  const exam = await getExamBySlug(slug);

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
