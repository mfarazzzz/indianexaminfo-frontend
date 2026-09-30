/**
 * contentHubs.test.ts — the ONE presence rule for content-type hubs (P3-3).
 *
 * Pins the contract every enforcement point shares: the hub page (noindex/404),
 * the homepage quick-access strip, every nav/menu/sidebar and the sitemap all
 * read hubHasContent(). "Has content" must mean exactly "the hub's own page
 * would render at least one row" — an exam carrying the section OR a published
 * content post — never a number from a different query. And a hub with no
 * backing store (date-sheet, mock-test) can never be present.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/services/examService", () => ({
  getExamsByContentType: vi.fn(async () => []),
}));
vi.mock("@/services/contentPostService", () => ({
  getLatestByContentType: vi.fn(async () => []),
}));

import { getExamsByContentType } from "@/services/examService";
import { getLatestByContentType } from "@/services/contentPostService";
import { CONTENT_HUBS, hubHasContent, filterHubLinks, hubFor, isHubHref } from "./contentHubs";

const examsMock = vi.mocked(getExamsByContentType);
const latestMock = vi.mocked(getLatestByContentType);

const fakeExams = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i) })) as never;
const fakePosts = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i) })) as never;

beforeEach(() => {
  examsMock.mockReset().mockResolvedValue([]);
  latestMock.mockReset().mockResolvedValue([]);
});

describe("CONTENT_HUBS registry", () => {
  it("lists exactly the eight public content hubs", () => {
    expect(CONTENT_HUBS.map((h) => h.href).sort()).toEqual(
      [
        "/admit-card", "/answer-key", "/date-sheet", "/mock-test",
        "/previous-papers", "/results", "/study-material", "/syllabus",
      ].sort(),
    );
  });

  it("marks date-sheet and mock-test as structural dead ends, the rest populatable", () => {
    const dead = CONTENT_HUBS.filter((h) => !h.populatable).map((h) => h.href).sort();
    expect(dead).toEqual(["/date-sheet", "/mock-test"]);
  });

  it("hubFor throws for an unknown href", () => {
    expect(() => hubFor("/not-a-hub")).toThrow();
  });

  it("isHubHref answers without throwing (for CMS menu filtering)", () => {
    expect(isHubHref("/results")).toBe(true);
    expect(isHubHref("/admit-card")).toBe(true);
    expect(isHubHref("/sarkari-naukri")).toBe(false);
    expect(isHubHref("#")).toBe(false);
    expect(isHubHref(undefined)).toBe(false);
    expect(isHubHref(null)).toBe(false);
  });
});

describe("hubHasContent — the one rule", () => {
  it("structural dead ends are never present, even if a query returned rows", async () => {
    examsMock.mockResolvedValue(fakeExams(5));
    latestMock.mockResolvedValue(fakePosts(5));
    expect(await hubHasContent(hubFor("/date-sheet"))).toBe(false);
    expect(await hubHasContent(hubFor("/mock-test"))).toBe(false);
    // Never even queries for a structural hub.
    expect(examsMock).not.toHaveBeenCalled();
  });

  it("present when the exam listing has a row", async () => {
    examsMock.mockResolvedValue(fakeExams(1));
    expect(await hubHasContent(hubFor("/admit-card"))).toBe(true);
  });

  it("present when only a published content post exists", async () => {
    examsMock.mockResolvedValue([]);
    latestMock.mockResolvedValue(fakePosts(1));
    expect(await hubHasContent(hubFor("/results"))).toBe(true);
  });

  it("absent when neither the listing nor the posts have rows", async () => {
    examsMock.mockResolvedValue([]);
    latestMock.mockResolvedValue([]);
    expect(await hubHasContent(hubFor("/answer-key"))).toBe(false);
  });
});

describe("filterHubLinks — shared by every strip / menu / sidebar", () => {
  it("always keeps non-hub links", async () => {
    const out = await filterHubLinks([
      { href: "/sarkari-naukri" },
      { href: "/blog" },
    ]);
    expect(out.map((l) => l.href)).toEqual(["/sarkari-naukri", "/blog"]);
  });

  it("drops a hub link only while that hub is empty and keeps it when populated", async () => {
    examsMock.mockImplementation(async (ct) => (ct === "admit-card" ? fakeExams(3) : []));
    const out = await filterHubLinks([
      { href: "/admit-card" },
      { href: "/answer-key" },
      { href: "/date-sheet" }, // structural → always dropped
      { href: "/about" },      // non-hub → always kept
    ]);
    expect(out.map((l) => l.href)).toEqual(["/admit-card", "/about"]);
  });
});
