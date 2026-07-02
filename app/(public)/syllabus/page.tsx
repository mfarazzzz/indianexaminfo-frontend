import type { Metadata } from "next";
import Link from "next/link";
import { getExamsByContentType } from "@/services/examService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { CONTENT_TYPE_KEYWORDS, GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 86400;

const YEAR = getCurrentYear();
export const metadata: Metadata = buildExamMetadata({
  pageType: "hub",
  title: `Syllabus ${YEAR} — Download PDF for All Competitive Exams`,
  description: `Download official syllabus PDF ${YEAR} for UPSC, SSC, IBPS, NEET, JEE Main, CBSE and all Indian exams. Complete topic-wise syllabus with exam pattern.`,
  keywords: [...CONTENT_TYPE_KEYWORDS["syllabus"].suffixes, ...GLOBAL_SHORT_TAIL.slice(0, 6), `upsc syllabus ${YEAR}`, `neet syllabus ${YEAR}`, `jee main syllabus ${YEAR}`],
  canonicalUrl: `${siteConfig.url}/syllabus`,
});

export default async function SyllabusPage() {
  const exams = await getExamsByContentType("syllabus");

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Syllabus", href: "/syllabus" }]} />
      <div className="flex justify-center mb-4">
        <AdSlot position="content-hub-top" size="728x90" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        Syllabus 2025 — Download PDF for All Competitive Exams
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Complete and updated syllabus for {exams.length}+ exams with PDF download
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/${exam.pillar}/${exam.category}/${exam.slug}/syllabus`}
            className="p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
          >
            <p className="text-sm font-semibold text-gray-800 group-hover:text-primary">{exam.name}</p>
            <p className="text-xs text-gray-500 mt-1">{exam.conductingBody}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
