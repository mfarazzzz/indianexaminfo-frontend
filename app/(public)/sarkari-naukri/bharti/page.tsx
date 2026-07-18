import type { Metadata } from "next";
import Link from "next/link";
import { getByRecruitmentType, getStateList } from "@/services/sarkariNaukriService";
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
  title: `Sarkari Bharti ${YEAR} — Direct Recruitment, Walk-In, Merit-Based Jobs`,
  description: `Latest Sarkari Bharti ${YEAR}: Anganwadi, Panchayat, Municipal, Hospital, Court, Driver, Group D walk-in and merit-based government jobs. No written exam required — apply directly.`,
  keywords: buildPageKeywords({ pageType: "pillar", pillar: "sarkari-naukri" }),
  canonicalUrl: `${siteConfig.url}/sarkari-naukri/bharti`,
});

export default async function SarkariBhartiPage() {
  const [items, states] = await Promise.all([
    getByRecruitmentType("direct"),
    getStateList(),
  ]);

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: "Sarkari Naukri", href: "/sarkari-naukri" },
        { name: "Sarkari Bharti", href: "/sarkari-naukri/bharti" },
      ]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Sarkari Bharti {YEAR} — Direct Recruitment & Walk-In Jobs
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {items.length} direct/merit-based recruitments · No written exam — walk-in, document verification, merit list
          </p>

          {/* Type tabs */}
          <div className="flex gap-3 mb-5">
            <Link href="/sarkari-naukri" className="rounded-full px-4 py-1.5 text-sm font-medium border border-border text-gray-600 hover:bg-gray-50">All</Link>
            <Link href="/sarkari-naukri/exam" className="rounded-full px-4 py-1.5 text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50">Sarkari Exam</Link>
            <Link href="/sarkari-naukri/bharti" className="rounded-full px-4 py-1.5 text-sm font-medium bg-green-600 text-white">Sarkari Bharti ({items.length})</Link>
          </div>

          <SarkariNaukriList items={items} />
        </main>

        <aside className="flex flex-col gap-4">
          <AdSlot position="category-sidebar" size="300x250" />
          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">By State</h2>
            <ul className="space-y-1.5 text-sm max-h-64 overflow-y-auto">
              {states.filter(s => s.state !== "all-india").map((s) => (
                <li key={s.state}>
                  <Link href={`/sarkari-naukri/state/${s.state}`} className="flex justify-between text-gray-700 hover:text-primary hover:underline">
                    <span className="capitalize">{s.state.replace(/-/g, " ")}</span>
                    <span className="text-gray-400 text-xs">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
