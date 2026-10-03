/**
 * lib/supabase/fetchWithRetry.ts — a fetch for the Supabase server client that
 * retries ONLY idempotent reads, so a transient Cloudflare 5xx on the Supabase
 * edge (the 522/525 stampede that failed the Hostinger build) stops aborting a
 * whole page's prerender.
 *
 * Rules (per owner spec):
 *  - Retries GET/HEAD only. POST/PATCH/DELETE are never retried (not idempotent).
 *  - Retries on network errors (fetch rejects) and on HTTP 502/503/504/520–527.
 *  - At most 3 retries → up to 4 total attempts, backoff ~0.5s, 1.5s, 3s with
 *    jitter. Never retries 4xx (a 404 is a real answer).
 *  - On exhaustion, the ORIGINAL error is thrown for network failures (so the
 *    service layer still sees a failure — R5: never bake a fake empty page),
 *    and the final Response is returned for a persistent 5xx (supabase-js turns
 *    the non-2xx into its own error, which the service already throws on).
 *  - One log line per retry: method, path (query values stripped), status, attempt.
 *  - Counts every attempt + every retry for the F4 build report.
 */
import {
  ensureBuildMetricReporter,
  recordRequest,
  recordRetry,
} from "@/lib/build/metrics";

/** Backoff between attempts (ms). Retries capped at this array's length. */
let backoffSchedule: number[] = [500, 1500, 3000];
/** Fraction of the delay added as random jitter (±). */
let jitterRatio = 0.2;

const IDEMPOTENT_METHODS = new Set(["GET", "HEAD"]);

// Cloudflare / origin transient failures worth retrying. 520 (unknown),
// 521 (web server down), 522 (connection timed out), 523 (origin unreachable),
// 524 (a timeout occurred), 525 (SSL handshake failed), 526, 527 — plus the
// standard gateway errors 502/503/504.
const RETRYABLE_STATUS = new Set([502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527]);

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status);
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase();
  return "GET";
}

/** Path only — query values stripped (logs must not leak tokens/filters). */
function safePath(input: RequestInfo | URL): string {
  const raw =
    typeof input === "string"
      ? input
      : typeof Request !== "undefined" && input instanceof Request
        ? input.url
        : String(input);
  try {
    return new URL(raw, "http://internal").pathname;
  } catch {
    return raw.split("?")[0];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffWithJitter(attempt: number): number {
  const base = backoffSchedule[attempt - 1] ?? backoffSchedule[backoffSchedule.length - 1] ?? 0;
  const jitter = base * jitterRatio * Math.random();
  return Math.round(base + jitter);
}

function logRetry(method: string, path: string, status: number | string, attempt: number): void {
  console.warn(
    `[supabase-fetch] retry ${method} ${path} status=${status} attempt=${attempt}`,
  );
}

// Bind the platform fetch once so we can call it without recursion.
const nativeFetch: typeof fetch = (...args) => globalThis.fetch(...args);

export const fetchWithRetry: typeof fetch = async (input, init) => {
  ensureBuildMetricReporter();
  const method = resolveMethod(input, init);
  const path = safePath(input);
  const canRetry = IDEMPOTENT_METHODS.has(method);
  const maxAttempts = canRetry ? backoffSchedule.length + 1 : 1;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isLast = attempt === maxAttempts;
    recordRequest();
    try {
      const res = await nativeFetch(input, init);
      if (!canRetry || isLast || !isRetryableStatus(res.status)) return res;
      recordRetry();
      logRetry(method, path, res.status, attempt);
      await sleep(backoffWithJitter(attempt));
    } catch (err) {
      if (!canRetry || isLast) throw err; // surface the ORIGINAL error (R5)
      recordRetry();
      logRetry(method, path, "network-error", attempt);
      lastErr = err;
      await sleep(backoffWithJitter(attempt));
    }
  }
  // Only reachable if the loop completes via a retryable-status path on the
  // last attempt without returning — guard the exhausted-network-error case.
  if (lastErr) throw lastErr;
  throw new Error(`[supabase-fetch] retries exhausted for ${method} ${path}`);
};

/**
 * Test seam: shrink the schedule to make unit tests deterministic and instant.
 * Not used in production paths.
 */
export function _configureRetryForTests(schedule?: number[], jitter?: number): void {
  if (schedule) backoffSchedule = schedule;
  if (jitter !== undefined) jitterRatio = jitter;
}
