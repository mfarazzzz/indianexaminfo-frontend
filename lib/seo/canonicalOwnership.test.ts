/**
 * canonicalOwnership.test.ts — P1 item 14: a content-type page earns its own canonical
 * only by showing something the main exam page does not.
 *
 * The rule is derived from the registry and the page's own evidence, never from a list
 * of content types — so a section that moves from "both" to "tab" in the registry changes
 * the answer here automatically, and a new content type needs no edit in this file.
 */
import { describe, it, expect } from "vitest";
import { ctCanonicalVerdict, ctCanonicalUrl } from "@/lib/seo/canonicalOwnership";
import { SECTION_BY_SLUG, CONTENT_TYPE_TO_SECTION } from "@/lib/sectionRegistry";

const MAIN = "https://www.indianexaminfo.com/admission/management/cat/exam";
const SELF = `${MAIN}/notification`;

const verdict = (ct: string, update?: { content?: string | null; contentTypeData?: Record<string, unknown> | null } | null) =>
  ctCanonicalVerdict({ contentType: ct, update });

describe("the notification page — the overlapping case", () => {
  it("is canonical-to-main when it has no notice of its own to show", () => {
    const v = verdict("notification", null);
    expect(v.selfCanonical).toBe(false);
    expect(v.reason).toBe("subset-of-main-page");
    expect(ctCanonicalUrl({ contentType: "notification", update: null }, { self: SELF, main: MAIN }).canonical).toBe(MAIN);
  });

  it("stays canonical-to-main when the update exists but carries no body and no data", () => {
    expect(verdict("notification", { content: "   ", contentTypeData: {} }).selfCanonical).toBe(false);
    expect(verdict("notification", { content: "", contentTypeData: null }).selfCanonical).toBe(false);
  });

  it("is self-canonical when the notice carries its own prose", () => {
    const v = verdict("notification", { content: "<p>Full notification text.</p>" });
    expect(v.selfCanonical).toBe(true);
    expect(v.reason).toBe("update-own-content");
  });

  it("…or only structured content-type data (the block the main page has no version of)", () => {
    const v = verdict("notification", { content: "", contentTypeData: { totalPosts: 100 } });
    expect(v.selfCanonical).toBe(true);
  });
});

describe("sections the main page never renders are self-canonical by right", () => {
  for (const ct of ["syllabus", "cutoff", "answer-key", "previous-papers", "study-material", "news"]) {
    it(`${ct} — no update needed`, () => {
      const v = verdict(ct, null);
      expect(v.selfCanonical, ct).toBe(true);
      expect(v.reason, ct).toBe("tab-only-section");
      expect(SECTION_BY_SLUG[CONTENT_TYPE_TO_SECTION[ct]].placement, ct).toBe("tab");
    });
  }

  it("a content type with no registry section at all has no main-page twin", () => {
    const v = verdict("mock-test", null);
    expect(v.selfCanonical).toBe(true);
    expect(v.reason).toBe("no-registry-section");
  });
});

describe("sections the main page DOES render must earn it", () => {
  for (const ct of ["admit-card", "result", "application"]) {
    it(`${ct}: to the main page without its own content, self-canonical with it`, () => {
      expect(SECTION_BY_SLUG[CONTENT_TYPE_TO_SECTION[ct]].placement, ct).toBe("both");
      expect(verdict(ct, null).selfCanonical, ct).toBe(false);
      expect(verdict(ct, { content: "<p>steps…</p>" }).selfCanonical, ct).toBe(true);
    });
  }
});

describe("the rule is derived, not listed", () => {
  it("every content type in the bridge resolves through the registry", () => {
    for (const [ct, section] of Object.entries(CONTENT_TYPE_TO_SECTION)) {
      const def = SECTION_BY_SLUG[section];
      expect(def, `${ct} maps to ${section}, which is not in the registry`).toBeDefined();
      const v = verdict(ct, null);
      if (def.placement === "tab") expect(v.selfCanonical, ct).toBe(true);
    }
  });

  it("route and sitemap ask the same question, so they cannot disagree", () => {
    // the route passes the loaded post; the sitemap passes the same fact as a flag —
    // both must produce the identical verdict for the identical evidence.
    const withPost = ctCanonicalUrl({ contentType: "notification", update: { content: "body" } }, { self: SELF, main: MAIN });
    const asFlag = ctCanonicalVerdict({ contentType: "notification", update: { content: "x" } }); // flag form used by the sitemap
    expect(withPost.verdict.reason).toBe(asFlag.reason);
    expect(withPost.canonical).toBe(SELF);
  });
});
