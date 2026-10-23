/**
 * canonicalOwnership.ts — which URL is the canonical one for a content-type page.
 *
 * The problem (reference-page review, P1 item 14): the main exam page and its
 * `/notification` page answered the same query. Both were self-canonical, both carried
 * a "Notification" title, and Search Console shows what that bought — the content-type
 * URLs took ~12 clicks in total while the rest of the site took ~702, with the
 * notification URLs at 131 impressions and 0 clicks. Two pages competing for one
 * intent splits the signal and ranks neither.
 *
 * The rule, in one sentence: **a content-type page is self-canonical only when it shows
 * something the main page does not.** Not a list of content types — a test of what the
 * page actually renders:
 *
 *   1. its section is `placement: "tab"` in the registry (syllabus, cut-off, answer key,
 *      previous papers, study material, news) — the main page never renders those, so the
 *      page IS the content; or
 *   2. the published update it is built on carries its own prose or structured
 *      content-type data — the main page shows only the update's TITLE in the Updates
 *      timeline, never its body; or
 *   3. it maps to no registry section at all (a surface the main page has no version of).
 *
 * Anything else — today that is `notification`, whose section (`overview`, "About This
 * Exam") and dates table and FAQ the main page already shows — points its canonical at
 * the main page. The URL keeps working; it simply stops claiming to be a second page.
 *
 * The SAME function is used by the route metadata and by the sitemap, so a page cannot
 * be canonical-to-main in one place and submitted as its own page in the other.
 */
import { CONTENT_TYPE_TO_SECTION, SECTION_BY_SLUG } from "@/lib/sectionRegistry";

export type CanonicalVerdict = {
  selfCanonical: boolean;
  /** machine-readable reason, for the report and the tests */
  reason: "tab-only-section" | "update-own-content" | "no-registry-section" | "subset-of-main-page";
  /** the registry section this content type maps to, when any */
  sectionSlug: string | null;
};

export interface CtPageEvidence {
  contentType: string;
  /** the update this CT page renders (its newest published update for this type), if any */
  update?: { content?: string | null; contentTypeData?: Record<string, unknown> | null } | null;
}

const hasText = (v: unknown): boolean => typeof v === "string" && v.trim() !== "";
const hasObject = (v: unknown): boolean =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length > 0;

/** Decide canonical ownership from what the page renders. Pure: no fetch, no URL. */
export function ctCanonicalVerdict(evidence: CtPageEvidence): CanonicalVerdict {
  const sectionSlug = CONTENT_TYPE_TO_SECTION[evidence.contentType] ?? null;
  const def = sectionSlug ? SECTION_BY_SLUG[sectionSlug] ?? null : null;

  if (!sectionSlug || !def) {
    return { selfCanonical: true, reason: "no-registry-section", sectionSlug };
  }
  if (def.placement === "tab") {
    return { selfCanonical: true, reason: "tab-only-section", sectionSlug };
  }
  const own = hasText(evidence.update?.content) || hasObject(evidence.update?.contentTypeData);
  return own
    ? { selfCanonical: true, reason: "update-own-content", sectionSlug }
    : { selfCanonical: false, reason: "subset-of-main-page", sectionSlug };
}

/**
 * The canonical URL for a content-type page. When the page is not self-canonical the
 * main exam page is named — the CT URL itself stays reachable (no redirect), so an
 * already-shared link still works; it just tells search which copy counts.
 */
export function ctCanonicalUrl(
  evidence: CtPageEvidence,
  urls: { self: string; main: string },
): { canonical: string; verdict: CanonicalVerdict } {
  const verdict = ctCanonicalVerdict(evidence);
  return { canonical: verdict.selfCanonical ? urls.self : urls.main, verdict };
}
