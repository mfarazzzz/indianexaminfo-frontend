/**
 * 4b — the Updates timeline partition. Pure, no Supabase, no render: it proves
 * the reader shows a chip ONLY for data the update really carries, and that
 * withdrawn / superseded updates leave the live timeline for "History / Withdrawn"
 * while the superseding update stays live. A sparse exam (no updates) yields no
 * section.
 */
import { describe, it, expect } from "vitest";
import { partitionUpdates, isVerifiedUpdate } from "./updates";
import type { ContentPost } from "@/types/exam";

const post = (over: Partial<ContentPost>): ContentPost => ({
  id: "p1", slug: "s", title: "t", excerpt: "", content: "", examEntityId: "", examEntityName: "",
  pillar: "government-exam", contentType: "admit-card", quickLinks: [], contentTypeData: {},
  attachmentUrls: [], publishedAt: "2026-10-17", updatedAt: "2026-10-17", status: "published",
  tags: [], isFeatured: false, seoTitle: "", seoDescription: "", ...over,
} as ContentPost);

describe("partitionUpdates — the 4b Updates timeline", () => {
  it("no updates → nothing (no empty shell)", () => {
    const { active, history } = partitionUpdates([]);
    expect(active).toHaveLength(0);
    expect(history).toHaveLength(0);
  });

  it("a plain published update is active with no kind and not verified", () => {
    const { active, history } = partitionUpdates([post({ id: "a" })]);
    expect(history).toHaveLength(0);
    expect(active).toHaveLength(1);
    expect(active[0].kind).toBeNull();
    expect(active[0].verified).toBe(false);
    expect(active[0].withdrawn).toBe(false);
    expect(active[0].superseded).toBe(false);
  });

  it("Verified is true ONLY when verifiedBy is set", () => {
    expect(isVerifiedUpdate(post({ verifiedBy: "user-1" }))).toBe(true);
    expect(isVerifiedUpdate(post({ verifiedBy: null }))).toBe(false);
    expect(isVerifiedUpdate(post({ verifiedBy: "   " }))).toBe(false);
    const { active } = partitionUpdates([post({ id: "v", verifiedBy: "user-1" })]);
    expect(active[0].verified).toBe(true);
  });

  it("a provisional / revised update stays active and carries its kind", () => {
    const { active, history } = partitionUpdates([
      post({ id: "a", kind: "provisional" }),
      post({ id: "b", kind: "revised" }),
    ]);
    expect(history).toHaveLength(0);
    expect(active.map((v) => v.kind)).toEqual(["provisional", "revised"]);
  });

  it("a withdrawn update moves to History / Withdrawn, never the live list", () => {
    const { active, history } = partitionUpdates([
      post({ id: "live", kind: "final" }),
      post({ id: "gone", kind: "withdrawn" }),
    ]);
    expect(active.map((v) => v.post.id)).toEqual(["live"]);
    expect(history.map((v) => v.post.id)).toEqual(["gone"]);
    expect(history[0].withdrawn).toBe(true);
  });

  it("a superseded update drops to History; the superseding update stays live", () => {
    const { active, history } = partitionUpdates([
      post({ id: "old", title: "Exam 25 Oct", kind: "provisional" }),
      post({ id: "new", title: "Revised Exam 30 Oct", kind: "revised", supersedesId: "old" }),
    ]);
    expect(active.map((v) => v.post.id)).toEqual(["new"]);
    expect(history.map((v) => v.post.id)).toEqual(["old"]);
    expect(history[0].superseded).toBe(true);
    // the newer row that supersedes is NOT itself marked superseded
    expect(active[0].superseded).toBe(false);
  });

  it("order is preserved (query is newest-first) — no re-sorting invents a date", () => {
    const { active } = partitionUpdates([
      post({ id: "first", publishedAt: "2026-10-30" }),
      post({ id: "second", publishedAt: "2026-10-17" }),
    ]);
    expect(active.map((v) => v.post.id)).toEqual(["first", "second"]);
  });
});
