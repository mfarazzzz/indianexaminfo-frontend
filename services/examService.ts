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
/** What the derived-status view contributes per exam: the status plus the two
 *  confirmed-only dates (admit_card_date / result_date). Both dates are null unless
 *  a CONFIRMED row supplies them — an expected/postponed/cancelled row never does. */
type DerivedInfo = {
  status: string | undefined;
  admitCardDate: string | null;
  resultDate: string | null;
};

// Returns a map of exam_id → DerivedInfo (status + derived confirmed dates).
// Falls back silently — if the view is unavailable, callers use the stored column.
async function fetchDerivedStatuses(
  supabase: ReturnType<typeof createServerClient>,
  examIds: string[]
): Promise<Map<string, DerivedInfo>> {
  if (examIds.length === 0) return new Map();
  try {
    const { data } = await supabase
      .from("exam_derived_status")
      .select("exam_id, derived_status, strip_eligible, has_confirmed_dates, admit_card_date, result_date")
      .in("exam_id", examIds);
    const map = new Map<string, DerivedInfo>();
    for (const row of data ?? []) {
      map.set((row as any).exam_id, {
        status: (row as any).derived_status ?? undefined,
        admitCardDate: (row as any).admit_card_date ?? null,
        resultDate: (row as any).result_date ?? null,
      });
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
function mapRow(row: Record<string, unknown>, derived?: DerivedInfo): ExamEntity {
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
    note:        d.note        as string | undefined,
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
    // Current edition's year LABEL, from the already-loaded current_ed (current_edition_id FK
    // join). No extra query, no edition re-selection. Drives the main-page title/H1 year so it
    // reflects the current cycle instead of the calendar year.
    currentEditionYear: (ed?.year as number) ?? undefined,
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
      return (derived?.status as ExamEntity["status"])
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
    // Derived confirmed dates from exam_derived_status (null unless a CONFIRMED
    // timeline row supplies them). Exposed so the Admit Card / Result renderers can
    // read the canonical timeline date instead of the module's own date field.
    admitCardDate: derived?.admitCardDate ?? null,
    resultDate: derived?.resultDate ?? null,
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

// ── Deadline / status bands ───────────────────────────────────────────────
// Homepage top strip, rebuilt as FOUR distinct date-derived bands instead of one
// flat list. Reads the EXISTING exam_derived_status VIEW — no new status model,
// no manually hard-coded deadlines. "Today" is the VIEW's own today_ist (IST),
// NOT the calendar year and NOT strip_eligible-as-urgency (the earlier bug).
//
// Bands (each classified purely on real, confirmed dates relative to today_ist):
//   closing-soon      → app_close_date is in the FUTURE (>= today). This is the
//                       ONLY band that means "closing soon", and it filters on
//                       app_close_date — never on strip_eligible alone.
//   admit-card-out    → admit_card_date has passed (<= today) and the exam has
//                       not started yet (exam_start_date >= today or unknown).
//   results-out       → result_date is within the last 30 days (recent result).
//   exams-this-month  → exam_start_date is within the next 30 days.
// A given exam can legitimately appear in more than one band (different real
// facts). Past-dated app-close rows (e.g. an exam whose application already
// closed) simply do NOT enter closing-soon — they may still surface under
// admit-card-out or exams-this-month via their own future dates.
//
// Fetched ONCE at page level and passed to the component as props — the strip
// component performs no Supabase query of its own.
export type DeadlineBandItem = {
  examId: string;
  slug: string;
  pillar: Pillar;
  name: string;
  shortName: string;
  category: string;
  derivedStatus: string;
  /** The single date this band is about (ISO yyyy-mm-dd). */
  date: string;
};

export type DeadlineBands = {
  today: string | null;
  closingSoon: DeadlineBandItem[];
  admitCardOut: DeadlineBandItem[];
  resultsOut: DeadlineBandItem[];
  examsThisMonth: DeadlineBandItem[];
};

const EMPTY_BANDS: DeadlineBands = {
  today: null,
  closingSoon: [],
  admitCardOut: [],
  resultsOut: [],
  examsThisMonth: [],
};

/** yyyy-mm-dd string compare is safe (ISO dates sort lexically). Add N days via Date. */
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The SINGLE source of "today" for every past/future date decision in the
 * frontend. Reads today_ist straight from the exam_derived_status VIEW so that
 * homepage widgets classify dates on the same Asia/Kolkata calendar day the
 * VIEW (and getDeadlineBands) use — never on the server's UTC clock. If the
 * VIEW returns no rows, fall back to computing the IST date locally so callers
 * always get a valid yyyy-mm-dd. Returned string is directly comparable to the
 * ISO `date` values stored on ExamEntity.dates (lexical compare is correct for
 * zero-padded ISO dates).
 */
export async function getTodayIST(): Promise<string> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from("exam_derived_status")
        .select("today_ist")
        .limit(1)
        .maybeSingle();
      const fromView = (data as { today_ist?: string } | null)?.today_ist;
      if (fromView) return fromView;
    } catch (err) {
      console.error("[examService] getTodayIST view read failed, falling back:", err);
    }
    // Fallback: compute the current calendar date in Asia/Kolkata (UTC+5:30).
    return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }, ["exams", "today-ist"], { revalidate: 1800 });
}

