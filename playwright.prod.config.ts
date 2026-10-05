import { defineConfig, devices } from "@playwright/test";

/**
 * FX3 pre-push (a) — proves the E2E fixture route is a TRUE 404 in a normal
 * build. This config builds WITHOUT E2E=1 (exactly like production), so the
 * /ie2e/report-error page must call notFound() and serve a 404.
 *
 * Run: `npm run e2e:prod` (separate build, no E2E). Requires chromium.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /fixture-404\.e2e\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3124",
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next build && npx next start -p 3124",
    url: "http://127.0.0.1:3124",
    timeout: 300_000,
    reuseExistingServer: false,
    stdout: "pipe",
    env: {
      NODE_ENV: "production",
      // Deliberately NO E2E — this is the production shape.
      NEXT_PUBLIC_SUPABASE_URL: "https://e2eproofproject.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key-abc123",
      BUILD_PRERENDER_LIMIT: "0",
    },
  },
});
