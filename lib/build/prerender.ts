/**
 * lib/build/prerender.ts — build-time "hot set" cap for generateStaticParams.
 *
 * The main lever against the Hostinger build stampede: each dynamic route
 * prerenders only its top-N most-recently-updated published records at build
 * time and serves every other record on demand (ISR, dynamicParams=true).
 * N comes from ONE place — env BUILD_PRERENDER_LIMIT (default 20, 0 = none).
 *
 * The Supabase-backed routes push the limit into the query itself
 * (.order("updated_at", desc).limit(N)) so the DB does the truncation. This
 * helper covers the fixed-set routes (blog/[section], news/[section],
 * blog/author/[slug]) whose params come from local constants rather than a
 * query, so the same N/0 semantics apply uniformly.
 */
import { env } from "@/config/env";

/** The single source of truth for prerender count. 0 = prerender none. */
export const BUILD_PRERENDER_LIMIT: number = env.BUILD_PRERENDER_LIMIT;

/**
 * Truncate a generated static-params array to the deliberate build set.
 * `limit <= 0` returns nothing (fully on-demand). Default is the shared
 * BUILD_PRERENDER_LIMIT so callers pass no second argument in normal use.
 */
export function capPrerender<T>(items: readonly T[], limit: number = BUILD_PRERENDER_LIMIT): T[] {
  if (limit <= 0) return [];
  return items.slice(0, limit);
}
