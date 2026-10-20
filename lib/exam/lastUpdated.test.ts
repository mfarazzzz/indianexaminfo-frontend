/**
 * lastUpdated.test.ts — the D2 "trustworthy Last Updated" rule.
 * Pins: a system/seed/bulk edition touch never counts; a human edition edit, a
 * published post, and a verify each do; newest wins; none → null (line omitted).
 */
import { describe, it, expect } from "vitest";
import { resolveLastUpdated, examUpdatedFrom } from "@/lib/exam/lastUpdated";

describe("resolveLastUpdated (D2)", () => {
  it("returns null when there is no trustworthy source (e.g. only the bulk/seed touch)", () => {
    expect(resolveLastUpdated({ editionUpdatedAt: "2026-07-30T11:12:22Z", editionUpdatedBy: "system" })).toBeNull();
    expect(resolveLastUpdated({ editionUpdatedAt: "2026-07-30T11:12:22Z", editionUpdatedBy: null })).toBeNull();
    expect(resolveLastUpdated({})).toBeNull();
  });

  it("counts a HUMAN edition edit", () => {
    expect(resolveLastUpdated({ editionUpdatedAt: "2026-10-01T09:00:00Z", editionUpdatedBy: "user-123" }))
      .toBe("2026-10-01T09:00:00Z");
  });

  it("ignores a blank/'System' (case-insensitive) editor but trusts a real id", () => {
    expect(resolveLastUpdated({ editionUpdatedAt: "2026-10-01", editionUpdatedBy: "  " })).toBeNull();
    expect(resolveLastUpdated({ editionUpdatedAt: "2026-10-01", editionUpdatedBy: " SYSTEM " })).toBeNull();
    expect(resolveLastUpdated({ editionUpdatedAt: "2026-10-01", editionUpdatedBy: "uuid-9" })).toBe("2026-10-01");
  });

  it("counts a published content_post", () => {
    expect(resolveLastUpdated({ postUpdatedAts: ["2026-10-05T00:00:00Z"] })).toBe("2026-10-05T00:00:00Z");
    expect(resolveLastUpdated({ postUpdatedAts: [null, undefined, ""] })).toBeNull();
  });

  it("counts a verification (verified_at)", () => {
    expect(resolveLastUpdated({ verifiedAt: "2026-09-28T00:00:00Z" })).toBe("2026-09-28T00:00:00Z");
  });

  it("takes the NEWEST across all trustworthy sources", () => {
    expect(resolveLastUpdated({
      editionUpdatedAt: "2026-10-01T00:00:00Z", editionUpdatedBy: "u",
      postUpdatedAts: ["2026-10-06T00:00:00Z", "2026-10-03T00:00:00Z"],
      verifiedAt: "2026-10-05T00:00:00Z",
    })).toBe("2026-10-06T00:00:00Z");
  });

  it("a newer human edit beats an older post, and system+post → the post", () => {
    expect(resolveLastUpdated({
      editionUpdatedAt: "2026-10-08T00:00:00Z", editionUpdatedBy: "u",
      postUpdatedAts: ["2026-10-02T00:00:00Z"],
    })).toBe("2026-10-08T00:00:00Z");
    // the PET-like case: system edition touch (ignored) + one published post
    expect(resolveLastUpdated({
      editionUpdatedAt: "2026-07-30T11:12:22Z", editionUpdatedBy: "system",
      postUpdatedAts: ["2026-10-17T00:00:00Z"],
    })).toBe("2026-10-17T00:00:00Z");
  });
});

describe("examUpdatedFrom (entity-level, for JSON-LD)", () => {
  it("null when the only stamp is a system/bulk edition touch", () => {
    expect(examUpdatedFrom({ editionUpdatedAt: "2026-09-25", editionUpdatedBy: "system" })).toBeNull();
    expect(examUpdatedFrom({})).toBeNull();
  });
  it("the human edition edit", () => {
    expect(examUpdatedFrom({ editionUpdatedAt: "2026-10-08", editionUpdatedBy: "user-1" })).toBe("2026-10-08");
  });
  it("a verification counts", () => {
    expect(examUpdatedFrom({ verifiedAt: "2026-10-09" })).toBe("2026-10-09");
  });
});
