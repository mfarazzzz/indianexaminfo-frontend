/**
 * cache.ts — Next.js App Router cache utilities with tag-based revalidation.
 *
 * Usage:
 *   const data = await cached(
 *     () => fetchFromSupabase(),
 *     ["exams", "pillar:sarkari-naukri"],
 *     { revalidate: 1800 }
 *   );
 *
 * When the CMS saves and calls POST /api/revalidate { tag: "exams" },
 * all cached data with that tag is invalidated automatically.
 */
import { unstable_cache } from "next/cache";

/**
 * Wraps a data-fetching function with Next.js cache and tags.
 * @param fn - The async function to cache
 * @param tags - Cache tags for targeted invalidation (e.g. ["exams", "exam:ibps-po"])
 * @param options - { revalidate: seconds } — time-based revalidation fallback
 */
export function cached<T>(
  fn: () => Promise<T>,
  tags: string[],
  options: { revalidate?: number } = {}
): Promise<T> {
  const cacheKey = tags.join(":");
  const cachedFn = unstable_cache(fn, [cacheKey], {
    tags,
    revalidate: options.revalidate ?? 1800, // default 30 min
  });
  return cachedFn();
}
