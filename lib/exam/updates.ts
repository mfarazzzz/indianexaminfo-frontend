/**
 * updates.ts — 4b: the reader-side model for an exam's own Updates (content_posts).
 *
 * The Updates timeline on the exam page splits the exam's published announcements
 * into an ACTIVE list and a "History / Withdrawn" list, and marks each item with
 * the lifecycle it actually carries — never a chip for a field that is absent,
 * never an invented status. This mirrors the CMS write side
 * (src/services/examUpdatesService.ts) and the content_posts columns from
 * migration 20261013125113:
 *   • kind        ∈ provisional | final | revised | corrigendum | withdrawn (or null)
 *   • supersedesId — this update REPLACES the referenced one (a chain edge)
 *   • verifiedBy   — an editor confirmed it; a verified update is exactly one
 *                    where verifiedBy is non-null (there is no separate flag).
 *
 * Rules locked by the owner:
 *   – Verified is shown ONLY when is-verified (verifiedBy set).
 *   – A WITHDRAWN update (kind === "withdrawn") and any update that has been
 *     SUPERSEDED (another post's supersedesId points at it) move out of the live
 *     timeline into "History / Withdrawn" — they stay readable (withdrawal is
 *     history, not a secret), never silently deleted.
 *   – Everything renders ONLY when the data exists: a sparse exam with no updates
 *     produces no section at all (no empty shell).
 */
import type { ContentPost } from "@/types/exam";

export interface UpdateViewModel {
  post: ContentPost;
  /** The lifecycle kind as stored; null on a plain announcement. */
  kind: NonNullable<ContentPost["kind"]> | null;
  /** True ONLY when an editor verified this update (verifiedBy non-null). */
  verified: boolean;
  /** True when kind === "withdrawn". */
  withdrawn: boolean;
  /** True when another update in the SAME set supersedes this one. */
  superseded: boolean;
}

export interface PartitionedUpdates {
  active: UpdateViewModel[];
  history: UpdateViewModel[];
}

/** A verified update is exactly one with a verifiedBy author id set. */
export function isVerifiedUpdate(post: ContentPost): boolean {
  return typeof post.verifiedBy === "string" && post.verifiedBy.trim() !== "";
}

/**
 * Split an exam's published updates into the live timeline and the History /
 * Withdrawn group. Input order (the query returns newest-first) is preserved so
 * no date is re-derived here. A supersession edge only marks the SUPERSEDED row
 * (the one referenced by another post in this same set) — the newer row that
 * supersedes it stays active.
 */
export function partitionUpdates(posts: ContentPost[]): PartitionedUpdates {
  // ids referenced as superseded by some other post in this exam's update set.
  const supersededIds = new Set<string>();
  for (const p of posts) {
    const sid = typeof p.supersedesId === "string" ? p.supersedesId.trim() : "";
    if (sid) supersededIds.add(sid);
  }

  const views: UpdateViewModel[] = posts.map((post) => ({
    post,
    kind: post.kind ?? null,
    verified: isVerifiedUpdate(post),
    withdrawn: post.kind === "withdrawn",
    superseded: supersededIds.has(post.id),
  }));

  const isHistory = (v: UpdateViewModel): boolean => v.withdrawn || v.superseded;
  return {
    active: views.filter((v) => !isHistory(v)),
    history: views.filter(isHistory),
  };
}
