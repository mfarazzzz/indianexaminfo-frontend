import { NextResponse, type NextRequest } from "next/server";
import { getExamBySlug } from "@/services/examService";

export const revalidate = 3600;
export const dynamicParams = true; // serve new exams added after build without rebuilding

/**
 * LEGACY/DUPLICATE ROUTE — permanently 301/308-redirected to the canonical university-exam form.
 * University entities (pillar=university-exam, entity_type=university-exam) are canonical at
 * /university-exam/{category}/{slug}. This /board-exam/university/{slug} form used to render
 * a self-canonical duplicate (indexable), causing duplicate-content. It now issues a REAL
 * HTTP 308 to the canonical, with the destination CATEGORY derived from the DB entity.
 *
 * Implemented as a ROUTE HANDLER (not a page) on purpose: a page redirect streams through the
 * root loading.tsx / Suspense boundary and degrades to a 200 + <meta refresh> soft redirect.
 * A route handler has no such boundary, so `NextResponse.redirect(url, 308)` returns a true
 * network 308 with a Location header — the status crawlers need for link equity.
 *
 * Loop-safety: the destination is the university-exam/[...segments] route (a different route),
 * so this redirect cannot loop back here.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);

  // Not a real university entity → keep 404 (do not redirect a non-existent/other entity).
  if (!exam || exam.entityType !== "university-exam") {
    return new NextResponse(null, { status: 404 });
  }
  // Defensive: without a category we cannot build the canonical URL — 404 rather than emit a
  // malformed `/university-exam//{slug}`. (DB shows 0 null categories for this pillar.)
  if (!exam.category) {
    return new NextResponse(null, { status: 404 });
  }

  const dest = new URL(`/university-exam/${exam.category}/${slug}`, request.url);
  return NextResponse.redirect(dest, 308);
}
