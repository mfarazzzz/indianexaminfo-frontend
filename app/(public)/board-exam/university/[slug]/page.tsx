import { notFound, permanentRedirect } from "next/navigation";
import { getExamBySlug } from "@/services/examService";

export const revalidate = 3600;
export const dynamicParams = true; // serve new exams added after build without rebuilding

type Props = { params: Promise<{ slug: string }> };

/**
 * LEGACY/DUPLICATE ROUTE — permanently redirected to the canonical university-exam form.
 * University entities (pillar=university-exam, entity_type=university) are canonical at
 * /university-exam/{category}/{slug}. This /board-exam/university/{slug} form used to render
 * a self-canonical duplicate (indexable), causing duplicate-content. It now 301s to the
 * canonical, with the destination CATEGORY derived from the DB entity (never hardcoded).
 * No metadata is emitted for a redirecting route.
 *
 * Loop-safety: the destination is the university-exam/[...segments] route (a different route),
 * so this redirect cannot loop back here.
 */
export default async function UniversityPage({ params }: Props) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);

  // Not a real university entity → keep 404 (do not redirect a non-existent/other entity).
  if (!exam || exam.entityType !== "university") notFound();
  // Defensive: without a category we cannot build the canonical URL — 404 rather than emit a
  // malformed `/university-exam//{slug}`. (DB shows 0 null categories for this pillar.)
  if (!exam.category) notFound();

  permanentRedirect(`/university-exam/${exam.category}/${slug}`);
}
