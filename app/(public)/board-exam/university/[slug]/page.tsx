import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamBySlug } from "@/services/examService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import {
  buildPageKeywords, buildMetaDescription, getCurrentYear,
} from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;
export const dynamicParams = true; // serve new exams added after build without rebuilding

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return {};
  return buildExamMetadata({
    pageType: "university",
    title: exam.seoTitle ?? `${exam.shortName} ${getCurrentYear()} — Check Result & Date Sheet`,
    description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", getCurrentYear()),
    keywords: buildPageKeywords({ pageType: "university", pillar: "board-university", examSlug: slug }),
    canonicalUrl: `${siteConfig.url}/board-exam/university/${slug}`,
    updatedAt: exam.lastUpdated,
  });
}

export default async function UniversityPage({ params }: Props) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);

  if (!exam || exam.entityType !== "university") notFound();

  return (
    <EntityDetailPage
      exam={exam}
      breadcrumbs={[
        { name: "Board Exam", href: "/board-exam" },
        { name: "Universities", href: "/board-exam" },
        { name: exam.shortName, href: `/board-exam/university/${slug}` },
      ]}
    />
  );
}
