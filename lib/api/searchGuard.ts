/**
 * searchGuard.ts — the two guards `/api/search` was missing (owner batch 6, W1).
 *
 * WHY. The endpoint takes `?q=` and runs FIVE unbounded `ILIKE` searches against Supabase
 * (`app/api/search/route.ts:41-47`), on a `force-dynamic` route, with no length cap and no
 * throttle. September's backlog recorded it as "partial: Min 2 chars enforced; no max; no
 * throttle"; batch 6 V2 re-measured it live — a 300-character query is accepted with 200 and no
 * `Retry-After` anywhere.
 *
 * WHAT IS HERE INSTEAD OF DOING IT IN THE ROUTE. Both rules are pure functions over plain
 * values, so the arithmetic is testable without a request, without Supabase and without a
 * running server. The route only decides which status code to attach to a verdict.
 *
 * THE LIMITATIONS, STATED RATHER THAN HIDDEN:
 *  • the bucket lives in this module's memory, so it is PER NODE PROCESS. On a second instance
 *    or a new deployment each process counts its own traffic — the cap is per process, not
 *    global. The host runs one Node process for this app today; if that changes, move this to a
 *    shared store (Upstash/Redis) and keep the same interface.
 *  • the key is the CLIENT IP, and mobile carriers share public IPs (CGNAT). One busy
 *    carrier IP is many readers. So the numbers below are deliberately generous — sized so a
 *    human cannot reach them, while a script can. A guard that throttles real readers is worse
 *    than no guard.
 *  • when the request carries no usable client IP at all, the call is ALLOWED (fail-open) and
 *    simply not counted. Guessing a key and sharing one bucket between unknown clients would
 *    turn a misconfigured proxy into a site-wide search outage.
 */

/** Longest query accepted. A real search box needs far less; the cap bounds the ILIKE work. */
export const MAX_QUERY_LENGTH = 100;

/** Shortest query worth running. Below this the endpoint answers with an empty result set,
 *  exactly as it always has — the header/panel search box relies on that not being an error. */
export const MIN_QUERY_LENGTH = 2;

/** Burst a single client may make, and the sustained rate it refills at. Generous on purpose:
 *  40 searches at once, then 1 per second (≈60/min). A reader typing in a panel uses a fraction
 *  of that; a naive scraper hits it within seconds. */
export const RATE_CAPACITY = 40;
export const RATE_REFILL_PER_SECOND = 1;

export type QueryVerdict =
  | { ok: true; q: string }
  | { ok: false; code: "query_too_long"; message: string; max: number };

/**
 * validateSearchQuery — trim, then apply the length cap. It deliberately says nothing about a
 * SHORT or absent query: the route keeps its historical behaviour there (200 + empty results),
 * because the panel search box calls the endpoint on every typing pause and an error would look
 * to the reader like a broken feature. `MIN_QUERY_LENGTH` stays the route's own decision.
 */
export function validateSearchQuery(raw: string | null | undefined): QueryVerdict {
  const q = (raw ?? "").trim();
  if (q.length > MAX_QUERY_LENGTH) {
    return {
      ok: false,
      code: "query_too_long",
      max: MAX_QUERY_LENGTH,
      message: `Search queries are limited to ${MAX_QUERY_LENGTH} characters (this one is ${q.length}).`,
    };
  }
  return { ok: true, q };
}

export interface RateVerdict {
  allowed: boolean;
  /** Tokens left after this decision — for the header, never for a user-facing number. */
  remaining: number;
  /** Seconds a caller must wait for one token; 0 when allowed. */
  retryAfterSeconds: number;
  /** False when the request had no usable client IP and was therefore not counted. */
  counted: boolean;
}

export interface TokenBucket {
  check: (key: string | null, nowMs?: number) => RateVerdict;
  /** Number of tracked keys — exposed for tests and for a memory-size sanity check. */
  size: () => number;
  reset: () => void;
}

/**
 * createTokenBucket — capacity `capacity`, refilled at `refillPerSecond` tokens/second, one
 * bucket per key. Deterministic: the clock is a parameter, so the math is tested without
 * sleeping. A bucket untouched for `evictionMs` (5 minutes by default, and a 40-token bucket at
 * 1/s refills in 40s, so an idle bucket is always full by then) is dropped on the next check,
 * so a flood of unique keys cannot grow the map without bound.
 */
export function createTokenBucket(opts: {
  capacity?: number;
  refillPerSecond?: number;
  /** Idle-full buckets older than this are evicted. */
  evictionMs?: number;
} = {}): TokenBucket {
  const capacity = opts.capacity ?? RATE_CAPACITY;
  const refillPerSecond = opts.refillPerSecond ?? RATE_REFILL_PER_SECOND;
  const evictionMs = opts.evictionMs ?? 5 * 60 * 1000;

  const buckets = new Map<string, { tokens: number; lastRefillMs: number }>();

  const evictStale = (nowMs: number) => {
    for (const [k, b] of buckets) {
      // Idle long enough that it has certainly refilled: forgetting it costs nothing.
      if (nowMs - b.lastRefillMs > evictionMs) buckets.delete(k);
    }
  };

  return {
    check(key, nowMs = Date.now()) {
      if (!key) {
        // No usable client identity: allow, do not count, do not create a shared bucket.
        return { allowed: true, remaining: capacity, retryAfterSeconds: 0, counted: false };
      }
      evictStale(nowMs);

      const bucket = buckets.get(key) ?? { tokens: capacity, lastRefillMs: nowMs };
      const elapsedSeconds = Math.max(0, (nowMs - bucket.lastRefillMs) / 1000);
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillPerSecond);
      bucket.lastRefillMs = nowMs;

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        buckets.set(key, bucket);
        return {
          allowed: true,
          remaining: Math.floor(bucket.tokens),
          retryAfterSeconds: 0,
          counted: true,
        };
      }

      // Less than one token: say how long until one exists, rounded UP to whole seconds
      // because Retry-After is an integer-seconds hint and under-stating it invites retries.
      const needed = 1 - bucket.tokens;
      const retryAfterSeconds = Math.max(1, Math.ceil(needed / refillPerSecond));
      buckets.set(key, bucket);
      return { allowed: false, remaining: 0, retryAfterSeconds, counted: true };
    },
    size: () => buckets.size,
    reset: () => buckets.clear(),
  };
}

/**
 * clientIpFromHeaders — the first hop of X-Forwarded-For, else X-Real-IP, else null.
 * The proxy in front of this app sets these; a raw socket address is not reachable from an
 * App Router route handler. Returns null (not a guess) when neither header is present.
 */
export function clientIpFromHeaders(get: (name: string) => string | null): string | null {
  const xff = get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first && first !== "unknown") return first;
  }
  const real = get("x-real-ip")?.trim();
  if (real) return real;
  return null;
}
