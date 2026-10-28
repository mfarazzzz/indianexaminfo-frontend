import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllExams } from "@/services/examService";
import { getAllBlogPosts } from "@/services/blogService";
import { getAllPublishedPages } from "@/services/pageService";
import {
  getSarkariNaukriSitemapEntries,
} from "@/services/sarkariNaukriService";
import { getRegionsWithRecords } from "@/services/regionService";
import { HIGH_PRIORITY_SLUGS } from "@/lib/seo/keywords";
import { contentTypeHasData, type HasDataView } from "@/lib/sectionRegistry";
import { ctPagesWithOwnContent, examPostUpdatedAts } from "@/services/contentPostService";
import { ctCanonicalVerdict } from "@/lib/seo/canonicalOwnership";
import { pillarToUrlSegment } from "@/lib/exam/pillarUrl";
import { CONTENT_HUBS, resolveHubPresence, resolveHubLatestDates } from "@/lib/hubs/contentHubs";
import { resolveLastUpdated, latestContentDate } from "@/lib/exam/lastUpdated";
import { isRoutableAuthorSlug } from "@/data/authors";
import { isTestSlug } from "@/lib/testContent";
import { pathIsRedirectSource } from "@/config/redirects";
import { getContentTypesByExam } from "@/services/contentTypesService";
import type { ContentType } from "@/types/exam";

const BASE = siteConfig.url;
export const revalidate = 3600;

/** changeFrequency per content type */
function ctFreq(ct: ContentType): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (ct === "admit-card" || ct === "result") return "hourly";
  if (ct === "answer-key" || ct === "notification" || ct === "application" || ct === "date-sheet") return "daily";
  return "weekly";
}

/** Priority — high for top exams, standard for others */
function ctPriority(slug: string, isHighValue: boolean): number {
  return isHighValue ? 0.95 : 0.85;
}

type SitemapExam = { pillar: string; category: string; slug: string };

/**
 * Honest <lastmod> (owner reader-trust fix, 23 Oct). The live sitemap stamped EVERY URL
 * with the build/now time — a false freshness claim to Google. Every lastmod here comes
 * from a REAL content date or the key is OMITTED entirely; the build time / "now" is never
 * used.
 *   • exam URLs → the D2 trustworthy rule (lib/exam/lastUpdated#resolveLastUpdated): the
 *     newest of a HUMAN edition edit, a published update, or a verification.
 *   • hub URLs → the newest trustworthy date among the rows the hub lists.
 *   • static / landing / list pages → omitted (no single honest content date).
 * Returning null means "omit"; callers spread `lm(...)` which adds the key only when set.
 */
function examTrustworthyIso(
  exam: { editionUpdatedAt?: string | null; editionUpdatedBy?: string | null; verifiedAt?: string | null },
  postDates: string[],
): string | null {
  return resolveLastUpdated({
    editionUpdatedAt: exam.editionUpdatedAt ?? null,
    editionUpdatedBy: exam.editionUpdatedBy ?? null,
    verifiedAt: exam.verifiedAt ?? null,
    postUpdatedAts: postDates,
  });
}

/** `lastModified` ONLY when there is a real date — never a fabricated/now timestamp. */
function lm(iso: string | null | undefined): { lastModified: Date } | Record<string, never> {
  return iso ? { lastModified: new Date(iso) } : {};
}

/**
 * Category slugs whose hub URL 308s somewhere else (config/redirects.ts — the ONE rule list
 * the router and this generator now read, K3). A redirecting URL is never a self-canonical
 * page, so neither the hub nor the rows filed under it are submitted:
 *   /sarkari-naukri/central-government-jobs → /sarkari-naukri/exam
 *   /sarkari-naukri/state-government-jobs   → /sarkari-naukri/bharti
 * banking / railways / defence / teaching are NOT in this set any more (owner batch 4, K3,
 * "stop withholding defence|railways|banking|teaching and submit the winners"): those hubs
 * render a real self-canonical listing, and cds-exam, nda-exam and rpf-constable — the WINNERS
 * of the retire pairs — live on those slugs and were invisible to a sitemap-scoped crawl.
 * central/state rows stay withheld: their PARENT is a 308, so a submitted child would have no
 * sitemap parent — that is a separate decision, reported to the owner with its row count
 * rather than changed silently. Every URL emitted is still checked against the whole rule list
 * by `submitted()` below, so an exact retire/legacy source can never slip through.
 */
