/**
 * staticHubCanonical.routes.test.ts — "a hub is self-canonical" (owner batch 3, F1).
 *
 * The root layout declares `alternates.canonical: siteConfig.url` (the home page), and Next
 * INHERITS metadata. So a static route that declares no metadata of its own publishes the
 * HOME canonical on its own URL: the sitemap contradicts the page (Google read
 * /sarkari-naukri/state declaring itself to be "/"), and the page also inherits the home
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
