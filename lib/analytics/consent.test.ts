/**
 * consent.test.ts — Phase C gate + storage. The analytics loader is driven purely by
 * shouldLoadAnalytics(gaId, consent), so the three required cases are pinned here:
 *   • no script when the ID is empty (even if consented);
 *   • no script before a decision / after Decline;
 *   • script only after Accept WITH a real ID.
 * The localStorage store is exercised with a stub (the frontend test env is node).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { shouldLoadAnalytics, readConsent, writeConsent, hasConsentDecision } from "./consent";

describe("shouldLoadAnalytics", () => {
  it("no script when the ID is empty, even if consented", () => {
    expect(shouldLoadAnalytics("", "granted")).toBe(false);
    expect(shouldLoadAnalytics("   ", "granted")).toBe(false);
  });
  it("no script before a decision, or after Decline", () => {
    expect(shouldLoadAnalytics("G-ABC123", null)).toBe(false);
    expect(shouldLoadAnalytics("G-ABC123", "denied")).toBe(false);
  });
  it("script only after Accept with a real ID", () => {
    expect(shouldLoadAnalytics("G-ABC123", "granted")).toBe(true);
  });
});

describe("consent store (localStorage)", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("round-trips a decision and flips hasConsentDecision", () => {
    expect(readConsent()).toBeNull();
    expect(hasConsentDecision()).toBe(false);
    writeConsent("granted");
    expect(readConsent()).toBe("granted");
    expect(hasConsentDecision()).toBe(true);
    writeConsent("denied");
    expect(readConsent()).toBe("denied");
  });

  it("is safe when localStorage throws (private mode)", () => {
    vi.stubGlobal("localStorage", { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } });
    expect(() => readConsent()).not.toThrow();
    expect(readConsent()).toBeNull();
    expect(() => writeConsent("granted")).not.toThrow();
  });
});
