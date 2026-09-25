import type { NextConfig } from "next";
import { execSync } from "child_process";

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
    return [
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

      // Deleted MJPRU stub → the real MJPRU record. The stub row (slug `mjpru`
      // in the stray `university-exams` category) was removed from the DB
      // (migration 022); its indexed URL 301s here so it never 404s. The real
      // record is mjpru-exam under state-university.
      { source: "/university-exam/university-exams/mjpru", destination: "/university-exam/state-university/mjpru-exam", permanent: true },
      { source: "/university-exam/mjpru",                  destination: "/university-exam/state-university/mjpru-exam", permanent: true },
      
      // Fix old hardcoded nav links that pointed to non-existent category slugs
      { source: "/entrance-exam/science-pg/:slug",       destination: "/entrance-exam/engineering/:slug",          permanent: true },
      { source: "/entrance-exam/mba/:slug",              destination: "/entrance-exam/management/:slug",           permanent: true },
      { source: "/entrance-exam/liberal-arts/:slug",     destination: "/entrance-exam/university-entrance/:slug",  permanent: true },
      { source: "/entrance-exam/hotel-management/:slug", destination: "/entrance-exam/university-entrance/:slug",  permanent: true },
      { source: "/entrance-exam/media/:slug",            destination: "/entrance-exam/university-entrance/:slug",  permanent: true },

      // Redirect old year-specific slugs to canonical year-agnostic URLs
      { source: "/entrance-exam/:category/mba-cat-2026",         destination: "/entrance-exam/management/cat",           permanent: true },
      { source: "/entrance-exam/:category/cat-2026",             destination: "/entrance-exam/management/cat",           permanent: true },
      { source: "/entrance-exam/:category/cat%202026",           destination: "/entrance-exam/management/cat",           permanent: true },
      { source: "/entrance-exam/:category/:slug-2026",           destination: "/entrance-exam/:category/:slug",          permanent: false },
      { source: "/entrance-exam/:category/:slug-2025",           destination: "/entrance-exam/:category/:slug",          permanent: false },
      
      // Old sarkari-naukri category-only URLs are now handled in [category]/page.tsx with internal redirects.
      
      // Note: /sarkari-naukri/[category]/[slug] is now a valid route (exam entity detail page).
      // Old category-only redirects that have no slug are handled in [category]/page.tsx.
    ];
  },

  experimental: {
    optimizePackageImports: ["@radix-ui", "lucide-react", "date-fns"],
  },

  // Turbopack for faster dev builds (Next.js 15)
  // turbopack: {},
};

export default nextConfig;
