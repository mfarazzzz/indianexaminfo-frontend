/**
 * staticHubCanonical.routes.test.ts — "a hub is self-canonical" (owner batch 3, F1).
 *
 * The root layout USED TO declare `alternates.canonical` = the home page (removed in batch 4,
 * K1), and Next INHERITS metadata. So a static route that declared no metadata of its own
 * published the HOME canonical on its own URL: the sitemap contradicted the page (Google read
 * /sarkari-naukri/state declaring itself to be "/"), and the page also inherited the home
 * <title> verbatim — the crawl's duplicate-title group. That is exactly what
 * /sarkari-naukri/state did.
 *
 * Contract, for every bracket-free route under app/(public):
 *   EITHER it declares `canonicalUrl: ${siteConfig.url}<its own path>`,
 *   OR it explicitly opts out of indexing (a noindex page makes no canonical claim).
 * Dynamic routes need their params to build a canonical and are covered by their own tests.
 * The route SOURCE is read instead of rendered because these are async Server Components
 * (same convention as lib/exam/categoryCanonical.routes.test.ts).
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(__dirname, "..", "..");

/** Every app/(public)/…/page.tsx whose route has no dynamic segment. */
function staticRoutes(): { rel: string; routePath: string }[] {
  const out: { rel: string; routePath: string }[] = [];
  const walk = (dir: string, urlPath: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        // A route group — "(public)" — contributes no URL segment.
        walk(abs, entry.name.startsWith("(") ? urlPath : `${urlPath}/${entry.name}`);
        continue;
      }
      if (entry.name !== "page.tsx") continue;
      if (urlPath.includes("[") || urlPath.includes("]")) continue; // dynamic route
      out.push({
        rel: relative(ROOT, abs).split(sep).join("/"),
        routePath: urlPath || "/",
      });
    }
  };
  walk(__dirname, "");
  return out.sort((a, b) => a.routePath.localeCompare(b.routePath));
}

const ROUTES = staticRoutes();

/**
 * K1 (batch 4) — the DYNAMIC route shapes. A dynamic page cannot be asserted against one
 * literal path (its canonical is built from the record), so the contract is the part that
 * CAN be checked statically, and it is strict on purpose:
 *   1. the root layout must not set a blanket canonical again (it used to, which is how
 *      /sarkari-naukri/state, /board-exam/state/up-board and /university-exam/
 *      state-university all told Google they were the home page);
 *   2. every dynamic page.tsx must hand a canonicalUrl to its metadata builder;
 *   3. the university-exam category-listing hub must be self-canonical by name, because that
 *      is one of the two measured cases.
 */
function dynamicRouteFiles(): { rel: string; segments: string }[] {
  const out: { rel: string; segments: string }[] = [];
  const walk = (dir: string, seg: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, e.name);
      if (e.isDirectory()) { walk(abs, e.name.startsWith("(") ? seg : `${seg}/${e.name}`); continue; }
      if (e.name !== "page.tsx" || !seg.includes("[")) continue;
      out.push({ rel: relative(ROOT, abs).split(sep).join("/"), segments: seg });
    }
  };
  walk(join(__dirname, ""), "");
  return out.sort((a, b) => a.segments.localeCompare(b.segments));
}

const DYNAMIC = dynamicRouteFiles();

describe("dynamic routes declare their own canonical (K1)", () => {
  it("the scanner sees the real dynamic route set", () => {
    expect(DYNAMIC.length).toBeGreaterThanOrEqual(10);
    expect(DYNAMIC.some((d) => d.rel.includes("university-exam/[...segments]") || d.rel.includes("university-exam"))).toBe(true);
  });

  it("app/layout.tsx sets no blanket canonical or en-IN language", () => {
    // Comments are stripped first: the K1 note in the layout QUOTES the line it removed, and
    // this assertion is about the metadata object, not about prose.
    const layout = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^[ \t]*\/\/.*$/gm, "");
    expect(layout).not.toMatch(/canonical:\s*siteConfig\.url/);
    expect(layout).not.toMatch(/en-IN["']?:\s*siteConfig\.url/);
  });

  it.each(DYNAMIC.map((d) => [d.rel] as const))("%s hands a canonicalUrl to its metadata", (rel) => {
    const src = readFileSync(join(ROOT, rel), "utf8");
    expect(src, `${rel} sets no canonicalUrl`).toContain("canonicalUrl");
  });

  it("the university-exam category-listing hub is self-canonical", () => {
    const src = readFileSync(
      join(ROOT, "app", "(public)", "university-exam", "[...segments]", "page.tsx"), "utf8");
    expect(src).toContain("canonicalUrl: `${siteConfig.url}/university-exam/${slug}`");
  });
});

describe("static hub routes are self-canonical (F1)", () => {
  it("the scanner finds the real hub set (guards the test itself)", () => {
    const paths = ROUTES.map((r) => r.routePath);
    expect(paths).toContain("/sarkari-naukri/state");
    expect(paths).toContain("/results");
    expect(paths.length).toBeGreaterThanOrEqual(20);
  });

  it.each(ROUTES.map((r) => [r.rel, r.routePath] as const))(
    "%s either self-canonicalises or is noindex",
    (rel, routePath) => {
      const src = readFileSync(join(ROOT, rel), "utf8");

      // Explicit opt-out: /search is robots index:false, so it claims no canonical.
      if (/robots:\s*\{\s*index:\s*false/.test(src) || /noIndex:\s*true/.test(src)) return;

      const canonical = src.match(/canonicalUrl:\s*`([^`]*)`/)?.[1];
      expect(canonical, `${routePath} declares no canonicalUrl and inherits the home one`).toBeDefined();
      // The canonical must be the absolute site origin + this route's OWN path — never the
      // site root, and never a path interpolation this scanner cannot resolve.
      expect(canonical ?? "", `${routePath} canonical`).toContain("${siteConfig.url}");
      expect((canonical ?? "").replace("${siteConfig.url}", ""), `${routePath} canonical path`).toBe(routePath);
    },
  );
});
