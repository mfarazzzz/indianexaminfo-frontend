/**
 * contentHubs.ts — THE one rule for public content-type hub routes.
 *
 * A hub route (/admit-card, /results, …) aggregates every exam that carries the
 * matching content section. When that aggregate is empty the hub renders
 * "0 exams" — a soft-empty page that must NOT be linked from the homepage
 * quick-access strip, any nav/menu or the sitemap, and must NOT be indexed.
 *
 * This is the hub-level mirror of lib/sectionRegistry's presence rule:
 * "show only where content exists". The SAME predicate — hubHasContent() below —
 * drives the page (noindex / 404), every link surface (drop the hub while empty)
 * and the sitemap, so the three can never disagree. When a hub later gains a
 * record, hubHasContent flips to true and it reappears EVERYWHERE at once, with
 * no further code change.
 *
 * hubHasContent reuses exactly the two service calls the hub page itself makes
 * (getExamsByContentType + getLatestByContentType), so "has content" here is
 * literally "the page would render at least one row" — never a number pulled
 * from a different query that could drift from what the reader sees.
 */
import type { ContentType } from "@/types/exam";
import { getExamsByContentType } from "@/services/examService";
import { getLatestByContentType } from "@/services/contentPostService";

export interface ContentHub {
  /** Public URL of the hub, e.g. "/admit-card". */
  href: string;
  /** Display label used in strips / menus. */
  label: string;
  /** The content type this hub aggregates. */
  contentType: ContentType;
  /**
   * False → the hub has NO backing content store at all (date-sheet, mock-test:
   * neither is present in CONTENT_TYPE_TO_SECTION, and the registry calls them
   * "never real pages"). Such a hub can never be populated, so it 404s instead
   * of noindex-ing while empty. True → the hub maps to a real section that will
   * gain content, so it is noindexed while empty and reappears once populated.
   */
  populatable: boolean;
}

/**
 * The eight public content-type hubs. The two structural dead ends
 * (date-sheet, mock-test) are marked populatable:false and are removed for good
 * (404) until a real backing store exists for them.
 */
export const CONTENT_HUBS: readonly ContentHub[] = [
  { href: "/admit-card",      label: "Admit Card",      contentType: "admit-card",      populatable: true },
  { href: "/results",         label: "Results",         contentType: "result",          populatable: true },
  { href: "/answer-key",      label: "Answer Key",      contentType: "answer-key",      populatable: true },
  { href: "/syllabus",        label: "Syllabus",        contentType: "syllabus",        populatable: true },
  { href: "/previous-papers", label: "Previous Papers", contentType: "previous-papers", populatable: true },
  { href: "/study-material",  label: "Study Material",  contentType: "study-material",  populatable: true },
  { href: "/date-sheet",      label: "Date Sheet",      contentType: "date-sheet",      populatable: false },
  { href: "/mock-test",       label: "Mock Test",       contentType: "mock-test",       populatable: false },
];

const HUB_BY_HREF = new Map(CONTENT_HUBS.map((h) => [h.href, h]));

/** Look up a hub definition by its public href. Throws if the href is not a hub. */
export function hubFor(href: string): ContentHub {
  const hub = HUB_BY_HREF.get(href);
  if (!hub) throw new Error(`contentHubs: "${href}" is not a registered hub`);
  return hub;
}

/** Non-throwing check: is this href one of the registered content hubs? */
export function isHubHref(href: string | null | undefined): boolean {
  return !!href && HUB_BY_HREF.has(href);
}

/**
 * THE single presence rule. True iff this hub's own page would render at least
 * one row: an exam carrying the section (registry gate, via the same listing
 * query the page uses) OR a published content post of that type (the "Latest"
 * strip some hubs render). Structural dead ends are always empty.
 */
export async function hubHasContent(hub: ContentHub): Promise<boolean> {
  if (!hub.populatable) return false;
  const [exams, latest] = await Promise.all([
    getExamsByContentType(hub.contentType),
    getLatestByContentType(hub.contentType, 1),
  ]);
  return exams.length > 0 || latest.length > 0;
}

/** Resolve presence for every hub in parallel — the nav/strip/sitemap filter feed. */
export async function resolveHubPresence(): Promise<Record<string, boolean>> {
  const entries = await Promise.all(
    CONTENT_HUBS.map(async (h) => [h.href, await hubHasContent(h)] as const),
  );
  return Object.fromEntries(entries);
}

/**
 * Filter a list of link items down to those that may show: a non-hub link is
 * always kept; a hub link is kept only while that hub has content. This is the
 * ONE call every strip / menu / sidebar uses, so a hub dropped from search is
 * dropped from the UI by the exact same rule.
 */
export async function filterHubLinks<T extends { href: string }>(
  links: readonly T[],
): Promise<T[]> {
  const hubLinks = links.filter((l) => HUB_BY_HREF.has(l.href));
  if (hubLinks.length === 0) return [...links];
  const present = await resolveHubPresence();
  return links.filter((l) => {
    const hub = HUB_BY_HREF.get(l.href);
    return !hub || present[hub.href];
  });
}
