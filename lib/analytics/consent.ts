/**
 * consent.ts — the ONE consent decision behind analytics (owner batch 2, Phase C).
 *
 * Nothing loads analytics unless BOTH a real GA_ID is configured AND the reader has
 * granted consent. The decision is stored in localStorage (wrapped in try/catch so a
 * blocked/private-mode storage can never throw at render). No cookie, no server state.
 *
 * `shouldLoadAnalytics` is pure so the gate is testable without a DOM:
 *   empty ID            -> false (never load, even if consented)
 *   placeholder ID      -> false ("G-XXXXXXXXXX" is the doc example; a host that still
 *                          carries it must NOT start shipping GA traffic to a property
 *                          that does not exist — owner batch 7, A2)
 *   no decision         -> false (consent not yet given)
 *   denied              -> false (Decline keeps the site fully working, loads nothing)
 *   granted + real ID   -> true
 */
export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "iei-analytics-consent";

/** Placeholder-shaped measurement ids (the `G-XXXXXXXXXX` used in .env.example and
 *  DEPLOY.md). Case-insensitive, tolerant of surrounding spaces. */
const PLACEHOLDER_GA_ID = /^G-X+$/i;

/** True for an empty or placeholder measurement id — neither may load analytics. */
export function isUsableGaId(gaId: string): boolean {
  const v = (gaId ?? "").trim();
  return v !== "" && !PLACEHOLDER_GA_ID.test(v);
}

export function shouldLoadAnalytics(gaId: string, consent: ConsentChoice | null): boolean {
  return isUsableGaId(gaId) && consent === "granted";
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
