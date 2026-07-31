import type { Metadata } from "next";
import Link from "next/link";
import { getAllSarkariNaukri, getStateList, getCategoryList } from "@/services/sarkariNaukriService";
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
  title: `Sarkari Naukri ${YEAR} — Latest Government Jobs & Bharti India`,
  description: `Latest Sarkari Naukri ${YEAR}: Government exam results, direct bharti, merit lists. SSC, Railway, Banking, State-level Anganwadi, Panchayat, Court, Hospital jobs with apply links.`,
  keywords: buildPageKeywords({ pageType: "pillar", pillar: "government-exam" }),
  canonicalUrl: `${siteConfig.url}/sarkari-naukri`,
});

export default async function SarkariNaukriPage() {
  const [items, states, categories] = await Promise.all([
    getAllSarkariNaukri(),
    getStateList(),
    getCategoryList(),
  ]);

  const examCount = items.filter((i) => i.recruitmentType === "exam").length;
  const directCount = items.filter((i) => i.recruitmentType === "direct").length;

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Sarkari Naukri", href: "/sarkari-naukri" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Sarkari Naukri {YEAR} — Government Jobs & Bharti
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {items.length} active listings · Last updated {new Date().toLocaleDateString("en-IN")}
          </p>

          {/* Type tabs */}
          <div className="flex gap-3 mb-5">
            <Link
              href="/sarkari-naukri"
              className="rounded-full px-4 py-1.5 text-sm font-medium bg-primary text-white"
            >
              All ({items.length})
            </Link>
            <Link
              href="/sarkari-naukri/exam"
              className="rounded-full px-4 py-1.5 text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Sarkari Exam ({examCount})
            </Link>
            <Link
              href="/sarkari-naukri/bharti"
              className="rounded-full px-4 py-1.5 text-sm font-medium border border-green-200 text-green-700 hover:bg-green-50"
            >
              Sarkari Bharti ({directCount})
            </Link>
          </div>

          {/* Browse by category */}
          <section className="mb-6">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Browse by Category</h2>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.category}
                  href={`/sarkari-naukri/exam?category=${cat.category}`}
                  className="rounded-full border border-border px-3 py-1 text-xs text-gray-700 hover:border-primary hover:text-primary transition-colors"
                >
                  {cat.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ({cat.count})
                </Link>
              ))}
            </div>
          </section>

          {/* Listings */}
          <SarkariNaukriList items={items} />
        </main>

        <aside className="flex flex-col gap-4">
          <AdSlot position="category-sidebar" size="300x250" />

          {/* Browse by state */}
          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">
              Browse by State
            </h2>
            <ul className="space-y-1.5 text-sm max-h-64 overflow-y-auto">
              {states.map((s) => (
                <li key={s.state}>
                  <Link
                    href={`/sarkari-naukri/state/${s.state}`}
                    className="flex justify-between text-gray-700 hover:text-primary hover:underline"
                  >
                    <span className="capitalize">{s.state.replace(/-/g, " ")}</span>
                    <span className="text-gray-400 text-xs">{s.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">Quick Links</h2>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/sarkari-naukri/exam" className="text-gray-700 hover:text-primary hover:underline">Sarkari Exam</Link></li>
              <li><Link href="/sarkari-naukri/bharti" className="text-gray-700 hover:text-primary hover:underline">Sarkari Bharti</Link></li>
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
