import { defineConfig, devices } from "@playwright/test";

/**
 * Phase G — analytics consent against a build made WITH the two variables in the process
 * environment only. It does not build or serve: the operator does that deliberately, so the
 * GA id never reaches a file in the repo.
 *
 *   $env:NEXT_PUBLIC_GA_ID='<id>'; $env:NEXT_PUBLIC_CONSENT_BANNER='true'
 *   npx next build ; npx next start -p 3002
 *   npx playwright test --config=playwright.ga.config.ts
 *   Remove the two variables again afterwards — the committed build must not carry them.
 */
const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3002";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /analytics-consent\.e2e\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 180_000,
  use: { baseURL: BASE, trace: "off" },
  projects: [
    // channel "chrome" = the system Google Chrome (the bundled chromium revision in this
    // machine's ms-playwright cache is older than the pinned @playwright/test build, and
    // this suite must not download anything).
    { name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
});
