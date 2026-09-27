import { NextResponse, type NextRequest } from "next/server";
import { getExamBySlug } from "@/services/examService";
import { getExamEntityHref } from "@/lib/exam/actionLinks";
import { siteConfig } from "@/config/site";

// Dynamic, not ISR-cached: a cached redirect would keep pointing at an old URL
// for `revalidate` seconds after an exam's category/pillar changes. /go is a
// CMS-only link with little traffic — freshness costs nothing.
export const dynamic = "force-dynamic";

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

  // Base the absolute URL on siteConfig.url — the origin the canonicals and
  // sitemap already use. request.url is NOT trustworthy in production: the
  // Hostinger proxy does not forward Host, so it produced
  // Location: https://0.0.0.0:3000/... on the live site.
  const dest = new URL(getExamEntityHref({
    pillar: exam.pillar,
    category: exam.category,
    slug: exam.slug,
    entityType: exam.entityType,
  }), siteConfig.url);
  return NextResponse.redirect(dest, 308);
}
