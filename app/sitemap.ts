import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllExams } from "@/services/examService";
import { getAllBlogPosts } from "@/services/blogService";
import { getAllPublishedPages } from "@/services/pageService";
import {
  getSarkariNaukriSitemapEntries,
  getStateList,
} from "@/services/sarkariNaukriService";
import { HIGH_PRIORITY_SLUGS } from "@/lib/seo/keywords";
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

type SitemapExam = { pillar: string; entityType: string; category: string; slug: string };

/**
 * Category slugs that are handled by LEGACY_REDIRECTS in the sarkari catch-all.
 * URLs built on these 307-redirect, so they must never enter the sitemap.
 */
const LEGACY_CATEGORY_SLUGS = new Set([
  "central-government-jobs",
  "state-government-jobs",
  "banking",
  "railways",
  "defence",
  "teaching",
]);

/**
 * True when an exam row can produce a well-formed, non-redirecting URL.
 * Rows with no category would yield `/{pillar}//{slug}` (double slash), and
 * rows on a legacy category slug would yield a redirecting URL.
 */
function isSitemapEligible(exam: SitemapExam): boolean {
  if (!exam.slug) return false;
  if (exam.pillar === "board-university" && exam.entityType === "university") return true;
  if (!exam.category) return false;
  if (exam.pillar === "sarkari-naukri" && LEGACY_CATEGORY_SLUGS.has(exam.category)) return false;
  return true;
}

/** Map exam entity to its canonical URL. Callers must gate on isSitemapEligible(). */
function examUrl(exam: SitemapExam): string {
  if (exam.pillar === "board-university") {
    return exam.entityType === "university"
      ? `${BASE}/board-exam/university/${exam.slug}`
      : `${BASE}/board-exam/state/${exam.category}/${exam.slug}`;
  }
  return `${BASE}/${exam.pillar}/${exam.category}/${exam.slug}`;
}

/** Content type URL */
function ctUrl(exam: SitemapExam, ct: ContentType): string {
  if (exam.pillar === "board-university") {
    return exam.entityType === "university"
      ? `${BASE}/board-exam/university/${exam.slug}/${ct}`
      : `${BASE}/board-exam/state/${exam.category}/${exam.slug}/${ct}`;
  }
  return `${BASE}/${exam.pillar}/${exam.category}/${exam.slug}/${ct}`;
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [exams, blogPosts, cmsPages, sarkariEntries, states] = await Promise.all([
    getAllExams(),
    getAllBlogPosts(),
    getAllPublishedPages(),
    getSarkariNaukriSitemapEntries(),
    getStateList(),
  ]);
  const now = new Date();

  // ── Static pages ─────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/sarkari-naukri`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/entrance-exam`,     lastModified: now, changeFrequency: "daily",   priority: 0.9 },
  // ── Board & University section ──────────────────────────────
  // Pillar has 0 rows currently. Suppress its pages from the
  // sitemap until we actually populate it. The hub page itself
  // stays (it renders a placeholder UX) but the non-existent
  // boards don't belong in the sitemap.
  // { url: `${BASE}/board-exam`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/blog`,              lastModified: now, changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/admit-card`,        lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/results`,           lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/answer-key`,        lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/syllabus`,          lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/date-sheet`,        lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/mock-test`,         lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/previous-papers`,   lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/study-material`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/about`,             lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/contact`,           lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/privacy-policy`,    lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/disclaimer`,        lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // ── Exam entity pages + content-type sub-pages ───
  const examPages: MetadataRoute.Sitemap = exams.filter(isSitemapEligible).flatMap((exam) => {
    const isHigh = HIGH_PRIORITY_SLUGS.has(exam.slug);
    const lastMod = new Date(exam.lastUpdated);

    const base: MetadataRoute.Sitemap[number] = {
      url: examUrl(exam),
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: isHigh ? 0.9 : 0.8,
    };

    const ctPages: MetadataRoute.Sitemap = CT_FLAGS
      .filter(({ flag }) => (exam as Record<string, unknown>)[flag] === true)
      .map(({ ct }) => ({
        url: ctUrl(exam, ct),
        lastModified: lastMod,
        changeFrequency: ctFreq(ct),
        priority: ctPriority(exam.slug, isHigh),
      }));

    return [base, ...ctPages];
  });

  // ── Blog section pages ────────────────────────────
  const blogSections = ["education-news","exam-prep","career-guidance","scholarship","study-abroad","edtech","student-life","opinion"];
  const blogSectionPages: MetadataRoute.Sitemap = blogSections.map((s) => ({
    url: `${BASE}/blog/${s}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // ── Blog post pages ───────────────────────────────
  const blogPostPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.section}/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // ── CMS custom pages ─────────────────────────────
  const systemSlugs = new Set(["about", "contact", "privacy-policy", "disclaimer"]);
  const cmsPageEntries: MetadataRoute.Sitemap = cmsPages
    .filter((p) => !systemSlugs.has(p.slug)) // system pages already in staticPages
    .map((p) => ({
      url: `${BASE}/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  // ── Sarkari Naukri job detail pages ──────────────
  // The whole sarkari_naukri corpus was previously absent from the sitemap.
  const sarkariPages: MetadataRoute.Sitemap = sarkariEntries.map((entry) => ({
    url: `${BASE}/sarkari-naukri/${entry.slug}`,
    lastModified: new Date(entry.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // ── Sarkari Naukri hubs + state pages ────────────
  const sarkariHubPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/sarkari-naukri/exam`,   lastModified: now, changeFrequency: "daily" as const, priority: 0.85 },
    { url: `${BASE}/sarkari-naukri/bharti`, lastModified: now, changeFrequency: "daily" as const, priority: 0.85 },
    { url: `${BASE}/resources`,             lastModified: now, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const sarkariStatePages: MetadataRoute.Sitemap = states
    .filter((s) => s.state && s.count > 0)
    .map((s) => ({
      url: `${BASE}/sarkari-naukri/state/${s.state}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  // ── Blog tag pages ───────────────────────────────
  // Mirrors the noIndex rule in blog/tag/[tag]/page.tsx (needs 3+ posts).
  const tagCounts = new Map<string, number>();
  for (const post of blogPosts) {
    for (const tag of post.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const blogTagPages: MetadataRoute.Sitemap = Array.from(tagCounts.entries())
    .filter(([, count]) => count >= 3)
    .map(([tag]) => ({
      url: `${BASE}/blog/tag/${encodeURIComponent(tag)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  // ── Blog author pages ────────────────────────────
  const authorSlugs = new Set(
    blogPosts.map((p) => p.author?.slug).filter((s): s is string => Boolean(s))
  );
  const blogAuthorPages: MetadataRoute.Sitemap = Array.from(authorSlugs).map((slug) => ({
    url: `${BASE}/blog/author/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [
    ...staticPages,
    ...sarkariHubPages,
    ...examPages,
    ...sarkariPages,
    ...sarkariStatePages,
    ...blogSectionPages,
    ...blogPostPages,
    ...blogTagPages,
    ...blogAuthorPages,
    ...cmsPageEntries,
  ];
}
