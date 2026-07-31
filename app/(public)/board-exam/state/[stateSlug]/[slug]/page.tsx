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

type Props = { params: Promise<{ stateSlug: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) return {};
  return buildExamMetadata({
    pageType: "board",
    title: exam.seoTitle ?? `${exam.shortName} ${getCurrentYear()} — Result, Date Sheet & Admit Card`,
    description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", getCurrentYear()),
    keywords: buildPageKeywords({ pageType: "board", pillar: "board-exam", examSlug: slug }),
    canonicalUrl: `${siteConfig.url}/board-exam/state/${stateSlug}/${slug}`,
    updatedAt: exam.lastUpdated,
  });
}

export default async function StateBoardExamPage({ params }: Props) {
  const { stateSlug, slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) notFound();

  const boardLabel = stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <EntityDetailPage
      exam={exam}
      breadcrumbs={[
        { name: "Board Exam", href: "/board-exam" },
        { name: boardLabel, href: `/board-exam/state/${stateSlug}` },
        { name: exam.shortName, href: `/board-exam/state/${stateSlug}/${slug}` },
      ]}
    />
  );
}
