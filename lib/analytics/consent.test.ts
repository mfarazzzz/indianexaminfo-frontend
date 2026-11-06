/**
 * consent.test.ts — Phase C gate + storage. The analytics loader is driven purely by
 * shouldLoadAnalytics(gaId, consent), so the three required cases are pinned here:
 *   • no script when the ID is empty (even if consented);
 *   • no script before a decision / after Decline;
 *   • script only after Accept WITH a real ID.
 * The localStorage store is exercised with a stub (the frontend test env is node).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { shouldLoadAnalytics, readConsent, writeConsent, hasConsentDecision, isUsableGaId } from "./consent";

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
  // A2 (owner batch 7): the documented placeholder must never behave like a real ID.
  // A Hostinger/hPanel environment still carrying G-XXXXXXXXXX would otherwise start
  // sending reader traffic to a GA property that does not exist the moment the banner
  // is switched on.
  it.each(["G-XXXXXXXXXX", "g-xxxxxxxxxx", "G-XXXX", "  G-XXXXXXXXXX  ", "", "   "])(
    "placeholder/empty ID %o never loads analytics, even after Accept",
    (id) => {
      expect(shouldLoadAnalytics(id, "granted")).toBe(false);
      expect(isUsableGaId(id)).toBe(false);
    },
  );
  it.each(["G-ABC123", "G-9Z8Y7X6W5V", " G-ABC123 "])(
    "a real-shaped ID %o is usable", (id) => {
      expect(isUsableGaId(id)).toBe(true);
      expect(shouldLoadAnalytics(id, "granted")).toBe(true);
    },
  );
  it("does not refuse an ID merely because it contains X (only all-X placeholders)", () => {
    expect(isUsableGaId("G-AX123X")).toBe(true);   // real id that happens to contain X
    expect(isUsableGaId("GX-XXXXXX")).toBe(true);  // not G-<all X> shaped
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
