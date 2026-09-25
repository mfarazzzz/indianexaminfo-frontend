import { getExamsByPillar } from "@/services/examService";
import { getCategoriesByPillar } from "@/services/categoryService";
import { BoardUniversityClient, type CategoryTab } from "./BoardUniversityClient";
import type { ExamEntity } from "@/types/exam";

/**
 * Boards & Universities homepage block.
 *
 * The section used to fetch ONLY pillar "board-exam", so university rows never
 * appeared here (universities live under pillar "university-exam" — a separate
 * pillar, 38 published records). This now fetches BOTH pillars and renders two
 * distinct sections: Boards (board-exam) and Universities (university-exam).
 * Fetching the university pillar is done FIRST so the second section is not empty
 * before the split.
 */
export async function BoardUniversitySection({ exams: examsProp }: { exams?: ExamEntity[] } = {}) {
  const [boardExams, universityExams, boardCategories, universityCategories] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getExamsByPillar("board-exam"),
    getExamsByPillar("university-exam"),
    getCategoriesByPillar("board-exam"),
    getCategoriesByPillar("university-exam"),
  ]);

  const featuredFirst = (a: ExamEntity, b: ExamEntity) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  const boards = [...boardExams].sort(featuredFirst);
  const universities = [...universityExams].sort(featuredFirst);

  const boardTabs: CategoryTab[] = [
    { label: "All", slug: null },
    ...boardCategories.map((c) => ({
      label: c.shortName || c.name.replace(/ Board$/, "").replace(/ Exams$/, ""),
      slug: c.slug,
    })),
  ];
  const universityTabs: CategoryTab[] = [
    { label: "All", slug: null },
    ...universityCategories.map((c) => ({
      label: c.shortName || c.name.replace(/ University$/, "").replace(/ Exams$/, ""),
      slug: c.slug,
    })),
  ];

  return (
    <>
      <BoardUniversityClient
        heading="Board exams"
        blurb="Class 10 and 12 results, date sheets and admit cards"
        viewAllHref="/board-exam"
        exams={boards}
        tabs={boardTabs}
        emptyLabel="No board exams found in this category."
      />
      <BoardUniversityClient
        heading="Universities"
        blurb="University admissions, entrance tests and semester results"
        viewAllHref="/university-exam"
        exams={universities}
        tabs={universityTabs}
        emptyLabel="No universities found in this category."
      />
    </>
  );
}
