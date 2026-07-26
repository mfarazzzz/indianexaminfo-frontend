/**
 * examService.ts — Reads exam data from Supabase (live CMS-managed data).
 *
 * Previously read from hardcoded TypeScript arrays in /data/exams/*.
 * Now queries the `exams` table (and related `categories`) directly.
 * Field mapping mirrors CMS src/services/examService.ts mapRow() exactly.
 */

import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";
import type { ExamEntity, Pillar, ContentType } from "@/types/exam";

// ── Row mapper: Supabase snake_case → camelCase ExamEntity ─────────────
function mapRow(row: Record<string, unknown>): ExamEntity {
  // If a current edition exists, prefer its temporal data over legacy columns
  const ed = (row as any).current_ed;
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    shortName: (row.short_name as string) ?? "",
    pillar: row.pillar as Pillar,
    category: (row.category_slug as string) ?? (row as any).cat?.slug ?? "",
    subcategory: (row.subcategory_slug as string) ?? (row as any).subcat?.slug ?? "",
    entityType: (row.entity_type as ExamEntity["entityType"]) ?? "exam",
    conductingBody: (row.conducting_body as string) ?? "",
    officialWebsite: (row.official_website as string) ?? "",
    status: (ed?.status as ExamEntity["status"]) ?? (row.status as ExamEntity["status"]) ?? "upcoming",
    hasAdmitCard: (ed?.has_admit_card as boolean) ?? (row.has_admit_card as boolean) ?? false,
    hasResult: (ed?.has_result as boolean) ?? (row.has_result as boolean) ?? false,
    hasAnswerKey: (ed?.has_answer_key as boolean) ?? (row.has_answer_key as boolean) ?? false,
    hasSyllabus: (ed?.has_syllabus as boolean) ?? (row.has_syllabus as boolean) ?? false,
    hasDateSheet: (row.has_date_sheet as boolean) ?? false,
    hasMockTest: (row.has_mock_test as boolean) ?? false,
    hasPreviousPapers: (row.has_previous_papers as boolean) ?? false,
    hasStudyMaterial: (row.has_study_material as boolean) ?? false,
    hasApplication: (ed?.has_application as boolean) ?? (row.has_application as boolean) ?? false,
    hasNotification: (ed?.has_notification as boolean) ?? (row.has_notification as boolean) ?? false,
    hasCutoff: (ed?.has_cutoff as boolean) ?? (row.has_cutoff as boolean) ?? false,
    dates: ((ed?.important_dates ?? row.important_dates) as unknown[] ?? []) as ExamEntity["dates"],
    eligibility: (ed?.eligibility as ExamEntity["eligibility"]) ?? (row.eligibility as ExamEntity["eligibility"]) ?? undefined,
    vacancy: (ed?.vacancy as number) ?? (row.vacancy as number) ?? undefined,
    applicationFee: (ed?.application_fee as ExamEntity["applicationFee"]) ?? (row.application_fee as ExamEntity["applicationFee"]) ?? undefined,
    selectionProcess: (row.selection_process as string[]) ?? [],
    syllabusHighlights: (row.syllabus_highlights as string[]) ?? [],
    academicYear: (row.academic_year as string) ?? undefined,
    semester: (row.semester as string) ?? undefined,
    admissionTo: (row.admission_to as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    lastUpdated: (row.last_updated as string) ?? (row.updated_at as string) ?? new Date().toISOString().split("T")[0],
    isFeatured: (row.is_featured as boolean) ?? false,
    searchKeywords: (row.search_keywords as string[]) ?? [],
    seoTitle: (row.seo_title as string) ?? undefined,
    seoDescription: (row.seo_description as string) ?? undefined,
    faqs: (row.faqs as ExamEntity["faqs"]) ?? [],
  };
}

// ── Explicit mapping for content-type flag lookup ───────────────────────
const CT_TO_FLAG: Record<ContentType, keyof ExamEntity> = {
  "admit-card":      "hasAdmitCard",
  result:            "hasResult",
  "answer-key":      "hasAnswerKey",
  syllabus:          "hasSyllabus",
  "date-sheet":      "hasDateSheet",
  "mock-test":       "hasMockTest",
  "previous-papers": "hasPreviousPapers",
  "study-material":  "hasStudyMaterial",
  application:       "hasApplication",
  notification:      "hasNotification",
  cutoff:            "hasCutoff",
  books:             "hasStudyMaterial",
};

