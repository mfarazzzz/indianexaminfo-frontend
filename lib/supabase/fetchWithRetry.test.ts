/**
 * fetchWithRetry.test.ts — verifies the F2 retry contract:
 *   - GET/HEAD retried on network error and 5xx; success after 2 failures.
 *   - Gives up after the retry budget and surfaces the ORIGINAL error (R5).
 *   - 4xx is a real answer → never retried.
 *   - POST (non-idempotent) → never retried.
 *
 * The backoff schedule is collapsed to [0,0,0] with zero jitter so the tests
 * are instant and deterministic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithRetry, _configureRetryForTests } from "./fetchWithRetry";

describe("fetchWithRetry", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    _configureRetryForTests([0, 0, 0], 0);
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retries a GET and succeeds after 2 failures", async () => {
    const ok = new Response("[]", { status: 200 });
    const f = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error("blip-1"))
      .mockRejectedValueOnce(new Error("blip-2"))
      .mockResolvedValueOnce(ok);
    globalThis.fetch = f;

    const res = await fetchWithRetry("https://x.supabase.co/rest/v1/exams?select=slug");

    expect(res.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("gives up after the retry budget and surfaces the ORIGINAL error", async () => {
    const err = new Error("getaddrinfo ENOTFOUND");
    const f = vi.fn<typeof fetch>().mockRejectedValue(err);
    globalThis.fetch = f;

    await expect(fetchWithRetry("https://x.supabase.co/rest/v1/exams")).rejects.toBe(err);
    // 1 initial attempt + 3 retries
    expect(f).toHaveBeenCalledTimes(4);
  });

  it("does not retry a 4xx (a 404 is a real answer)", async () => {
    const nf = new Response("not found", { status: 404 });
    const f = vi.fn<typeof fetch>().mockResolvedValue(nf);
    globalThis.fetch = f;

    const res = await fetchWithRetry("https://x.supabase.co/rest/v1/exams?slug=eq.missing");

    expect(res.status).toBe(404);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retries a transient 5xx (Cloudflare 522) and returns the last response once spent", async () => {
    const f = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => new Response("cf 522", { status: 522 }));
    globalThis.fetch = f;

    const res = await fetchWithRetry("https://x.supabase.co/rest/v1/exams");

    expect(res.status).toBe(522);
    expect(f).toHaveBeenCalledTimes(4);
  });

  it("never retries a non-idempotent POST", async () => {
    const f = vi.fn<typeof fetch>().mockRejectedValue(new Error("write failed"));
    globalThis.fetch = f;

    await expect(
      fetchWithRetry("https://x.supabase.co/rest/v1/rpc/something", { method: "POST" }),
    ).rejects.toThrow("write failed");
    expect(f).toHaveBeenCalledTimes(1);
  });
});