const REDIRECTING_CATEGORY_SLUGS = new Set([
  "central-government-jobs",
  "state-government-jobs",
]);

/**
 * Category hubs (owner batch 3, F4 — orphan/crawlability fix; widened by K1 in batch 4).
 * Pillars whose /{segment}/{category} page renders a listing of EVERY exam in that
 * category (uncapped ExamListRow loop) and is SELF-CANONICAL. Submitting the hub is what
 * makes the hub-and-spoke real: without it the parent listing exists but is not in the
 * sitemap, so a crawl that starts from the sitemap sees the child pages as orphans
 * (9 flagship exam pages were exactly that: linked only from a hub the sitemap omitted).
 * board-exam and university-exam were withheld in batch 3 for an honest reason — those hubs
 * answered 200 while declaring the HOME canonical (the F1 omission class), so submitting them
 * would have made the sitemap contradict the page. K1 removed the root blanket canonical and
 * gave both hub shapes their OWN canonical, which is the condition the owner set for letting
 * them in; the router itself verifies it (e2e/sitemap-no-404.e2e.spec.ts reads the status AND
 * the <link rel=canonical> of every submitted URL).
 */
const CATEGORY_HUB_PILLARS = new Set([
  "government-exam", "govt-vacancy", "entrance-exam", "board-exam", "university-exam",
]);

/**
 * True when an exam row can produce a well-formed, non-redirecting URL.
 * Rows with no category would yield `/{pillar}//{slug}` (double slash), and
 * rows on a slug whose hub 308s would yield a child of a redirect.
 * A reference TEST row never belongs in the index either (the same `zz-test-`
 * rule that makes its page noindex — lib/testContent.ts): most readers already
 * filter it in the service layer, the sitemap is the aggregate that must not
 * depend on every source remembering to.
 */
function isSitemapEligible(exam: SitemapExam): boolean {
  if (!exam.slug) return false;
  if (isTestSlug(exam.slug)) return false;
  if (!exam.category) return false;
  if (exam.pillar === "government-exam" && REDIRECTING_CATEGORY_SLUGS.has(exam.category)) return false;
  // K3: a row whose OWN page URL is a redirect source (a retired duplicate, a year-suffixed
  // admission slug, an E3 typo slug) is withheld here so its content-type and edition
  // children — which are not themselves rule sources but live behind a 308 — are withheld
  // with it. The final `submitted()` filter still catches every URL individually.
  if (pathIsRedirectSource(examUrl(exam))) return false;
  return true;
}

/** The category hub that lists this exam, in the shape the router actually serves. */
function hubUrl(exam: SitemapExam): string {
  // Board exams are always state boards: the listing lives at /board-exam/state/{category},
  // which is where /board-exam/{category}/{slug} 308s to (see the board catch-all).
  if (exam.pillar === "board-exam") {
    return `${BASE}/board-exam/state/${exam.category}`;
  }
  return `${BASE}/${pillarToUrlSegment(exam.pillar)}/${exam.category}`;
}

/** Map exam entity to its canonical URL. Callers must gate on isSitemapEligible(). */
function examUrl(exam: SitemapExam): string {
  if (exam.pillar === "board-exam") {
    // Board exams are always state boards. (Universities are the university-exam
    // pillar with their own canonical URL and never appear under board-exam.)
    return `${BASE}/board-exam/state/${exam.category}/${exam.slug}`;
  }
  // Pillar → public segment via the single authority (entrance-exam → admission,
  // government-exam/govt-vacancy → sarkari-naukri).
  return `${BASE}/${pillarToUrlSegment(exam.pillar)}/${exam.category}/${exam.slug}`;
}

/** Content type URL */
function ctUrl(exam: SitemapExam, ct: ContentType): string {
  if (exam.pillar === "board-exam") {
    return `${BASE}/board-exam/state/${exam.category}/${exam.slug}/${ct}`;
  }
  return `${BASE}/${pillarToUrlSegment(exam.pillar)}/${exam.category}/${exam.slug}/${ct}`;
}

