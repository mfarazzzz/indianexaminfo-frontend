import type { Metadata } from "next";
import Link from "next/link";
import { getByState } from "@/services/sarkariNaukriService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { SarkariNaukriList } from "@/components/sarkari-naukri/SarkariNaukriList";

export const revalidate = 1800;

type Props = { params: Promise<{ state: string }> };

function formatState(state: string): string {
  return state.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const label = formatState(state);
  const year = getCurrentYear();
  return buildExamMetadata({
    pageType: "category",
    title: `${label} Government Jobs ${year} — Sarkari Naukri ${label}`,
    description: `Latest government jobs in ${label} ${year}. Sarkari Exam results, Sarkari Bharti, Anganwadi, Panchayat, Court and Hospital vacancies in ${label}.`,
    canonicalUrl: `${siteConfig.url}/sarkari-naukri/state/${state}`,
  });
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const items = await getByState(state);
  const label = formatState(state);
  const year = getCurrentYear();

  const examCount = items.filter((i) => i.recruitmentType === "exam").length;
  const directCount = items.filter((i) => i.recruitmentType === "direct").length;

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: "Sarkari Naukri", href: "/sarkari-naukri" },
        { name: label, href: `/sarkari-naukri/state/${state}` },
      ]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <main>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
          {label} Government Jobs {year}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {items.length} jobs in {label} · {examCount} exam-based · {directCount} direct recruitment
        </p>

        <div className="flex gap-3 mb-5">
          <Link href={`/sarkari-naukri/state/${state}`} className="rounded-full px-4 py-1.5 text-sm font-medium bg-primary text-white">All ({items.length})</Link>
          {examCount > 0 && <span className="rounded-full px-3 py-1.5 text-xs border border-blue-200 text-blue-600">Exam: {examCount}</span>}
          {directCount > 0 && <span className="rounded-full px-3 py-1.5 text-xs border border-green-200 text-green-600">Bharti: {directCount}</span>}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-3">No government jobs found for {label}.</p>
            <Link href="/sarkari-naukri" className="text-primary hover:underline text-sm">← Browse all jobs</Link>
          </div>
        ) : (
          <SarkariNaukriList items={items} />
        )}
      </main>
    </div>
  );
}
