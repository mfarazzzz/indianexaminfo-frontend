/**
 * ownContentByExam.test.ts — the cache-boundary contract behind the canonical rule.
 *
 * The first version of this returned a Map from inside `cached()`. `cached()` wraps
 * `unstable_cache`, which SERIALISES its result, so the Map arrived at the sitemap as a
 * plain object and `ctOwnContent.get(...)` threw during the production build:
 *
 *   Error occurred prerendering page "/sitemap.xml" — TypeError: g.get is not a function
 *
 * A type check cannot catch it (the declared type and the runtime value disagree only
 * after serialisation), so the contract is pinned here instead: whatever crosses the
 * cache boundary must survive a JSON round-trip and still answer to the access pattern
 * the consumer uses.
 */
import { describe, it, expect } from "vitest";
import { ownContentByExam, type OwnContentRow } from "@/services/contentPostService";

const row = (over: Partial<OwnContentRow> = {}): OwnContentRow => ({
  exam_id: "e1", content_type: "notification", content: "<p>notice body</p>", ...over,
});

describe("ownContentByExam", () => {
  it("records the (exam, content type) pairs whose notice carries its own content", () => {
    const out = ownContentByExam([row(), row({ content_type: "admit-card" }), row({ exam_id: "e2" })]);
    expect(out).toEqual({ e1: ["notification", "admit-card"], e2: ["notification"] });
  });

  it("a notice with only structured content-type data counts; an empty shell does not", () => {
    expect(ownContentByExam([row({ content: "", content_type_data: { totalPosts: 5 } })]).e1).toEqual(["notification"]);
    expect(ownContentByExam([row({ content: "   ", content_type_data: {} })])).toEqual({});
    expect(ownContentByExam([row({ content: "", content_type_data: null })])).toEqual({});
    expect(ownContentByExam([row({ content: "", content_type_data: [] })])).toEqual({}); // an array is not data
  });

  it("ignores rows with no exam or no content type (a generic /news post has no page here)", () => {
    expect(ownContentByExam([row({ exam_id: null }), row({ content_type: null }), row({ exam_id: "" })])).toEqual({});
  });

  it("never lists the same content type twice", () => {
    const out = ownContentByExam([row(), row(), row({ content: "another notice" })]);
    expect(out.e1).toEqual(["notification"]);
  });

  it("SURVIVES THE CACHE BOUNDARY: JSON round-trips unchanged and stays readable", () => {
    const out = ownContentByExam([row(), row({ content_type: "result", exam_id: "e9" })]);
    // this is what unstable_cache hands back to the caller
    const afterCache = JSON.parse(JSON.stringify(out)) as Record<string, string[]>;
    expect(afterCache).toEqual(out);
    // the sitemap's access pattern — bracket, then Set — must work on the revived value
    const own = afterCache["e9"];
    expect(Array.isArray(own)).toBe(true);
    expect(new Set(own).has("result")).toBe(true);
    // and it must NOT be a Map/Set, which is the shape that broke the build
    expect(out instanceof Map).toBe(false);
    expect(afterCache instanceof Map).toBe(false);
  });
});