// ── Base Supabase select for exam list ──────────────────────────────────
const LIST_SELECT = `
  id, slug, name, short_name, pillar, entity_type, status, is_featured,
  vacancy, last_updated, updated_at,
  has_admit_card, has_result, has_answer_key, has_syllabus, has_date_sheet,
  has_mock_test, has_previous_papers, has_study_material, has_application,
  has_notification, has_cutoff, tags, search_keywords, important_dates,
  cat:categories!category_id(slug), subcat:categories!subcategory_id(slug),
  current_ed:exam_editions!current_edition_id(
    id, year, edition_label, status, important_dates, vacancy,
    has_admit_card, has_result, has_answer_key, has_syllabus,
    has_application, has_notification, has_cutoff
  )
`;

// ── Full exam detail select ─────────────────────────────────────────────
const DETAIL_SELECT = `
  *, cat:categories!category_id(slug), subcat:categories!subcategory_id(slug),
  current_ed:exam_editions!current_edition_id(*)
`;

// ── Service functions ────────────────────────────────────────────────────

export async function getAllExams(): Promise<ExamEntity[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("exams")
        .select(LIST_SELECT)
        .order("is_featured", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[examService] getAllExams failed:", err);
      return [];
    }
  }, ["exams"], { revalidate: 1800 });
}

export async function getExamBySlug(
  slug: string,
  category?: string
): Promise<ExamEntity | null> {
  return cached(async () => {
    try {
      const supabase = createServerClient();

      // Normalize slug: strip year suffix, spaces, handle legacy formats
      // e.g. "cat-2026" → "cat", "cat 2026" → "cat", "mba-cat-2026" → "cat"
      let normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
      const legacySlugs = [
        normalizedSlug,
        normalizedSlug.replace(/-\d{4}$/, ""),             // strip trailing -2026
        normalizedSlug.replace(/^mba-/, "").replace(/-\d{4}$/, ""), // mba-cat-2026 → cat
      ];
      // Deduplicate
      const slugsToTry = [...new Set(legacySlugs)];

      let data: any = null;

      for (const s of slugsToTry) {
        let query = supabase
          .from("exams")
          .select(DETAIL_SELECT)
          .eq("slug", s);

        if (category) {
          const { data: catData } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", category)
            .single();
          if (catData) {
            query = query.eq("category_id", (catData as any).id);
          }
        }

        const { data: result, error } = await query.maybeSingle();
        if (!error && result) {
          data = result;
          break;
        }
      }

      if (!data) return null;
      return mapRow(data as Record<string, unknown>);
    } catch (err) {
      console.error("[examService] getExamBySlug failed:", err);
      return null;
    }
  }, ["exams", `exam:${slug}`], { revalidate: 3600 });
}

export async function getExamsByPillar(pillar: Pillar): Promise<ExamEntity[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("exams")
        .select(LIST_SELECT)
        .eq("pillar", pillar)
        .order("is_featured", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[examService] getExamsByPillar failed:", err);
      return [];
    }
  }, ["exams", `pillar:${pillar}`], { revalidate: 1800 });
}

export async function getExamsByCategory(category: string): Promise<ExamEntity[]> {
  try {
    const supabase = createServerClient();
    // Look up category id by slug first
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .maybeSingle();

    if (!catData) return [];

    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .eq("category_id", (catData as any).id)
      .order("is_featured", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[examService] getExamsByCategory failed:", err);
    return [];
  }
}

export async function getFeaturedExams(): Promise<ExamEntity[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .eq("is_featured", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[examService] getFeaturedExams failed:", err);
    return [];
  }
}

export async function getRelatedExams(examId: string): Promise<ExamEntity[]> {
  try {
    const supabase = createServerClient();
    // First get the exam to find its category
    const { data: examData } = await supabase
      .from("exams")
      .select("category_id, pillar")
      .eq("id", examId)
      .single();

    if (!examData) return [];

    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .neq("id", examId)
      .eq("pillar", (examData as any).pillar)
      .eq("category_id", (examData as any).category_id)
      .limit(4);
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[examService] getRelatedExams failed:", err);
    return [];
  }
}

export async function searchExams(query: string): Promise<ExamEntity[]> {
  if (!query.trim()) return [];
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[examService] searchExams failed:", err);
    return [];
  }
}

