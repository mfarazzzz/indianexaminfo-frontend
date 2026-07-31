import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

export function isUrgent(dateStr: string, daysThreshold = 7): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < daysThreshold * 24 * 60 * 60 * 1000;
}

export function isClosingSoon(dateStr: string, daysThreshold = 30): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < daysThreshold * 24 * 60 * 60 * 1000;
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
  };
  return labels[contentType] ?? contentType;
}

export function pillarLabel(pillar: string): string {
  const labels: Record<string, string> = {
    "sarkari-naukri": "Sarkari Naukri",
    "entrance-exam": "Entrance Exam",
    "board-exam": "Board & University",
  };
  return labels[pillar] ?? pillar;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    upcoming: "text-warning bg-warning/10",
    active: "text-success bg-success/10",
    "registration-open": "text-success bg-success/10",
    "registration-closed": "text-accent bg-accent/10",
    "result-declared": "text-primary bg-primary/10",
    completed: "text-muted bg-gray-100",
    ongoing: "text-editorial bg-editorial/10",
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
