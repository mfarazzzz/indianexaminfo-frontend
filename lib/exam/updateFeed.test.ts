/**
 * updateFeed.test.ts - B2/B3/B4 reader-pool rules (pure, no network).
 * Pins: expired hidden everywhere; withdrawn excluded from pools (but kept by
 * the exam page History); pinned first capped at 3; ticker newest-first cap 8;
 * home fills to 6; unlinked (no exam join) rows never render.
 */
import { describe, it, expect } from "vitest";
import {
  isExpired, isLiveUpdate, orderUpdatesForReader, tickerPool, homeBulletinPool, isLinkable,
} from "./updateFeed";
import type { ContentPost } from "@/types/exam";

const NOW = "2026-10-22T00:00:00Z";

function post(over: Partial<ContentPost>): ContentPost {
  return {
    id: "x", slug: "s", title: "t", excerpt: "", content: "", examEntityId: "e1",
    examEntityName: "E", pillar: "government-exam", contentType: "admit-card",
    quickLinks: [], contentTypeData: {}, attachmentUrls: [], publishedAt: "2026-10-20",
    updatedAt: "2026-10-20", status: "published", tags: [], isFeatured: false,
    seoTitle: "", seoDescription: "",
    examSlug: "e-slug", examPillar: "government-exam", examCategorySlug: "cat",
    ...over,
  } as ContentPost;
}

describe("isExpired / isLiveUpdate", () => {
  it("hides expired and withdrawn; keeps null-expiry and null-kind", () => {
    expect(isExpired(post({ expiresAt: "2026-10-21T00:00:00Z" }), NOW)).toBe(true);
    expect(isExpired(post({ expiresAt: "2026-10-23T00:00:00Z" }), NOW)).toBe(false);
    expect(isExpired(post({ expiresAt: null }), NOW)).toBe(false);
    expect(isLiveUpdate(post({ kind: "withdrawn" }), NOW)).toBe(false);
    expect(isLiveUpdate(post({ kind: null }), NOW)).toBe(true);
    expect(isLiveUpdate(post({ status: "draft" }), NOW)).toBe(false);
  });
});

describe("orderUpdatesForReader", () => {
  it("pinned first (cap 3, by display_order), rest newest-first, total cap", () => {
    const posts = [
      post({ id: "p2", isPinned: true, displayOrder: 1 }),
      post({ id: "p1", isPinned: true, displayOrder: 0 }),
      post({ id: "p3", isPinned: true, displayOrder: 2 }),
      post({ id: "p4", isPinned: true, displayOrder: 3 }),
      post({ id: "n1", updatedAt: "2026-10-21" }),
      post({ id: "n2", updatedAt: "2026-10-19" }),
    ];
    const out = orderUpdatesForReader(posts, { totalCap: 5 }).map((p) => p.id);
    expect(out).toEqual(["p1", "p2", "p3", "n1", "p4"]); // p4 (10-20) beats n2 (10-19) in the newest fill
    const uncapped = orderUpdatesForReader(posts).map((p) => p.id);
    expect(uncapped).toEqual(["p1", "p2", "p3", "n1", "p4", "n2"]);
  });
});

describe("tickerPool / homeBulletinPool", () => {
  const posts = [
    post({ id: "a", updatedAt: "2026-10-21" }),
    post({ id: "w", kind: "withdrawn" }),
    post({ id: "e", expiresAt: "2026-10-01T00:00:00Z" }),
    post({ id: "u", examSlug: null }),
    post({ id: "g", examEntityId: "" }),
    post({ id: "b", title: "  " }),
  ];
  it("keeps only live, linkable, exam-linked, titled rows newest-first", () => {
    expect(tickerPool(posts, NOW).map((p) => p.id)).toEqual(["a"]);
    expect(homeBulletinPool(posts, NOW).map((p) => p.id)).toEqual(["a"]);
  });
  it("caps the ticker at 8", () => {
    const many = Array.from({ length: 12 }, (_, i) => post({ id: "m" + i, updatedAt: "2026-10-2" + ((i % 8) + 1) }));
    expect(tickerPool(many, NOW)).toHaveLength(8);
  });
  it("isLinkable requires the stored exam join - no invented URLs", () => {
    expect(isLinkable(post({ examSlug: null }))).toBe(false);
    expect(isLinkable(post({}))).toBe(true);
  });
});