/**
 * The homepage deadline strip as four date-derived bands. Reuses the
 * exam_derived_status VIEW; a second keyed lookup on `exams` supplies display
 * name + category for labels and href building (the VIEW exposes neither).
 * Returns empty bands on failure so the homepage simply omits the strip.
 *
 * @param perBand cap applied to each band independently (no horizontal scroll).
 */
export async function getDeadlineBands(perBand = 8): Promise<DeadlineBands> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("exam_derived_status")
        .select(
          `exam_id, slug, pillar, derived_status, today_ist,
           app_close_date, admit_card_date, result_date, exam_start_date`
        )
        .eq("strip_eligible", true);
      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return EMPTY_BANDS;

      // "Today" per the VIEW (IST). All rows carry the same today_ist.
      const today = (rows[0] as any).today_ist as string;
      const in15 = addDaysISO(today, 15);   // closing-soon window
      const in7  = addDaysISO(today, 7);    // exams-this-week window
      const ago7 = addDaysISO(today, -7);   // admit-card / results lookback

      // Name + category lookup (single extra query; VIEW is not a real table so
      // a PostgREST embed can't be relied on).
      const ids = rows.map((r: any) => r.exam_id as string);
      const { data: examRows } = await supabase
        .from("exams")
        .select("id, name, short_name, cat:categories!category_id(slug)")
        .in("id", ids);
      const examMap = new Map<string, { name: string; short_name: string; category_slug: string | null }>();
      for (const e of examRows ?? []) {
        examMap.set((e as any).id, {
          name: (e as any).name,
          short_name: (e as any).short_name,
          category_slug: (e as any).cat?.slug ?? null,
        });
      }

      const item = (r: any, date: string): DeadlineBandItem => {
        const meta = examMap.get(r.exam_id as string);
        return {
          examId: r.exam_id as string,
          slug: r.slug as string,
          pillar: r.pillar as Pillar,
          name: meta?.name ?? (r.slug as string),
          shortName: meta?.short_name ?? meta?.name ?? (r.slug as string),
          category: meta?.category_slug ?? "",
          derivedStatus: (r.derived_status as string) ?? "upcoming",
          date,
        };
      };
      const byDateAsc = (a: DeadlineBandItem, b: DeadlineBandItem) => a.date.localeCompare(b.date);
      const byDateDesc = (a: DeadlineBandItem, b: DeadlineBandItem) => b.date.localeCompare(a.date);

      const closingSoon: DeadlineBandItem[] = [];
      const admitCardOut: DeadlineBandItem[] = [];
      const resultsOut: DeadlineBandItem[] = [];
      const examsThisMonth: DeadlineBandItem[] = [];

      for (const r of rows as any[]) {
        const appClose = r.app_close_date as string | null;
        const admit = r.admit_card_date as string | null;
        const result = r.result_date as string | null;
        const examStart = r.exam_start_date as string | null;

        // closing-soon: application close date within the next 15 days.
        if (appClose && appClose >= today && appClose < in15) closingSoon.push(item(r, appClose));

        // admit-card-out: admit card released in last 7 days, exam not yet started.
        if (admit && admit <= today && admit >= ago7 && (!examStart || examStart >= today)) {
          admitCardOut.push(item(r, admit));
        }

        // results-out: result declared within the last 7 days.
        if (result && result <= today && result >= ago7) resultsOut.push(item(r, result));

        // exams-this-week: exam starts within the next 7 days.
        if (examStart && examStart >= today && examStart < in7) {
          examsThisMonth.push(item(r, examStart));
        }
      }

      return {
        today,
        closingSoon: closingSoon.sort(byDateAsc).slice(0, perBand),
        admitCardOut: admitCardOut.sort(byDateAsc).slice(0, perBand),
        resultsOut: resultsOut.sort(byDateDesc).slice(0, perBand),
        examsThisMonth: examsThisMonth.sort(byDateAsc).slice(0, perBand),
      };
    } catch (err) {
      console.error("[examService] getDeadlineBands failed:", err);
      return EMPTY_BANDS;
    }
  }, ["exams", "exams:deadline-bands-15-7-7-7"], { revalidate: 1800 });
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

