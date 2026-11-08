/**
 * lib/build/dbDegrade.ts — the CI-only build switch for DB-dependent prerenders.
 *
 * Owner batch 8, E2a. The problem it solves is REAL and pre-existing:
 *
 *   `next build` against a host that cannot reach Supabase dies at the FIRST
 *   prerendered route that reads the database. Measured 2026-11-08 against the
 *   fake host the e2e config uses (NEXT_PUBLIC_SUPABASE_URL=https://ci-fake-host
 *   .supabase.invalid, BUILD_PRERENDER_LIMIT=0):
 *
 *     [pageService] getAllPublishedPages failed: { message: 'TypeError: fetch failed' }
 *     Error occurred prerendering page "/sitemap.xml".
 *     Export encountered an error on /sitemap.xml/route: /sitemap.xml, exiting the build.
 *     [build-metrics] pid=18476 supabaseRequests=454 retries=348
 *
 * BUILD_PRERENDER_LIMIT=0 (prerender no page params) does NOT help: the sitemap,
 * the news sitemap, the feeds and the static hub pages read the database during
 * the build regardless of that limit, so the e2e build could never complete.
 *
 * WHAT THIS SWITCH DOES
 *   When BOTH gates are true —
 *     1. the documented CI flag BUILD_DB_DEGRADE=1 is set, AND
 *     2. the process is inside `next build` (NEXT_PHASE=phase-production-build)
 *   — a server-side read that FAILS answers with the EMPTY result the same read
 *   would give against an empty table, instead of throwing. The build then
 *   completes and ships a site with no content, which is exactly what an e2e
 *   run against a fake host needs.
 *
 * WHAT IT MUST NEVER DO
 *   In production the K4 rule stands unchanged: "a failed read is not an empty
 *   answer" (services/readFailure.test.ts asserts every swept read RETHROWS).
 *   The second gate is what makes that safe: `next build` sets NEXT_PHASE to
 *   phase-production-build (next/dist/build/index.js:1010), and `next start`
 *   (phase-production-server) and `next dev` never set it. So even if the flag
 *   were accidentally set on the host, the production reads would still throw.
 *   The flag is read from a server-only variable (never NEXT_PUBLIC_*) so it
 *   can never reach the browser bundle.
 *
 * The degrade is applied at the READ RESULT, not by rewriting the services: the
 * services keep throwing, and this layer turns a FAILED read into an empty one
 * only for the CI build.
 */
import { env } from "@/config/env";

/** True ONLY inside `next build`. `next dev` / `next start` never set it. */
export function isProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * The degrade is active only when the documented CI flag is set AND we are
 * inside a production build. Both, never one of the two.
 */
export function dbDegradeActive(): boolean {
  return env.BUILD_DB_DEGRADE === true && isProductionBuildPhase();
}

/** The shape of a PostgREST answer that failed: `error` set, `data` null. */
export interface FailedRead {
  success?: boolean;
  error?: unknown;
  data?: unknown;
  count?: number | null;
  status?: number;
  statusText?: string;
}

/**
 * Turn a FAILED read into an empty one — but only for the CI build.
 *
 * A list read answers `[]`, a single-row read answers `null` (the row does not
 * exist, which is what a clean miss looks like), and an RPC answers `{}`. The
 * caller cannot tell the difference between "the table is empty" and "the
 * database was unreachable", which is the POINT of the CI build: it exercises
 * the code path, not the data.
 */
export function degradeReadResult<T extends FailedRead>(result: T, kind: "list" | "single" | "rpc"): T {
  if (!dbDegradeActive()) return result;
  if (!result || !result.error) return result;
  const message =
    typeof result.error === "object" && result.error !== null && "message" in result.error
      ? String((result.error as { message?: unknown }).message ?? "")
      : String(result.error);
  console.warn(
    `[build-db-degrade] a ${kind} read failed during the CI build; answering with an empty result (${message}). ` +
      `This never happens in production — K4 (a failed read is not an empty answer) still holds there.`,
  );
  const data = kind === "single" ? null : kind === "rpc" ? {} : [];
  return { ...result, success: true, error: null, data, count: null, status: 200, statusText: "OK" };
}
