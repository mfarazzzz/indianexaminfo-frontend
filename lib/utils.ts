import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── R1.8: URL tracking parameter stripping (MUST STAY IDENTICAL to CMS) ─────
const ALWAYS_STRIP_PARAMS = /^utm_|^gclid$|^fbclid$|^mc_cid$|^mc_eid$|^msclkid$|^dclid$/i;
const CONDITIONAL_REF_PARAMS = /^(ref|source)$/i;
const TRACKING_REF_VALUES = /chatgpt\.com|perplexity|copilot|gemini|claude\.ai|bing\.com\/chat/i;

export function stripTrackingParams(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const toDelete: string[] = [];
    url.searchParams.forEach((value, key) => {
      if (ALWAYS_STRIP_PARAMS.test(key)) {
        toDelete.push(key);
      } else if (CONDITIONAL_REF_PARAMS.test(key) && TRACKING_REF_VALUES.test(value)) {
        toDelete.push(key);
      }
    });
    for (const k of toDelete) url.searchParams.delete(k);
    return url.toString();
  } catch {
    return rawUrl;
  }
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
    const parsed = new URL(withProto).toString();
    return stripTrackingParams(parsed);
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

// ── FX3 C2 — time with dates (IST) ───────────────────────────────────────────

/** A stored HH:MM (24h, IST) rendered as a 12h clock, e.g. "18:00" -> "6:00 PM". */
export function formatEventTime(hhmm: string | undefined): string {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return "";
  const [hRaw, m] = hhmm.split(":");
  const h = Number(hRaw);
  if (!Number.isFinite(h) || h < 0 || h > 23) return "";
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${suffix}`;
}

interface EventDateLike {
  date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  time_text?: string;
}

/**
 * Render a date event with its optional range and IST times, e.g.
 *   "5 Oct 2026 (afternoon) – 7 Oct 2026, till 6:00 PM"
 *   "9 Oct 2026 – 14 Oct 2026, till 5:00 PM"
 *   "1 Dec 2026, 9:00 AM – 12:30 PM"
 * Falls back to just the formatted date when no time info is present.
 */
export function formatEventDateTime(d: EventDateLike): string {
  const start = formatDate(d.date);
  if (!start) return "";
  const end = d.end_date && d.end_date !== d.date ? formatDate(d.end_date) : "";
  const st = formatEventTime(d.start_time);
  const et = formatEventTime(d.end_time);
  let head = start;
  if (d.time_text) head += ` (${d.time_text})`;
  if (st) head += `, ${st}`;
  if (end) {
    let tail = end;
    if (et) tail += st ? `, ${et}` : `, till ${et}`;
    return `${head} – ${tail}`;
  }
  if (et) head += st ? ` – ${et}` : `, till ${et}`;
  return head;
}

/**
 * The deadline a countdown should use: the LAST moment the event is open.
 * end_date when it is a range, else date. Returns a yyyy-mm-dd string (or "").
 * Status computation itself stays date-based (exam_derived_status is unchanged —
 * that is S3/E1); this is only for display/countdown of a deadline.
 */
export function eventDeadlineDate(d: EventDateLike): string {
  return (d.end_date && d.end_date !== d.date ? d.end_date : d.date) || "";
}

/**
 * The deadline as an absolute instant for a countdown, interpreted in IST
 * (UTC+05:30). Uses end_date (or date) + end_time (or start_time), defaulting
 * the time to end-of-day 23:59 IST when no clock time is set. Returns a UTC ISO
 * string (so 18:00 IST -> 12:30Z). "" when there is no date.
 */
export function eventDeadlineInstantISO(d: EventDateLike, now?: Date): string {
  const day = eventDeadlineDate(d);
  if (!day) return "";
  const time = d.end_time || d.start_time || "23:59";
  // Build the IST wall-clock instant explicitly, then let Date normalise to UTC.
  const iso = `${day.slice(0, 10)}T${time.length === 5 ? time : "23:59"}:00+05:30`;
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return "";
  void now;
  return dt.toISOString();
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

/**
 * The ONE reader-facing display label per lifecycle status. The status badge in
 * EntityDetailPage and StickyContextBar used to print the raw enum ("notified",
 * or "admit-card-out" → "admit card out"). All badge text now comes from here so
 * an internal enum value can never leak to a reader and the label is consistent
 * across every surface. Every ExamStatus is covered; unknown values are
 * title-cased defensively rather than shown in raw kebab/snake form.
 */
export const STATUS_LABELS: Record<string, string> = {
  upcoming:               "Upcoming",
  active:                 "Open Now",
  "registration-open":    "Applications Open",
  "registration-closed":  "Applications Closed",
  "result-awaited":       "Result Awaited",
  "result-declared":      "Result Declared",
  completed:              "Completed",
  ongoing:                "Ongoing",
  notified:               "Notified",
  "admit-card-out":       "Admit Card Out",
  "dates-awaited":        "Dates Awaited",
  postponed:              "Postponed",
  cancelled:              "Cancelled",
};

export function statusLabel(status: string): string {
  const known = STATUS_LABELS[status];
  if (known) return known;
  // Defensive fallback: never expose a raw kebab/snake enum to a reader.
  return status
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function absoluteUrl(path: string, base = "https://www.indianexaminfo.com"): string {
  return `${base}${path}`;
}

export function getReadingTimeText(minutes: number): string {
  return `${minutes} min read`;
}

/**
 * Canonical URL builders for exam entities live in lib/exam/actionLinks so there
 * is ONE implementation that also canonicalises the dead-root pillars
 * (government-exam / govt-vacancy → sarkari-naukri). Re-exported here for the
 * existing import sites; do not add a second copy.
 */
export { getExamEntityHref, getExamContentTypeHref } from "@/lib/exam/actionLinks";

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
