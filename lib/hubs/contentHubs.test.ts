/**
 * contentHubs.test.ts — the ONE presence rule for content-type hubs (P3-3, R2c).
 *
 * Pins the contract every enforcement point shares: the hub page (noindex), the
 * homepage quick-access strip, every nav/menu/sidebar and the sitemap all read
 * hubHasContent(). "Has content" must mean exactly "the hub's own page would
 * render at least one row" — an exam carrying the section OR a published content
 * post — never a number from a different query.
 *
 * Presence is DATA only (owner decision R2c, 2026-09-30): there is no "this hub
 * can never exist" flag and no hub 404s while empty. date-sheet and mock-test are
 * judged like every other hub; they are empty today because no store backs them,
 * so they are hidden + noindexed, and they reappear by themselves once wired.
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

  it("registers all eight hubs with no existence flag — presence is data only", () => {
    // R2c: the "populatable" flag is gone. Nothing may declare a hub dead; an
    // empty hub is hidden by the data, and the page still answers 200 + noindex.
    expect(CONTENT_HUBS).toHaveLength(8);
    for (const hub of CONTENT_HUBS) {
      expect(hub).not.toHaveProperty("populatable");
      expect(hub.contentType).toBeTruthy();
    }
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
  it("asks the same listing query for the no-store hubs as for every other hub", async () => {
    // R2c: no short-circuit. An empty date-sheet/mock-test hub is empty because
    // the data says so, which is what keeps it hidden AND keeps the URL alive.
    examsMock.mockResolvedValue([]);
    latestMock.mockResolvedValue([]);
    expect(await hubHasContent(hubFor("/date-sheet"))).toBe(false);
    expect(await hubHasContent(hubFor("/mock-test"))).toBe(false);
    expect(examsMock).toHaveBeenCalledWith("date-sheet");
    expect(examsMock).toHaveBeenCalledWith("mock-test");
  });

  it("a no-store hub is present the moment its listing has a row (no code change)", async () => {
    examsMock.mockImplementation(async (ct) => (ct === "date-sheet" ? fakeExams(1) : []));
    expect(await hubHasContent(hubFor("/date-sheet"))).toBe(true);
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
      { href: "/date-sheet" }, // empty by data → dropped while empty
      { href: "/about" },      // non-hub → always kept
    ]);
    expect(out.map((l) => l.href)).toEqual(["/admit-card", "/about"]);
  });
});
