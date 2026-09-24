// ─────────────────────────────────────────────────────────────────────────────
// THE single source of truth for record-level action links (Apply / Result /
// Answer key / Admit card / Syllabus / …) shown on listing rows and cards.
//
// Before this module, ExamListRow and ExamCard each had their own copy of the
// link logic that keyed off the exam_editions `has_*` booleans. Those flags say
// "yes" on ~390 records where the destination page exists on ~4 — so nearly
// every link 404'd. And the copies drifted (offering Apply after registration
// closed, Admit card before one existed, etc.).
//
// One function, two conditions, BOTH required for a link to appear:
//   1. The page exists — contentTypeHasData(view, ct), the SAME registry gate the
//      sub-page route uses to decide 200-vs-404 (and the tab strip, sitemap, and
//      More-for box). No link is built on a `has_*` flag.
//   2. The action suits the state — no Apply after registration closes, no Admit
//      card before one exists, Result/Answer key only once results are in play.
//
// The href is built through the ONE canonical getExamEntityHref, which maps the
// dead-root pillars (government-exam / govt-vacancy) to /sarkari-naukri directly
// so our own links never depend on the next.config.ts redirect.
// ─────────────────────────────────────────────────────────────────────────────

import { contentTypeHasData, type HasDataView } from "@/lib/sectionRegistry";
import type { ExamEntity, ContentType, ExamStatus } from "@/types/exam";

// ── Canonical URL builder ────────────────────────────────────────────────────
// The ONE place that turns an exam into a path. government-exam and govt-vacancy
// are canonicalised to sarkari-naukri here so no caller emits the dead root.
export function getExamEntityHref(exam: {
  pillar: string;
  category: string;
  slug: string;
  entityType?: string;
}): string {
  const routePillar =
    exam.pillar === "government-exam" || exam.pillar === "govt-vacancy"
      ? "sarkari-naukri"
      : exam.pillar;

  if (routePillar === "board-exam") {
    return exam.entityType === "university"
      ? `/board-exam/university/${exam.slug}`
      : `/board-exam/state/${exam.category}/${exam.slug}`;
  }
  // No category → flat slug URL (works for the sarkari-naukri [slug] route).
  if (!exam.category) return `/${routePillar}/${exam.slug}`;
  return `/${routePillar}/${exam.category}/${exam.slug}`;
}

export function getExamContentTypeHref(
  exam: { pillar: string; category: string; slug: string; entityType?: string },
  contentType: string
): string {
  return `${getExamEntityHref(exam)}/${contentType}`;
}

// ── State rule: which content types suit which lifecycle state ───────────────
// A content type may only appear when the record's derived status is in its
// allow-set. This is what stops "Apply on a closed exam", "Admit card before one
// exists", and "Result on an apply-now listing". Syllabus is state-agnostic
// (a syllabus is useful at any point) — it is gated by page-existence alone.
const STATE_ALLOWS: Record<ContentType, ReadonlySet<ExamStatus> | "any"> = {
  application: new Set<ExamStatus>(["registration-open", "notified", "upcoming"]),
  "admit-card": new Set<ExamStatus>(["admit-card-out", "ongoing"]),
  result: new Set<ExamStatus>(["result-awaited", "result-declared", "completed"]),
  "answer-key": new Set<ExamStatus>(["result-declared", "completed"]),
  syllabus: "any",
  // Not offered as row/card action links today; kept out of the ordering below.
  notification: "any",
  "date-sheet": "any",
  cutoff: "any",
  "previous-papers": "any",
  "mock-test": "any",
  "study-material": "any",
  books: "any",
  about: "any",
  faqs: "any",
  news: "any",
};

function stateAllows(ct: ContentType, status: ExamStatus): boolean {
  const rule = STATE_ALLOWS[ct];
  return rule === "any" ? true : rule.has(status);
}

