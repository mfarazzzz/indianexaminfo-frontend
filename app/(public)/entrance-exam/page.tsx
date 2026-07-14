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
  title: `Entrance Exam ${YEAR} — Latest Notifications, Admit Card, Result`,
  description: `Latest entrance exam notifications ${YEAR} for Engineering, Medical, Law, MBA, Design. JEE Main, NEET UG, CAT, CLAT, GATE admit card, result and counselling updates.`,
  keywords: buildPageKeywords({ pageType: "pillar", pillar: "entrance-exam" }),
  canonicalUrl: `${siteConfig.url}/entrance-exam`,
});

// Hardcoded fallback
const FALLBACK_CATEGORIES = [
  { slug: "engineering", label: "Engineering", count: 12, icon: "⚙️" },
  { slug: "medical", label: "Medical", count: 8, icon: "🏥" },
  { slug: "law", label: "Law", count: 6, icon: "⚖️" },
  { slug: "mba", label: "MBA / Management", count: 8, icon: "📊" },
  { slug: "design", label: "Design & Architecture", count: 5, icon: "🎨" },
  { slug: "science-pg", label: "Science PG", count: 7, icon: "🔬" },
  { slug: "teaching", label: "Teacher Education", count: 5, icon: "📚" },
  { slug: "agriculture", label: "Agriculture", count: 4, icon: "🌾" },
  { slug: "hotel-management", label: "Hotel Management", count: 3, icon: "🏨" },
  { slug: "media", label: "Media & Journalism", count: 3, icon: "📰" },
  { slug: "pharmacy", label: "Pharmacy", count: 4, icon: "💊" },
  { slug: "liberal-arts", label: "Liberal Arts", count: 4, icon: "🎭" },
];

export default async function EntranceExamPage() {
  const [exams, cmsCategories] = await Promise.all([
    getExamsByPillar("entrance-exam"),
    getCategoriesByPillar("entrance-exam"),
  ]);

  const categories = cmsCategories.length > 0
    ? cmsCategories.map((c) => ({ slug: c.slug, label: c.name, count: c.examCount, icon: c.icon ?? "📝" }))
    : FALLBACK_CATEGORIES;

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Entrance Exam", href: "/entrance-exam" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        Entrance Exam 2025 — Latest Notifications, Admit Card &amp; Result
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Last Updated: {new Date().toLocaleDateString("en-IN")}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          <section aria-label="Exam categories" className="mb-6">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Browse by Stream</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/entrance-exam/${cat.slug}`}
                  className="bg-card border border-border rounded p-3 text-sm hover:border-primary hover:bg-primary/5 transition-colors group"
                >
                  <div className="text-xl mb-1">{cat.icon}</div>
                  <div className="font-semibold text-gray-800 group-hover:text-primary text-sm">{cat.label}</div>
                  <div className="text-xs text-gray-500">{cat.count} exams</div>
                </Link>
              ))}
            </div>
          </section>

          <section aria-label="All entrance exams">
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">All Entrance Exams 2025</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          </section>
        </main>

        <aside>
          <AdSlot position="category-sidebar" size="300x250" />
        </aside>
      </div>
    </div>
  );
}
