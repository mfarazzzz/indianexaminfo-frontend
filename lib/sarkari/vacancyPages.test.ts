/**
 * vacancyPages.test.ts — the K5 pagination contract (owner batch 4).
 *
 * Two properties matter here and nothing else does:
 *  1. the ORDER must not depend on a clock, or two regenerations of the same corpus put a
 *     record on two different pages (and one page then has a gap);
 *  2. the page URLs a reader and a crawler are handed must exist — page 1 exists whenever there
 *     is any record, the last page is always in the trail, and "/page/0" or "/page/2.5" is not
 *     silently treated as page 1.
 */
import { describe, it, expect } from "vitest";
import {
  compareForStablePagination, sortForStablePagination, type VacancyOrderRow,
} from "./listing";
import {
  jobPageHref, pageTrail, parseVacancyPage, sliceForPage, vacancyPageCount, VACANCY_PAGE_SIZE,
} from "./vacancyPages";

const row = (over: Partial<VacancyOrderRow> & { slug: string }): VacancyOrderRow => ({
  status: "upcoming",
  updatedAt: "2026-10-01T00:00:00Z",
  ...over,
});

describe("the pagination order is total and clock-free", () => {
  it("is identical when run twice, and identical to a reversed input", () => {
    const rows = [
      row({ slug: "a", status: "application-open", applicationEndDate: "2026-11-30" }),
      row({ slug: "b", status: "result-declared", updatedAt: "2026-10-09T00:00:00Z" }),
      row({ slug: "c", status: "application-open", applicationEndDate: "2026-11-01" }),
      row({ slug: "d", status: "cancelled" }),
      row({ slug: "e", status: "admit-card-released", admitCardDate: "2026-12-01" }),
    ];
    const forward = sortForStablePagination(rows).map((r) => r.slug);
    expect(sortForStablePagination([...rows].reverse()).map((r) => r.slug)).toEqual(forward);
    // The order itself is pinned too: application-open first (nearest date first), then admit
    // card, then result, then cancelled.
    expect(forward).toEqual(["c", "a", "e", "b", "d"]);
    expect(new Set(forward).size).toBe(rows.length);   // every record exactly once
  });

  it("is antisymmetric and transitive — a real total order, not an accident of input order", () => {
    // The dated/undated branch of a comparator is easy to get wrong in exactly this way: an
    // implementation that returns "dated first" whenever the two dates merely DIFFER is
    // non-transitive, and a non-transitive comparator gives a different page for the same record
    // depending on how the rows arrived. Nine fixtures, every triple checked.
    const fixtures = [
      row({ slug: "f1", status: "application-open", applicationEndDate: "2026-01-10" }),
      row({ slug: "f2", status: "application-open", applicationEndDate: "2026-01-09" }),
      row({ slug: "f3", status: "application-open" }),
      row({ slug: "f4", status: "admit-card-released", admitCardDate: "2026-02-02" }),
      row({ slug: "f5", status: "admit-card-released" }),
      row({ slug: "f6", status: "exam-scheduled", examDate: "2025-05-05" }),
      row({ slug: "f7", status: "result-declared", updatedAt: "2026-09-09T00:00:00Z" }),
      row({ slug: "f8", status: "result-declared", updatedAt: "2026-09-09T00:00:00Z" }),
      row({ slug: "f9", status: "cancelled" }),
    ];
    for (const a of fixtures) {
      expect(compareForStablePagination(a, a), a.slug).toBe(0);
      for (const b of fixtures) {
        const ab = compareForStablePagination(a, b);
        const ba = compareForStablePagination(b, a);
        // (sum is 0 for every pair: +1/-1 or 0/0 — Object.is would otherwise fail on -0 vs +0)
        expect(Math.sign(ab) + Math.sign(ba), `antisymmetry ${a.slug} vs ${b.slug}`).toBe(0);
        for (const c of fixtures) {
          const bc = compareForStablePagination(b, c);
          if (ab <= 0 && bc <= 0) {
            expect(compareForStablePagination(a, c), `transitivity ${a.slug}<=${b.slug}<=${c.slug}`)
              .toBeLessThanOrEqual(0);
          }
        }
      }
    }
    // Two identical rows except for the slug must still order deterministically.
    expect(sortForStablePagination([fixtures[7], fixtures[6]]).map((r) => r.slug)).toEqual(["f7", "f8"]);
    expect(sortForStablePagination([fixtures[6], fixtures[7]]).map((r) => r.slug)).toEqual(["f7", "f8"]);
  });

  it("does not move a record when a deadline passes (no Date.now() in the comparator)", () => {
    // sortRecruitmentsOpenFirst asks "is this date still future?" against the clock, which is
    // fine for one page and wrong across pages: the same record would sit on page 3 today and
    // page 2 tomorrow without any edit. A past deadline must not change its position relative
    // to another past deadline, and the whole order must not change between two runs.
    const rows = [
      row({ slug: "past", status: "application-open", applicationEndDate: "2020-01-05" }),
      row({ slug: "future", status: "application-open", applicationEndDate: "2099-01-05" }),
      row({ slug: "other", status: "application-open", applicationEndDate: "2020-01-04" }),
    ];
    expect(sortForStablePagination(rows).map((r) => r.slug)).toEqual(["other", "past", "future"]);
  });

  it("breaks a full tie by slug, so the order is strict", () => {
    const a = row({ slug: "aaa", status: "upcoming", updatedAt: "2026-10-01T00:00:00Z" });
    const b = row({ slug: "bbb", status: "upcoming", updatedAt: "2026-10-01T00:00:00Z" });
    expect(compareForStablePagination(a, b)).toBeLessThan(0);
    expect(compareForStablePagination(b, a)).toBeGreaterThan(0);
    expect(compareForStablePagination(a, a)).toBe(0);
  });

  it("puts actionable records before terminal ones", () => {
    const order = sortForStablePagination([
      row({ slug: "done", status: "completed" }),
      row({ slug: "apply", status: "application-open" }),
      row({ slug: "card", status: "admit-card-released" }),
    ]).map((r) => r.slug);
    expect(order).toEqual(["apply", "card", "done"]);
  });

  it("never orders by result_date (G2: unverified seed data)", () => {
    // The comparator reads application/admit-card/exam dates only; a fabricated result date must
    // not decide which page a record lands on.
    const rows = [
      row({ slug: "noresult", status: "result-declared", updatedAt: "2026-10-05T00:00:00Z" }),
      row({ slug: "withresult", status: "result-declared", updatedAt: "2026-10-01T00:00:00Z" }),
    ];
    expect(sortForStablePagination(rows).map((r) => r.slug)).toEqual(["noresult", "withresult"]);
  });
});

