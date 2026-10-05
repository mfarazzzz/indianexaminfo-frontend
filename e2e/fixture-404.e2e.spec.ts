/**
 * FX3 pre-push (a) — a NORMAL build (no E2E=1) serves a true 404 at the
 * fixture route. Run via `npm run e2e:prod` (playwright.prod.config.ts).
 */
import { test, expect } from "@playwright/test";

test("/ie2e/report-error is a 404 when E2E is not set (production shape)", async ({ request }) => {
  const res = await request.get("/ie2e/report-error");
  expect(res.status()).toBe(404);
});
