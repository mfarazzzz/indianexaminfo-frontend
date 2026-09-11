/**
 * examService.ts — Reads exam data from Supabase (live CMS-managed data).
 *
 * Previously read from hardcoded TypeScript arrays in /data/exams/*.
 * Now queries the `exams` table (and related `categories`) directly.
 * Field mapping mirrors CMS src/services/examService.ts mapRow() exactly.
 */

import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";
import { normalizeUrl } from "@/lib/utils";
import { contentTypeHasData, type HasDataView } from "@/lib/sectionRegistry";
import type { ExamEntity, Pillar, ContentType } from "@/types/exam";

// ── Derived status lookup ───────────────────────────────────────────────
// Fetches derived_status from exam_derived_status VIEW for a batch of exam IDs.
// Returns a map of exam_id → derived_status.
// Falls back silently — if the view is unavailable, callers use the stored column.
async function fetchDerivedStatuses(
  supabase: ReturnType<typeof createServerClient>,
  examIds: string[]
): Promise<Map<string, string>> {
  if (examIds.length === 0) return new Map();
  try {
    const { data } = await supabase
      .from("exam_derived_status")
      .select("exam_id, derived_status, strip_eligible, has_confirmed_dates")
      .in("exam_id", examIds);
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      map.set((row as any).exam_id, (row as any).derived_status);
    }
    return map;
  } catch (err) {
    // Log but don't throw — derived status is non-fatal; callers fall back
    // to the stored status column. Without this log, the failure was completely
    // invisible and caused wrong status badges to show for days.
    console.error("[examService] fetchDerivedStatuses failed:", err);
    return new Map();
  }
}

// ── Row mapper: Supabase snake_case → camelCase ExamEntity ─────────────
function mapRow(row: Record<string, unknown>, derivedStatus?: string): ExamEntity {
  // The current edition is the SINGLE SOURCE OF TRUTH for all cycle-specific data
  // (dates, vacancy, eligibility, fee). The parent `exams.*` copies are migration
  // residue and are NOT read here (they were dual-source: ~67% of has_* rows
  // disagreed — see NORMALIZATION_AUDIT.md). No `?? row.*` fallback.
  const ed = (row as any).current_ed;

  // Temporal / cycle fields — edition-only.
  const dates = ((ed?.important_dates as unknown[]) ?? []).map((d: any) => ({
    label:       d.label       as string,
    date:        d.date        as string,
    isUrgent:    d.isUrgent    as boolean ?? false,
    state:       d.state       as string | undefined,
    type:        d.type        as string | undefined,
    stage_label: d.stage_label as string | undefined,
    verified:    d.verified    as boolean | undefined,
  })) as ExamEntity["dates"];
  const eligibility = (ed?.eligibility as ExamEntity["eligibility"]) ?? undefined;
  const vacancy = (ed?.vacancy as number) ?? undefined;
  const applicationFee = (ed?.application_fee as ExamEntity["applicationFee"]) ?? undefined;
  const selectionProcess = (row.selection_process as string[]) ?? [];
  const faqs = (row.faqs as ExamEntity["faqs"]) ?? [];
  const contentModules = (ed?.content_modules as Record<string, unknown>) ?? undefined;
  const pillar = row.pillar as Pillar;

  // has_* flags are read EDITION-ONLY (no ?? row.has_* parent fallback). The
  // parent copies were the dual source (~67% disagreed); the edition flag is
  // what the CMS writes and what renders today.
  //
  // NOTE: has_* is NOT yet derived from content presence. Measurement showed
  // ~390 published exams set the edition result/admit-card/application flag TRUE
  // with an EMPTY content_modules blob — those sections render today from
  // structured/dated data, not an editorial module. Deriving via hasData (which
  // only inspects content_modules for these editorial sections) would wrongly
  // hide them site-wide. Deriving is deferred until hasData recognises
  // structured/dated presence for result/admit-card/application. See
  // NORMALIZATION_AUDIT.md. For now: edition-authoritative, parent dropped.
  const edFlag = (v: unknown) => (v as boolean) ?? false;

  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    shortName: (row.short_name as string) ?? "",
    pillar,
    category: (row.category_slug as string) ?? (row as any).cat?.slug ?? "",
    subcategory: (row.subcategory_slug as string) ?? (row as any).subcat?.slug ?? "",
    entityType: (row.entity_type as ExamEntity["entityType"]) ?? "exam",
    conductingBody: (row.conducting_body as string) ?? "",
    // Read-side guard (Finding #3): ensure a protocol so links never render as
    // same-origin (which 500s on click) and new URL() never throws.
    officialWebsite: normalizeUrl(row.official_website as string),
    // Status priority: editor-asserted cancelled/postponed win (edition-only now
    // that exams.status is dropped), else the derived VIEW status, else edition.
    status: ((): ExamEntity["status"] => {
      const stored = (ed?.status as string);
      if (stored === "cancelled" || stored === "postponed") {
        return stored as ExamEntity["status"];
      }
      return (derivedStatus as ExamEntity["status"])
          ?? (ed?.status   as ExamEntity["status"])
          ?? "upcoming";
    })(),
    // ── Content flags: edition-only. Parent exams.has_* were DROPPED (step 4).
    // date-sheet/mock-test/previous-papers/study-material had NO edition column and
    // only ever existed on the parent — now dropped, so they are always false until
    // a proper edition-level source exists (previous-papers/study-material/mock-test
    // move to the exam_resources library; date-sheet is a board concept with no home).
    hasAdmitCard:      edFlag(ed?.has_admit_card),
    hasResult:         edFlag(ed?.has_result),
    hasAnswerKey:      edFlag(ed?.has_answer_key),
    hasSyllabus:       edFlag(ed?.has_syllabus),
    hasDateSheet:      false,
    hasMockTest:       false,
    hasPreviousPapers: false,
    hasStudyMaterial:  false,
    hasApplication:    edFlag(ed?.has_application),
    hasNotification:   edFlag(ed?.has_notification),
    hasCutoff:         edFlag(ed?.has_cutoff),
    dates,
    eligibility,
    vacancy,
    applicationFee,
    selectionProcess,
    syllabusWeightageType: (row.syllabus_weightage_type as "marks"|"questions"|"percent") ?? null,
    academicYear: (row.academic_year as string) ?? undefined,
    semester: (row.semester as string) ?? undefined,
    admissionTo: (row.admission_to as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    // updated_at is the real last-write timestamp; last_updated is NOT read
    // (legacy CURRENT_DATE-at-insert column, cycle residue on exams).
    lastUpdated: (row.updated_at as string) ?? new Date().toISOString().split("T")[0],
    isFeatured: (row.is_featured as boolean) ?? false,
    searchKeywords: (row.search_keywords as string[]) ?? [],
    seoTitle: (row.seo_title as string) ?? undefined,
    seoDescription: (row.seo_description as string) ?? undefined,
    faqs,
    contentModules,
  };
}

