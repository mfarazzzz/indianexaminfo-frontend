import type { NextConfig } from "next";
import { execSync } from "child_process";
import { allRedirectRules } from "./config/redirects";

/**
 * Build-time git stamp — baked in at build so "which commit is deployed?" is
 * answerable from view-source (a <meta name="build"> in the root layout), with
 * no runtime git dependency. Degrades to "unknown" if git is unavailable.
 * `sync` reports the relationship to origin/main at build:
 * clean | ahead | behind | dirty | unknown.
 */
function gitStamp() {
  const run = (cmd: string) => {
    try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); }
    catch { return ""; }
  };
  const sha = run("git rev-parse --short HEAD") || "unknown";
  const time = new Date().toISOString();
  let sync = "unknown";
  const head = run("git rev-parse HEAD");
  const dirty = run("git status --porcelain");
  const origin = run("git rev-parse origin/main");
  if (head && origin) {
    if (dirty) sync = "dirty";
    else if (head === origin) sync = "clean";
    else sync = run(`git merge-base --is-ancestor ${origin} ${head} && echo yes`) === "yes" ? "ahead" : "behind";
  } else if (head && dirty) {
    sync = "dirty";
  }
  // On a dirty build, name the offending files in the build log so Hostinger's
  // log shows what dirtied the tree (the <meta name="build"> only says "dirty").
  if (sync === "dirty" && dirty) {
    const files = dirty.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    console.log(`[build-stamp] working tree DIRTY — ${files.length} uncommitted file(s) (git status --porcelain):`);
    for (const f of files) console.log("  " + f);
  }
  return { sha, time, sync };
}

const BUILD = gitStamp();

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://partner.googleadservices.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://*.supabase.co https://images.unsplash.com",
  "connect-src 'self' https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com",
  "frame-src https://www.googletagmanager.com https://td.doubleclick.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Lint is a report, not a gate. `next lint` (CI) still surfaces findings, but
  // a lint error must never block a production deploy — a build on the deploy
  // box failing on lint would silently keep the old site live. Type checking
  // during the build is intentionally left ON; only ESLint is ignored here.
  eslint: { ignoreDuringBuilds: true },

  // Build stamp — exposed to the client bundle so the root layout can emit a
  // <meta name="build"> tag (invisible to readers, visible in view-source).
  env: {
    NEXT_PUBLIC_BUILD_SHA: BUILD.sha,
    NEXT_PUBLIC_BUILD_TIME: BUILD.time,
    NEXT_PUBLIC_BUILD_SYNC: BUILD.sync,
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  compress: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "X-Frame-Options",           value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy",   value: CSP },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      // Aggressive caching for static JS/CSS (hashed filenames = immutable)
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache images and fonts
      {
        source: "/images/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },

  async redirects() {
    // K3 (owner batch 4): every rule moved VERBATIM to config/redirects.ts, in this same
    // order, so that next.config and the sitemap's "never submit a URL that is a redirect
    // source" guard read ONE list instead of two that can drift.
    //
    // Order is part of the contract (Next takes the first match): the apex host rule comes
    // first (config/apexRedirect.ts, invariants in config/apexRedirect.test.ts), then the
    // retire list (config/retireRedirects.ts, invariants in config/retireRedirects.test.ts),
    // then the pillar rules with their catch-alls last inside each group.
    //
    // Old sarkari-naukri category-only URLs are handled in [category]/page.tsx with internal
    // redirects; /sarkari-naukri/[category]/[slug] is a valid route (exam entity detail page).
    return allRedirectRules();
  },

  experimental: {
    optimizePackageImports: ["@radix-ui", "lucide-react", "date-fns"],
    // Cap build parallelism so static generation stops firing a flood of
    // simultaneous Supabase reads (the stampede behind the Cloudflare 522/525
    // build failures). Both keys verified present in the installed Next 15.3.3
    // ExperimentalConfig (config-shared.d.ts): `cpus` limits worker count,
    // `staticGenerationMaxConcurrency` is "pages to export per worker".
    cpus: 2,
    staticGenerationMaxConcurrency: 4,
  },

  // Turbopack for faster dev builds (Next.js 15)
  // turbopack: {},
};

export default nextConfig;

