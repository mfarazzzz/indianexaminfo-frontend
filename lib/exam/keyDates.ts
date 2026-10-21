/**
 * keyDates.ts — 4a (2d) mobile-first strip logic. Pure + testable.
 *
 *  • pickKeyDates: the next 2-3 dates a reader actually cares about — upcoming
 *    confirmed dates soonest-first, then the most recent past ones so the strip
 *    is never empty when the record has dates. A row with no date is skipped
 *    (never a blank/"TBA" filler).
 *  • pickAttestedAction: a primary Download/Apply button ONLY when an ATTESTED
 *    URL exists (a real link stored on one of the exam's published updates whose
 *    label matches the current action). No attested URL → no button at all — we
 *    never render a greyed-out "URL pending" placeholder.
 */

export interface KeyDate { label: string; date?: string | null; isUrgent?: boolean; state?: string }
export interface AttestedLink { label: string; url: string }

const isFuture = (date: string, todayISO: string): boolean => date >= todayISO;

/** Upcoming first (soonest), then most-recent-past; skip undated rows. */
export function pickKeyDates(dates: KeyDate[], todayISO: string, limit = 3): KeyDate[] {
  const dated = (dates ?? []).filter((d) => d.date && String(d.date).trim());
  const upcoming = dated.filter((d) => isFuture(String(d.date), todayISO)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const past = dated.filter((d) => !isFuture(String(d.date), todayISO)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return [...upcoming, ...past].slice(0, limit);
}

/** The action word implied by the derived status (or null for a status with no
 *  primary action). */
function actionForStatus(status: string): { re: RegExp; label: string } | null {
  if (status === "admit-card-out") return { re: /admit\s*card|hall\s*ticket|call\s*letter/i, label: "Download Admit Card" };
  if (status === "registration-open") return { re: /apply|application|register/i, label: "Apply Online" };
  if (status === "result-declared" || status === "result-awaited") return { re: /result|score\s*card/i, label: "Check Result" };
  if (status === "active") return { re: /apply|application|register/i, label: "Apply Online" };
  return null;
}

/**
 * Return a primary action ONLY when an attested URL for it exists among the
 * exam's published updates. `links` are the update quick-links/attachments
 * (label + real url). Never invents a URL; returns null → render no button.
 */
export function pickAttestedAction(status: string, links: AttestedLink[]): { label: string; href: string } | null {
  const want = actionForStatus(status);
  if (!want) return null;
  const hit = (links ?? []).find((l) => l && l.url && want.re.test(l.label));
  if (!hit) return null;
  return { label: want.label, href: hit.url };
}
