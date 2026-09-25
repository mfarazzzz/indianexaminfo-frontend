import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getByState } from "@/services/sarkariNaukriService";
import { getExamsByRegion, getTodayIST } from "@/services/examService";
import { getRegion } from "@/services/regionService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { ExamListRow } from "@/components/exam/ExamListRow";
import { SarkariNaukriList } from "@/components/sarkari-naukri/SarkariNaukriList";
import { sortRecruitmentsOpenFirst } from "@/lib/sarkari/listing";
import { SARKARI_LABELS } from "@/lib/sarkari/labels";

export const revalidate = 1800;
export const dynamicParams = true;

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const region = await getRegion(state);
  if (!region) return {};
  const label = region.label;
  const year = getCurrentYear();
  return buildExamMetadata({
    pageType: "category",
    title: `${label} Government Jobs & Exams ${year} — Sarkari Naukri ${label}`,
    description: `Latest government exams and Sarkari Naukri vacancies in ${label} ${year}. State PSC, police, boards, universities and direct recruitment in ${label}.`,
    canonicalUrl: `${siteConfig.url}/sarkari-naukri/state/${state}`,
  });
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;

  // Label comes from the regions controlled list, not slug-prettification.
  const region = await getRegion(state);
  // Unknown slug → 404. (region null means it's not a real state/UT/all-india value.)
  if (!region) notFound();

  const [regionExams, vacancies, todayISO] = await Promise.all([
    getExamsByRegion(state),
    getByState(state),
    getTodayIST(),
  ]);

  // Content gating (same rule as action links): a region with NO records of
  // EITHER kind is a real 404, never an empty shell.
  if (regionExams.length === 0 && vacancies.length === 0) notFound();

  const label = region.label;
  const year = getCurrentYear();
  const sortedVacancies = sortRecruitmentsOpenFirst(vacancies);

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: SARKARI_LABELS.root, href: "/sarkari-naukri" },
        { name: "States", href: "/sarkari-naukri/state" },
        { name: label, href: `/sarkari-naukri/state/${state}` },
      ]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" hideWhenEmpty />
      </div>

      <main>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
          {label} Government Jobs &amp; Exams {year}
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          {regionExams.length > 0 && `${regionExams.length} exam${regionExams.length === 1 ? "" : "s"}`}
          {regionExams.length > 0 && vacancies.length > 0 && " · "}
          {vacancies.length > 0 && `${vacancies.length} vacanc${vacancies.length === 1 ? "y" : "ies"}`}
          {" in "}{label}.
        </p>

        {/* Section 1: EXAMS by region (exams.region). */}
        {regionExams.length > 0 && (
          <section aria-label={`${label} exams`} className="mb-6">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
              Exams in {label}
            </h2>
            <div className="divide-y divide-border border-t border-border">
              {regionExams.map((e) => <ExamListRow key={e.id} exam={e} />)}
            </div>
          </section>
        )}

        {/* Section 2: VACANCIES by state (sarkari_naukri.state). */}
        {vacancies.length > 0 && (
          <section aria-label={`${label} vacancies`}>
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">
              Vacancies in {label}
            </h2>
            <SarkariNaukriList items={sortedVacancies} todayISO={todayISO} />
          </section>
        )}
      </main>
    </div>
  );
}
