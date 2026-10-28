import { defineConfig, devices } from "@playwright/test";

/**
 * QA suite that runs against an ALREADY-STARTED production build (owner batch 3).
 *
 * Unlike playwright.config.ts / playwright.prod.config.ts, this config does not build:
 * the specs assert properties of the REAL production data shape (every sitemap URL must
 * resolve), which needs the real Supabase env from .env.local baked into a normal
 * `npm run build`. Start the build first, then run:
 *
 *   npm run build ; npm start        # serves http://localhost:3002
 *   npx playwright test --config=playwright.qa.config.ts
 *
 * Override the target with E2E_BASE_URL (e.g. http://127.0.0.1:3002).
 */
const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3002";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /sitemap-no-404\.e2e\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 600_000,
  use: {
    baseURL: BASE,
    trace: "off",
    // The crawl is request-level; no page rendering needed.
  },
  projects: [
    // channel "chrome" = the system Google Chrome. The pinned @playwright/test build in
    // node_modules expects a newer bundled chromium than the one cached locally, and this
    // suite must not download anything. Same binary the Lighthouse harness drives.
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
});
