/**
 * sectionOwnership.ts — WHICH renderer paints a concept, so it paints it ONCE.
 *
 * The reference-pages review (23 Oct) found the same concept rendered twice on a
 * main exam page: the registry-driven ordered loop (SECTION_SUMMARY_RENDERERS) and
 * ContentModulesBlock both walked the editorial modules, so a record whose
 * content_modules carry `eligibility` / `age-limit` / `selection-process` /
 * `salary` / `reservation` / `vacancy-details` got a SECOND heading for a concept
 * the page already showed — under a slightly different wording ("Eligibility /
 * योग्यता" plus "Eligibility Criteria"). The old hand-maintained skip list could
 * only ever cover the slugs someone remembered to add.
 *
 * The rule now, in one sentence: **the registry decides**. A module slug belongs to
 * whichever surface owns its canonical section, and only that surface renders it.
 * Anything the registry does not know about (exam-pattern, date-sheet, revaluation)
 * keeps rendering in the block, so no editorial text is ever dropped.
 */
import { SECTION_BY_SLUG, hasData, type HasDataView, type Pillar } from "@/lib/sectionRegistry";
import { canonicalSectionSlug } from "@/lib/exam/sectionHeadings";
import type { ExamEntity } from "@/types/exam";

/**
 * Who renders this module on the page:
 *  - "loop"  the ordered main-page loop (placement main|both for this pillar);
 *  - "tab"   its own content-type sub-page (placement "tab" — reference material,
 *            never a second block on the main page);
 *  - "block" only ContentModulesBlock can show it (no registry section, or the
 *            section does not apply to this pillar) — so the text stays reachable.
 */
export type SectionOwner = "loop" | "tab" | "block";

/**
 * Editorial modules with NO registry section whose home is a content-type TAB (they are
 * reachable on a tab sub-page): `exam-pattern` rides the syllabus tab (CT_TO_MODULES).
 * The registry cannot answer for them, so the answer is stated here — and the ownership
 * test fails if one is ever registered, because then the registry must decide.
 *
 * `date-sheet` is DELIBERATELY NOT here. It has no registry section and is intentionally
 * absent from CONTENT_TYPE_TO_SECTION (adding it there caused recruitment records with
 * admit-card content to sprout a Date Sheet tab). So no /date-sheet route can ever light,
 * and if the block also skipped it (the old behaviour) a board/university editor's Date
 * Sheet had ZERO reader surface — orphaned content. Treating it as a plain block module
 * puts it on the main page, which is the only honest surface until a registry section +
 * CT bridge is agreed (that change touches the CMS sectionRegistry mirror, so it is
 * deferred and reported, not done silently). Revaluation / practical-exams already land
 * here for the same reason: main-page block, no tab.
 */
export const TAB_SURFACE_MODULES = new Set(["exam-pattern"]);

export function mainPageOwner(moduleSlug: string, pillar: Pillar | string): SectionOwner {
  const key = canonicalSectionSlug(moduleSlug);
  const def = SECTION_BY_SLUG[key];
  if (!def) return TAB_SURFACE_MODULES.has(key) ? "tab" : "block";
  if (!def.appliesTo.includes(pillar as Pillar)) return "block";
  return def.placement === "tab" ? "tab" : "loop";
}

/** The minimal `hasData` view, built the same way the page builds it (one home). */
export function hasDataViewOf(
  exam: ExamEntity,
  hasStructuredSyllabus = false,
): HasDataView {
  return {
    pillar: exam.pillar,
    dates: exam.dates,
    eligibility: exam.eligibility ?? null,
    vacancy: exam.vacancy ?? null,
    applicationFee: (exam.applicationFee ?? null) as HasDataView["applicationFee"],
    selectionProcess: exam.selectionProcess ?? null,
    academicInfo: {
      academicYear: exam.academicYear ?? null,
      semester: exam.semester ?? null,
      admissionTo: exam.admissionTo ?? null,
    },
    hasStructuredSyllabus,
    faqs: exam.faqs ?? null,
    contentModules: exam.contentModules,
  };
}

/**
 * AGE HAS ONE HOME. When this record/pillar actually renders an Age Limit section,
 * the age detail lives there (structured column first, module prose beneath it) and
 * the Eligibility table must NOT repeat it as a row. When no Age Limit section
 * renders, the row keeps the fact visible — precedence never loses data.
 */
export function ageLimitOwnsTheFact(exam: ExamEntity): boolean {
  return hasData(hasDataViewOf(exam), "age-limit");
}
