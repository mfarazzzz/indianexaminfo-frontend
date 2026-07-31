import { getExamsByPillar } from "@/services/examService";
import { getCategoriesByPillar } from "@/services/categoryService";
import { SarkariNaukriClient, type CategoryTab } from "./SarkariNaukriClient";
import type { ExamEntity } from "@/types/exam";

export async function SarkariNaukriSection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const [exams, categories] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getExamsByPillar("government-exam"),
    getCategoriesByPillar("government-exam"),
  ]);
  // Show featured first, then rest — never filter out non-featured
  const sorted = [...exams].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  // Build dynamic tabs from actual database categories
  const tabs: CategoryTab[] = [
    { label: "All", slug: null },
    ...categories.map((c) => ({
      label: c.shortName || c.name.replace(/ & .*$/, "").replace(/ Jobs$/, ""),
      slug: c.slug,
    })),
  ];

  return <SarkariNaukriClient exams={sorted} tabs={tabs} />;
}
