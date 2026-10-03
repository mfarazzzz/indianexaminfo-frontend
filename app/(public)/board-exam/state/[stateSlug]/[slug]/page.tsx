import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getExamBySlug, getExamEditionsForSwitcher, getExamSlugsForPillar } from "@/services/examService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildEditionContext } from "@/lib/exam/editions";
import { buildExamMetadata } from "@/lib/seo/metadata";
import {
  buildPageKeywords, buildMetaDescription, getCurrentYear,
} from "@/lib/seo/keywords";
import { categoryBreadcrumbLabel, categoryMismatch } from "@/lib/exam/categoryCanonical";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;
export const dynamicParams = true; // serve boards added after build without rebuilding

// Prerender published board exams so this segment enters the ISR Full Route Cache.
// Without generateStaticParams the dynamic segment renders fully dynamic (ƒ) even with
// revalidate > 0, returning "private, no-cache, no-store" on every request. stateSlug is
// the exam's parent category slug (the ONE canonical URL builder maps board →
// /board-exam/state/{category}/{slug}). Same pattern as sarkari-naukri.
export async function generateStaticParams() {
  const items = await getExamSlugsForPillar("board-exam");
  return items
    .filter((i) => i.category)
    .map((i) => ({ stateSlug: i.category as string, slug: i.slug }));
}

type Props = { params: Promise<{ stateSlug: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  // Canonical from the RECORD, never the URL. A board record with no category has no
  // public URL at this shape (the flat /board-exam/<slug> route is its home) → no metadata.
  if (!exam || !exam.category) return {};
  return buildExamMetadata({
    pageType: "board",
    title: exam.seoTitle ?? `${exam.shortName} ${getCurrentYear()} — Result, Date Sheet & Admit Card`,
    description: exam.seoDescription ?? buildMetaDescription(exam.name, "result", "", getCurrentYear()),
    keywords: buildPageKeywords({ pageType: "board", pillar: "board-exam", examSlug: slug }),
    canonicalUrl: `${siteConfig.url}/board-exam/state/${exam.category}/${slug}`,
    updatedAt: exam.lastUpdated,
  });
}

export default async function StateBoardExamPage({ params }: Props) {
  const { stateSlug, slug } = await params;
  const exam = await getExamBySlug(slug);
  if (!exam) notFound();

  // A board record with no category has no public URL at this shape — 404, matching the
  // owner rule (no category ⇒ no canonical state segment to route under).
  if (!exam.category) notFound();
  // Category-canonical (one 308 hop): the URL state segment must EQUAL the record's
  // category. Loop-safe: the target's segment matches, so it renders 200.
  if (categoryMismatch(stateSlug, exam)) permanentRedirect(`/board-exam/state/${exam.category}/${slug}`);

  // Label from the RECORD (categories.name, verbatim) — never title-cased from the URL slug.
  const boardLabel = categoryBreadcrumbLabel(exam, stateSlug);
  const basePath = `/board-exam/state/${exam.category}/${slug}`;

  // Other-editions switcher on the MAIN page (null for ≤1 edition). Same rule as every pillar.
  const editions = await getExamEditionsForSwitcher(slug);
  const currentEd = editions.find((e) => e.isCurrent);
  const editionContext = currentEd ? buildEditionContext(editions, currentEd.year, basePath) : null;

  return (
    <EntityDetailPage
      exam={exam}
      breadcrumbs={[
        { name: "Board Exam", href: "/board-exam" },
        { name: boardLabel, href: `/board-exam/state/${exam.category}` },
        { name: exam.shortName, href: basePath },
      ]}
      editionContext={editionContext ?? undefined}
    />
  );
}
