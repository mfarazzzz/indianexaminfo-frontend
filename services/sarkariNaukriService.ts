/**
 * sarkariNaukriService.ts — Reads government jobs from `sarkari_naukri` table.
 * Sole data source for /sarkari-naukri/ section.
 * Pattern matches examService.ts: createServerClient() + cached() + mapRow().
 */

import { createServerClient } from "@/lib/supabase/server";
import { cached } from "@/lib/cache";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecruitmentType = "exam" | "direct";

export type SarkariStatus =
  | "upcoming" | "application-open" | "application-closed"
  | "admit-card-released" | "exam-scheduled" | "answer-key-released"
  | "result-declared" | "interview-scheduled" | "merit-list-released"
  | "completed" | "cancelled";

export interface SarkariNaukriItem {
  id: string;
  slug: string;
  recruitmentType: RecruitmentType;
  title: string;
  titleHindi: string | null;
  organization: string;
  organizationHindi: string | null;
  department: string | null;
  state: string | null;
  district: string | null;
  category: string | null;
  vacancyCount: number | null;
  eligibility: string | null;
  ageLimit: string | null;
  payScale: string | null;
  applicationFee: Record<string, unknown> | null;
  description: string | null;
  descriptionHindi: string | null;
  notificationDate: string | null;
  applicationStartDate: string | null;
  applicationEndDate: string | null;
  applicationUrl: string | null;
  officialNotificationUrl: string | null;
  examDate: string | null;
  admitCardDate: string | null;
  admitCardUrl: string | null;
  answerKeyDate: string | null;
  answerKeyUrl: string | null;
  examMode: string | null;
  resultDate: string | null;
  resultUrl: string | null;
  cutoffMarks: string | null;
  totalCandidates: number | null;
  passPercentage: number | null;
  interviewDate: string | null;
  documentVerificationDate: string | null;
  meritListDate: string | null;
  meritListUrl: string | null;
  joiningDetails: string | null;
  walkInDate: string | null;
  walkInVenue: string | null;
  status: SarkariStatus;
  isNew: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
  tags: string[];
  searchKeywords: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  alternateLinks: Record<string, string>[] | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapRow(r: Record<string, unknown>): SarkariNaukriItem {
  return {
    id: r.id as string,
    slug: r.slug as string,
    recruitmentType: r.recruitment_type as RecruitmentType,
    title: r.title as string,
    titleHindi: r.title_hindi as string | null,
    organization: r.organization as string,
    organizationHindi: r.organization_hindi as string | null,
    department: r.department as string | null,
    state: r.state as string | null,
    district: r.district as string | null,
    category: r.category as string | null,
    vacancyCount: r.vacancy_count as number | null,
    eligibility: r.eligibility as string | null,
    ageLimit: r.age_limit as string | null,
    payScale: r.pay_scale as string | null,
    applicationFee: r.application_fee as Record<string, unknown> | null,
    description: r.description as string | null,
    descriptionHindi: r.description_hindi as string | null,
    notificationDate: r.notification_date as string | null,
    applicationStartDate: r.application_start_date as string | null,
    applicationEndDate: r.application_end_date as string | null,
    applicationUrl: r.application_url as string | null,
    officialNotificationUrl: r.official_notification_url as string | null,
    examDate: r.exam_date as string | null,
    admitCardDate: r.admit_card_date as string | null,
    admitCardUrl: r.admit_card_url as string | null,
    answerKeyDate: r.answer_key_date as string | null,
    answerKeyUrl: r.answer_key_url as string | null,
    examMode: r.exam_mode as string | null,
    resultDate: r.result_date as string | null,
    resultUrl: r.result_url as string | null,
    cutoffMarks: r.cutoff_marks as string | null,
    totalCandidates: r.total_candidates as number | null,
    passPercentage: r.pass_percentage as number | null,
    interviewDate: r.interview_date as string | null,
    documentVerificationDate: r.document_verification_date as string | null,
    meritListDate: r.merit_list_date as string | null,
    meritListUrl: r.merit_list_url as string | null,
    joiningDetails: r.joining_details as string | null,
    walkInDate: r.walk_in_date as string | null,
    walkInVenue: r.walk_in_venue as string | null,
    status: (r.status as SarkariStatus) ?? "upcoming",
    isNew: (r.is_new as boolean) ?? false,
    isFeatured: (r.is_featured as boolean) ?? false,
    isUrgent: (r.is_urgent as boolean) ?? false,
    tags: (r.tags as string[]) ?? [],
    searchKeywords: (r.search_keywords as string[]) ?? [],
    seoTitle: r.seo_title as string | null,
    seoDescription: r.seo_description as string | null,
    alternateLinks: r.alternate_links as Record<string, string>[] | null,
    publishedAt: r.published_at as string | null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ── Service functions ─────────────────────────────────────────────────────────

const LIST_SELECT = "*";

export async function getAllSarkariNaukri(): Promise<SarkariNaukriItem[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select(LIST_SELECT)
        .eq("workflow_status", "published")
        .order("is_featured", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[sarkariNaukriService] getAllSarkariNaukri failed:", err);
      return [];
    }
  }, ["sarkari-naukri"], { revalidate: 1800 });
}

export async function getSarkariNaukriBySlug(slug: string): Promise<SarkariNaukriItem | null> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select(LIST_SELECT)
        .eq("slug", slug)
        .eq("workflow_status", "published")
        .maybeSingle();
      if (error || !data) return null;
      return mapRow(data as Record<string, unknown>);
    } catch (err) {
      console.error("[sarkariNaukriService] getSarkariNaukriBySlug failed:", err);
      return null;
    }
  }, ["sarkari-naukri", `sarkari-naukri:${slug}`], { revalidate: 3600 });
}

