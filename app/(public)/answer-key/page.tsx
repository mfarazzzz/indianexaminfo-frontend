import type { Metadata } from "next";
import Link from "next/link";
import { getExamsByContentType } from "@/services/examService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { CONTENT_TYPE_KEYWORDS, GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

const YEAR = getCurrentYear();

export const metadata: Metadata = buildExamMetadata({
  pageType: "hub",
  title: `Answer Key ${YEAR} — Download PDF for All Competitive Exams`,
  description:
    `Download official answer key ${YEAR} for UPSC, SSC, IBPS, NEET, JEE & all exams. ` +
    `Set-wise answer key PDF, objection window dates and final answer key.`,
  keywords: [
    ...CONTENT_TYPE_KEYWORDS["answer-key"].suffixes,
    ...GLOBAL_SHORT_TAIL.slice(0, 6),
    `official answer key ${YEAR}`, `provisional answer key ${YEAR}`,
  ],
  canonicalUrl: `${siteConfig.url}/answer-key`,
});

export default async function AnswerKeyPage() {
  const exams = await getExamsByContentType("answer-key");

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Answer Key", href: "/answer-key" }]} />
      <div className="flex justify-center mb-4">
        <AdSlot position="content-hub-top" size="728x90" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        Answer Key 2025 — Download PDF for All Competitive Exams
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Official answer keys with objection window details for {exams.length}+ exams
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/${exam.pillar}/${exam.category}/${exam.slug}/answer-key`}
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
