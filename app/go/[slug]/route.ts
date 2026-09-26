import { NextResponse, type NextRequest } from "next/server";
import { getExamBySlug } from "@/services/examService";
import { getExamEntityHref } from "@/lib/exam/actionLinks";

export const revalidate = 3600;
export const dynamicParams = true;

/**
 * /go/{slug} — canonical-URL resolver for the CMS "View on site" button.
 *
 * The CMS must NOT build public URLs (that fact — pillar → URL segment — lives in
 * the frontend only, in pillarToUrlSegment). Instead the CMS links to /go/{slug};
 * this handler looks the record up and 308s to its real canonical URL, built by
 * the same getExamEntityHref every on-site link uses. So the mapping has one home.
 *
 * A route HANDLER (not a page) so the redirect is a true network 308, never a
 * streamed 200 + <meta refresh> (which a page redirect degrades to under a
 * loading.tsx / Suspense boundary). exams.slug is UNIQUE (exams_slug_key), so a
 * slug resolves to exactly one record across all pillars.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const exam = await getExamBySlug(slug);

  if (!exam) {
    return new NextResponse(null, { status: 404 });
  }

  const dest = new URL(getExamEntityHref({
    pillar: exam.pillar,
    category: exam.category,
    slug: exam.slug,
    entityType: exam.entityType,
  }), request.url);
  return NextResponse.redirect(dest, 308);
}
