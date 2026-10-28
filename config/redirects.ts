/**
 * redirects.ts — EVERY redirect the router can fire, as DATA (owner batch 4, K3).
 *
 * These rules used to live inline in next.config.ts. They moved here so that two consumers
 * read ONE list: next.config's `redirects()` (unchanged behaviour, same order) and the
 * sitemap's "never submit a URL that is a redirect source" guard. A hand-copied list would
 * drift the first time someone added a rule, and the drift would be silent — the sitemap
 * would submit a 308 and Google would hold the contradiction against the site.
 *
 * ORDER IS PART OF THE CONTRACT (Next evaluates rules top-down, first match wins):
 *   1. host canonicalisation (apex → www) must precede every path rule;
 *   2. the retire list must precede the generic pillar rules so an exact detail path is
 *      never shadowed;
 *   3. the pillar catch-alls (`:path*` / `:path+`) come last inside their own group.
 * `PATH_REDIRECT_RULES` keeps the exact order next.config.ts had; do not re-sort it.
 *
 * Unit tests: config/redirects.test.ts (matcher semantics) and app/sitemap.shape.test.ts
 * (the sitemap guard itself).
 */
import { RETIRE_REDIRECTS } from "./retireRedirects";
import { apexHostRedirects, type ApexRedirectRule } from "./apexRedirect";

/** A redirect keyed on the request PATH (no host matcher). */
export interface PathRedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/**
 * The retire list as rules (permanent 308). Kept in config/retireRedirects.ts for its own
 * invariant test; spread here so this file really holds every rule.
 */
const RETIRE_AS_RULES: PathRedirectRule[] = RETIRE_REDIRECTS.map((r) => ({
  source: r.source,
  destination: r.destination,
  permanent: true,
}));

/**
 * Every path rule that was inline in next.config.ts, in the original order, with its
 * original reasoning attached next to it.
 */
