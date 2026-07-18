import type { Metadata } from "next";
import Link from "next/link";
import { getByDepartment } from "@/services/sarkariNaukriService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { SarkariNaukriList } from "@/components/sarkari-naukri/SarkariNaukriList";

export const revalidate = 1800;

type Props = { params: Promise<{ dept: string }> };

function formatDept(dept: string): string {
  return decodeURIComponent(dept).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dept } = await params;
  const label = formatDept(dept);
  const year = getCurrentYear();
  return buildExamMetadata({
    pageType: "category",
    title: `${label} Jobs ${year} — Government Vacancies`,
    description: `Latest ${label} government job vacancies ${year}. Apply for Sarkari Naukri in ${label} department.`,
    canonicalUrl: `${siteConfig.url}/sarkari-naukri/department/${dept}`,
  });
}

export default async function DepartmentPage({ params }: Props) {
  const { dept } = await params;
  const items = await getByDepartment(dept);
  const label = formatDept(dept);
  const year = getCurrentYear();

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: "Sarkari Naukri", href: "/sarkari-naukri" },
        { name: label, href: `/sarkari-naukri/department/${dept}` },
      ]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <main>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
          {label} — Government Jobs {year}
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          {items.length} vacancies in {label}
        </p>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-3">No jobs found for this department.</p>
            <Link href="/sarkari-naukri" className="text-primary hover:underline text-sm">← Browse all jobs</Link>
          </div>
        ) : (
          <SarkariNaukriList items={items} />
        )}
      </main>
    </div>
  );
}
