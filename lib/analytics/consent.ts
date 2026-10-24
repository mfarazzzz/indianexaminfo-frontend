/**
 * consent.ts — the ONE consent decision behind analytics (owner batch 2, Phase C).
 *
 * Nothing loads analytics unless BOTH a real GA_ID is configured AND the reader has
 * granted consent. The decision is stored in localStorage (wrapped in try/catch so a
 * blocked/private-mode storage can never throw at render). No cookie, no server state.
 *
 * `shouldLoadAnalytics` is pure so the gate is testable without a DOM:
 *   empty ID            -> false (never load, even if consented)
 *   no decision         -> false (consent not yet given)
 *   denied              -> false (Decline keeps the site fully working, loads nothing)
 *   granted + real ID   -> true
 */
export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "iei-analytics-consent";

export function shouldLoadAnalytics(gaId: string, consent: ConsentChoice | null): boolean {
  return !!gaId && gaId.trim() !== "" && consent === "granted";
}

/** Read the stored decision. Safe when localStorage is unavailable. */
export function readConsent(): ConsentChoice | null {
  try {
    const v = globalThis.localStorage?.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  try { globalThis.localStorage?.setItem(STORAGE_KEY, choice); } catch { /* storage blocked — ignore */ }
}

/** True once the reader has made any choice (so the banner stops showing). */
export function hasConsentDecision(): boolean {
  return readConsent() !== null;
}
