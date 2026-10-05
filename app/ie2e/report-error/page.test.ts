/**
 * FX3 pre-push — the E2E fixture gate.
 *
 * Proves the /ie2e/report-error route renders only when E2E === "1" and calls
 * notFound() otherwise — which is exactly what makes a normal `next build`
 * serve a 404. (The literal build-404 check is e2e/fixture-404.e2e.spec.ts.)
 */
import { describe, it, expect, vi } from "vitest";
import { e2eFixtureEnabled } from "@/lib/e2eFixture";

// notFound() must throw the Next sentinel so the caller stops rendering.
vi.mock("next/navigation", () => ({
  notFound: () => {
    const err = new Error("NEXT_NOT_FOUND");
    (err as { digest?: string }).digest = "NEXT_NOT_FOUND";
    throw err;
  },
}));

describe("e2eFixtureEnabled gate", () => {
  it("is true only when E2E === '1'", () => {
    expect(e2eFixtureEnabled({ E2E: "1" })).toBe(true);
    expect(e2eFixtureEnabled({ E2E: "0" })).toBe(false);
    expect(e2eFixtureEnabled({})).toBe(false);
    expect(e2eFixtureEnabled(undefined as unknown as Record<string, string>)).toBe(false);
  });
});

describe("E2EReportErrorFixture route behaviour", () => {
  it("calls notFound() (→ 404) when E2E is not '1', before any render", async () => {
    const prev = process.env.E2E;
    delete process.env.E2E;
    try {
      const mod = await import("@/app/ie2e/report-error/page");
      // The gate throws before the JSX is evaluated, so no React runtime needed.
      expect(() => mod.default()).toThrow(/NEXT_NOT_FOUND/);
    } finally {
      if (prev !== undefined) process.env.E2E = prev; else delete process.env.E2E;
    }
  });
});
