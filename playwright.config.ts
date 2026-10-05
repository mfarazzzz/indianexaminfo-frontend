import { defineConfig, devices } from "@playwright/test";

/**
 * FX3 B2 — browser-level proof for the contact form.
 *
 * The B1 bug (dynamic process.env read) only manifested in the BROWSER: the
 * client bundle had an empty SUPABASE_URL, so submitMessage bailed with
 * "The site cannot reach the message service…". curl/Node unit tests could not
 * see it. This e2e runs the REAL built client bundle against `next start`,
 * fills the form, and asserts the submit-message request actually goes to the
 * configured Supabase URL with the apikey header — which only happens if the
 * NEXT_PUBLIC_* values were inlined into the client bundle.
 *
 * Run: `npm run e2e` (builds, starts, runs the specs). Requires the Playwright
 * browsers (`npx playwright install chromium`).
 */
const TEST_SUPABASE_URL = "https://e2eproofproject.supabase.co";
const TEST_SUPABASE_ANON_KEY = "e2e-anon-key-abc123";

export default defineConfig({
  testDir: "./e2e",
  // This config builds WITH E2E=1 (fixture enabled) and runs the submit specs.
  // The 404-in-a-normal-build check lives in playwright.prod.config.ts.
  testMatch: /contact\.e2e\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3123",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Build with the test NEXT_PUBLIC_* values baked in, then serve the prod build.
  webServer: {
    command: "npx next build && npx next start -p 3123",
    url: "http://127.0.0.1:3123",
    timeout: 300_000,
    reuseExistingServer: false,
    stdout: "pipe",
    env: {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: TEST_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: TEST_SUPABASE_ANON_KEY,
      // E2E=1 is the ONLY thing that makes the /ie2e/report-error fixture route
      // exist. A normal build (no E2E) 404s it — see playwright.prod.config.ts.
      E2E: "1",
      // The URL above is a fake host, so the build must NOT prerender data pages
      // (they would try to fetch Supabase and fail). 0 = prerender none; the two
      // pages this suite needs (/contact static, /ie2e/report-error fixture) do
      // not depend on Supabase at build time.
      BUILD_PRERENDER_LIMIT: "0",
    },
  },
});

export { TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY };
