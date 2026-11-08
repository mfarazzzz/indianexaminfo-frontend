/**
 * dbDegrade.test.ts — the CI-only build switch (owner batch 8, E2a).
 *
 * The switch has exactly two gates and BOTH must be open:
 *   1. BUILD_DB_DEGRADE=1 (the documented CI flag), and
 *   2. NEXT_PHASE=phase-production-build (we are inside `next build`).
 *
 * The tests below pin all four combinations, because the failure that matters
 * is the one nobody asked for: a degraded read in PRODUCTION. A failed read in
 * production must still be an error (K4 — services/readFailure.test.ts asserts
 * that for every swept service), and this file is the proof that the build
 * switch cannot reach it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL = {
  flag: process.env.BUILD_DB_DEGRADE,
  phase: process.env.NEXT_PHASE,
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

/** Load the modules with a given flag + phase, re-evaluating config/env. */
async function load(flag: string | undefined, phase: string | undefined) {
  vi.resetModules();
  if (flag === undefined) delete process.env.BUILD_DB_DEGRADE;
  else process.env.BUILD_DB_DEGRADE = flag;
  if (phase === undefined) delete process.env.NEXT_PHASE;
  else process.env.NEXT_PHASE = phase;
  const dbDegrade = await import("./dbDegrade");
  const degraded = await import("@/lib/supabase/degradedClient");
  return { ...dbDegrade, ...degraded };
}

const FAILED_LIST = {
  success: false as const,
  error: { message: "TypeError: fetch failed" },
  data: null,
  count: null,
  status: 0,
  statusText: "",
};

beforeEach(() => {
  // Keep config/env quiet: real-shaped values, so no placeholder warning.
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
});

afterEach(() => {
  vi.restoreAllMocks();
  if (ORIGINAL.flag === undefined) delete process.env.BUILD_DB_DEGRADE;
  else process.env.BUILD_DB_DEGRADE = ORIGINAL.flag;
  if (ORIGINAL.phase === undefined) delete process.env.NEXT_PHASE;
  else process.env.NEXT_PHASE = ORIGINAL.phase;
});

describe("E2a — the CI build switch needs BOTH gates", () => {
  it("is inactive with no flag at all", async () => {
    const { dbDegradeActive } = await load(undefined, "phase-production-build");
    expect(dbDegradeActive()).toBe(false);
  });

  it("is inactive with the flag but OUTSIDE a build (production server)", async () => {
    const { dbDegradeActive } = await load("1", "phase-production-server");
    expect(dbDegradeActive()).toBe(false);
  });

  it("is inactive with the flag but with no phase marker (runtime)", async () => {
    const { dbDegradeActive } = await load("1", undefined);
    expect(dbDegradeActive()).toBe(false);
  });

  it("is active with the flag inside a production build", async () => {
    const { dbDegradeActive } = await load("1", "phase-production-build");
    expect(dbDegradeActive()).toBe(true);
  });
});

describe("E2a — a failed read", () => {
  it("keeps its error when the switch is off (K4 still holds)", async () => {
    const { degradeReadResult } = await load(undefined, "phase-production-build");
    const out = degradeReadResult(FAILED_LIST, "list");
    expect(out.error).toBeTruthy();
    expect(out.data).toBeNull();
  });

  it("keeps its error in production even with the flag set", async () => {
    const { degradeReadResult } = await load("1", "phase-production-server");
    const out = degradeReadResult(FAILED_LIST, "list");
    expect(out.error).toBeTruthy();
    expect(out.data).toBeNull();
  });

  it("becomes an empty list in the CI build", async () => {
    const { degradeReadResult } = await load("1", "phase-production-build");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = degradeReadResult(FAILED_LIST, "list");
    expect(out.error).toBeNull();
    expect(out.data).toEqual([]);
  });

  it("becomes 'no such row' (null) for a single-row read in the CI build", async () => {
    const { degradeReadResult } = await load("1", "phase-production-build");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = degradeReadResult(FAILED_LIST, "single");
    expect(out.error).toBeNull();
    expect(out.data).toBeNull();
  });

  it("becomes an empty object for an RPC read in the CI build", async () => {
    const { degradeReadResult } = await load("1", "phase-production-build");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = degradeReadResult(FAILED_LIST, "rpc");
    expect(out.error).toBeNull();
    expect(out.data).toEqual({});
  });

  it("never touches a read that SUCCEEDED", async () => {
    const { degradeReadResult } = await load("1", "phase-production-build");
    const ok = { success: true as const, error: null, data: [{ slug: "ssc" }], count: 1, status: 200, statusText: "OK" };
    const out = degradeReadResult(ok, "list");
    expect(out).toEqual(ok);
  });
});

/** A PostgREST-shaped builder that resolves with a fixed answer. */
function fakeBuilder(result: unknown) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.order = () => builder;
  builder.limit = () => builder;
  builder.single = () => builder;
  builder.maybeSingle = () => builder;
  builder.then = (onFulfilled?: (v: unknown) => unknown, onRejected?: (r: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
}

describe("E2a — the client wrapper", () => {
  it("passes a failed read through untouched when the switch is off", async () => {
    const { degradeClient } = await load(undefined, "phase-production-build");
    const client = { from: () => fakeBuilder(FAILED_LIST) };
    const out = await (degradeClient(client as never) as any).from("exams").select("*");
    expect(out.error).toBeTruthy();
  });

  it("degrades a failed read inside the CI build", async () => {
    const { degradeClient } = await load("1", "phase-production-build");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = { from: () => fakeBuilder(FAILED_LIST) };
    const out = await (degradeClient(client as never) as any).from("exams").select("*");
    expect(out.error).toBeNull();
    expect(out.data).toEqual([]);
  });

  it("keeps a successful read exactly as it was", async () => {
    const { degradeClient } = await load("1", "phase-production-build");
    const ok = { success: true, error: null, data: [{ slug: "ssc" }], count: 1, status: 200, statusText: "OK" };
    const client = { from: () => fakeBuilder(ok) };
    const out = await (degradeClient(client as never) as any).from("exams").select("*");
    expect(out).toEqual(ok);
  });
});
