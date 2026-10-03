import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getExamBySlug, getExamEditionsForSwitcher, getExamSlugsForPillar } from "@/services/examService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildEditionContext } from "@/lib/exam/editions";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, buildMetaDescription, getCurrentYear } from "@/lib/seo/keywords";
import { categoryBreadcrumbLabel, categoryMismatch } from "@/lib/exam/categoryCanonical";
import { siteConfig } from "@/config/site";

export const revalidate = 600; // 10 min — ensures new exams appear quickly
export const dynamicParams = true; // serve new exams added after build without rebuilding

// Prerender the published entrance exams so the segment enters the ISR Full Route
// Cache. Without generateStaticParams a dynamic segment renders fully dynamic (ƒ) even
// with revalidate > 0 — every request would re-run the page and return
// "private, no-cache, no-store". dynamicParams=true keeps on-demand generation for
// exams added after the build. Same pattern as sarkari-naukri/[...segments].
export async function generateStaticParams() {
  const items = await getExamSlugsForPillar("entrance-exam");
  return items
    .filter((i) => i.category)
    .map((i) => ({ category: i.category as string, slug: i.slug }));
}

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);
  // Canonical comes from the RECORD, never the URL. A category-less (or off-pillar)
  // record has no indexable public URL on this route → emit no metadata (the page
  // handler 404s it).
  if (!exam || exam.pillar !== "entrance-exam" || !exam.category) return {};
  const year = getCurrentYear();
  return buildExamMetadata({
    pageType: "exam-entity",
    title: exam.seoTitle ?? `${exam.name} ${year} — Notification, Eligibility & Apply`,
    description: exam.seoDescription ?? buildMetaDescription(exam.name, "notification", "", year),
    keywords: buildPageKeywords({ pageType: "exam-entity", pillar: exam.pillar, examSlug: slug }),
    canonicalUrl: `${siteConfig.url}/admission/${exam.category}/${slug}`,
    tags: exam.tags,
    updatedAt: exam.lastUpdated,
  });
}

export default async function EntranceExamEntityPage({ params }: Props) {
  const { category, slug } = await params;
  const exam = await getExamBySlug(slug);

  if (!exam || exam.pillar !== "entrance-exam") notFound();

  // A record with no category has no public URL on this pillar — there is no flat
  // /admission/<slug> route — so 404 rather than render at whatever segment was typed.
  if (!exam.category) notFound();
  // The URL category segment must EQUAL the record's category. When it does not, one
  // permanent (308) hop to the canonical /admission/<recordCategory>/<slug>. Loop-safe:
  // the target's segment now matches, so it renders 200.
  if (categoryMismatch(category, exam)) permanentRedirect(`/admission/${exam.category}/${slug}`);

  // Label from the RECORD (categories.name, verbatim) — never title-cased from the slug.
  const categoryLabel = categoryBreadcrumbLabel(exam, category);
  const basePath = `/admission/${exam.category}/${slug}`;

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
        { name: "Admissions", href: "/admission" },
        { name: categoryLabel, href: `/admission/${exam.category}` },
        { name: exam.shortName, href: basePath },
      ]}
      editionContext={editionContext ?? undefined}
    />
  );
}
