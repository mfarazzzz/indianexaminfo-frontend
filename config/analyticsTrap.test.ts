/**
 * analyticsTrap.test.ts — owner batch 7, A2.
 *
 * Two live-site traps, both pinned here:
 *  1. `G-XXXXXXXXXX` (the value .env.example and DEPLOY.md used to ship) behaved like a
 *     configured measurement id, so switching the consent banner on would have started
 *     sending reader traffic to a GA property that does not exist. Batch 6 read that
 *     literal value out of the LIVE client bundle. Now `shouldLoadAnalytics` refuses it.
 *  2. An empty or placeholder `NEXT_PUBLIC_GSC_VERIFY` emitted
 *     `<meta name="google-site-verification" content="…">` anyway, which Search Console
 *     reads as a failed verification. `gscVerificationMeta()` returns undefined instead,
 *     which is what makes Next omit the tag.
 *
 * The wiring assertions are source-text because `env` is read once at module load (the
 * values are inlined by Next at build), so the call sites are the thing that can regress.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gscVerificationMeta } from "./env";

const ROOT = resolve(__dirname, "..");
const ENV_SRC = readFileSync(resolve(ROOT, "config/env.ts"), "utf8");
const METADATA_SRC = readFileSync(resolve(ROOT, "lib/seo/metadata.ts"), "utf8");
const LAYOUT_SRC = readFileSync(resolve(ROOT, "app/layout.tsx"), "utf8");
const CONSENT_SRC = readFileSync(resolve(ROOT, "lib/analytics/consent.ts"), "utf8");

describe("gscVerificationMeta — only a real token reaches the DOM", () => {
  it("returns undefined for empty/blank", () => {
    expect(gscVerificationMeta("")).toBeUndefined();
    expect(gscVerificationMeta("   ")).toBeUndefined();
  });
  it("returns undefined for the documented placeholder", () => {
    expect(gscVerificationMeta("your-gsc-verification-token")).toBeUndefined();
    expect(gscVerificationMeta("  your-gsc-verification-token ")).toBeUndefined();
  });
  it("returns a real token, trimmed", () => {
    expect(gscVerificationMeta("ABC123token")).toBe("ABC123token");
    expect(gscVerificationMeta(" ABC123token ")).toBe("ABC123token");
  });
  it("defaults to the inlined env value (so call sites need no argument)", () => {
    expect(ENV_SRC).toMatch(/export function gscVerificationMeta\(\s*raw: string = env\.GSC_VERIFY\s*\)/);
  });
});

describe("A2 wiring — the verification meta goes through the guard everywhere", () => {
  it("lib/seo/metadata.ts uses gscVerificationMeta(), never the raw env value", () => {
    expect(METADATA_SRC).toContain("google: gscVerificationMeta()");
    expect(METADATA_SRC).not.toMatch(/google:\s*env\.GSC_VERIFY/);
    // Both builders (page metadata and the homepage) must be guarded.
    const uses = METADATA_SRC.match(/gscVerificationMeta\(\)/g) ?? [];
    expect(uses.length, "expected a guard in each metadata builder").toBeGreaterThanOrEqual(2);
  });

  it("app/layout.tsx uses gscVerificationMeta(), never the raw env value", () => {
    expect(LAYOUT_SRC).toContain("google: gscVerificationMeta()");
    expect(LAYOUT_SRC).not.toMatch(/google:\s*env\.GSC_VERIFY/);
    expect(LAYOUT_SRC).toMatch(/import\s*\{[^}]*gscVerificationMeta[^}]*\}\s*from\s*"@\/config\/env"/);
  });

  it("the placeholder is recognised in the analytics gate", () => {
    expect(CONSENT_SRC).toMatch(/\/\^G-X\+\$\/i/);
    expect(CONSENT_SRC).toMatch(/isUsableGaId\(gaId\)\s*&&\s*consent === "granted"/);
  });
});

describe("A2 docs — no example env file ships a placeholder as a value", () => {
  /** Lines of the form `KEY=non-empty` for the two guarded variables. */
  const assignments = (src: string, key: string) =>
    src
      .split(/\r?\n/)
      .filter((l) => !l.trim().startsWith("#"))
      .map((l) => l.match(new RegExp(`^${key}=(.*)$`)))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => m[1]);

  it(".env.example keeps both assignments empty", () => {
    for (const file of [resolve(ROOT, ".env.example")]) {
      const src = readFileSync(file, "utf8");
      for (const key of ["NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_GSC_VERIFY"]) {
        const values = assignments(src, key);
        expect(values.length, `${key} in ${file}`).toBeGreaterThan(0);
        for (const v of values) expect(v.trim(), `${key} has a non-empty example value in ${file}`).toBe("");
      }
    }
  });

  it("DEPLOY.md keeps both assignments empty in its env block", () => {
    const src = readFileSync(resolve(ROOT, "DEPLOY.md"), "utf8");
    for (const key of ["NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_GSC_VERIFY"]) {
      for (const v of assignments(src, key)) {
        expect(v.trim(), `${key} still carries an example value in DEPLOY.md`).toBe("");
      }
    }
  });

  it("config/env.ts still defaults both to empty (never to a placeholder)", () => {
    expect(ENV_SRC).toMatch(/GA_ID:\s*process\.env\.NEXT_PUBLIC_GA_ID \?\? ""/);
    expect(ENV_SRC).toMatch(/GSC_VERIFY:\s*process\.env\.NEXT_PUBLIC_GSC_VERIFY \?\? ""/);
  });
});
