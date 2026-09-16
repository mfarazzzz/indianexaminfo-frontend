import { notFound, permanentRedirect } from "next/navigation";
import { getExamBySlug } from "@/services/examService";

export const revalidate = 900;

type Props = { params: Promise<{ slug: string; contentType: string }> };

/**
 * LEGACY/DUPLICATE ROUTE — permanently redirected to the canonical university-exam form.
 * Mirrors the parent /board-exam/university/[slug] redirect. Both content-type sub-pages AND
 * year/edition URLs are sent to the canonical /university-exam/{category}/{slug}/{seg} form,
 * where the university-exam/[...segments] route handles content types AND editions (via the
 * shared edition dispatch). We redirect the WHOLE segment straight to canonical rather than
 * chaining through the parent, so there is no multi-hop redirect and no loop (destination is
 * a different route family).
 *
 * `{contentType}` here may be a real content type (admit-card, result, …) OR a 4-digit year;
 * either way it is forwarded verbatim as the third canonical segment — the canonical route
 * disambiguates it exactly as it does for its own URLs.
 */
export default async function UniversityContentTypePage({ params }: Props) {
  const { slug, contentType } = await params;
  const exam = await getExamBySlug(slug);

  if (!exam || exam.entityType !== "university") notFound();
  if (!exam.category) notFound();

  permanentRedirect(`/university-exam/${exam.category}/${slug}/${contentType}`);
}