/** All applicable content-type flags on exam */
const CT_FLAGS: { ct: ContentType; flag: string }[] = [
  { ct: "notification",      flag: "hasNotification" },
  { ct: "application",       flag: "hasApplication" },
  { ct: "admit-card",        flag: "hasAdmitCard" },
  { ct: "result",            flag: "hasResult" },
  { ct: "answer-key",        flag: "hasAnswerKey" },
  { ct: "date-sheet",        flag: "hasDateSheet" },
  { ct: "syllabus",          flag: "hasSyllabus" },
  { ct: "cutoff",            flag: "hasCutoff" },
  { ct: "previous-papers",   flag: "hasPreviousPapers" },
  { ct: "mock-test",         flag: "hasMockTest" },
  { ct: "study-material",    flag: "hasStudyMaterial" },
];

/**
 * CMS `pages` slugs that a FRONTEND ROUTE actually renders, mapped to that route's path.
 * (owner batch 3, F2.) The block below used to submit `/{slug}` for every published CMS
 * page — but no route renders an arbitrary page row: the only readers are
 * about / privacy-policy / disclaimer, each calling `getPageBySlug()` from its own
 * page.tsx. A newly published CMS page (the live one was slug `test`) therefore entered
 * the sitemap as a guaranteed 404. This map IS the router's real capability: add an entry
 * only together with the route that renders it, and the sitemap stays 404-free.
 * Those three routes are already submitted by `staticPages`, so nothing duplicates.
 */
