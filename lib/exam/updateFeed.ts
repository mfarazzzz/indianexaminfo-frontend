/**
 * updateFeed.ts — B2/B3/B4 (owner decisions, 22 Oct): the ONE reader-side
 * ruleset for listing exam updates, shared by the exam page, the global
 * ticker and the home "Latest Updates" card, so the three can never disagree.
 *
 * Locked rules:
 *  – an expired update (expires_at in the past) is HIDDEN everywhere;
 *  – pinned first, capped at PINNED_CAP per section (reader side, whatever the
 *    editor stored); the rest fill by newest updatedAt;
 *  – the ticker/home pool is PUBLISHED EXAM-LINKED updates (kind != withdrawn,
 *    not expired, newest first) — generic news is excluded, it has /news;
 *  – the home card fills to HOME_CAP total; the ticker caps at TICKER_CAP;
 *  – nothing renders when the pool is empty (no empty bar, no empty card);
 *  – links go to the exam page built from the JOINED exam identity — an update
 *    whose exam link is missing renders nothing (we never invent a URL).
 */
import type { ContentPost } from "@/types/exam";

export const PINNED_CAP = 3;
export const HOME_CAP = 6;
export const TICKER_CAP = 8;

/** True when the update carries an expiry that is already past. ISO timestamps
 *  compare lexically against the ISO now-string — no timezone maths here. */
export function isExpired(post: Pick<ContentPost, "expiresAt">, nowISO: string): boolean {
  const e = post.expiresAt;
  return typeof e === "string" && e.trim() !== "" && e < nowISO;
}

/** A live, reader-visible update: published, not withdrawn, not expired. */
export function isLiveUpdate(post: ContentPost, nowISO: string): boolean {
  return post.status === "published" && post.kind !== "withdrawn" && !isExpired(post, nowISO);
}

const byNewest = (a: ContentPost, b: ContentPost): number =>
  String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""));

/**
 * Pinned-first reader order: at most pinnedCap pinned rows (display_order asc,
 * then newest), then the rest newest-first. Optional total cap. Input is
 * expected already filtered (isLiveUpdate / linkable); this function only
 * orders and slices.
 */
export function orderUpdatesForReader(
  posts: ContentPost[],
  opts: { pinnedCap?: number; totalCap?: number } = {},
): ContentPost[] {
  const pinnedCap = opts.pinnedCap ?? PINNED_CAP;
  const pinned = posts
    .filter((p) => p.isPinned === true)
    .sort(
      (a, b) =>
        (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || byNewest(a, b),
    )
    .slice(0, pinnedCap);
  const pinnedIds = new Set(pinned.map((p) => p.id));
  const rest = posts.filter((p) => !pinnedIds.has(p.id)).sort(byNewest);
  const out = [...pinned, ...rest];
  return opts.totalCap ? out.slice(0, opts.totalCap) : out;
}

/** An update can render as a ticker/home cell only if we know its exam page. */
export function isLinkable(post: ContentPost): boolean {
  return !!(post.examEntityId && post.examSlug && post.examPillar);
}

/** B3 ticker pool: published, exam-linked, not withdrawn, not expired,
 *  newest first, capped. Empty array → the ticker renders NOTHING. */
export function tickerPool(posts: ContentPost[], nowISO: string, cap = TICKER_CAP): ContentPost[] {
  return posts
    .filter((p) => isLiveUpdate(p, nowISO) && isLinkable(p) && p.title?.trim())
    .sort(byNewest)
    .slice(0, cap);
}

/** B4 home pool: same eligibility, pinned-first (cap 3), fill to 6 total. */
export function homeBulletinPool(posts: ContentPost[], nowISO: string): ContentPost[] {
  const live = posts.filter((p) => isLiveUpdate(p, nowISO) && isLinkable(p) && p.title?.trim());
  return orderUpdatesForReader(live, { pinnedCap: PINNED_CAP, totalCap: HOME_CAP });
}
