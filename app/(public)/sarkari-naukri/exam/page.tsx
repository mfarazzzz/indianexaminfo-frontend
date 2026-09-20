import type { Metadata } from "next";
import Link from "next/link";
import { getByRecruitmentType, getSarkariNaukriStats } from "@/services/sarkariNaukriService";
import { getTodayIST } from "@/services/examService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { SarkariNaukriList } from "@/components/sarkari-naukri/SarkariNaukriList";

export const revalidate = 1800;

const YEAR = getCurrentYear();
export const metadata: Metadata = buildExamMetadata({
  pageType: "pillar",
  title: `Government Exams ${YEAR} — Competitive Exam Notifications & Results`,
  description: `Latest Sarkari Exam ${YEAR} results: SSC CGL, IBPS PO, RRB NTPC, UPSC, State PSC. Admit card, answer key, cutoff marks and result dates for all government competitive exams.`,
  keywords: buildPageKeywords({ pageType: "pillar", pillar: "government-exam" }),
  canonicalUrl: `${siteConfig.url}/sarkari-naukri/exam`,
});

export default async function SarkariExamPage() {
  const [items, todayISO, stats] = await Promise.all([
    getByRecruitmentType("exam"),
    getTodayIST(),
    getSarkariNaukriStats(),
  ]);

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: "Sarkari Naukri", href: "/sarkari-naukri" },
        { name: "Government Exams", href: "/sarkari-naukri/exam" },
      ]} />

      <AdSlot position="category-top" size="728x90" hideWhenEmpty />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Government Exams {YEAR}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {items.length} exam-based recruitments · Written/online competitive exams (SSC, Banking, Railway, UPSC, PSC)
          </p>

          {/* Type filters */}
          <div className="flex gap-3 mb-5">
            <Link href="/sarkari-naukri" className="rounded-full px-4 py-1.5 text-sm font-medium border border-border text-gray-600 hover:bg-gray-50">All</Link>
            <Link href="/sarkari-naukri/exam" className="rounded-full px-4 py-1.5 text-sm font-medium bg-blue-600 text-white">Government Exams ({items.length})</Link>
            <Link href="/sarkari-naukri/bharti" className="rounded-full px-4 py-1.5 text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50">Government Vacancies ({stats.direct})</Link>
          </div>

          <SarkariNaukriList items={items} todayISO={todayISO} />
        </main>

        <aside>
          <AdSlot position="category-sidebar" size="300x250" />
        </aside>
      </div>
    </div>
  );
}