// ── Ordering: the most relevant action first, per state ──────────────────────
// Note there is NO fallback that contains `application` — Apply can only surface
// through a status whose allow-set includes it, never as a filler. dates-awaited
// is intentionally present with a syllabus-only list so it can't fall through to
// offering Apply/Admit card (both impossible in that state).
const PRIORITY_BY_STATUS: Partial<Record<ExamStatus, ContentType[]>> = {
  "registration-open": ["application", "syllabus"],
  notified: ["application", "syllabus"],
  upcoming: ["application", "syllabus"],
  "admit-card-out": ["admit-card", "syllabus"],
  ongoing: ["admit-card", "syllabus"],
  "result-awaited": ["result", "syllabus"],
  "result-declared": ["result", "answer-key"],
  completed: ["result", "answer-key"],
  "registration-closed": ["syllabus"],
  "dates-awaited": ["syllabus"],
  postponed: ["syllabus"],
  cancelled: [],
  active: ["application", "syllabus"],
};

// Candidate order used to top up after the status-specific list (still gated by
// BOTH conditions — page exists AND state allows — so this can only add links
// that are legitimately available; it never resurrects Apply for a closed exam).
const CANDIDATE_ORDER: ContentType[] = [
  "admit-card",
  "result",
  "answer-key",
  "syllabus",
];

export type ActionLink = { label: string; ct: ContentType; href: string };

const LABELS: Partial<Record<ContentType, string>> = {
  "admit-card": "Admit card",
  result: "Result",
  syllabus: "Syllabus",
  "answer-key": "Answer key",
  application: "Apply",
};

/**
 * The links a record gets, ordered by relevance to its current state, capped at
 * two. Every returned link satisfies BOTH gates. Callers (ExamListRow, ExamCard,
 * any future listing) render exactly what this returns and add no logic of their
 * own.
 */
export function getActionLinks(exam: ExamEntity, max = 2): ActionLink[] {
  const href = getExamEntityHref(exam);
  const view = exam as unknown as HasDataView;

  const eligible = (ct: ContentType): boolean => {
    if (!stateAllows(ct, exam.status)) return false;
    // syllabus page-existence is the structured-syllabus signal (same as the
    // route gate); contentTypeHasData reads exam.hasStructuredSyllabus for it.
    return contentTypeHasData(view, ct);
  };

  const ordered = [
    ...(PRIORITY_BY_STATUS[exam.status] ?? []),
    ...CANDIDATE_ORDER,
  ];

  const out: ActionLink[] = [];
  const seen = new Set<ContentType>();
  for (const ct of ordered) {
    if (seen.has(ct)) continue;
    seen.add(ct);
    if (!eligible(ct)) continue;
    out.push({ ct, label: LABELS[ct] ?? ct, href: `${href}/${ct}` });
    if (out.length === max) break;
  }
  return out;
}

// ── The one date that matters for the record's current state ─────────────────
// Result-declared exams should show a result date, apply-now exams an
// application/close date — not whatever happens to be dates[0]. The dates come
// from exam.dates (edition important_dates); we pick by matching the date's
// machine `type` (populated by the same vocabulary the derived-status VIEW uses)
// to the state. Falls back to the first valid date when no typed match exists so
// a row is never left dateless when it has dates.
export type DatePick = { label: string; date: string } | null;

const TYPE_FOR_STATUS: Partial<Record<ExamStatus, string[]>> = {
  "registration-open": ["application_end"],
  notified: ["application_start", "notification"],
  upcoming: ["application_start", "notification", "exam_written"],
  "admit-card-out": ["exam_written", "exam_practical"],
  ongoing: ["result", "exam_written"],
  "result-awaited": ["result"],
  "result-declared": ["result", "merit_list"],
  completed: ["result", "merit_list"],
  "registration-closed": ["exam_written", "admit_card"],
};

export function pickDisplayDate(exam: ExamEntity): DatePick {
  const valid = exam.dates.filter((d) => d.date && d.date.trim() !== "");
  if (valid.length === 0) return null;

  const wanted = TYPE_FOR_STATUS[exam.status];
  if (wanted) {
    for (const t of wanted) {
      const hit = valid.find((d) => (d.type ?? "").toLowerCase() === t);
      if (hit) return { label: hit.label, date: hit.date };
    }
  }
  // No typed match for the state — show the first valid date rather than nothing.
  return { label: valid[0].label, date: valid[0].date };
}