// ── Other editions (non-current cycles) ──────────────────────────────────────
// The YEAR IS A LABEL, NOT A TIMELINE POSITION. Indian recruitment names cycles for a year that
// may be ahead of or behind the calendar (RRB NTPC 2027 runs in 2026; UPPCS 2025 slips into
// 2026). The ONLY authority for what is live is is_current / current_edition_id — NEVER a
// year-vs-today or year-vs-current comparison. So:
//   is_current = true  → the live cycle (main exam page), whatever its year
//   is_current = false → an "other edition", reachable at its year URL if it has content
// We deliberately do NOT use the word "archive" or derive past/future from the year.

export type OtherEditionSummary = {
  year: number;
  editionLabel: string;
  status: string;
  isCurrent: boolean;
  hasContent: boolean;
};

/** True when an edition row carries substantive cycle content (dates/vacancy/eligibility/modules). */
function editionHasContent(ed: Record<string, unknown>): boolean {
  const dates = ed.important_dates as unknown[] | null;
  const elig = ed.eligibility as Record<string, unknown> | null;
  const cm = ed.content_modules as Record<string, unknown> | null;
  const moduleKeys = cm ? Object.keys(cm).filter((k) => k !== "_config") : [];
  return (
    (Array.isArray(dates) && dates.length > 0) ||
    (ed.vacancy != null) ||
    (!!elig && Object.keys(elig).length > 0) ||
    moduleKeys.length > 0
  );
}

/**
 * All editions of an exam for the year-pill switcher: the current one (from current_edition_id,
 * NOT from year order) plus every non-current one, sorted by year DESCENDING (how candidates
 * think about cycles — a sort key only, never a status signal). Each carries isCurrent + a
 * content flag. Drives: the "Other Editions" tab gate, the switcher pills, the year route's
 * notFound() decision, and sitemap emission — one source so all four agree.
 */
