/**
 * testContent.ts — the ONE definition of "this row is reference TEST data".
 *
 * Test identity is purely the slug prefix `zz-test-` (no migration, no column):
 * every seeded test exam and every test content_post carries a slug that starts
 * with it. This module is the single source of truth for that rule; the CMS
 * keeps a byte-identical mirror (src/lib/testContent.ts) exactly like the
 * sectionRegistry / normalizeUrl pairing, so the editor and the site can never
 * disagree about what is a test row.
 *
 * WHY IT MATTERS: the reference pages must be reachable by direct URL for the
 * owner to inspect, but must NEVER leak into an aggregate surface a real reader
 * trusts — nav, hubs, search, sitemaps, feeds, the ticker, the home card, the
 * deadline strip, related-exams, or any "N exams" count. Every aggregate reader
 * filters on this; the record's OWN page stays reachable and is marked
 * noindex/nofollow with a visible TEST banner (see lib/seo/metadata +
 * components/exam/TestPageBanner).
 */

/** Slug prefix that marks a reference TEST record. Lowercase; slugs are stored lowercase. */
export const TEST_SLUG_PREFIX = "zz-test-";

/** PostgREST LIKE pattern matching any test slug, for `.not("slug","like", …)`.
 *  The codebase's `.like`/`.ilike` use `%` as the wildcard (see examService). */
export const TEST_SLUG_LIKE = `${TEST_SLUG_PREFIX}%`;

/** True when a slug belongs to a reference TEST record. Null/undefined-safe. */
export function isTestSlug(slug: string | null | undefined): boolean {
  return typeof slug === "string" && slug.trim().toLowerCase().startsWith(TEST_SLUG_PREFIX);
}

/** Drop test rows from an already-fetched list (in-memory net for readers whose
 *  source is a VIEW or a derived array where a query-level filter is awkward). */
export function excludeTest<T extends { slug?: string | null }>(rows: readonly T[]): T[] {
  return rows.filter((r) => !isTestSlug(r?.slug));
}
