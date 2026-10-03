/**
 * categoryCanonical.ts — ONE rule for the public category segment of an exam URL.
 *
 * ROOT-CAUSE FIX (owner S1 item 3). The detail routes used to look a record up by
 * slug ONLY, then build BOTH the breadcrumb label AND the canonical URL from the
 * URL's category segment. Consequence: `/admission/<anything>/<slug>` returned 200
 * and was self-canonical — a wrong (or fabricated) category segment produced a real,
 * indexable page. Two facts had no single home: the label (title-cased from the slug)
 * and the canonical (echoed from the slug).
 *
 * The invariant now: the RECORD is the only source of the category slug and its
 * display name. The URL segment is a routing hint that must EQUAL the record's
 * category; when it does not, the caller issues a single 308 to the canonical URL.
 * A record with no category is not routed here (no public URL — the caller notFound()s
 * or keeps its existing flat-slug behaviour, depending on the pillar).
 */

export type CategoryRecord = {
  /** The record's category SLUG (categories.slug), the routing authority. Empty = none. */
  category: string;
  /** The record's category DISPLAY name (categories.name), verbatim — may contain "&". */
  categoryName?: string;
};

/** Legacy cosmetic slug→title used ONLY as a last-resort fallback when a record has
 *  no stored display name (older rows). Prefer `categoryName`. Never applied to the
 *  URL segment for a record that has a category. */
function titleCaseSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The breadcrumb label — from the RECORD, never from the URL segment.
 * Returns `categories.name` VERBATIM so an ampersand and the author's casing survive
 * ("Research & Fellowships"). Falls back to a title-cased record slug only when the
 * join carried no name; falls back to the URL segment only when the record has no
 * category at all (a category-less record that some routes still render flat).
 */
export function categoryBreadcrumbLabel(record: CategoryRecord, urlCategory: string): string {
  const name = (record.categoryName ?? "").trim();
  if (name) return name;
  if (record.category) return titleCaseSlug(record.category);
  return titleCaseSlug(urlCategory);
}

/**
 * True when the URL's category segment disagrees with the record's category slug, so
 * the caller must permanentlyRedirect to the canonical URL. False when they match, and
 * false when the record has NO category (there is no canonical category to redirect to
 * — the caller decides: admission-style routes notFound(), flat-capable routes render).
 */
export function categoryMismatch(urlCategory: string, record: CategoryRecord): boolean {
  return !!record.category && urlCategory !== record.category;
}
