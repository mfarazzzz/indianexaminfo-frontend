import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getExamsByCategory } from "@/services/examService";
import { ExamCard } from "@/components/exam/ExamCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { capitalize } from "@/lib/utils";

export const revalidate = 7200;

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const year = getCurrentYear();
  const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return buildExamMetadata({
    pageType: "category",
    title: `${label} Exams ${year} — Latest Notifications & Results`,
    description: `Latest ${label} exam notifications, admit card, result and syllabus. Apply online for all ${label} government jobs ${year}.`,
    keywords: buildPageKeywords({ pageType: "category", pillar: "sarkari-naukri", examSlug: category }),
    canonicalUrl: `${siteConfig.url}/sarkari-naukri/${category}`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const exams = await getExamsByCategory(category);

  if (!exams.length) redirect("/sarkari-naukri");

  const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb
        items={[
          { name: "Sarkari Naukri", href: "/sarkari-naukri" },
          { name: label, href: `/sarkari-naukri/${category}` },
        ]}
      />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        {label} Exams 2025 — Latest Notifications & Results
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Last Updated: {new Date().toLocaleDateString("en-IN")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  );
}
