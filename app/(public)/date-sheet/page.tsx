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
  title: `Date Sheet ${YEAR} — Exam Schedule for CBSE, UP Board & Universities`,
  description: `Download date sheet ${YEAR} for CBSE, UP Board, Bihar Board, IGNOU, BHU and all universities. Complete subject-wise exam schedule PDF.`,
  keywords: [...CONTENT_TYPE_KEYWORDS["date-sheet"].suffixes, ...GLOBAL_SHORT_TAIL.slice(0, 6), `cbse date sheet ${YEAR}`, `up board time table ${YEAR}`, `ignou date sheet ${YEAR}`],
  canonicalUrl: `${siteConfig.url}/date-sheet`,
});

export default async function DateSheetPage() {
  const exams = await getExamsByContentType("date-sheet");

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Date Sheet", href: "/date-sheet" }]} />
      <div className="flex justify-center mb-4">
        <AdSlot position="content-hub-top" size="728x90" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        Date Sheet {new Date().getFullYear()} — Exam Schedule for All Boards &amp; Universities
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Official date sheets with PDF download for {exams.length}+ exams
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={getExamContentTypeHref(exam, "date-sheet")}
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