export const PATH_REDIRECT_RULES: PathRedirectRule[] = [
  // === New pillar name redirects (sarkari-naukri → government-exam, govt-vacancy) ===
  // /government-exam/* → /sarkari-naukri/* (rewrite handled internally by sarkari-naukri catch-all)
  { source: "/government-exam",              destination: "/sarkari-naukri",              permanent: false },
  { source: "/government-exam/:path*",       destination: "/sarkari-naukri/:path*",       permanent: false },
  // /govt-vacancy/* → /sarkari-naukri (handled by catch-all)
  { source: "/govt-vacancy",                 destination: "/sarkari-naukri/bharti",       permanent: false },
  { source: "/govt-vacancy/:path*",          destination: "/sarkari-naukri/:path*",       permanent: false },
  // /government-jobs/* → /sarkari-naukri (legacy CMS URLs)
  { source: "/government-jobs",              destination: "/sarkari-naukri/bharti",       permanent: false },
  { source: "/government-jobs/:path*",       destination: "/sarkari-naukri/:path*",       permanent: false },

  // Legacy redirects
  { source: "/exam/:slug",  destination: "/sarkari-naukri/:slug", permanent: true },
  { source: "/result",      destination: "/results",              permanent: true },

  // sarkari-naukri legacy category hubs — formerly page-level redirect() calls in the
  // catch-all, which degraded to a streamed 200 + <meta refresh> under the root
  // loading.tsx boundary. next.config rules are true 308s evaluated before rendering.
  { source: "/sarkari-naukri/central-government-jobs", destination: "/sarkari-naukri/exam",   permanent: true },
  { source: "/sarkari-naukri/state-government-jobs",   destination: "/sarkari-naukri/bharti", permanent: true },

  // E3: indexed typo/legacy vacancy URLs whose REAL page exists elsewhere.
  // Verified live (200 self-canonical) — 308 straight to the canonical
  // record. All other 200-with-homepage-canonical rows are non-routes and
  // return a true 404 now that the root loading.tsx soft-404 is removed.
  { source: "/sarkari-naukri/up-swasthya-vibhag-ambulance-divider-2026", destination: "/sarkari-naukri/up-swasthya-vibhag-ambulance-driver-2026", permanent: true },
  { source: "/sarkari-naukri/upsc/upsc-cds", destination: "/sarkari-naukri/defence/cds-exam", permanent: true },
  { source: "/sarkari-naukri/upsc-cds",      destination: "/sarkari-naukri/defence/cds-exam", permanent: true },
  // "salai"/"salary" are crawler typos of "safai" (UP Nagar Nigam Safai Karmi).
  // Both Kanpur typo variants and the Lucknow one map to real, live records
  // (verified 200 self-canonical). The city-less "salary-2026" has no single
  // real page and is left to a true 404.
  { source: "/sarkari-naukri/up-nagar-nigam-salai-karmi-2026-kanpur",   destination: "/sarkari-naukri/up-nagar-nigam-safai-karmi-2026-kanpur",   permanent: true },
  { source: "/sarkari-naukri/up-nagar-nigam-salary-karmi-2026-kanpur",  destination: "/sarkari-naukri/up-nagar-nigam-safai-karmi-2026-kanpur",   permanent: true },
  { source: "/sarkari-naukri/up-nagar-nigam-salai-karmi-2026-lucknow",  destination: "/sarkari-naukri/up-nagar-nigam-safai-karmi-2026-lucknow",  permanent: true },

  // Deleted MJPRU stub → the real MJPRU record. The stub row (slug `mjpru`
  // in the stray `university-exams` category) was removed from the DB
  // (migration 022); its indexed URL 301s here so it never 404s. The real
  // record is mjpru-exam under state-university.
  { source: "/university-exam/university-exams/mjpru", destination: "/university-exam/state-university/mjpru-exam", permanent: true },
  { source: "/university-exam/mjpru",                  destination: "/university-exam/state-university/mjpru-exam", permanent: true },

  // Admission records that were mispillared under University Exams and have
  // been moved/merged into Admissions (entrance-exam pillar, public root
  // /admission). Their old /university-exam/… URLs are indexed → 308 straight
  // to the FINAL /admission URL (no chain through /entrance-exam).
  // Six merged into an existing entrance twin; four moved keeping their slug.
  { source: "/university-exam/deemed-university/bits-pilani-exam", destination: "/admission/engineering/bitsat",              permanent: true },
  { source: "/university-exam/deemed-university/vit-viteee",       destination: "/admission/engineering/viteee",              permanent: true },
  { source: "/university-exam/deemed-university/srm-entrance",     destination: "/admission/engineering/srmjeee",             permanent: true },
  { source: "/university-exam/deemed-university/manipal-entrance", destination: "/admission/university-entrance/met-manipal", permanent: true },
  { source: "/university-exam/deemed-university/amity-entrance",   destination: "/admission/university-entrance/amity-entrance", permanent: true },
  // G7: legacy depth-4 tab URLs under the three slugs above fall through the
  // exact parent rules and 404. Verified against the live prod build: on the
  // destination /admission record only the `notification` tab resolves (200);
  // every other content type 404s. So map `notification`→notification and any
  // OTHER trailing segment→parent — one hop each, and never a new 404. The
  // specific `notification` rule MUST precede the `:path+` catch so it wins.
  { source: "/university-exam/deemed-university/amity-entrance/notification", destination: "/admission/university-entrance/amity-entrance/notification", permanent: true },
  { source: "/university-exam/deemed-university/amity-entrance/:path+",       destination: "/admission/university-entrance/amity-entrance",                 permanent: true },
  { source: "/university-exam/deemed-university/manipal-entrance/notification", destination: "/admission/university-entrance/met-manipal/notification",       permanent: true },
  { source: "/university-exam/deemed-university/manipal-entrance/:path+",       destination: "/admission/university-entrance/met-manipal",                     permanent: true },
  { source: "/university-exam/deemed-university/srm-entrance/notification",   destination: "/admission/engineering/srmjeee/notification",   permanent: true },
  { source: "/university-exam/deemed-university/srm-entrance/:path+",         destination: "/admission/engineering/srmjeee",                 permanent: true },
  { source: "/university-exam/central-university/amu-admission",   destination: "/admission/university-entrance/amu-entrance",   permanent: true },
  { source: "/university-exam/central-university/jamia-admission", destination: "/admission/university-entrance/jmi-entrance",    permanent: true },
  { source: "/university-exam/central-university/du-admission",    destination: "/admission/university-entrance/du-admission",    permanent: true },
  { source: "/university-exam/central-university/jnu-admission",   destination: "/admission/university-entrance/jnu-admission",   permanent: true },
  { source: "/university-exam/central-university/bhu-uet",         destination: "/admission/university-entrance/bhu-uet",         permanent: true },

  // ── Entrance-exam → Admission (public root rename) ───────────────────────
  // The DB pillar value stays "entrance-exam"; only the public URL segment is
  // /admission now. These SPECIFIC rewrites (old bad category slugs, old
  // year-suffixed slugs) MUST come BEFORE the catch-all below, and each points
  // at the FINAL /admission URL so no redirect chains into another redirect.
  // permanent: true → HTTP 308 (search engines treat as permanent).
  { source: "/entrance-exam/science-pg/:slug",       destination: "/admission/engineering/:slug",          permanent: true },
  { source: "/entrance-exam/mba/:slug",              destination: "/admission/management/:slug",           permanent: true },
  { source: "/entrance-exam/liberal-arts/:slug",     destination: "/admission/university-entrance/:slug",  permanent: true },
  { source: "/entrance-exam/hotel-management/:slug", destination: "/admission/university-entrance/:slug",  permanent: true },
  { source: "/entrance-exam/media/:slug",            destination: "/admission/university-entrance/:slug",  permanent: true },

  // Old year-specific slugs → canonical year-agnostic /admission URLs
  { source: "/entrance-exam/:category/mba-cat-2026",         destination: "/admission/management/cat",           permanent: true },
  { source: "/entrance-exam/:category/cat-2026",             destination: "/admission/management/cat",           permanent: true },
  { source: "/entrance-exam/:category/cat%202026",           destination: "/admission/management/cat",           permanent: true },
  { source: "/entrance-exam/:category/:slug-2026",           destination: "/admission/:category/:slug",          permanent: false },
  { source: "/entrance-exam/:category/:slug-2025",           destination: "/admission/:category/:slug",          permanent: false },

  // Also handle the year-suffix cleanup on the NEW /admission root (records live
  // here now, so an /admission/...-2026 URL must normalise too).
  { source: "/admission/:category/mba-cat-2026",             destination: "/admission/management/cat",           permanent: true },
  { source: "/admission/:category/cat-2026",                 destination: "/admission/management/cat",           permanent: true },
  { source: "/admission/:category/cat%202026",               destination: "/admission/management/cat",           permanent: true },
  { source: "/admission/:category/:slug-2026",               destination: "/admission/:category/:slug",          permanent: false },
  { source: "/admission/:category/:slug-2025",               destination: "/admission/:category/:slug",          permanent: false },

  // CATCH-ALL (must be LAST of the entrance-exam group): every remaining depth
  // — landing, category, detail, content-type, year/archived — 308s to /admission.
  { source: "/entrance-exam",                destination: "/admission",           permanent: true },
  { source: "/entrance-exam/:path*",         destination: "/admission/:path*",    permanent: true },
];

