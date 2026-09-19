import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalise a stored website value into a valid absolute URL.
 * Does exactly one thing: prepend "https://" when no protocol is present.
 * Returns "" if the result doesn't parse as a URL — callers already guard on
 * empty and hide the link, which is the correct failure mode (a bare value
 * like "www.ibps.in" otherwise renders as a same-origin link that 500s on
 * click). Multi-URL values (e.g. "https://a, https://b") fail new URL() and
 * return "" by design — those are fixed by hand in the CMS, not parsed here.
 */
export function normalizeUrl(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  // Reject multi-URL / junk BEFORE new URL(): a single clean URL never contains
  // whitespace or a comma. Critically, new URL() does NOT reject these — with a
  // trailing slash it turns the remainder into a percent-encoded path and
  // returns a truthy-but-broken URL (e.g. "https://a/,%20https://b"). Also
  // reject values that ALREADY contain %20/%2C, because our own normaliser has
  // previously written those; without this a mangled value re-saves as "valid".
  if (/[\s,]/.test(trimmed) || /%20|%2c/i.test(trimmed)) return "";
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProto).toString();
  } catch {
    return "";
  }
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
    ...options,
  });
}

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

// ── Date window helpers ──────────────────────────────────────────────────
// These take an explicit `todayISO` (yyyy-mm-dd) anchor — the caller passes
// the single IST "today" from getTodayIST(). They must NOT read Date.now():
// the whole point of Part A is that exactly ONE place (the exam_derived_status
// VIEW via getTodayIST) decides what "today" is. Comparison is done on the
// zero-padded ISO date strings, which sort lexically and are timezone-free.

/** Days from `todayISO` to `dateStr` (positive = future). Both are yyyy-mm-dd. */
function daysBetweenISO(todayISO: string, dateStr: string): number {
  const a = new Date(todayISO + "T00:00:00Z").getTime();
  const b = new Date((dateStr || "").slice(0, 10) + "T00:00:00Z").getTime();
  if (isNaN(a) || isNaN(b)) return NaN;
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/** True when `dateStr` is in the future and within `daysThreshold` of `todayISO`. */
export function isUrgent(dateStr: string, todayISO: string, daysThreshold = 7): boolean {
  const d = daysBetweenISO(todayISO, dateStr);
  return d > 0 && d < daysThreshold;
}

/** True when `dateStr` is in the future and within `daysThreshold` of `todayISO`. */
export function isClosingSoon(dateStr: string, todayISO: string, daysThreshold = 30): boolean {
  const d = daysBetweenISO(todayISO, dateStr);
  return d > 0 && d < daysThreshold;
}

/** Is `dateStr` today or later, per the IST anchor? The single future-check. */
export function isFutureOrToday(dateStr: string, todayISO: string): boolean {
  return (dateStr || "").slice(0, 10) >= todayISO;
}

/**
 * Whole days from the IST anchor `todayISO` to `dateStr` (0 = today, positive =
 * future, negative = past). NaN when either date is unparseable. Uses the same
 * IST "today" the VIEW/getTodayIST decides — never the server's UTC clock — so
 * "days left" style copy agrees with every other past/future decision. */
export function daysUntil(dateStr: string, todayISO: string): number {
  return daysBetweenISO(todayISO, dateStr);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "…";
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function contentTypeLabel(contentType: string): string {
  const labels: Record<string, string> = {
    notification: "Notification",
    application: "Application",
    "admit-card": "Admit Card",
    "date-sheet": "Date Sheet",
    syllabus: "Syllabus",
    "answer-key": "Answer Key",
    result: "Result",
    cutoff: "Cutoff",
    "previous-papers": "Previous Papers",
    "mock-test": "Mock Test",
    "study-material": "Study Material",
    books: "Books",
    // Virtual module-backed tabs
    about: "About",
    faqs: "FAQs",
    news: "News & Updates",
  };
  return labels[contentType] ?? contentType;
}

export function pillarLabel(pillar: string): string {
  const labels: Record<string, string> = {
    "sarkari-naukri": "Sarkari Naukri",
    "entrance-exam": "Admissions",
    "board-exam": "Board & University",
  };
  return labels[pillar] ?? pillar;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    upcoming:               "text-warning bg-warning/10",
    active:                 "text-success bg-success/10",
    "registration-open":    "text-success bg-success/10",
    "registration-closed":  "text-accent bg-accent/10",
    "result-declared":      "text-primary bg-primary/10",
    "result-awaited":       "text-primary bg-primary/10",
    completed:              "text-muted bg-gray-100",
    ongoing:                "text-editorial bg-editorial/10",
    notified:               "text-warning bg-warning/10",
    "admit-card-out":       "text-success bg-success/10",
    "dates-awaited":        "text-muted bg-gray-100",
    postponed:              "text-accent bg-accent/10",
    cancelled:              "text-red-600 bg-red-50",
  };
  return colors[status] ?? "text-muted bg-gray-100";
}

export function absoluteUrl(path: string, base = "https://www.indianexaminfo.com"): string {
  return `${base}${path}`;
}

export function getReadingTimeText(minutes: number): string {
  return `${minutes} min read`;
}

/**
 * Generate the canonical URL path for an exam entity.
 * Handles all pillars: sarkari-naukri, entrance-exam, board-university.
 * Falls back to flat slug URL if category is missing.
 */
export function getExamEntityHref(exam: { pillar: string; category: string; slug: string; entityType?: string }): string {
  if (exam.pillar === "board-exam") {
    return exam.entityType === "university"
      ? `/board-exam/university/${exam.slug}`
      : `/board-exam/state/${exam.category}/${exam.slug}`;
  }
  if (!exam.category) {
    return `/${exam.pillar}/${exam.slug}`;
  }
  return `/${exam.pillar}/${exam.category}/${exam.slug}`;
}

/**
 * Generate the URL path for a content-type page of an exam entity.
 */
export function getExamContentTypeHref(
  exam: { pillar: string; category: string; slug: string; entityType?: string },
  contentType: string
): string {
  return `${getExamEntityHref(exam)}/${contentType}`;
}

/**
 * Escape special characters in user input before using in PostgREST .ilike() filters.
 * Prevents filter injection via `%`, `_`, and other PostgREST meta-characters.
 */
export function escapeSearchQuery(query: string): string {
  return query
    .replace(/\\/g, "\\\\")  // escape backslashes first
    .replace(/%/g, "\\%")    // escape wildcard %
    .replace(/_/g, "\\_")    // escape single-char wildcard _
    .trim();
}
