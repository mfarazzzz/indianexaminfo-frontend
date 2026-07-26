import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getExamArchive } from "@/services/examService";
import { ExamCard } from "@/components/exam/ExamCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { siteConfig } from "@/config/site";

export const revalidate = 3600; // 1 hour for archive pages

type Props = { params: Promise<{ category: string; slug: string; year: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug, year } = await params;
  const exam = await getExamArchive(slug, parseInt(year));
  if (!exam) return { title: "Not Found" };
  const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${exam.name} ${year} — Archive | IndianExamInfo`,
    description: `Archived information for ${exam.name} ${year} including dates, results, and cutoff data.`,
    alternates: {
      canonical: `${siteConfig.url}/entrance-exam/${category}/${slug}/${year}`,
    },
  };
}

export default async function ExamArchivePage({ params }: Props) {
  const { category, slug, year } = await params;
  const yearNum = parseInt(year);

  if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) return notFound();

  const exam = await getExamArchive(slug, yearNum);
  if (!exam) return notFound();

  const label = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb
        items={[
          { name: "Entrance Exam", href: "/entrance-exam" },
          { name: label, href: `/entrance-exam/${category}` },
          { name: exam.shortName || exam.name, href: `/entrance-exam/${category}/${slug}` },
          { name: year, href: `/entrance-exam/${category}/${slug}/${year}` },
        ]}
      />

      {/* Archive banner */}
      <div className="mt-4 mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-amber-800">
          📋 You&apos;re viewing <strong>{exam.name} {year}</strong> (archived edition).
        </p>
        <Link
          href={`/entrance-exam/${category}/${slug}`}
          className="text-sm font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1"
        >
          See latest <ArrowRight size={14} />
        </Link>
      </div>

      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-5">
        {exam.name} {year} — Archive
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main>
          <ExamCard exam={exam} />
        </main>
        <aside className="text-sm text-slate-500">
          <p>This is an archived edition. For the most current information, visit the main exam page.</p>
        </aside>
      </div>
    </div>
  );
}