/**
 * The complete, ordered list next.config.ts hands to Next. The apex rules carry a `has`
 * host matcher, so they fire only on the bare domain and never on a canonical-host URL.
 */
export function allRedirectRules(): (PathRedirectRule | ApexRedirectRule)[] {
  return [...apexHostRedirects(), ...RETIRE_AS_RULES, ...PATH_REDIRECT_RULES];
}

/**
 * Sources that can fire on a request to the CANONICAL host — i.e. every path rule, and not
 * the host-conditional apex rule (which would otherwise match all of "/" and every page and
 * make the guard useless).
 */
export function pathRedirectSources(): string[] {
  return [...RETIRE_AS_RULES, ...PATH_REDIRECT_RULES].map((r) => r.source);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Compile ONE Next `redirects()` source into an anchored path matcher.
 *
 * Next matches sources with path-to-regexp: a `:name` segment is one path segment, `*`
 * means zero-or-more and `+` one-or-more, a trailing slash is optional, and anything that
 * is not a parameter is literal. Note `:slug-2026` is the parameter `slug` followed by the
 * literal `-2026` (a hyphen is not part of a parameter name), which is exactly what the
 * year-suffix rules intend. Kept deliberately small: it only has to be right for the rules
 * in this file, and config/redirects.test.ts pins each construct that appears here.
 */
function compileSource(source: string): RegExp | null {
  const segs = source.split("/");
  if (segs[0] !== "") return null; // not an absolute path source
  let re = "^";
  for (let i = 1; i < segs.length; i++) {
    const seg = segs[i];
    const m = seg.startsWith(":") ? /^:([A-Za-z0-9_$]+)([*+]?)(.*)$/.exec(seg) : null;
    if (m) {
      const [, , mod, literal] = m;
      if (mod === "*") re += "(?:/[^/]+)*";
      else if (mod === "+") re += "(?:/[^/]+)+";
      else re += "/[^/]+";
      re += escapeRe(literal);
    } else {
      re += "/" + escapeRe(seg);
    }
  }
  return new RegExp(re + "/?$");
}

const COMPILED = new Map<string, RegExp | null>();
const matcher = (source: string): RegExp | null => {
  if (!COMPILED.has(source)) COMPILED.set(source, compileSource(source));
  return COMPILED.get(source) ?? null;
};

/**
 * True when the router would answer this PATH with a redirect instead of a page — the K3
 * rule "never submit a URL that is a redirect source". Compared both encoded and decoded,
 * because a source may carry `%20` while the sitemap builds a literal space (or the reverse).
 */
export function pathIsRedirectSource(pathnameOrUrl: string): boolean {
  const raw = pathnameOrUrl.startsWith("/")
    ? pathnameOrUrl
    : (() => { try { return new URL(pathnameOrUrl).pathname; } catch { return pathnameOrUrl; } })();
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { /* keep the raw form */ }
  return pathRedirectSources().some((source) => {
    const m = matcher(source);
    if (!m) return false;
    return m.test(raw) || m.test(decoded);
  });
}
