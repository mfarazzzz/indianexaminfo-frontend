/**
 * bulletinFixture.test.tsx - B4 home card + pool, rendered from the REAL
 * component with fixtures (no Supabase). Proves: empty pool renders NOTHING
 * (no empty card); populated pool = 3 pinned first (cap 3) + newest fill to
 * 6; withdrawn/expired excluded; Verified mark only on a verified update.
 * With PARITY_HTML=1 it writes out-bulletin.html / out-bulletin-empty.html
 * for the Playwright screenshots (360/1366).
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LatestUpdatesSection } from "@/components/homepage/LatestUpdatesSection";
import { homeBulletinPool } from "@/lib/exam/updateFeed";
import type { ContentPost } from "@/types/exam";

const OUT = dirname(fileURLToPath(import.meta.url));
const NOW = "2026-10-22T00:00:00Z";

function post(over: Partial<ContentPost>): ContentPost {
  return {
    id: "x", slug: "s", title: "t", excerpt: "", content: "", examEntityId: "e1",
    examEntityName: "UPSSSC PET", pillar: "government-exam", contentType: "admit-card",
    quickLinks: [], contentTypeData: {}, attachmentUrls: [], publishedAt: "2026-10-20",
    updatedAt: "2026-10-20", status: "published", tags: [], isFeatured: false,
    seoTitle: "", seoDescription: "",
    examSlug: "upsssc-pet", examPillar: "government-exam", examCategorySlug: "state-government-jobs",
    ...over,
  } as ContentPost;
}

const RAW: ContentPost[] = [
  post({ id: "p1", title: "PET admit card released", isPinned: true, displayOrder: 0, kind: "final", verifiedBy: "u1", updatedAt: "2026-10-18" }),
  post({ id: "p2", title: "Revised exam window", isPinned: true, displayOrder: 1, kind: "revised", updatedAt: "2026-10-17" }),
  post({ id: "p3", title: "Corrigendum on eligibility", isPinned: true, displayOrder: 2, kind: "corrigendum", updatedAt: "2026-10-16" }),
  post({ id: "p4", title: "Fourth pin must lose the cap", isPinned: true, displayOrder: 3, kind: "provisional", updatedAt: "2026-10-15" }),
  post({ id: "n1", title: "Exam city intimation out", updatedAt: "2026-10-21" }),
  post({ id: "n2", title: "Application window opens", updatedAt: "2026-10-19" }),
  post({ id: "gone", title: "Withdrawn notice", kind: "withdrawn", updatedAt: "2026-10-22" }),
  post({ id: "exp", title: "Expired notice", expiresAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-22" }),
];
const POOLED = homeBulletinPool(RAW, NOW);

describe("B4 home bulletin - pool + component", () => {
  it("pool: 3 pinned first then newest fill, max 6; withdrawn/expired excluded", () => {
    expect(POOLED.map((p) => p.id)).toEqual(["p1", "p2", "p3", "n1", "n2", "p4"]);
  });
  it("empty pool renders NOTHING (no empty card, no shell)", () => {
    expect(renderToStaticMarkup(<LatestUpdatesSection posts={[]} />)).toBe("");
  });
  it("populated renders the bilingual heading, pinned order and Verified only once", () => {
    const html = renderToStaticMarkup(<LatestUpdatesSection posts={POOLED} />);
    expect(html).toContain("Latest Updates /");
    expect(html).toContain("PET admit card released");
    expect(html.indexOf("PET admit card released")).toBeLessThan(html.indexOf("Exam city intimation out"));
    expect(html).not.toContain("Withdrawn notice");
    expect(html).not.toContain("Expired notice");
    expect((html.match(/Verified/g) || []).length).toBe(1);
    expect(html).toContain("upsssc-pet");
  });
});

if (process.env.PARITY_HTML === "1") {
  it("writes standalone HTML fixtures (PARITY_HTML=1)", () => {
    const css = existsSync(resolve(OUT, "tw.css")) ? readFileSync(resolve(OUT, "tw.css"), "utf8") : "";
    const doc = (body: string) => '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css + '</style></head><body><div class="exam-page container mx-auto px-4 py-4">' + body + '</div></body></html>';
    writeFileSync(resolve(OUT, "out-bulletin.html"), doc(renderToStaticMarkup(<LatestUpdatesSection posts={POOLED} />)));
    writeFileSync(resolve(OUT, "out-bulletin-empty.html"), doc(renderToStaticMarkup(<LatestUpdatesSection posts={[]} />)));
    expect(existsSync(resolve(OUT, "out-bulletin.html"))).toBe(true);
  });
}
