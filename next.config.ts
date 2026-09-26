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
