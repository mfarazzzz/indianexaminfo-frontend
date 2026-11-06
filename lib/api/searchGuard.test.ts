/**
 * searchGuard.test.ts — the arithmetic behind W1, tested without a request, a server or
 * Supabase. The route's job is to attach a status code to a verdict; the verdicts are here.
 */
import { describe, it, expect } from "vitest";
import {
  MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, RATE_CAPACITY, RATE_REFILL_PER_SECOND,
  clientIpFromHeaders, createTokenBucket, validateSearchQuery,
} from "./searchGuard";

describe("validateSearchQuery — the length cap", () => {
  it("accepts a normal query and hands back the trimmed value", () => {
    expect(validateSearchQuery("  ssc cgl  ")).toEqual({ ok: true, q: "ssc cgl" });
  });

  it("accepts exactly the limit and rejects one character past it", () => {
    expect(validateSearchQuery("a".repeat(MAX_QUERY_LENGTH)).ok).toBe(true);
    const verdict = validateSearchQuery("a".repeat(MAX_QUERY_LENGTH + 1));
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.code).toBe("query_too_long");
      expect(verdict.max).toBe(MAX_QUERY_LENGTH);
      // The message names the limit AND the length, so a support question answers itself.
      expect(verdict.message).toContain(String(MAX_QUERY_LENGTH));
      expect(verdict.message).toContain(String(MAX_QUERY_LENGTH + 1));
    }
  });

  it("treats a missing or null query as empty, not as an error", () => {
    expect(validateSearchQuery(null)).toEqual({ ok: true, q: "" });
    expect(validateSearchQuery(undefined)).toEqual({ ok: true, q: "" });
    expect(validateSearchQuery("   ")).toEqual({ ok: true, q: "" });
  });

  it("counts characters (code units), not bytes — a Hindi query is measured the same way", () => {
    // "भर्ती" is 5 code units, so the repeat count is derived rather than assumed.
    const unit = "भर्ती";
    const hindi = unit.repeat(Math.floor(MAX_QUERY_LENGTH / unit.length));
    expect(hindi.length, "the fixture is exactly at the cap").toBe(MAX_QUERY_LENGTH);
    expect(validateSearchQuery(hindi).ok).toBe(true);
    // One more grapheme cluster pushes it past the cap; byte length is irrelevant to the verdict.
    expect(validateSearchQuery(hindi + unit).ok).toBe(false);
  });

  it("keeps the documented constants at the values the plan approved", () => {
    expect(MAX_QUERY_LENGTH).toBe(100);
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(RATE_CAPACITY).toBe(40);
    expect(RATE_REFILL_PER_SECOND).toBe(1);
  });
});

