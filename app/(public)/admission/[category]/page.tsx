import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamsByCategory } from "@/services/examService";
import { ExamListRow } from "@/components/exam/ExamListRow";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 600;

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const year = getCurrentYear();
  const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return buildExamMetadata({
    pageType: "category",
    title: `${label} Entrance Exams ${year} — Notification, Admit Card, Result`,
    description: `Latest ${label} entrance exam notifications, admit card, result and cutoff. Complete information for all ${label} entrance exams ${year}.`,
    keywords: buildPageKeywords({ pageType: "category", pillar: "entrance-exam", examSlug: category }),
    canonicalUrl: `${siteConfig.url}/admission/${category}`,
  });
}

export default async function EntranceCategoryPage({ params }: Props) {
  const { category } = await params;
  const exams = await getExamsByCategory(category);

  if (!exams.length) notFound();

  const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb
        items={[
          { name: "Admissions", href: "/admission" },
          { name: label, href: `/admission/${category}` },
        ]}
      />
      <h1 className="font-heading font-bold text-2xl text-gray-900 mt-4 mb-5">
        {label} Admissions {getCurrentYear()} — Latest Notifications &amp; Results
      </h1>
      <div className="divide-y divide-border border-t border-border">
        {exams.map((exam) => <ExamListRow key={exam.id} exam={exam} />)}
      </div>
    </div>
  );
}
