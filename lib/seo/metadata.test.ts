import { describe, it, expect } from "vitest";
import { buildExamMetadata } from "./metadata";

const robotsOf = (m: ReturnType<typeof buildExamMetadata>) =>
  m.robots as unknown as { index?: boolean; follow?: boolean };

describe("buildExamMetadata — reference TEST pages are noindex/nofollow", () => {
  it("forces noindex when the explicit slug is a test slug", () => {
    const r = robotsOf(
      buildExamMetadata({ pageType: "content-type", canonicalUrl: "https://site/admission/cat/zz-test-entrance-exam", slug: "zz-test-entrance-exam" }),
    );
    expect(r.index).toBe(false);
    expect(r.follow).toBe(false);
  });

  it("forces noindex from the canonical URL alone (no per-route wiring)", () => {
    const r = robotsOf(
      buildExamMetadata({ pageType: "content-type", canonicalUrl: "https://site/sarkari-naukri/zz-test-government-exam" }),
    );
    expect(r.index).toBe(false);
  });

  it("a real page's canonical (no /zz-test- segment) stays indexable", () => {
    const r = robotsOf(
      buildExamMetadata({ pageType: "content-type", canonicalUrl: "https://site/sarkari-naukri/upsssc-pet" }),
    );
    expect(r.index).toBe(true);
    expect(r.follow).toBe(true);
  });

  it("still honours an explicit noIndex for real pages", () => {
    const r = robotsOf(
      buildExamMetadata({ pageType: "content-type", canonicalUrl: "https://site/sarkari-naukri/upsssc-pet", noIndex: true }),
    );
    expect(r.index).toBe(false);
  });
});
