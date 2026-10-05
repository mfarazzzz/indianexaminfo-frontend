/**
 * FX3 B2 — browser-level proof that the contact form and the report-error
 * control actually reach the message service.
 *
 * This runs against the REAL production build served by `next start`, with
 * NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY baked in at build time. It asserts the
 * browser sends the submit-message request to <SUPABASE_URL>/functions/v1/
 * submit-message with the apikey header — which only happens if the NEXT_PUBLIC_*
 * values were inlined into the CLIENT bundle (the B1 bug made them empty in the
 * browser, so this request never fired and readers saw "cannot reach the message
 * service"). A mocked {ok:true, ref} must then show the reference to the reader.
 */
import { test, expect } from "@playwright/test";
import { TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY } from "../playwright.config";

const SUBMIT_ENDPOINT = `${TEST_SUPABASE_URL}/functions/v1/submit-message`;

test("contact form sends submit-message to the configured Supabase URL with the apikey header", async ({ page }) => {
  let capturedUrl = "";
  let capturedApiKey: string | null = null;

  await page.route("**/functions/v1/submit-message", async (route) => {
    capturedUrl = route.request().url();
    capturedApiKey = route.request().headers().apikey ?? null;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, ref: "IEI-E2E01" }) });
  });

  await page.goto("/contact", { waitUntil: "domcontentloaded" });

  await page.fill("#cf-msg", "This is an e2e test message for the contact form.");
  await page.fill("#cf-email", "reader@example.com");
  await page.check('input[type="checkbox"]');

  await page.getByRole("button", { name: /भेजें · Send message/ }).click();

  // The reference from the mocked reply is shown to the reader.
  await expect(page.getByText("IEI-E2E01")).toBeVisible({ timeout: 15_000 });
  // The request went to the REAL configured URL (proves NEXT_PUBLIC inlining) …
  expect(capturedUrl).toBe(SUBMIT_ENDPOINT);
  // … with the anon key as the apikey header.
  expect(capturedApiKey).toBe(TEST_SUPABASE_ANON_KEY);
});

test("report-error control sends submit-message to the same endpoint", async ({ page }) => {
  let capturedUrl = "";
  let capturedApiKey: string | null = null;

  await page.route("**/functions/v1/submit-message", async (route) => {
    capturedUrl = route.request().url();
    capturedApiKey = route.request().headers().apikey ?? null;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, ref: "IEI-E2E02" }) });
  });

  await page.goto("/ie2e/report-error", { waitUntil: "domcontentloaded" });

  // Open the sheet, pick a one-tap reason, submit (contact optional here).
  await page.getByRole("button", { name: /Report an error on this page/ }).click();
  await page.getByRole("radio", { name: /A link is broken/ }).click();
  await page.getByRole("button", { name: /भेजें · Send report/ }).click();

  await expect(page.getByText("IEI-E2E02")).toBeVisible({ timeout: 15_000 });
  expect(capturedUrl).toBe(SUBMIT_ENDPOINT);
  expect(capturedApiKey).toBe(TEST_SUPABASE_ANON_KEY);
});
