import type { Metadata } from "next";
import Link from "next/link";
import { getExamsByPillar } from "@/services/examService";
import { getCategoriesByPillar } from "@/services/categoryService";
import { ExamCard } from "@/components/exam/ExamCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 7200;

const YEAR = getCurrentYear();
export const metadata: Metadata = buildExamMetadata({
  pageType: "pillar",
  title: `Sarkari Naukri ${YEAR} — Latest Government Jobs India`,
  description: `Get latest Sarkari Naukri ${YEAR} notifications for UPSC, SSC, Banking, Railways, Defence, Police and State PSC jobs. Check eligibility, apply online, admit card and results.`,
  keywords: buildPageKeywords({ pageType: "pillar", pillar: "sarkari-naukri" }),
  canonicalUrl: `${siteConfig.url}/sarkari-naukri`,
});

// Hardcoded fallback — used only if categories table is empty
const FALLBACK_CATEGORIES = [
  { slug: "upsc", label: "UPSC", count: 8 },
  { slug: "ssc", label: "SSC", count: 10 },
  { slug: "banking", label: "Banking", count: 15 },
  { slug: "railways", label: "Railways", count: 7 },
  { slug: "teaching", label: "Teaching", count: 9 },
  { slug: "defence", label: "Defence", count: 8 },
  { slug: "police", label: "Police & Paramilitary", count: 12 },
  { slug: "state-psc", label: "State PSC", count: 10 },
  { slug: "judiciary", label: "Judiciary", count: 6 },
  { slug: "technical-psu", label: "Technical PSU", count: 14 },
  { slug: "post-office", label: "Post Office", count: 3 },
  { slug: "agriculture", label: "Agriculture", count: 5 },
];

export default async function SarkariNaukriPage() {
  const [exams, cmsCategories] = await Promise.all([
    getExamsByPillar("sarkari-naukri"),
    getCategoriesByPillar("sarkari-naukri"),
  ]);

  // Use CMS categories if available, otherwise hardcoded fallback
  const categories = cmsCategories.length > 0
    ? cmsCategories.map((c) => ({ slug: c.slug, label: c.name, count: c.examCount }))
    : FALLBACK_CATEGORIES;

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Sarkari Naukri", href: "/sarkari-naukri" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
            Sarkari Naukri {YEAR} — Latest Govt Jobs India
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Last Updated: {new Date().toLocaleDateString("en-IN")} · Information as of {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>

          {/* Category grid */}
          <section aria-label="Job categories" className="mb-6">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/sarkari-naukri/${cat.slug}`}
                  className="bg-card border border-border rounded p-3 text-sm hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <div className="font-semibold text-gray-800 group-hover:text-primary">{cat.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{cat.count} active exams</div>
                </Link>
              ))}
            </div>
          </section>

          {/* All exams */}
          <section aria-label="All Sarkari Naukri exams">
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">
              All Government Job Notifications {YEAR}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          </section>
        </main>

        <aside className="flex flex-col gap-4">
          <AdSlot position="category-sidebar" size="300x250" />
          <div className="bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">Quick Links</h2>
            <ul className="space-y-1.5 text-sm">
              {[
                { label: "Latest Notifications", href: "/sarkari-naukri" },
                { label: "Admit Card", href: "/admit-card" },
                { label: "Results", href: "/results" },
                { label: "Syllabus", href: "/syllabus" },
                { label: "Previous Papers", href: "/previous-papers" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-700 hover:text-primary hover:underline">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