export async function getByRecruitmentType(type: RecruitmentType): Promise<SarkariNaukriItem[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select(LIST_SELECT)
        .eq("workflow_status", "published")
        .eq("recruitment_type", type)
        .order("is_featured", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[sarkariNaukriService] getByRecruitmentType failed:", err);
      return [];
    }
  }, ["sarkari-naukri", `sarkari-naukri:type:${type}`], { revalidate: 1800 });
}

export async function getByState(state: string): Promise<SarkariNaukriItem[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select(LIST_SELECT)
        .eq("workflow_status", "published")
        .eq("state", state)
        .order("is_featured", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[sarkariNaukriService] getByState failed:", err);
      return [];
    }
  }, ["sarkari-naukri", `sarkari-naukri:state:${state}`], { revalidate: 1800 });
}

export async function getByDepartment(dept: string): Promise<SarkariNaukriItem[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select(LIST_SELECT)
        .eq("workflow_status", "published")
        .ilike("department", `%${dept}%`)
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[sarkariNaukriService] getByDepartment failed:", err);
      return [];
    }
  }, ["sarkari-naukri", `sarkari-naukri:dept:${dept}`], { revalidate: 1800 });
}

export async function getByCategory(category: string): Promise<SarkariNaukriItem[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select(LIST_SELECT)
        .eq("workflow_status", "published")
        .eq("category", category)
        .order("is_featured", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[sarkariNaukriService] getByCategory failed:", err);
      return [];
    }
  }, ["sarkari-naukri", `sarkari-naukri:category:${category}`], { revalidate: 1800 });
}

export async function getFeaturedSarkariNaukri(): Promise<SarkariNaukriItem[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select(LIST_SELECT)
        .eq("workflow_status", "published")
        .eq("is_featured", true)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((r: any) => mapRow(r));
    } catch (err) {
      console.error("[sarkariNaukriService] getFeaturedSarkariNaukri failed:", err);
      return [];
    }
  }, ["sarkari-naukri", "sarkari-naukri:featured"], { revalidate: 1800 });
}

export async function getStateList(): Promise<{ state: string; count: number }[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select("state")
        .eq("workflow_status", "published")
        .not("state", "is", null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as { state: string }[]) {
        counts.set(row.state, (counts.get(row.state) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error("[sarkariNaukriService] getStateList failed:", err);
      return [];
    }
  }, ["sarkari-naukri", "sarkari-naukri:states"], { revalidate: 3600 });
}

export async function getCategoryList(): Promise<{ category: string; count: number }[]> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from("sarkari_naukri")
        .select("category")
        .eq("workflow_status", "published")
        .not("category", "is", null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of (data ?? []) as { category: string }[]) {
        counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error("[sarkariNaukriService] getCategoryList failed:", err);
      return [];
    }
  }, ["sarkari-naukri", "sarkari-naukri:categories"], { revalidate: 3600 });
}

export async function generateStaticSarkariNaukriParams(): Promise<{ slug: string }[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("sarkari_naukri")
      .select("slug")
      .eq("workflow_status", "published");
    if (error) throw error;
    return (data ?? []).map((r: any) => ({ slug: r.slug as string }));
  } catch (err) {
    console.error("[sarkariNaukriService] generateStaticParams failed:", err);
    return [];
  }
}

export async function getSarkariNaukriStats(): Promise<{ total: number; exam: number; direct: number }> {
  return cached(async () => {
    try {
      const supabase = createServerClient();
      const [totalRes, examRes, directRes] = await Promise.all([
        supabase.from("sarkari_naukri").select("id", { count: "exact", head: true }).eq("workflow_status", "published"),
        supabase.from("sarkari_naukri").select("id", { count: "exact", head: true }).eq("workflow_status", "published").eq("recruitment_type", "exam"),
        supabase.from("sarkari_naukri").select("id", { count: "exact", head: true }).eq("workflow_status", "published").eq("recruitment_type", "direct"),
      ]);
      return {
        total: totalRes.count ?? 0,
        exam: examRes.count ?? 0,
        direct: directRes.count ?? 0,
      };
    } catch (err) {
      console.error("[sarkariNaukriService] getSarkariNaukriStats failed:", err);
      return { total: 361, exam: 60, direct: 301 };
    }
  }, ["sarkari-naukri", "sarkari-naukri:stats"], { revalidate: 3600 });
}
