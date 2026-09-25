import Link from "next/link";
import { getRegionsWithRecords } from "@/services/regionService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { SARKARI_LABELS } from "@/lib/sarkari/labels";

export const revalidate = 1800;

export default async function AllStatesPage() {
  // Only regions that actually have records (exams by region OR vacancies by
  // state); all-india is excluded. States first, then union territories.
  const regions = await getRegionsWithRecords();
  const states = regions.filter((r) => r.kind === "state");
  const uts = regions.filter((r) => r.kind === "ut");

  const Card = ({ slug, label, examCount, vacancyCount }: (typeof regions)[number]) => (
    <Link
      key={slug}
      href={`/sarkari-naukri/state/${slug}`}
      className="flex items-center justify-between rounded border border-border bg-card px-4 py-3 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
    >
      <span>{label}</span>
      <span className="text-xs text-gray-400">
        {examCount + vacancyCount}
      </span>
    </Link>
  );

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: SARKARI_LABELS.root, href: "/sarkari-naukri" },
        { name: "States", href: "/sarkari-naukri/state" },
      ]} />
      <AdSlot position="category-top" size="728x90" hideWhenEmpty />
      <main>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">Government Jobs &amp; Exams by State</h1>
        <p className="text-sm text-gray-500 mb-5">Browse government exams and vacancies by state and union territory. Counts combine exams and vacancies.</p>

        {states.length > 0 && (
          <section aria-label="States" className="mb-6">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">States</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {states.map((r) => <Card key={r.slug} {...r} />)}
            </div>
          </section>
        )}

        {uts.length > 0 && (
          <section aria-label="Union Territories">
            <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Union Territories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {uts.map((r) => <Card key={r.slug} {...r} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
