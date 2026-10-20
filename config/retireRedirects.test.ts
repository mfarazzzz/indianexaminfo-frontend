/**
 * retireRedirects.test.ts — A Phase 1 invariants for the duplicate-retire 308s.
 *
 * Proves, without importing next.config (which runs git at load):
 *  • the five intended loser→winner pairs are present, exact;
 *  • no redirect destination is itself a source (no chain, no loop);
 *  • every destination's final segment is a known published WINNER slug;
 *  • next.config actually spreads RETIRE_REDIRECTS as permanent:true, and none of
 *    the destinations appears as a source literal anywhere in next.config.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RETIRE_REDIRECTS, RETIRE_WINNER_SLUGS } from "./retireRedirects";

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

  it("no destination appears as a source literal anywhere in next.config.ts", () => {
    // Extract every `source: "..."` string from the config and make sure a retire
    // destination never matches one (which would produce a redirect chain).
    const configSources = new Set<string>();
    for (const m of NEXT_CONFIG.matchAll(/source:\s*"([^"]+)"/g)) configSources.add(m[1]);
    for (const r of RETIRE_REDIRECTS) {
      expect(configSources.has(r.destination), `${r.destination} is also a config source`).toBe(false);
    }
  });
});

describe("retire redirects — wired into next.config as permanent 308s", () => {
  it("next.config imports and spreads RETIRE_REDIRECTS with permanent:true", () => {
    expect(NEXT_CONFIG).toMatch(/import\s*\{\s*RETIRE_REDIRECTS\s*\}\s*from\s*"\.\/config\/retireRedirects"/);
    expect(NEXT_CONFIG).toMatch(/RETIRE_REDIRECTS\.map\([\s\S]*?permanent:\s*true/);
  });
});
