/**
 * redirects.test.ts — the redirect list and its path matcher (owner batch 4, K3).
 *
 * The sitemap refuses to submit a URL the router would answer with a 308. That promise is
 * only as good as `pathIsRedirectSource`, so this pins the matcher against EVERY construct
 * that actually appears in the rule list — exact paths, `:slug`, `:path*`, `:path+`, and the
 * `:slug-2026` form (a parameter followed by a literal, which is what makes the year-suffix
 * clean-up rules mean "ends in -2026" and NOT "any segment").
 *
 * It also pins the shape of the list itself: next.config must hand Next exactly
 * `allRedirectRules()`, and no destination may be a source (a redirect to a redirect is a
 * chain, and a chain is what made the old soft-404s un-indexable).
 */
import { describe, expect, it } from "vitest";
import {
  allRedirectRules,
  pathIsRedirectSource,
  pathRedirectSources,
  PATH_REDIRECT_RULES,
} from "./redirects";
import { RETIRE_REDIRECTS } from "./retireRedirects";

describe("pathIsRedirectSource — exact paths", () => {
  it.each([
    ["/sarkari-naukri/central-government-jobs", true],
    ["/sarkari-naukri/state-government-jobs", true],
    ["/result", true],
    ["/university-exam/mjpru", true],
    ["/sarkari-naukri/upsc-cds", true],
    ["/government-exam", true],
    ["/govt-vacancy", true],
  ])("%s → %s", (path, expected) => {
    expect(pathIsRedirectSource(path)).toBe(expected);
  });

  it("a source with a trailing slash still matches (Next is not strict about it)", () => {
    expect(pathIsRedirectSource("/sarkari-naukri/central-government-jobs/")).toBe(true);
  });

  it("accepts an absolute URL, not only a pathname", () => {
    expect(pathIsRedirectSource("https://www.indianexaminfo.com/result")).toBe(true);
    expect(pathIsRedirectSource("https://www.indianexaminfo.com/results")).toBe(false);
  });
});

describe("pathIsRedirectSource — the winners and the pages the sitemap submits", () => {
  it.each([
    "/sarkari-naukri/exam",
    "/sarkari-naukri/bharti",
    "/results",
    "/sarkari-naukri/defence/cds-exam",
    "/sarkari-naukri/defence/nda-exam",
    "/sarkari-naukri/railways/rpf-constable",
    "/sarkari-naukri/banking",
    "/admission/research-fellowships/ugc-net",
    "/university-exam/state-university/mjpru-exam",
    "/board-exam/state/up-board",
    "/sarkari-naukri/state/up",
    "/admission/engineering/jee-main",
    "/",
  ])("%s is NOT a redirect source", (path) => {
    expect(pathIsRedirectSource(path)).toBe(false);
  });
});

describe("pathIsRedirectSource — parameter forms used by the rules", () => {
  it(":slug is exactly ONE segment", () => {
    expect(pathIsRedirectSource("/exam/ssc-cgl")).toBe(true);
    expect(pathIsRedirectSource("/exam/ssc-cgl/admit-card")).toBe(false); // /exam/:slug is depth 2
    expect(pathIsRedirectSource("/exam")).toBe(false);                    // :slug needs a segment
  });

  it(":path* covers zero, one and many segments", () => {
    expect(pathIsRedirectSource("/government-exam")).toBe(true);
    expect(pathIsRedirectSource("/government-exam/ssc-cgl")).toBe(true);
    expect(pathIsRedirectSource("/government-exam/upsc/ssc-cgl/admit-card")).toBe(true);
  });

  it(":path+ needs at least one segment", () => {
    expect(pathIsRedirectSource("/university-exam/deemed-university/amity-entrance/syllabus")).toBe(true);
    // The bare parent has its OWN exact rule, so this still proves the catch did not have to
    // stretch to depth 2: the more specific `notification` rule wins before it (order = contract).
    expect(pathIsRedirectSource("/university-exam/deemed-university/amity-entrance/notification")).toBe(true);
    expect(pathIsRedirectSource("/university-exam/deemed-university/amity-entrance/answer-key")).toBe(true);
  });

  it(":slug-2026 is a parameter FOLLOWED BY a literal, not a wildcard", () => {
    // The whole point of the year-suffix rules: only a year-carrying slug normalises.
    expect(pathIsRedirectSource("/admission/management/cat-2026")).toBe(true);
    expect(pathIsRedirectSource("/admission/management/jee-main-2026")).toBe(true);
    expect(pathIsRedirectSource("/admission/management/cat-2025")).toBe(true);   // the -2025 rule
    expect(pathIsRedirectSource("/admission/management/cat")).toBe(false);       // evergreen stays
    expect(pathIsRedirectSource("/admission/management/cds-exam")).toBe(false);
    expect(pathIsRedirectSource("/admission/management/slug-2026-extra")).toBe(false);
  });

  it("a literal percent-encoding in a rule matches the encoded path", () => {
    expect(pathIsRedirectSource("/admission/management/cat%202026")).toBe(true);
  });
});

describe("the list next.config hands to Next", () => {
  it("the apex host rule is first, so a host jump beats any path rule", () => {
    const [first] = allRedirectRules();
    expect(first.source).toBe("/:path*");
    expect(pathRedirectSources(), "the host rule must NOT count as a path source").not.toContain("/:path*");
  });

  it("the five retire rules reach Next as permanent 308s, before the generic rules", () => {
    const sources = allRedirectRules().map((r) => r.source);
    for (const r of RETIRE_REDIRECTS) {
      const idx = sources.indexOf(r.source);
      expect(idx, `${r.source} missing from the list`).toBeGreaterThanOrEqual(0);
      expect(allRedirectRules()[idx].permanent, `${r.source} must be permanent`).toBe(true);
      // No generic pillar catch-all may be evaluated before a retire pair.
      expect(idx).toBeLessThan(sources.indexOf("/entrance-exam/:path*"));
    }
  });

  it("no destination of any rule is itself a redirect source (no chains)", () => {
    let checked = 0;
    for (const r of allRedirectRules()) {
      if ("has" in r) continue;                    // host-conditional: fires only on the apex
      if (r.destination.includes(":")) continue;   // a templated destination is not a path yet
      checked += 1;
      expect(
        pathIsRedirectSource(r.destination),
        `${r.source} → ${r.destination} chains into another redirect`,
      ).toBe(false);
    }
    expect(checked, "the chain test must really cover the concrete destinations").toBeGreaterThan(30);
  });

  it("the list is the two groups, in order, with nothing dropped", () => {
    expect(PATH_REDIRECT_RULES.length).toBeGreaterThan(40);
    expect(allRedirectRules().length).toBe(PATH_REDIRECT_RULES.length + RETIRE_REDIRECTS.length + 1);
  });
});