// ── Explicit mapping for content-type flag lookup ───────────────────────
const CT_TO_FLAG: Partial<Record<ContentType, keyof ExamEntity>> = {
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
// Parent exams.* cycle columns (has_*, important_dates, vacancy, last_updated,
// status) were DROPPED in step 4. All cycle data + status now read from the
// current edition (and status from the exam_derived_status VIEW). updated_at is
// the real last-write timestamp.
const LIST_SELECT = `
  id, slug, name, short_name, pillar, entity_type, is_featured,
  updated_at, tags, search_keywords,
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
      const rows = data ?? [];
      const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
      return rows.map((r: any) => mapRow(r, derivedMap.get(r.id)));
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

      // Fallback: try matching by short_name (case-insensitive)
      if (!data) {
        const shortSlug = slugsToTry[slugsToTry.length - 1]; // most normalized version
        let query = supabase
          .from("exams")
          .select(DETAIL_SELECT)
          .ilike("short_name", shortSlug);

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
        }
      }

      if (!data) return null;
      // Fetch derived status in parallel with the map — single record, one row
      const derivedMap = await fetchDerivedStatuses(supabase, [(data as any).id]);
      return mapRow(data as Record<string, unknown>, derivedMap.get((data as any).id));
    } catch (err) {
      console.error("[examService] getExamBySlug failed:", err);
      return null;
    }
  }, ["exams", `exam:${slug}`], { revalidate: 60 }); // 1 min — short TTL so content module changes appear quickly
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
      const rows = data ?? [];
      const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
      return rows.map((r: any) => mapRow(r, derivedMap.get(r.id)));
    } catch (err) {
      console.error("[examService] getExamsByPillar failed:", err);
      return [];
    }
  }, ["exams", `pillar:${pillar}`], { revalidate: 1800 });
}

export async function getExamsByCategory(category: string): Promise<ExamEntity[]> {
  return cached(async () => {
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
      const rows = data ?? [];
      const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
      return rows.map((r: any) => mapRow(r, derivedMap.get(r.id)));
    } catch (err) {
      console.error("[examService] getExamsByCategory failed:", err);
      return [];
    }
  }, ["exams", `category:${category}`], { revalidate: 600 });
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
    const rows = data ?? [];
    const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
    return rows.map((r: any) => mapRow(r, derivedMap.get(r.id)));
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
    const rows = data ?? [];
    const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
    return rows.map((r: any) => mapRow(r, derivedMap.get(r.id)));
  } catch (err) {
    console.error("[examService] getRelatedExams failed:", err);
    return [];
  }
}

export async function searchExams(query: string): Promise<ExamEntity[]> {
  if (!query.trim()) return [];
  try {
    const supabase = createServerClient();
    // Escape special PostgREST characters to prevent filter injection
    const escaped = query.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_").trim();
    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .or(`name.ilike.%${escaped}%,short_name.ilike.%${escaped}%`)
      .limit(20);
    if (error) throw error;
    const rows = data ?? [];
    const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
    return rows.map((r: any) => mapRow(r, derivedMap.get(r.id)));
  } catch (err) {
    console.error("[examService] searchExams failed:", err);
    return [];
  }
}

export async function getExamsByContentType(contentType: ContentType): Promise<ExamEntity[]> {
  // The parent exams.has_* flag columns were dropped (step 4). Presence is now
  // decided solely by hasData/contentTypeHasData (the registry gate used by tabs,
  // sitemap, and routes). Fetch all exams, then filter by real data presence —
  // fetch-then-filter replaces the old `.eq(has_x, true)` SQL prefilter.
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
    return rows
      .map((r: any) => mapRow(r, derivedMap.get(r.id)))
      .filter((exam) => contentTypeHasData(exam as unknown as HasDataView, contentType));
  } catch (err) {
    console.error("[examService] getExamsByContentType failed:", err);
    return [];
  }
}

export async function getExamsByStatus(status: string): Promise<ExamEntity[]> {
  // exams.status was dropped (step 4); status now derives from the VIEW + edition
  // via mapRow. Fetch-then-filter on the resolved status instead of a SQL .eq on
  // the removed parent column.
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("exams")
      .select(LIST_SELECT)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    const derivedMap = await fetchDerivedStatuses(supabase, rows.map((r: any) => r.id));
    return rows
      .map((r: any) => mapRow(r, derivedMap.get(r.id)))
      .filter((exam) => exam.status === status);
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

// ── exam_resources: the accumulated library (level 3) ─────────────────────
// Year-tagged materials shared across all editions. RLS enforces the published +
// not-deleted + parent-published filter, so unpublished rows never reach here.

export type ResourceKind =
  | "previous-paper" | "study-material" | "mock-test" | "sample-paper" | "syllabus-pdf";

export interface ExamResourceRow {
  id: string;
  kind: ResourceKind;
  year: number | null;
  stageLabel: string | null;
  title: string;
  url: string;
  description: string | null;
  language: string | null;
  paperType: string | null;
  fileSizeKb: number | null;
  displayOrder: number;
  isPublished: boolean;
}

// ── Structured syllabus (identity-level, exam_syllabus_subjects) ──────────
export type WeightageType = "marks" | "questions" | "percent";
export interface SyllabusSubjectRow {
  subject: string;
  topics: string | null;
  weightageValue: number | null;
}
export interface StructuredSyllabus {
  weightageType: WeightageType | null;
  subjects: SyllabusSubjectRow[];
}

/**
 * THE single source for "does this exam have a structured syllabus?" — used by BOTH the tab
 * row (EntityDetailPage) AND the /syllabus sub-page gate, so tab visibility and page existence
 * can never disagree (they did: the tab showed while the page 404'd). Same cache key as
 * getExamSyllabus so a revalidation refreshes both together.
 */
export async function hasStructuredSyllabus(examId: string): Promise<boolean> {
  const syllabus = await getExamSyllabus(examId, null);
  return syllabus.subjects.length > 0;
}

/**
 * THE single content-type gate for exam sub-pages, used by EVERY pillar route (entrance,
 * board, university, sarkari). Wraps the synchronous registry contentTypeHasData but first
 * injects hasStructuredSyllabus (which requires a DB read hasData can't do synchronously),
 * so tab visibility and page existence read the SAME rule. Prevents the "syllabus tab shows
 * but /syllabus 404s" class across all pillars from one place.
 */
export async function contentTypeAvailable(exam: ExamEntity, contentType: string): Promise<boolean> {
  const needsSyllabus = contentType === "syllabus";
  const flag = needsSyllabus ? await hasStructuredSyllabus(exam.id) : false;
  return contentTypeHasData({ ...(exam as unknown as HasDataView), hasStructuredSyllabus: flag }, contentType);
}

/** The exam's structured syllabus: per-exam weightage unit + subject rows (order preserved). */
export async function getExamSyllabus(examId: string, weightageType: WeightageType | null): Promise<StructuredSyllabus> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("exam_syllabus_subjects")
        .select("subject, topics, weightage_value")
        .eq("exam_id", examId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return {
        weightageType,
        subjects: (data ?? []).map((r: any): SyllabusSubjectRow => ({
          subject: r.subject, topics: (r.topics as string) ?? null, weightageValue: (r.weightage_value as number) ?? null,
        })),
      };
    } catch (err) {
      console.error("[examService] getExamSyllabus failed:", err);
      return { weightageType, subjects: [] };
    }
  }, ["exams", `exam-syllabus:${examId}`], { revalidate: 1800 });
}

/**
 * The exam's resource library. RLS already restricts to published, non-deleted rows on
 * published exams — so a caller never has to re-filter is_published. Ordered undated-first
 * ("All years" evergreen items at the top of their kind), then newest year, then order/title.
 */
export async function getExamResources(examId: string): Promise<ExamResourceRow[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("exam_resources")
        .select("id, kind, year, stage_label, title, url, description, language, paper_type, file_size_kb, display_order, is_published")
        .eq("exam_id", examId)
        // Defense in depth: RLS already excludes unpublished for the anon client, but a
        // second app-level filter guarantees hasData never counts one even if a future
        // code path runs authenticated (staff_read_all would otherwise return them).
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => r.is_published === true)
        .map((r: any): ExamResourceRow => ({
          id: r.id, kind: r.kind, year: (r.year as number) ?? null,
          stageLabel: (r.stage_label as string) ?? null, title: r.title, url: r.url,
          description: (r.description as string) ?? null, language: (r.language as string) ?? null,
          paperType: (r.paper_type as string) ?? null, fileSizeKb: (r.file_size_kb as number) ?? null,
          displayOrder: (r.display_order as number) ?? 0, isPublished: r.is_published === true,
        }));
    } catch (err) {
      console.error("[examService] getExamResources failed:", err);
      return [];
    }
  }, ["exams", `exam-resources:${examId}`], { revalidate: 1800 });
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
