import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Phase G — analytics consent, checked against a LOCAL production build (owner batch 3).
 *
 * The build under test must be built AND served with the two variables set in the PROCESS
 * environment only (never in a repo env file, never committed):
 *   NEXT_PUBLIC_GA_ID=<the measurement id>   NEXT_PUBLIC_CONSENT_BANNER=true
 * The id is read here from the environment too, so it never lands in a file in this repo.
 *
 * What is proven, in order:
 *   1. the banner is visible at 360 and at 1366, and it is not asked to sit over the text;
 *   2. DECLINE  -> not one request leaves for googletagmanager / google-analytics, and the
 *      decision survives a navigation (the site stays fully usable);
 *   3. ACCEPT   -> gtag/js?id=<id> is fetched and a page_view collect hit follows;
 *   4. the stored decision is honoured on the NEXT page without re-asking.
 *
 * Run:  npx playwright test --config=playwright.ga.config.ts
 */

const BASE = process.env.E2E_BASE_URL || "http://127.0.0.1:3002";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const SHOTS = resolve(__dirname, "..", "qa", "screenshots", "ga");
const ANALYTICS_HOSTS = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/;
const STORAGE_KEY = "iei-analytics-consent";

if (!GA_ID) {
  // Without the id in the environment the ACCEPT assertions are meaningless, and a test
  // that silently skips them is worse than one that fails loudly.
  throw new Error("NEXT_PUBLIC_GA_ID must be set in the process environment to run this suite");
}

mkdirSync(SHOTS, { recursive: true });

/** Watch every outgoing request for the whole life of a page. */
function watchAnalytics(page: Page) {
  const hits: string[] = [];
  page.on("request", (r) => { if (ANALYTICS_HOSTS.test(r.url())) hits.push(r.url()); });
  return hits;
}

/**
 * A brand-new browser context already has empty localStorage, which is exactly the
 * "reader has not decided yet" state. Do NOT addInitScript(localStorage.clear()) here: it
 * re-runs on EVERY navigation, so it silently deletes the decision the test just made and
 * the banner legitimately comes back (that is what failed the first run of this suite).
 */
async function freshContext(browserContextFactory: () => Promise<any>, width: number, height: number) {
  const ctx = await browserContextFactory();
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height });
  return { ctx, page };
}

test("1 — the banner shows at 360 and at 1366, and does not sit over the article text", async ({ browser }) => {
  for (const [w, h] of [[360, 740], [1366, 900]] as const) {
    const { ctx, page } = await freshContext(() => browser.newContext(), w, h);
    await page.goto(`${BASE}/blog/exam-prep/clat-2026-preparation-strategy`, { waitUntil: "load" });
    const banner = page.getByRole("region", { name: /Cookie and analytics consent/i });
    await expect(banner, `banner at ${w}px`).toBeVisible();
    await banner.screenshot({ path: `${SHOTS}/banner-${w}.png` });

    // MEASURED, not assumed: how much of the viewport the banner occupies, and whether the
    // first line of the article is still inside the visible area above it.
    const box = await banner.boundingBox();
    const article = await page.locator("main h1, main .article-title").first().boundingBox();
    const overlap = box && article ? Math.max(0, article.y + article.height - box.y) : 0;
    console.log(`  ${w}x${h}: banner height=${box?.height.toFixed(0)}px at y=${box?.y.toFixed(0)} `
      + `(${((box?.height ?? 0) / h * 100).toFixed(0)}% of the viewport), heading overlap=${overlap.toFixed(0)}px`);
    expect(box, "banner is in the viewport").not.toBeNull();
    expect((box?.height ?? 0), "banner stays under 45% of the viewport").toBeLessThan(h * 0.45);
    await ctx.close();
  }
});

test("2 — Decline: nothing analytics-related is requested, before or after a navigation", async ({ browser }) => {
  const { ctx, page } = await freshContext(() => browser.newContext(), 360, 740);
  const hits = watchAnalytics(page);

  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.getByRole("button", { name: /^Decline/i }).click();
  await page.waitForTimeout(3_000);           // an afterInteractive script would have fired by now

  expect(hits, `Decline must load nothing; saw: ${hits.join(", ")}`).toEqual([]);
  expect(await page.evaluate((k: string) => localStorage.getItem(k), STORAGE_KEY)).toBe("denied");

  // The decision survives a navigation, the banner never comes back, and still nothing loads.
  await page.goto(`${BASE}/results`, { waitUntil: "load" });
  await page.waitForTimeout(2_000);
  expect(hits, "a denied decision must stay denied across pages").toEqual([]);
  await expect(page.getByRole("region", { name: /Cookie and analytics consent/i })).toHaveCount(0);
  await ctx.close();
});

test("3 — Accept: gtag/js for THIS id is fetched and a page_view hit follows", async ({ browser }) => {
  const { ctx, page } = await freshContext(() => browser.newContext(), 360, 740);
  const hits = watchAnalytics(page);

  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.getByRole("button", { name: /^Accept/i }).click();
  // GA4 batches the hit, so wait for the COLLECT request rather than for any request: the
  // gtag.js file itself arrives first and would satisfy a looser wait.
  await expect
    .poll(() => hits.filter((u) => /\/g\/collect/.test(u)).length,
      { message: `no /g/collect hit after Accept; saw ${hits.join(" , ") || "none"}`, timeout: 20_000, intervals: [500] })
    .toBeGreaterThan(0);

  expect(hits.some((u) => u.includes("/gtag/js") && u.includes(`id=${GA_ID}`)),
    `expected gtag/js?id=${GA_ID}; saw: ${hits.join(", ")}`).toBe(true);
  expect(hits.some((u) => /\/g\/collect/.test(u) && /(^|[&?])en=page_view(&|$|%26)/.test(decodeURIComponent(u)) || /%22page_view%22/.test(u)),
    `expected a page_view collect hit; saw: ${hits.join(", ")}`).toBe(true);
  expect(await page.evaluate((k: string) => localStorage.getItem(k), STORAGE_KEY)).toBe("granted");
  await ctx.close();
});

test("4 — consent persists: a second page does not re-ask and still sends a page_view", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const hits = watchAnalytics(page);

  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.getByRole("button", { name: /^Accept/i }).click();
  await page.waitForTimeout(4_000);

  await page.goto(`${BASE}/results`, { waitUntil: "load" });

  await expect(page.getByRole("region", { name: /Cookie and analytics consent/i })).toHaveCount(0);
  // GA4 batches its hits: the probe (qa/parity/ga-probe.mjs) shows gtag.js arriving ~330 ms
  // after the document and the /g/collect request following ~5 s later. So this is POLLED with
  // a generous budget rather than a fixed 4 s sleep — a single sample at 4 s cannot tell a
  // dropped event from a batched one, and measuring that wrongly is worse than not claiming it.
  await expect
    .poll(() => hits.filter((u) => /\/g\/collect/.test(u)).length, {
      message: `one page_view collect hit per document; hits seen: ${hits.length ? hits.join(" , ") : "none"}`,
      timeout: 20_000, intervals: [500],
    })
    .toBeGreaterThanOrEqual(2);
  await page.screenshot({ path: `${SHOTS}/after-accept-360.png`, fullPage: false });
  await ctx.close();
});
