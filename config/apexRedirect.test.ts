/**
 * apexRedirect.test.ts — proves the bare-domain → www host redirect is wired safely.
 *
 * Without importing next.config (which runs git at load), it asserts:
 *  • the emitted config SHAPE: exactly one rule, permanent (→ Next sends 308),
 *    a `has` host matcher set to the apex only, source `/:path*`, destination at
 *    the canonical www origin, and no query baked into the destination (so Next
 *    appends and preserves the original query string);
 *  • isBareDomainHost matches the apex and NOTHING else (www, localhost,
 *    port-bearing, subdomain and preview hosts all false);
 *  • no loop: the destination host is www, which the matcher rejects;
 *  • `:path*` actually covers `/`, /sitemap.xml and /robots.txt;
 *  • next.config takes its rules from config/redirects.ts, which puts apexHostRedirects() first.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  apexHostRedirects,
  isBareDomainHost,
  APEX_HOST,
  WWW_ORIGIN,
} from "./apexRedirect";
import { allRedirectRules } from "./redirects";

const NEXT_CONFIG = readFileSync(resolve(__dirname, "..", "next.config.ts"), "utf8");
const rules = apexHostRedirects();

/** Compile a Next source pattern into a RegExp with a positional `path` capture, for `:path*` only. */
function compileSource(source: string): RegExp {
  expect(source, "test only understands the :path* form").toBe("/:path*");
  return /^\/(.*)$/; // ":path*" => zero or more chars, so `/` (empty) matches too
}

describe("apex redirect — emitted config shape", () => {
  it("is exactly one permanent host rule", () => {
    expect(rules).toHaveLength(1);
    const [r] = rules;
    expect(r.permanent).toBe(true); // Next.js emits 308 for permanent redirects
    expect(r.source).toBe("/:path*");
    expect(r.destination).toBe(`${WWW_ORIGIN}/:path*`);
  });

  it("has a host matcher set to the apex, and nothing else", () => {
    const [r] = rules;
    expect(r.has).toEqual([{ type: "host", value: APEX_HOST }]);
    expect(r.has[0].value).toBe("indianexaminfo.com");
  });

  it("bakes no query into the destination (Next appends + preserves it)", () => {
    for (const r of rules) expect(r.destination).not.toContain("?");
  });
});

describe("apex redirect — matches the bare domain ONLY", () => {
  it("redirects the apex", () => {
    expect(isBareDomainHost("indianexaminfo.com")).toBe(true);
  });
  it("does NOT redirect www, localhost, ported, sub- or preview hosts", () => {
    for (const host of [
      "www.indianexaminfo.com",
      "localhost",
      "localhost:3000",
      "127.0.0.1:3000",
      "indianexaminfo.com:443",
      "test.indianexaminfo.com",
      "preview-abc123.vercel.app",
      "indianexaminfo.co",
      "",
    ]) {
      expect(isBareDomainHost(host), `should not match ${host || "(empty)"}`).toBe(false);
    }
  });
});

describe("apex redirect — one hop, no loop", () => {
  it("the destination host is www, which the matcher rejects (so it cannot re-fire)", () => {
    const destinationHost = new URL(rules[0].destination.replace(":path*", "")).host;
    expect(destinationHost).toBe("www.indianexaminfo.com");
    expect(isBareDomainHost(destinationHost)).toBe(false);
  });
});

describe("apex redirect — path coverage", () => {
  const re = compileSource(rules[0].source);
  it.each(["/", "/sitemap.xml", "/robots.txt", "/sarkari-naukri/upsc/upsc-cms", "/admission/management/cat"])(
    "%s is captured by :path* and maps under the www origin",
    (path) => {
      const m = re.exec(path);
      expect(m, `${path} should match source`).not.toBeNull();
      const location = rules[0].destination.replace(":path*", m![1]);
      expect(location.startsWith(`${WWW_ORIGIN}/`)).toBe(true);
    },
  );
});

describe("apex redirect — wired into next.config", () => {
  it("next.config takes its rules from config/redirects (K3: one list, two consumers)", () => {
    expect(NEXT_CONFIG).toMatch(/import\s*\{\s*allRedirectRules\s*\}\s*from\s*"\.\/config\/redirects"/);
    expect(NEXT_CONFIG).toMatch(/return\s+allRedirectRules\(\);/);
    // The rules now live in config/redirects.ts, so the source of truth cannot drift between
    // the router and the sitemap guard; next.config must not redeclare any of them.
    expect(NEXT_CONFIG).not.toMatch(/destination:\s*"/);
  });

  it("the apex host rule is the FIRST rule of the list next.config hands to Next", () => {
    // Order is load-bearing: a path rule placed before the host rule would answer the apex
    // request from the wrong table and the bare domain would keep serving duplicates.
    const first = allRedirectRules()[0];
    expect(first.source).toBe("/:path*");
    expect((first as { has?: { type: string; value: string }[] }).has?.[0]?.value).toBe(APEX_HOST);
  });
});
