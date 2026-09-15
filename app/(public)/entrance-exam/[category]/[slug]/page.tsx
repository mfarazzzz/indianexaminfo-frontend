import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamBySlug, getExamEditionsForSwitcher } from "@/services/examService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildEditionContext } from "@/lib/exam/editions";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 600; // 10 min — ensures new exams appear quickly
export const dynamicParams = true; // serve new exams added after build without rebuilding

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
  const basePath = `/entrance-exam/${category}/${slug}`;

  // Other-editions switcher on the MAIN page when >1 pillable edition exists. viewingYear =
  // the CURRENT edition's year (from is_current, NOT year order). buildEditionContext returns
  // null for ≤1 edition, so single-edition exams render no switcher. Same as sarkari-naukri.
  const editions = await getExamEditionsForSwitcher(slug);
  const currentEd = editions.find((e) => e.isCurrent);
  const editionContext = currentEd ? buildEditionContext(editions, currentEd.year, basePath) : null;

  return (
    <EntityDetailPage
      exam={exam}
      breadcrumbs={[
        { name: "Entrance Exam", href: "/entrance-exam" },
        { name: categoryLabel, href: `/entrance-exam/${category}` },
        { name: exam.shortName, href: basePath },
      ]}
      editionContext={editionContext ?? undefined}
    />
  );
}
