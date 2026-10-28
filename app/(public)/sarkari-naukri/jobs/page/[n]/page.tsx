/**
 * /sarkari-naukri/jobs/page/N — the crawlable vacancy list (owner batch 4, K5).
 *
 * WHY THIS EXISTS. /sarkari-naukri ships its whole list to the client and shows the first 20
 * rows; "Load more" appends the rest in the browser. Googlebot runs JS, but a crawl that
 * follows LINKS never clicks — so every record below the fold had no in-link a crawler would
 * see. Batch 3 measured the cost: ~160 published vacancy records were orphan pages, present in
 * the sitemap but unreachable from any crawled page.
 *
 * The fix is path-based, server-rendered pagination: 20 rows per URL, real <a href> previous /
 * next / page-number links, every page self-canonical, prerendered at build and refreshed by
 * ISR. No `?page=` searchParams — a route that reads searchParams is DYNAMIC in App Router,
 * which would take these pages off the static path and change how the section is cached. The
 * client "Load more" on /sarkari-naukri stays exactly as it was: an enhancement for readers, no
 * longer the only way to reach row 21.
 *
 * These pages are deliberately NOT in the sitemap (owner decision): they are navigation, not
 * content, and the discovery path a crawler needs is
 * /sarkari-naukri (in the sitemap) → the page trail → every vacancy record.
 *
 * Page size, URL shape, page count and the anchor window all live in ONE place —
 * lib/sarkari/vacancyPages.ts — because /sarkari-naukri links into this chain too.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSarkariNaukri, getVacancySlugsInOrder } from "@/services/sarkariNaukriService";
import { getTodayIST } from "@/services/examService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";
import { SarkariNaukriList } from "@/components/sarkari-naukri/SarkariNaukriList";
import { SARKARI_LABELS } from "@/lib/sarkari/labels";
import { capPrerender } from "@/lib/build/prerender";
import {
  jobPageHref, pageTrail, parseVacancyPage, sliceForPage, vacancyPageCount, VACANCY_PAGE_SIZE,
} from "@/lib/sarkari/vacancyPages";

export const revalidate = 1800;
export const dynamicParams = true;

/**
 * Upper bound on prerendered pages. The count is total/20 (~10-15 today) and every page shares
 * the SAME two cached reads (getVacancySlugsInOrder + getAllSarkariNaukri), so the build cost
 * here is rendering, not a query per page. The cap exists so a corpus that grew 10× could not
 * silently grow the build the way the record pages do.
 */
const MAX_PRERENDERED_PAGES = 60;

export async function generateStaticParams(): Promise<{ n: string }[]> {
  // Build-safe on purpose: a failed read at BUILD time must not fail the whole build (the same
  // rule generateStaticSarkariNaukriParams follows). Prerender nothing and let dynamicParams
  // serve the page on request — where K4 applies and a failed read is a retryable 5xx, not an
  // empty list.
  let slugs: string[];
  try {
    slugs = await getVacancySlugsInOrder();
  } catch (err) {
    console.error("[jobs/page] generateStaticParams: read failed, prerendering no pages:", err);
    return [];
  }
  const pages = vacancyPageCount(slugs.length);
  return capPrerender(
    Array.from({ length: pages }, (_, i) => ({ n: String(i + 1) })),
    MAX_PRERENDERED_PAGES,
  );
}

type Props = { params: Promise<{ n: string }> };

/** True only for a page that really exists — "/page/0", "/page/2.5", "/page/99" do not. */
function pageExists(page: number, pages: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= pages;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  const page = parseVacancyPage(n);
  let slugs: string[] = [];
  try {
    slugs = await getVacancySlugsInOrder();
  } catch {
    slugs = [];   // metadata must never be the reason a render fails; the handler still answers honestly
  }
  const pages = vacancyPageCount(slugs.length);
  if (!pageExists(page, pages)) return {};      // the page handler 404s it

  const from = (page - 1) * VACANCY_PAGE_SIZE + 1;
  const to = Math.min(page * VACANCY_PAGE_SIZE, slugs.length);
  return buildExamMetadata({
    pageType: "category",
    title: `Sarkari Naukri Jobs List — Page ${page} of ${pages}`,
    description: `Government job and recruitment records ${from} to ${to} of ${slugs.length} on IndianExamInfo — last dates to apply, admit card and result dates, with official apply links.`,
    canonicalUrl: `${siteConfig.url}${jobPageHref(page)}`,
  });
}

export default async function VacancyListPage({ params }: Props) {
  const { n } = await params;
  const page = parseVacancyPage(n);

  const slugs = await getVacancySlugsInOrder();   // K4: a failed read throws, it is not "no jobs"
  const pages = vacancyPageCount(slugs.length);
  if (!pageExists(page, pages)) notFound();

  const slice = sliceForPage(slugs, page);
  const [items, todayISO] = await Promise.all([getAllSarkariNaukri(), getTodayIST()]);
  const bySlug = new Map(items.map((i) => [i.slug, i]));
  // The slug order is the pagination contract; the rows come from the normal published read.
  // A slug in one read and not the other (published between the two) simply drops out of this
  // regeneration rather than rendering a record that no longer exists.
  const rows = slice.map((s) => bySlug.get(s)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  if (rows.length < slice.length) {
    // Loud, because the silent version is a page that simply shows fewer records. The spine
    // (getVacancySlugsInOrder) is unbounded; getAllSarkariNaukri caps its list read at
    // LIST_LIMIT, so past that size the corpus outgrows the shared read and the tail of every
    // page would quietly disappear.
    console.warn(
      `[jobs/page] page ${page}: ${slice.length - rows.length} of ${slice.length} slugs had no row `
      + `in getAllSarkariNaukri() — that list read is capped (LIST_LIMIT). Raise it or the tail `
      + `of the corpus will not render.`,
    );
  }
  const numbers = pageTrail(page, pages);

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: SARKARI_LABELS.root, href: "/sarkari-naukri" },
        { name: `Jobs list — page ${page}`, href: jobPageHref(page) },
      ]} />

      <AdSlot position="category-top" size="728x90" hideWhenEmpty />

      <main className="max-w-4xl">
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
          Sarkari Naukri Jobs — Page {page} of {pages}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {slugs.length} published recruitments, 20 to a page. This is the page-by-page list;
          the main{" "}
          <Link href="/sarkari-naukri" className="text-primary hover:underline">
            {SARKARI_LABELS.root}
          </Link>{" "}
          page shows the same records ordered by urgency.
        </p>

        {rows.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No entries on this page.</p>
        ) : (
          <SarkariNaukriList items={rows} todayISO={todayISO} />
        )}

        {/* Real anchors: a crawler that does not run JavaScript still walks the whole list. */}
        <nav aria-label="Vacancy list pages" className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          {page > 1 ? (
            <Link href={jobPageHref(page - 1)} rel="prev" className="rounded border border-border bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
              ← Previous
            </Link>
          ) : (
            <span aria-disabled="true" className="rounded border border-border bg-gray-50 px-4 py-2 font-semibold text-gray-300">← Previous</span>
          )}

          {numbers.map((p) => (
            <Link
              key={p}
              href={jobPageHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={`rounded px-3 py-1.5 font-semibold ${p === page ? "bg-primary text-white" : "border border-border bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {p}
            </Link>
          ))}

          {page < pages ? (
            <Link href={jobPageHref(page + 1)} rel="next" className="rounded border border-border bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
              Next →
            </Link>
          ) : (
            <span aria-disabled="true" className="rounded border border-border bg-gray-50 px-4 py-2 font-semibold text-gray-300">Next →</span>
          )}
        </nav>
      </main>
    </div>
  );
}
