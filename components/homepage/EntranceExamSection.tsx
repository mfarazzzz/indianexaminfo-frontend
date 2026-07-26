import { getExamsByPillar } from "@/services/examService";
import { getCategoriesByPillar } from "@/services/categoryService";
import { EntranceExamClient, type CategoryTab } from "./EntranceExamClient";
import type { ExamEntity } from "@/types/exam";

export async function EntranceExamSection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const [exams, categories] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getExamsByPillar("entrance-exam"),
    getCategoriesByPillar("entrance-exam"),
  ]);
  const sorted = [...exams].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  // Build dynamic tabs from actual database categories
  const tabs: CategoryTab[] = [
    { label: "All", slug: null },
    ...categories.map((c) => ({
      label: c.shortName || c.name.replace(/ Entrance$/, "").replace(/ & .*$/, ""),
      slug: c.slug,
    })),
  ];

  return <EntranceExamClient exams={sorted} tabs={tabs} />;
}
