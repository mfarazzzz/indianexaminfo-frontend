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
  title: `Mock Test ${YEAR} — Free Practice Tests for All Competitive Exams`,
  description: `Free mock tests ${YEAR} for UPSC, SSC, IBPS, NEET, JEE Main and all exams. Online practice tests with detailed solutions and performance analysis.`,
  keywords: [...CONTENT_TYPE_KEYWORDS["mock-test"].suffixes, ...GLOBAL_SHORT_TAIL.slice(0, 6), `free mock test ${YEAR}`, `online test series ${YEAR}`],
  canonicalUrl: `${siteConfig.url}/mock-test`,
});

export default async function MockTestPage() {
  const exams = await getExamsByContentType("mock-test");

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Mock Test", href: "/mock-test" }]} />
      <div className="flex justify-center mb-4">
        <AdSlot position="content-hub-top" size="728x90" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        Mock Test {new Date().getFullYear()} — Free Practice Tests for All Competitive Exams
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Practice free online mock tests for {exams.length}+ exams
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={getExamContentTypeHref(exam, "mock-test")}
            className="p-3 bg-card border border-border rounded hover:border-primary transition-colors group"
          >
            <p className="text-sm font-semibold text-gray-800 group-hover:text-primary">{exam.name}</p>
            <p className="text-xs text-success mt-1 font-medium">Free Practice Available</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