export async function getExamEditionsForSwitcher(examSlug: string): Promise<OtherEditionSummary[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data: exam } = await supabase
        .from("exams")
        .select("id, current_edition_id")
        .eq("slug", examSlug)
        .maybeSingle();
      if (!exam) return [];

      const { data: rows, error } = await supabase
        .from("exam_editions")
        .select("id, year, edition_label, status, is_current, important_dates, vacancy, eligibility, content_modules")
        .eq("exam_id", (exam as any).id)
        .order("year", { ascending: false }); // sort key only — NOT a status signal
      if (error) throw error;

      const currentId = (exam as any).current_edition_id;
      return (rows ?? []).map((r: any): OtherEditionSummary => ({
        year: r.year,
        editionLabel: r.edition_label,
        status: r.status,
        isCurrent: r.id === currentId || r.is_current === true,
        hasContent: editionHasContent(r as Record<string, unknown>),
      }));
    } catch (err) {
      console.error("[examService] getExamEditionsForSwitcher failed:", err);
      return [];
    }
  }, ["exams", `editions-switcher:${examSlug}`], { revalidate: 600 });
}

/**
 * The single gate: does this exam have at least one NON-CURRENT edition WITH content? Drives the
 * "Other Editions" tab (show/hide), the sitemap (emit year URLs or not), and the year route
 * (thin/absent edition 404s). Same-shape rule as contentTypeHasData — presence, not year math.
 */
export async function hasOtherEditions(examSlug: string): Promise<boolean> {
  const eds = await getExamEditionsForSwitcher(examSlug);
  return eds.some((e) => !e.isCurrent && e.hasContent);
}

/**
 * Resolve a requested year URL for an exam. Renders a non-current edition ONLY if it exists and
 * has content; the current edition's own year URL redirects intent to the main page (caller
 * decides); anything else 404s. No past/future concept — is_current + content only.
 */
export async function resolveEditionYear(
  slug: string,
  year: number,
): Promise<
  | { kind: "edition"; exam: ExamEntity; isCurrent: boolean; hasContent: boolean }
  | { kind: "notfound" }
> {
  const editions = await getExamEditionsForSwitcher(slug);
  const match = editions.find((e) => e.year === year);
  if (!match) return { kind: "notfound" };
  // A non-current edition with no content is a thin page → 404 (same rule as everything else).
  if (!match.isCurrent && !match.hasContent) return { kind: "notfound" };
  const exam = await getExamArchive(slug, year);
  if (!exam) return { kind: "notfound" };
  return { kind: "edition", exam, isCurrent: match.isCurrent, hasContent: match.hasContent };
}

// ── Sitemap: non-current editions WITH content ───────────────────────────────
//
// The sitemap emits a year URL for an edition ONLY when that edition is non-current AND has
// content — the SAME rule (editionHasContent) that drives the switcher pills, the "Other
// Editions" surface, and the year route's notFound(). One predicate, four consumers, so they
// can never disagree (the ~1,900-thin-URL coupling). Current editions are NOT emitted here:
// their content lives at the main exam URL, and the current edition's own year URL redirects
// to main — emitting it would be a duplicate. One bulk query, not one call per exam.

export type EditionSitemapEntry = {
  slug: string;
  pillar: string;
  year: number;
};

export async function getEditionSitemapEntries(): Promise<EditionSitemapEntry[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("exam_editions")
        .select(
          "year, is_current, important_dates, vacancy, eligibility, content_modules, " +
            "exam:exams!exam_id(slug, pillar, current_edition_id, workflow_status), id",
        );
      if (error) throw error;

      const out: EditionSitemapEntry[] = [];
      for (const r of (data ?? []) as any[]) {
        const exam = r.exam;
        if (!exam?.slug) continue;
        // Draft/unpublished exams never enter the sitemap.
        if (exam.workflow_status && exam.workflow_status !== "published") continue;
        // is_current is the ONLY lifecycle authority — never year math.
        const isCurrent = r.id === exam.current_edition_id || r.is_current === true;
        if (isCurrent) continue; // current edition lives at the main URL, not a year URL
        if (!editionHasContent(r as Record<string, unknown>)) continue; // same gate as everything else
        out.push({ slug: exam.slug, pillar: exam.pillar, year: r.year });
      }
      return out;
    } catch (err) {
      console.error("[examService] getEditionSitemapEntries failed:", err);
      return [];
    }
  }, ["exams", "edition-sitemap"], { revalidate: 1800 });
}