describe("page arithmetic", () => {
  it("a corpus of 0 still has one page, and 21 records need two", () => {
    expect(vacancyPageCount(0)).toBe(1);
    expect(vacancyPageCount(VACANCY_PAGE_SIZE)).toBe(1);
    expect(vacancyPageCount(VACANCY_PAGE_SIZE + 1)).toBe(2);
    expect(vacancyPageCount(400)).toBe(20);
  });

  it("slices are disjoint and cover every record exactly once", () => {
    const slugs = Array.from({ length: 45 }, (_, i) => `slug-${i}`);
    const pages = vacancyPageCount(slugs.length);
    const all: string[] = [];
    for (let p = 1; p <= pages; p++) {
      const slice = sliceForPage(slugs, p);
      expect(slice.length).toBeLessThanOrEqual(VACANCY_PAGE_SIZE);
      all.push(...slice);
    }
    expect(all).toEqual(slugs);
    expect(new Set(all).size).toBe(slugs.length);
  });

  it("parseVacancyPage rejects the shapes that are NOT page 1", () => {
    expect(parseVacancyPage("1")).toBe(1);
    expect(parseVacancyPage("12")).toBe(12);
    expect(parseVacancyPage("012")).toBe(12);
    expect(parseVacancyPage("0")).toBe(0);           // out of range, the route 404s it
    expect(parseVacancyPage("2.5")).toBeNaN();
    expect(parseVacancyPage("abc")).toBeNaN();
    expect(parseVacancyPage("-3")).toBeNaN();
    expect(parseVacancyPage("12345")).toBeNaN();      // no unbounded integer either
    expect(parseVacancyPage(7)).toBe(7);
  });

  it("jobPageHref is the only URL shape the chain uses", () => {
    expect(jobPageHref(1)).toBe("/sarkari-naukri/jobs/page/1");
    expect(jobPageHref(20)).toBe("/sarkari-naukri/jobs/page/20");
  });
});

describe("the anchor trail reaches both ends from anywhere", () => {
  it("includes first, last, current and its neighbours, sorted and in range", () => {
    expect(pageTrail(1, 10)).toEqual([1, 2, 3, 10]);
    expect(pageTrail(5, 10)).toEqual([1, 4, 5, 6, 7, 10]);
    expect(pageTrail(10, 10)).toEqual([1, 9, 10]);
    expect(pageTrail(2, 2)).toEqual([1, 2]);
    expect(pageTrail(1, 1)).toEqual([1]);
    expect(pageTrail(1, 0)).toEqual([]);
    for (const pages of [1, 2, 3, 7, 20]) {
      for (let p = 1; p <= pages; p++) {
        const t = pageTrail(p, pages);
        expect(t).toContain(p);
        expect(t).toContain(1);
        expect(t).toContain(pages);
        expect(t.every((x) => x >= 1 && x <= pages), `out of range in ${t}`).toBe(true);
        expect(new Set(t).size).toBe(t.length);
      }
    }
  });
});