export async function getExamsByContentType(contentType: ContentType): Promise<ExamEntity[]> {
  const flagCol: Record<ContentType, string> = {
    "admit-card":      "has_admit_card",
    result:            "has_result",
    "answer-key":      "has_answer_key",
    syllabus:          "has_syllabus",
    "date-sheet":      "has_date_sheet",
    "mock-test":       "has_mock_test",
    "previous-papers": "has_previous_papers",
    "study-material":  "has_study_material",
    application:       "has_application",
    notification:      "has_notification",
    cutoff:            "has_cutoff",
    books:             "has_study_material",
  };
  const col = flagCol[contentType];
  if (!col) return [];
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .eq(col, true)
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[examService] getExamsByContentType failed:", err);
    return [];
  }
}

export async function getExamsByStatus(status: string): Promise<ExamEntity[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .eq("status", status)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => mapRow(r));
  } catch (err) {
    console.error("[examService] getExamsByStatus failed:", err);
    return [];
  }
}

export async function generateStaticExamParams(): Promise<{ slug: string }[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.from("exams").select("slug");
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ slug: r.slug as string }));
  } catch (err) {
    console.error("[examService] generateStaticExamParams failed:", err);
    return [];
  }
}

/**
 * Live count of exams in a pillar. Used by homepage cards so the numbers
 * reflect the database instead of hardcoded literals. Returns 0 on failure —
 * callers should render an empty state rather than substituting a guess.
 */
export async function getExamCountByPillar(pillar: Pillar): Promise<number> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { count, error } = await supabase
        .from("exams")
        .select("id", { count: "exact", head: true })
        .eq("pillar", pillar);
      if (error) throw error;
      return count ?? 0;
    } catch (err) {
      console.error(`[examService] getExamCountByPillar(${pillar}) failed:`, err);
      return 0;
    }
  }, ["exams", `exams:count:${pillar}`], { revalidate: 1800 });
}

// ── Edition-aware functions ─────────────────────────────────────────────

export type EditionSummary = {
  id: string;
  year: number;
  session: string;
  editionLabel: string;
  status: string;
  isCurrent: boolean;
};

/**
 * Get a specific archived edition of an exam (for /exam/slug/2025 pages).
 * Returns the exam identity merged with that edition's temporal data.
 */
export async function getExamArchive(slug: string, year: number): Promise<ExamEntity | null> {
  try {
    const supabase = createServerClient();
    // First get the exam
    const { data: exam } = await supabase
      .from("exams")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!exam) return null;

    // Get the specific edition
    const { data: edition } = await supabase
      .from("exam_editions")
      .select("*")
      .eq("exam_id", (exam as any).id)
      .eq("year", year)
      .eq("session", "main")
      .maybeSingle();
    if (!edition) return null;

    // Fetch full exam with this edition's data overlaid
    const { data: fullExam } = await supabase
      .from("exams")
      .select(`*, cat:categories!category_id(slug), subcat:categories!subcategory_id(slug)`)
      .eq("id", (exam as any).id)
      .single();
    if (!fullExam) return null;

    // Overlay edition data onto exam row for mapRow compatibility
    const merged = { ...fullExam, current_ed: edition };
    return mapRow(merged as Record<string, unknown>);
  } catch (err) {
    console.error("[examService] getExamArchive failed:", err);
    return null;
  }
}

/**
 * List all editions for an exam (for "Previous Years" widget).
 */
export async function getExamEditions(examSlug: string): Promise<EditionSummary[]> {
  try {
    const supabase = createServerClient();
    const { data: exam } = await supabase
      .from("exams")
      .select("id")
      .eq("slug", examSlug)
      .maybeSingle();
    if (!exam) return [];

    const { data, error } = await supabase
      .from("exam_editions")
      .select("id, year, session, edition_label, status, is_current")
      .eq("exam_id", (exam as any).id)
      .order("year", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((r: any) => ({
      id: r.id,
      year: r.year,
      session: r.session,
      editionLabel: r.edition_label,
      status: r.status,
      isCurrent: r.is_current,
    }));
  } catch (err) {
    console.error("[examService] getExamEditions failed:", err);
    return [];
  }
}
