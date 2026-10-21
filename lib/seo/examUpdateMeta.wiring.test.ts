/**
 * examUpdateMeta.wiring.test.ts — A1: every pillar's MAIN exam-page
 * generateMetadata derives its title/description from examUpdateSeo (the latest
 * PUBLISHED update), falling back to the evergreen title. Structural assertions
 * on the route sources (generateMetadata needs Supabase, so we pin the wiring).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");

const MAIN_ROUTES = [
  "app/(public)/sarkari-naukri/[...segments]/page.tsx",
  "app/(public)/admission/[category]/[slug]/page.tsx",
  "app/(public)/university-exam/[...segments]/page.tsx",
  "app/(public)/board-exam/state/[stateSlug]/[slug]/page.tsx",
  "app/(public)/board-exam/[...segments]/page.tsx",
];

describe("examUpdateSeo is wired into every main exam route", () => {
  for (const rel of MAIN_ROUTES) {
    it(`${rel} imports + calls examUpdateSeo and prefers seo?.title`, () => {
      const src = read(rel);
      expect(src, "must import examUpdateSeo").toMatch(/import\s*\{\s*examUpdateSeo\s*\}\s*from\s*"@\/lib\/seo\/examUpdateMeta"/);
      expect(src, "must call examUpdateSeo with the exam's published updates").toMatch(/examUpdateSeo\(\s*exam,\s*await getContentPostsByExam/);
      expect(src, "title must prefer the update-derived title").toContain("seo?.title ??");
      expect(src, "description must prefer the update-derived description").toContain("seo?.description ??");
    });
  }
});
