/**
 * apexRedirect.ts — bare-domain (apex) → www permanent redirect, as DATA.
 *
 * Search Console has two properties (indianexaminfo.com + www.indianexaminfo.com);
 * two hosts serving the same pages split every signal, so the apex must hand over
 * to the canonical www origin in ONE hop for every path — including /sitemap.xml
 * and /robots.txt — while keeping the query string.
 *
 * Kept as data (not inline in next.config.ts) so a unit test can prove the
 * invariants without importing next.config (which runs git at load). next.config
 * spreads apexHostRedirects() FIRST, so a host rule never collides with a path
 * rule and there is no chain/loop: after the jump the request host is www, which
 * isBareDomainHost() rejects, so the rule does not fire again.
 *
 * Only the exact apex host is redirected. `www.`, `localhost`/`localhost:port`
 * and any preview/subdomain host fall through untouched (permanent 308 to www
 * only from the bare domain).
 */
export const APEX_HOST = "indianexaminfo.com";
export const WWW_ORIGIN = "https://www.indianexaminfo.com";

/** A Next.js `redirects()` rule with a host matcher (`has: [{ type: "host" }]`). */
export interface ApexRedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  has: { type: "host"; value: string }[];
}

/** True ONLY for the bare domain. Port-bearing or sub/preview hosts are false. */
export function isBareDomainHost(host: string): boolean {
  return host === APEX_HOST;
}

/**
 * The config shape next.config spreads at the top of redirects(). `:path*`
 * covers every path (and the bare `/`); a `permanent: true` host rule is emitted
 * as HTTP 308 by Next. Next appends the original query string automatically
 * because the destination carries none, so it is preserved.
 */
export function apexHostRedirects(): ApexRedirectRule[] {
  return [
    {
      source: "/:path*",
      destination: `${WWW_ORIGIN}/:path*`,
      permanent: true,
      has: [{ type: "host", value: APEX_HOST }],
    },
  ];
}
