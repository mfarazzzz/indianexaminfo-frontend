import { getExamsByPillar } from "@/services/examService";
import { getCategoriesByPillar } from "@/services/categoryService";
import { BoardUniversityClient, type CategoryTab } from "./BoardUniversityClient";
import type { ExamEntity } from "@/types/exam";

export async function BoardUniversitySection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const [exams, categories] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getExamsByPillar("board-university"),
    getCategoriesByPillar("board-university"),
  ]);
  const sorted = [...exams].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  // Build dynamic tabs from actual database categories
  const tabs: CategoryTab[] = [
    { label: "All", slug: null },
    ...categories.map((c) => ({
      label: c.shortName || c.name.replace(/ Board$/, "").replace(/ Exams$/, ""),
      slug: c.slug,
    })),
  ];

  return <BoardUniversityClient exams={sorted} tabs={tabs} />;
}
