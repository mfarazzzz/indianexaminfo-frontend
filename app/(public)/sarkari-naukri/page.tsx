import type { Metadata } from "next";
import Link from "next/link";
import { getAllSarkariNaukri, getCategoryList } from "@/services/sarkariNaukriService";
import { sarkariCategoryLabel } from "@/lib/sarkari/categories";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";
import { getTodayIST } from "@/services/examService";
import { getRegionsWithRecords } from "@/services/regionService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { SARKARI_LABELS } from "@/lib/sarkari/labels";
import { SarkariNaukriList } from "@/components/sarkari-naukri/SarkariNaukriList";

export const revalidate = 1800;

const YEAR = getCurrentYear();

// ── Sort helpers ───────────────────────────────────────────────────────────
// Urgency bucket: lower = higher priority on the listing.
// application-open and admit-card-released are most actionable for the reader.
const STATUS_PRIORITY: Record<string, number> = {
  "application-open":    0,
  "admit-card-released": 1,
  "exam-scheduled":      2,
  "notified":            2,
  "upcoming":            3,
  "answer-key-released": 4,
  "interview-scheduled": 4,
  "merit-list-released": 5,
  "result-declared":     6,
  "application-closed":  7,
  "completed":           8,
  "cancelled":           9,
};

function urgencyBucket(item: SarkariNaukriItem): number {
  return STATUS_PRIORITY[item.status] ?? 5;
}

/** Sort: featured first, then by urgency bucket, then by nearest future deadline,
 *  then by updatedAt for items with no upcoming deadline. */
function sortByUrgency(items: SarkariNaukriItem[]): SarkariNaukriItem[] {
  const now = Date.now();
  return [...items].sort((a, b) => {
    // Featured always first
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;

    const aBucket = urgencyBucket(a);
    const bBucket = urgencyBucket(b);
    if (aBucket !== bBucket) return aBucket - bBucket;

    // Within the same bucket, nearest deadline first
    const aDeadline = a.applicationEndDate ?? a.examDate ?? a.resultDate;
    const bDeadline = b.applicationEndDate ?? b.examDate ?? b.resultDate;
    if (aDeadline && bDeadline) {
      const aT = new Date(aDeadline).getTime();
      const bT = new Date(bDeadline).getTime();
      // Future deadlines sort ascending (nearest first);
      // past dates sort descending (most recent first).
      const aFuture = aT >= now;
      const bFuture = bT >= now;
      if (aFuture && bFuture) return aT - bT;
      if (!aFuture && !bFuture) return bT - aT;
      return aFuture ? -1 : 1; // future before past
    }
    if (aDeadline) return -1;
    if (bDeadline) return 1;

    // Fall back to recency
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
export const metadata: Metadata = buildExamMetadata({
  pageType: "pillar",
  title: `Sarkari Naukri ${YEAR} — Latest Government Jobs & Bharti India`,
  description: `Latest Sarkari Naukri ${YEAR}: Government exam results, direct bharti, merit lists. SSC, Railway, Banking, State-level Anganwadi, Panchayat, Court, Hospital jobs with apply links.`,
  keywords: buildPageKeywords({ pageType: "pillar", pillar: "government-exam" }),
  canonicalUrl: `${siteConfig.url}/sarkari-naukri`,
});

export default async function SarkariNaukriPage() {
  const [items, regions, categories, todayISO] = await Promise.all([
    getAllSarkariNaukri(),
    // This page covers government EXAMS and vacancies, so its Browse by State
    // list uses regions-with-records (exams by region OR vacancies by state) —
    // so exam-only states like Delhi, Chandigarh and J&K appear here too.
    getRegionsWithRecords(),
    getCategoryList(),
    getTodayIST(),
  ]);

  const examCount = items.filter((i) => i.recruitmentType === "exam").length;
  const directCount = items.filter((i) => i.recruitmentType === "direct").length;
  const sorted = sortByUrgency(items);

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: SARKARI_LABELS.root, href: "/sarkari-naukri" }]} />

      {/* Ad hidden until a real creative is served */}
      <AdSlot position="category-top" size="728x90" hideWhenEmpty />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Sarkari Naukri {YEAR} — Government Jobs & Bharti
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {items.length} active listings · Last updated {new Date().toLocaleDateString("en-IN")}
          </p>

          {/* Type filters — overflow-x scrollable on mobile so the three pills never clip */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
            <Link
              href="/sarkari-naukri"
              className="rounded-full px-3 py-1.5 text-sm font-medium bg-primary text-white whitespace-nowrap shrink-0"
            >
              All ({items.length})
            </Link>
            <Link
              href="/sarkari-naukri/exam"
              className="rounded-full px-3 py-1.5 text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 whitespace-nowrap shrink-0"
            >
              {SARKARI_LABELS.exams} ({examCount})
            </Link>
            <Link
              href="/sarkari-naukri/bharti"
              className="rounded-full px-3 py-1.5 text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50 whitespace-nowrap shrink-0"
            >
              {SARKARI_LABELS.vacancies} ({directCount})
            </Link>
          </div>

          {/* Browse by category */}
          <section className="mb-6">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Browse by Category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.category}
                  href={`/sarkari-naukri/${cat.category}`}
                  className="rounded-full border border-border px-3 py-1 text-xs text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                  {sarkariCategoryLabel(cat.category)} ({cat.count})
                </Link>
              ))}
            </div>
          </section>

          {/* Listings — sorted by urgency, paginated inside the component */}
          <SarkariNaukriList items={sorted} todayISO={todayISO} />
        </main>

        <aside className="flex flex-col gap-4">
          {/* Sidebar ad — hidden until a real creative is served */}
          <AdSlot position="category-sidebar" size="300x250" hideWhenEmpty />

          {/* Browse by state */}
          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">
              Browse by State
            </h2>
            <ul className="space-y-1.5 text-sm">
              {regions.slice(0, 10).map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/sarkari-naukri/state/${r.slug}`}
                    className="flex justify-between text-gray-700 hover:text-primary hover:underline"
                  >
                    <span>{r.label}</span>
                    <span className="text-gray-400 text-xs">{r.examCount + r.vacancyCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/sarkari-naukri/state" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
              All states →
            </Link>
          </div>

          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">Quick Links</h2>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/sarkari-naukri/exam" className="text-gray-700 hover:text-primary hover:underline">{SARKARI_LABELS.exams}</Link></li>
              <li><Link href="/sarkari-naukri/bharti" className="text-gray-700 hover:text-primary hover:underline">{SARKARI_LABELS.vacancies}</Link></li>
              <li><Link href="/admit-card" className="text-gray-700 hover:text-primary hover:underline">Admit Card</Link></li>
              <li><Link href="/results" className="text-gray-700 hover:text-primary hover:underline">Results</Link></li>
              <li><Link href="/answer-key" className="text-gray-700 hover:text-primary hover:underline">Answer Key</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
