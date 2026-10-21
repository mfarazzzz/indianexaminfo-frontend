/**
 * examUpdateMeta.test.ts — 4a (2g): title/meta from the latest PUBLISHED update.
 * Never from a draft; null when there is no usable update; escaped + length-capped.
 */
import { describe, it, expect } from "vitest";
import { examUpdateSeo } from "./examUpdateMeta";
import type { ContentPost } from "@/types/exam";

const post = (over: Partial<ContentPost>): ContentPost => ({
  id: "p1", slug: "s", title: "t", excerpt: "", content: "", examEntityId: "", examEntityName: "",
  pillar: "government-exam", contentType: "admit-card", quickLinks: [], contentTypeData: {},
  attachmentUrls: [], publishedAt: "2026-10-17", updatedAt: "2026-10-17", status: "published",
  tags: [], isFeatured: false, seoTitle: "", seoDescription: "", ...over,
} as ContentPost);

const exam = { name: "UPSSSC PET", currentEditionYear: 2026 };

describe("examUpdateSeo", () => {
  it("derives an admit-card title from the latest published update, with its exam date", () => {
    const seo = examUpdateSeo(exam, [post({ contentType: "admit-card", importantDates: [{ label: "PET exam", date: "2026-10-25", isUrgent: false }] })]);
    expect(seo?.title).toBe("UPSSSC PET 2026 Admit Card Out - Exam 25 Oct 2026");
  });

  it("ignores drafts entirely (returns null when only a draft exists)", () => {
    expect(examUpdateSeo(exam, [post({ status: "draft" })])).toBeNull();
  });

  it("returns null with no updates", () => {
    expect(examUpdateSeo(exam, [])).toBeNull();
  });

  it("picks the NEWEST published update, not the first", () => {
    const seo = examUpdateSeo(exam, [
      post({ contentType: "admit-card", publishedAt: "2026-10-17" }),
      post({ contentType: "result", publishedAt: "2026-11-05" }),
    ]);
    expect(seo?.title).toContain("Result Out");
  });

  it("returns null for a content type with no reader-facing headline", () => {
    expect(examUpdateSeo(exam, [post({ contentType: "study-material" })])).toBeNull();
  });

  it("escapes angle brackets and caps the title length", () => {
    const long = "X".repeat(200);
    const seo = examUpdateSeo({ name: `<script>${long}</script>`, currentEditionYear: 2026 }, [post({ contentType: "result" })]);
    expect(seo!.title).not.toContain("<");
    expect(seo!.title).not.toContain(">");
    expect(seo!.title.length).toBeLessThanOrEqual(60);
  });
});
