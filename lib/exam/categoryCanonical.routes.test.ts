import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Route-contract tests for the category-canonical rule (owner S1 item 3):
//   1. Every route that carries a category segment redirects a MISMATCHING segment to
//      the RECORD's canonical with permanentRedirect (308, one hop).
//   2. canonicalUrl / edition absoluteBasePath is built from `exam.category` /
//      `rec.category` — never from the URL segment (`${category}` / `${stateSlug}`).
//   3. The breadcrumb label comes from the record via categoryBreadcrumbLabel, and the
//      data layer actually carries categories.name (DETAIL_SELECT join + mapRow).
//
// These scan the route SOURCE because the routes are async Server Components that need
// the whole Next runtime; the pure decision logic itself is unit-tested in
// categoryCanonical.test.ts (wrong → mismatch true; right → false; none → false).

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Every route file that carries a category segment in its URL shape. */
const CATEGORY_SEGMENT_ROUTES = [
  "app/(public)/admission/[category]/[slug]/page.tsx",
  "app/(public)/admission/[category]/[slug]/[contentType]/page.tsx",
  "app/(public)/university-exam/[...segments]/page.tsx",
  "app/(public)/board-exam/state/[stateSlug]/[slug]/page.tsx",
  "app/(public)/board-exam/state/[stateSlug]/[slug]/[contentType]/page.tsx",
  "app/(public)/board-exam/[...segments]/page.tsx",
  "app/(public)/sarkari-naukri/[...segments]/page.tsx",
];

describe("category-canonical route contract (S1 item 3)", () => {
  it.each(CATEGORY_SEGMENT_ROUTES)(
    "%s issues a 308 to a RECORD-derived canonical path",
    (rel) => {
      const src = read(rel);
      expect(src).toMatch(/permanentRedirect\(\s*`\/[^`]*\$\{(?:exam|rec)\.category\}/);
    },
  );

  it.each(CATEGORY_SEGMENT_ROUTES)(
    "%s never echoes the URL segment into a canonical URL",
    (rel) => {
      const src = read(rel);
      // canonicalUrl: `…/${category}…` or `…/${stateSlug}…` is the banned shape.
      expect(src).not.toMatch(/canonicalUrl:\s*`[^`]*\$\{(?:category|stateSlug)\}/);
      // Edition dispatch base must also be record-derived.
      expect(src).not.toMatch(/absoluteBasePath:\s*`[^`]*\$\{(?:category|stateSlug)\}[^`]*`/);
    },
  );

  it.each(CATEGORY_SEGMENT_ROUTES)(
    "%s builds the category breadcrumb label from the record",
    (rel) => {
      const src = read(rel);
      expect(src).toContain("categoryBreadcrumbLabel(");
    },
  );
});

describe("data layer carries categories.name (S1 item 2)", () => {
  const svc = read("services/examService.ts");

  it("DETAIL_SELECT joins the category with its display name", () => {
    expect(svc).toMatch(/cat:categories!category_id\(slug,\s*name\)/);
  });

  it("mapRow surfaces categoryName on the ExamEntity", () => {
    expect(svc).toMatch(/categoryName:/);
  });
});
