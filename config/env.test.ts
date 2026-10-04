/**
 * B1 guard — Next.js only inlines LITERAL `process.env.NEXT_PUBLIC_X` references
 * into the client bundle. A dynamic `process.env[key]` is NOT inlined and reads
 * undefined in the browser, which broke the contact form (SUPABASE_URL/ANON_KEY
 * were empty client-side). This test fails if that regression returns.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ENV_TS = readFileSync(join(process.cwd(), "config/env.ts"), "utf8");

/** Recursively list .ts/.tsx files under a dir (skips node_modules/.next). */
function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[] = [];
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e === ".git") continue;
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(e)) acc.push(full);
  }
  return acc;
}

describe("config/env.ts reads NEXT_PUBLIC keys literally (B1)", () => {
  it("reads the Supabase URL + anon key via LITERAL dot-access (so Next inlines them)", () => {
    expect(ENV_TS).toMatch(/process\.env\.NEXT_PUBLIC_SUPABASE_URL\b/);
    expect(ENV_TS).toMatch(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY\b/);
  });

  it("never reads a NEXT_PUBLIC_* value via a dynamic process.env[ bracket access", () => {
    // The dangerous shape: process.env["NEXT_PUBLIC_..."] or process.env[`NEXT_PUBLIC_...`].
    expect(ENV_TS).not.toMatch(/process\.env\[\s*[`"']NEXT_PUBLIC_/);
  });

  it("readEnv is called with a literal value argument (not the old single-arg dynamic form)", () => {
    // Every readEnv("NEXT_PUBLIC_X") must pass a second `process.env.` argument.
    const calls = ENV_TS.match(/readEnv\(\s*["']NEXT_PUBLIC_[^"']+["']\s*\)/g) ?? [];
    // A single-argument readEnv("NEXT_PUBLIC_...") call would mean the regression is back.
    expect(calls).toHaveLength(0);
  });
});

describe("no client-reachable module reads NEXT_PUBLIC via a dynamic key (B1)", () => {
  it("scans 'use client' files + env.ts for process.env[\"NEXT_PUBLIC_...\"]", () => {
    const roots = ["components", "lib", "app", "config", "services"];
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of walk(join(process.cwd(), root))) {
        const src = readFileSync(file, "utf8");
        const isClient = /^\s*["']use client["']/.test(src);
        const isEnv = file.endsWith(join("config", "env.ts"));
        if (!isClient && !isEnv) continue;
        // A dynamic bracket read of a NEXT_PUBLIC literal never inlines.
        if (/process\.env\[\s*[`"']NEXT_PUBLIC_/.test(src)) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
