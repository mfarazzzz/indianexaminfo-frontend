/**
 * lastUpdated.ts — the D2 rule for the "Last Updated" line (owner decision 17 Oct).
 *
 * The page used to print `exams.updated_at` as "Last Updated". That column is
 * stamped by a `set_updated_at BEFORE UPDATE` trigger on ANY write — including a
 * one-time data migration (20260925161329 backfilled `region` for ~356 of 398
 * exams in a single statement) and every bulk/seed job — so it is routinely NOT a
 * human edit. Showing it as "Last Updated" is a false freshness claim.
 *
 * D2: the line is built ONLY from a trustworthy source — the newest of
 *   (a) the current edition's updated_at, when its updated_by is a HUMAN id
 *       (NOT null/empty and NOT the literal 'system' that the seed writes);
 *   (b) any published content_post's updated_at (an update IS a real change);
 *   (c) exams.verified_at (a human verify).
 * If none exists, return null and the caller OMITS the line — we never show a
 * fabricated date. Pure, so the component only formats what this decides.
 */
export interface LastUpdatedSources {
  /** current edition updated_at (ISO), or null. */
  editionUpdatedAt?: string | null;
  /** current edition updated_by — a human auth uid, or null, or "system". */
  editionUpdatedBy?: string | null;
  /** updated_at of each PUBLISHED content_post linked to this record. */
  postUpdatedAts?: readonly (string | null | undefined)[];
  /** exams.verified_at (ISO), or null. */
  verifiedAt?: string | null;
}

/** Is an edition `updated_by` a real human edit (not a system/seed write)? */
function isHumanEditor(updatedBy?: string | null): boolean {
  const v = (updatedBy ?? "").trim().toLowerCase();
  return v !== "" && v !== "system";
}

/**
 * The newest trustworthy timestamp, or null when there is none (→ hide the line).
 * ISO-8601 strings sort chronologically by simple string compare, so the max of
 * the set is the newest.
 */
export function resolveLastUpdated(sources: LastUpdatedSources): string | null {
  const candidates: string[] = [];
  if (sources.editionUpdatedAt && isHumanEditor(sources.editionUpdatedBy)) {
    candidates.push(sources.editionUpdatedAt);
  }
  for (const p of sources.postUpdatedAts ?? []) if (p) candidates.push(p);
  if (sources.verifiedAt && sources.verifiedAt.trim()) candidates.push(sources.verifiedAt);
  if (candidates.length === 0) return null;
  return candidates.slice().sort()[candidates.length - 1] ?? null;
}

/**
 * The trustworthy "last updated" for an exam ENTITY, from the fields already on
 * the loaded record (edition edit + verification). Used by JSON-LD / metadata so a
 * false freshness date (from the trigger-stamped exams.updated_at) is never emitted
 * as dateModified/modifiedTime; returns null so callers OMIT the property entirely.
 * Content-post dates are added only where the page has them (EntityDetailPage).
 */
export function examUpdatedFrom(exam: {
  editionUpdatedAt?: string | null;
  editionUpdatedBy?: string | null;
  verifiedAt?: string | null;
}): string | null {
  return resolveLastUpdated({
    editionUpdatedAt: exam.editionUpdatedAt,
    editionUpdatedBy: exam.editionUpdatedBy,
    verifiedAt: exam.verifiedAt,
  });
}

/**
 * The hub/list form of the D2 rule (owner trust fix, 22 Oct): the newest REAL
 * content date among the items a page actually lists (a published post's
 * updatedAt, a listing's publishedAt) — or null. Callers must NEVER fall back
 * to new Date(): the build/render date is not a content date, and printing it
 * as "Last Updated" is a false freshness claim. Null → omit the line entirely.
 */
export function latestContentDate(
  candidates: (string | null | undefined)[],
): string | null {
  const vals = (candidates ?? []).filter(
    (s): s is string => typeof s === "string" && s.trim() !== "" && !Number.isNaN(Date.parse(s)),
  );
  if (vals.length === 0) return null;
  return vals.sort()[vals.length - 1] ?? null;
}
