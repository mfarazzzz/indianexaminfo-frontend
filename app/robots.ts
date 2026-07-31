import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const BASE = siteConfig.url;

/**
 * Paths blocked for all crawlers.
 *
 * Note: /api/ is NOT blanket-disallowed. The RSS/Atom feeds are advertised in
 * the root layout's <link rel="alternate">, and the sitemap must stay
 * fetchable. Only the non-indexable API surface is blocked.
 */
const SHARED_DISALLOW = ["/api/revalidate", "/api/og", "/api/search", "/search"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // General crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      // Google News — editorial + exam content.
      // Policy pages stay crawlable: Google News surfaces use About / Contact
      // for publisher transparency (E-E-A-T), so blocking them hurt us.
      {
        userAgent: "Googlebot-News",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      // AdsBot needs to render landing pages to score them. It ignores the
      // wildcard group entirely, so it is listed explicitly with the same
      // disallow set rather than a blanket allow.
      {
        userAgent: "AdsBot-Google",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      {
        userAgent: "AdsBot-Google-Mobile",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      // AI crawlers — explicitly allowed for Generative Engine Optimization (GEO).
      // These power ChatGPT, Perplexity, Claude, and Google AI Overviews.
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: SHARED_DISALLOW,
      },
    ],
    sitemap: [`${BASE}/sitemap.xml`, `${BASE}/news-sitemap.xml`],
    host: BASE,
  };
}
