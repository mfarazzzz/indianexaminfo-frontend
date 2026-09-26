import { NextResponse, type NextRequest } from "next/server";
import { getExamBySlug } from "@/services/examService";

export const revalidate = 900;
export const dynamicParams = true;

/**
 * LEGACY/DUPLICATE ROUTE — permanent 308 to the canonical university-exam form.
 * Mirrors the parent /board-exam/university/[slug] handler. Both content-type sub-pages AND
 * year/edition URLs are sent to the canonical /university-exam/{category}/{slug}/{seg} form,
 * where the university-exam/[...segments] route handles content types AND editions.
 *
 * Route HANDLER (not a page) so the redirect is a real network 308, never a streamed
 * 200 + <meta refresh> (which a page redirect degrades to under the root loading.tsx).
 *
 * `{contentType}` here may be a real content type (admit-card, result, …) OR a 4-digit year;
 * either way it is forwarded verbatim as the third canonical segment — the canonical route
 * disambiguates it exactly as it does for its own URLs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; contentType: string }> }
) {
  const { slug, contentType } = await params;
  const exam = await getExamBySlug(slug);

  if (!exam || exam.entityType !== "university-exam") {
    return new NextResponse(null, { status: 404 });
  }
  if (!exam.category) {
    return new NextResponse(null, { status: 404 });
  }

  const dest = new URL(`/university-exam/${exam.category}/${slug}/${contentType}`, request.url);
  return NextResponse.redirect(dest, 308);
}
