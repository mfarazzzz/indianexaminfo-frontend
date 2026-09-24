import Link from "next/link";
import { getStateList } from "@/services/sarkariNaukriService";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { SARKARI_LABELS } from "@/lib/sarkari/labels";

export const revalidate = 1800;

export default async function AllStatesPage() {
  const states = (await getStateList()).filter((state) => state.state !== "all-india");

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { name: SARKARI_LABELS.root, href: "/sarkari-naukri" },
        { name: "All states", href: "/sarkari-naukri/state" },
      ]} />
      <AdSlot position="category-top" size="728x90" hideWhenEmpty />
      <main>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">All states — {SARKARI_LABELS.root}</h1>
        <p className="text-sm text-gray-500 mb-5">Browse government exams and vacancies by state.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {states.map((state) => (
            <Link
              key={state.state}
              href={`/sarkari-naukri/state/${state.state}`}
              className="flex items-center justify-between rounded border border-border bg-card px-4 py-3 text-sm text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="capitalize">{state.state.replace(/-/g, " ")}</span>
              <span className="text-xs text-gray-400">{state.count}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