export const ROUTABLE_CMS_PAGE_PATHS: Record<string, string> = {
  "about": "/about",
  "privacy-policy": "/privacy-policy",
  "disclaimer": "/disclaimer",
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [exams, blogPosts, cmsPages, sarkariEntries, regionsWithRecords, ctOwnContent, postDates] = await Promise.all([
    getAllExams(),
    getAllBlogPosts(),
    getAllPublishedPages(),
    getSarkariNaukriSitemapEntries(),
    getRegionsWithRecords(),
    // Canonical ownership (P1 item 14): which CT pages carry their own update content.
    ctPagesWithOwnContent(),
    // Trustworthy freshness: newest published update date per exam (one resolveLastUpdated source).
    examPostUpdatedAts(),
  ]);

  // ── Content-type hubs ────────────────────────────
  // Submitted ONLY while a hub actually renders a record — the SAME one rule
  // (lib/hubs/contentHubs) that noindexes the page and drops it from the
  // homepage strip, menus and sidebars. An empty hub leaves the sitemap and
  // re-enters automatically the day it gains content (mirrors the board-exam
  // suppression precedent below). Structural dead ends are never present.
  // lastmod = the newest trustworthy content date among the rows the hub lists, or omitted.
  const [hubPresence, hubDates] = await Promise.all([resolveHubPresence(), resolveHubLatestDates()]);
  const hubFreq: Partial<Record<string, MetadataRoute.Sitemap[number]["changeFrequency"]>> = {
    "/admit-card": "hourly", "/results": "hourly", "/answer-key": "hourly",
    "/syllabus": "daily", "/date-sheet": "daily", "/previous-papers": "weekly",
    "/study-material": "weekly", "/mock-test": "weekly",
  };
  const hubPriority: Record<string, number> = {
    "/admit-card": 0.9, "/results": 0.9, "/answer-key": 0.9,
    "/syllabus": 0.8, "/date-sheet": 0.8, "/previous-papers": 0.7,
    "/study-material": 0.7, "/mock-test": 0.7,
  };
  const hubPages: MetadataRoute.Sitemap = CONTENT_HUBS
    .filter((h) => hubPresence[h.href])
    .map((h) => ({
      url: `${BASE}${h.href}`,
      ...lm(hubDates[h.href]),
      changeFrequency: hubFreq[h.href] ?? "weekly",
      priority: hubPriority[h.href] ?? 0.7,
    }));

  // ── Static pages ─────────────────────────────────
  // No single honest content date → lastmod omitted entirely (never the build time).
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/sarkari-naukri`,    changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/admission`,         changeFrequency: "daily",   priority: 0.9 },
  // ── Board & University section ──────────────────────────────
  // Pillar has 0 rows currently. Suppress its pages from the
  // sitemap until we actually populate it. The hub page itself
  // stays (it renders a placeholder UX) but the non-existent
  // boards don't belong in the sitemap.
  // { url: `${BASE}/board-exam`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/blog`,              changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/about`,             changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/contact`,           changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy-policy`,    changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/disclaimer`,        changeFrequency: "monthly", priority: 0.3 },
  ];

  // ── Content-type data gate: the view when it answers, the old rule when it does not ──
  // getAllExams() omits exam_editions.content_modules, so contentTypeHasData() can only
  // ever say "no" for an editorial section on this path — that is the blind spot
  // public.exam_content_types_with_data (migration 20261028165448) exists to close: the
  // SAME evaluator runs inside Postgres and returns one small text[] per exam.
  // It is an optimisation, never a dependency: a missing RPC or a read failure yields
  // null and the gate below reverts to the previous behaviour, and an exam the view simply
  // has no row for also falls back rather than losing every sub-page silently.
  const contentTypesFromView = await getContentTypesByExam(exams.map((e) => e.id as string));
  const ctHasData = (exam: { id?: unknown; slug?: string }, ct: ContentType): boolean => {
    const fromView = contentTypesFromView?.[exam.id as string];
    if (Array.isArray(fromView)) return fromView.includes(ct);
    return contentTypeHasData(exam as unknown as HasDataView, ct);
  };

  // ── Exam entity pages + content-type sub-pages ───
  const examPages: MetadataRoute.Sitemap = exams.filter(isSitemapEligible).flatMap((exam) => {
    const isHigh = HIGH_PRIORITY_SLUGS.has(exam.slug);
    // Honest lastmod from the D2 trustworthy rule; omitted when no trustworthy source.
    const lmIso = examTrustworthyIso(exam, postDates[exam.id as string] ?? []);

    const base: MetadataRoute.Sitemap[number] = {
      url: examUrl(exam),
      ...lm(lmIso),
      changeFrequency: "weekly",
      priority: isHigh ? 0.9 : 0.8,
    };

    // Step 2 (b): CT sub-page URLs are emitted iff the section has data — the
    // SAME registry gate that drives tabs and route 404s. Prevents ~1,900 empty
    // sub-pages from being submitted to search (see REBUILD_PLAN Step 2).
    //
    // P1 item 14 adds the second gate: a CT URL is submitted ONLY when it is
    // self-canonical under the same rule the page's own <link rel="canonical"> uses
    // (lib/seo/canonicalOwnership). Submitting a URL that points elsewhere makes the
    // sitemap contradict the page, so a non-self-canonical copy stays out — the main
    // page is submitted instead, and the CT URL remains reachable for anyone who has it.
    const own = ctOwnContent[exam.id as string];
    const ownSet = own ? new Set(own) : undefined;
    const ctPages: MetadataRoute.Sitemap = CT_FLAGS
      .filter(({ ct }) => ctHasData(exam, ct))
      .filter(({ ct }) => ctCanonicalVerdict({ contentType: ct, update: ownSet?.has(ct) ? { content: "x" } : null }).selfCanonical)
      .map(({ ct }) => ({
        url: ctUrl(exam, ct),
        ...lm(lmIso),
        changeFrequency: ctFreq(ct),
        priority: ctPriority(exam.slug, isHigh),
      }));

    return [base, ...ctPages];
  });

  // ── Non-current edition (year) pages: NOT submitted (owner batch 4, K3) ──────────
  // The generator used to emit `{examUrl}/{year}` for every content-bearing non-current
  // edition. The router answers those URLs differently: lib/exam/editionDispatch
  // #buildEditionMetadata gives a non-current edition the MAIN exam URL as its canonical and
  // noindex: true ("canonical → the MAIN exam URL (never self)", by design since the edition
  // work). So every submitted year URL was a sitemap claim the page contradicts twice over —
  // a canonical pointing elsewhere AND a noindex the sitemap ignores. Measured against the
  // production build by e2e/sitemap-no-404.e2e.spec.ts (the strict pass): 3 edition URLs were
  // in the sitemap, and 3 of 3 declared the parent exam page as their canonical
  //   /sarkari-naukri/banking/ibps-clerk/2026   → canonical …/ibps-clerk
  //   /sarkari-naukri/railways/rrb-ntpc/2026    → canonical …/rrb-ntpc
  //   /board-exam/state/up-board/up-board-class-10/2026 → canonical …/up-board-class-10
  // The pages stay linked from the edition switcher and reachable by anyone who has the URL;
  // what stopped is the sitemap telling Google they are indexable canonical pages.
  // getEditionSitemapEntries() is kept (the switcher and future rules use the same
  // content-bearing predicate) but it no longer feeds the sitemap.

  // ── Blog section pages ────────────────────────────
  // lastmod = the newest post updatedAt in that section (a real content date); omitted
  // when the section has no posts.
  const bySection = new Map<string, string[]>();
  for (const post of blogPosts) {
    (bySection.get(post.section) ?? bySection.set(post.section, []).get(post.section)!).push(post.updatedAt);
  }
  const blogSections = ["education-news","exam-prep","career-guidance","scholarship","study-abroad","edtech","student-life","opinion"];
  const blogSectionPages: MetadataRoute.Sitemap = blogSections.map((s) => ({
    url: `${BASE}/blog/${s}`,
    ...lm(latestContentDate(bySection.get(s) ?? [])),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // ── Blog post pages ───────────────────────────────
  // A post's own updated_at is a real content date — keep it.
  const blogPostPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.section}/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ── CMS custom pages ─────────────────────────────
  // Only a page whose slug a frontend route renders can be submitted (F2): a CMS page
  // row with no route is a 404 the moment it is published. Routes that already appear
  // in `staticPages` are skipped so the same URL is never listed twice.
  const staticPaths = new Set(staticPages.map((s) => s.url));
  const systemSlugs = new Set(["about", "contact", "privacy-policy", "disclaimer"]);
  const cmsPageEntries: MetadataRoute.Sitemap = cmsPages
    .filter((p) => !systemSlugs.has(p.slug)) // system pages already in staticPages
    .filter((p) => ROUTABLE_CMS_PAGE_PATHS[p.slug] !== undefined) // a route renders it
    .map((p) => ({
      url: `${BASE}${ROUTABLE_CMS_PAGE_PATHS[p.slug]}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }))
    .filter((e) => !staticPaths.has(e.url)); // no duplicate <loc>

  // ── Sarkari Naukri job detail pages ──────────────
  // The whole sarkari_naukri corpus was previously absent from the sitemap.
  // entry.updatedAt is the record's stored content date — a real date, keep it.
  // TEST rows are filtered HERE (the source service does not).
  const sarkariPages: MetadataRoute.Sitemap = sarkariEntries
    .filter((entry) => !isTestSlug(entry.slug))
    .map((entry) => ({
      url: `${BASE}/sarkari-naukri/${entry.slug}`,
      lastModified: new Date(entry.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  // ── Sarkari Naukri hubs + state pages ────────────
  // These are LISTING pages with no single assembled trustworthy date → lastmod omitted.
  const sarkariHubPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/sarkari-naukri/exam`,   changeFrequency: "daily" as const, priority: 0.85 },
    { url: `${BASE}/sarkari-naukri/bharti`, changeFrequency: "daily" as const, priority: 0.85 },
    { url: `${BASE}/resources`,             changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  // State/UT pages: only regions that actually have records (exams by region OR
  // vacancies by state). getRegionsWithRecords already excludes all-india and
  // empty regions, so no empty state page is ever submitted. Listing pages → omit.
  const sarkariStatePages: MetadataRoute.Sitemap = regionsWithRecords.map((r) => ({
    url: `${BASE}/sarkari-naukri/state/${r.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Plus the all-states index itself (listing → omit).
  const stateIndexPage: MetadataRoute.Sitemap = [
    { url: `${BASE}/sarkari-naukri/state`, changeFrequency: "daily" as const, priority: 0.6 },
  ];

  // ── Category hub pages (F4) ──────────────────────
  // One URL per (segment, category) that has at least one SUBMITTED exam, so a hub is
  // never submitted empty and never points at a category whose rows are all withheld.
  // Redirecting legacy slugs are skipped (their hub is a 308, not a page). Listing page →
  // lastmod omitted: a hub has no single honest content date, exactly like the state pages.
  const categoryHubs = new Map<string, number>();
  for (const exam of exams) {
    if (!CATEGORY_HUB_PILLARS.has(exam.pillar) || !exam.category) continue;
    if (REDIRECTING_CATEGORY_SLUGS.has(exam.category)) continue;
    if (!isSitemapEligible(exam)) continue;
    const path = new URL(hubUrl(exam)).pathname;
    categoryHubs.set(path, (categoryHubs.get(path) ?? 0) + 1);
  }
  const categoryHubPages: MetadataRoute.Sitemap = Array.from(categoryHubs.keys())
    .sort()
    .map((path) => ({
      url: `${BASE}${path}`,
      changeFrequency: "daily" as const,
      priority: 0.75,
    }));

  // ── Blog tag pages ───────────────────────────────
  // Mirrors the noIndex rule in blog/tag/[tag]/page.tsx (needs 3+ posts).
  // lastmod = newest post updatedAt carrying that tag (a real content date).
  const tagDates = new Map<string, string[]>();
  for (const post of blogPosts) {
    for (const tag of post.tags ?? []) {
      (tagDates.get(tag) ?? tagDates.set(tag, []).get(tag)!).push(post.updatedAt);
    }
  }
  const blogTagPages: MetadataRoute.Sitemap = Array.from(tagDates.entries())
    .filter(([, dates]) => dates.length >= 3)
    .map(([tag, dates]) => ({
      url: `${BASE}/blog/tag/${encodeURIComponent(tag)}`,
      ...lm(latestContentDate(dates)),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  // ── Blog author pages ────────────────────────────
  // lastmod = newest post updatedAt by that author (a real content date).
  // ROUTABLE ONLY (F2): /blog/author/[slug] resolves the slug against the editorial
  // roster in data/authors.ts and 404s on anything else. The DB carries authors that are
  // not on that roster (live case: `indianexaminfo-editorial`), so deriving the list from
  // posts alone submitted a URL the router 404s. Same predicate as the route.
  const authorDates = new Map<string, string[]>();
  for (const post of blogPosts) {
    const a = post.author?.slug;
    if (a) (authorDates.get(a) ?? authorDates.set(a, []).get(a)!).push(post.updatedAt);
  }
  const blogAuthorPages: MetadataRoute.Sitemap = Array.from(authorDates.keys())
    .filter((slug) => isRoutableAuthorSlug(slug))
    .map((slug) => ({
      url: `${BASE}/blog/author/${slug}`,
      ...lm(latestContentDate(authorDates.get(slug) ?? [])),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

  return submitted([
    ...staticPages,
    ...hubPages,
    ...sarkariHubPages,
    ...examPages,
    ...sarkariPages,
    ...stateIndexPage,
    ...categoryHubPages,
    ...sarkariStatePages,
    ...blogSectionPages,
    ...blogPostPages,
    ...blogTagPages,
    ...blogAuthorPages,
    ...cmsPageEntries,
  ]);
}

/**
 * The last gate before a URL becomes a promise to Google (owner batch 4, K3).
 *
 *  1. NEVER a redirect source: a URL that config/redirects.ts answers with a 308 is not a
 *     page, and submitting it makes the sitemap contradict the router. Every block above
 *     builds URLs from the database, so a retire loser, an E3 typo slug or a year-suffixed
 *     admission record can be published, self-canonical-looking and still 308 — the only
 *     place that can be said once, for all of them, is here. The check uses the SAME rule list
 *     next.config hands to Next, so it cannot fall behind a newly added rule.
 *  2. NEVER the same <loc> twice: a duplicate is a wasted crawl budget signal at best and a
 *     contradiction at worst (the CMS-page block already filters against `staticPaths`; this
 *     is the aggregate guard for every other pair of blocks).
 */
export function submitted(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const entry of entries) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    if (pathIsRedirectSource(entry.url)) continue;
    out.push(entry);
  }
  return out;
}
