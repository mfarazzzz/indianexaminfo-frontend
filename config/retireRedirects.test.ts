/**
 * retireRedirects.test.ts — A Phase 1 invariants for the duplicate-retire 308s.
 *
 * Proves, without importing next.config (which runs git at load):
 *  • the five intended loser→winner pairs are present, exact;
 *  • no redirect destination is itself a source (no chain, no loop);
 *  • every destination's final segment is a known published WINNER slug;
 *  • the rules really reach Next (config/redirects.ts → next.config) as permanent:true, and
 *    none of the destinations is matched by any other rule's source (K3: destinations are
 *    checked with the SAME matcher the sitemap guard uses, which is stronger than the old
 *    literal string scan).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RETIRE_REDIRECTS, RETIRE_WINNER_SLUGS } from "./retireRedirects";
import { allRedirectRules, pathIsRedirectSource, pathRedirectSources } from "./redirects";

const NEXT_CONFIG = readFileSync(resolve(__dirname, "..", "next.config.ts"), "utf8");
const lastSegment = (p: string) => p.replace(/\/+$/, "").split("/").pop() ?? "";

const EXPECTED: Record<string, string> = {
  "/sarkari-naukri/central-government-jobs/upsc-cms-examination-2026": "/sarkari-naukri/upsc/upsc-cms",
  "/admission/defence-entrance/cds": "/sarkari-naukri/defence/cds-exam",
  "/admission/defence-entrance/nda": "/sarkari-naukri/defence/nda-exam",
  "/sarkari-naukri/teaching/nta-ugc-net": "/admission/research-fellowships/ugc-net",
  "/sarkari-naukri/railways/rpf-constable-si-recruitment": "/sarkari-naukri/railways/rpf-constable",
};

describe("retire redirects — the five pairs", () => {
  it("contains exactly the intended loser→winner pairs", () => {
    const map = Object.fromEntries(RETIRE_REDIRECTS.map((r) => [r.source, r.destination]));
    expect(map).toEqual(EXPECTED);
  });
});

describe("retire redirects — no chain, no loop, winners only", () => {
  const sources = new Set(RETIRE_REDIRECTS.map((r) => r.source));

  it("no destination is itself a source (no chain among the retires)", () => {
    for (const r of RETIRE_REDIRECTS) {
      expect(sources.has(r.destination), `chain: ${r.destination} is also a source`).toBe(false);
    }
  });

  it("no rule points at itself", () => {
    for (const r of RETIRE_REDIRECTS) expect(r.source).not.toBe(r.destination);
  });

  it("every destination is a known published winner slug", () => {
    for (const r of RETIRE_REDIRECTS) {
      expect(RETIRE_WINNER_SLUGS, `winner slug for ${r.destination}`).toContain(lastSegment(r.destination));
    }
  });

  it("no destination is matched as a source by any other rule (no chain to a 308)", () => {
    // The router hands a destination back to the client as a new request, so a destination
    // that another rule catches is a chain. pathIsRedirectSource knows every parameter form
    // in config/redirects.ts, so this catches e.g. a `/x/:slug` rule swallowing a
    // `/x/some-slug` destination — something a literal string comparison could miss.
    for (const r of RETIRE_REDIRECTS) {
      expect(pathIsRedirectSource(r.destination), `${r.destination} is itself a redirect source`).toBe(false);
    }
  });

  it("every source in the config is a distinct, absolute path pattern", () => {
    const all = pathRedirectSources();
    expect(new Set(all).size, "duplicate source rules").toBe(all.length);
    for (const s of all) expect(s.startsWith("/"), `relative source ${s}`).toBe(true);
  });
});

describe("retire redirects — wired into next.config as permanent 308s", () => {
  it("config/redirects spreads RETIRE_REDIRECTS as permanent:true and next.config returns it", () => {
    expect(NEXT_CONFIG).toMatch(/import\s*\{\s*allRedirectRules\s*\}\s*from\s*"\.\/config\/redirects"/);
    expect(NEXT_CONFIG).toMatch(/return\s+allRedirectRules\(\);/);
    // The rules themselves live in config/redirects.ts (one list for the router AND the
    // sitemap guard), which is where the retire spread and its permanent:true must be.
    expect(pathRedirectSources()).toEqual(expect.arrayContaining(RETIRE_REDIRECTS.map((r) => r.source)));
    const rules = allRedirectRules();
    for (const r of RETIRE_REDIRECTS) {
      const hit = rules.find((x) => x.source === r.source);
      expect(hit, `${r.source} never reaches Next`).toBeDefined();
      expect(hit?.permanent, `${r.source} must be a permanent 308`).toBe(true);
    }
  });
});
