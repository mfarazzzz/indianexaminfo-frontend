/**
 * FX3 pre-push — the gate for E2E-only fixture routes.
 *
 * A fixture page (e.g. /ie2e/report-error) must NOT exist in production. It
 * renders only when E2E === "1", which is set solely in the Playwright
 * webServer env. Kept in its own module because Next's route type-checking
 * forbids exporting non-route symbols from a page file.
 */
export function e2eFixtureEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.E2E === "1";
}
