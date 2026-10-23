/**
 * latestUpdates.test.tsx — P1 item 8: the compact block under the key-dates strip.
 *
 * Renders the REAL component from the REAL partition (partitionUpdates over the
 * exam's content_posts), so the eligibility of an item here is the same as in the
 * full timeline: published, unexpired, not withdrawn, not superseded. Pins the two
 * things a reader would notice: three rows maximum, and NOTHING when there are no
 * live updates (never an empty "Latest updates" heading above a blank card).
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { LatestUpdates } from "@/components/exam/LatestUpdates";
import { partitionUpdates } from "@/lib/exam/updates";
import { sectionHeading } from "@/lib/exam/sectionHeadings";
import type { ContentPost } from "@/types/exam";

function post(over: Partial<ContentPost> = {}): ContentPost {
  return {
    id: "p1", slug: "u1", title: "Admit card released", contentType: "admit-card",
    kind: "final", status: "published", publishedAt: "2026-10-17T09:00:00Z", updatedAt: "2026-10-17T09:00:00Z",
    excerpt: "", content: "", ...over,
  } as unknown as ContentPost;
}

const render = (posts: ContentPost[]) =>
  renderToStaticMarkup(createElement(LatestUpdates, { active: partitionUpdates(posts).active, allHref: "#updates" }));

describe("LatestUpdates", () => {
  const many = [
    post({ id: "a", title: "Update A", kind: "revised" }),
    post({ id: "b", title: "Update B" }),
    post({ id: "c", title: "Update C", kind: "corrigendum" }),
    post({ id: "d", title: "Update D" }),
    post({ id: "e", title: "Update E" }),
  ];

  it("shows at most three live updates, with a kind chip and a date", () => {
    const html = render(many);
    expect(html).toContain("data-testid=\"latest-updates\"");
    const rows = html.match(/<li /g) ?? [];
    expect(rows.length).toBe(3);
    expect(html).toContain("Update A");
    expect(html).toContain("Revised");
    expect(html).not.toContain("Update D"); // beyond the cap
    expect(html).toContain("#updates");    // the one "all updates" link
  });

  it("renders NOTHING when there is no live update (withdrawn/superseded stay in history)", () => {
    expect(render([])).toBe("");
    const onlyWithdrawn = [
      post({ id: "w", title: "Withdrawn notice", kind: "withdrawn" }),
    ];
    expect(render(onlyWithdrawn)).toBe("");
    const superseded = [
      post({ id: "s", title: "Old notice" }),
      post({ id: "t", title: "Revised notice", supersedesId: "s" }),
    ];
    const html = render(superseded);
    expect(html).toContain("Revised notice");
    expect(html).not.toContain("Old notice"); // superseded lives in History, not in "latest"
  });

  it("has its OWN heading, so it never repeats the timeline heading lower on the page", () => {
    const html = render(many);
    expect(html).toContain(sectionHeading("latest-updates"));
    expect(html).not.toContain(sectionHeading("updates")); // the full timeline owns that one
  });
});
