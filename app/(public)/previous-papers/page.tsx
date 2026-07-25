import type { Metadata } from "next";
import Link from "next/link";
import { getExamsByContentType } from "@/services/examService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { CONTENT_TYPE_KEYWORDS, GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";
import { getExamContentTypeHref } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export const revalidate = 86400;

const YEAR = getCurrentYear();
export const metadata: Metadata = buildExamMetadata({
  pageType: "hub",
  title: `Previous Year Question Papers ${YEAR} — Download PDF for All Exams`,
  description: `Download previous year question papers for UPSC, SSC, IBPS, NEET, JEE Main and all exams. Year-wise, shift-wise solved papers with answers.`,
  keywords: [...CONTENT_TYPE_KEYWORDS["previous-papers"].suffixes, ...GLOBAL_SHORT_TAIL.slice(0, 6), `previous year paper pdf ${YEAR}`, `pyq download ${YEAR}`],
  canonicalUrl: `${siteConfig.url}/previous-papers`,
});

export default async function PreviousPapersPage() {
  const exams = await getExamsByContentType("previous-papers");

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Previous Papers", href: "/previous-papers" }]} />
      <div className="flex justify-center mb-4">
        <AdSlot position="content-hub-top" size="728x90" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        Previous Year Question Papers — Download PDF for All Exams
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Year-wise solved papers for {exams.length}+ competitive exams
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={getExamContentTypeHref(exam, "previous-papers")}
            className="p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
          >
            <p className="text-sm font-semibold text-gray-800 group-hover:text-primary">{exam.name}</p>
            <p className="text-xs text-gray-500 mt-1">Year-wise PDFs available</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
