import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamBySlug } from "@/services/examService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 7200;

type Props = { params: Promise<{ category: string; slug: string }> };

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
    canonicalUrl: `${siteConfig.url}/entrance-exam/${category}/${slug}`,
    tags: exam.tags,
    updatedAt: exam.lastUpdated,
  });
}

export default async function EntranceExamEntityPage({ params }: Props) {
  const { category, slug } = await params;
  const exam = await getExamBySlug(slug);

  if (!exam || exam.pillar !== "entrance-exam") notFound();

  const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <EntityDetailPage
      exam={exam}
      breadcrumbs={[
        { name: "Entrance Exam", href: "/entrance-exam" },
        { name: categoryLabel, href: `/entrance-exam/${category}` },
        { name: exam.shortName, href: `/entrance-exam/${category}/${slug}` },
      ]}
    />
  );
}
