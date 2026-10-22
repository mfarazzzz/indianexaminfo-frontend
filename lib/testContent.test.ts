import { describe, it, expect } from "vitest";
import { isTestSlug, excludeTest, TEST_SLUG_PREFIX, TEST_SLUG_LIKE } from "./testContent";

describe("isTestSlug", () => {
  it("matches the zz-test- prefix only", () => {
    expect(isTestSlug("zz-test-entrance-exam")).toBe(true);
    expect(isTestSlug("upsssc-pet")).toBe(false);
    expect(isTestSlug("zz-test-")).toBe(true); // the prefix alone is a test row
  });
  it("is case-insensitive and trims, and null-safe", () => {
    expect(isTestSlug(" ZZ-TEST-x ")).toBe(true);
    expect(isTestSlug("")).toBe(false);
    expect(isTestSlug(null)).toBe(false);
    expect(isTestSlug(undefined)).toBe(false);
  });
  it("does NOT match a slug that merely contains the marker later", () => {
    expect(isTestSlug("real-exam-zz-test")).toBe(false);
  });
});

describe("constants", () => {
  it("LIKE pattern is the prefix plus a wildcard", () => {
    expect(TEST_SLUG_PREFIX).toBe("zz-test-");
    expect(TEST_SLUG_LIKE).toBe("zz-test-%");
  });
});

describe("excludeTest", () => {
  it("drops test rows, keeps the rest, preserves order", () => {
    const rows = [
      { slug: "a", id: 1 },
      { slug: "zz-test-b", id: 2 },
      { slug: "c", id: 3 },
    ];
    expect(excludeTest(rows).map((r) => r.slug)).toEqual(["a", "c"]);
  });
  it("tolerates a missing slug", () => {
    expect(excludeTest([{ slug: undefined }, { slug: "zz-test-x" }])).toHaveLength(1);
  });
});
