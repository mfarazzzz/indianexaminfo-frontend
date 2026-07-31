import type { Metadata } from "next";
import Link from "next/link";
import { getExamsByPillar } from "@/services/examService";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

export const metadata: Metadata = buildExamMetadata({
  pageType: "pillar",
  title: `University Exams ${getCurrentYear()} — Results, Date Sheet, Admission`,
  description: `Latest university exam results, date sheets, admit cards and admission updates for IGNOU, DU, BHU, MJPRU, AMU and all major Indian universities.`,
  canonicalUrl: `${siteConfig.url}/university-exam`,
});

export default async function UniversityExamPage() {
  const exams = await getExamsByPillar("university-exam");
  const grouped = exams.reduce((acc, e) => {
    const cat = e.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {} as Record<string, typeof exams>);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2">
        University Exams {getCurrentYear()}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Results, date sheets, admit cards and admission updates for Indian universities.
      </p>
      {Object.entries(grouped).map(([cat, items]) => (
        <section key={cat} className="mb-8">
          <h2 className="font-heading font-semibold text-lg text-gray-800 mb-3 capitalize">
            {cat.replace(/-/g, " ")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((e) => (
              <Link key={e.id} href={`/university-exam/${e.category || cat}/${e.slug}`}
                className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-sm transition-all">
                <h3 className="font-heading font-semibold text-sm text-gray-900">{e.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{e.conductingBody}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
