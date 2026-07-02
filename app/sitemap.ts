import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getAllExams } from "@/services/examService";
import { getAllBlogPosts } from "@/services/blogService";
import { getAllPublishedPages } from "@/services/pageService";
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

/** Map exam entity to its canonical URL */
function examUrl(exam: { pillar: string; entityType: string; category: string; slug: string }): string {
  if (exam.pillar === "board-university") {
    return exam.entityType === "university"
      ? `${BASE}/board-exam/university/${exam.slug}`
      : `${BASE}/board-exam/state/${exam.category}/${exam.slug}`;
  }
  return `${BASE}/${exam.pillar}/${exam.category}/${exam.slug}`;
}

/** Content type URL */
function ctUrl(exam: { pillar: string; entityType: string; category: string; slug: string }, ct: ContentType): string {
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
  const [exams, blogPosts, cmsPages] = await Promise.all([
    getAllExams(),
    getAllBlogPosts(),
    getAllPublishedPages(),
  ]);
  const now = new Date();

  // ── Static pages ─────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/sarkari-naukri`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/entrance-exam`,     lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/board-exam`,        lastModified: now, changeFrequency: "daily",   priority: 0.9 },
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
  const examPages: MetadataRoute.Sitemap = exams.flatMap((exam) => {
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

  return [...staticPages, ...examPages, ...blogSectionPages, ...blogPostPages, ...cmsPageEntries];
}