describe("createTokenBucket — burst, refill, and Retry-After", () => {
  const T0 = 1_700_000_000_000;

  it("lets a burst through up to capacity, then blocks with a whole-second Retry-After", () => {
    const bucket = createTokenBucket({ capacity: 3, refillPerSecond: 1 });
    expect(bucket.check("1.2.3.4", T0)).toMatchObject({ allowed: true, remaining: 2, counted: true });
    bucket.check("1.2.3.4", T0);
    bucket.check("1.2.3.4", T0);
    const blocked = bucket.check("1.2.3.4", T0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it("refills at exactly one token per second and caps at capacity", () => {
    const bucket = createTokenBucket({ capacity: 2, refillPerSecond: 1 });
    bucket.check("k", T0);
    bucket.check("k", T0);
    expect(bucket.check("k", T0).allowed).toBe(false);

    // 1s later: exactly one token exists, so one call passes and the next does not.
    expect(bucket.check("k", T0 + 1_000).allowed).toBe(true);
    expect(bucket.check("k", T0 + 1_000).allowed).toBe(false);

    // A long idle period refills to capacity and no further.
    expect(bucket.check("k", T0 + 60_000)).toMatchObject({ allowed: true, remaining: 1 });
    expect(bucket.check("k", T0 + 60_000).remaining, "refill caps at capacity; nothing banks for later")
      .toBe(0);
  });

  it("never tells a caller to wait less than a second, and never a fractional second", () => {
    const bucket = createTokenBucket({ capacity: 1, refillPerSecond: 2 });
    bucket.check("k", T0);
    const slow = bucket.check("k", T0);            // 0 tokens -> needs 0.5s at 2/s
    expect(slow.allowed).toBe(false);
    expect(slow.retryAfterSeconds).toBe(1);       // rounded up, never 0
    expect(Number.isInteger(slow.retryAfterSeconds)).toBe(true);
  });

  it("keeps one client's exhaustion to itself", () => {
    const bucket = createTokenBucket({ capacity: 1, refillPerSecond: 1 });
    expect(bucket.check("a", T0).allowed).toBe(true);
    expect(bucket.check("a", T0).allowed).toBe(false);
    expect(bucket.check("b", T0).allowed).toBe(true);
  });

  it("an unknown client is allowed and NOT counted — no shared anonymous bucket", () => {
    const bucket = createTokenBucket({ capacity: 1, refillPerSecond: 1 });
    for (let i = 0; i < 10; i++) {
      const v = bucket.check(null, T0 + i);
      expect(v.allowed).toBe(true);
      expect(v.counted).toBe(false);
    }
    expect(bucket.size(), "no buckets created for anonymous traffic").toBe(0);
  });

  it("evicts idle buckets so a flood of unique keys cannot grow the map", () => {
    const bucket = createTokenBucket({ capacity: 2, refillPerSecond: 1, evictionMs: 1_000 });
    for (let i = 0; i < 50; i++) bucket.check(`ip-${i}`, T0);
    expect(bucket.size()).toBe(50);
    // Past the idle window every one of them has certainly refilled, so the next check sweeps.
    bucket.check("fresh", T0 + 10_000);
    expect(bucket.size(), "stale buckets are dropped, only the live one remains").toBe(1);
  });

  it("the production defaults are generous enough that a typing human cannot trip them", () => {
    // A reader in the panel fires one request per 200ms debounce, and only after a pause, so the
    // realistic worst case is a few dozen per minute. Burst 40 + 1/s sustained never refuses that.
    const bucket = createTokenBucket();
    let allowed = 0;
    for (let i = 0; i < 40; i++) if (bucket.check("reader", T0 + i * 1_000).allowed) allowed++;
    expect(allowed, "one search per second for 40 seconds is never throttled").toBe(40);

    // A scraper firing 60 requests in a single instant gets its burst and nothing more.
    let blocked = 0;
    for (let i = 0; i < 60; i++) if (!bucket.check("scraper", T0).allowed) blocked++;
    expect(blocked, "60 requests at once: 40 burst allowed, 20 refused").toBe(20);
  });

  it("reset() clears every bucket (used by the route-level test and by nothing in production)", () => {
    const bucket = createTokenBucket({ capacity: 1 });
    bucket.check("a", T0);
    expect(bucket.size()).toBe(1);
    bucket.reset();
    expect(bucket.size()).toBe(0);
  });
});

describe("clientIpFromHeaders — the key, and what happens when there isn't one", () => {
  const from = (map: Record<string, string>) =>
    clientIpFromHeaders((n) => map[n.toLowerCase()] ?? null);

  it("takes the first hop of X-Forwarded-For, trimmed", () => {
    expect(from({ "x-forwarded-for": " 203.0.113.7, 70.41.3.18, 150.172.238.178" })).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP, and to null when neither header exists", () => {
    expect(from({ "x-real-ip": "198.51.100.9" })).toBe("198.51.100.9");
    expect(from({})).toBeNull();
  });

  it("ignores an 'unknown' placeholder rather than keying every visitor together", () => {
    expect(from({ "x-forwarded-for": "unknown" })).toBeNull();
    expect(from({ "x-forwarded-for": "unknown, 203.0.113.7" })).toBeNull();
  });

  it("a header present but empty is not an identity", () => {
    expect(from({ "x-forwarded-for": "" })).toBeNull();
    expect(from({ "x-forwarded-for": "   " })).toBeNull();
  });
});
