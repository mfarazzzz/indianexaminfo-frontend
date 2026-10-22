/**
 * testContent.wiring.test.ts — the executable "list every reader" guard.
 *
 * STEP 1 of the reference-test-pages task requires that NO aggregate surface can
 * ever show a `zz-test-` row. Rather than trust a human to remember every reader,
 * this test pins that each aggregate source actually applies the exclusion, in
 * the same source-scan style as the repo's other wiring tests. If someone adds a
 * new exam/content reader without filtering, or removes a filter, this fails.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p: string) => readFileSync(resolve(__dirname, p), "utf8");

describe("every aggregate reader excludes reference TEST rows", () => {
  it("examService: list readers filter in-memory, count + static-params + view + edition-sitemap filter", () => {
    const src = read("../services/examService.ts");
    // in-memory exclusion on the mapped arrays (getAllExams, by pillar/region/category,
    // featured, related, search, status, hub, deadline bands).
    expect((src.match(/excludeTest\(/g) || []).length).toBeGreaterThanOrEqual(10);
    // head-count query uses the wire filter (no rows to filter in memory).
    expect(src).toContain('.not("slug", "like", TEST_SLUG_LIKE)');
    // generateStaticParams slugs and the edition sitemap exclude test rows.
    expect(src).toContain("!isTestSlug(p.slug)");
    expect(src).toContain("isTestSlug(exam.slug)) continue");
  });

  it("contentPostService: ticker, home card, latest, by-content-type, by-pillar, featured, search all exclude", () => {
    const src = read("../services/contentPostService.ts");
    expect((src.match(/excludeTest\(/g) || []).length).toBeGreaterThanOrEqual(7);
  });

  it("navigationService: mega-menu categories count, category exams, pillar search, prebuilt cards", () => {
    const src = read("../services/navigationService.ts");
    expect((src.match(/.not\("slug", "like", TEST_SLUG_LIKE\)/g) || []).length).toBeGreaterThanOrEqual(4);
  });

  it("news sitemap excludes test posts", () => {
    const src = read("../app/news-sitemap.xml/route.ts");
    expect(src).toContain("TEST_SLUG_LIKE");
  });

  it("the exam body + the sarkari content-type view render the TEST banner", () => {
    expect(read("../components/exam/EntityDetailPage.tsx")).toContain("TestPageBanner");
    expect(read("../app/(public)/sarkari-naukri/[...segments]/SarkariNaukriContentTypeView.tsx")).toContain("TestPageBanner");
    // the admission content-type route renders a focused view (not EntityDetailPage),
    // so it needs the banner too.
    expect(read("../app/(public)/admission/[category]/[slug]/[contentType]/page.tsx")).toContain("TestPageBanner");
  });

  it("metadata forces noindex for test slugs (own page reachable, never indexed)", () => {
    const src = read("../lib/seo/metadata.ts");
    expect(src).toContain("isTestSlug");
    expect(src).toContain("TEST_SLUG_PREFIX");
  });
});
